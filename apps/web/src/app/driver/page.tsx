'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import api, { formatCLP, clearSession, getSession, roundCLP } from '@/lib/api';
import { connectSocket, forceReconnectSocket } from '@/lib/socket';
import { sendLocalNotification, initializePushNotifications } from '@/lib/notifications';

const DriverMap = dynamic(() => import('@/components/map/DriverMap'), { ssr: false });

type DriverStatus = 'pending' | 'approved' | 'active' | 'rejected' | 'suspended';

interface TripRequest {
  id: string;
  originLat: number; originLng: number; originAddress: string;
  destLat: number; destLng: number; destAddress: string;
  distanceKm: number; durationMin: number; estimatedPrice: number;
  paymentMethod: string;
  passenger: { id: string; name: string; phone: string };
  driverDistance: number;
}

interface DriverInfo {
  id: string; name: string; status: DriverStatus;
  membershipPaid: boolean; isOnline: boolean;
  membershipPlan: 'BLACK' | 'COMFORT' | 'FLEX';
  membershipProgress: number;
  membershipGoal: number;
  membershipExpiresAt?: string;
  dailyCashTripsCount: number;
  comfortDebt?: number;
  comfortLastPaidAt?: string;
  vehicleBrand: string; vehicleModel: string; vehiclePlate: string;
  totalRating: number; totalTrips: number;
  mercadoPagoLink: string | null;
  email: string;
  walletBalance: number;
  adminNotes: string | null;
  taxCompliant: boolean;
  taxDocumentUrl: string | null;
  taxPendingReview: boolean;
}

const SANTIAGO = { lat: -33.4489, lng: -70.6693 };

// --- ICONOS SVG ---
const IconClock = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const IconX = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const IconLock = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
const IconCar = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="13" width="22" height="8" rx="2" /><path d="M17 13l-1.5-6h-7L7 13" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></svg>;
const IconPin = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
const IconStar = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
const IconWallet = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" /><path d="M4 6v12c0 1.1.9 2 2 2h14v-4" /><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" /></svg>;
const IconAlert = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
const IconGear = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
const IconCheck = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const IconPhone = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
const IconLogout = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
const IconCompass = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 8.88 9.88 16.24 7.76" />
  </svg>
);



export default function DriverPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);

  const formatDuration = (min: number) => {
    if (min < 60) return `${min} min aprox.`;
    const hrs = Math.floor(min / 60);
    const mins = min % 60;
    return mins > 0 ? `${hrs} h ${mins} min aprox.` : `${hrs} h aprox.`;
  };

  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [pos, setPos] = useState(SANTIAGO);
  const [tripRequest, setTripRequest] = useState<TripRequest | null>(null);
  const [activeTrip, setActiveTrip] = useState<TripRequest | null>(null);
  const [tripPhase, setTripPhase] = useState<'idle' | 'going_to_passenger' | 'arrived' | 'in_progress'>('idle');
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  const [completionOtp, setCompletionOtp] = useState('');
  const [completionOtpVerified, setCompletionOtpVerified] = useState(false);
  const [showTaxGuide, setShowTaxGuide] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [payingMembership, setPayingMembership] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const geoRef = useRef<(() => void) | null>(null);

  const posRef = useRef(pos);
  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  const activeTripRef = useRef(activeTrip);
  useEffect(() => {
    activeTripRef.current = activeTrip;
  }, [activeTrip]);

  const tripRequestRef = useRef(tripRequest);
  useEffect(() => {
    tripRequestRef.current = tripRequest;
  }, [tripRequest]);

  const [passengerConfirmed, setPassengerConfirmed] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [paymentRequested, setPaymentRequested] = useState(false);
  const [cancellationNotice, setCancellationNotice] = useState<{ reason: string; wasAccepted?: boolean } | null>(null);

  const [isMinimized, setIsMinimized] = useState(false);
  const [showNavModal, setShowNavModal] = useState(false);

  // Reset minimize state when trip status or phase changes
  useEffect(() => {
    setIsMinimized(false);
  }, [activeTrip?.id, tripPhase]);

  // Helper styles to support collapsing/minimizing bottom sheets smoothly
  const bottomSheetStyle = (customStyle: React.CSSProperties = {}): React.CSSProperties => ({
    transform: isMinimized ? 'translateY(calc(100% - 62px))' : 'translateY(0)',
    transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    maxHeight: '85vh',
    overflowY: 'auto',
    ...customStyle
  });

  // Local handle component to minimize/maximize sheets
  const BottomSheetHandle = () => (
    <div
      onClick={() => setIsMinimized(!isMinimized)}
      style={{
        width: '100%',
        padding: '6px 0',
        margin: '0 auto 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'var(--transition)'
      }}
      onMouseEnter={(e) => {
        const bar = e.currentTarget.querySelector('.handle-bar') as HTMLDivElement;
        if (bar) bar.style.background = 'var(--accent)';
      }}
      onMouseLeave={(e) => {
        const bar = e.currentTarget.querySelector('.handle-bar') as HTMLDivElement;
        if (bar) bar.style.background = 'var(--border)';
      }}
    >
      <div
        className="handle-bar"
        style={{
          width: '40px',
          height: '4px',
          background: 'var(--border)',
          borderRadius: 'var(--radius-full)',
          transition: 'var(--transition)'
        }}
      />
      <div style={{
        marginTop: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '0.65rem',
        fontWeight: 800,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {isMinimized ? (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
            Maximizar
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
            Minimizar
          </>
        )}
      </div>
    </div>
  );

  // Chat en vivo state
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const showChatRef = useRef(false);

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChat]);

  // Clear unread count when chat is opened
  useEffect(() => {
    showChatRef.current = showChat;
    if (showChat) {
      setUnreadCount(0);
    }
  }, [showChat]);

  // Auto-close chat modal during trip in progress or idle
  useEffect(() => {
    if (tripPhase === 'in_progress' || tripPhase === 'idle' || paymentRequested) {
      setShowChat(false);
    }
  }, [tripPhase, paymentRequested]);

  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  const [taxUploading, setTaxUploading] = useState(false);
  const [taxDocumentUrl, setTaxDocumentUrl] = useState<string | null>(null);

  const handleUploadTaxDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTaxUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/uploads/single', formData);
      const url = res.data.url;
      setTaxDocumentUrl(url);
      
      await api.post('/drivers/submit-tax-document', { taxDocumentUrl: url });
      
      if (driver) {
        setDriver({
          ...driver,
          taxCompliant: true,
          taxPendingReview: true,
          taxDocumentUrl: url
        });
      }
      alert('Documento tributario cargado y cuenta reactivada con éxito. Nuestro equipo auditará la boleta en las próximas 24 horas.');
    } catch (err) {
      console.error(err);
      alert('Error al subir el documento tributario');
    } finally {
      setTaxUploading(false);
    }
  };

  const handlePayMembership = async () => {
    if (!driver) return;
    
    // Links estáticos de Mercado Pago provistos por el usuario
    const staticLinks: Record<string, string> = {
      BLACK: 'https://mpago.la/2GQQM65',
      FLEX: 'https://mpago.la/2kxLWNy',
      COMFORT: 'https://mpago.la/1geQas2',
    };
    
    const url = staticLinks[driver.membershipPlan];
    if (url) {
      window.location.href = url;
      return;
    }
    
    setPayingMembership(true);
    try {
      const res = await api.post('/payments/membership/create-preference', {
        driverId: driver.id,
        plan: driver.membershipPlan,
        email: driver.email,
      });
      if (res.data.init_point) {
        window.location.href = res.data.init_point;
      } else {
        alert('No se pudo generar el link de pago.');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al procesar el pago.');
    } finally {
      setPayingMembership(false);
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/uploads/single', formData);
      const url = res.data.url;
      
      await api.post('/drivers/pay-comfort-daily', { receiptUrl: url });
      alert('Comprobante de pago diario subido correctamente. Deuda actualizada.');
      
      const meRes = await api.get('/drivers/me');
      setDriver(meRes.data.driver);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Error al subir el comprobante de pago.');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const resetTrip = useCallback(() => {
    setActiveTrip(null);
    setTripPhase('idle');
    setPassengerConfirmed(false);
    setReceiptUrl(null);
    setPaymentRequested(false);
    setCompletionOtp('');
    setCompletionOtpVerified(false);
    setChatMessages([]);
    setShowChat(false);
    setUnreadCount(0);
    setShowNavModal(false);
  }, []);

  const handleNavigate = (app: 'waze' | 'google') => {
    if (!activeTrip) return;
    const isPickup = tripPhase === 'going_to_passenger' || tripPhase === 'arrived';
    const lat = isPickup ? activeTrip.originLat : activeTrip.destLat;
    const lng = isPickup ? activeTrip.originLng : activeTrip.destLng;
    
    let url = '';
    if (app === 'waze') {
      url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    }
    
    window.open(url, '_blank');
    setShowNavModal(false);
  };

  const checkActiveTrip = useCallback(async () => {
    try {
      const res = await api.get('/trips/active');
      if (res.data.trip) {
        const trip = res.data.trip;
        setActiveTrip(trip);
        if (trip.status === 'driver_assigned') {
          setTripPhase('going_to_passenger');
        } else if (trip.status === 'driver_arrived') {
          setTripPhase('arrived');
        } else if (trip.status === 'in_progress') {
          setTripPhase('in_progress');
        }
        if (trip.paymentStatus === 'requested') {
          setPaymentRequested(true);
          setCompletionOtpVerified(false);
        } else if (trip.paymentStatus === 'otp_verified') {
          setPaymentRequested(true);
          setCompletionOtpVerified(true);
        } else if (trip.paymentStatus === 'passenger_confirmed') {
          setPaymentRequested(true);
          setCompletionOtpVerified(true);
          setPassengerConfirmed(true);
        }
        if (trip.receiptUrl) {
          setReceiptUrl(trip.receiptUrl);
        }
        const socket = connectSocket();
        socket.emit('passenger:join-trip', { tripId: trip.id });
      } else {
        if (activeTripRef.current) {
          resetTrip();
        }
      }
    } catch (err) {
      console.error('Error fetching active trip in checkActiveTrip:', err);
    }
  }, [resetTrip]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Visibility] App en primer plano (Conductor). Sincronizando estado y socket...');
        forceReconnectSocket();
        checkActiveTrip();
      }
    };

    const handleFocus = () => {
      console.log('[Focus] Ventana enfocada (Conductor). Sincronizando estado y socket...');
      forceReconnectSocket();
      checkActiveTrip();
    };

    const handleResume = () => {
      console.log('[Resume] App reanudada desde segundo plano (Conductor). Sincronizando estado y socket...');
      forceReconnectSocket();
      checkActiveTrip();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('resume', handleResume);

    // Solicitar permisos de notificación al cargar inicialmente la página en cliente
    import('@/lib/notifications').then(({ requestNotificationPermission }) => {
      requestNotificationPermission().catch(() => {});
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('resume', handleResume);
    };
  }, [checkActiveTrip]);

  // Poll active trip state periodically as a fallback when a trip is active
  useEffect(() => {
    if (tripPhase === 'idle') return;

    const intervalId = setInterval(() => {
      console.log('[Poll] Conductor: Sincronizando estado del viaje activo...');
      checkActiveTrip();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }, [tripPhase, checkActiveTrip]);

  // Cargar datos del conductor
  useEffect(() => {
    const s = getSession();
    if (!s) { router.push('/login'); return; }
    setSession(s);

    // Inicializar Notificaciones Push para móviles
    initializePushNotifications();

    setFetchError(null);
    setLoadingTimeout(false);
    const timeoutId = setTimeout(() => {
      setLoadingTimeout(true);
    }, 7000);

    api.get('/drivers/me').then(r => {
      clearTimeout(timeoutId);
      setDriver(r.data.driver);
      setIsOnline(r.data.driver.isOnline);
      if (r.data.driver.lastLat && r.data.driver.lastLng) {
        setPos({ lat: r.data.driver.lastLat, lng: r.data.driver.lastLng });
      }
    }).catch(err => {
      clearTimeout(timeoutId);
      console.error('Error al obtener datos del conductor:', err);
      const status = err.response?.status;
      if (status === 401 || status === 403 || status === 404) {
        clearSession();
        router.push('/login');
      } else {
        setFetchError('No pudimos conectar con el servidor. Por favor, verifica tu conexión a internet e intenta nuevamente.');
      }
    });

    api.get('/trips/driver-trips').then(r => {
      const completedTrips = r.data.trips.filter((t: any) => t.status === 'completed');
      const sum = completedTrips.reduce((acc: number, t: any) => acc + t.estimatedPrice, 0);
      setTotalEarnings(sum);
    }).catch(() => { });

    checkActiveTrip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => clearTimeout(timeoutId);
  }, []);

  // GPS tracking
  useEffect(() => {
    if (!isOnline) return;

    let isCancelled = false;
    let cleanupFn: (() => void) | null = null;

    async function startTracking() {
      try {
        const { watchPosition } = await import('@/lib/geolocation');
        if (isCancelled) return;

        cleanupFn = await watchPosition(
          (newPos) => {
            setPos(newPos);
            const socket = connectSocket();
            socket.emit('driver:location', { driverId: session?.user?.id, ...newPos });
            api.post('/drivers/location', { lat: newPos.lat, lng: newPos.lng }).catch(() => { });
            setGpsError(null);
          },
          (err) => {
            console.warn('Driver watchPosition error:', err);
            setGpsError('Señal de GPS perdida o permisos desactivados. Activa la alta precisión para que tus pasajeros te vean.');
          }
        );
        geoRef.current = cleanupFn;
      } catch (err) {
        console.error('Error starting location tracking:', err);
      }
    }

    startTracking();

    return () => {
      isCancelled = true;
      if (cleanupFn) {
        cleanupFn();
      } else if (geoRef.current) {
        geoRef.current();
      }
      geoRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, session]);

  // Socket.io para recibir viajes
  useEffect(() => {
    if (!driver || driver.status !== 'active') return;
    // Para planes BLACK/FLEX requiere membershipPaid; COMFORT requiere haber pagado hoy
    if (!driver.membershipPaid && (driver.membershipPlan === 'BLACK' || driver.membershipPlan === 'FLEX')) return;
    if (!isOnline) return;

    const socket = connectSocket();
    const driverId = session?.user?.id;

    socket.emit('driver:online', { driverId, lat: posRef.current.lat, lng: posRef.current.lng });

    if (activeTrip?.id) {
      socket.emit('passenger:join-trip', { tripId: activeTrip.id });
    }

    socket.on('connect', () => {
      console.log('[Socket] Conductor conectado/reconectado. Consultando estado del viaje...');
      socket.emit('driver:online', { driverId, lat: posRef.current.lat, lng: posRef.current.lng });
      if (activeTripRef.current?.id) {
        socket.emit('passenger:join-trip', { tripId: activeTripRef.current.id });
      }
      checkActiveTrip();
    });

    socket.on('trip:request', ({ trip }: { trip: TripRequest }) => {
      setTripRequest(trip);
      setTimer(30);
      sendLocalNotification("¡Nueva Solicitud de Viaje!", `Tienes un viaje disponible por ${formatCLP(trip.estimatedPrice)}.`);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            socket.emit('driver:reject', { tripId: trip.id, driverId, originLat: trip.originLat, originLng: trip.originLng });
            setTripRequest(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });

    socket.on('trip:confirmed', ({ trip }: { trip: TripRequest }) => {
      setActiveTrip(trip);
      setTripPhase('going_to_passenger');
      setTripRequest(null);
      sendLocalNotification("¡Viaje Confirmado!", `Vas en camino a recoger a ${trip.passenger.name}.`);
    });

    socket.on('trip:started', (data?: { trip?: any }) => {
      if (!data?.trip?.id || (activeTripRef.current && data.trip.id === activeTripRef.current.id)) {
        setTripPhase('in_progress');
      }
    });

    socket.on('trip:passenger-confirmed-payment', (data: { tripId?: string; receiptUrl?: string }) => {
      console.log('[Socket] Pasajero confirmó pago', data);
      if (!data.tripId || (activeTripRef.current && data.tripId === activeTripRef.current.id)) {
        setPassengerConfirmed(true);
        if (data.receiptUrl) setReceiptUrl(data.receiptUrl);
        sendLocalNotification("Pago Recibido", "El pasajero ha confirmado el pago del viaje.");
      }
    });

    socket.on('trip:message', (msg: any) => {
      console.log('[Socket] Nuevo mensaje de chat recibido en conductor:', msg);
      if (activeTripRef.current && msg.tripId === activeTripRef.current.id) {
        setChatMessages(prev => [...prev, msg]);
        if (!showChatRef.current) {
          setUnreadCount(prev => prev + 1);
          sendLocalNotification(`Mensaje de ${msg.senderName}`, msg.text);
        }
      }
    });

    socket.on('trip:cancelled', (data: { tripId?: string; reason: string }) => {
      console.log('[Socket] Viaje cancelado por pasajero', data);
      const activeTripId = activeTripRef.current?.id;
      const requestTripId = tripRequestRef.current?.id;

      sendLocalNotification("Viaje Cancelado", `El pasajero canceló la solicitud: "${data.reason}".`);

      if (data.tripId && data.tripId === activeTripId) {
        setCancellationNotice({ 
          reason: data.reason,
          wasAccepted: true
        });
        resetTrip();
      } else if (data.tripId && data.tripId === requestTripId) {
        setCancellationNotice({ 
          reason: data.reason,
          wasAccepted: false
        });
        setTripRequest(null);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else if (!data.tripId) {
        setCancellationNotice({ 
          reason: data.reason,
          wasAccepted: !!activeTripRef.current
        });
        setTripRequest(null);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        resetTrip();
      } else {
        console.log(`[Socket] Cancelación de viaje ${data.tripId} ignorada por no corresponder al viaje activo (${activeTripId}) o solicitud (${requestTripId})`);
      }
    });

    socket.on('trip:completion-otp-verified', (data?: { trip?: any }) => {
      console.log('[Socket] Código de término verificado con éxito');
      setCompletionOtpVerified(true);
    });

    socket.on('trip:completion-otp-failed', (data: { message: string }) => {
      alert(data.message);
    });

    socket.on('error', (data: { message: string }) => {
      alert(data.message);
    });

    return () => {
      socket.off('connect');
      socket.off('trip:request');
      socket.off('trip:confirmed');
      socket.off('trip:started');
      socket.off('trip:passenger-confirmed-payment');
      socket.off('trip:message');
      socket.off('trip:cancelled');
      socket.off('trip:completion-otp-verified');
      socket.off('trip:completion-otp-failed');
      socket.off('error');
    };
  }, [driver?.id, driver?.status, driver?.membershipPaid, driver?.membershipPlan, isOnline, session?.user?.id, activeTrip?.id, checkActiveTrip]);

  const acceptTrip = () => {
    if (!tripRequest) return;
    const socket = connectSocket();
    socket.emit('driver:accept', { tripId: tripRequest.id, driverId: session?.user?.id });
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const rejectTrip = () => {
    if (!tripRequest) return;
    const socket = connectSocket();
    socket.emit('driver:reject', { tripId: tripRequest.id, driverId: session?.user?.id, originLat: tripRequest.originLat, originLng: tripRequest.originLng });
    setTripRequest(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const markArrived = () => {
    if (!activeTrip) return;
    const socket = connectSocket();
    socket.emit('driver:arrived', { tripId: activeTrip.id });
    setTripPhase('arrived');
  };

  const startTrip = (code: string) => {
    if (!activeTrip) return;
    if (!code || code.length < 4) {
      alert('Por favor ingresa el código de seguridad.');
      return;
    }
    const socket = connectSocket();
    socket.emit('driver:start-trip', { tripId: activeTrip.id, otpCode: code });
  };

  const handleRequestPayment = () => {
    if (!activeTrip) return;
    const confirmReq = confirm('¿Estás seguro de solicitar el pago al pasajero? Hazlo solo cuando hayas llegado al destino de forma segura.');
    if (!confirmReq) return;
    const socket = connectSocket();
    socket.emit('trip:request-payment', { tripId: activeTrip.id });
    setPaymentRequested(true);
    setCompletionOtpVerified(false);
  };

  const verifyCompletionOtp = (code: string) => {
    if (!activeTrip) return;
    if (!code || code.length < 4) {
      alert('Por favor ingresa el código de término.');
      return;
    }
    const socket = connectSocket();
    socket.emit('driver:verify-completion-otp', { tripId: activeTrip.id, otpCode: code });
  };

  const completeTrip = async () => {
    if (!activeTrip) return;
    const socket = connectSocket();
    socket.emit('trip:complete', { tripId: activeTrip.id });

    // Sum estimated price to totalEarnings locally for instant visual update
    const tripPrice = activeTrip.estimatedPrice;
    setTotalEarnings(prev => (prev !== null ? prev + tripPrice : tripPrice));

    resetTrip();

    // Refetch driver details and full trip list in background to sync with DB
    setTimeout(async () => {
      try {
        const dRes = await api.get('/drivers/me');
        setDriver(dRes.data.driver);

        const tRes = await api.get('/trips/driver-trips');
        const completedTrips = tRes.data.trips.filter((t: any) => t.status === 'completed');
        const sum = completedTrips.reduce((acc: number, t: any) => acc + t.estimatedPrice, 0);
        setTotalEarnings(sum);
      } catch (err) {
        console.error('Error refreshing driver stats:', err);
      }
    }, 800);
  };



  const handleToggleOnline = async () => {
    const newStatus = !isOnline;
    setLoading(true);

    if (newStatus && driver) {
      const now = new Date();
      if (driver.membershipPlan === 'BLACK' && !driver.membershipPaid) {
        setShowPaymentModal(true);
        setLoading(false);
        return;
      }
      if (driver.membershipPlan === 'FLEX') {
        const day = now.getDay();
        const isWeekend = day === 0 || day === 5 || day === 6;
        if (!isWeekend) {
          alert('La membresía FLEX solo te permite operar los días Viernes, Sábado y Domingo.');
          setLoading(false);
          return;
        }
        if (!driver.membershipPaid) {
          setShowPaymentModal(true);
          setLoading(false);
          return;
        }
      }
      if (driver.membershipPlan === 'COMFORT') {
        let paidToday = false;
        if (driver.comfortLastPaidAt) {
          const lastPaid = new Date(driver.comfortLastPaidAt);
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          paidToday = lastPaid >= todayStart;
        }
        if (!paidToday) {
          setShowPaymentModal(true);
          setLoading(false);
          return;
        }
      }
    }

    try {
      const res = await api.post('/drivers/toggle-online', { isOnline: newStatus });
      setIsOnline(res.data.isOnline);
      const socket = connectSocket();
      if (res.data.isOnline) {
        socket.emit('driver:online', { driverId: session?.user?.id, lat: posRef.current.lat, lng: posRef.current.lng });
      } else {
        socket.emit('driver:offline', { driverId: session?.user?.id });
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al cambiar estado');
    } finally {
      setLoading(false);
    }
  };

  const [showHistory, setShowHistory] = useState(false);
  const [mpLink, setMpLink] = useState('');

  useEffect(() => {
    if (driver?.mercadoPagoLink) setMpLink(driver.mercadoPagoLink);
  }, [driver]);

  const saveMPLink = async () => {
    try {
      await api.post('/drivers/payment-link', { mercadoPagoLink: mpLink });
      alert('Link de pago vinculado correctamente.');
      if (driver) {
        setDriver({ ...driver, mercadoPagoLink: mpLink });
      }
    } catch (err) {
      alert('Error al guardar el link.');
    }
  };

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  if (fetchError && !driver) return (
    <div className="status-screen">
      <div style={{ color: 'var(--danger)', marginBottom: '20px' }}>
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <h2>Error de conexión</h2>
      <p style={{ maxWidth: '300px', margin: '0 auto 20px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{fetchError}</p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Reintentar</button>
        <button className="btn btn-secondary" onClick={handleLogout}>Salir</button>
      </div>
    </div>
  );

  if (loadingTimeout && !driver) return (
    <div className="status-screen">
      <div style={{ color: 'var(--warning)', marginBottom: '20px' }}>
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <h2>La carga está tardando mucho</h2>
      <p style={{ maxWidth: '300px', margin: '0 auto 20px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Parece que la conexión con el servidor se ha demorado más de lo esperado o hay un problema al iniciar la app.</p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Reintentar</button>
        <button className="btn btn-secondary" onClick={handleLogout}>Cerrar sesión / Salir</button>
      </div>
    </div>
  );

  if (!driver) return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#09090f',
      gap: '16px'
    }}>
      <div className="spinner"></div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cargando perfil de conductor...</p>
    </div>
  );

  if (driver.status === 'pending') return (
    <div style={{ padding: '24px 16px', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', overflowY: 'auto', background: '#09090f', gap: '20px' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px 16px', width: '100%', maxWidth: '440px', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', margin: 'auto 0' }}>
        <div style={{ color: 'var(--warning)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, textAlign: 'center' }}>Tu cuenta está en revisión</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, textAlign: 'center', lineHeight: '1.5' }}>
          Estamos validando tus documentos de identidad y de tu vehículo. Mientras tanto, puedes realizar el pago de tu membresía.
        </p>

        {/* Pago de Membresía */}
        <div style={{ width: '100%', borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '10px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '12px', color: '#fff' }}>📋 Pago de Membresía</h3>
          
          {driver.membershipPlan === 'BLACK' && (
            <div style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.03))', border: '1px solid rgba(212,175,55,0.25)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#D4AF37', fontWeight: 900, fontSize: '0.85rem' }}>Plan BLACK</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>Pago Mensual Ilimitado</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#D4AF37', fontWeight: 900, fontSize: '1.1rem' }}>$150.000</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>/mes</div>
                </div>
              </div>
              {driver.membershipPaid ? (
                <div style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.8rem', textAlign: 'center', background: 'rgba(0,229,160,0.05)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(0,229,160,0.2)' }}>
                  ✓ Pago registrado con éxito. Esperando activación por el administrador.
                </div>
              ) : (
                <button 
                  className="btn btn-accent btn-block" 
                  onClick={handlePayMembership} 
                  disabled={payingMembership}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {payingMembership ? <span className="spinner-sm"></span> : 'Pagar con Mercado Pago'}
                </button>
              )}
            </div>
          )}

          {driver.membershipPlan === 'FLEX' && (
            <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.03))', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#34D399', fontWeight: 900, fontSize: '0.85rem' }}>Plan FLEX</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>Fin de Semana (Vie·Sáb·Dom)</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#34D399', fontWeight: 900, fontSize: '1.1rem' }}>$60.000</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>/fin de semana</div>
                </div>
              </div>
              {driver.membershipPaid ? (
                <div style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.8rem', textAlign: 'center', background: 'rgba(0,229,160,0.05)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(0,229,160,0.2)' }}>
                  ✓ Pago registrado con éxito. Esperando activación por el administrador.
                </div>
              ) : (
                <button 
                  className="btn btn-accent btn-block" 
                  onClick={handlePayMembership} 
                  disabled={payingMembership}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {payingMembership ? <span className="spinner-sm"></span> : 'Pagar con Mercado Pago'}
                </button>
              )}
            </div>
          )}

          {driver.membershipPlan === 'COMFORT' && (
            <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(59,130,246,0.03))', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#60A5FA', fontWeight: 900, fontSize: '0.85rem' }}>Plan COMFORT</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>Cuota Diaria de Operación</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#60A5FA', fontWeight: 900, fontSize: '1.1rem' }}>$20.000</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>/día</div>
                </div>
              </div>

              {driver.comfortLastPaidAt ? (
                <div style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.8rem', textAlign: 'center', background: 'rgba(0,229,160,0.05)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(0,229,160,0.2)' }}>
                  ✓ Primer pago diario subido con éxito. Esperando activación por el administrador.
                </div>
              ) : (
                <>
                  <button 
                    className="btn btn-accent btn-block" 
                    onClick={handlePayMembership} 
                    disabled={payingMembership}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    {payingMembership ? <span className="spinner-sm"></span> : 'Pagar con Mercado Pago'}
                  </button>
                  
                  <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: '1.4' }}>
                      O realiza transferencia bancaria y sube el comprobante:
                      <br /><strong>Banco:</strong> Banco Estado
                      <br /><strong>Tipo de Cuenta:</strong> Cuenta Corriente
                      <br /><strong>Número:</strong> 987654321
                      <br /><strong>RUT:</strong> 76.543.210-K
                      <br /><strong>Destinatario:</strong> Fim SpA
                      <br /><strong>Email:</strong> pagos@fim.cl
                    </div>
                    
                    <label style={{ display: 'block', background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border)', borderRadius: '8px', padding: '10px', textAlign: 'center', cursor: 'pointer', transition: 'var(--transition)' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)' }}>
                        {uploadingReceipt ? 'Subiendo comprobante...' : '📂 Subir Comprobante de Transferencia'}
                      </span>
                      <input type="file" accept="image/*" onChange={handleReceiptUpload} disabled={uploadingReceipt} style={{ display: 'none' }} />
                    </label>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <button className="btn btn-secondary btn-block" onClick={handleLogout}>Salir</button>
    </div>
  );

  return (
    <div className="app-container">
      <header className="app-header" style={{ alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
          <div
            className="logo-hover-container"
            onMouseEnter={() => setIsLogoHovered(true)}
            onMouseLeave={() => setIsLogoHovered(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <div className="logo" style={{ margin: 0 }}>Fim<span>.</span></div>

            <div style={{
              opacity: isLogoHovered ? 1 : 0,
              transform: isLogoHovered ? 'translateY(0)' : 'translateY(-6px)',
              pointerEvents: isLogoHovered ? 'auto' : 'none',
              transition: 'all 0.3s ease',
              background: 'var(--bg-glass)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--border-accent)',
              boxShadow: 'var(--shadow-accent)',
              padding: '6px 14px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: 'var(--accent)',
              whiteSpace: 'nowrap',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              alignItems: 'flex-start',
              zIndex: 1000,
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '8px'
            }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>Ve tus ganancias</span>
              <span style={{ lineHeight: 1.1 }}>Ganancias: {totalEarnings !== null ? formatCLP(totalEarnings) : '$0'}</span>
            </div>
          </div>

          {/* Nombre y Membresía del Conductor (debajo del logo) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
            {driver?.name && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap', lineHeight: 1 }}>
                {driver.name}
              </span>
            )}
            {driver?.membershipPlan && (
              <div 
                className={`seal-${driver.membershipPlan.toLowerCase()}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '0.58rem',
                  fontWeight: 950,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}
              >
                {driver.membershipPlan === 'BLACK' ? (
                  <>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
                      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
                      <path d="M3 20h18" />
                    </svg>
                    <span>Conductor BLACK</span>
                  </>
                ) : driver.membershipPlan === 'COMFORT' ? (
                  <>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span>Conductor COMFORT</span>
                  </>
                ) : (
                  <>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    <span>Conductor FLEX</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="header-status-badge" style={{
            padding: '4px 10px', background: isOnline ? 'rgba(0,229,160,0.1)' : 'rgba(255,255,255,0.05)',
            borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700,
            color: isOnline ? 'var(--accent)' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isOnline ? 'var(--accent)' : 'var(--text-muted)' }} />
            <span className="status-text">{isOnline ? 'EN LÍNEA' : 'DESCONECTADO'}</span>
          </div>
          <button className="btn btn-ghost" onClick={() => router.push('/driver/history')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <IconClock />
            <span className="btn-text">Historial</span>
          </button>
          <button className="btn btn-ghost" onClick={handleLogout} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <IconLogout />
            <span className="btn-text">Salir</span>
          </button>

        </div>
      </header>

      <main className="main-content">
        {driver && driver.taxPendingReview && (
          <div style={{
            background: 'rgba(0, 229, 160, 0.1)',
            borderBottom: '1px solid var(--accent)',
            padding: '10px 16px',
            fontSize: '0.78rem',
            textAlign: 'center',
            color: 'var(--accent)',
            fontWeight: 600,
            zIndex: 10
          }}>
            📋 Tu boleta de honorarios está siendo auditada por la administración. Puedes conducir con normalidad.
          </div>
        )}
        
        {/* HUD de GPS para el Conductor */}
        {gpsError && (
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            right: '16px',
            background: 'rgba(239, 68, 68, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 999,
            animation: 'fadeIn 0.3s ease'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <div style={{ flex: 1 }}>{gpsError}</div>
            <button 
              onClick={() => setGpsError(null)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ×
            </button>
          </div>
        )}

        <DriverMap
          driverPos={pos}
          passengerPos={(activeTrip && (tripPhase === 'going_to_passenger' || tripPhase === 'arrived')) ? { lat: activeTrip.originLat, lng: activeTrip.originLng } : null}
          destPos={(activeTrip && tripPhase === 'in_progress') ? { lat: activeTrip.destLat, lng: activeTrip.destLng } : null}
        />
      </main>

      {/* DASHBOARD INFERIOR */}
      {!tripRequest && !activeTrip && (
        <div className="bottom-sheet" style={bottomSheetStyle()}>
          <BottomSheetHandle />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>Hola, {driver.name}</h3>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(255, 193, 7, 0.1)',
                  border: '1px solid rgba(255, 193, 7, 0.2)',
                  padding: '2px 8px',
                  borderRadius: '100px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#FFC107'
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                  {driver.totalRating > 0 ? driver.totalRating.toFixed(1) : 'Nuevo'}
                </div>
                {driver.membershipPlan && (
                  <div className={`seal-${driver.membershipPlan.toLowerCase()}`} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.62rem',
                    fontWeight: 950,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {driver.membershipPlan === 'BLACK' ? (
                      <>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
                          <path d="M3 20h18" />
                        </svg>
                        <span>BLACK</span>
                      </>
                    ) : driver.membershipPlan === 'COMFORT' ? (
                      <>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <span>COMFORT</span>
                      </>
                    ) : (
                      <>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                        <span>FLEX</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                {driver.vehicleBrand} {driver.vehicleModel} · {driver.vehiclePlate} · {driver.totalTrips} {driver.totalTrips === 1 ? 'viaje' : 'viajes'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent)' }}>
                {formatCLP(totalEarnings !== null ? totalEarnings : 0)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>RECAUDACIÓN TOTAL</div>
            </div>
          </div>

          {!driver.mercadoPagoLink && (
            <div style={{ background: 'rgba(0,229,160,0.05)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--accent)', marginBottom: '20px' }}>
              <p style={{ fontSize: '0.85rem', marginBottom: '12px', fontWeight: 600 }}>¡Vincular Mercado Pago Connect!</p>
              <input
                type="text" className="form-input" placeholder="Pega tu link aquí..."
                value={mpLink} onChange={(e) => setMpLink(e.target.value)}
                style={{ marginBottom: '12px' }}
              />
              <button className="btn btn-accent btn-block" onClick={saveMPLink} disabled={!mpLink.includes('mercadopago')}>Vincular Cuenta</button>
            </div>
          )}

          {/* ─── PANEL DE MEMBRESÍA POR PLAN ─────────────────────────────── */}
          {driver.membershipPlan === 'BLACK' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.03))', border: '1px solid rgba(212,175,55,0.25)', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.3rem' }}>🖤</span>
                  <div>
                    <div style={{ color: '#D4AF37', fontWeight: 900, fontSize: '0.85rem' }}>Plan BLACK</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                      {driver.membershipPaid
                        ? driver.membershipExpiresAt
                          ? `Vence: ${new Date(driver.membershipExpiresAt).toLocaleDateString('es-CL')}`
                          : 'Activo ∞'
                        : '⚠️ Membresía no pagada'}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#D4AF37', fontWeight: 900, fontSize: '1rem' }}>$150.000</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem' }}>/mes</div>
                </div>
              </div>
              {!driver.membershipPaid && (
                <button
                  className="btn btn-accent btn-block"
                  onClick={handlePayMembership}
                  disabled={payingMembership}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {payingMembership ? <span className="spinner-sm"></span> : 'Pagar Membresía BLACK con Mercado Pago'}
                </button>
              )}
            </div>
          )}

          {driver.membershipPlan === 'COMFORT' && (() => {
            const lastPaid = driver.comfortLastPaidAt ? new Date(driver.comfortLastPaidAt) : null;
            const todayStart = new Date(); todayStart.setHours(0,0,0,0);
            const paidToday = lastPaid && lastPaid >= todayStart;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(59,130,246,0.03))', border: `1px solid ${!paidToday ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.25)'}`, borderRadius: '12px', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.3rem' }}>🟡</span>
                      <div>
                        <div style={{ color: '#60A5FA', fontWeight: 900, fontSize: '0.85rem' }}>Plan COMFORT</div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                          {paidToday ? '✅ Pagado hoy — puedes trabajar' : '⚠️ Debes pagar la cuota de hoy'}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#FBBF24', fontWeight: 900, fontSize: '1rem' }}>$20.000</div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem' }}>/día</div>
                    </div>
                  </div>
                  {(driver.comfortDebt || 0) > 0 && (
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.8rem', color: '#FCA5A5' }}>
                      ⚠️ Deuda acumulada: <strong>${(driver.comfortDebt || 0).toLocaleString('es-CL')}</strong> — Sube el comprobante o paga en línea para activarte.
                    </div>
                  )}
                </div>

                {!paidToday && (
                  <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px dashed var(--border)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                      className="btn btn-accent btn-block"
                      onClick={handlePayMembership}
                      disabled={payingMembership}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      {payingMembership ? <span className="spinner-sm"></span> : 'Pagar Cuota Diaria con Mercado Pago'}
                    </button>
                    
                    <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: '1.4' }}>
                        O transfiere a la cuenta de Fim SpA y sube el comprobante:
                        <br /><strong>Banco:</strong> Banco Estado | <strong>Cta Corriente:</strong> 987654321
                        <br /><strong>RUT:</strong> 76.543.210-K | <strong>Email:</strong> pagos@fim.cl
                      </div>
                      
                      <label style={{ display: 'block', background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border)', borderRadius: '8px', padding: '8px', textAlign: 'center', cursor: 'pointer', transition: 'var(--transition)' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)' }}>
                          {uploadingReceipt ? 'Subiendo comprobante...' : '📂 Subir Comprobante de Transferencia'}
                        </span>
                        <input type="file" accept="image/*" onChange={handleReceiptUpload} disabled={uploadingReceipt} style={{ display: 'none' }} />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {driver.membershipPlan === 'FLEX' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.03))', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.3rem' }}>🟢</span>
                  <div>
                    <div style={{ color: '#34D399', fontWeight: 900, fontSize: '0.85rem' }}>Plan FLEX</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                      {driver.membershipPaid
                        ? driver.membershipExpiresAt
                          ? `Vence: ${new Date(driver.membershipExpiresAt).toLocaleDateString('es-CL')}`
                          : 'Activo'
                        : '⚠️ Membresía no pagada'}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#34D399', fontWeight: 900, fontSize: '1rem' }}>$60.000</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem' }}>/fin de semana</div>
                </div>
              </div>
              {!driver.membershipPaid && (
                <button
                  className="btn btn-accent btn-block"
                  onClick={handlePayMembership}
                  disabled={payingMembership}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {payingMembership ? <span className="spinner-sm"></span> : 'Pagar Membresía FLEX con Mercado Pago'}
                </button>
              )}
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map((d, i) => {
                  const today = new Date().getDay();
                  const dayMap = [1,2,3,4,5,6,0];
                  const isToday = dayMap[i] === today;
                  const isActive = i >= 4;
                  return (
                    <div key={d} style={{ flex: 1, textAlign: 'center', padding: '6px 2px', borderRadius: '6px', fontSize: '0.62rem', fontWeight: 800,
                      background: isToday ? (isActive ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.2)') : (isActive ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)'),
                      color: isToday ? (isActive ? '#34D399' : '#FCA5A5') : (isActive ? '#34D399' : 'rgba(255,255,255,0.2)'),
                      border: `1px solid ${isToday ? (isActive ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.3)') : 'transparent'}`,
                    }}>
                      {d}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button
            className={`btn btn-block btn-lg ${isOnline ? 'btn-danger' : 'btn-primary'}`}
            onClick={handleToggleOnline}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-sm" style={{ borderLeftColor: 'transparent', margin: '0 auto', display: 'inline-block' }}></span>
            ) : isOnline ? (
              'Desconectarse'
            ) : (
              'Ponerse en línea'
            )}
          </button>
        </div>
      )}

      {/* SOLICITUD ENTRANTE */}
      {tripRequest && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(9, 9, 15, 0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '380px',
            background: '#12121e',
            border: '2px solid rgba(49, 130, 206, 0.5)',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(49, 130, 206, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            color: '#FFFFFF',
            position: 'relative'
          }}>

            {/* Header Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{
                  background: '#E2E8F0',
                  color: '#1A202C',
                  padding: '6px 12px',
                  borderRadius: '100px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  Fim Priority
                </div>
                <div style={{
                  background: 'rgba(49, 130, 206, 0.25)',
                  color: '#63B3ED',
                  padding: '6px 12px',
                  borderRadius: '100px',
                  fontSize: '0.78rem',
                  fontWeight: 800
                }}>
                  Exclusivo
                </div>
              </div>
              <button
                onClick={rejectTrip}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#A0AEC0',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
              >
                ✕
              </button>
            </div>

            {/* Price display */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px', textAlign: 'left' }}>
              <div style={{ fontSize: '0.8rem', color: '#A0AEC0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tarifa Base (100% para ti)
              </div>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-1px', lineHeight: '1' }}>
                {formatCLP(tripRequest.estimatedPrice)}
              </div>
              {tripRequest.paymentMethod === 'card' ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 700, marginTop: '4px' }}>
                  💳 Tarjeta (Pasajero paga bruto {formatCLP(tripRequest.estimatedPrice * 1.0319)} para cubrir comisión de Mercado Pago)
                </div>
              ) : (
                <div style={{ fontSize: '0.78rem', color: '#63B3ED', fontWeight: 700, marginTop: '4px' }}>
                  💵 Efectivo (Pasajero paga {formatCLP(tripRequest.estimatedPrice)})
                </div>
              )}
              <div style={{ fontSize: '0.72rem', color: '#CBD5E0', marginTop: '4px', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '6px', borderLeft: '2px solid var(--accent)' }}>
                <strong>Retención sugerida Renta (15.25% SII):</strong> -{formatCLP(tripRequest.estimatedPrice * 0.1525)} · Estimado Líquido: {formatCLP(tripRequest.estimatedPrice * (1 - 0.1525))}
              </div>
            </div>

            {/* Verification Badge */}
            <div style={{ marginBottom: '14px', textAlign: 'left' }}>
              <div style={{
                background: 'rgba(66, 153, 225, 0.12)',
                color: '#63B3ED',
                padding: '6px 12px',
                borderRadius: '100px',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid rgba(66, 153, 225, 0.2)'
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                Carnet de identidad verificado
              </div>
            </div>

            {/* Sub-header pills row */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.06)', color: '#E2E8F0', padding: '5px 12px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 600 }}>
                {tripRequest.paymentMethod === 'card' ? 'Pago con tarjeta' : 'Pago en efectivo'}
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.06)', color: '#E2E8F0', padding: '5px 12px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#ECC94B' }}>★</span> {(4.7 + (tripRequest.passenger.name.charCodeAt(0) % 4) * 0.1).toFixed(2).replace('.', ',')}
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.06)', color: '#E2E8F0', padding: '5px 12px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 600 }}>
                {tripRequest.passenger.name}
              </div>
            </div>

            {/* Promo/Incentive row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#CBD5E0',
              fontSize: '0.82rem',
              marginBottom: '20px',
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '12px',
              border: '1px dashed rgba(255,255,255,0.08)',
              textAlign: 'left'
            }}>
              <span style={{ color: '#F6AD55', fontSize: '1rem' }}>✪</span>
              <span><strong>+{formatCLP(tripRequest.estimatedPrice * 0.1)}</strong> por inicio de viaje prioritario</span>
            </div>

            {/* Separator */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px' }} />

            {/* Route Timeline */}
            <div style={{ display: 'flex', gap: '14px', marginBottom: '24px', position: 'relative' }}>
              {/* Vertical timeline bar */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '12px' }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  border: '2px solid #3182CE',
                  borderRadius: '50%',
                  background: '#12121e',
                  zIndex: 2,
                  marginTop: '4px'
                }} />
                <div style={{
                  width: '2px',
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.15)',
                  margin: '4px 0'
                }} />
                <div style={{
                  width: '10px',
                  height: '10px',
                  background: '#ECC94B',
                  borderRadius: '2px',
                  zIndex: 2,
                  marginBottom: '12px'
                }} />
              </div>

              {/* Addresses details */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                {/* Pickup Address */}
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#A0AEC0', fontWeight: 600, marginBottom: '2px' }}>
                    A 2 min ({tripRequest.driverDistance.toFixed(1)} km)
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 500, color: '#E2E8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px' }}>
                    {tripRequest.originAddress}
                  </div>
                </div>

                {/* Destination Address */}
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#A0AEC0', fontWeight: 600, marginBottom: '2px' }}>
                    Viaje: {tripRequest.durationMin} min ({tripRequest.distanceKm.toFixed(1)} km)
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 500, color: '#ECC94B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>⚠️</span> {tripRequest.destAddress}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={rejectTrip}
                style={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 69, 96, 0.4)',
                  background: 'rgba(255, 69, 96, 0.1)',
                  color: '#FF4560',
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Rechazar
              </button>
              <button
                onClick={acceptTrip}
                style={{
                  flex: 2,
                  padding: '16px',
                  borderRadius: '14px',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: `linear-gradient(to right, #3182CE ${(timer / 30) * 100}%, #1E293B ${(timer / 30) * 100}%)`,
                  boxShadow: '0 4px 15px rgba(49, 130, 206, 0.4)'
                }}
              >
                Aceptar ({timer}s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIAJE ACTIVO */}
      {activeTrip && (
        <div className="bottom-sheet animate-slide-up" style={bottomSheetStyle()}>
          <BottomSheetHandle />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="driver-avatar">{activeTrip.passenger.name[0]}</div>
              <div>
                <div style={{ fontWeight: 800 }}>{activeTrip.passenger.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pasajero</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setShowNavModal(true)}
                style={{
                  borderRadius: '12px',
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--accent)',
                  background: '#1A1A28',
                  border: '1px solid var(--border-accent)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.background = '#222235';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = '#1A1A28';
                }}
              >
                <IconCompass />
                <span>Navegar</span>
              </button>

              {tripPhase !== 'in_progress' && (
                <button
                  onClick={() => setShowChat(true)}
                  style={{
                    borderRadius: '50%',
                    width: '42px',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00E5A0',
                    background: '#1A1A28',
                    border: '1px solid rgba(0, 229, 160, 0.3)',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.background = '#222235';
                    e.currentTarget.style.borderColor = '#00E5A0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = '#1A1A28';
                    e.currentTarget.style.borderColor = 'rgba(0, 229, 160, 0.3)';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00E5A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  {unreadCount > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: 'var(--danger)',
                      color: 'white',
                      borderRadius: '50%',
                      minWidth: '18px',
                      height: '18px',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 8px rgba(255, 69, 96, 0.6)'
                    }}>
                      {unreadCount}
                    </div>
                  )}
                </button>
              )}
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {tripPhase === 'going_to_passenger' ? 'Recogida' : 'Destino'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 700 }}>
                <IconClock /> {formatDuration(activeTrip.durationMin)}
              </div>
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
              {tripPhase === 'going_to_passenger' ? activeTrip.originAddress : activeTrip.destAddress}
            </div>
          </div>

          {tripPhase === 'going_to_passenger' && (
            <button className="btn btn-primary btn-block btn-lg" onClick={markArrived}>He llegado</button>
          )}

          {tripPhase === 'arrived' && (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', textAlign: 'center' }}>Pide el código al pasajero para iniciar:</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text" className="form-input" placeholder="CÓDIGO"
                  value={otp} onChange={(e) => setOtp(e.target.value)}
                  style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '4px', fontWeight: 900 }}
                />
                <button className="btn btn-accent" onClick={() => startTrip(otp)}>INICIAR</button>
              </div>
            </div>
          )}

          {tripPhase === 'in_progress' && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              {!paymentRequested ? (
                <div style={{ textAlign: 'center' }}>
                  <button
                    className="btn btn-primary btn-block btn-lg"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    onClick={handleRequestPayment}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                    Solicitar Pago ({activeTrip.paymentMethod === 'card' ? `${formatCLP(activeTrip.estimatedPrice * 1.0319)} MP` : `${formatCLP(activeTrip.estimatedPrice)} Efec.`})
                  </button>
                  <div style={{ 
                    marginTop: '12px', 
                    fontSize: '0.8rem', 
                    color: 'var(--text-muted)',
                    background: 'rgba(255,255,255,0.02)',
                    padding: '10px',
                    borderRadius: 'var(--radius)',
                    textAlign: 'left',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Tarifa base del viaje (100% líquida):</span>
                      <span style={{ fontWeight: 700, color: 'white' }}>{formatCLP(activeTrip.estimatedPrice)}</span>
                    </div>
                    {activeTrip.paymentMethod === 'card' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: 'var(--accent)' }}>
                        <span>Recargo Comisión Mercado Pago (+3.19%):</span>
                        <span>+{formatCLP(activeTrip.estimatedPrice * 0.0319)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#E2E8F0', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '4px', marginTop: '4px' }}>
                      <span>Retención sugerida Impuesto Renta (15.25% SII):</span>
                      <span style={{ color: 'var(--danger)' }}>-{formatCLP(activeTrip.estimatedPrice * 0.1525)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, marginTop: '2px', color: 'var(--accent)' }}>
                      <span>Estimado Líquido final:</span>
                      <span>{formatCLP(activeTrip.estimatedPrice * 0.8475)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ animation: 'fadeIn 0.4s' }}>
                  {!completionOtpVerified ? (
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '16px', borderRadius: 'var(--radius)', marginBottom: '16px' }}>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px', textAlign: 'center', fontWeight: 600 }}>
                        Pide el código de término al pasajero para habilitar el pago:
                      </p>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                          type="text" className="form-input" placeholder="CÓDIGO"
                          value={completionOtp} onChange={(e) => setCompletionOtp(e.target.value)}
                          style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '4px', fontWeight: 900 }}
                        />
                        <button className="btn btn-accent" onClick={() => verifyCompletionOtp(completionOtp)}>VERIFICAR</button>
                      </div>
                    </div>
                  ) : !passengerConfirmed ? (
                    <div style={{ background: 'rgba(255,184,0,0.1)', border: '1px solid var(--warning)', padding: '16px', borderRadius: 'var(--radius)', marginBottom: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--warning)', fontWeight: 800, fontSize: '0.9rem', marginBottom: '8px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        ESPERANDO PAGO...
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px', borderTop: '1px solid rgba(255,184,0,0.2)', paddingTop: '8px' }}>
                        Monto a cobrar al pasajero:
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--warning)', marginTop: '4px' }}>
                          {formatCLP(activeTrip.paymentMethod === 'card' ? activeTrip.estimatedPrice * 1.0319 : activeTrip.estimatedPrice)}
                        </div>
                        <span style={{ fontSize: '0.75rem', opacity: 0.8, color: 'var(--text-muted)' }}>
                          {activeTrip.paymentMethod === 'card' 
                            ? '(Incluye 3.19% comisión Mercado Pago)' 
                            : '(Pago en Efectivo)'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: 'rgba(0,229,160,0.1)', border: '2px solid var(--accent)', padding: '16px', borderRadius: 'var(--radius)', marginBottom: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 800, fontSize: '1rem' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        ¡PAGO CONFIRMADO!
                      </div>
                      {receiptUrl && (
                        <button onClick={() => window.open(receiptUrl, '_blank')} style={{ marginTop: '10px', border: 'none', background: 'none' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={receiptUrl} alt="Comprobante" style={{ width: '120px', height: '70px', objectFit: 'cover', borderRadius: '4px' }} />
                        </button>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button className={`btn btn-block btn-lg ${passengerConfirmed ? 'btn-primary' : 'btn-secondary'}`} onClick={() => {
                      if (!passengerConfirmed) {
                        if (!confirm("El pasajero no ha confirmado. ¿Cerrar manual?")) return;
                      }
                      completeTrip();
                    }}>
                      {passengerConfirmed ? 'Verificar y Finalizar' : 'Cerrar Manual (Sin Confirmación)'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL DE CHAT EN VIVO */}
      {showChat && activeTrip && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(9, 9, 15, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '440px',
            height: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden'
          }}>
            {/* Header del Chat */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.02)'
            }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Chat con Pasajero</h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Viaje activo · Seguro y directo</p>
              </div>
              <button
                onClick={() => setShowChat(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            {/* Mensajes del Chat */}
            <div style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {chatMessages.length === 0 ? (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  padding: '40px'
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px', opacity: 0.5 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  <p style={{ fontSize: '0.85rem' }}>Escribe un mensaje para coordinar la recogida o detalles del viaje.</p>
                </div>
              ) : (
                chatMessages.map((m, i) => {
                  const isMe = m.senderId === session?.user?.id;
                  return (
                    <div
                      key={i}
                      style={{
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div style={{
                        background: isMe ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                        color: isMe ? '#09090F' : 'var(--text-primary)',
                        padding: '10px 14px',
                        borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        lineHeight: 1.4,
                        boxShadow: isMe ? 'var(--shadow-accent)' : 'none'
                      }}>
                        {m.text}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {new Date(m.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input del Chat */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!chatInput.trim()) return;
                const socket = connectSocket();
                socket.emit('trip:message', {
                  tripId: activeTrip.id,
                  senderId: session?.user?.id,
                  senderName: driver ? driver.name : activeTrip.passenger.name,
                  text: chatInput
                });
                setChatInput('');
              }}
              style={{
                padding: '16px 20px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                gap: '10px',
                background: 'rgba(255,255,255,0.01)'
              }}
            >
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                style={{
                  flex: 1,
                  background: '#1A1A28',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  color: 'white',
                  padding: '10px 16px',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  color: '#09090F',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontWeight: 900
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              </button>
            </form>
          </div>
        </div>
      )}
      {driver && !driver.taxCompliant && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(9, 9, 15, 0.95)',
          backdropFilter: 'blur(15px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div className="card animate-scale-in" style={{ width: '100%', maxWidth: '400px', border: '1px solid var(--border-accent)', background: '#0D0D15' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>⚖️</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', marginBottom: '8px' }}>Cumplimiento Tributario</h2>
              <span className="badge badge-danger" style={{ fontSize: '0.85rem' }}>CUENTA SUSPENDIDA TEMPORALMENTE</span>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '20px' }}>
              Para continuar conduciendo en Fim y cumplir con la legislación del <strong>SII de Chile (Año Tributario 2026)</strong>, debes emitir y subir tu <strong>Boleta de Honorarios Electrónica</strong> correspondiente a tus ganancias acumuladas.
            </p>

            <div style={{ 
              background: 'rgba(255, 255, 255, 0.02)', 
              border: '1px solid var(--border)', 
              padding: '12px 16px', 
              borderRadius: 'var(--radius)', 
              marginBottom: '24px' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Ganancias del período:</span>
                <strong style={{ color: 'white' }}>{formatCLP(totalEarnings || 0)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Retención sugerida (15.25%):</span>
                <strong style={{ color: 'var(--danger)' }}>{formatCLP((totalEarnings || 0) * 0.1525)}</strong>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'center' }}>Sube tu boleta en formato PDF o imagen:</p>
              <label style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '16px', border: '2px dashed var(--border)', borderRadius: 'var(--radius)',
                cursor: 'pointer', color: taxDocumentUrl ? 'var(--accent)' : 'var(--text-muted)',
                background: taxDocumentUrl ? 'rgba(0,229,160,0.05)' : 'transparent',
                transition: 'var(--transition)'
              }}>
                <input type="file" hidden accept="image/*,application/pdf" onChange={handleUploadTaxDocument} />
                {taxUploading ? 'Subiendo y verificando...' : taxDocumentUrl ? <><IconCheck /> Boleta cargada</> : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700 }}>
                    📁 Seleccionar Archivo
                  </span>
                )}
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="btn btn-accent btn-block" onClick={() => setShowTaxGuide(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span>📖</span> Guía: Cómo Emitir Boleta SII
              </button>
              <button className="btn btn-secondary btn-block" onClick={handleLogout}>Cerrar Sesión</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE GUÍA TRIBUTARIA SII */}
      {showTaxGuide && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(9, 9, 15, 0.92)',
          backdropFilter: 'blur(15px)',
          zIndex: 11000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="card animate-scale-in" style={{ 
            width: '100%', 
            maxWidth: '500px', 
            maxHeight: '90vh', 
            overflowY: 'auto', 
            border: '1px solid var(--border-accent)', 
            background: '#0D0D15',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white', margin: 0 }}>📖 Guía SII: Cómo Emitir Boleta</h3>
              <button className="btn btn-ghost" onClick={() => setShowTaxGuide(false)} style={{ padding: '4px 8px' }}>Cerrar</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              <div style={{ background: 'rgba(0,229,160,0.05)', border: '1px solid rgba(0,229,160,0.2)', padding: '12px 14px', borderRadius: 'var(--radius)', color: 'white' }}>
                💡 <strong>¿Por qué debo hacer esto?</strong><br />
                En Chile, el transporte terrestre de pasajeros está exento de IVA (19%), pero como conductor debes declarar tus ingresos para el Impuesto a la Renta. Para el año 2026, la retención es de <strong>15.25%</strong> sobre tus ganancias netas de la plataforma.
              </div>

              <div>
                <strong style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>Paso 1: Tener Inicio de Actividades en el SII</strong>
                <ol style={{ margin: '6px 0 0 20px', padding: 0 }}>
                  <li>Ingresa a <a href="https://www.sii.cl" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>sii.cl</a> con tu Clave Tributaria o Clave Única.</li>
                  <li>Ve a <strong>Servicios Online</strong> &gt; <strong>Rut e Inicio de Actividades</strong> &gt; <strong>Inicio de Actividades</strong>.</li>
                  <li>Declara el código de actividad: <strong>492230</strong> (Servicios de transporte de pasajeros por carretera).</li>
                </ol>
              </div>

              <div>
                <strong style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>Paso 2: Emitir tu Boleta de Honorarios mensual</strong>
                <ol style={{ margin: '6px 0 0 20px', padding: 0 }}>
                  <li>Ve a <strong>Servicios Online</strong> &gt; <strong>Boletas de Honorarios Electrónicas</strong> &gt; <strong>Emisor de Boletas</strong>.</li>
                  <li>Elige la opción: <strong>"El propio emisor se encargará de declarar y pagar el impuesto (15.25%)"</strong>.</li>
                  <li>Completa los datos usando el monto de tus ganancias brutas acumuladas que te indica tu panel de Fim.</li>
                  <li>Descarga la boleta en formato PDF.</li>
                </ol>
              </div>

              <div>
                <strong style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>Paso 3: Carga la Boleta en Fim</strong>
                <p style={{ margin: '4px 0 0 0' }}>
                  Selecciona el archivo PDF o imagen de la boleta recién emitida y súbela en esta pantalla. Tu cuenta se reactivará de forma inmediata.
                </p>
              </div>
            </div>
            
            <button className="btn btn-accent btn-block" onClick={() => setShowTaxGuide(false)} style={{ marginTop: '24px' }}>Entendido, continuar</button>
          </div>
        </div>
      )}

      {cancellationNotice && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(9, 9, 15, 0.9)',
          backdropFilter: 'blur(12px)',
          zIndex: 12000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          animation: 'fadeIn 0.25s ease'
        }}>
          <div className="card animate-scale-in" style={{ width: '100%', maxWidth: '400px', border: '1px solid var(--border-accent)', background: '#0D0D15', padding: '24px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>⚠️</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', marginBottom: '8px' }}>Viaje Cancelado</h2>
              <span className="badge badge-danger" style={{ fontSize: '0.85rem', background: 'rgba(255, 69, 96, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)', padding: '4px 10px', borderRadius: '100px', fontWeight: 700 }}>
                EL PASAJERO CANCELÓ EL VIAJE
              </span>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '20px', textAlign: 'center' }}>
              El pasajero ha decidido cancelar este viaje por el siguiente motivo:
            </p>

            <div style={{ 
              background: 'rgba(255, 69, 96, 0.05)', 
              border: '1px solid rgba(255, 69, 96, 0.2)', 
              padding: '16px', 
              borderRadius: 'var(--radius)', 
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              <strong style={{ color: 'white', fontSize: '1rem' }}>"{cancellationNotice.reason}"</strong>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '24px', lineHeight: '1.4' }}>
              Por favor no te acerques al punto de recogida. Tu panel se ha restablecido a modo disponible.
            </p>

            <button className="btn btn-accent btn-block btn-lg" onClick={() => setCancellationNotice(null)}>
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE SELECCIÓN DE NAVEGACIÓN EXTERNA */}
      {showNavModal && activeTrip && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(9, 9, 15, 0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.25s ease'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '360px',
            background: 'var(--bg-secondary, #12121e)',
            border: '1px solid var(--border-accent, rgba(0, 229, 160, 0.3))',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: 'var(--shadow-lg, 0 10px 40px rgba(0, 0, 0, 0.6))',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>Selecciona tu Navegador</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted, #a0aec0)' }}>
              ¿Con qué aplicación deseas seguir la ruta al {tripPhase === 'going_to_passenger' || tripPhase === 'arrived' ? 'punto de recogida' : 'destino'}?
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={() => handleNavigate('google')}
                className="btn btn-block btn-lg"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  borderRadius: '12px',
                  padding: '14px 20px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Google Maps
              </button>

              <button
                onClick={() => handleNavigate('waze')}
                className="btn btn-block btn-lg"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  borderRadius: '12px',
                  padding: '14px 20px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#33CCFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                Waze
              </button>
            </div>
            
            <button
              onClick={() => setShowNavModal(false)}
              className="btn btn-secondary btn-block"
              style={{ marginTop: '8px', cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE PAGO FLOTANTE AL PRESIONAR "PONERSE EN LÍNEA" */}
      {showPaymentModal && driver && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(9, 9, 15, 0.9)',
          backdropFilter: 'blur(12px)',
          zIndex: 11000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.25s ease'
        }}>
          <div className="card animate-scale-in" style={{ 
            width: '100%', 
            maxWidth: '440px', 
            maxHeight: '90vh', 
            overflowY: 'auto', 
            border: '1px solid var(--border-accent, rgba(0, 229, 160, 0.3))', 
            background: '#0D0D15',
            padding: '24px',
            borderRadius: '20px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white', margin: 0 }}>💳 Pago de Membresía requerido</h3>
              <button 
                onClick={() => setShowPaymentModal(false)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem', fontWeight: 'bold' }}
              >
                ×
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '20px' }}>
              Debes estar al día con tu membresía para poder ponerte en línea y recibir solicitudes de viajes.
            </p>

            {driver.membershipPlan === 'BLACK' && (
              <div style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.03))', border: '1px solid rgba(212,175,55,0.25)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#D4AF37', fontWeight: 900, fontSize: '0.85rem' }}>Plan BLACK</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>Pago Mensual Ilimitado</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#D4AF37', fontWeight: 900, fontSize: '1.1rem' }}>$150.000</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>/mes</div>
                  </div>
                </div>
                <button 
                  className="btn btn-accent btn-block" 
                  onClick={handlePayMembership} 
                  disabled={payingMembership}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {payingMembership ? <span className="spinner-sm"></span> : 'Pagar con Mercado Pago'}
                </button>
              </div>
            )}

            {driver.membershipPlan === 'FLEX' && (
              <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.03))', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#34D399', fontWeight: 900, fontSize: '0.85rem' }}>Plan FLEX</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>Fin de Semana (Vie·Sáb·Dom)</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#34D399', fontWeight: 900, fontSize: '1.1rem' }}>$60.000</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>/fin de semana</div>
                  </div>
                </div>
                <button 
                  className="btn btn-accent btn-block" 
                  onClick={handlePayMembership} 
                  disabled={payingMembership}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {payingMembership ? <span className="spinner-sm"></span> : 'Pagar con Mercado Pago'}
                </button>
              </div>
            )}

            {driver.membershipPlan === 'COMFORT' && (
              <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(59,130,246,0.03))', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: '#60A5FA', fontWeight: 900, fontSize: '0.85rem' }}>Plan COMFORT</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>Cuota Diaria de Operación</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#60A5FA', fontWeight: 900, fontSize: '1.1rem' }}>$20.000</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>/día</div>
                  </div>
                </div>

                <button 
                  className="btn btn-accent btn-block" 
                  onClick={handlePayMembership} 
                  disabled={payingMembership}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {payingMembership ? <span className="spinner-sm"></span> : 'Pagar con Mercado Pago'}
                </button>
                
                <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: '1.4' }}>
                    O realiza transferencia bancaria y sube el comprobante:
                    <br /><strong>Banco:</strong> Banco Estado | <strong>Cta Corriente:</strong> 987654321
                    <br /><strong>RUT:</strong> 76.543.210-K | <strong>Destinatario:</strong> Fim SpA
                    <br /><strong>Email:</strong> pagos@fim.cl
                  </div>
                  
                  <label style={{ display: 'block', background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border)', borderRadius: '8px', padding: '10px', textAlign: 'center', cursor: 'pointer', transition: 'var(--transition)' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)' }}>
                      {uploadingReceipt ? 'Subiendo comprobante...' : '📂 Subir Comprobante de Transferencia'}
                    </span>
                    <input type="file" accept="image/*" onChange={(e) => { handleReceiptUpload(e); setShowPaymentModal(false); }} disabled={uploadingReceipt} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
            )}

            <button className="btn btn-secondary btn-block" onClick={() => setShowPaymentModal(false)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
