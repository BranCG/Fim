'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Stats {
  totalDrivers: number; pendingDrivers: number; activeDrivers: number;
  totalPassengers: number; pendingPassengers: number; totalTrips: number; completedTrips: number;
  membershipsPaid: number; membershipRevenue: number;
}

interface Driver {
  id: string; name: string; email: string; phone: string; rut: string;
  birthDate: string; address: string; status: string; membershipPaid: boolean;
  idFrontUrl: string; idBackUrl: string; licenseNumber: string; licenseUrl: string; licenseBackUrl: string;
  vehicleBrand: string; vehicleModel: string; vehicleYear: number;
  vehiclePlate: string; vehiclePhotoUrl: string; tagNumber: string;
  totalRating: number; totalTrips: number; createdAt: string; updatedAt: string; adminNotes?: string;
  isDeleted?: boolean;
  selfieUrl?: string;
  backgroundDocUrl?: string;
  membershipPlan: 'BLACK' | 'COMFORT' | 'FLEX';
  membershipProgress: number;
  membershipGoal: number;
  membershipExpiresAt?: string;
  dailyCashTripsCount: number;
  comfortDebt?: number;
  comfortLastPaidAt?: string;
  comfortReceiptUrl?: string;
  trips?: any[];
  isTrial?: boolean;
}

type View = 'dashboard' | 'pending' | 'all_drivers' | 'driver_detail' | 'revenue_analysis' | 'passengers' | 'passenger_detail' | 'settings' | 'safety_reports';

function formatCLP(n: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(n);
}

function getImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.includes('/uploads/')) {
    const filename = url.split('/uploads/').pop();
    const base = api.defaults.baseURL ? api.defaults.baseURL.replace(/\/api$/, '') : 'http://localhost:3001';
    return `${base}/uploads/${filename}`;
  }
  return url;
}

// Eliminamos lógica de ciclos de viernes (ya no aplica en SaaS)

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: 'badge-warning', approved: 'badge-info', active: 'badge-success',
    rejected: 'badge-danger', suspended: 'badge-danger',
  };
  const labels: Record<string, string> = {
    pending: 'Pendiente', approved: 'Aprobado', active: 'Activo',
    rejected: 'Rechazado', suspended: 'Suspendido',
  };
  return <span className={`badge ${map[status] || 'badge-muted'}`}>{labels[status] || status}</span>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [view, setView] = useState<View>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingDrivers, setPendingDrivers] = useState<Driver[]>([]);
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [imgModal, setImgModal] = useState<string | null>(null);
  const [historyPayment, setHistoryPayment] = useState<string>('all');
  const [driverPlanTab, setDriverPlanTab] = useState<'BLACK' | 'COMFORT' | 'FLEX' | 'ELIMINADOS'>('BLACK');
  const [config, setConfig] = useState<Record<string, string>>({});
  const [giftDays, setGiftDays] = useState(5);
  const [gifting, setGifting] = useState(false);
  const [giftSuccess, setGiftSuccess] = useState('');

  // Pasajeros
  interface Passenger {
    id: string;
    name: string;
    email: string;
    phone: string;
    rut: string | null;
    isVerified: boolean;
    isDeleted?: boolean;
    role: string;
    createdAt: string;
    updatedAt: string;
    idFrontUrl: string | null;
    idBackUrl: string | null;
    selfieUrl: string | null;
    backgroundDocUrl: string | null;
    trips?: any[];
  }

  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(null);
  const [passengerTab, setPassengerTab] = useState<'ACTIVOS' | 'ELIMINADOS'>('ACTIVOS');

  const loadPassengers = useCallback(async () => {
    const r = await api.get('/admin/passengers');
    setPassengers(r.data.passengers);
  }, []);

  // Seguridad
  interface SafetyReport {
    id: string;
    tripId: string;
    reporterId: string;
    reporterRole: string;
    reportedUserId: string;
    reason: string;
    description: string | null;
    lat: number | null;
    lng: number | null;
    resolved: boolean;
    adminNotes: string | null;
    createdAt: string;
    trip: {
      passenger: { id: string; name: string; phone: string; };
      driver?: {
        id: string;
        name: string;
        phone: string;
        vehiclePlate: string;
        vehicleBrand: string;
        vehicleModel: string;
        vehicleColor: string;
      };
    };
  }

  const [safetyReports, setSafetyReports] = useState<SafetyReport[]>([]);
  const [unresolvedSafetyCount, setUnresolvedSafetyCount] = useState(0);
  const [resolvingReportId, setResolvingReportId] = useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');

  const playSiren = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.3);
      osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.6);
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.9);
      gain.gain.setValueAtTime(0.1, ctx.currentTime); // Volumen moderado
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => osc.stop(), 1200);
    } catch (e) { console.error('Audio API no soportada', e); }
  }, []);

  const loadSafetyReports = useCallback(async () => {
    try {
      const r = await api.get('/admin/safety-reports');
      const reports = r.data.reports;
      setSafetyReports(reports);
      const unresolved = reports.filter((x: any) => !x.resolved).length;
      setUnresolvedSafetyCount(prev => {
        if (unresolved > prev) {
          playSiren(); // Sonar si hay más reportes sin resolver que antes
        }
        return unresolved;
      });
    } catch (e) { }
  }, [playSiren]);

  // Polling de seguridad global en segundo plano cada 15 segundos
  useEffect(() => {
    loadSafetyReports();
    const interval = setInterval(loadSafetyReports, 15000);
    return () => clearInterval(interval);
  }, [loadSafetyReports]);

  // Análisis de Ingresos
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [revenueFilter, setRevenueFilter] = useState({ date: new Date().toISOString().split('T')[0] });
  const checkAuth = useCallback(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const user = params.get('user');
      if (token && user) {
        localStorage.setItem('fim_admin_token', token);
        localStorage.setItem('fim_admin_user', decodeURIComponent(user));
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        return;
      }
    }
    if (!localStorage.getItem('fim_admin_token')) router.push('/');
  }, [router]);

  const loadStats = useCallback(async () => {
    try {
      const r = await api.get('/admin/stats');
      setStats(r.data.stats);
    } catch { router.push('/'); }
  }, [router]);

  const loadPending = useCallback(async () => {
    const r = await api.get('/admin/drivers/pending');
    setPendingDrivers(r.data.drivers);
  }, []);

  const loadAll = useCallback(async () => {
    const r = await api.get('/admin/drivers');
    setAllDrivers(r.data.drivers);
  }, []);

  const loadRevenue = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/revenue-report', { params: revenueFilter });
      setRevenueData(r.data.report);
    } catch {
      setActionMsg('❌ Error al cargar análisis');
    } finally { setLoading(false); }
  }, [revenueFilter]);

  const loadConfig = useCallback(async () => {
    try {
      const r = await api.get('/admin/config');
      setConfig(r.data.config || {});
    } catch {
      setActionMsg('❌ Error al cargar configuraciones');
    }
  }, []);

  const handleToggleConfig = async (key: string, currentValue: string) => {
    const newValue = currentValue === 'true' ? 'false' : 'true';
    setConfig(prev => ({ ...prev, [key]: newValue }));
    try {
      await api.post('/admin/config', { key, value: newValue });
      setActionMsg('✅ Configuración guardada');
      setTimeout(() => setActionMsg(''), 2000);
    } catch {
      setConfig(prev => ({ ...prev, [key]: currentValue }));
      setActionMsg('❌ Error al guardar configuración');
      setTimeout(() => setActionMsg(''), 2000);
    }
  };

  const handleGiftDays = async () => {
    if (giftDays <= 0) return;
    const confirm = window.confirm(`¿Estás seguro de que deseas regalar ${giftDays} días de membresía gratis a TODOS los conductores?`);
    if (!confirm) return;

    setGifting(true);
    setGiftSuccess('');
    try {
      const res = await api.post('/admin/gift-free-days', { days: giftDays });
      setGiftSuccess(`✅ ${res.data.message}`);
      loadStats();
    } catch (err: any) {
      setGiftSuccess(`❌ Error: ${err.response?.data?.error || 'No se pudo procesar.'}`);
    } finally {
      setGifting(false);
    }
  };

  useEffect(() => {
    checkAuth();
    loadStats();
  }, [checkAuth, loadStats]);

  useEffect(() => {
    if (view === 'pending') loadPending();
    if (view === 'all_drivers') loadAll();
    if (view === 'revenue_analysis') loadRevenue();
    if (view === 'passengers') loadPassengers();
    if (view === 'settings') loadConfig();
    if (view === 'safety_reports') loadSafetyReports();
  }, [view, loadPending, loadAll, loadRevenue, loadPassengers, loadConfig, loadSafetyReports]);

  async function doAction(driverId: string, action: string, reason?: string) {
    setLoading(true); setActionMsg('');
    try {
      if (action === 'approve') await api.post(`/admin/drivers/${driverId}/approve`);
      else if (action === 'reject') await api.post(`/admin/drivers/${driverId}/reject`, { reason });
      else if (action === 'membership') await api.post(`/admin/drivers/${driverId}/membership-paid`);
      else if (action === 'suspend') await api.post(`/admin/drivers/${driverId}/suspend`, { reason });
      else if (action === 'delete_permanent') await api.delete(`/admin/drivers/${driverId}`);
      else if (action === 'restore') await api.post(`/admin/drivers/${driverId}/restore`);

      setActionMsg('✅ Acción realizada');
      loadStats();
      if (view === 'pending') loadPending();
      if (view === 'all_drivers') loadAll();
      if (view === 'driver_detail') {
        const r = await api.get(`/admin/drivers/${driverId}`);
        setSelectedDriver(r.data.driver);
      }
    } catch {
      setActionMsg('❌ Error al realizar la acción');
    } finally { setLoading(false); setTimeout(() => setActionMsg(''), 3000); }
  }

  const openDriverDetail = async (driverId: string) => {
    setLoading(true);
    try {
      const r = await api.get(`/admin/drivers/${driverId}`);
      setSelectedDriver(r.data.driver);
      setView('driver_detail');
    } catch {
      setActionMsg('❌ Error al cargar detalle del conductor');
    } finally {
      setLoading(true);
      setLoading(false);
    }
  };

  const openResolveModal = (reportId: string) => {
    setResolvingReportId(reportId);
    setResolveNotes('');
  };

  async function submitResolveReport() {
    if (!resolvingReportId) return;
    setLoading(true); setActionMsg('');
    try {
      await api.post(`/admin/safety-reports/${resolvingReportId}/resolve`, { adminNotes: resolveNotes });
      setActionMsg('✅ Reporte Resuelto');
      loadSafetyReports();
      setResolvingReportId(null);
    } catch {
      setActionMsg('❌ Error al resolver reporte');
    } finally { setLoading(false); setTimeout(() => setActionMsg(''), 3000); }
  }

  async function doPassengerAction(passengerId: string, action: string) {
    setLoading(true); setActionMsg('');
    const originalPassengers = [...passengers];
    const originalSelectedPassenger = selectedPassenger ? { ...selectedPassenger } : null;

    // Optimistic Update
    setPassengers(prev => prev.map(p => p.id === passengerId ? { ...p, isVerified: action === 'approve' } : p));
    if (selectedPassenger && selectedPassenger.id === passengerId) {
      setSelectedPassenger(prev => prev ? { ...prev, isVerified: action === 'approve' } : null);
    }

    try {
      if (action === 'approve') await api.post(`/admin/passengers/${passengerId}/approve`);
      else if (action === 'reject') await api.post(`/admin/passengers/${passengerId}/reject`);
      else if (action === 'delete_permanent') await api.delete(`/admin/passengers/${passengerId}`);
      else if (action === 'restore') await api.post(`/admin/passengers/${passengerId}/restore`);

      setActionMsg('✅ Acción realizada');
      loadStats();
      if (view === 'passengers') loadPassengers();
      if (view === 'passenger_detail') {
        const r = await api.get(`/admin/passengers/${passengerId}`);
        setSelectedPassenger(r.data.passenger);
      }
    } catch {
      // Rollback on failure
      setPassengers(originalPassengers);
      setSelectedPassenger(originalSelectedPassenger);
      setActionMsg('❌ Error al realizar la acción');
    } finally { setLoading(false); setTimeout(() => setActionMsg(''), 3000); }
  }

  const openPassengerDetail = async (passengerId: string) => {
    setLoading(true);
    try {
      const r = await api.get(`/admin/passengers/${passengerId}`);
      setSelectedPassenger(r.data.passenger);
      setView('passenger_detail');
    } catch {
      setActionMsg('❌ Error al cargar detalle del pasajero');
    } finally {
      setLoading(false);
    }
  };

  function logout() { localStorage.removeItem('fim_admin_token'); router.push('/'); }

  const navItems = [
    { key: 'dashboard', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>, label: 'Dashboard' },
    { key: 'pending', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>, label: 'Pendientes', badge: (stats?.pendingDrivers || 0) + (stats?.pendingPassengers || 0) },
    { key: 'all_drivers', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></svg>, label: 'Conductores' },
    { key: 'passengers', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>, label: 'Pasajeros' },
    { key: 'revenue_analysis', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>, label: 'Estudios de Mercado' },
    { key: 'safety_reports', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>, label: 'Seguridad (S.O.S)', badge: unresolvedSafetyCount > 0 ? unresolvedSafetyCount : undefined },
    { key: 'settings', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>, label: 'Configuración' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Sidebar */}
      <aside style={{ width: '220px', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 100 }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.05em' }}>
            Fim<span style={{ color: 'var(--accent)' }}>.</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>ADMIN PANEL</div>
        </div>

        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => setView(item.key as View)}
              style={{
                width: '100%', padding: '10px 12px', marginBottom: '2px', border: 'none', borderRadius: 'var(--radius)',
                cursor: 'pointer', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '10px',
                background: view === item.key ? 'var(--accent-light)' : 'transparent',
                color: view === item.key ? 'var(--accent)' : 'var(--text-secondary)',
                transition: 'var(--transition)',
              }}
            >
              <span>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge ? <span style={{ background: 'var(--warning)', color: '#09090F', borderRadius: 'var(--radius-full)', padding: '1px 8px', fontSize: '0.72rem', fontWeight: 800 }}>{item.badge}</span> : null}
            </button>
          ))}
        </nav>

        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          <button onClick={logout} className="btn btn-secondary btn-sm" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: '220px', flex: 1, padding: '28px', minHeight: '100vh' }}>

        {actionMsg && (
          <div style={{
            position: 'fixed',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-card)',
            color: '#fff',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius)',
            padding: '12px 24px',
            fontWeight: 800,
            zIndex: 10000,
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.9rem',
            animation: 'slideDown 0.3s ease-out'
          }}>
            <div style={{ color: actionMsg.includes('Error') ? 'var(--danger)' : 'var(--accent)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            {actionMsg.replace(/[✅❌]/g, '')}
          </div>
        )}

        {/* IMAGE MODAL */}
        {imgModal && (
          <div onClick={() => setImgModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', cursor: 'pointer' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgModal} alt="documento" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '8px', objectFit: 'contain' }} />
          </div>
        )}

        {/* RESOLVE S.O.S MODAL */}
        {resolvingReportId && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(4px)' }}>
            <div className="card animate-in" style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-card)', padding: '24px', border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ color: 'var(--warning)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>
                </div>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Cerrar Caso de Seguridad</h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px', lineHeight: 1.5 }}>
                Ingresa una nota administrativa con la acción tomada (ej. "Pasajero fue contactado", "Se suspendió al conductor"). Esto quedará en el historial.
              </p>

              <textarea
                value={resolveNotes}
                onChange={e => setResolveNotes(e.target.value)}
                placeholder="Escribe las notas de resolución..."
                className="input"
                style={{ width: '100%', minHeight: '120px', marginBottom: '24px', resize: 'vertical' }}
              />

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setResolvingReportId(null)} disabled={loading}>Cancelar</button>
                <button className="btn btn-warning" onClick={submitResolveReport} disabled={loading}>
                  Confirmar Resolución
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── REPORTES DE SEGURIDAD ──────────────────────────── */}
        {view === 'safety_reports' && (
          <div className="animate-in">
            <h1 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>🛡️ Central de Seguridad (S.O.S)</h1>
            {safetyReports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
                <p>No hay reportes de seguridad en el sistema.</p>
              </div>
            ) : (
              <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Reportado por</th>
                      <th>Motivo</th>
                      <th>Estado</th>
                      <th>Detalles Viaje</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {safetyReports.map(r => (
                      <tr key={r.id} style={{ background: !r.resolved ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                        <td style={{ fontSize: '0.85rem' }}>{new Date(r.createdAt).toLocaleString('es-CL')}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{r.reporterRole === 'driver' ? 'Conductor' : 'Pasajero'}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {r.reporterId.slice(0, 8)}...</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--danger)' }}>{r.reason}</div>
                          {r.description && <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>{r.description}</div>}
                          {r.lat && r.lng && (
                            <a href={`https://maps.google.com/?q=${r.lat},${r.lng}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontSize: '0.75rem', padding: '4px 8px', background: 'var(--bg-secondary)', borderRadius: '4px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                              Ver Ubicación S.O.S
                            </a>
                          )}
                          {r.adminNotes && (
                            <div style={{ fontSize: '0.8rem', marginTop: '8px', padding: '6px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
                              <strong style={{ color: 'var(--accent)' }}>Notas:</strong> {r.adminNotes}
                            </div>
                          )}
                        </td>
                        <td>
                          {r.resolved ? (
                            <span className="badge badge-success">Resuelto</span>
                          ) : (
                            <span className="badge badge-danger" style={{ animation: 'pulse 2s infinite' }}>Pendiente</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>
                          <div><strong>Viaje:</strong> {r.tripId.slice(0, 8)}...</div>
                          {r.trip && (
                            <div style={{ marginTop: '4px' }}>
                              <div><strong>Pasajero:</strong> {r.trip.passenger.name} ({r.trip.passenger.phone})</div>
                              {r.trip.driver && (
                                <div style={{ marginTop: '6px', padding: '6px', background: 'var(--bg-secondary)', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                  <div><strong>Conductor:</strong> {r.trip.driver.name} ({r.trip.driver.phone})</div>
                                  <div style={{ marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                                    🚗 {r.trip.driver.vehicleBrand} {r.trip.driver.vehicleModel}
                                    <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>•</span>
                                    Color {r.trip.driver.vehicleColor}
                                    <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>•</span>
                                    Patente: <span style={{ color: 'var(--accent)', fontWeight: 800 }}>{r.trip.driver.vehiclePlate}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          {!r.resolved && (
                            <button className="btn btn-warning btn-sm" disabled={loading} onClick={() => openResolveModal(r.id)}>
                              Marcar Resuelto
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── DASHBOARD ─────────────────────────────────────── */}
        {view === 'dashboard' && (
          <div className="animate-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <div style={{ color: 'var(--accent)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>Dashboard Global</h1>
            </div>

            {stats && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                  {[
                    { label: 'Conductores totales', value: stats.totalDrivers, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></svg>, color: 'var(--accent)' },
                    { label: 'Pendientes revisión', value: stats.pendingDrivers, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>, color: 'var(--warning)' },
                    { label: 'Conductores activos', value: stats.activeDrivers, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>, color: 'var(--success)' },
                    { label: 'Pasajeros totales', value: stats.totalPassengers, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>, color: 'var(--info)' },
                    { label: 'Viajes totales', value: stats.totalTrips, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22V4c0-.5.2-1 .6-1.4C5 2.2 5.5 2 6 2h12c.5 0 1 .2 1.4.6.4.4.6.9.6 1.4v18" /><path d="M10 22v-4a2 2 0 0 1 2-2v0a2 2 0 0 1 2 2v4" /></svg>, color: 'var(--accent)' },
                    { label: 'Viajes completados', value: stats.completedTrips, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>, color: 'var(--success)' },
                    { label: 'Membresías cobradas', value: stats.membershipsPaid, icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>, color: 'var(--warning)' },
                    { label: 'Ingresos membresías', value: formatCLP(stats.membershipRevenue), icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>, color: 'var(--accent)' },
                  ].map(stat => (
                    <div key={stat.label} className="card card-glass">
                      <div style={{ color: stat.color, marginBottom: '12px', opacity: 0.8 }}>{stat.icon}</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{stat.value}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {stats.pendingDrivers > 0 && (
                  <div style={{ background: 'rgba(255,184,0,0.05)', border: '1px solid rgba(255,184,0,0.15)', borderRadius: 'var(--radius)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ color: 'var(--warning)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      </div>
                      <span style={{ color: 'var(--warning)', fontWeight: 700, fontSize: '0.9rem' }}>
                        Hay {stats.pendingDrivers} conductor(es) esperando validación de seguridad
                      </span>
                    </div>
                    <button className="btn btn-warning btn-sm" onClick={() => setView('pending')}>Revisar ahora →</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── CONDUCTORES PENDIENTES ────────────────────────── */}
        {view === 'pending' && (
          <div className="animate-in">
            <h1 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>⏳ Conductores Pendientes ({pendingDrivers.length})</h1>
            {pendingDrivers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
                <p>Sin conductores pendientes. ¡Al día!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {pendingDrivers.map(driver => (
                  <div key={driver.id} className="card animate-in" style={{ border: '1px solid rgba(255,184,0,0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', marginBottom: '4px' }}>{driver.name}</h3>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{driver.email} · {driver.phone}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>RUT: {driver.rut} · Nacimiento: {new Date(driver.birthDate).toLocaleDateString('es-CL')}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Domicilio: {driver.address}</div>
                        <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', background: 'var(--bg-secondary)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                            Membresía: <span style={{ color: driver.membershipPlan === 'BLACK' ? '#D4AF37' : driver.membershipPlan === 'COMFORT' ? '#60A5FA' : '#34D399' }}>{driver.membershipPlan}</span>
                          </span>
                          <span className={`badge ${driver.membershipPaid ? 'badge-success' : 'badge-danger'}`}>
                            {driver.membershipPaid ? 'Pago Registrado' : 'Pago No Registrado'}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Registrado: {new Date(driver.createdAt).toLocaleDateString('es-CL')}
                      </div>
                    </div>

                    {/* Datos del vehículo */}
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', padding: '12px', marginBottom: '14px', display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <span>🚗 {driver.vehicleBrand} {driver.vehicleModel} {driver.vehicleYear}</span>
                      <span>🔤 Patente: <strong style={{ color: 'var(--text-primary)' }}>{driver.vehiclePlate}</strong></span>
                      <span>🏷️ TAG: {driver.tagNumber}</span>
                      <span>📋 Licencia: {driver.licenseNumber}</span>
                    </div>

                    {/* Documentos */}
                    <div style={{ marginBottom: '16px' }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px' }}>DOCUMENTOS</p>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {[
                          { label: 'Cédula Frontal', url: driver.idFrontUrl },
                          { label: 'Cédula Posterior', url: driver.idBackUrl },
                          { label: 'Selfie Seguridad', url: driver.selfieUrl },
                          { label: 'Antecedentes', url: driver.backgroundDocUrl },
                          { label: 'Licencia Frente', url: driver.licenseUrl },
                          { label: 'Licencia Dorso', url: driver.licenseBackUrl },
                          { label: 'Foto Vehículo', url: driver.vehiclePhotoUrl },
                          { label: 'Comprobante COMFORT', url: driver.comfortReceiptUrl },
                        ].map(doc => {
                          if (!doc.url) {
                            return (
                              <div key={doc.label} style={{ width: '90px', height: '80px', background: 'var(--bg-secondary)', border: '2px dashed var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', padding: '4px' }}>Sin imagen</div>
                            );
                          }
                          const isPdf = doc.url.split('?')[0].toLowerCase().endsWith('.pdf') || doc.url.toLowerCase().includes('.pdf');
                          return (
                            <button
                              key={doc.label}
                              onClick={() => {
                                if (isPdf) {
                                  window.open(getImageUrl(doc.url) || '', '_blank');
                                } else {
                                  setImgModal(getImageUrl(doc.url));
                                }
                              }}
                              style={{ padding: '0', border: '2px solid var(--border)', borderRadius: '8px', cursor: 'pointer', background: 'var(--bg-card)', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '90px', transition: 'var(--transition)' }}
                              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                            >
                              {isPdf ? (
                                <div style={{ width: '90px', height: '60px', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                  </svg>
                                  <span style={{ fontSize: '0.55rem', fontWeight: 900, color: 'var(--danger)' }}>ABRIR PDF</span>
                                </div>
                              ) : (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={getImageUrl(doc.url)} alt={doc.label} style={{ width: '90px', height: '60px', objectFit: 'cover' }} />
                              )}
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '4px 6px', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button className="btn btn-success" disabled={loading} onClick={() => doAction(driver.id, 'approve')}>
                        ✓ Aprobar conductor
                      </button>
                      <button className="btn btn-warning" disabled={loading} onClick={() => doAction(driver.id, 'membership')}>
                        💳 Aprobar + Marcar membresía pagada
                      </button>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input placeholder="Motivo de rechazo..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} style={{ width: '200px', padding: '8px 12px' }} />
                        <button className="btn btn-danger btn-sm" disabled={loading || !rejectReason} onClick={() => doAction(driver.id, 'reject', rejectReason)}>
                          ✕ Rechazar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TODOS LOS CONDUCTORES ─────────────────────────── */}
        {view === 'all_drivers' && (
          <div className="animate-in">
            <h1 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>Conductores por Plan</h1>

            {/* Tabs por plan */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {(['BLACK', 'COMFORT', 'FLEX', 'ELIMINADOS'] as const).map(plan => {
                const isDeletedDriver = (d: Driver) => d.isDeleted || d.email?.startsWith('[eliminado_');
                const count = plan === 'ELIMINADOS'
                  ? allDrivers.filter(isDeletedDriver).length
                  : allDrivers.filter(d => d.membershipPlan === plan && !isDeletedDriver(d)).length;
                const colors: Record<string, { active: string; bg: string; border: string }> = {
                  BLACK: { active: '#D4AF37', bg: 'rgba(212,175,55,0.1)', border: 'rgba(212,175,55,0.3)' },
                  COMFORT: { active: '#60A5FA', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)' },
                  FLEX: { active: '#34D399', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
                  ELIMINADOS: { active: '#F87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)' },
                };
                const c = colors[plan];
                const isActive = driverPlanTab === plan;
                return (
                  <button
                    key={plan}
                    onClick={() => setDriverPlanTab(plan)}
                    style={{
                      padding: '10px 24px', borderRadius: '10px', border: `1px solid ${isActive ? c.active : c.border}`,
                      background: isActive ? c.bg : 'transparent', color: isActive ? c.active : 'var(--text-muted)',
                      fontWeight: 800, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s ease',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}
                  >
                    {plan === 'BLACK' ? '🖤' : plan === 'COMFORT' ? '🟡' : plan === 'FLEX' ? '🟢' : '🗑️'} {plan}
                    <span style={{ background: isActive ? c.active : 'rgba(255,255,255,0.1)', color: isActive ? '#000' : 'var(--text-muted)', borderRadius: '20px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 900 }}>{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table>
                <thead>
                  <tr>
                    <th>Conductor</th>
                    <th>Vehículo</th>
                    {driverPlanTab === 'ELIMINADOS' ? (
                      <>
                        <th>Eliminación Final (90 días)</th>
                        <th>Estado</th>
                        <th>Acciones Especiales</th>
                      </>
                    ) : (
                      <>
                        <th>Estado</th>
                        <th>Membresía</th>
                        {driverPlanTab === 'COMFORT' && <th>Deuda</th>}
                        {(driverPlanTab === 'BLACK' || driverPlanTab === 'FLEX') && <th>Vence</th>}
                        <th>Rating</th>
                        <th>Viajes</th>
                        <th>Acciones</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const isDeletedDriver = (d: Driver) => d.isDeleted || d.email?.startsWith('[eliminado_');
                    const displayDrivers = driverPlanTab === 'ELIMINADOS'
                      ? allDrivers.filter(isDeletedDriver)
                      : allDrivers.filter(d => d.membershipPlan === driverPlanTab && !isDeletedDriver(d));

                    if (displayDrivers.length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            No hay conductores en la pestaña {driverPlanTab}.
                          </td>
                        </tr>
                      );
                    }

                    return displayDrivers.map(d => (
                      <tr key={d.id}>
                        <td>
                          <div
                            style={{ fontWeight: 700, color: driverPlanTab === 'BLACK' ? '#D4AF37' : driverPlanTab === 'COMFORT' ? '#60A5FA' : driverPlanTab === 'ELIMINADOS' ? '#F87171' : '#34D399', cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={() => openDriverDetail(d.id)}
                          >
                            {d.name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{d.email}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>RUT: {d.rut}</div>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>
                          <div>{d.vehicleBrand} {d.vehicleModel}</div>
                          <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{d.vehiclePlate}</div>
                        </td>
                        {driverPlanTab === 'ELIMINADOS' ? (
                          <>
                            <td>
                              <span style={{ fontWeight: 800, color: 'var(--danger)' }}>
                                {(() => {
                                  const updated = new Date(d.updatedAt);
                                  updated.setDate(updated.getDate() + 90);
                                  const diff = Math.ceil((updated.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                                  return `${updated.toLocaleDateString('es-CL')} (${diff > 0 ? `en ${diff} días` : 'Vencido'})`;
                                })()}
                              </span>
                            </td>
                            <td>{statusBadge(d.status)}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <button className="btn btn-success btn-sm" disabled={loading} onClick={() => doAction(d.id, 'restore')}>🔄 Reintegrar</button>
                                <button className="btn btn-danger btn-sm" disabled={loading} onClick={() => { if (window.confirm('🚨 ¿ELIMINAR DEFINITIVAMENTE DE LA BASE DE DATOS? Esta acción destruirá completamente la cuenta de forma inmediata, borrando sus viajes, calificaciones y registros. NO se puede deshacer.')) doAction(d.id, 'delete_permanent'); }}>🗑️ Hard Delete</button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{statusBadge(d.status)}</td>
                            <td>
                              {d.membershipPaid
                                ? <span className="badge badge-success">Pagada</span>
                                : d.isTrial
                                  ? <span className="badge" style={{ background: 'var(--accent)', color: '#09090F' }}>🎁 Free Pass</span>
                                  : <span className="badge badge-danger">Sin pagar</span>}
                            </td>
                            {driverPlanTab === 'COMFORT' && (
                              <td style={{ fontWeight: 700, color: (d.comfortDebt || 0) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                                <div>{(d.comfortDebt || 0) > 0 ? `⚠️ $${(d.comfortDebt || 0).toLocaleString('es-CL')}` : 'Al día'}</div>
                                {d.comfortReceiptUrl && (
                                  <button
                                    onClick={() => setImgModal(getImageUrl(d.comfortReceiptUrl))}
                                    className="btn btn-secondary btn-sm"
                                    style={{ marginTop: '4px', fontSize: '0.7rem', padding: '2px 6px', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    📄 Ver Comprobante
                                  </button>
                                )}
                              </td>
                            )}
                            {(driverPlanTab === 'BLACK' || driverPlanTab === 'FLEX') && (
                              <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {d.membershipExpiresAt ? new Date(d.membershipExpiresAt).toLocaleDateString('es-CL') : '—'}
                              </td>
                            )}
                            <td style={{ fontWeight: 700, color: d.totalRating > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                              {d.totalRating > 0 ? `⭐ ${d.totalRating.toFixed(1)}` : '—'}
                            </td>
                            <td style={{ fontWeight: 600 }}>{d.totalTrips}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => openDriverDetail(d.id)}>Ver</button>
                                {d.status === 'approved' && !d.membershipPaid && (
                                  <button className="btn btn-warning btn-sm" disabled={loading} onClick={() => doAction(d.id, 'membership')}>💳 Activar</button>
                                )}
                                {d.status === 'active' && (
                                  <button className="btn btn-warning btn-sm" disabled={loading} onClick={() => { const r = prompt('Motivo de suspensión:'); if (r) doAction(d.id, 'suspend', r); }}>Suspender</button>
                                )}
                                <button className="btn btn-danger btn-sm" disabled={loading} onClick={() => { if (window.confirm('¿Estás seguro de eliminar permanentemente esta cuenta? Esta acción ofuscará todos sus datos y es irreversible.')) doAction(d.id, 'delete_permanent'); }}>🗑️ Eliminar</button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ANÁLISIS DE INGRESOS (SAAS) ────────────────────── */}
        {view === 'revenue_analysis' && (
          <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>📈 Análisis de Ingresos</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Seguimiento diario de la rentabilidad del mercado.</p>
              </div>
              <input
                type="date"
                className="form-input"
                value={revenueFilter.date}
                onChange={e => setRevenueFilter({ date: e.target.value })}
                style={{ width: '200px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '28px' }}>
              <div className="card">
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Total Generado (Hoy)</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent)' }}>
                  {formatCLP(revenueData.reduce((acc, curr) => acc + curr.totalAmount, 0))}
                </div>
              </div>
              <div className="card">
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Viajes con Tarjeta</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--info)' }}>
                  {formatCLP(revenueData.filter(d => d.paymentMethod === 'card').reduce((acc, curr) => acc + curr.totalAmount, 0))}
                </div>
              </div>
              <div className="card">
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Viajes en Efectivo</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--warning)' }}>
                  {formatCLP(revenueData.filter(d => d.paymentMethod === 'cash').reduce((acc, curr) => acc + curr.totalAmount, 0))}
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table>
                <thead>
                  <tr>
                    <th>Conductor</th>
                    <th>Método</th>
                    <th>Viajes</th>
                    <th>Monto Total</th>
                    <th>Ticket Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueData.map((row, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700 }}>{row.driverName}</td>
                      <td>{row.paymentMethod === 'card' ? ' Mercado Pago' : ' Efectivo'}</td>
                      <td style={{ fontWeight: 600 }}>{row.tripCount}</td>
                      <td style={{ fontWeight: 800, color: 'var(--accent)' }}>{formatCLP(row.totalAmount)}</td>
                      <td>{formatCLP(row.totalAmount / row.tripCount)}</td>
                    </tr>
                  ))}
                  {revenueData.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No hay registros de viajes para esta fecha.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DETALLE CONDUCTOR ─────────────────────────────── */}
        {view === 'driver_detail' && selectedDriver && (
          <div className="animate-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setView('all_drivers')}>← Volver</button>
              <h1 style={{ fontSize: '1.4rem' }}>{selectedDriver.name}</h1>
              {statusBadge(selectedDriver.status)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div className="card">
                <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--text-muted)' }}>DATOS PERSONALES</h3>
                {[
                  ['Email', selectedDriver.email], ['Teléfono', selectedDriver.phone],
                  ['RUT', selectedDriver.rut], ['Domicilio', selectedDriver.address],
                  ['Nacimiento', new Date(selectedDriver.birthDate).toLocaleDateString('es-CL')],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>

              <div className="card">
                <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--text-muted)' }}>VEHÍCULO</h3>
                {[
                  ['Marca/Modelo', `${selectedDriver.vehicleBrand} ${selectedDriver.vehicleModel}`],
                  ['Año', selectedDriver.vehicleYear], ['Patente', selectedDriver.vehiclePlate],
                  ['TAG', selectedDriver.tagNumber], ['Licencia N°', selectedDriver.licenseNumber],
                  ['Plan',
                    selectedDriver.membershipPlan === 'BLACK' ? '🖤 BLACK — $150.000/mes' :
                      selectedDriver.membershipPlan === 'COMFORT' ? '🟡 COMFORT — $20.000/día' :
                        '🟢 FLEX — $60.000/fin de semana'],
                  ['Membresía', selectedDriver.isTrial ? '🎁 Prueba (Pase Libre)' : (selectedDriver.membershipPaid ? '✅ Pagada' : '❌ Sin pagar')],
                  ['Rating', selectedDriver.totalRating > 0 ? `⭐ ${selectedDriver.totalRating.toFixed(1)}` : 'Nuevo'],
                  ['Viajes', selectedDriver.totalTrips],
                ].map(([k, v]) => (
                  <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
                {/* Info de Membresía del Conductor */}
                {selectedDriver.isTrial && (
                  <div style={{ marginTop: '16px', background: 'rgba(212,175,55,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>🎁 Vencimiento Free Pass</span>
                      <span style={{ fontWeight: 700, color: '#D4AF37' }}>
                        {selectedDriver.membershipExpiresAt ? new Date(selectedDriver.membershipExpiresAt).toLocaleDateString('es-CL') : 'Sin fecha'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Membresía Estimada (+30 días)</span>
                      <span style={{ fontWeight: 700, color: '#ffffff' }}>
                        {selectedDriver.membershipExpiresAt
                          ? new Date(new Date(selectedDriver.membershipExpiresAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CL')
                          : 'Sin fecha'}
                      </span>
                    </div>
                  </div>
                )}

                {!selectedDriver.isTrial && selectedDriver.membershipPlan === 'COMFORT' && (
                  <div style={{ marginTop: '16px', background: 'rgba(96,165,250,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(96,165,250,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Deuda Acumulada COMFORT</span>
                      <span style={{ fontWeight: 700, color: '#60A5FA' }}>{formatCLP(selectedDriver.comfortDebt || 0)}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Último Pago Diario: {selectedDriver.comfortLastPaidAt ? new Date(selectedDriver.comfortLastPaidAt).toLocaleString('es-CL') : 'Nunca'}
                    </div>
                  </div>
                )}

                {!selectedDriver.isTrial && (selectedDriver.membershipPlan === 'BLACK' || selectedDriver.membershipPlan === 'FLEX') && (
                  <div style={{ marginTop: '16px', background: 'rgba(0,229,160,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-accent)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Vencimiento del Acceso</span>
                      <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
                        {selectedDriver.membershipExpiresAt ? new Date(selectedDriver.membershipExpiresAt).toLocaleString('es-CL') : 'Sin activar'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Documentos */}
            <div className="card" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '14px', color: 'var(--text-muted)' }}>DOCUMENTOS Y COMPROBANTES</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Cédula Frontal', url: selectedDriver.idFrontUrl },
                  { label: 'Cédula Posterior', url: selectedDriver.idBackUrl },
                  { label: 'Selfie Seguridad', url: selectedDriver.selfieUrl },
                  { label: 'Antecedentes', url: selectedDriver.backgroundDocUrl },
                  { label: 'Licencia Frente', url: selectedDriver.licenseUrl },
                  { label: 'Licencia Dorso', url: selectedDriver.licenseBackUrl },
                  { label: 'Foto Vehículo', url: selectedDriver.vehiclePhotoUrl },
                  { label: 'Comprobante COMFORT', url: selectedDriver.comfortReceiptUrl },
                ].map(doc => {
                  if (!doc.url) return null;
                  const isPdf = doc.url.split('?')[0].toLowerCase().endsWith('.pdf') || doc.url.toLowerCase().includes('.pdf');
                  return (
                    <button
                      key={doc.label}
                      onClick={() => {
                        if (isPdf) {
                          window.open(getImageUrl(doc.url) || '', '_blank');
                        } else {
                          setImgModal(getImageUrl(doc.url) || null);
                        }
                      }}
                      style={{ border: '2px solid var(--border)', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', background: 'var(--bg-card)', transition: 'var(--transition)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    >
                      {isPdf ? (
                        <div style={{ width: '120px', height: '80px', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          <span style={{ fontSize: '0.6rem', fontWeight: 900, color: 'var(--danger)' }}>ABRIR PDF</span>
                        </div>
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={getImageUrl(doc.url)} alt={doc.label} style={{ width: '120px', height: '80px', objectFit: 'cover', display: 'block' }} />
                      )}
                      <div style={{ padding: '6px 8px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', width: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.label}</div>
                    </button>
                  );
                })}
              </div>
              {(() => {
                const urls = [selectedDriver.idFrontUrl, selectedDriver.idBackUrl, selectedDriver.selfieUrl, selectedDriver.backgroundDocUrl, selectedDriver.licenseUrl, selectedDriver.licenseBackUrl, selectedDriver.vehiclePhotoUrl].filter(Boolean);
                const hasDuplicates = new Set(urls).size !== urls.length;
                if (hasDuplicates) {
                  return (
                    <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,0,0,0.1)', color: '#ff4d4d', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid rgba(255,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>⚠️</span>
                      <div>
                        <strong>ALERTA DE SEGURIDAD:</strong> Se han detectado fotos duplicadas. El usuario subió la misma imagen para varios documentos.
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* HISTORIAL DE VIAJES */}
            <div className="card" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>HISTORIAL DE VIAJES</h3>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pago:</span>
                    <select
                      className="form-input"
                      style={{ width: '120px', padding: '6px 10px', fontSize: '0.8rem' }}
                      value={historyPayment}
                      onChange={e => setHistoryPayment(e.target.value)}
                    >
                      <option value="all">Todos</option>
                      <option value="cash"> Efectivo</option>
                      <option value="card"> Tarjeta</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Pasajero</th>
                      <th>Destino</th>
                      <th>Método</th>
                      <th>Monto</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDriver.trips?.filter((t: any) => {
                      let matchPayment = true;
                      if (historyPayment !== 'all') {
                        matchPayment = t.paymentMethod === historyPayment;
                      }
                      return matchPayment;
                    }).map((trip: any) => (
                      <tr key={trip.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>{new Date(trip.createdAt).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td style={{ fontWeight: 600 }}>{trip.passenger?.name || '—'}</td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{trip.destAddress}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {trip.paymentMethod === 'card' ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                            )}
                            {trip.paymentMethod === 'card' ? 'Tarjeta' : 'Efectivo'}
                          </div>
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          {formatCLP(trip.estimatedPrice)}
                          {trip.isDiscounted && <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--accent)' }}>% Promo</span>}
                        </td>
                        <td>{statusBadge(trip.status)}</td>
                      </tr>
                    ))}
                    {(!selectedDriver.trips || selectedDriver.trips.length === 0) && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                          No hay viajes registrados para este conductor.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Acciones */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '14px', color: 'var(--text-muted)' }}>ACCIONES</h3>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', flexWrap: 'wrap' }}>
                {selectedDriver.status === 'pending' && (
                  <>
                    <button className="btn btn-success" disabled={loading} onClick={() => doAction(selectedDriver.id, 'approve')}>Aprobar</button>
                    <button className="btn btn-danger" disabled={loading} onClick={() => { const r = prompt('Motivo de rechazo:'); if (r) doAction(selectedDriver.id, 'reject', r); }}>Rechazar</button>
                  </>
                )}
                {selectedDriver.status === 'active' && (
                  <button className="btn btn-warning" disabled={loading} onClick={() => { const r = prompt('Motivo de suspensión:'); if (r) doAction(selectedDriver.id, 'suspend', r); }}>Suspender</button>
                )}
                {selectedDriver.status === 'suspended' && (
                  <button className="btn btn-success" disabled={loading} onClick={() => doAction(selectedDriver.id, 'approve')}>Reactivar</button>
                )}
                <button className="btn btn-danger" disabled={loading} onClick={() => { if (window.confirm('¿Estás seguro de eliminar permanentemente esta cuenta? Esta acción ofuscará todos sus datos y es irreversible.')) doAction(selectedDriver.id, 'delete_permanent'); }}>🗑️ Eliminar Permanentemente</button>
              </div>
            </div>
          </div>
        )}

        {/* ── LISTADO PASAJEROS ─────────────────────────────── */}
        {view === 'passengers' && (
          <div className="animate-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <h1 style={{ fontSize: '1.5rem', margin: 0 }}>👥 Pasajeros Registrados</h1>

              <div style={{ display: 'flex', gap: '8px' }}>
                {(['ACTIVOS', 'ELIMINADOS'] as const).map(tab => {
                  const isDeleted = (p: Passenger) => p.isDeleted || p.email?.startsWith('[eliminado_');
                  const count = tab === 'ELIMINADOS' ? passengers.filter(isDeleted).length : passengers.filter(p => !isDeleted(p)).length;
                  const isActive = passengerTab === tab;
                  const color = tab === 'ELIMINADOS' ? '#F87171' : '#34D399';

                  return (
                    <button
                      key={tab}
                      onClick={() => setPassengerTab(tab)}
                      style={{
                        padding: '8px 16px', borderRadius: '8px', border: `1px solid ${isActive ? color : 'var(--border)'}`,
                        background: isActive ? `rgba(${tab === 'ELIMINADOS' ? '248,113,113' : '52,211,153'}, 0.1)` : 'transparent',
                        color: isActive ? color : 'var(--text-muted)',
                        fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s ease',
                      }}
                    >
                      {tab} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Contacto</th>
                    <th>RUT</th>
                    {passengerTab === 'ELIMINADOS' ? (
                      <>
                        <th>Eliminación Final (90 días)</th>
                        <th>Acciones Especiales</th>
                      </>
                    ) : (
                      <>
                        <th>Estado</th>
                        <th>Fecha Registro</th>
                        <th>Acciones</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const isDeleted = (p: Passenger) => p.isDeleted || p.email?.startsWith('[eliminado_');
                    const displayPassengers = passengerTab === 'ELIMINADOS' ? passengers.filter(isDeleted) : passengers.filter(p => !isDeleted(p));

                    if (displayPassengers.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            No hay pasajeros en esta categoría.
                          </td>
                        </tr>
                      );
                    }

                    return displayPassengers.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div
                            style={{ fontWeight: 700, color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}
                            onClick={() => openPassengerDetail(p.id)}
                          >
                            {p.name}
                          </div>
                        </td>
                        <td>
                          <div>{p.email}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.phone}</div>
                        </td>
                        <td style={{ fontWeight: 600 }}>{p.rut || '—'}</td>
                        {passengerTab === 'ELIMINADOS' ? (
                          <>
                            <td>
                              <span style={{ fontWeight: 800, color: 'var(--danger)' }}>
                                {(() => {
                                  const updated = new Date(p.updatedAt);
                                  updated.setDate(updated.getDate() + 90);
                                  const diff = Math.ceil((updated.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                                  return `${updated.toLocaleDateString('es-CL')} (${diff > 0 ? `en ${diff} días` : 'Vencido'})`;
                                })()}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button className="btn btn-success btn-sm" disabled={loading} onClick={() => doPassengerAction(p.id, 'restore')}>🔄 Reintegrar</button>
                                <button className="btn btn-danger btn-sm" disabled={loading} onClick={() => { if (window.confirm('🚨 ¿ELIMINAR DEFINITIVAMENTE DE LA BASE DE DATOS? Esta acción destruirá completamente la cuenta de forma inmediata, borrando sus viajes, calificaciones y registros. NO se puede deshacer.')) doPassengerAction(p.id, 'delete_permanent'); }}>🗑️ Hard Delete</button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>
                              {p.isVerified ? (
                                <span className="badge badge-success">Verificado</span>
                              ) : (
                                <span className="badge badge-warning">Pendiente</span>
                              )}
                            </td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {new Date(p.createdAt).toLocaleDateString('es-CL')}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => openPassengerDetail(p.id)}>Ver detalle</button>
                                {p.isVerified ? (
                                  <button className="btn btn-warning btn-sm" onClick={() => doPassengerAction(p.id, 'reject')}>Suspender</button>
                                ) : (
                                  <button className="btn btn-success btn-sm" onClick={() => doPassengerAction(p.id, 'approve')}>Aprobar</button>
                                )}
                                <button className="btn btn-danger btn-sm" disabled={loading} onClick={() => { if (window.confirm('¿Estás seguro de eliminar permanentemente esta cuenta? Esta acción ofuscará todos sus datos y es irreversible.')) doPassengerAction(p.id, 'delete_permanent'); }}>🗑️ Eliminar</button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DETALLE PASAJERO ─────────────────────────────── */}
        {view === 'passenger_detail' && selectedPassenger && (
          <div className="animate-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setView('passengers')}>← Volver</button>
              <h1 style={{ fontSize: '1.4rem', margin: 0 }}>{selectedPassenger.name}</h1>
              {selectedPassenger.isVerified ? (
                <span className="badge badge-success">Verificado</span>
              ) : (
                <span className="badge badge-warning">Pendiente de Aprobación</span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div className="card">
                <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--text-muted)' }}>DATOS PERSONALES</h3>
                {[
                  ['Email', selectedPassenger.email],
                  ['Teléfono', selectedPassenger.phone],
                  ['RUT', selectedPassenger.rut || '—'],
                  ['Rol', selectedPassenger.role],
                  ['Miembro desde', new Date(selectedPassenger.createdAt).toLocaleDateString('es-CL') + ' ' + new Date(selectedPassenger.createdAt).toLocaleTimeString('es-CL')],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>

              <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '20px', color: 'var(--text-muted)', textAlign: 'center' }}>ACCIONES DE VALIDACIÓN</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '300px', margin: '0 auto', width: '100%' }}>
                  {!selectedPassenger.isVerified ? (
                    <button className="btn btn-success btn-lg" onClick={() => doPassengerAction(selectedPassenger.id, 'approve')} style={{ width: '100%', fontWeight: 700 }}>
                      Aprobar Pasajero
                    </button>
                  ) : (
                    <button className="btn btn-warning btn-lg" onClick={() => doPassengerAction(selectedPassenger.id, 'reject')} style={{ width: '100%', fontWeight: 700 }}>
                      Suspender Pasajero
                    </button>
                  )}
                  <button className="btn btn-danger btn-lg" onClick={() => { if (window.confirm('¿Estás seguro de eliminar permanentemente esta cuenta? Esta acción ofuscará todos sus datos y es irreversible.')) doPassengerAction(selectedPassenger.id, 'delete_permanent'); }} style={{ width: '100%', fontWeight: 700 }}>
                    Eliminar Permanentemente
                  </button>
                </div>
              </div>
            </div>

            {/* Documentos de Identidad */}
            <div className="card" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '14px', color: 'var(--text-muted)' }}>DOCUMENTOS DE IDENTIDAD</h3>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Cédula Frontal', url: selectedPassenger.idFrontUrl },
                  { label: 'Cédula Posterior', url: selectedPassenger.idBackUrl },
                  { label: 'Selfie de Seguridad', url: selectedPassenger.selfieUrl },
                ].map(doc => (
                  doc.url ? (
                    <button
                      key={doc.label}
                      onClick={() => setImgModal(getImageUrl(doc.url) || null)}
                      style={{ border: '2px solid var(--border)', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', background: 'var(--bg-card)', transition: 'var(--transition)' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={getImageUrl(doc.url)} alt={doc.label} style={{ width: '150px', height: '100px', objectFit: 'cover', display: 'block' }} />
                      <div style={{ padding: '6px 8px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', fontWeight: 600 }}>{doc.label}</div>
                    </button>
                  ) : (
                    <div key={doc.label} style={{ width: '150px', height: '124px', background: 'rgba(255,255,255,0.02)', border: '2px dashed var(--border)', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>
                      <div>❌ Sin imagen</div>
                      <div style={{ marginTop: '4px', fontSize: '0.65rem' }}>{doc.label}</div>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Historial de Viajes del Pasajero */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--text-muted)' }}>HISTORIAL DE VIAJES ({selectedPassenger.trips?.length || 0})</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Conductor</th>
                      <th>Origen</th>
                      <th>Destino</th>
                      <th>Método</th>
                      <th>Monto</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPassenger.trips?.map((trip: any) => (
                      <tr key={trip.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {new Date(trip.createdAt).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {trip.driver?.name || 'Buscando...'}
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '200px' }}>
                          <div style={{ whiteSpace: 'normal', wordBreak: 'break-word', color: 'var(--text-secondary)' }}>
                            {trip.originAddress}
                          </div>
                          <div style={{
                            marginTop: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(0, 229, 160, 0.08)',
                            border: '1px solid rgba(0, 229, 160, 0.2)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontFamily: 'monospace',
                            color: 'var(--success)'
                          }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
                              Subida:
                            </span>
                            <strong style={{ letterSpacing: '0.5px' }}>{trip.otpCode || '----'}</strong>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '200px' }}>
                          <div style={{ whiteSpace: 'normal', wordBreak: 'break-word', color: 'var(--text-secondary)' }}>
                            {trip.destAddress}
                          </div>
                          <div style={{
                            marginTop: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(79, 195, 247, 0.08)',
                            border: '1px solid rgba(79, 195, 247, 0.2)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            fontFamily: 'monospace',
                            color: 'var(--info)'
                          }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                              Bajada:
                            </span>
                            <strong style={{ letterSpacing: '0.5px' }}>{trip.dropoffOtpCode || '----'}</strong>
                          </div>
                        </td>
                        <td>
                          {trip.paymentMethod === 'card' ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                              Tarjeta
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>
                              Efectivo
                            </span>
                          )}
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          {formatCLP(trip.estimatedPrice)}
                        </td>
                        <td>
                          {statusBadge(trip.status)}
                        </td>
                      </tr>
                    ))}
                    {(!selectedPassenger.trips || selectedPassenger.trips.length === 0) && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                          El pasajero no ha realizado viajes aún.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── SETTINGS / CONFIGURACIÓN DE COBERTURA Y REGALOS ────────────────────── */}
        {view === 'settings' && (
          <div className="animate-in">
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>⚙️ Configuración del Sistema</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Controla la cobertura geográfica del lanzamiento y gestiona los regalos masivos de días.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '40px' }}>
              {/* Bloque de Regalo Masivo */}
              <div className="card">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--accent)' }}>🎁 Días de Membresía de Regalo (Free Pass Fim)</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '16px' }}>
                  Añade días de membresía gratis a todos los conductores con estado <strong>Activo</strong> o <strong>Aprobado</strong> simultáneamente.
                  Si un conductor ya tiene su membresía pagada y vigente, su fecha de expiración se extenderá automáticamente por esta cantidad de días. Si está vencido, se le activará desde hoy por esa cantidad de días.
                </p>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', maxWidth: '450px' }}>
                  <div style={{ width: '120px' }}>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={giftDays}
                      onChange={e => setGiftDays(Math.max(1, parseInt(e.target.value) || 0))}
                      disabled={gifting}
                      style={{ textAlign: 'center' }}
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleGiftDays}
                    disabled={gifting}
                    style={{ flex: 1 }}
                  >
                    {gifting ? 'Procesando...' : `Obsequiar ${giftDays} Días Gratis`}
                  </button>
                </div>

                {giftSuccess && (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    borderRadius: 'var(--radius)',
                    background: giftSuccess.startsWith('❌') ? 'rgba(255, 69, 96, 0.1)' : 'rgba(0, 229, 160, 0.1)',
                    border: giftSuccess.startsWith('❌') ? '1px solid var(--danger)' : '1px solid var(--success)',
                    fontSize: '0.875rem',
                    color: giftSuccess.startsWith('❌') ? 'var(--danger)' : 'var(--success)'
                  }}>
                    {giftSuccess}
                  </div>
                )}
              </div>

              {/* Bloque de Cobertura */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>📍 Cobertura Geográfica de Operación</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Define en qué zonas los pasajeros pueden pedir viajes y los conductores ponerse en línea.</p>
                  </div>
                  <div>
                    <button
                      className={`btn ${config.zone_enabled_all_chile === 'true' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleToggleConfig('zone_enabled_all_chile', config.zone_enabled_all_chile || 'false')}
                      style={{ fontSize: '0.85rem', padding: '8px 16px' }}
                    >
                      {config.zone_enabled_all_chile === 'true' ? '🌎 Cobertura Nacional Activa (Sin Restricciones)' : '🔒 Restringir Cobertura por Zonas'}
                    </button>
                  </div>
                </div>

                {config.zone_enabled_all_chile === 'true' ? (
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    background: 'rgba(212,175,55,0.05)',
                    border: '1.5px dashed var(--accent)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    fontSize: '0.95rem'
                  }}>
                    ✨ Fim está operando actualmente a NIVEL NACIONAL en todo Chile sin restricciones de geocerca.
                  </div>
                ) : (
                  <div>
                    {/* Secciones de Zonas */}
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '0.95rem', color: 'var(--accent)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        🏙️ REGIÓN METROPOLITANA (MACRO-ZONAS)
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                        {[
                          { id: 'rm_centro_oriente', name: 'Centro-Oriente', desc: 'Santiago Centro, Providencia, Las Condes, Vitacura, Ñuñoa, La Reina, Macul.' },
                          { id: 'rm_sur', name: 'Sur', desc: 'San Bernardo, Puente Alto, La Cisterna, San Miguel, El Bosque, La Pintana.' },
                          { id: 'rm_poniente', name: 'Poniente', desc: 'Maipú, Pudahuel, Cerrillos, Estación Central, Lo Prado.' },
                          { id: 'rm_norte', name: 'Norte', desc: 'Colina (Chicureo), Huechuraba, Quilicura, Conchalí, Recoleta.' },
                        ].map(z => {
                          const isEnabled = config[`zone_enabled_${z.id}`] === 'true';
                          return (
                            <div
                              key={z.id}
                              onClick={() => handleToggleConfig(`zone_enabled_${z.id}`, config[`zone_enabled_${z.id}`] || 'false')}
                              style={{
                                padding: '14px',
                                background: isEnabled ? 'rgba(0, 229, 160, 0.04)' : 'rgba(255,255,255,0.01)',
                                border: isEnabled ? '1.5px solid var(--success)' : '1.5px solid var(--border)',
                                borderRadius: 'var(--radius)',
                                cursor: 'pointer',
                                transition: 'var(--transition)'
                              }}
                              onMouseEnter={e => {
                                if (!isEnabled) e.currentTarget.style.borderColor = 'var(--text-muted)';
                              }}
                              onMouseLeave={e => {
                                if (!isEnabled) e.currentTarget.style.borderColor = 'var(--border)';
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <strong style={{ fontSize: '0.9rem', color: isEnabled ? 'var(--success)' : 'var(--text-primary)' }}>{z.name}</strong>
                                <span style={{
                                  width: '10px',
                                  height: '10px',
                                  borderRadius: '50%',
                                  background: isEnabled ? 'var(--success)' : '#444'
                                }}></span>
                              </div>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>{z.desc}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <hr style={{ border: 'none', borderBottom: '1px solid var(--border)', margin: '24px 0' }} />

                    <div>
                      <h4 style={{ fontSize: '0.95rem', color: 'var(--info)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        🇨🇱 OTRAS REGIONES DE CHILE (REGIONES COMPLETAS)
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                        {[
                          { id: 'valparaiso', name: 'Región de Valparaíso' },
                          { id: 'biobio', name: 'Región del Biobío' },
                          { id: 'coquimbo', name: 'Región de Coquimbo' },
                          { id: 'arica_y_parinacota', name: 'Región de Arica y Parinacota' },
                          { id: 'tarapaca', name: 'Región de Tarapacá' },
                          { id: 'antofagasta', name: 'Región de Antofagasta' },
                          { id: 'atacama', name: 'Región de Atacama' },
                          { id: 'ohiggins', name: "Región de O'Higgins" },
                          { id: 'maule', name: 'Región del Maule' },
                          { id: 'nuble', name: 'Región de Ñuble' },
                          { id: 'araucania', name: 'Región de La Araucanía' },
                          { id: 'los_rios', name: 'Región de Los Ríos' },
                          { id: 'los_lagos', name: 'Región de Los Lagos' },
                          { id: 'aysen', name: 'Región de Aysén' },
                          { id: 'magallanes', name: 'Región de Magallanes' },
                        ].map(r => {
                          const isEnabled = config[`zone_enabled_${r.id}`] === 'true';
                          return (
                            <div
                              key={r.id}
                              onClick={() => handleToggleConfig(`zone_enabled_${r.id}`, config[`zone_enabled_${r.id}`] || 'false')}
                              style={{
                                padding: '12px 14px',
                                background: isEnabled ? 'rgba(79, 195, 247, 0.04)' : 'rgba(255,255,255,0.01)',
                                border: isEnabled ? '1.5px solid var(--info)' : '1.5px solid var(--border)',
                                borderRadius: 'var(--radius)',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                transition: 'var(--transition)'
                              }}
                              onMouseEnter={e => {
                                if (!isEnabled) e.currentTarget.style.borderColor = 'var(--text-muted)';
                              }}
                              onMouseLeave={e => {
                                if (!isEnabled) e.currentTarget.style.borderColor = 'var(--border)';
                              }}
                            >
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isEnabled ? 'var(--info)' : 'var(--text-secondary)' }}>{r.name}</span>
                              <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: isEnabled ? 'var(--info)' : '#444'
                              }}></span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
