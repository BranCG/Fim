import os

DRIVER_MAP_PATH = r"c:\dev\Fim\apps\web\src\components\map\DriverMap.tsx"
PASSENGER_MAP_PATH = r"c:\dev\Fim\apps\web\src\components\map\PassengerMap.tsx"

SNAP_FUNC = """
    // --- Helper matemático para "Snap to Route" ---
    const getClosestPointOnPath = (point: {lat: number, lng: number}, path: {lat: number, lng: number}[]) => {
      if (!path || path.length < 2) return { point, angle: 0 };
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
      return { point: closestPoint, angle: closestAngle };
    };
"""

def modify_driver_map():
    with open(DRIVER_MAP_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Add routeCoordinatesRef
    content = content.replace(
        "const routeLineRef = useRef<any>(null);",
        "const routeLineRef = useRef<any>(null);\n  const routeCoordinatesRef = useRef<{lat: number, lng: number}[]>([]);"
    )

    # 2. Add SNAP_FUNC inside useEffect
    content = content.replace(
        "const getDriverIcon = (angle: number) => {",
        SNAP_FUNC + "\n    const getDriverIcon = (angle: number) => {"
    )

    # 3. Modify animateMarker to use snap
    target_animate = """const startPos = marker.getLatLng();
      const dLng = targetPos.lng - startPos.lng;
      const dLat = targetPos.lat - startPos.lat;
      
      let angle = currentAngleRef.current;
      const hasMovement = Math.abs(dLng) > 1e-6 || Math.abs(dLat) > 1e-6;
      if (hasMovement) {
        angle = Math.atan2(dLng, dLat) * (180 / Math.PI);
      }"""

    replacement_animate = """const startPos = marker.getLatLng();
      let snappedTarget = targetPos;
      let targetAngle = currentAngleRef.current;
      let didSnap = false;
      
      // Snap to route if we have a path
      if (routeCoordinatesRef.current.length > 0) {
        const snap = getClosestPointOnPath(targetPos, routeCoordinatesRef.current);
        // Only snap if we are reasonably close to the route (e.g. within a few blocks)
        // If GPS is completely off route, we don't snap wildly.
        snappedTarget = snap.point;
        targetAngle = snap.angle;
        didSnap = true;
      }

      const dLng = snappedTarget.lng - startPos.lng;
      const dLat = snappedTarget.lat - startPos.lat;
      
      let angle = currentAngleRef.current;
      const hasMovement = Math.abs(dLng) > 1e-6 || Math.abs(dLat) > 1e-6;
      if (hasMovement) {
        // Usa el ángulo de la calle si hicimos snap, si no, usa el vector GPS directo
        angle = didSnap ? targetAngle : (Math.atan2(dLng, dLat) * (180 / Math.PI));
      }"""
    content = content.replace(target_animate, replacement_animate)

    # 4. Save path from OSRM
    target_fetch = """let hasRoute = false;

            results.forEach((data, idx) => {"""
    replacement_fetch = """let hasRoute = false;
            let newPath: {lat: number, lng: number}[] = [];

            results.forEach((data, idx) => {
              if (data.routes && data.routes[0] && data.routes[0].geometry) {
                 const coords = data.routes[0].geometry.coordinates; // [lng, lat]
                 if (coords) {
                   newPath.push(...coords.map((c: any) => ({ lat: c[1], lng: c[0] })));
                 }
              }"""
    content = content.replace(target_fetch, replacement_fetch)

    # and set routeCoordinatesRef
    target_hasroute = "if (!hasRoute) throw new Error('Sin ruta');"
    replacement_hasroute = "routeCoordinatesRef.current = newPath;\n            if (!hasRoute) throw new Error('Sin ruta');"
    content = content.replace(target_hasroute, replacement_hasroute)

    # clear routeCoordinatesRef on catch or clear
    content = content.replace(
        "if (routeLineRef.current) { routeLineRef.current.remove(); routeLineRef.current = null; }",
        "routeCoordinatesRef.current = [];\n        if (routeLineRef.current) { routeLineRef.current.remove(); routeLineRef.current = null; }"
    )
    # Also in the catch block where it falls back to polyline
    target_catch = """const routeGroup = L.featureGroup().addTo(map);
            routeLineRef.current = routeGroup;
            for (let i = 0; i < points.length - 1; i++) {"""
    replacement_catch = """const routeGroup = L.featureGroup().addTo(map);
            routeLineRef.current = routeGroup;
            routeCoordinatesRef.current = points; // fallback a línea recta
            for (let i = 0; i < points.length - 1; i++) {"""
    content = content.replace(target_catch, replacement_catch)

    # also clear when not active
    target_clear_state = """currentRouteEndpoints.current = '';
      hasFittedBounds.current = '';
      if (routeLineRef.current) {"""
    replacement_clear_state = """currentRouteEndpoints.current = '';
      hasFittedBounds.current = '';
      routeCoordinatesRef.current = [];
      if (routeLineRef.current) {"""
    content = content.replace(target_clear_state, replacement_clear_state)

    with open(DRIVER_MAP_PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print("DriverMap updated!")


def modify_passenger_map():
    with open(PASSENGER_MAP_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Add routeCoordinatesRef
    content = content.replace(
        "const routeLineRef = useRef<any>(null);",
        "const routeLineRef = useRef<any>(null);\n  const routeCoordinatesRef = useRef<{lat: number, lng: number}[]>([]);"
    )

    # 2. Add SNAP_FUNC inside useEffect
    content = content.replace(
        "const getDriverIcon = (angle: number) => {",
        SNAP_FUNC + "\n    const getDriverIcon = (angle: number) => {"
    )

    # 3. Modify animateMarker to use snap
    target_animate = """const startPos = marker.getLatLng();
      const dLng = targetPos.lng - startPos.lng;
      const dLat = targetPos.lat - startPos.lat;
      
      let angle = driverId === 'main' ? currentAngleRef.current : (nearbyAnglesRef.current.get(driverId) || 0);
      const hasMovement = Math.abs(dLng) > 1e-6 || Math.abs(dLat) > 1e-6;
      if (hasMovement) {
        angle = Math.atan2(dLng, dLat) * (180 / Math.PI);
      }"""

    replacement_animate = """const startPos = marker.getLatLng();
      
      let snappedTarget = targetPos;
      let targetAngle = driverId === 'main' ? currentAngleRef.current : (nearbyAnglesRef.current.get(driverId) || 0);
      let didSnap = false;
      
      // En PassengerMap, solo hacer snap al driverId 'main' para no afectar a conductores cercanos
      if (driverId === 'main' && routeCoordinatesRef.current.length > 0) {
        const snap = getClosestPointOnPath(targetPos, routeCoordinatesRef.current);
        snappedTarget = snap.point;
        targetAngle = snap.angle;
        didSnap = true;
      }

      const dLng = snappedTarget.lng - startPos.lng;
      const dLat = snappedTarget.lat - startPos.lat;
      
      let angle = driverId === 'main' ? currentAngleRef.current : (nearbyAnglesRef.current.get(driverId) || 0);
      const hasMovement = Math.abs(dLng) > 1e-6 || Math.abs(dLat) > 1e-6;
      if (hasMovement) {
        angle = didSnap ? targetAngle : (Math.atan2(dLng, dLat) * (180 / Math.PI));
      }"""
    content = content.replace(target_animate, replacement_animate)

    # 4. Save path from OSRM
    target_fetch = """let hasRoute = false;

            results.forEach((data, idx) => {"""
    replacement_fetch = """let hasRoute = false;
            let newPath: {lat: number, lng: number}[] = [];

            results.forEach((data, idx) => {
              if (data.routes && data.routes[0] && data.routes[0].geometry) {
                 const coords = data.routes[0].geometry.coordinates; // [lng, lat]
                 if (coords) {
                   newPath.push(...coords.map((c: any) => ({ lat: c[1], lng: c[0] })));
                 }
              }"""
    content = content.replace(target_fetch, replacement_fetch)

    # and set routeCoordinatesRef
    target_hasroute = "if (!hasRoute) throw new Error('Sin ruta');"
    replacement_hasroute = "routeCoordinatesRef.current = newPath;\n            if (!hasRoute) throw new Error('Sin ruta');"
    content = content.replace(target_hasroute, replacement_hasroute)
    
    # Second fetchRoute in PassengerMap (for when not active trip)
    # The first fetchRoute is inside `if (isTripActive && driverPos && activeRouteTarget)`
    # Wait, replace logic will hit BOTH instances of `let hasRoute = false;\n\n            results.forEach((data, idx) => {`
    # and BOTH instances of `if (!hasRoute) throw new Error('Sin ruta');`. That is perfect!

    # clear routeCoordinatesRef on catch or clear
    content = content.replace(
        "if (routeLineRef.current) { routeLineRef.current.remove(); routeLineRef.current = null; }",
        "routeCoordinatesRef.current = [];\n        if (routeLineRef.current) { routeLineRef.current.remove(); routeLineRef.current = null; }"
    )
    content = content.replace(
        "if (routeLineRef.current) {\n          routeLineRef.current.remove();\n          routeLineRef.current = null;\n        }",
        "routeCoordinatesRef.current = [];\n        if (routeLineRef.current) {\n          routeLineRef.current.remove();\n          routeLineRef.current = null;\n        }"
    )
    
    # Also in the catch block where it falls back to polyline
    target_catch = """const routeGroup = L.featureGroup().addTo(map);
            routeLineRef.current = routeGroup;
            for (let i = 0; i < points.length - 1; i++) {"""
    replacement_catch = """const routeGroup = L.featureGroup().addTo(map);
            routeLineRef.current = routeGroup;
            routeCoordinatesRef.current = points; // fallback a línea recta
            for (let i = 0; i < points.length - 1; i++) {"""
    content = content.replace(target_catch, replacement_catch)

    # also clear when not active
    target_clear_state = """currentRouteEndpoints.current = '';
      hasFittedBounds.current = '';
      if (routeLineRef.current) {"""
    replacement_clear_state = """currentRouteEndpoints.current = '';
      hasFittedBounds.current = '';
      routeCoordinatesRef.current = [];
      if (routeLineRef.current) {"""
    content = content.replace(target_clear_state, replacement_clear_state)

    with open(PASSENGER_MAP_PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print("PassengerMap updated!")

modify_driver_map()
modify_passenger_map()
