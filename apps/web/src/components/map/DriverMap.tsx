'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  driverPos: { lat: number; lng: number };
  passengerPos: { lat: number; lng: number } | null;
  destPos: { lat: number; lng: number } | null;
  centerTrigger?: number;
}

export default function DriverMap({ driverPos, passengerPos, destPos, centerTrigger }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Referencias persistentes para evitar recreación destructiva y parpadeos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const driverMarkerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const passengerMarkerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const destMarkerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const routeLineRef = useRef<any>(null);
  const currentRouteEndpoints = useRef<string>('');
  const hasFittedBounds = useRef<string>('');
  const currentAngleRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimestampRef = useRef<number>(performance.now());

  // Inicializar el mapa una sola vez
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    import('leaflet').then((mod) => {
      if (mapRef.current || !containerRef.current) return;

      const L = (mod as any).default || (mod as any);
      LRef.current = L;
      console.log('Fim: Driver Leaflet loaded');

      // Compensación inicial de latitud para centrar el coche sobre el dashboard inferior
      const initialLat = driverPos.lat - 0.0006;

      const map = L.map(containerRef.current, {
        center: [initialLat, driverPos.lng],
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
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Actualizar marcadores cuando cambian posiciones de manera fluida y optimizada
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
    const animateMarker = (marker: any, targetPos: { lat: number; lng: number }) => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      const now = performance.now();
      let dt = now - lastUpdateTimestampRef.current;
      lastUpdateTimestampRef.current = now;
      
      // Limitar dt para evitar saltos locos si la app estuvo en background
      if (dt < 500 || dt > 10000) dt = 2000;
      
      const startPos = marker.getLatLng();
      const dLng = targetPos.lng - startPos.lng;
      const dLat = targetPos.lat - startPos.lat;
      
      let angle = currentAngleRef.current;
      const hasMovement = Math.abs(dLng) > 1e-6 || Math.abs(dLat) > 1e-6;
      if (hasMovement) {
        angle = Math.atan2(dLng, dLat) * (180 / Math.PI);
      }

      const startTime = performance.now();
      
      const step = (timestamp: number) => {
        const elapsed = timestamp - startTime;
        // Extrapolación suave hasta 1.5x el tiempo esperado (Dead Reckoning)
        const progress = Math.min(elapsed / dt, 1.5);
        
        // Suavizado OutQuad para la interpolación inicial, lineal para extrapolación
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
          animationFrameRef.current = requestAnimationFrame(step);
        } else if (hasMovement) {
          currentAngleRef.current = angle;
          marker.setIcon(getDriverIcon(angle));
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(step);
    };

    // ── 1. Marcador Conductor (Con interpolación suave dinámica) ───────────────
    if (!driverMarkerRef.current) {
      const driverIcon = getDriverIcon(currentAngleRef.current);
      driverMarkerRef.current = L.marker([driverPos.lat, driverPos.lng], { icon: driverIcon }).addTo(map);
      driverMarkerRef.current.bindTooltip('Tu posición', { permanent: false, direction: 'top', className: 'fim-tooltip' });
      lastUpdateTimestampRef.current = performance.now();
    } else {
      const prevPos = driverMarkerRef.current.getLatLng();
      if (prevPos.lat !== driverPos.lat || prevPos.lng !== driverPos.lng) {
        animateMarker(driverMarkerRef.current, driverPos);
      }
    }

    // ── 2. Marcador Pasajero ───────────────────────────────────────────────
    if (passengerPos) {
      if (!passengerMarkerRef.current) {
        const passengerIcon = L.divIcon({
          className: 'transparent-icon',
          html: `
            <div style="position:relative">
              <div style="position:absolute;inset:-4px;background:rgba(255,184,0,0.15);border-radius:50%;animation:ping 2s ease-out infinite"></div>
              <div style="width:40px;height:40px;background:#1A1A28;border-radius:50%;
                          border:3px solid #FFB800;display:flex;align-items:center;
                          justify-content:center;font-size:18px;
                          box-shadow:0 4px 16px rgba(255,184,0,0.4)">
                🧑
              </div>
            </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });
        passengerMarkerRef.current = L.marker([passengerPos.lat, passengerPos.lng], { icon: passengerIcon }).addTo(map);
        passengerMarkerRef.current.bindTooltip('Pasajero', { permanent: false, direction: 'top', className: 'fim-tooltip' });
      } else {
        passengerMarkerRef.current.setLatLng([passengerPos.lat, passengerPos.lng]);
      }
    } else if (passengerMarkerRef.current) {
      passengerMarkerRef.current.remove();
      passengerMarkerRef.current = null;
    }

    // ── 3. Marcador Destino ──────────────────────────────────────────────────
    if (destPos) {
      if (!destMarkerRef.current) {
        const destIcon = L.divIcon({
          className: 'transparent-icon',
          html: `
            <div style="display:flex;flex-direction:column;align-items:center">
              <div style="background:#FF4560;width:16px;height:16px;border-radius:50%;
                          border:3px solid white;box-shadow:0 2px 10px rgba(255,69,96,0.7)"></div>
              <div style="width:2px;height:12px;background:#FF4560"></div>
              <div style="width:10px;height:5px;background:rgba(255,69,96,0.5);border-radius:0 0 50% 50%"></div>
            </div>`,
          iconSize: [20, 33],
          iconAnchor: [10, 33],
        });
        destMarkerRef.current = L.marker([destPos.lat, destPos.lng], { icon: destIcon }).addTo(map);
        destMarkerRef.current.bindTooltip('🏁 Destino', { permanent: false, direction: 'top', className: 'fim-tooltip' });
      } else {
        destMarkerRef.current.setLatLng([destPos.lat, destPos.lng]);
      }
    } else if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }

    // ── 4. Ruta Dinámica OSRM ─────────────────────────────────────────────
    // Origen de la ruta: conductor (redondeado a 3 decimales para evitar recreaciones y saltos continuos)
    const activeRouteTarget = passengerPos ? passengerPos : destPos;
    if (activeRouteTarget) {
      const latRounded = Math.round(driverPos.lat * 1000) / 1000;
      const lngRounded = Math.round(driverPos.lng * 1000) / 1000;
      const endpointsKey = `${latRounded},${lngRounded}->${activeRouteTarget.lat},${activeRouteTarget.lng}`;
      const targetPhase = passengerPos ? 'going_to_passenger' : 'in_progress';

      if (currentRouteEndpoints.current !== endpointsKey) {
        currentRouteEndpoints.current = endpointsKey;

        if (routeLineRef.current) {
          routeLineRef.current.remove();
          routeLineRef.current = null;
        }

        const fetchRoute = async () => {
          const color = passengerPos ? '#00E5A0' : '#FF4560'; // Verde para buscar al pasajero, rojo para ir al destino
          try {
            const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${driverPos.lng},${driverPos.lat};${activeRouteTarget.lng},${activeRouteTarget.lat}?overview=full&geometries=geojson`);
            const data = await res.json();
            
            if (!mapRef.current) return;
            if (routeLineRef.current) { routeLineRef.current.remove(); }

            if (data.routes && data.routes[0]) {
              const route = L.geoJSON(data.routes[0].geometry, {
                style: { color: color, weight: 5, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }
              }).addTo(map);
              routeLineRef.current = route;
            } else {
              throw new Error('Sin ruta');
            }
          } catch (e) {
            if (!mapRef.current) return;
            const route = L.polyline(
              [[driverPos.lat, driverPos.lng], [activeRouteTarget.lat, activeRouteTarget.lng]],
              { color: color, weight: 4, opacity: 0.85, dashArray: '10 6', lineCap: 'round' }
            ).addTo(map);
            routeLineRef.current = route;
          }

          // Ajustar vista del mapa una sola vez por fase para no desorientar con zooms repetidos
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

    } else {
      // Limpiar estados de ruta
      currentRouteEndpoints.current = '';
      hasFittedBounds.current = '';
      if (routeLineRef.current) {
        routeLineRef.current.remove();
        routeLineRef.current = null;
      }
      
      // Auto-centrado suave en modo libre/disponible con compensación de latitud constante, y restablecer zoom a 18
      map.setView([driverPos.lat - 0.0006, driverPos.lng], 18, { animate: true, duration: 1.2 });
    }

    map.invalidateSize(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverPos, passengerPos, destPos, mapLoaded]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;
    const offset = passengerPos || destPos ? 0.0004 : 0.0006;
    map.setView([driverPos.lat - offset, driverPos.lng], 18, { animate: true, duration: 1.2 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerTrigger]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        ref={containerRef}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
      />
    </div>
  );
}
