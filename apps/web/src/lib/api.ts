import axios from 'axios';

const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    // Under Capacitor on device/emulator, hostname is 'localhost' (Android) or empty, and port is empty (no dev server)
    const isMobileApp = (window.location.hostname === 'localhost' || window.location.hostname === '') && window.location.port === '';
    const isCapacitor = (window as any).Capacitor || window.location.origin.includes('capacitor://') || isMobileApp;
    if (isCapacitor) {
      return 'https://fim-otwh.onrender.com';
    }
    
    // If we are on localhost in a web browser, use local API
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:3001';
    }
    
    return 'https://fim-otwh.onrender.com';
  }
  return 'https://fim-otwh.onrender.com';
};

export const API_URL = getApiUrl();

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('fim_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor para manejar errores globales
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('fim_token');
      localStorage.removeItem('fim_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Auth Helpers ─────────────────────────────────────────────────────────
export function saveSession(token: string, user: object) {
  localStorage.setItem('fim_token', token);
  localStorage.setItem('fim_user', JSON.stringify(user));
}

export function getSession() {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('fim_token');
  const user = localStorage.getItem('fim_user');
  if (!token || !user) return null;
  return { token, user: JSON.parse(user) };
}

export function clearSession() {
  localStorage.removeItem('fim_token');
  localStorage.removeItem('fim_user');
}

// ─── Upload helper ────────────────────────────────────────────────────────
export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const token = typeof window !== 'undefined' ? localStorage.getItem('fim_token') : null;

  const res = await axios.post(`${API_URL}/api/upload/single`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return res.data.url;
}

// ─── Pricing ──────────────────────────────────────────────────────────────
export const FIM_PRICING = {
  baseFare: 900,
  perKm: 410,
  perMinute: 80,
  bookingFee: 0,
  minimumFare: 2500,
};

export function roundCLP(amount: number): number {
  const rounded = Math.round(amount);
  const lastDigit = rounded % 10;
  if (lastDigit >= 1 && lastDigit <= 5) {
    return rounded - lastDigit;
  } else if (lastDigit >= 6 && lastDigit <= 9) {
    return rounded + (10 - lastDigit);
  }
  return rounded;
}

export function calculatePrice(distanceKm: number, durationMin: number): number {
  const raw =
    FIM_PRICING.baseFare +
    distanceKm * FIM_PRICING.perKm +
    durationMin * FIM_PRICING.perMinute;
  return Math.max(FIM_PRICING.minimumFare, roundCLP(raw));
}

export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(roundCLP(amount));
}
