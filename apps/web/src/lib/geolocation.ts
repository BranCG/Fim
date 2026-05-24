import { Capacitor } from '@capacitor/core';

export async function requestLocationPermissions(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!Capacitor.isNativePlatform()) return true; // Web assumes permissions are handled by browser prompt

  try {
    const { Geolocation } = await import('@capacitor/geolocation');
    const status = await Geolocation.checkPermissions();
    if (status.location === 'granted') return true;

    const request = await Geolocation.requestPermissions();
    return request.location === 'granted';
  } catch (err) {
    console.error('Error requesting location permissions:', err);
    return false;
  }
}

export async function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  if (typeof window === 'undefined') throw new Error('Not in browser');

  if (Capacitor.isNativePlatform()) {
    const { Geolocation } = await import('@capacitor/geolocation');
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) {
      throw new Error('Permission denied');
    }
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });
    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    };
  } else {
    // Web fallback
    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }
}

export async function watchPosition(
  onSuccess: (pos: { lat: number; lng: number }) => void,
  onError: (err: any) => void
): Promise<() => void> {
  if (typeof window === 'undefined') return () => {};

  if (Capacitor.isNativePlatform()) {
    const { Geolocation } = await import('@capacitor/geolocation');
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) {
      onError(new Error('Permission denied'));
      return () => {};
    }
    const watchId = await Geolocation.watchPosition(
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      },
      (position, err) => {
        if (err) {
          onError(err);
        } else if (position) {
          onSuccess({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        }
      }
    );
    return () => {
      Geolocation.clearWatch({ id: watchId });
    };
  } else {
    // Web fallback
    if (!navigator.geolocation) {
      onError(new Error('Geolocation not supported'));
      return () => {};
    }
    const watchId = navigator.geolocation.watchPosition(
      (p) => onSuccess({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (err) => onError(err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }
}
