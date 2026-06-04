'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api, { clearSession, getSession, formatCLP } from '@/lib/api';

/* ── Inline SVG icon set ── */
function Icon({ name, size = 16, color = 'currentColor' }: { name: string; size?: number; color?: string }) {
  const icons: Record<string, JSX.Element> = {
    dashboard: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
    clock: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    users: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    car: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3.5L8 4h8l1.5 3H21a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
        <circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
      </svg>
    ),
    chart: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    ),
    search: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    check: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    x: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
    alert: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    creditcard: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    suspend: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      </svg>
    ),
    arrow_left: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
      </svg>
    ),
    arrow_right: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
      </svg>
    ),
    mail: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    phone: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.73 16z" />
      </svg>
    ),
    id: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" /><circle cx="8.5" cy="12" r="2.5" />
        <polyline points="14 9 19 9" /><polyline points="14 12 19 12" /><polyline points="14 15 17 15" />
      </svg>
    ),
    image: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
    logout: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
    calendar: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    party: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5.8 11.3L2 22l10.7-3.79" /><path d="M4 3h.01" /><path d="M22 8h.01" />
        <path d="M15 2h.01" /><path d="M22 20h.01" />
        <path d="M22 2l-2.24.75M8 5.28L10.5 3" />
      </svg>
    ),
    cash: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" /><circle cx="12" cy="12" r="3" />
        <path d="M1 10h4M19 10h4M1 14h4M19 14h4" />
      </svg>
    ),
  };
  return icons[name] || <span />;
}

interface Stats {
  totalDrivers: number;
  pendingDrivers: number;
  activeDrivers: number;
  totalPassengers: number;
  pendingPassengers: number;
  totalTrips: number;
  completedTrips: number;
  membershipsPaid: number;
  membershipRevenue: number;
}

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  rut: string;
  birthDate: string;
  address: string;
  status: string;
  membershipPaid: boolean;
  idFrontUrl: string;
  idBackUrl: string;
  licenseNumber: string;
  licenseUrl: string;
  licenseBackUrl?: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  vehiclePlate: string;
  vehiclePhotoUrl: string;
  tagNumber: string;
  totalRating: number;
  totalTrips: number;
  createdAt: string;
  adminNotes?: string;
  selfieUrl?: string;
  membershipPlan: 'BLACK' | 'COMFORT' | 'FLEX';
  membershipProgress: number;
  membershipGoal: number;
  membershipExpiresAt?: string;
  dailyCashTripsCount: number;
  comfortDebt?: number;
  comfortLastPaidAt?: string;
  comfortReceiptUrl?: string;
  trips?: any[];
}

interface Passenger {
  id: string;
  name: string;
  email: string;
  phone: string;
  rut: string | null;
  isVerified: boolean;
  role: string;
  createdAt: string;
  idFrontUrl: string | null;
  idBackUrl: string | null;
  selfieUrl: string | null;
  trips?: {
    id: string;
    status: string;
    originAddress: string;
    destAddress: string;
    otpCode: string | null;        // Código OTP de SUBIDA
    dropoffOtpCode: string | null; // Código OTP de BAJADA
    estimatedPrice: number;
    finalPrice: number | null;
    paymentMethod: string;
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    driver: { name: string; vehiclePlate: string } | null;
  }[];
}

type View = 'dashboard' | 'pending' | 'drivers' | 'passengers' | 'revenue';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<View>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingDrivers, setPendingDrivers] = useState<Driver[]>([]);
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [imgModal, setImgModal] = useState<string | null>(null);
  const [driverPlanTab, setDriverPlanTab] = useState<'BLACK' | 'COMFORT' | 'FLEX'>('BLACK');

  // Análisis de Ingresos
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [revenueDate, setRevenueDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const s = getSession();
    if (!s || s.user?.role !== 'admin') {
      clearSession();
      router.push('/login');
      return;
    }
    setSession(s);
  }, [router]);

  const loadStats = useCallback(async () => {
    try {
      const r = await api.get('/admin/stats');
      setStats(r.data.stats);
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  }, []);

  const loadPending = useCallback(async () => {
    try {
      const r = await api.get('/admin/drivers/pending');
      setPendingDrivers(r.data.drivers);
    } catch (err) {
      console.error('Error al cargar pendientes:', err);
    }
  }, []);

  const loadAllDrivers = useCallback(async () => {
    try {
      const r = await api.get('/admin/drivers');
      setAllDrivers(r.data.drivers);
    } catch (err) {
      console.error('Error al cargar todos los conductores:', err);
    }
  }, []);

  const loadPassengers = useCallback(async () => {
    try {
      const r = await api.get('/admin/passengers');
      setPassengers(r.data.passengers);
    } catch (err) {
      console.error('Error al cargar pasajeros:', err);
    }
  }, []);

  const loadRevenue = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/revenue-report', { params: { date: revenueDate } });
      setRevenueData(r.data.report);
    } catch (err) {
      setActionMsg('Error al cargar reporte de ingresos');
    } finally {
      setLoading(false);
    }
  }, [revenueDate]);

  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    if (view === 'pending') loadPending();
    if (view === 'drivers') loadAllDrivers();
    if (view === 'passengers') loadPassengers();
    if (view === 'revenue') loadRevenue();
  }, [view, loadPending, loadAllDrivers, loadPassengers, loadRevenue]);

  async function doDriverAction(driverId: string, action: string, reason?: string) {
    setLoading(true); setActionMsg('');
    try {
      if (action === 'approve') await api.post(`/admin/drivers/${driverId}/approve`);
      else if (action === 'reject') await api.post(`/admin/drivers/${driverId}/reject`, { reason });
      else if (action === 'membership') await api.post(`/admin/drivers/${driverId}/membership-paid`);
      else if (action === 'suspend') await api.post(`/admin/drivers/${driverId}/suspend`, { reason });
      else if (action === 'delete') await api.delete(`/admin/drivers/${driverId}`);

      setActionMsg(action === 'delete' ? 'Conductor eliminado con éxito' : 'Acción realizada con éxito');
      loadStats();
      if (view === 'pending') loadPending();
      if (view === 'drivers') loadAllDrivers();
      if (selectedDriver && selectedDriver.id === driverId) {
        if (action === 'delete') {
          setSelectedDriver(null);
        } else {
          const r = await api.get(`/admin/drivers/${driverId}`);
          setSelectedDriver(r.data.driver);
        }
      }
    } catch (err) {
      setActionMsg('Error al procesar la acción');
    } finally {
      setLoading(false);
      setTimeout(() => setActionMsg(''), 3000);
    }
  }

  async function doPassengerAction(passengerId: string, action: string) {
    setLoading(true); setActionMsg('');
    // Update optimista inmediato del estado local (botones cambian al instante)
    const newVerified = action === 'approve';
    if (action !== 'delete') {
      setPassengers(prev => prev.map(p => p.id === passengerId ? { ...p, isVerified: newVerified } : p));
      if (selectedPassenger && selectedPassenger.id === passengerId) {
        setSelectedPassenger(prev => prev ? { ...prev, isVerified: newVerified } : prev);
      }
    }
    try {
      if (action === 'approve') await api.post(`/admin/passengers/${passengerId}/approve`);
      else if (action === 'reject') await api.post(`/admin/passengers/${passengerId}/reject`);
      else if (action === 'delete') await api.delete(`/admin/passengers/${passengerId}`);

      setActionMsg(action === 'approve' ? 'Pasajero aprobado con éxito' : action === 'delete' ? 'Pasajero eliminado con éxito' : 'Verificación revocada');
      loadStats();
      // Recargar detalle con OTPs si está abierto
      if (selectedPassenger && selectedPassenger.id === passengerId) {
        if (action === 'delete') {
          setSelectedPassenger(null);
        } else {
          try {
            const r = await api.get(`/admin/passengers/${passengerId}`);
            setSelectedPassenger(r.data.passenger);
          } catch {}
        }
      }
      if (view === 'passengers') loadPassengers();
    } catch (err) {
      if (action !== 'delete') {
        // Revertir update optimista si falla
        const original = !newVerified;
        setPassengers(prev => prev.map(p => p.id === passengerId ? { ...p, isVerified: original } : p));
        if (selectedPassenger && selectedPassenger.id === passengerId) {
          setSelectedPassenger(prev => prev ? { ...prev, isVerified: original } : prev);
        }
      }
      setActionMsg('Error al procesar la acción');
    } finally {
      setLoading(false);
      setTimeout(() => setActionMsg(''), 4000);
    }
  }

  const handleLogout = () => { clearSession(); router.push('/login'); };

  const showDriverDetails = async (d: Driver) => {
    setLoading(true);
    try {
      const r = await api.get(`/admin/drivers/${d.id}`);
      setSelectedDriver(r.data.driver);
    } catch (err) {
      setActionMsg('Error al obtener detalles del conductor');
    } finally { setLoading(false); }
  };

  const showPassengerDetails = async (p: Passenger) => {
    setLoading(true);
    try {
      const r = await api.get(`/admin/passengers/${p.id}`);
      setSelectedPassenger(r.data.passenger);
    } catch (err) {
      setActionMsg('Error al obtener detalles del pasajero');
    } finally { setLoading(false); }
  };

  const pendingBadgeCount = (stats?.pendingDrivers || 0) + (stats?.pendingPassengers || 0);

  const navTabs: { key: View; label: string; icon: string; badge?: number | null }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { key: 'pending', label: 'Pendientes', icon: 'clock', badge: pendingBadgeCount > 0 ? pendingBadgeCount : null },
    { key: 'drivers', label: 'Conductores', icon: 'car' },
    { key: 'passengers', label: 'Pasajeros', icon: 'users' },
    { key: 'revenue', label: 'Estudios', icon: 'chart' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>

      {/* Header */}
      <header style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
          Fim<span style={{ color: 'var(--accent)' }}>.</span>{' '}
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.06em' }}>CONTROL</span>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleLogout}
          style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.78rem' }}
        >
          <Icon name="logout" size={14} color="var(--danger)" />
          Salir
        </button>
      </header>

      {/* Nav Tabs */}
      <div style={{
        display: 'flex',
        overflowX: 'auto',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: '53px',
        zIndex: 99,
        scrollbarWidth: 'none',
      }}>
        {navTabs.map(t => (
          <button
            key={t.key}
            onClick={() => {
              setView(t.key);
              setSelectedDriver(null);
              setSelectedPassenger(null);
            }}
            style={{
              padding: '13px 16px',
              border: 'none',
              borderBottom: view === t.key ? '2px solid var(--accent)' : '2px solid transparent',
              background: 'transparent',
              color: view === t.key ? 'var(--accent)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.75rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flex: 1,
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '4px',
              transition: 'var(--transition)',
            }}
          >
            <Icon name={t.icon} size={16} color={view === t.key ? 'var(--accent)' : 'var(--text-muted)'} />
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {t.label}
              {t.badge && (
                <span style={{ background: 'var(--danger)', color: 'white', borderRadius: '50px', padding: '1px 6px', fontSize: '0.6rem', fontWeight: 900 }}>
                  {t.badge}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Action message */}
      {actionMsg && (
        <div style={{
          margin: '12px 16px 0',
          padding: '11px 16px',
          background: 'rgba(0, 229, 160, 0.08)',
          border: '1px solid var(--border-accent)',
          borderRadius: 'var(--radius)',
          color: 'var(--accent)',
          fontSize: '0.82rem',
          fontWeight: 700,
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}>
          <Icon name="check" size={14} color="var(--accent)" />
          {actionMsg}
        </div>
      )}

      {/* Main Content */}
      <main style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* ── 1. DASHBOARD ── */}
        {view === 'dashboard' && stats && (
          <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 900, marginBottom: '4px' }}>Métricas de Mercado</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Conductores Totales', value: stats.totalDrivers },
                { label: 'Conductores Activos', value: stats.activeDrivers },
                { label: 'Revisión Conductores', value: stats.pendingDrivers, warning: stats.pendingDrivers > 0 },
                { label: 'Pasajeros Totales', value: stats.totalPassengers },
                { label: 'Revisión Pasajeros', value: stats.pendingPassengers, warning: stats.pendingPassengers > 0 },
                { label: 'Viajes Completados', value: stats.completedTrips },
                { label: 'Membresías Pagadas', value: stats.membershipsPaid },
                { label: 'Ingresos Membresías', value: formatCLP(stats.membershipRevenue), double: true },
              ].map((s, idx) => (
                <div
                  key={idx}
                  className="card"
                  style={{
                    gridColumn: s.double ? 'span 2' : 'span 1',
                    border: s.warning ? '1px solid rgba(255, 69, 96, 0.3)' : '1px solid var(--border)',
                    background: s.warning ? 'rgba(255, 69, 96, 0.03)' : 'var(--bg-card)',
                  }}
                >
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: s.warning ? 'var(--danger)' : 'var(--accent)' }}>{s.value}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {pendingBadgeCount > 0 && (
              <div
                onClick={() => setView('pending')}
                style={{
                  background: 'rgba(255, 69, 96, 0.08)',
                  border: '1px solid rgba(255, 69, 96, 0.2)',
                  borderRadius: 'var(--radius)',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  marginTop: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.83rem', fontWeight: 700, color: 'var(--danger)' }}>
                  <Icon name="alert" size={15} color="var(--danger)" />
                  {pendingBadgeCount} elemento(s) pendiente(s) de revisión
                </div>
                <Icon name="arrow_right" size={15} color="var(--danger)" />
              </div>
            )}
          </div>
        )}

        {/* ── 2. PENDIENTES ── */}
        {view === 'pending' && !selectedDriver && (
          <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 900, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="clock" size={18} color="var(--warning)" />
              Conductores Pendientes ({pendingDrivers.length})
            </h2>
            {pendingDrivers.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '36px 24px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <Icon name="party" size={32} color="var(--accent)" />
                <p style={{ fontSize: '0.85rem' }}>No hay solicitudes de conductores pendientes.</p>
              </div>
            ) : (
              pendingDrivers.map(d => (
                <div key={d.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid rgba(255, 184, 0, 0.25)' }}>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800 }}>{d.name}</h3>
                    <div style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="mail" size={12} color="var(--text-muted)" />{d.email}
                    </div>
                    <div style={{ fontSize: '0.77rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="phone" size={12} color="var(--text-muted)" />{d.phone}
                    </div>
                    <div style={{ fontSize: '0.77rem', color: 'var(--text-muted)' }}>RUT: {d.rut}</div>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.77rem', display: 'flex', flexWrap: 'wrap', gap: '8px', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Icon name="car" size={12} color="var(--text-muted)" />{d.vehicleBrand} {d.vehicleModel} ({d.vehicleYear})</span>
                    <span>Patente: <strong style={{ color: 'var(--accent)' }}>{d.vehiclePlate}</strong></span>
                  </div>

                  <button className="btn btn-secondary btn-sm" onClick={() => showDriverDetails(d)} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="search" size={13} color="currentColor" />
                    Revisar Documentación
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── 3. CONDUCTORES ── */}
        {view === 'drivers' && !selectedDriver && (
          <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="car" size={18} color="var(--accent)" />
              Plan del Conductor
            </h2>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['BLACK', 'COMFORT', 'FLEX'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setDriverPlanTab(p)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                    background: driverPlanTab === p ? 'var(--accent-light)' : 'var(--bg-card)',
                    color: driverPlanTab === p ? 'var(--accent)' : 'var(--text-muted)',
                    fontWeight: 800, fontSize: '0.73rem', cursor: 'pointer',
                  }}
                >
                  {p} ({allDrivers.filter(d => d.membershipPlan === p).length})
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {allDrivers.filter(d => d.membershipPlan === driverPlanTab).map(d => (
                <div key={d.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 800 }}>{d.name}</h3>
                    <span className="badge" style={{
                      background: d.status === 'active' ? 'rgba(0, 229, 160, 0.15)' : 'rgba(255, 184, 0, 0.15)',
                      color: d.status === 'active' ? 'var(--accent)' : 'var(--warning)',
                      fontSize: '0.63rem', padding: '2px 8px',
                    }}>
                      {d.status === 'active' ? 'Activo' : d.status === 'pending' ? 'Pendiente' : d.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    <div>Patente: <strong style={{ color: 'var(--text-primary)' }}>{d.vehiclePlate}</strong> · Plan: {d.membershipPlan}</div>
                    {d.membershipPlan === 'COMFORT' ? (
                      <div style={{ fontWeight: 700, color: (d.comfortDebt || 0) > 0 ? 'var(--danger)' : 'var(--success)', marginTop: '4px' }}>
                        Deuda COMFORT: ${(d.comfortDebt || 0).toLocaleString('es-CL')}
                      </div>
                    ) : (
                      <div style={{ marginTop: '4px' }}>
                        Vence: {d.membershipExpiresAt ? new Date(d.membershipExpiresAt).toLocaleDateString('es-CL') : 'Sin pagar'}
                      </div>
                    )}
                  </div>

                  <button className="btn btn-secondary btn-sm" onClick={() => showDriverDetails(d)} style={{ alignSelf: 'flex-start', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="search" size={13} color="currentColor" />
                    Ver Ficha Completa
                  </button>
                </div>
              ))}
              {allDrivers.filter(d => d.membershipPlan === driverPlanTab).length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '20px' }}>
                  Sin conductores en este plan.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── 4. DETALLE CONDUCTOR ── */}
        {selectedDriver && (
          <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedDriver(null)} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Icon name="arrow_left" size={13} color="currentColor" /> Volver
              </button>
              <h2 style={{ fontSize: '1rem', fontWeight: 900 }}>{selectedDriver.name}</h2>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
              <h3 style={{ fontSize: '0.82rem', color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: '4px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="id" size={14} color="var(--accent)" /> FICHA TÉCNICA
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="mail" size={12} color="var(--text-muted)" /><strong>Email:</strong> {selectedDriver.email}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="phone" size={12} color="var(--text-muted)" /><strong>Fono:</strong> {selectedDriver.phone}</div>
              <div><strong>RUT:</strong> {selectedDriver.rut}</div>
              <div><strong>Dirección:</strong> {selectedDriver.address}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="car" size={12} color="var(--text-muted)" /><strong>Vehículo:</strong> {selectedDriver.vehicleBrand} {selectedDriver.vehicleModel} ({selectedDriver.vehicleYear})</div>
              <div><strong>Patente:</strong> {selectedDriver.vehiclePlate}</div>
              <div><strong>Licencia N°:</strong> {selectedDriver.licenseNumber}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Icon name="creditcard" size={12} color="var(--text-muted)" /><strong>Plan / Membresía:</strong> {selectedDriver.membershipPlan} · {selectedDriver.membershipPaid ? 'PAGADA' : 'NO PAGADA'}</div>
              <div><strong>Estado:</strong> {selectedDriver.status.toUpperCase()}</div>
              {selectedDriver.adminNotes && <div style={{ color: 'var(--warning)' }}><strong>Notas Admin:</strong> {selectedDriver.adminNotes}</div>}
            </div>

            {/* Documentos Conductor */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h3 style={{ fontSize: '0.82rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="image" size={14} color="var(--accent)" /> DOCUMENTOS — Toca para zoom
              </h3>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
                {[
                  { label: 'Cédula Frente', url: selectedDriver.idFrontUrl },
                  { label: 'Cédula Dorso', url: selectedDriver.idBackUrl },
                  { label: 'Selfie', url: selectedDriver.selfieUrl },
                  { label: 'Licencia Frente', url: selectedDriver.licenseUrl },
                  { label: 'Licencia Dorso', url: selectedDriver.licenseBackUrl },
                  { label: 'Vehículo', url: selectedDriver.vehiclePhotoUrl },
                  { label: 'Recibo COMFORT', url: selectedDriver.comfortReceiptUrl },
                ].map(d => d.url ? (
                  <div
                    key={d.label}
                    onClick={() => setImgModal(d.url || null)}
                    style={{ flexShrink: 0, width: '100px', cursor: 'pointer', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={d.url} alt={d.label} style={{ width: '100px', height: '70px', objectFit: 'cover' }} />
                    <div style={{ fontSize: '0.6rem', textAlign: 'center', padding: '4px 2px', background: 'var(--bg-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</div>
                  </div>
                ) : null)}
              </div>
            </div>

            {/* Acciones Conductor */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '0.82rem', color: 'var(--accent)' }}>ACCIONES ADMINISTRADOR</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(selectedDriver.status === 'pending' || selectedDriver.status === 'suspended') && (
                  <>
                    <button className="btn btn-success" onClick={() => doDriverAction(selectedDriver.id, 'approve')} disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Icon name="check" size={15} color="currentColor" /> {selectedDriver.status === 'suspended' ? 'Reactivar Conductor' : 'Aprobar Conductor'}
                    </button>
                    {selectedDriver.status === 'pending' && (
                      <button className="btn btn-warning" onClick={() => doDriverAction(selectedDriver.id, 'membership')} disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <Icon name="creditcard" size={15} color="currentColor" /> Aprobar + Activar Membresía
                      </button>
                    )}
                  </>
                )}

                {selectedDriver.status === 'approved' && !selectedDriver.membershipPaid && (
                  <button className="btn btn-warning" onClick={() => doDriverAction(selectedDriver.id, 'membership')} disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Icon name="creditcard" size={15} color="currentColor" /> Confirmar Pago y Activar
                  </button>
                )}

                {(selectedDriver.status === 'active' || selectedDriver.status === 'approved') && (
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      const reason = prompt('Escribe el motivo de suspensión/desactivación del conductor:');
                      if (reason) doDriverAction(selectedDriver.id, 'suspend', reason);
                    }}
                    disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Icon name="suspend" size={15} color="currentColor" /> Desactivar / Suspender Conductor
                  </button>
                )}

                {(selectedDriver.status === 'pending' || selectedDriver.status === 'approved') && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <input
                      placeholder="Motivo de rechazo..."
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      style={{ fontSize: '0.8rem', padding: '8px 12px' }}
                    />
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => { doDriverAction(selectedDriver.id, 'reject', rejectReason); setRejectReason(''); }}
                      disabled={loading || !rejectReason}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Icon name="x" size={13} color="currentColor" /> Rechazar
                    </button>
                  </div>
                )}

                {/* Botón para eliminar permanentemente */}
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente la cuenta del conductor ${selectedDriver.name}? Esta acción no se puede deshacer y borrará todo su historial, viajes, calificaciones y pagos.`)) {
                      doDriverAction(selectedDriver.id, 'delete');
                    }
                  }}
                  disabled={loading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--danger)', color: 'white', marginTop: '12px', fontWeight: 800 }}
                >
                  <Icon name="x" size={15} color="currentColor" /> Eliminar Conductor
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 5. PASAJEROS ── */}
        {view === 'passengers' && !selectedPassenger && (
          <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="users" size={18} color="var(--accent)" />
              Pasajeros Registrados ({passengers.length})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {passengers.map(p => (
                <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '3px' }}>{p.name}</h3>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Icon name="mail" size={11} color="var(--text-muted)" />
                        {p.email}
                      </div>
                    </div>
                    <span className="badge" style={{
                      background: p.isVerified ? 'rgba(0, 229, 160, 0.15)' : 'rgba(255, 184, 0, 0.15)',
                      color: p.isVerified ? 'var(--accent)' : 'var(--warning)',
                      fontSize: '0.63rem',
                      padding: '2px 8px',
                      flexShrink: 0,
                    }}>
                      {p.isVerified ? 'Verificado' : 'Pendiente'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Icon name="phone" size={11} color="var(--text-muted)" />
                      {p.phone}
                      {p.rut && <span style={{ marginLeft: '8px' }}>· RUT: {p.rut}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                      <Icon name="calendar" size={11} color="var(--text-muted)" />
                      {new Date(p.createdAt).toLocaleDateString('es-CL')}
                    </div>
                  </div>

                  {/* Thumbnails rápidos de documentos */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[
                      { label: 'Cédula F.', url: p.idFrontUrl },
                      { label: 'Cédula D.', url: p.idBackUrl },
                      { label: 'Selfie', url: p.selfieUrl },
                    ].map(doc => doc.url ? (
                      <div
                        key={doc.label}
                        onClick={() => setImgModal(doc.url!)}
                        style={{ cursor: 'pointer', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', width: '56px' }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={doc.url} alt={doc.label} style={{ width: '56px', height: '40px', objectFit: 'cover', display: 'block' }} />
                        <div style={{ fontSize: '0.52rem', textAlign: 'center', padding: '2px', background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>{doc.label}</div>
                      </div>
                    ) : (
                      <div
                        key={doc.label}
                        style={{ width: '56px', height: '58px', border: '1px dashed var(--border)', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}
                      >
                        <Icon name="image" size={12} color="var(--text-muted)" />
                        <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', textAlign: 'center' }}>{doc.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => showPassengerDetails(p)} style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Icon name="search" size={12} color="currentColor" /> Ver Detalle
                    </button>
                    {!p.isVerified && (
                      <button className="btn btn-success btn-sm" onClick={() => doPassengerAction(p.id, 'approve')} style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Icon name="check" size={12} color="currentColor" /> Aprobar
                      </button>
                    )}
                    {p.isVerified && (
                      <button className="btn btn-danger btn-sm" onClick={() => doPassengerAction(p.id, 'reject')} style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Icon name="x" size={12} color="currentColor" /> Desactivar
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {passengers.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '20px' }}>
                  No hay pasajeros registrados aún.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── 6. DETALLE PASAJERO ── */}
        {selectedPassenger && (
          <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedPassenger(null)} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Icon name="arrow_left" size={13} color="currentColor" /> Volver
              </button>
              <h2 style={{ fontSize: '1rem', fontWeight: 900 }}>{selectedPassenger.name}</h2>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
              <h3 style={{ fontSize: '0.82rem', color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: '4px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="id" size={14} color="var(--accent)" /> DATOS PERSONALES
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="mail" size={12} color="var(--text-muted)" />
                <strong>Email:</strong> {selectedPassenger.email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="phone" size={12} color="var(--text-muted)" />
                <strong>Teléfono:</strong> {selectedPassenger.phone}
              </div>
              <div><strong>RUT:</strong> {selectedPassenger.rut || '—'}</div>
              <div><strong>Rol:</strong> {selectedPassenger.role}</div>
              <div>
                <strong>Estado:</strong>{' '}
                <span style={{ color: selectedPassenger.isVerified ? 'var(--accent)' : 'var(--warning)', fontWeight: 700 }}>
                  {selectedPassenger.isVerified ? 'Aprobado' : 'Pendiente de validación'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="calendar" size={12} color="var(--text-muted)" />
                <strong>Registro:</strong> {new Date(selectedPassenger.createdAt).toLocaleString('es-CL')}
              </div>
            </div>

            {/* Documentos Pasajero */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h3 style={{ fontSize: '0.82rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="image" size={14} color="var(--accent)" /> DOCUMENTOS DE IDENTIDAD — Toca para zoom
              </h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[
                  { label: 'Cédula Frente', url: selectedPassenger.idFrontUrl },
                  { label: 'Cédula Dorso', url: selectedPassenger.idBackUrl },
                  { label: 'Selfie', url: selectedPassenger.selfieUrl },
                ].map(d => d.url ? (
                  <div
                    key={d.label}
                    onClick={() => setImgModal(d.url || null)}
                    style={{ flex: 1, cursor: 'pointer', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={d.url} alt={d.label} style={{ width: '100%', height: '90px', objectFit: 'cover' }} />
                    <div style={{ fontSize: '0.62rem', textAlign: 'center', padding: '5px 2px', background: 'var(--bg-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</div>
                  </div>
                ) : (
                  <div key={d.label} style={{ flex: 1, height: '110px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                    <Icon name="image" size={18} color="var(--text-muted)" />
                    <span>{d.label}</span>
                    <span style={{ fontSize: '0.55rem' }}>Sin imagen</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Acciones Pasajero */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '0.82rem', color: 'var(--accent)' }}>ACCIONES PASAJERO</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {!selectedPassenger.isVerified ? (
                  <button
                    className="btn btn-success"
                    onClick={() => doPassengerAction(selectedPassenger.id, 'approve')}
                    disabled={loading}
                    style={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}
                  >
                    <Icon name="check" size={15} color="currentColor" /> Aprobar / Activar Pasajero
                  </button>
                ) : (
                  <button
                    className="btn btn-danger"
                    onClick={() => doPassengerAction(selectedPassenger.id, 'reject')}
                    disabled={loading}
                    style={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}
                  >
                    <Icon name="x" size={15} color="currentColor" /> Desactivar Pasajero
                  </button>
                )}

                {/* Botón para eliminar permanentemente */}
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente la cuenta del pasajero ${selectedPassenger.name}? Esta acción no se puede deshacer y borrará todo su historial, viajes y calificaciones.`)) {
                      doPassengerAction(selectedPassenger.id, 'delete');
                    }
                  }}
                  disabled={loading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'var(--danger)', color: 'white', marginTop: '12px', fontWeight: 800 }}
                >
                  <Icon name="x" size={15} color="currentColor" /> Eliminar Pasajero
                </button>
              </div>
            </div>

            {/* Historial de Viajes con Trazabilidad */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={{ fontSize: '0.82rem', color: 'var(--accent)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="calendar" size={14} color="var(--accent)" />
                TRAZABILIDAD DE VIAJES ({selectedPassenger.trips?.length || 0})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
                {selectedPassenger.trips?.map((trip) => (
                  <div key={trip.id} style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: trip.status === 'completed' ? '1px solid rgba(0,229,160,0.15)' :
                            trip.status === 'cancelled' ? '1px solid rgba(255,69,96,0.15)' :
                            '1px solid var(--border)',
                  }}>
                    {/* Encabezado del viaje */}
                    <div style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                        <Icon name="calendar" size={11} color="var(--text-muted)" />
                        {new Date(trip.createdAt).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '0.6rem', fontWeight: 900, padding: '2px 7px', borderRadius: '50px',
                          background: trip.status === 'completed' ? 'rgba(0,229,160,0.15)' :
                                      trip.status === 'cancelled' ? 'rgba(255,69,96,0.15)' : 'rgba(255,184,0,0.15)',
                          color: trip.status === 'completed' ? 'var(--accent)' :
                                 trip.status === 'cancelled' ? 'var(--danger)' : 'var(--warning)',
                        }}>
                          {trip.status === 'completed' ? 'COMPLETADO' :
                           trip.status === 'cancelled' ? 'CANCELADO' :
                           trip.status.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 900, color: 'var(--accent)' }}>
                          {formatCLP(trip.finalPrice || trip.estimatedPrice)}
                        </span>
                      </div>
                    </div>

                    {/* Conductor */}
                    {trip.driver && (
                      <div style={{ padding: '5px 12px', fontSize: '0.68rem', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Icon name="car" size={11} color="var(--text-muted)" />
                        Conductor: <strong style={{ color: 'var(--text-secondary)' }}>{trip.driver.name}</strong>
                        &nbsp;&middot;&nbsp; Patente: <strong style={{ color: 'var(--text-secondary)' }}>{trip.driver.vehiclePlate}</strong>
                      </div>
                    )}

                    {/* Código SUBIDA + Origen */}
                    <div style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: trip.otpCode ? 'rgba(0,229,160,0.03)' : 'transparent',
                    }}>
                      <div style={{ fontSize: '0.63rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icon name="check" size={10} color={trip.otpCode ? 'var(--accent)' : 'var(--text-muted)'} />
                        SUBIDA
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{
                          background: trip.otpCode ? 'rgba(0,229,160,0.12)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${trip.otpCode ? 'rgba(0,229,160,0.3)' : 'var(--border)'}`,
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontFamily: 'monospace',
                          fontSize: '1rem',
                          fontWeight: 900,
                          color: trip.otpCode ? 'var(--accent)' : 'var(--text-muted)',
                          minWidth: '52px',
                          textAlign: 'center',
                          flexShrink: 0,
                        }}>
                          {trip.otpCode || '----'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4, paddingTop: '4px' }}>
                          {trip.originAddress}
                        </div>
                      </div>
                    </div>

                    {/* Código BAJADA + Destino */}
                    <div style={{
                      padding: '8px 12px',
                      background: trip.dropoffOtpCode ? 'rgba(100,120,255,0.03)' : 'transparent',
                    }}>
                      <div style={{ fontSize: '0.63rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icon name="x" size={10} color={trip.dropoffOtpCode ? 'var(--info)' : 'var(--text-muted)'} />
                        BAJADA
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{
                          background: trip.dropoffOtpCode ? 'rgba(100,120,255,0.1)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${trip.dropoffOtpCode ? 'rgba(100,120,255,0.3)' : 'var(--border)'}`,
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontFamily: 'monospace',
                          fontSize: '1rem',
                          fontWeight: 900,
                          color: trip.dropoffOtpCode ? 'var(--info, #6478ff)' : 'var(--text-muted)',
                          minWidth: '52px',
                          textAlign: 'center',
                          flexShrink: 0,
                        }}>
                          {trip.dropoffOtpCode || '----'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4, paddingTop: '4px' }}>
                          {trip.destAddress}
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
                {(!selectedPassenger.trips || selectedPassenger.trips.length === 0) && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>El pasajero no tiene viajes registrados.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── 7. ESTUDIOS DE MERCADO ── */}
        {view === 'revenue' && (
          <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="chart" size={18} color="var(--accent)" />
                Estudios de Ingresos
              </h2>
              <input
                type="date"
                value={revenueDate}
                onChange={e => setRevenueDate(e.target.value)}
                style={{ width: '130px', fontSize: '0.75rem', padding: '6px 8px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="card" style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent)' }}>
                  {formatCLP(revenueData.reduce((acc, curr) => acc + curr.totalAmount, 0))}
                </div>
                <div style={{ fontSize: '0.63rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>Monto Generado (Hoy)</div>
              </div>
              <div className="card">
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--info)' }}>
                  {formatCLP(revenueData.filter(d => d.paymentMethod === 'card').reduce((acc, curr) => acc + curr.totalAmount, 0))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>
                  <Icon name="creditcard" size={11} color="var(--text-muted)" /> Tarjeta
                </div>
              </div>
              <div className="card">
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--warning)' }}>
                  {formatCLP(revenueData.filter(d => d.paymentMethod === 'cash').reduce((acc, curr) => acc + curr.totalAmount, 0))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>
                  <Icon name="cash" size={11} color="var(--text-muted)" /> Efectivo
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {revenueData.map((row, i) => (
                <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{row.driverName}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      <Icon name={row.paymentMethod === 'card' ? 'creditcard' : 'cash'} size={11} color="var(--text-muted)" />
                      {row.paymentMethod === 'card' ? 'MercadoPago' : 'Efectivo'} · {row.tripCount} viaje{row.tripCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--accent)' }}>
                    {formatCLP(row.totalAmount)}
                  </div>
                </div>
              ))}
              {revenueData.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '24px' }}>
                  Sin registros de viajes para esta fecha.
                </p>
              )}
            </div>
          </div>
        )}

      </main>

      {/* IMAGE MODAL (ZOOM) */}
      {imgModal && (
        <div
          onClick={() => setImgModal(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.93)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            cursor: 'pointer',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgModal} alt="Documento Zoom" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '12px', objectFit: 'contain', boxShadow: '0 24px 60px rgba(0,0,0,0.8)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            <Icon name="x" size={13} color="var(--text-muted)" /> Toca para cerrar
          </div>
        </div>
      )}
    </div>
  );
}
