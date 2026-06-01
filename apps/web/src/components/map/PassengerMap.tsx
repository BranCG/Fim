'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  origin: { lat: number; lng: number; address: string } | null;
  dest: { lat: number; lng: number; address: string } | null;
  driverPos: { lat: number; lng: number } | null;
  centerTrigger?: number;
  nearbyDrivers?: Array<{ id: string; lat: number; lng: number }>;
}

export default function PassengerMap({ origin, dest, driverPos, centerTrigger = 0, nearbyDrivers = [] }: Props) {
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
  const routeLineRef = useRef<any>(null);
  const currentRouteEndpoints = useRef<string>('');
  const currentAngleRef = useRef<number>(0);
  const nearbyMarkersRef = useRef<Map<string, any>>(new Map());
  const nearbyAnglesRef = useRef<Map<string, number>>(new Map());

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

    // ── Interpolación para movimiento fluido ──────────────────
    const animateMarker = (marker: any, start: { lat: number; lng: number }, end: { lat: number; lng: number }, driverId?: string, duration = 1200) => {
      const startTime = performance.now();
      
      const dLng = end.lng - start.lng;
      const dLat = end.lat - start.lat;
      let angle = driverId ? (nearbyAnglesRef.current.get(driverId) || 0) : currentAngleRef.current;
      const hasMovement = Math.abs(dLng) > 1e-6 || Math.abs(dLat) > 1e-6;
      if (hasMovement) {
        angle = Math.atan2(dLng, dLat) * (180 / Math.PI);
      }

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing OutQuad
        const easeProgress = progress * (2 - progress); 
        const currentLat = start.lat + (end.lat - start.lat) * easeProgress;
        const currentLng = start.lng + (end.lng - start.lng) * easeProgress;
        
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

        if (progress < 1) {
          requestAnimationFrame(step);
        } else if (hasMovement) {
          if (driverId) {
            nearbyAnglesRef.current.set(driverId, angle);
          } else {
            currentAngleRef.current = angle;
          }
          marker.setIcon(getDriverIcon(angle));
        }
      };
      requestAnimationFrame(step);
    };

    // ── 1. Origen ──────────────────────────────────────────────────────────
    if (origin) {
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
    if (dest) {
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

    // ── 3. Ruta OSRM ───────────────────────────────────────────────────────
    if (origin && dest) {
      const endpointsKey = `${origin.lat},${origin.lng}->${dest.lat},${dest.lng}`;
      if (currentRouteEndpoints.current !== endpointsKey) {
        currentRouteEndpoints.current = endpointsKey;
        
        if (routeLineRef.current) {
          routeLineRef.current.remove();
          routeLineRef.current = null;
        }

        const fetchRoute = async () => {
          try {
            const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`);
            const data = await res.json();
            
            if (!mapRef.current) return;
            if (routeLineRef.current) { routeLineRef.current.remove(); }

            if (data.routes && data.routes[0]) {
              const routeLine = L.geoJSON(data.routes[0].geometry, {
                style: { color: '#00E5A0', weight: 5, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }
              }).addTo(map);
              routeLineRef.current = routeLine;
            } else {
              throw new Error('Sin ruta');
            }
          } catch (error) {
            if (!mapRef.current) return;
            const routeLine = L.polyline(
              [[origin.lat, origin.lng], [dest.lat, dest.lng]],
              { color: '#00E5A0', weight: 4, opacity: 0.85, dashArray: '10 6', lineCap: 'round' }
            ).addTo(map);
            routeLineRef.current = routeLine;
          }

          // Ajustar vista del mapa
          const bounds = L.latLngBounds([[origin.lat, origin.lng], [dest.lat, dest.lng]]);
          map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15 });
        };
        fetchRoute();
      }
    } else {
      currentRouteEndpoints.current = '';
      if (routeLineRef.current) {
        routeLineRef.current.remove();
        routeLineRef.current = null;
      }
      if (origin && !dest) {
        map.setView([origin.lat, origin.lng], 18);
      }
    }

    // ── 4. Conductor en Movimiento (Con interpolación suave) ───────────────
    if (driverPos) {
      if (!driverMarkerRef.current) {
        const driverIcon = getDriverIcon(currentAngleRef.current);
        driverMarkerRef.current = L.marker([driverPos.lat, driverPos.lng], { icon: driverIcon }).addTo(map);
        driverMarkerRef.current.bindTooltip('Tu conductor', { permanent: false, direction: 'top', className: 'fim-tooltip' });
      } else {
        // Si ya existe, animar suavemente a la nueva ubicación
        const prevPos = driverMarkerRef.current.getLatLng();
        if (prevPos.lat !== driverPos.lat || prevPos.lng !== driverPos.lng) {
          animateMarker(driverMarkerRef.current, prevPos, driverPos, undefined, 1200);
        }
      }
    } else if (driverMarkerRef.current) {
      driverMarkerRef.current.remove();
      driverMarkerRef.current = null;
    }

    // ── 5. Conductores Cercanos (Búsqueda inactiva) ───────────────────────
    const currentNearbyIds = new Set(nearbyDrivers.map(d => d.id));

    // Eliminar conductores que ya no están online o ya no están en la lista
    for (const [id, marker] of nearbyMarkersRef.current.entries()) {
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
      } else {
        const prevPos = prevMarker.getLatLng();
        if (prevPos.lat !== driver.lat || prevPos.lng !== driver.lng) {
          animateMarker(prevMarker, prevPos, { lat: driver.lat, lng: driver.lng }, driver.id, 1200);
        }
      }
    });

    map.invalidateSize(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, dest, driverPos, mapLoaded, nearbyDrivers]);

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
    </div>
  );
}
