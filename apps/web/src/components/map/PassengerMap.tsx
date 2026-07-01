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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getPoiIcon = (L: any, type: string, name: string) => {
  let svgIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>';
  let bg = '#555';
  
  if (type === 'station') {
    svgIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="16" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><path d="M8 15h0"/><path d="M16 15h0"/></svg>';
    bg = '#E53935';
  } else if (type === 'hospital') {
    svgIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>';
    bg = '#1E88E5';
  } else if (type === 'mall') {
    svgIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>';
    bg = '#8E24AA';
  } else if (type === 'restaurant') {
    svgIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>';
    bg = '#FFB300';
  } else if (type === 'bar') {
    svgIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 22h8"/><path d="M12 11v11"/><path d="m19 3-7 8-7-8Z"/></svg>';
    bg = '#7CB342';
  }

  return L.divIcon({
    className: 'custom-poi-marker',
    html: `
      <div style="
        background: rgba(20,20,30, 0.7);
        border: 1px solid ${bg}50;
        border-radius: 12px;
        padding: 3px 6px;
        display: flex;
        align-items: center;
        gap: 6px;
        backdrop-filter: blur(4px);
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        white-space: nowrap;
        transform: translate(-50%, -50%);
        pointer-events: none;
      ">
        <div style="background: ${bg}; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">
          ${svgIcon}
        </div>
        ${name ? `<span style="color: #ddd; font-size: 0.65rem; font-weight: 600; max-width: 80px; overflow: hidden; text-overflow: ellipsis; font-family: sans-serif;">${name}</span>` : ''}
      </div>
    `,
    iconSize: [0, 0],
  });
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
  const routeCoordinatesRef = useRef<{lat: number, lng: number}[]>([]);
  const currentRouteEndpoints = useRef<string>('');
  const hasFittedBounds = useRef<string>('');
  const currentAngleRef = useRef<number>(0);
  const nearbyMarkersRef = useRef<Map<string, any>>(new Map());
  const nearbyAnglesRef = useRef<Map<string, number>>(new Map());
  const animationFramesRef = useRef<Map<string, number>>(new Map());
  const lastUpdateTimestampsRef = useRef<Map<string, number>>(new Map());

  // Estado y Referencias para Puntos de Interés (POIs)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pois, setPois] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const poiMarkersRef = useRef<Map<number, any>>(new Map());
  const lastFetchCenter = useRef<{lat: number, lng: number} | null>(null);

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
        keepBuffer: 4,
        updateWhenZooming: false,
        updateWhenIdle: true
      }).addTo(map);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        subdomains: 'abcd',
        className: 'map-labels-layer',
        keepBuffer: 4,
        updateWhenZooming: false,
        updateWhenIdle: true
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
      poiMarkersRef.current.clear();
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
    
    // --- Helper matemático para "Snap to Route" ---
    // Usamos Haversine para calcular distancia real en metros
    const getDistanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
      const R = 6371e3; // Radio de la Tierra en metros
      const φ1 = lat1 * Math.PI/180;
      const φ2 = lat2 * Math.PI/180;
      const Δφ = (lat2-lat1) * Math.PI/180;
      const Δλ = (lng2-lng1) * Math.PI/180;
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    const getClosestPointOnPath = (point: {lat: number, lng: number}, path: {lat: number, lng: number}[]) => {
      if (!path || path.length < 2) return { point, angle: 0, distance: 0 };
      let minDist = Infinity;
      let closestPoint = point;
      let closestAngle = 0;

      const dist2 = (p1: any, p2: any) => {
        const dy = (p2.lat - p1.lat);
        const dx = (p2.lng - p1.lng) * Math.cos(p1.lat * Math.PI / 180);
        return dx*dx + dy*dy;
      };

      for (let i = 0; i < path.length - 1; i++) {
        const A = path[i];
        const B = path[i+1];
        
        const dyAB = B.lat - A.lat;
        const dxAB = (B.lng - A.lng) * Math.cos(A.lat * Math.PI / 180);
        const lenAB2 = dxAB*dxAB + dyAB*dyAB;
        
        let t = 0;
        if (lenAB2 > 0) {
          const dyAP = point.lat - A.lat;
          const dxAP = (point.lng - A.lng) * Math.cos(A.lat * Math.PI / 180);
          t = (dxAP * dxAB + dyAP * dyAB) / lenAB2;
          t = Math.max(0, Math.min(1, t));
        }
        
        const projLat = A.lat + t * dyAB;
        const projLng = A.lng + (t * dxAB) / (Math.cos(A.lat * Math.PI / 180) || 1);
        
        const d = dist2(point, { lat: projLat, lng: projLng });
        if (d < minDist) {
          minDist = d;
          closestPoint = { lat: projLat, lng: projLng };
          closestAngle = Math.atan2(dxAB, dyAB) * (180 / Math.PI);
        }
      }
      
      const distanceToRoute = getDistanceMeters(point.lat, point.lng, closestPoint.lat, closestPoint.lng);
      return { point: closestPoint, angle: closestAngle, distance: distanceToRoute };
    };

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
      
      let snappedTarget = targetPos;
      let targetAngle = driverId === 'main' ? currentAngleRef.current : (nearbyAnglesRef.current.get(driverId) || 0);
      let didSnap = false;
      
      // En PassengerMap, solo hacer snap al driverId 'main' para no afectar a conductores cercanos
      if (driverId === 'main' && routeCoordinatesRef.current.length > 0) {
        const snap = getClosestPointOnPath(targetPos, routeCoordinatesRef.current);
        
        // SÓLO HACER SNAP SI ESTÁ A MENOS DE 35 METROS
        if (snap.distance < 35) {
          snappedTarget = snap.point;
          targetAngle = snap.angle;
          didSnap = true;
        }
      }

      const dLng = snappedTarget.lng - startPos.lng;
      const dLat = snappedTarget.lat - startPos.lat;
      
      let angle = driverId === 'main' ? currentAngleRef.current : (nearbyAnglesRef.current.get(driverId) || 0);
      const hasMovement = Math.abs(dLng) > 1e-6 || Math.abs(dLat) > 1e-6;
      if (hasMovement) {
        let rawAngle = didSnap ? targetAngle : (Math.atan2(dLng, dLat) * (180 / Math.PI));
        const currentA = driverId === 'main' ? currentAngleRef.current : (nearbyAnglesRef.current.get(driverId) || 0);
        
        // Evitar que el coche dé una vuelta de 360° al cambiar de -179 a 179
        const diff = ((rawAngle - currentA + 540) % 360) - 180;
        angle = currentA + diff;
      }

      const startTime = performance.now();
      
      const step = (timestamp: number) => {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / dt, 1.1);
        const easeProgress = progress; 
        
        const currentLat = startPos.lat + dLat * easeProgress;
        const currentLng = startPos.lng + dLng * easeProgress;
        
        marker.setLatLng([currentLat, currentLng]);

        if (hasMovement) {
          const element = marker.getElement();
          if (element) {
            const svg = element.querySelector('svg');
            if (svg) {
              svg.style.transform = `rotate(${angle}deg)`;
              svg.style.transition = 'transform 0.3s linear';
            }
          }
        }

        if (progress < 1.1) {
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

        routeCoordinatesRef.current = [];
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
            let newPath: {lat: number, lng: number}[] = [];

            results.forEach((data, idx) => {
              if (data.routes && data.routes[0] && data.routes[0].geometry) {
                 const coords = data.routes[0].geometry.coordinates; // [lng, lat]
                 if (coords) {
                   newPath.push(...coords.map((c: any) => ({ lat: c[1], lng: c[0] })));
                 }
              }
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
                      layer._path.style.strokeDasharray = `${length} ${length}`;
                      layer._path.style.strokeDashoffset = `${length}`;
                      layer._path.getBoundingClientRect();
                      layer._path.style.transition = 'stroke-dashoffset 1.8s ease-out';
                      layer._path.style.strokeDashoffset = '0';
                    }
                  });
                }, 50);
              }
            });
            routeCoordinatesRef.current = newPath;
            if (!hasRoute) throw new Error('Sin ruta');
          } catch (e) {
            if (!mapRef.current) return;
            if (routeLineRef.current) { routeLineRef.current.remove(); }
            const routeGroup = L.featureGroup().addTo(map);
            routeLineRef.current = routeGroup;
            routeCoordinatesRef.current = points; // fallback a línea recta
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
        
        routeCoordinatesRef.current = [];
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
            let newPath: {lat: number, lng: number}[] = [];

            results.forEach((data, idx) => {
              if (data.routes && data.routes[0] && data.routes[0].geometry) {
                 const coords = data.routes[0].geometry.coordinates; // [lng, lat]
                 if (coords) {
                   newPath.push(...coords.map((c: any) => ({ lat: c[1], lng: c[0] })));
                 }
              }
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
                      layer._path.style.strokeDasharray = `${length} ${length}`;
                      layer._path.style.strokeDashoffset = `${length}`;
                      layer._path.getBoundingClientRect();
                      layer._path.style.transition = 'stroke-dashoffset 1.8s ease-out';
                      layer._path.style.strokeDashoffset = '0';
                    }
                  });
                }, 50);
              }
            });
            routeCoordinatesRef.current = newPath;
            if (!hasRoute) throw new Error('Sin ruta');
          } catch (e) {
            if (!mapRef.current) return;
            if (routeLineRef.current) { routeLineRef.current.remove(); }
            const routeGroup = L.featureGroup().addTo(map);
            routeLineRef.current = routeGroup;
            routeCoordinatesRef.current = points; // fallback a línea recta
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
      routeCoordinatesRef.current = [];
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

  // Cargar POIs desde Overpass API
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const fetchPOIs = async () => {
      if (map.getZoom() < 14) return; // No cargar de muy lejos
      
      const center = map.getCenter();
      if (lastFetchCenter.current) {
        const dist = getDistanceMeters(lastFetchCenter.current.lat, lastFetchCenter.current.lng, center.lat, center.lng);
        if (dist < 400) return; // Si no se ha movido mucho, ignorar
      }
      lastFetchCenter.current = center;

      const bounds = map.getBounds();
      const s = bounds.getSouth();
      const w = bounds.getWest();
      const n = bounds.getNorth();
      const e = bounds.getEast();

      const query = `
        [out:json][timeout:10];
        (
          nwr["railway"="station"](${s},${w},${n},${e});
          nwr["amenity"="hospital"](${s},${w},${n},${e});
          nwr["shop"="mall"](${s},${w},${n},${e});
          nwr["amenity"="restaurant"](${s},${w},${n},${e});
          nwr["amenity"="bar"](${s},${w},${n},${e});
        );
        out center 100;
      `;
      try {
        const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data && data.elements) {
          setPois(data.elements);
        }
      } catch (err) {
        console.error('Error fetching POIs from Overpass', err);
      }
    };

    let debounceTimer: NodeJS.Timeout;
    const handleMoveEnd = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(fetchPOIs, 1000); // 1 segundo de debounce
    };

    map.on('moveend', handleMoveEnd);
    handleMoveEnd(); // Llamada inicial

    return () => {
      map.off('moveend', handleMoveEnd);
      clearTimeout(debounceTimer);
    };
  }, [mapLoaded]);

  // Dibujar POIs en el mapa
  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;

    const currentPoiIds = new Set(pois.map(p => p.id));

    // Eliminar los que ya no están en vista o en el límite
    for (const [id, marker] of poiMarkersRef.current.entries()) {
      if (!currentPoiIds.has(id)) {
        marker.remove();
        poiMarkersRef.current.delete(id);
      }
    }

    // Dibujar nuevos
    pois.forEach(poi => {
      if (!poiMarkersRef.current.has(poi.id)) {
        let type = 'unknown';
        if (poi.tags?.railway === 'station') type = 'station';
        else if (poi.tags?.amenity === 'hospital') type = 'hospital';
        else if (poi.tags?.shop === 'mall') type = 'mall';
        else if (poi.tags?.amenity === 'restaurant') type = 'restaurant';
        else if (poi.tags?.amenity === 'bar') type = 'bar';

        const lat = poi.center ? poi.center.lat : poi.lat;
        const lng = poi.center ? poi.center.lon : poi.lon;
        const name = poi.tags?.name || '';

        if (lat && lng) {
          const icon = getPoiIcon(L, type, name);
          const marker = L.marker([lat, lng], { icon, interactive: false }).addTo(map);
          poiMarkersRef.current.set(poi.id, marker);
        }
      }
    });
  }, [pois]);

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
