'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  origin: { lat: number; lng: number; address: string } | null;
  dest: { lat: number; lng: number; address: string } | null;
  driverPos: { lat: number; lng: number } | null;
  centerTrigger?: number;
  nearbyDrivers?: Array<{ id: string; lat: number; lng: number }>;
  isSelectingLocation?: 'origin' | 'dest' | null;
  onMapCenterChange?: (coords: { lat: number; lng: number }) => void;
  tripStatus?: string | null;
  stops?: { lat: number; lng: number; address: string }[];
}

const getDistanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const dy = (lat2 - lat1) * 111139;
  const dx = (lng2 - lng1) * 111139 * Math.cos((lat1 * Math.PI) / 180);
  return Math.sqrt(dx * dx + dy * dy);
};

export default function PassengerMap({
  origin,
  dest,
  driverPos,
  centerTrigger = 0,
  nearbyDrivers = [],
  isSelectingLocation = null,
  onMapCenterChange,
  tripStatus = null,
  stops = []
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Referencias persistentes para evitar recreación destructiva y parpadeos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const originMarkerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const destMarkerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const driverMarkerRef = useRef<any>(null);
  const stopsMarkersRef = useRef<any[]>([]);
  const routeLineRef = useRef<any>(null);
  const currentRouteEndpoints = useRef<string>('');
  const hasFittedBounds = useRef<string>('');
  const currentAngleRef = useRef<number>(0);
  const nearbyMarkersRef = useRef<Map<string, any>>(new Map());
  const nearbyAnglesRef = useRef<Map<string, number>>(new Map());
  const animationFramesRef = useRef<Map<string, number>>(new Map());
  const lastUpdateTimestampsRef = useRef<Map<string, number>>(new Map());

  // Inicializar el mapa una sola vez
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    import('leaflet').then((mod) => {
      if (mapRef.current || !containerRef.current) return;

      const L = (mod as any).default || (mod as any);
      LRef.current = L;
      console.log('Fim: Leaflet Passenger loaded');

      const map = L.map(containerRef.current, {
        center: origin ? [origin.lat, origin.lng] : [-33.4489, -70.6693],
        zoom: 18,
        zoomControl: false,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 20,
        subdomains: 'abcd',
      }).addTo(map);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        subdomains: 'abcd',
        className: 'map-labels-layer',
      }).addTo(map);

      setTimeout(() => map.invalidateSize(true), 200);

      mapRef.current = map;
      setMapLoaded(true);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      nearbyMarkersRef.current.clear();
      nearbyAnglesRef.current.clear();
      stopsMarkersRef.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Centrar el mapa a petición
  useEffect(() => {
    if (mapLoaded && mapRef.current && centerTrigger > 0 && origin) {
      mapRef.current.setView([origin.lat, origin.lng], 18, { animate: true, duration: 1 });
    }
  }, [centerTrigger, origin, mapLoaded]);

  // Actualizar marcadores de manera incremental y animada
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !LRef.current) return;

    const L = LRef.current;
    const map = mapRef.current;

    // Helper to generate custom divIcon with correct rotation
    const getDriverIcon = (angle: number) => {
      return L.divIcon({
        className: 'transparent-icon',
        html: `
          <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center">
            <div style="position:absolute;inset:-6px;background:rgba(0,229,160,0.18);border-radius:50%;animation:ping 2s ease-out infinite"></div>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 8px rgba(0,229,160,0.6));position:relative;z-index:2;display:block;transform:rotate(${angle}deg);transition:transform 0.3s ease">
              <defs>
                <linearGradient id="ledGlowLeft" x1="8.5" y1="4.5" x2="3" y2="-1" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#00E5A0" stop-opacity="0.8" />
                  <stop offset="100%" stop-color="#00E5A0" stop-opacity="0" />
                </linearGradient>
                <linearGradient id="ledGlowRight" x1="15.5" y1="4.5" x2="21" y2="-1" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#00E5A0" stop-opacity="0.8" />
                  <stop offset="100%" stop-color="#00E5A0" stop-opacity="0" />
                </linearGradient>
              </defs>
              <style>
                @keyframes ledPulse {
                  0% { opacity: 0.15; }
                  50% { opacity: 1; }
                  100% { opacity: 0.15; }
                }
              </style>
              <polygon points="8.5,4.5 2,-2 8,-3" fill="url(#ledGlowLeft)" style="animation: ledPulse 1.2s infinite ease-in-out; mix-blend-mode: screen;" />
              <polygon points="15.5,4.5 16,-3 22,-2" fill="url(#ledGlowRight)" style="animation: ledPulse 1.2s infinite ease-in-out; mix-blend-mode: screen;" />
              <rect x="5" y="19" width="14" height="2" rx="1" fill="#00E5A0" />
              <path d="M9 3C7.5 3 6.5 4.5 6.5 6V18C6.5 19.5 7.5 20.5 9 20.5H15C16.5 20.5 17.5 19.5 17.5 18V6C17.5 4.5 16.5 3 15 3H9Z" fill="#131320" stroke="#00E5A0" stroke-width="2" />
              <path d="M8 8C8 6.5 9.5 6 12 6C14.5 6 16 6.5 16 8H8Z" fill="#00E5A0" fill-opacity="0.8" />
              <rect x="4.5" y="7" width="2" height="3" rx="1" fill="#00E5A0" />
              <rect x="17.5" y="7" width="2" height="3" rx="1" fill="#00E5A0" />
              <circle cx="8.5" cy="4.5" r="1.2" fill="#FFFFFF" style="animation: ledPulse 1.2s infinite ease-in-out; filter: drop-shadow(0 0 3px #FFFFFF);" />
              <circle cx="15.5" cy="4.5" r="1.2" fill="#FFFFFF" style="animation: ledPulse 1.2s infinite ease-in-out; filter: drop-shadow(0 0 3px #FFFFFF);" />
            </svg>
          </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    };

    // ── Interpolación para movimiento fluido dinámico ──────────────────
    const animateMarker = (marker: any, targetPos: { lat: number; lng: number }, driverId: string = 'main') => {
      const prevFrame = animationFramesRef.current.get(driverId);
      if (prevFrame) {
        cancelAnimationFrame(prevFrame);
      }
      
      const now = performance.now();
      let dt = now - (lastUpdateTimestampsRef.current.get(driverId) || now);
      lastUpdateTimestampsRef.current.set(driverId, now);
      
      if (dt < 500 || dt > 10000) dt = 2000;
      
      const startPos = marker.getLatLng();
      const dLng = targetPos.lng - startPos.lng;
      const dLat = targetPos.lat - startPos.lat;
      
      let angle = driverId === 'main' ? currentAngleRef.current : (nearbyAnglesRef.current.get(driverId) || 0);
      const hasMovement = Math.abs(dLng) > 1e-6 || Math.abs(dLat) > 1e-6;
      if (hasMovement) {
        angle = Math.atan2(dLng, dLat) * (180 / Math.PI);
      }

      const startTime = performance.now();
      
      const step = (timestamp: number) => {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / dt, 1.5);
        const easeProgress = progress <= 1.0 ? progress * (2 - progress) : progress; 
        
        const currentLat = startPos.lat + dLat * easeProgress;
        const currentLng = startPos.lng + dLng * easeProgress;
        
        marker.setLatLng([currentLat, currentLng]);

        if (hasMovement) {
          const element = marker.getElement();
          if (element) {
            const svg = element.querySelector('svg');
            if (svg) {
              svg.style.transform = `rotate(${angle}deg)`;
              svg.style.transition = 'transform 0.3s ease';
            }
          }
        }

        if (progress < 1.5) {
          animationFramesRef.current.set(driverId, requestAnimationFrame(step));
        } else if (hasMovement) {
          if (driverId === 'main') {
            currentAngleRef.current = angle;
          } else {
            nearbyAnglesRef.current.set(driverId, angle);
          }
          marker.setIcon(getDriverIcon(angle));
        }
      };
      
      animationFramesRef.current.set(driverId, requestAnimationFrame(step));
    };

    // ── 1. Origen ──────────────────────────────────────────────────────────
    const isTripActive = ['driver_assigned', 'driver_arrived', 'in_progress'].includes(tripStatus || '');
    const showOrigin = origin && isSelectingLocation !== 'origin' && (!isTripActive || tripStatus === 'driver_assigned' || tripStatus === 'driver_arrived');

    if (showOrigin && origin) {
      if (!originMarkerRef.current) {
        const originIcon = L.divIcon({
          className: 'transparent-icon',
          html: `
            <div style="position:relative;width:24px;height:24px">
              <div style="position:absolute;inset:0;background:#00E5A0;border-radius:50%;opacity:0.4;animation:ping 1.5s ease-out infinite"></div>
              <div style="position:absolute;inset:4px;background:#00E5A0;border-radius:50%;border:2px solid white;box-shadow:0 0 10px #00E5A0"></div>
            </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        originMarkerRef.current = L.marker([origin.lat, origin.lng], { icon: originIcon }).addTo(map);
        originMarkerRef.current.bindTooltip('📍 Tu ubicación', { permanent: false, direction: 'top', className: 'fim-tooltip' });
      } else {
        originMarkerRef.current.setLatLng([origin.lat, origin.lng]);
      }
    } else if (originMarkerRef.current) {
      originMarkerRef.current.remove();
      originMarkerRef.current = null;
    }

    // ── 2. Destino ─────────────────────────────────────────────────────────
    const showDest = dest && isSelectingLocation !== 'dest' && (!isTripActive || tripStatus === 'in_progress');

    if (showDest && dest) {
      if (!destMarkerRef.current) {
        const destIcon = L.divIcon({
          className: 'transparent-icon',
          html: `
            <div style="display:flex;flex-direction:column;align-items:center">
              <div style="background:#FF4560;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(255,69,96,0.6)"></div>
              <div style="width:2px;height:10px;background:#FF4560;margin-top:1px"></div>
              <div style="width:8px;height:4px;background:#FF456080;border-radius:0 0 50% 50%"></div>
            </div>`,
          iconSize: [20, 30],
          iconAnchor: [10, 30],
        });
        destMarkerRef.current = L.marker([dest.lat, dest.lng], { icon: destIcon }).addTo(map);
        destMarkerRef.current.bindTooltip(`🏁 ${dest.address}`, { permanent: false, direction: 'top', className: 'fim-tooltip' });
      } else {
        destMarkerRef.current.setLatLng([dest.lat, dest.lng]);
      }
    } else if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }

    // ── 2.5 Paradas ────────────────────────────────────────────────────────
    const showStops = stops && stops.length > 0 && (!isTripActive || tripStatus === 'in_progress');
    
    if (showStops) {
      stops.forEach((stop, idx) => {
        if (!stopsMarkersRef.current[idx]) {
           const stopIcon = L.divIcon({
              className: 'transparent-icon',
              html: `<div style="background:#FFA500;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 5px rgba(255,165,0,0.6)"></div>`,
              iconSize: [14, 14],
              iconAnchor: [7, 7]
           });
           const m = L.marker([stop.lat, stop.lng], { icon: stopIcon }).addTo(map);
           m.bindTooltip(`Parada ${idx+1}`, { permanent: false, direction: 'top', className: 'fim-tooltip' });
           stopsMarkersRef.current[idx] = m;
        } else {
           stopsMarkersRef.current[idx].setLatLng([stop.lat, stop.lng]);
        }
      });
      while (stopsMarkersRef.current.length > stops.length) {
         const m = stopsMarkersRef.current.pop();
         if (m) m.remove();
      }
    } else {
      while (stopsMarkersRef.current.length > 0) {
         const m = stopsMarkersRef.current.pop();
         if (m) m.remove();
      }
    }

    // ── 3. Ruta OSRM ───────────────────────────────────────────────────────
    const activeRouteTarget = isTripActive
      ? ((tripStatus === 'driver_assigned' || tripStatus === 'driver_arrived') ? origin : dest)
      : null;

    if (isTripActive && driverPos && activeRouteTarget) {
      const latRounded = Math.round(driverPos.lat * 1000) / 1000;
      const lngRounded = Math.round(driverPos.lng * 1000) / 1000;
      const endpointsKey = `${latRounded},${lngRounded}->${activeRouteTarget.lat},${activeRouteTarget.lng}`;
      const targetPhase = tripStatus || '';

      if (currentRouteEndpoints.current !== endpointsKey) {
        currentRouteEndpoints.current = endpointsKey;

        if (routeLineRef.current) {
          routeLineRef.current.remove();
          routeLineRef.current = null;
        }

        const fetchRoute = async () => {
          const isGoingToPassenger = (tripStatus === 'driver_assigned' || tripStatus === 'driver_arrived');
          const points = [{ lat: driverPos.lat, lng: driverPos.lng }];
          if (stops && stops.length > 0 && activeRouteTarget === dest) {
            points.push(...stops);
          }
          points.push({ lat: activeRouteTarget.lat, lng: activeRouteTarget.lng });

          try {
            const promises = [];
            for (let i = 0; i < points.length - 1; i++) {
              const wp = `${points[i].lng},${points[i].lat};${points[i+1].lng},${points[i+1].lat}`;
              promises.push(fetch(`https://router.project-osrm.org/route/v1/driving/${wp}?overview=full&geometries=geojson`).then(res => res.json()));
            }
            const results = await Promise.all(promises);
            
            if (!mapRef.current) return;
            if (routeLineRef.current) { routeLineRef.current.remove(); }

            const routeGroup = L.featureGroup().addTo(map);
            routeLineRef.current = routeGroup;
            let hasRoute = false;

            results.forEach((data, idx) => {
              if (data.routes && data.routes[0]) {
                hasRoute = true;
                const isLast = idx === results.length - 1;
                let color = isGoingToPassenger ? '#00E5A0' : (isLast ? '#FF4560' : '#FFA500');
                const line = L.geoJSON(data.routes[0].geometry, {
                  style: { className: 'animated-route-line', color: color, weight: 5, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }
                }).addTo(routeGroup);
                
                setTimeout(() => {
                  line.eachLayer((layer: any) => {
                    if (layer._path && layer._path.getTotalLength) {
                      const length = layer._path.getTotalLength();
                      layer._path.style.strokeDasharray = length;
                      layer._path.style.strokeDashoffset = length;
                      layer._path.getBoundingClientRect();
                      layer._path.style.transition = 'stroke-dashoffset 1.8s ease-out';
                      layer._path.style.strokeDashoffset = '0';
                    }
                  });
                }, 50);
              }
            });
            if (!hasRoute) throw new Error('Sin ruta');
          } catch (e) {
            if (!mapRef.current) return;
            if (routeLineRef.current) { routeLineRef.current.remove(); }
            const routeGroup = L.featureGroup().addTo(map);
            routeLineRef.current = routeGroup;
            for (let i = 0; i < points.length - 1; i++) {
              const isLast = i === points.length - 1;
              let color = isGoingToPassenger ? '#00E5A0' : (isLast ? '#FF4560' : '#FFA500');
              L.polyline([[points[i].lat, points[i].lng], [points[i+1].lat, points[i+1].lng]], { color: color, weight: 4, opacity: 0.85, dashArray: '10 6', lineCap: 'round' }).addTo(routeGroup);
            }
          }

          // Ajustar vista del mapa una sola vez por fase
          if (hasFittedBounds.current !== targetPhase) {
            hasFittedBounds.current = targetPhase;
            const bounds = L.latLngBounds([[driverPos.lat, driverPos.lng], [activeRouteTarget.lat, activeRouteTarget.lng]]);
            map.fitBounds(bounds, { padding: [100, 100], maxZoom: 15 });
          }
        };
        fetchRoute();
      }

      // Si la ruta ya se ajustó inicialmente, auto-desplazar de forma fluida para mantener el coche centrado
      if (hasFittedBounds.current === targetPhase) {
        map.panTo([driverPos.lat - 0.0004, driverPos.lng], { animate: true, duration: 1.2 });
      }

    } else if (!isTripActive && origin && dest) {
      const endpointsKey = `${origin.lat},${origin.lng}->${dest.lat},${dest.lng}`;
      if (currentRouteEndpoints.current !== endpointsKey) {
        currentRouteEndpoints.current = endpointsKey;
        hasFittedBounds.current = '';
        
        if (routeLineRef.current) {
          routeLineRef.current.remove();
          routeLineRef.current = null;
        }

        const fetchRoute = async () => {
          const points = [{ lat: origin.lat, lng: origin.lng }];
          if (stops && stops.length > 0) {
            points.push(...stops);
          }
          points.push({ lat: dest.lat, lng: dest.lng });

          try {
            const promises = [];
            for (let i = 0; i < points.length - 1; i++) {
              const wp = `${points[i].lng},${points[i].lat};${points[i+1].lng},${points[i+1].lat}`;
              promises.push(fetch(`https://router.project-osrm.org/route/v1/driving/${wp}?overview=full&geometries=geojson`).then(res => res.json()));
            }
            const results = await Promise.all(promises);
            
            if (!mapRef.current) return;
            if (routeLineRef.current) { routeLineRef.current.remove(); }

            const routeGroup = L.featureGroup().addTo(map);
            routeLineRef.current = routeGroup;
            let hasRoute = false;

            results.forEach((data, idx) => {
              if (data.routes && data.routes[0]) {
                hasRoute = true;
                const isLast = idx === results.length - 1;
                let color = isLast ? '#00E5A0' : '#FFA500'; // Naranjo para paradas, verde para destino final
                const line = L.geoJSON(data.routes[0].geometry, {
                  style: { className: 'animated-route-line', color: color, weight: 5, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }
                }).addTo(routeGroup);
                
                setTimeout(() => {
                  line.eachLayer((layer: any) => {
                    if (layer._path && layer._path.getTotalLength) {
                      const length = layer._path.getTotalLength();
                      layer._path.style.strokeDasharray = length;
                      layer._path.style.strokeDashoffset = length;
                      layer._path.getBoundingClientRect();
                      layer._path.style.transition = 'stroke-dashoffset 1.8s ease-out';
                      layer._path.style.strokeDashoffset = '0';
                    }
                  });
                }, 50);
              }
            });
            if (!hasRoute) throw new Error('Sin ruta');
          } catch (e) {
            if (!mapRef.current) return;
            if (routeLineRef.current) { routeLineRef.current.remove(); }
            const routeGroup = L.featureGroup().addTo(map);
            routeLineRef.current = routeGroup;
            for (let i = 0; i < points.length - 1; i++) {
              const isLast = i === points.length - 1;
              let color = isLast ? '#00E5A0' : '#FFA500';
              L.polyline([[points[i].lat, points[i].lng], [points[i+1].lat, points[i+1].lng]], { color: color, weight: 4, opacity: 0.85, dashArray: '10 6', lineCap: 'round' }).addTo(routeGroup);
            }
          }

          // Ajustar vista del mapa
          const bounds = L.latLngBounds([[origin.lat, origin.lng], [dest.lat, dest.lng]]);
          map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15 });
        };
        fetchRoute();
      }
    } else {
      currentRouteEndpoints.current = '';
      hasFittedBounds.current = '';
      if (routeLineRef.current) {
        routeLineRef.current.remove();
        routeLineRef.current = null;
      }
    }

    // ── 4. Conductor en Movimiento (Con interpolación suave) ───────────────
    if (driverPos) {
      if (!driverMarkerRef.current) {
        const driverIcon = getDriverIcon(currentAngleRef.current);
        driverMarkerRef.current = L.marker([driverPos.lat, driverPos.lng], { icon: driverIcon }).addTo(map);
        driverMarkerRef.current.bindTooltip('Tu conductor', { permanent: false, direction: 'top', className: 'fim-tooltip' });
        lastUpdateTimestampsRef.current.set('main', performance.now());
      } else {
        // Si ya existe, animar suavemente a la nueva ubicación
        const prevPos = driverMarkerRef.current.getLatLng();
        if (prevPos.lat !== driverPos.lat || prevPos.lng !== driverPos.lng) {
          animateMarker(driverMarkerRef.current, driverPos, 'main');
        }
      }
    } else if (driverMarkerRef.current) {
      driverMarkerRef.current.remove();
      driverMarkerRef.current = null;
    }

    // ── 5. Conductores Cercanos (Búsqueda inactiva) ───────────────────────
    const currentNearbyIds = new Set(nearbyDrivers.map(d => d.id));

    // Eliminar conductores que ya no están online o ya no están en la lista
    for (const [id, marker] of Array.from(nearbyMarkersRef.current.entries())) {
      if (!currentNearbyIds.has(id)) {
        marker.remove();
        nearbyMarkersRef.current.delete(id);
        nearbyAnglesRef.current.delete(id);
      }
    }

    // Agregar o actualizar marcadores para conductores en la lista
    nearbyDrivers.forEach((driver) => {
      const prevMarker = nearbyMarkersRef.current.get(driver.id);
      if (!prevMarker) {
        const driverAngle = nearbyAnglesRef.current.get(driver.id) || 0;
        const driverIcon = getDriverIcon(driverAngle);
        const marker = L.marker([driver.lat, driver.lng], { icon: driverIcon }).addTo(map);
        marker.bindTooltip('Conductor disponible', { permanent: false, direction: 'top', className: 'fim-tooltip' });
        nearbyMarkersRef.current.set(driver.id, marker);
        lastUpdateTimestampsRef.current.set(driver.id, performance.now());
      } else {
        const prevPos = prevMarker.getLatLng();
        if (prevPos.lat !== driver.lat || prevPos.lng !== driver.lng) {
          animateMarker(prevMarker, { lat: driver.lat, lng: driver.lng }, driver.id);
        }
      }
    });

    map.invalidateSize(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, dest, driverPos, mapLoaded, nearbyDrivers, tripStatus]);

  // Escuchar el movimiento del mapa para reportar el centro en selección manual
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isSelectingLocation || !onMapCenterChange) return;

    const handleMoveEnd = () => {
      const center = map.getCenter();
      onMapCenterChange({ lat: center.lat, lng: center.lng });
    };

    map.on('moveend', handleMoveEnd);

    // Ejecutar una vez al inicio del modo selección para geocodificar la posición actual
    handleMoveEnd();

    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [isSelectingLocation, mapLoaded, onMapCenterChange]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          width: '100%',
          height: '100%',
        }}
      />
      {isSelectingLocation && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -100%)', // Centrar horizontalmente y alinear la base del pin al centro
          pointerEvents: 'none', // Permitir arrastrar el mapa por debajo
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {/* Un punto brillante en el centro exacto de la base */}
          <div style={{
            width: '8px',
            height: '8px',
            background: isSelectingLocation === 'origin' ? '#00E5A0' : '#FF4560',
            borderRadius: '50%',
            boxShadow: `0 0 8px ${isSelectingLocation === 'origin' ? '#00E5A0' : '#FF4560'}`,
            position: 'absolute',
            bottom: '-4px'
          }} />
          
          {/* El Pin flotante con animación de bote */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            animation: 'bouncePin 1.5s ease-in-out infinite alternate',
            transformOrigin: 'bottom center'
          }}>
            <style>{`
              @keyframes bouncePin {
                0% { transform: translateY(0); }
                100% { transform: translateY(-8px); }
              }
            `}</style>
            
            {/* El cuerpo del Pin */}
            <div style={{
              background: isSelectingLocation === 'origin' ? '#00E5A0' : '#FF4560',
              padding: '8px 14px',
              borderRadius: '20px',
              color: '#131320',
              fontSize: '0.8rem',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              border: '2px solid white',
              whiteSpace: 'nowrap',
              marginBottom: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {isSelectingLocation === 'origin' ? 'Origen' : 'Destino'}
            </div>
            
            {/* El puntero del Pin */}
            <div style={{
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: `10px solid ${isSelectingLocation === 'origin' ? '#00E5A0' : '#FF4560'}`,
              filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))'
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
