import axios from 'axios';

const getApiUrl = () => {
  // 1. Usar variable de entorno si existe (Next.js lo inyecta al compilar)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // 2. Si estamos en desarrollo local en la web
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port !== '') {
    return 'http://localhost:3001';
  }
  
  // 3. Fallback final al dominio oficial de producción
  return 'https://api.fimchile.cl';
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
    const url = error.config?.url || '';
    const isLoginOrAuth = url.includes('/auth/driver/login') ||
                          url.includes('/auth/passenger/login') ||
                          url.includes('/auth/admin/login') ||
                          url.includes('/auth/google/check');

    if (error.response?.status === 401 && !isLoginOrAuth && typeof window !== 'undefined') {
      localStorage.removeItem('fim_token');
      localStorage.removeItem('fim_user');
      localStorage.setItem('logout_reason', 'duplicate_session');
      
      const isMobileApp = (window.location.hostname === 'localhost' || window.location.hostname === '') && window.location.port === '';
      const isCapacitor = (window as any).Capacitor || window.location.origin.includes('capacitor://') || isMobileApp;
      
      if (isCapacitor) {
        window.location.href = '/login.html';
      } else {
        window.location.href = '/login';
      }
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

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Usamos fetch en lugar de axios para evitar 'Network Error' con FormData en móviles (Capacitor)
  const res = await fetch(`${API_URL}/api/upload/single`, {
    method: 'POST',
    body: formData,
    headers,
  });

  if (!res.ok) {
    throw new Error(`Upload failed with status ${res.status}`);
  }

  const data = await res.json();
  return data.url;
}

// ─── Pricing ──────────────────────────────────────────────────────────────
export const FIM_PRICING = {
  baseFare: 1000,
  perKm: 270,
  perMinute: 80,
  bookingFee: 0,
  minimumFare: 2000,
};

export function roundCLP(amount: number): number {
  return Math.round(amount / 10) * 10;
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
