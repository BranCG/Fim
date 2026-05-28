'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import api, { formatCLP, calculatePrice, clearSession, getSession, roundCLP } from '@/lib/api';
import { connectSocket, getSocket, forceReconnectSocket } from '@/lib/socket';
import { sendLocalNotification, initializePushNotifications } from '@/lib/notifications';

// Leaflet solo en cliente (SSR incompatible)
const PassengerMap = dynamic(() => import('@/components/map/PassengerMap'), { ssr: false });

type TripStatus =
  | 'idle'
  | 'selecting_dest'
  | 'confirm'
  | 'searching'
  | 'driver_assigned'
  | 'driver_arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

interface Trip {
  id: string;
  otpCode?: string;
  estimatedPrice?: number;
}

interface Location { lat: number; lng: number; address: string; }
interface Driver {
  id: string; name: string; phone: string;
  vehicleBrand: string; vehicleModel: string; vehiclePlate: string; vehiclePhotoUrl: string;
  totalRating: number; totalTrips: number;
  lastLat: number; lastLng: number;
  mercadoPagoLink: string | null;
  membershipPlan?: 'BLACK' | 'COMFORT' | 'FLEX';
}

// Santiago, Chile centro
const SANTIAGO_CENTER = { lat: -33.4489, lng: -70.6693 };

// --- ICONOS SVG ---
const IconClock = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconX = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconCar = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="13" width="22" height="8" rx="2"/><path d="M17 13l-1.5-6h-7L7 13"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>;
const IconPin = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconStar = ({ filled }: { filled?: boolean }) => <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "var(--warning)" : "none"} stroke={filled ? "none" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IconSearch = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconCheck = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconPhone = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const IconAlert = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconCash = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>;
const IconCard = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const IconParty = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4.5l9 9 3.5-4.5-9-9-3.5 4.5z"/><path d="M13 13.5l2 2.5 5-5-2-2.5-5 5z"/><path d="M15 15.5l4.5 4.5.5-1.5 1.5.5-4.5-4.5-.5 1.5-1.5-.5z"/><path d="M21 21l-9-9"/><path d="M18 11l.5.5"/><path d="M19 10l.5.5"/></svg>;
const IconLogout = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;
const IconUser = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;


// Helper to format Nominatim response into a clean Chilean address format (e.g. "Calle 123, Comuna")
function formatNominatimAddress(item: any, currentQuery?: string) {
  const addr = item.address;
  
  // Detect street name
  let road = '';
  let houseNumber = '';
  
  if (addr) {
    road = addr.road || addr.pedestrian || addr.footway || addr.cycleway || addr.path || '';
    houseNumber = addr.house_number || '';
  }
  
  if (!road) {
    road = item.display_name.split(',')[0];
  }

  let roadClean = road.trim();
  // Prepend "Pasaje " if it is a living_street (or pedestrian in residential areas) and lacks a prefix
  if ((item.type === 'living_street' || item.type === 'pedestrian') && !/^(pasaje|calle|av\.|avenida|psje)/i.test(roadClean)) {
    roadClean = `Pasaje ${roadClean}`;
  }

  // If the road doesn't have a house number from Nominatim, but the user typed one, try to extract it
  if (!houseNumber && currentQuery) {
    // Buscar un número (posiblemente seguido de letra o sufijo, ej. 9701) en la consulta
    const queryNumbers = currentQuery.match(/\b\d+\b/g);
    if (queryNumbers && queryNumbers.length > 0) {
      // Usar el último número en la consulta como número de casa
      const candidateNumber = queryNumbers[queryNumbers.length - 1];
      // Asegurarse de que el nombre de la calle no contenga ya este número
      if (!roadClean.includes(candidateNumber)) {
        houseNumber = candidateNumber;
      }
    }
  }

  let title = roadClean;
  if (houseNumber) {
    title += ` ${houseNumber}`;
  }

  // Detect comuna (represented by suburb, city_district, neighbourhood, town, city)
  let comuna = '';
  if (addr) {
    comuna = addr.suburb || addr.neighbourhood || addr.city_district || addr.town || addr.city || addr.village || '';
    if (comuna === road) {
      comuna = addr.city || addr.municipality || '';
    }
  }

  const subtitleParts: string[] = [];
  if (comuna && comuna !== road) {
    subtitleParts.push(comuna);
  }
  
  if (addr) {
    const state = addr.state || '';
    const stateClean = state.replace('Región Metropolitana de Santiago', 'RM').replace('Región Metropolitana', 'RM');
    if (stateClean && !subtitleParts.includes(stateClean)) {
      subtitleParts.push(stateClean);
    }
  }

  return {
    title: title.trim(),
    subtitle: subtitleParts.join(', ').trim() || 'Santiago',
  };
}


// Haversine distance in km
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Radio de la tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function estimateDuration(distanceKm: number): number {
  const avgSpeedKmh = 25;
  return Math.ceil((distanceKm / avgSpeedKmh) * 60);
}

export default function PassengerPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeMsg, setPasswordChangeMsg] = useState('');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<'success' | 'error' | ''>('');

  const [status, setStatus] = useState<TripStatus>('idle');
  const [origin, setOrigin] = useState<Location | null>(null);
  const [dest, setDest] = useState<Location | null>(null);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [durationMin, setDurationMin] = useState(0);

  // Búsqueda de direcciones
  const [searchQuery, setSearchQuery] = useState('');
  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [activeField, setActiveField] = useState<'origin' | 'dest' | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentCommune, setCurrentCommune] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  const [finalPrice, setFinalPrice] = useState(0);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingDone, setRatingDone] = useState(false);
  const [error, setError] = useState('');
  const [centerTrigger, setCenterTrigger] = useState(0);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedCancelOption, setSelectedCancelOption] = useState('');
  const [customCancelReason, setCustomCancelReason] = useState('');

  const [isMinimized, setIsMinimized] = useState(false);

  // Reset minimize state when status changes
  useEffect(() => {
    setIsMinimized(false);
  }, [status]);

  // Helper styles to support collapsing/minimizing bottom sheets smoothly
  const bottomSheetStyle = (customStyle: React.CSSProperties = {}): React.CSSProperties => ({
    transform: isMinimized ? 'translateY(calc(100% - 62px))' : 'translateY(0)',
    transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    ...customStyle
  });

  const getGpsButtonBottom = () => {
    if (isMinimized) {
      return '82px'; // Se sitúa sobre la barra minimizada de 62px (62px + 20px de margen)
    }
    switch (status) {
      case 'idle':
        return '214px';
      case 'searching':
        return '252px';
      case 'confirm':
        return '400px';
      case 'driver_assigned':
      case 'driver_arrived':
        return '460px';
      case 'in_progress':
        return paymentRequested ? '396px' : '256px';
      case 'completed':
        return ratingDone ? '190px' : '370px';
      case 'cancelled':
        return '230px';
      default:
        return '20px';
    }
  };

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
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
            Maximizar
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
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

  // Auto-close chat modal during trip in progress or completed
  useEffect(() => {
    if (status === 'in_progress' || status === 'completed' || paymentRequested) {
      setShowChat(false);
    }
  }, [status, paymentRequested]);

  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [totalTripsCount, setTotalTripsCount] = useState<number | null>(null);

  const resetTrip = useCallback(() => {
    setStatus('idle');
    setCurrentTrip(null);
    setDriver(null);
    setDest(null);
    setSearchQuery('');
    setDestQuery('');
    setActiveField(null);
    setRating(0);
    setRatingComment('');
    setRatingDone(false);
    setError('');
    setPaymentRequested(false);
    setCompletionOtpVerified(false);
    setPassengerConfirmed(false);
    setPaymentSent(false);
    setReceiptUrl(null);
    setChatMessages([]);
    setShowChat(false);
    setUnreadCount(0);
  }, []);

  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const checkActiveTrip = useCallback(async () => {
    try {
      const res = await api.get('/trips/active');
      if (res.data.trip) {
        const trip = res.data.trip;
        const activeOtp = (trip.paymentStatus === 'requested' || trip.paymentStatus === 'otp_verified' || trip.paymentStatus === 'passenger_confirmed')
          ? trip.dropoffOtpCode
          : trip.otpCode;
        setCurrentTrip({ id: trip.id, otpCode: activeOtp, estimatedPrice: trip.estimatedPrice });
        setStatus(trip.status);
        if (trip.originLat && trip.originLng) {
          setOrigin({
            lat: trip.originLat,
            lng: trip.originLng,
            address: trip.originAddress || 'Mi ubicación',
          });
        }
        if (trip.destLat && trip.destLng) {
          setDest({
            lat: trip.destLat,
            lng: trip.destLng,
            address: trip.destAddress || 'Destino',
          });
        }
        if (trip.driver) {
          setDriver(trip.driver);
          if (trip.driver.lastLat && trip.driver.lastLng) {
            setDriverPos({ lat: trip.driver.lastLat, lng: trip.driver.lastLng });
          }
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
          setPaymentSent(true);
        }
      } else {
        if (['searching', 'driver_assigned', 'driver_arrived', 'in_progress'].includes(statusRef.current)) {
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
        console.log('[Visibility] App en primer plano (Pasajero). Sincronizando estado y socket...');
        forceReconnectSocket();
        checkActiveTrip();
      }
    };

    const handleFocus = () => {
      console.log('[Focus] Ventana enfocada (Pasajero). Sincronizando estado y socket...');
      forceReconnectSocket();
      checkActiveTrip();
    };

    const handleResume = () => {
      console.log('[Resume] App reanudada desde segundo plano (Pasajero). Sincronizando estado y socket...');
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

  // Obtener ubicación actual del pasajero
  useEffect(() => {
    const s = getSession();
    if (!s) { router.push('/login'); return; }
    // Si el usuario es admin, redirigir al panel de control
    if (s.user?.role === 'admin') { router.push('/admin'); return; }
    setSession(s);

    // Inicializar Notificaciones Push para móviles
    initializePushNotifications();

    // Sincronizar el estado del usuario
    api.get('/auth/me')
      .then(res => {
        const latestUser = res.data.user;
        const updatedSession = { ...s, user: latestUser };
        setSession(updatedSession);
        localStorage.setItem('fim_user', JSON.stringify(latestUser));
      })
      .catch(err => {
        console.error('Error al sincronizar perfil de pasajero:', err);
      });

    api.get('/trips/my-trips')
      .then(r => setTotalTripsCount(r.data.trips.length))
      .catch(() => {});

    checkActiveTrip();

    async function loadInitialLocation() {
      try {
        const { getCurrentPosition } = await import('@/lib/geolocation');
        const pos = await getCurrentPosition();
        setOrigin({
          lat: pos.lat,
          lng: pos.lng,
          address: 'Obteniendo dirección...',
        });
        setGpsError(null);
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}&addressdetails=1`;
          const res = await fetch(url, {
            headers: {
              'User-Agent': 'Fim-App-Client/1.0 (contact@fim.cl)'
            }
          });
          const data = await res.json();
          if (data && data.address) {
            const formatted = formatNominatimAddress(data);
            const fullAddress = formatted.title + (formatted.subtitle ? `, ${formatted.subtitle}` : '');
            setOrigin({
              lat: pos.lat,
              lng: pos.lng,
              address: fullAddress,
            });
            const commune = data.address.suburb || data.address.neighbourhood || data.address.city_district || data.address.town || data.address.city || '';
            if (commune) {
              setCurrentCommune(commune);
            }
          }
        } catch (err) {
          console.error('Error reverse geocoding origin inline:', err);
          setOrigin({
            lat: pos.lat,
            lng: pos.lng,
            address: 'Mi ubicación actual',
          });
        }
      } catch (err) {
        console.warn('Passenger GPS initial warning:', err);
        setOrigin({ ...SANTIAGO_CENTER, address: 'Centro de Santiago' });
        setGpsError('Señal de GPS inactiva. Mostrando centro de Santiago. Activa el GPS para mayor precisión.');
      }
    }
    loadInitialLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reverse geocoding for origin to resolve its address and commune
  useEffect(() => {
    if (!origin) return;
    if (origin.address === 'Mi ubicación actual' || origin.address === 'Centro de Santiago') {
      const resolveAddress = async () => {
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${origin.lat}&lon=${origin.lng}&addressdetails=1`;
          const res = await fetch(url, {
            headers: {
              'User-Agent': 'Fim-App-Client/1.0 (contact@fim.cl)'
            }
          });
          const data = await res.json();
          if (data && data.address) {
            const formatted = formatNominatimAddress(data);
            const fullAddress = formatted.title + (formatted.subtitle ? `, ${formatted.subtitle}` : '');
            
            setOrigin(prev => {
              if (!prev) return null;
              return {
                ...prev,
                address: fullAddress
              };
            });
            
            const commune = data.address.suburb || data.address.neighbourhood || data.address.city_district || data.address.town || data.address.city || '';
            if (commune) {
              setCurrentCommune(commune);
            }
          }
        } catch (err) {
          console.error('Error reverse geocoding origin:', err);
        }
      };
      resolveAddress();
    }
  }, [origin?.lat, origin?.lng]);

  // Sync origin changes to originQuery when not typing
  useEffect(() => {
    if (origin && activeField !== 'origin') {
      setOriginQuery(origin.address);
    }
  }, [origin, activeField]);

  // Calcular precio cuando hay origen y destino convocando la API
  useEffect(() => {
    if (origin && dest && (status === 'selecting_dest' || status === 'confirm')) {
      setError('');
      api.post('/trips/estimate', {
        originLat: origin.lat,
        originLng: origin.lng,
        destLat: dest.lat,
        destLng: dest.lng
      })
      .then(res => {
        const { distanceKm, durationMin, estimatedPrice } = res.data;
        setEstimatedPrice(estimatedPrice);
        setDistanceKm(distanceKm);
        setDurationMin(durationMin);
        if (status === 'selecting_dest') {
          setStatus('confirm');
        }
      })
      .catch(err => {
        console.error('Error al estimar viaje:', err);
        setError('Error al calcular el precio estimado.');
        setStatus('idle');
      });
    }
  }, [origin, dest, status]);

  // Autocomplete con Nominatim
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 3) {
        setIsSearching(true);
        try {
          // Limpiar número de casa (cualquier número independiente, ej. "9701") en la consulta,
          // incluso si está seguido de comas o de la comuna al final.
          const cleanQuery = searchQuery
            .replace(/(?:n[°o]|n°|#)?\s*\b\d+\b\s*(?=\b|,|$)/gi, '')
            .replace(/\s*,\s*/g, ', ')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/^,|,$/g, '')
            .trim();

          const fetchResults = async (q: string, useLocalBounds = false) => {
            let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=cl&limit=6&addressdetails=1`;
            if (origin) {
              url += `&lat=${origin.lat}&lon=${origin.lng}`;
              if (useLocalBounds) {
                // Forzar búsqueda hiper-local (~3km de radio) para calles menores/pasajes
                const delta = 0.03;
                const left = origin.lng - delta;
                const right = origin.lng + delta;
                const top = origin.lat + delta;
                const bottom = origin.lat - delta;
                url += `&viewbox=${left},${top},${right},${bottom}&bounded=1`;
              } else {
                // Sesgo de cuadrante (~25km a la redonda)
                const left = origin.lng - 0.25;
                const right = origin.lng + 0.25;
                const top = origin.lat + 0.25;
                const bottom = origin.lat - 0.25;
                url += `&viewbox=${left},${top},${right},${bottom}`;
              }
            }
            try {
              const res = await fetch(url, {
                headers: {
                  'User-Agent': 'Fim-App-Client/1.0 (contact@fim.cl)'
                }
              });
              return await res.json();
            } catch (err) {
              console.error('Error fetching from Nominatim:', err);
              return [];
            }
          };

          // Ejecutar llamadas de manera secuencial separadas por un delay
          // para respetar los límites de concurrencia estrictos de Nominatim
          let localBounded: any[] = [];
          if (origin) {
            localBounded = await fetchResults(cleanQuery, true);
            await new Promise((resolve) => setTimeout(resolve, 150));
          }

          const general = await fetchResults(cleanQuery, false);

          // Combinar y ordenar priorizando:
          // 1. Local acotado (dentro de los 3km, súper cercano al pasajero)
          // 2. Búsqueda general
          const seen = new Set<number>();
          const combined: any[] = [];

          const addItems = (items: any[]) => {
            for (const item of items) {
              if (item && item.place_id && !seen.has(item.place_id)) {
                seen.add(item.place_id);
                combined.push(item);
              }
            }
          };

          addItems(localBounded);
          addItems(general);

          setSearchResults(combined.slice(0, 6));
        } catch (error) {
          console.error('Error searching address:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300); // 300ms de retardo para mayor rapidez

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, origin, currentCommune]);

  function handleSelectAddress(item: any) {
    const formatted = formatNominatimAddress(item, searchQuery);
    const loc = {
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      address: formatted.title + (formatted.subtitle ? `, ${formatted.subtitle}` : ''),
    };
    
    if (activeField === 'origin') {
      setOrigin(loc);
      setOriginQuery(formatted.title);
      setSearchResults([]);
      setActiveField(null);
      setSearchQuery('');
      if (dest) {
        setStatus('selecting_dest');
      }
    } else {
      setDest(loc);
      setDestQuery(formatted.title);
      setSearchResults([]);
      setActiveField(null);
      setSearchQuery('');
      if (origin) {
        setStatus('selecting_dest');
      }
    }
  }

  // Socket.io listeners
  useEffect(() => {
    if (!currentTrip?.id) return;

    const socket = connectSocket();
    socket.emit('passenger:join-trip', { tripId: currentTrip.id });

    socket.on('connect', () => {
      console.log('[Socket] Pasajero conectado/reconectado. Consultando estado del viaje...');
      socket.emit('passenger:join-trip', { tripId: currentTrip.id });
      checkActiveTrip();
    });

    socket.on('trip:accepted', ({ trip }: { trip: any }) => {
      console.log('[Socket] Viaje aceptado por conductor:', trip.driver.name);
      setDriver(trip.driver);
      setDriverPos({ lat: trip.driver.lastLat, lng: trip.driver.lastLng });
      setCurrentTrip({ id: trip.id, otpCode: trip.otpCode, estimatedPrice: trip.estimatedPrice });
      setStatus('driver_assigned');
      sendLocalNotification("¡Viaje Aceptado!", `${trip.driver.name} va en camino en un ${trip.driver.vehicleBrand} (${trip.driver.vehiclePlate}).`);
    });

    socket.on('driver:moved', ({ lat, lng }: { lat: number; lng: number }) => {
      setDriverPos({ lat, lng });
    });

    socket.on('trip:driver-arrived', () => {
      console.log('[Socket] El conductor ha llegado');
      sendLocalNotification("¡Tu conductor ha llegado!", "El conductor te está esperando en el punto de recogida.");
      setStatus('driver_arrived');
    });

    socket.on('trip:started', () => {
      console.log('[Socket] El viaje ha iniciado');
      sendLocalNotification("¡Viaje Iniciado!", "Tu viaje hacia el destino ha comenzado. ¡Buen viaje!");
      setStatus('in_progress');
    });

    socket.on('trip:no-drivers', () => {
      setError('No se encontraron conductores cercanos.');
      setStatus('cancelled');
    });

    socket.on('trip:passenger-confirmed-payment', () => {
      console.log('[Socket] El pasajero indica que ya pagó');
      setPassengerConfirmed(true);
    });

    socket.on('trip:payment-requested', (data?: { otpCode?: string }) => {
      console.log('[Socket] El conductor solicita el pago', data);
      sendLocalNotification("Pago Solicitado", "El conductor ha solicitado el pago del viaje.");
      setPaymentRequested(true);
      setCompletionOtpVerified(false);
      if (data?.otpCode) {
        setCurrentTrip(prev => ({
          id: prev?.id || currentTrip?.id || '',
          estimatedPrice: prev?.estimatedPrice || currentTrip?.estimatedPrice || 0,
          otpCode: data.otpCode
        }));
      }
    });

    socket.on('trip:completion-otp-verified', (data?: { trip?: any }) => {
      console.log('[Socket] Código de término verificado con éxito');
      setCompletionOtpVerified(true);
    });

    socket.on('trip:completed', () => {
      console.log('[Socket] Viaje finalizado por el conductor');
      sendLocalNotification("Viaje Finalizado", "Has llegado a tu destino. ¡Esperamos que hayas tenido un excelente viaje!");
      setStatus('completed');
    });

    socket.on('trip:message', (msg: any) => {
      console.log('[Socket] Nuevo mensaje de chat recibido en pasajero:', msg);
      setChatMessages(prev => [...prev, msg]);
      if (!showChatRef.current) {
        setUnreadCount(prev => prev + 1);
        sendLocalNotification(`Mensaje de ${msg.senderName}`, msg.text);
      }
    });

    return () => {
      console.log('[Socket] Limpiando listeners de viaje');
      socket.off('connect');
      socket.off('trip:accepted');
      socket.off('driver:moved');
      socket.off('trip:driver-arrived');
      socket.off('trip:started');
      socket.off('trip:completed');
      socket.off('trip:no-drivers');
      socket.off('trip:payment-requested');
      socket.off('trip:completion-otp-verified');
      socket.off('trip:passenger-confirmed-payment');
      socket.off('trip:message');
    };
  }, [currentTrip?.id, checkActiveTrip]);

  const handleRequestTrip = useCallback(async () => {
    if (!origin || !dest) return;
    setStatus('searching');
    setError('');

    try {
      const res = await api.post('/trips/request', {
        originLat: origin.lat, originLng: origin.lng, originAddress: origin.address,
        destLat: dest.lat, destLng: dest.lng, destAddress: dest.address,
        paymentMethod,
      });

      const trip = res.data.trip;
      setCurrentTrip({ id: trip.id });

      const socket = connectSocket();
      socket.emit('passenger:join-trip', { tripId: trip.id });
      socket.emit('trip:search', {
        tripId: trip.id,
        passengerId: session?.user?.id,
        originLat: origin.lat,
        originLng: origin.lng,
      });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Error al solicitar el viaje');
      setStatus('confirm');
    }
  }, [origin, dest, paymentMethod, session]);

  const executeCancel = useCallback(async (reason: string) => {
    if (currentTrip) {
      await api.post(`/trips/${currentTrip.id}/cancel`, { reason }).catch(() => {});
    }
    setStatus('idle');
    setCurrentTrip(null);
    setDriver(null);
    setDest(null);
    setSearchQuery('');
    setShowCancelModal(false);
    setSelectedCancelOption('');
    setCustomCancelReason('');
  }, [currentTrip]);

  const handleCancel = useCallback(async () => {
    if (status === 'driver_assigned' || status === 'driver_arrived') {
      setShowCancelModal(true);
    } else {
      await executeCancel('Cancelado por el pasajero');
    }
  }, [status, executeCancel]);

  const [paymentRequested, setPaymentRequested] = useState(false);
  const [completionOtpVerified, setCompletionOtpVerified] = useState(false);
  const [passengerConfirmed, setPassengerConfirmed] = useState(false);
  const [paymentSent, setPaymentSent] = useState(false);
  const [receiptUploading, setReceiptUploading] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);



  const handleRate = useCallback(async () => {
    if (!currentTrip || rating === 0) return;
    await api.post(`/trips/${currentTrip.id}/rate`, { driverScore: rating, driverComment: ratingComment }).catch(() => {});
    setRatingDone(true);
  }, [currentTrip, rating, ratingComment]);

  const handleUploadReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/uploads/single', formData);
      setReceiptUrl(res.data.url);
    } catch (err) {
      console.error(err);
      alert('Error al subir el comprobante');
    } finally {
      setReceiptUploading(false);
    }
  };

  const [paying, setPaying] = useState(false);

  const handlePayTrip = async () => {
    if (!currentTrip) return;
    setPaying(true);

    if (driver?.mercadoPagoLink) {
      const paymentUrl = driver.mercadoPagoLink;
      window.open(paymentUrl, '_blank');
      await api.post(`/payments/trip/${currentTrip.id}/simulate-payment`).catch(() => {});
      setPaying(false);
      return;
    }
    setPaying(false);
  };

  const handleConfirmPaymentSent = async () => {
    if (!currentTrip) return;
    const socket = connectSocket();
    socket.emit('trip:passenger-confirmed-payment', { tripId: currentTrip.id, receiptUrl });
    setPaymentSent(true);
  };

  const openProfileModal = async () => {
    setShowProfileModal(true);
    setPasswordChangeMsg('');
    setPasswordChangeStatus('');
    try {
      const res = await api.get('/auth/me');
      const latestUser = res.data.user;
      const updatedSession = { ...session, user: latestUser };
      setSession(updatedSession);
      localStorage.setItem('fim_user', JSON.stringify(latestUser));
    } catch (err) {
      console.error('Error fetching current user details:', err);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordChangeMsg('Todos los campos son obligatorios');
      setPasswordChangeStatus('error');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeMsg('Las contraseñas nuevas no coinciden');
      setPasswordChangeStatus('error');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordChangeMsg('La nueva contraseña debe tener al menos 6 caracteres');
      setPasswordChangeStatus('error');
      return;
    }

    setPasswordChangeLoading(true);
    setPasswordChangeMsg('');
    setPasswordChangeStatus('');
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      setPasswordChangeMsg('Contraseña cambiada con éxito');
      setPasswordChangeStatus('success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Error al cambiar la contraseña';
      setPasswordChangeMsg(errMsg);
      setPasswordChangeStatus('error');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  if (session && session.user && session.user.isVerified === false) {
    return (
      <div className="app-container" style={{ background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>
        <div className="card animate-in" style={{ width: '100%', maxWidth: '480px', padding: '40px 32px', textAlign: 'center', border: '1px solid var(--border-accent)', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(20,20,30,1) 100%)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{ width: '80px', height: '80px', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
          </div>
          
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '16px', color: '#fff' }}>Validación en Proceso</h2>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
            Hola, <strong style={{ color: 'var(--accent)' }}>{session.user.name}</strong>. Para garantizar la seguridad de toda la comunidad, nuestro equipo debe revisar y validar tus documentos de identidad (RUT y Selfie) antes de que puedas solicitar viajes.
          </p>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '16px', marginBottom: '32px', textAlign: 'left', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px', color: 'var(--accent)', fontWeight: 700, fontSize: '0.85rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              ESTADO DE DOCUMENTACIÓN
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Tus archivos han sido cargados con éxito y están en la cola de revisión de la administración. Este proceso suele tardar menos de 24 horas hábiles.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              className="btn btn-secondary btn-block" 
              onClick={() => {
                api.get('/auth/me')
                  .then(res => {
                    const latestUser = res.data.user;
                    if (latestUser.isVerified) {
                      const updatedSession = { ...session, user: latestUser };
                      setSession(updatedSession);
                      localStorage.setItem('fim_user', JSON.stringify(latestUser));
                    } else {
                      alert('Tu documentación aún se encuentra en revisión. Te notificaremos apenas sea aprobada.');
                    }
                  })
                  .catch(() => {
                    alert('Error de conexión al verificar el estado.');
                  });
              }}
              style={{ padding: '14px', fontWeight: 700 }}
            >
              🔄 Verificar estado actual
            </button>
            <button className="btn btn-ghost btn-block" onClick={handleLogout} style={{ padding: '14px', fontWeight: 600, color: 'var(--danger)' }}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div 
          className="logo-hover-container"
          onMouseEnter={() => setIsLogoHovered(true)}
          onMouseLeave={() => setIsLogoHovered(false)}
          onClick={resetTrip}
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
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>Tu historial</span>
            <span style={{ lineHeight: 1.1 }}>Llevas {totalTripsCount !== null ? totalTripsCount : 0} {totalTripsCount === 1 ? 'viaje' : 'viajes'}</span>
          </div>
        </div>
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="header-greeting" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Hola, {session?.user?.name || 'Pasajero'}</div>
          
          <button className="header-nav-btn" onClick={openProfileModal}>
            <div className="icon-circle">
              <IconUser />
            </div>
            <span className="btn-label">Usuario</span>
          </button>

          <button className="header-nav-btn" onClick={() => router.push('/passenger/history')}>
            <div className="icon-circle">
              <IconClock />
            </div>
            <span className="btn-label">Historial</span>
          </button>

          <button className="header-nav-btn" onClick={handleLogout}>
            <div className="icon-circle">
              <IconLogout />
            </div>
            <span className="btn-label">Salir</span>
          </button>
        </div>
      </header>

      {/* Botón flotante de GPS de alta prioridad fuera de main-content para evitar recortes de stacking contexts */}
      <button 
        onClick={() => {
          setCenterTrigger(prev => prev + 1);
          const getLoc = async () => {
            try {
              const { getCurrentPosition } = await import('@/lib/geolocation');
              const pos = await getCurrentPosition();
              setOrigin({
                lat: pos.lat,
                lng: pos.lng,
                address: 'Obteniendo dirección...',
              });
              setGpsError(null);
              try {
                const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}&addressdetails=1`;
                const res = await fetch(url, {
                  headers: {
                    'User-Agent': 'Fim-App-Client/1.0 (contact@fim.cl)'
                  }
                });
                const data = await res.json();
                if (data && data.address) {
                  const formatted = formatNominatimAddress(data);
                  const fullAddress = formatted.title + (formatted.subtitle ? `, ${formatted.subtitle}` : '');
                  setOrigin({
                    lat: pos.lat,
                    lng: pos.lng,
                    address: fullAddress,
                  });
                }
              } catch (e) {
                setOrigin({
                  lat: pos.lat,
                  lng: pos.lng,
                  address: 'Mi ubicación actual',
                });
              }
            } catch (err) {
              console.error('Error al detectar ubicación:', err);
              setGpsError('Error al detectar ubicación. Verifica que tu GPS esté encendido.');
            }
          };
          getLoc();
        }}
        title="Mi ubicación actual"
        className="gps-button"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
      </button>

      <main className="main-content">
        <PassengerMap
          origin={origin}
          dest={dest}
          driverPos={driverPos}
          centerTrigger={centerTrigger}
        />

        {/* HUD de GPS y Controles Flotantes del Mapa */}
        {gpsError && (
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            right: '76px',
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
      </main>

      {/* IDLE — Selección de destino */}
      {status === 'idle' && (
        <div className="bottom-sheet animate-slide-up" style={bottomSheetStyle()}>
          <BottomSheetHandle />
          <h3 style={{ marginBottom: '16px', fontWeight: 900 }}>¿A dónde vamos?</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
            
            {/* Input Origen */}
            <div className="form-group" style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)', zIndex: 10, display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }}></div>
              </div>
              <input 
                className="form-input" 
                placeholder="Ingresa ubicación de origen..." 
                style={{ paddingLeft: '44px', paddingRight: '40px' }}
                value={originQuery}
                onFocus={() => {
                  setActiveField('origin');
                  setSearchQuery(originQuery);
                }}
                onChange={(e) => {
                  setOriginQuery(e.target.value);
                  setSearchQuery(e.target.value);
                }}
              />
              {isSearching && activeField === 'origin' ? (
                <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
                  <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                </div>
              ) : (
                originQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setOriginQuery('');
                      setSearchQuery('');
                      setOrigin(null);
                    }}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      borderRadius: '50%',
                      width: '22px',
                      height: '22px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 15,
                      transition: 'background 0.2s'
                    }}
                  >
                    ×
                  </button>
                )
              )}
            </div>

            {/* Input Destino */}
            <div className="form-group" style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--danger)', zIndex: 10, display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--danger)', boxShadow: '0 0 8px var(--danger)' }}></div>
              </div>
              <input 
                className="form-input" 
                placeholder="¿A dónde vamos? (Destino)" 
                style={{ paddingLeft: '44px', paddingRight: '40px' }}
                value={destQuery}
                onFocus={() => {
                  setActiveField('dest');
                  setSearchQuery(destQuery);
                }}
                onChange={(e) => {
                  setDestQuery(e.target.value);
                  setSearchQuery(e.target.value);
                }}
              />
              {isSearching && activeField === 'dest' ? (
                <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
                  <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                </div>
              ) : (
                destQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setDestQuery('');
                      setSearchQuery('');
                      setDest(null);
                    }}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      borderRadius: '50%',
                      width: '22px',
                      height: '22px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 15,
                      transition: 'background 0.2s'
                    }}
                  >
                    ×
                  </button>
                )
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && activeField && (
              <div className="search-results" style={{ marginTop: '4px' }}>
                {searchResults.map((item, idx) => {
                  const formatted = formatNominatimAddress(item, searchQuery);
                  return (
                    <div key={idx} className="search-item" onClick={() => handleSelectAddress(item)}>
                      <div className="search-item-icon" style={{ display: 'flex', alignItems: 'center', color: 'var(--accent)' }}><IconPin /></div>
                      <div className="search-item-text">
                        <div className="search-item-title">{formatted.title}</div>
                        <div className="search-item-sub">{formatted.subtitle}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {['Casa', 'Trabajo', 'Mall Plaza', 'Aeropuerto'].map(fav => {
              const getIcon = () => {
                if (fav === 'Casa') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
                if (fav === 'Trabajo') return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
                return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
              };
              return (
                <button 
                  key={fav} 
                  className="btn btn-secondary btn-sm" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} 
                  onClick={() => {
                    const field = activeField || 'dest';
                    if (field === 'origin') {
                      setOriginQuery(fav);
                    } else {
                      setDestQuery(fav);
                    }
                    setActiveField(field);
                    setSearchQuery(fav);
                  }}
                >
                  {getIcon()} {fav}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SEARCHING — Buscando conductor */}
      {status === 'searching' && (
        <div className="bottom-sheet animate-slide-up" style={bottomSheetStyle()}>
          <BottomSheetHandle />
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div className="spinner" style={{ margin: '0 auto 20px' }} />
            <h3 style={{ marginBottom: '8px' }}>Buscando conductor...</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Estamos contactando a los conductores más cercanos a ti.
            </p>
            <button className="btn btn-danger btn-block" style={{ marginTop: '24px' }} onClick={handleCancel}>
              Cancelar búsqueda
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM — Resumen y pedir */}
      {status === 'confirm' && (
        <div className="bottom-sheet animate-slide-up" style={bottomSheetStyle()}>
          <BottomSheetHandle />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontWeight: 900, marginBottom: '4px' }}>Detalle del viaje</h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center' }}><IconPin /></span> {dest?.address}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="price-display">
                {formatCLP(paymentMethod === 'card' ? estimatedPrice * 1.0319 : estimatedPrice)}
              </div>
              {paymentMethod === 'card' && (
                <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '-4px', fontWeight: 600 }}>
                  Incluye comisión Mercado Pago (+3.19%)
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <div className="info-badge">
              <IconClock /> {durationMin} min
            </div>
            <div className="info-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', color: 'var(--accent)' }}><IconCar /></span> {distanceKm.toFixed(1)} km
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Método de pago:</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button 
                className={`btn ${paymentMethod === 'cash' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPaymentMethod('cash')}
              >
                <IconCash /> Efectivo
              </button>
              <button 
                className={`btn ${paymentMethod === 'card' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPaymentMethod('card')}
              >
                <IconCard /> Tarjeta
              </button>
            </div>
          </div>

          <button className="btn btn-accent btn-block btn-lg" onClick={handleRequestTrip}>
            Confirmar y pedir viaje
          </button>
          <button 
            className="btn btn-secondary btn-block" 
            style={{ marginTop: '12px' }} 
            onClick={() => setStatus('idle')}
          >
            Cambiar dirección
          </button>
        </div>
      )}

      {/* DRIVER ASSIGNED — Conductor en camino */}
      {(status === 'driver_assigned' || status === 'driver_arrived') && driver && (
        <div className="bottom-sheet animate-slide-up" style={bottomSheetStyle()}>
          <BottomSheetHandle />

          {status === 'driver_arrived' ? (
            <div className="alert alert-success" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconCheck /> ¡Tu conductor ha llegado! Dirígete al vehículo.
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IconCar /> Tu conductor está en camino...
            </p>
          )}

          <div className="driver-card" style={{ marginBottom: '16px' }}>
            <div className="driver-avatar">{driver.name[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {driver.name}
                {driver.membershipPlan && (
                  <span className={`badge seal-${driver.membershipPlan.toLowerCase()}`} style={{
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.62rem',
                    fontWeight: 900,
                    letterSpacing: '0.05em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {driver.membershipPlan === 'BLACK' ? (
                      <>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
                          <path d="M3 20h18" />
                        </svg>
                        <span>BLACK</span>
                      </>
                    ) : driver.membershipPlan === 'COMFORT' ? (
                      <>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <span>COMFORT</span>
                      </>
                    ) : (
                      <>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                        <span>FLEX</span>
                      </>
                    )}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <IconStar key={i} filled={i < Math.round(driver.totalRating)} />
                ))}
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '4px' }}>
                  {driver.totalRating > 0 ? driver.totalRating.toFixed(1) : 'Nuevo'} · {driver.totalTrips} viajes
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {driver.vehicleBrand} {driver.vehicleModel}
              </div>
            </div>
            <div style={{
              padding: '8px 14px', background: 'var(--accent)', borderRadius: 'var(--radius)',
              fontWeight: 800, fontSize: '1.1rem', color: '#09090F', letterSpacing: '0.05em',
            }}>
              {driver.vehiclePlate}
            </div>
          </div>
          
          <div style={{ 
            background: 'var(--bg-secondary)', 
            border: '2px dashed var(--accent)', 
            borderRadius: 'var(--radius)', 
            padding: '16px', 
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Código de seguridad</p>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '8px', color: 'var(--accent)' }}>
              {currentTrip?.otpCode || '----'}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>Dáselo al conductor para iniciar el viaje</p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <button
                className="btn btn-secondary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={() => setShowChat(true)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Chat en vivo
              </button>
              {unreadCount > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: 'var(--danger)',
                  color: 'white',
                  borderRadius: '50%',
                  minWidth: '22px',
                  height: '22px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 10px rgba(255, 69, 96, 0.8)',
                  zIndex: 10
                }}>
                  {unreadCount}
                </div>
              )}
            </div>
            <button className="btn btn-danger" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={handleCancel}>
              <IconX /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* IN PROGRESS — Viaje en curso */}
      {status === 'in_progress' && (
        <div className="bottom-sheet animate-slide-up" style={bottomSheetStyle()}>
          <BottomSheetHandle />
          {!paymentRequested ? (
            <div style={{ padding: '8px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div className="spinner-sm" style={{ borderLeftColor: 'transparent', width: '16px', height: '16px' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>Viaje en curso a tu destino</h3>
              </div>

              {driver && (
                <div className="driver-card" style={{ marginBottom: '16px' }}>
                  <div className="driver-avatar">{driver.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {driver.name}
                      {driver.membershipPlan && (
                        <span className={`badge seal-${driver.membershipPlan.toLowerCase()}`} style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.62rem',
                          fontWeight: 900,
                          letterSpacing: '0.05em',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {driver.membershipPlan === 'BLACK' ? 'BLACK' : driver.membershipPlan === 'COMFORT' ? 'COMFORT' : 'FLEX'}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {driver.vehicleBrand} {driver.vehicleModel}
                    </div>
                  </div>
                  <div style={{
                    padding: '8px 14px', background: 'var(--accent)', borderRadius: 'var(--radius)',
                    fontWeight: 800, fontSize: '1.1rem', color: '#09090F', letterSpacing: '0.05em',
                  }}>
                    {driver.vehiclePlate}
                  </div>
                </div>
              )}

              {driverPos && dest && (
                (() => {
                  const dist = calculateDistance(driverPos.lat, driverPos.lng, dest.lat, dest.lng);
                  const dur = estimateDuration(dist);
                  const etaTime = new Date(Date.now() + dur * 60 * 1000);
                  const etaStr = etaTime.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div style={{
                      background: 'rgba(0, 229, 160, 0.08)',
                      border: '1px solid rgba(0, 229, 160, 0.2)',
                      borderRadius: 'var(--radius)',
                      padding: '12px 16px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.2rem' }}>🕒</span>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'white' }}>
                            Llegada estimada: {dur} {dur === 1 ? 'min' : 'minutos'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Hora de llegada aprox: {etaStr}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)' }}>
                        {dist.toFixed(1)} km restantes
                      </div>
                    </div>
                  );
                })()
              )}

              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, textAlign: 'center' }}>
                Te avisaremos cuando el conductor solicite el pago al llegar al destino.
              </p>
            </div>
          ) : (
            <div style={{ padding: '4px' }}>
              {!completionOtpVerified ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: 600 }}>
                    El viaje ha finalizado. Entrega el código de término al conductor para habilitar tu pago:
                  </p>
                  <div style={{ 
                    background: 'var(--bg-secondary)', 
                    border: '2px dashed var(--accent)', 
                    borderRadius: 'var(--radius)', 
                    padding: '16px 24px', 
                    marginBottom: '16px',
                    display: 'inline-block'
                  }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '8px', color: 'var(--accent)', lineHeight: 1 }}>
                      {currentTrip?.otpCode || '----'}
                    </div>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    Una vez que el conductor verifique el código, podrás elegir el medio de pago.
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ fontWeight: 900 }}>Monto a pagar</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent)' }}>
                      {formatCLP(paymentMethod === 'card' ? (currentTrip?.estimatedPrice || estimatedPrice) * 1.0319 : (currentTrip?.estimatedPrice || estimatedPrice))}
                    </div>
                  </div>
                  {paymentMethod === 'card' && (
                    <div style={{ 
                      background: 'rgba(0, 229, 160, 0.08)', 
                      border: '1px solid rgba(0, 229, 160, 0.15)',
                      borderRadius: 'var(--radius)', 
                      padding: '10px 14px', 
                      fontSize: '0.78rem', 
                      color: 'var(--accent)', 
                      marginBottom: '16px',
                      lineHeight: '1.4'
                    }}>
                      <strong>Nota Importante:</strong> El pago con tarjeta incluye un recargo de 3.19% por la comisión del procesador (Mercado Pago). Por favor, <strong>transfiere exactamente</strong> el monto indicado arriba.
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    <button 
                      className={`btn ${paymentMethod === 'cash' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setPaymentMethod('cash')}
                    >
                      <IconCash /> Efectivo
                    </button>
                    <button 
                      className={`btn ${paymentMethod === 'card' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setPaymentMethod('card')}
                    >
                      <IconCard /> Mercado Pago
                    </button>
                  </div>

                  {!paymentSent ? (
                    <>
                      {paymentMethod === 'card' && (
                        <div style={{ marginBottom: '16px' }}>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', textAlign: 'center' }}>Sube tu comprobante para mayor seguridad:</p>
                          <label style={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            padding: '12px', border: '2px dashed var(--border)', borderRadius: 'var(--radius)',
                            cursor: 'pointer', color: receiptUrl ? 'var(--accent)' : 'var(--text-muted)',
                            background: receiptUrl ? 'rgba(0,229,160,0.05)' : 'transparent'
                          }}>
                            <input type="file" hidden accept="image/*" onChange={handleUploadReceipt} />
                            {receiptUploading ? 'Subiendo...' : receiptUrl ? <><IconCheck /> Comprobante cargado</> : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                                Adjuntar pantallazo
                              </span>
                            )}
                          </label>
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {paymentMethod === 'card' && !receiptUrl && (
                          <button className="btn btn-outline btn-block" onClick={handlePayTrip}>Ir a Mercado Pago</button>
                        )}
                        <button 
                          className="btn btn-accent btn-block btn-lg"
                          onClick={handleConfirmPaymentSent}
                          disabled={receiptUploading}
                        >
                          Confirmar envío de pago
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--accent)', fontWeight: 700 }}>
                      <div className="spinner-sm" style={{ margin: '0 auto 12px' }} />
                      Pago enviado. Esperando confirmación...
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* COMPLETED — Viaje completado */}
      {status === 'completed' && (
        <div className="bottom-sheet animate-slide-up" style={bottomSheetStyle({ maxHeight: '90vh', overflowY: 'auto' })}>
          <BottomSheetHandle />
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ color: 'var(--warning)', display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>¡Viaje Finalizado!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>¿Cómo estuvo tu experiencia con {driver?.name}?</p>
            
            {!ratingDone ? (
              <div style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star} 
                      onClick={() => setRating(star)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'var(--transition)', transform: rating === star ? 'scale(1.2)' : 'scale(1)' }}
                    >
                      <IconStar filled={star <= rating} />
                    </button>
                  ))}
                </div>
                
                <textarea 
                  className="form-input" 
                  placeholder="Escribe una reseña opcional..." 
                  style={{ minHeight: '100px', marginBottom: '16px', resize: 'none' }}
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                />
                
                <button 
                  className="btn btn-primary btn-block btn-lg" 
                  onClick={handleRate}
                  disabled={rating === 0}
                >
                  Enviar Calificación
                </button>
              </div>
            ) : (
              <div style={{ animation: 'fadeIn 1s' }}>
                <div className="alert alert-success" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <IconCheck /> ¡Gracias por tus comentarios!
                </div>
                <button className="btn btn-secondary btn-block" onClick={resetTrip}>Volver al inicio</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CANCELLED */}
      {status === 'cancelled' && (
        <div className="bottom-sheet animate-slide-up" style={bottomSheetStyle()}>
          <BottomSheetHandle />
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center', color: 'var(--danger)' }}><IconAlert /></div>
            <h3 style={{ marginBottom: '8px' }}>Viaje cancelado</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>{error || 'El viaje fue cancelado.'}</p>
            <button className="btn btn-primary btn-block" onClick={resetTrip}>Intentar de nuevo</button>
          </div>
        </div>
      )}

      {/* MODAL DE CHAT EN VIVO */}
      {showChat && currentTrip && (
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
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Chat con Conductor</h4>
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
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
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px', opacity: 0.5 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
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
                  tripId: currentTrip.id,
                  senderId: session?.user?.id,
                  senderName: session?.user?.name || 'Pasajero',
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE MOTIVO DE CANCELACIÓN */}
      {showCancelModal && (
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
            padding: '24px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem' }}>¿Por qué cancelas tu viaje?</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Por favor dinos el motivo de tu cancelación. Esto ayuda a mantener la transparencia y avisar al conductor.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                'El conductor demoró demasiado',
                'Me equivoqué de destino',
                'Tomé otra decisión',
                'El conductor me solicitó cancelar',
                'Otro motivo'
              ].map((reasonOption) => (
                <button
                  key={reasonOption}
                  type="button"
                  onClick={() => {
                    setSelectedCancelOption(reasonOption);
                    if (reasonOption !== 'Otro motivo') {
                      setCustomCancelReason('');
                    }
                  }}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius)',
                    background: selectedCancelOption === reasonOption ? 'var(--accent)' : 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid ' + (selectedCancelOption === reasonOption ? 'var(--accent)' : 'var(--border)'),
                    color: selectedCancelOption === reasonOption ? '#09090F' : 'var(--text-primary)',
                    textAlign: 'left',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'var(--transition)'
                  }}
                >
                  {reasonOption}
                </button>
              ))}
            </div>

            {selectedCancelOption === 'Otro motivo' && (
              <textarea
                className="form-input"
                placeholder="Escribe el motivo aquí..."
                value={customCancelReason}
                onChange={(e) => setCustomCancelReason(e.target.value)}
                style={{
                  minHeight: '80px',
                  resize: 'none',
                  fontSize: '0.9rem',
                  padding: '12px',
                  background: '#1A1A28',
                  border: '1px solid var(--border)',
                  color: 'white',
                  borderRadius: 'var(--radius)',
                  outline: 'none'
                }}
              />
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedCancelOption('');
                  setCustomCancelReason('');
                }}
              >
                Volver atrás
              </button>
              <button
                className="btn btn-danger"
                style={{ flex: 1 }}
                disabled={!selectedCancelOption || (selectedCancelOption === 'Otro motivo' && !customCancelReason.trim())}
                onClick={async () => {
                  const finalReason = selectedCancelOption === 'Otro motivo' ? customCancelReason : selectedCancelOption;
                  await executeCancel(finalReason);
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PERFIL DE USUARIO */}
      {showProfileModal && (
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
            maxWidth: '460px',
            padding: '28px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowProfileModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                transition: 'var(--transition)'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            >
              <IconX />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                background: 'var(--gold-light)',
                color: 'var(--accent)',
                borderRadius: '10px',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IconUser />
              </div>
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem' }}>Mi Perfil</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>Nombre Completo</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '2px' }}>{session?.user?.name || '—'}</div>
              </div>
              <div style={{ height: '1px', background: 'var(--border)' }} />
              <div>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>Correo Electrónico</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '2px' }}>{session?.user?.email || '—'}</div>
              </div>
              <div style={{ height: '1px', background: 'var(--border)' }} />
              <div>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>Número de Teléfono</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '2px' }}>{session?.user?.phone || '—'}</div>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Cambiar Contraseña
              </h4>
              
              <input 
                type="password" 
                placeholder="Contraseña actual" 
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1.5px solid var(--border)',
                  color: 'white',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.85rem'
                }}
              />
              <input 
                type="password" 
                placeholder="Nueva contraseña" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1.5px solid var(--border)',
                  color: 'white',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.85rem'
                }}
              />
              <input 
                type="password" 
                placeholder="Confirmar nueva contraseña" 
                value={confirmNewPassword}
                onChange={e => setConfirmNewPassword(e.target.value)}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1.5px solid var(--border)',
                  color: 'white',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.85rem'
                }}
              />

              {passwordChangeMsg && (
                <div style={{
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  color: passwordChangeStatus === 'success' ? 'var(--success)' : 'var(--danger)',
                  marginTop: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: passwordChangeStatus === 'success' ? 'rgba(0, 229, 160, 0.08)' : 'rgba(255, 69, 96, 0.08)',
                  border: '1px solid ' + (passwordChangeStatus === 'success' ? 'rgba(0, 229, 160, 0.2)' : 'rgba(255, 69, 96, 0.2)'),
                  padding: '8px 12px',
                  borderRadius: '8px'
                }}>
                  {passwordChangeStatus === 'success' ? <IconCheck /> : <IconAlert />}
                  <span>{passwordChangeMsg}</span>
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={passwordChangeLoading || !currentPassword || !newPassword || !confirmNewPassword}
                style={{
                  width: '100%',
                  marginTop: '6px',
                  padding: '12px',
                  fontWeight: 700,
                  borderRadius: '10px'
                }}
              >
                {passwordChangeLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
