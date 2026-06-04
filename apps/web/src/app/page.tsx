'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';
import SplashScreen from '@/components/SplashScreen';
import { getSession } from '@/lib/api';

const SingleNeutralCircleIcon = ({ width = 24, height = 24, style }: { width?: number | string; height?: number | string; style?: React.CSSProperties }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    id="Single-Neutral-Circle--Streamline-Ultimate" 
    height={height} 
    width={width}
    style={style}
  >
    <desc>
      Single Neutral Circle Streamline Icon: https://streamlinehq.com
    </desc>
    <path fill="#c2f3ff" d="M12.0001 23c6.0733 0 10.9972 -4.9239 10.9972 -10.9972 0 -6.07331 -4.9239 -10.99718 -10.9972 -10.99718 -6.07329 0 -10.99717 4.92387 -10.99717 10.99718C1.00293 18.0761 5.92681 23 12.0001 23Z" strokeWidth={1}></path>
    <path fill="#66e1ff" d="M12.0001 5.55652c2.5213 0.00022 4.9658 0.86676 6.9244 2.45446 1.9585 1.5877 3.312 3.80012 3.8338 6.26682 0.3396 -1.6021 0.3171 -3.2599 -0.0659 -4.85222s-1.1167 -3.079 -2.1477 -4.35147c-1.031 -1.27248 -2.3332 -2.29861 -3.8115 -3.00347C15.2549 1.36579 13.6379 1 12.0001 1c-1.6377 0 -3.25475 0.36579 -4.73303 1.07064 -1.47829 0.70486 -2.78048 1.73099 -3.81148 3.00347 -1.031 1.27247 -1.76478 2.75915 -2.14776 4.35147C0.924863 11.0179 0.902371 12.6757 1.242 14.2778c0.52178 -2.4667 1.87528 -4.67912 3.8338 -6.26682 1.95851 -1.5877 4.4031 -2.45424 6.9243 -2.45446Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M12.0001 23c6.0733 0 10.9972 -4.9239 10.9972 -10.9972 0 -6.07331 -4.9239 -10.99718 -10.9972 -10.99718 -6.07329 0 -10.99717 4.92387 -10.99717 10.99718C1.00293 18.0761 5.92681 23 12.0001 23Z" strokeWidth={1}></path>
    <path fill="#ffdda1" d="M12.0005 9.61208c0.8242 0 1.6148 -0.32744 2.1976 -0.91029 0.5828 -0.58284 0.9103 -1.37335 0.9103 -2.19762 0 -0.82426 -0.3275 -1.61477 -0.9103 -2.19762 -0.5828 -0.58284 -1.3734 -0.91028 -2.1976 -0.91028 -0.8243 0 -1.6148 0.32744 -2.19764 0.91028 -0.58284 0.58285 -0.91028 1.37336 -0.91028 2.19762 0 0.82427 0.32744 1.61478 0.91028 2.19762 0.58284 0.58285 1.37334 0.91029 2.19764 0.91029Z" strokeWidth={1}></path>
    <path fill="#ffffff" d="m13.9561 20.6093 0.4351 -2.3907h1.9126v-2.8688c0 -1.1413 -0.4534 -2.2359 -1.2604 -3.0429 -0.807 -0.807 -1.9016 -1.2604 -3.0429 -1.2604s-2.23583 0.4534 -3.04284 1.2604c-0.80702 0.807 -1.26039 1.9016 -1.26039 3.0429v2.8688h1.91255l0.43508 2.3907" strokeWidth={1}></path>
    <path fill="#ffdda1" d="M12.0005 5.30883c0.655 0.00133 1.2927 0.21033 1.8214 0.59694s0.9212 0.93093 1.121 1.55468c0.1052 -0.30792 0.1617 -0.63114 0.1655 -0.95628 0 -0.82426 -0.3275 -1.61477 -0.9103 -2.19762 -0.5828 -0.58284 -1.3734 -0.91028 -2.1976 -0.91028 -0.8243 0 -1.6148 0.32744 -2.19764 0.91028 -0.58284 0.58285 -0.91028 1.37336 -0.91028 2.19762 0.00382 0.32514 0.06024 0.64836 0.16543 0.95628 0.19986 -0.62375 0.59236 -1.16807 1.12109 -1.55468 0.5287 -0.38661 1.1664 -0.59561 1.8214 -0.59694Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M12.0005 9.61208c0.8242 0 1.6148 -0.32744 2.1976 -0.91029 0.5828 -0.58284 0.9103 -1.37335 0.9103 -2.19762 0 -0.82426 -0.3275 -1.61477 -0.9103 -2.19762 -0.5828 -0.58284 -1.3734 -0.91028 -2.1976 -0.91028 -0.8243 0 -1.6148 0.32744 -2.19764 0.91028 -0.58284 0.58285 -0.91028 1.37336 -0.91028 2.19762 0 0.82427 0.32744 1.61478 0.91028 2.19762 0.58284 0.58285 1.37334 0.91029 2.19764 0.91029Z" strokeWidth={1}></path>
    <path fill="#ffffff" d="M12.0005 11.0465c-1.1413 0 -2.23583 0.4534 -3.04284 1.2604 -0.80702 0.807 -1.26039 1.9016 -1.26039 3.0429v1.9125c0 -0.5651 0.1113 -1.1247 0.32756 -1.6468s0.53324 -0.9964 0.93283 -1.396c0.39959 -0.3996 0.87398 -0.7166 1.39604 -0.9329 0.5221 -0.2162 1.0817 -0.3275 1.6468 -0.3275 0.5651 0 1.1247 0.1113 1.6468 0.3275 0.5221 0.2163 0.9965 0.5333 1.3961 0.9329 0.3996 0.3996 0.7165 0.8739 0.9328 1.396 0.2163 0.5221 0.3276 1.0817 0.3276 1.6468v-1.9125c0 -1.1413 -0.4534 -2.2359 -1.2604 -3.0429 -0.807 -0.807 -1.9016 -1.2604 -3.0429 -1.2604Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="m13.9561 20.6093 0.4351 -2.3907h1.9126v-2.8688c0 -1.1413 -0.4534 -2.2359 -1.2604 -3.0429 -0.807 -0.807 -1.9016 -1.2604 -3.0429 -1.2604s-2.23583 0.4534 -3.04284 1.2604c-0.80702 0.807 -1.26039 1.9016 -1.26039 3.0429v2.8688h1.91255l0.43508 2.3907" strokeWidth={1}></path>
  </svg>
);

const IconWalletColor = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <rect x="2" y="5" width="20" height="14" rx="3" fill="#FFB800" />
    <path d="M18 5h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2V5z" fill="#FFA500" />
    <path d="M2 8h16v4H2V8z" fill="#4FC3F7" opacity="0.8" />
    <circle cx="14" cy="14" r="2" fill="#FF4560" />
  </svg>
);

const IconLinkColor = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <rect x="3" y="11" width="12" height="8" rx="2" transform="rotate(-45 3 11)" fill="#4FC3F7" />
    <rect x="11" y="19" width="12" height="8" rx="2" transform="rotate(-45 11 19)" fill="#00E5A0" />
    <rect x="8" y="12" width="8" height="3" rx="1.5" transform="rotate(-45 8 12)" fill="#FFFFFF" opacity="0.9" />
  </svg>
);

const IconProfileColor = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <rect x="2" y="3" width="20" height="18" rx="3" fill="#FF4560" />
    <circle cx="12" cy="9" r="4" fill="#FFB800" />
    <path d="M6 19c0-3.314 2.686-6 6-6s6 2.686 6 6H6z" fill="#FFFFFF" opacity="0.9" />
  </svg>
);

const IconCheckColor = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <rect x="2" y="6" width="20" height="12" rx="2" fill="#10B981" />
    <circle cx="12" cy="12" r="4" fill="#00E5A0" />
    <path d="M12 8l-2 2h4l-2-2z" fill="#FFFFFF" />
    <circle cx="19" cy="6" r="5" fill="#FFB800" />
    <path d="M17.5 6l1 1 2-2" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Home() {
  const router = useRouter();
  const [tripsPerWeek, setTripsPerWeek] = useState(60);
  const [avgPrice, setAvgPrice] = useState(6000);
  const [loss, setLoss] = useState(0);
  const [activeView, setActiveView] = useState<'passenger' | 'driver'>('passenger');

  useEffect(() => {
    const s = getSession();
    if (s && s.user && s.user.role) {
      if (s.user.role === 'admin') {
        router.push('/admin');
      } else if (s.user.role === 'driver') {
        router.push('/driver');
      } else {
        router.push('/passenger');
      }
    }
  }, [router]);

  useEffect(() => {
    // Calculamos pérdida semanal asumiendo 25% de comisión
    const calculatedLoss = Math.round(tripsPerWeek * avgPrice * 0.25);
    setLoss(calculatedLoss);
  }, [tripsPerWeek, avgPrice]);

  const formatCLP = (val: number) => {
    return '$' + val.toLocaleString('es-CL');
  };

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <SplashScreen />
      
      {/* Promo Ribbon */}
      <div style={{
        background: activeView === 'passenger' 
          ? 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)'
          : 'linear-gradient(90deg, var(--accent) 0%, #00b377 100%)',
        color: '#000',
        textAlign: 'center',
        padding: '8px 24px',
        fontSize: '0.9rem',
        fontWeight: 800,
        position: 'relative',
        zIndex: 101,
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        letterSpacing: '0.05em',
        transition: 'all 0.3s ease'
      }}>
        {activeView === 'passenger' 
          ? '¡VIAJA SIN COMISIONES INTERMEDIAS! PAGA EL PRECIO JUSTO DIRECTO AL CONDUCTOR'
          : '¡0% COMISIÓN! CONDUCE BAJO TUS PROPIAS REGLAS Y QUÉDATE CON EL 100%'}
      </div>

      {/* Navbar */}
      <nav className="navbar-container" style={{
        padding: 'var(--nav-padding, 16px 24px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(9, 9, 15, 0.8)',
      }}>
        <Logo className="navbar-logo" />
        <div style={{ display: 'flex', gap: 'var(--nav-gap, 12px)', alignItems: 'center' }}>
          <Link href="/login" className="btn btn-secondary btn-sm navbar-btn">Iniciar sesión</Link>
          <Link href="/register" className="btn btn-primary btn-sm navbar-btn">Registrarse</Link>
        </div>
      </nav>

      {/* Elegant Mode Switch */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: '32px',
        marginBottom: '16px',
        position: 'relative',
        zIndex: 10,
        gap: '8px'
      }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 800 }}>Selecciona tu modo</span>
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border)',
          padding: '4px',
          borderRadius: '100px',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          width: '280px',
          height: '46px',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
          cursor: 'pointer'
        }} onClick={() => setActiveView(activeView === 'passenger' ? 'driver' : 'passenger')}>
          {/* Sliding pill */}
          <div style={{
            position: 'absolute',
            top: '4px',
            left: activeView === 'passenger' ? '4px' : 'calc(50% + 0px)',
            width: 'calc(50% - 4px)',
            height: 'calc(100% - 8px)',
            background: 'var(--accent)',
            borderRadius: '100px',
            boxShadow: 'var(--shadow-accent)',
            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 1
          }} />
          
          {/* Labels */}
          <div style={{
            width: '50%',
            textAlign: 'center',
            fontSize: '0.85rem',
            fontWeight: 800,
            color: activeView === 'passenger' ? '#09090F' : 'var(--text-muted)',
            zIndex: 2,
            transition: 'color 0.3s ease',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <SingleNeutralCircleIcon width={18} height={18} style={{ display: 'inline-block', flexShrink: 0 }} />
            Pasajero
          </div>
          <div style={{
            width: '50%',
            textAlign: 'center',
            fontSize: '0.85rem',
            fontWeight: 800,
            color: activeView === 'driver' ? '#09090F' : 'var(--text-muted)',
            zIndex: 2,
            transition: 'color 0.3s ease',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <SingleNeutralCircleIcon width={18} height={18} style={{ display: 'inline-block', flexShrink: 0 }} />
            Conductor
          </div>
        </div>
      </div>

      {/* Main Hero Container */}
      <section style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background gradient */}
        <div style={{
          position: 'absolute',
          top: '-200px',
          left: '-200px',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(0,229,160,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        
        {activeView === 'passenger' ? (
          /* PASAJERO HERO */
          <div key="passenger-hero" style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 24px',
            textAlign: 'center',
            gap: '32px',
            maxWidth: '800px',
            margin: '0 auto',
            position: 'relative',
            zIndex: 1,
            animation: 'fadeIn 0.4s ease'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              background: 'var(--accent-light)',
              border: '1px solid var(--border-accent)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--accent)',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}>
              Viajes Económicos y Directos
            </div>

            <h1 style={{ 
              fontSize: 'clamp(2.3rem, 7vw, 4rem)', 
              fontWeight: 900, 
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              marginBottom: '16px'
            }}>
              Viaja sin comisiones intermedias. <span className="text-gradient">Paga el precio justo</span>.
            </h1>

            <p style={{ 
              fontSize: 'clamp(1rem, 2vw, 1.25rem)', 
              maxWidth: '750px', 
              lineHeight: 1.6, 
              color: 'var(--text-secondary)',
              marginBottom: '32px'
            }}>
              Fim conecta pasajeros con conductores profesionales e independientes en Santiago. Al no cobrar comisiones por carrera, obtienes tarifas más baratas y el 100% de tu pago va directo al conductor.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
              <Link href="/register?role=passenger" className="btn btn-primary btn-lg" style={{ minWidth: '240px' }}>
                Quiero Viajar
              </Link>
              <Link href="/login" className="btn btn-secondary btn-lg" style={{ minWidth: '240px' }}>
                Iniciar Sesión
              </Link>
            </div>
          </div>
        ) : (
          /* CONDUCTOR HERO */
          <div key="driver-hero" style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 24px',
            textAlign: 'center',
            gap: '32px',
            maxWidth: '800px',
            margin: '0 auto',
            position: 'relative',
            zIndex: 1,
            animation: 'fadeIn 0.4s ease'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              background: 'rgba(0, 229, 160, 0.1)',
              border: '1px solid var(--border-accent)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--accent)',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}>
              Disponible en Santiago
            </div>

            <h1 style={{ 
              fontSize: 'clamp(2.3rem, 7vw, 4rem)', 
              fontWeight: 900, 
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              marginBottom: '16px'
            }}>
              La red de conductores independientes <span className="text-gradient">más rentable</span> de Chile.
            </h1>

            <p style={{ 
              fontSize: 'clamp(1rem, 2vw, 1.25rem)', 
              maxWidth: '750px', 
              lineHeight: 1.6, 
              color: 'var(--text-secondary)',
              marginBottom: '32px'
            }}>
              ¿Trabajas todo el día para regalarle el 25% de tu esfuerzo a una aplicación? En Fim eso se acabó: aquí tus tarifas son 100% líquidas para ti. Pagas tu membresía fija diaria o mensual y todo lo demás va directo a tu cuenta.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
              <Link href="/register?role=driver" className="btn btn-primary btn-lg" style={{ minWidth: '240px' }}>
                Quiero Conducir
              </Link>
              <Link href="/login" className="btn btn-secondary btn-lg" style={{ minWidth: '240px' }}>
                Iniciar Sesión
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* AMBIENTE PASAJERO */}
      {activeView === 'passenger' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          {/* Beneficio Pasajero Section */}
          <section style={{ 
            padding: '60px 24px', 
            background: 'linear-gradient(135deg, rgba(0,229,160,0.08) 0%, rgba(9,9,15,1) 100%)',
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            textAlign: 'center'
          }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px' }}>El Trato Más Justo</div>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                Tarifas más bajas, sin comisiones
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '24px', lineHeight: 1.6 }}>
                Al eliminar el 25% de comisión que cobran otras plataformas, los pasajeros de Fim viajan más barato y los conductores independientes reciben el 100% de lo pagado de manera directa.
              </p>
              <Link href="/register?role=passenger" className="btn btn-accent btn-lg" style={{ boxShadow: 'var(--shadow-accent)' }}>
                Comenzar a viajar justo
              </Link>
            </div>
          </section>

          {/* Cómo Funciona Pasajero */}
          <section style={{ padding: '80px 24px', maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '48px', fontSize: '2rem', fontWeight: 900 }}>¿Cómo funciona Fim para Pasajeros?</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
              {[
                {
                  icon: (
                    <SingleNeutralCircleIcon width={36} height={36} />
                  ),
                  title: '1. Cotiza y Pide',
                  desc: 'Ingresa tu origen y destino. El sistema calculará la tarifa justa sin tarifas dinámicas especulativas.'
                },
                {
                  icon: (
                    <SingleNeutralCircleIcon width={36} height={36} />
                  ),
                  title: '2. Código OTP Seguro',
                  desc: 'Al abordar el auto, indícale al conductor tu código de seguridad OTP exclusivo para autorizar el viaje.'
                },
                {
                  icon: (
                    <SingleNeutralCircleIcon width={36} height={36} />
                  ),
                  title: '3. Pago Directo',
                  desc: 'Paga con tarjeta mediante el enlace de Mercado Pago del conductor o en efectivo. Sin cargos extra de intermediación.'
                },
                {
                  icon: (
                    <SingleNeutralCircleIcon width={36} height={36} />
                  ),
                  title: '4. Viajes Regulados',
                  desc: 'Viaja con conductores profesionales validados con estricto control de identidad y documentación al día.'
                }
              ].map((step, idx) => (
                <div key={idx} className="card" style={{ border: '1px solid var(--border)', background: 'var(--bg-secondary)', padding: '24px' }}>
                  <div style={{ marginBottom: '16px' }}>{step.icon}</div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px', color: 'white' }}>{step.title}</h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Final Pasajero */}
          <section style={{ padding: '80px 24px', textAlign: 'center', background: 'linear-gradient(180deg, var(--bg-primary) 0%, rgba(0,229,160,0.03) 100%)' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '16px' }}>Comienza a viajar hoy</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' }}>
              Tarifas más bajas, mayor seguridad y un trato justo a quienes te transportan.
            </p>
            <Link href="/register?role=passenger" className="btn btn-primary btn-lg" style={{ minWidth: '260px' }}>
              Registrarme para Viajar
            </Link>
          </section>
        </div>
      )}

      {/* AMBIENTE CONDUCTOR */}
      {activeView === 'driver' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          {/* Stats Bar */}
          <div style={{
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            padding: '24px',
            background: 'var(--bg-secondary)',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            textAlign: 'center'
          }}>
            {[
              { value: '0%', label: 'Comisión por viaje' },
              { value: 'AL INSTANTE', label: 'Dinero en tu cuenta' },
              { value: '100% TUYO', label: 'Tus tarifas íntegras' },
            ].map((stat) => (
              <div key={stat.label}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent)' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Línea de Tiempo del Conductor */}
          <section style={{ padding: '80px 24px', background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px' }}>PROCESO DE ACTIVACIÓN</div>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'white' }}>
                  Línea de Tiempo del Conductor
                </h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '10px', fontSize: '0.95rem' }}>
                  Sigue estos 3 sencillos pasos para registrarte, activar tu cuenta y comenzar a conducir con Fim.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative' }}>
                {/* Center line for timeline on desktop */}
                <div style={{
                  position: 'absolute',
                  left: '20px',
                  top: '10px',
                  bottom: '10px',
                  width: '2px',
                  background: 'linear-gradient(to bottom, var(--accent) 0%, rgba(255,255,255,0.05) 100%)',
                  zIndex: 0
                }} />

                {[
                  {
                    step: '1',
                    title: 'Registro y Validación Biométrica',
                    desc: 'Regístrate como Conductor en Fim. Sube tu licencia de conducir profesional y pasa la verificación de identidad para garantizar la seguridad de la comunidad.'
                  },
                  {
                    step: '2',
                    title: 'Vincula tu Mercado Pago',
                    desc: 'Pega tu enlace de cobro de Mercado Pago en la app. Los pasajeros te pagarán directamente a tu cuenta al finalizar cada viaje.'
                  },
                  {
                    step: '3',
                    title: 'Elige tu Plan y Comienza a Conducir',
                    desc: 'Selecciona la membresía que mejor se adapte a tu ritmo de trabajo (diaria o mensual). ¡Todo lo que generes en los viajes es 100% tuyo!'
                  }
                ].map((item) => (
                  <div key={item.step} style={{ display: 'flex', gap: '20px', position: 'relative', zIndex: 1 }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'var(--bg-primary)',
                      border: '2px solid var(--accent)',
                      color: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '1.1rem',
                      flexShrink: 0,
                      boxShadow: 'var(--shadow-accent)'
                    }}>
                      {item.step}
                    </div>
                    <div className="card" style={{ flex: 1, padding: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px', color: 'white' }}>{item.title}</h3>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Calculadora de Pérdida */}
          <section id="calculator" style={{ padding: '80px 24px', background: 'var(--bg-primary)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '20px', lineHeight: 1.2, fontWeight: 800 }}>
                  ¿Cuánto dinero <span style={{ color: '#ff4757' }}>estás perdiendo</span> en comisiones?
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '32px' }}>
                  En otras aplicaciones, el 25% o más de tu trabajo se lo quedan ellos. Calcula cuánto queda en tu bolsillo con Fim.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      Viajes por semana <span style={{ color: 'var(--accent)', fontWeight: 800 }}>{tripsPerWeek}</span>
                    </label>
                    <input 
                      type="range" 
                      min="10" 
                      max="150" 
                      value={tripsPerWeek}
                      onChange={(e) => setTripsPerWeek(parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--accent)' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Valor promedio por viaje ($)</label>
                    <input 
                      type="number" 
                      value={avgPrice}
                      onChange={(e) => setAvgPrice(parseInt(e.target.value) || 0)}
                      className="form-input" 
                      style={{ fontSize: '1.2rem', padding: '12px' }}
                    />
                  </div>
                </div>
              </div>

              <div className="calc-card" style={{ 
                background: 'var(--bg-secondary)', 
                padding: '36px', 
                borderRadius: 'var(--radius-lg)', 
                border: '2px solid var(--border)',
                textAlign: 'center',
                boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: '#ff4757'
                }} />
                <div style={{ fontSize: '0.9rem', color: '#ff4757', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.1em' }}>Pérdida semanal estimada</div>
                <div className="calc-loss-text" style={{ fontSize: 'var(--calc-loss-font-size, 3.5rem)', fontWeight: 900, marginBottom: '24px', color: '#ff4757', letterSpacing: '-0.02em' }}>{formatCLP(loss)}</div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '28px', fontSize: '1rem' }}>Con Fim, este dinero es <strong>100% tuyo</strong>.</p>
                  <Link href="/register?role=driver" className="btn btn-primary btn-block btn-lg calc-btn" style={{ fontSize: '1.1rem' }}>Empezar a ganar de verdad</Link>
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* PLANES DE MEMBRESÍA — Aparece primero, como segunda sección    */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <section id="planes" style={{ padding: '80px 24px', background: 'var(--bg-primary)', borderTop: '1px solid var(--border)' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'rgba(0,229,160,0.1)', border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-full)', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '20px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="8" y1="14" x2="8" y2="14.01" /><line x1="12" y1="14" x2="16" y2="14" /></svg>
                  Membresías de Conductor
                </div>
                <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '16px' }}>
                  Elige tu plan. <span className="text-gradient">0% comisión por viaje.</span>
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                  Solo pagas tu membresía. Todo lo que generes en la calle es 100% tuyo, al instante.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', alignItems: 'stretch' }}>

                {/* ── PLAN BLACK ────────────────────────────────────────── */}
                <div style={{
                  background: 'linear-gradient(145deg, #0a0a0f 0%, #1a1a2e 50%, #0d0d1a 100%)',
                  border: '2px solid rgba(212,175,55,0.7)',
                  borderRadius: '20px',
                  padding: '36px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 20px 60px rgba(212,175,55,0.2), 0 0 0 1px rgba(212,175,55,0.15)',
                  transform: 'scale(1.02)',
                  zIndex: 2,
                }}>
                  {/* Badge MÁS POPULAR */}
                  <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #D4AF37, #B8960C)', padding: '6px 20px', borderRadius: '0 0 10px 10px', fontSize: '0.72rem', fontWeight: 900, color: '#000', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    MÁS POPULAR
                  </div>

                  {/* Glow efecto */}
                  <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '12px' }}>
                    <div style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #D4AF37, #B8960C)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900, color: '#000', letterSpacing: '0.1em', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                      PLAN BLACK
                    </div>
                    <div style={{ padding: '4px 12px', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '20px', fontSize: '0.7rem', color: '#D4AF37', fontWeight: 800 }}>
                      PREMIUM
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 900, color: '#D4AF37', letterSpacing: '-0.03em', lineHeight: 1 }}>
                      $150.000
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginTop: '6px' }}>por mes — pago único mensual</div>
                  </div>

                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: 1.6, borderLeft: '2px solid rgba(212,175,55,0.4)', paddingLeft: '12px' }}>
                    Pagas una vez al mes. Acceso ilimitado los 30 días. Sin cobros diarios, sin restricciones de días.
                  </p>

                  <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      '✓  Acceso ilimitado 30 días completos',
                      '✓  Sin pagos diarios ni interrupciones',
                      '✓  100% de cada carrera directo a ti',
                      '✓  Pago vía Mercado Pago (automático)',
                      '✓  Renovación mensual simple',
                    ].map(f => (
                      <li key={f} style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: '#D4AF37', fontWeight: 800 }}>{f.split('  ')[0]}</span>
                        <span>{f.split('  ')[1]}</span>
                      </li>
                    ))}
                  </ul>

                  <div style={{ borderTop: '1px solid rgba(212,175,55,0.2)', paddingTop: '20px', marginTop: 'auto' }}>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginBottom: '12px', textAlign: 'center' }}>
                      Pago seguro con Mercado Pago — activación instantánea
                    </div>
                    <Link href="/register?role=driver&plan=BLACK" style={{
                      display: 'block', textAlign: 'center', padding: '14px',
                      background: 'linear-gradient(135deg, #D4AF37, #B8960C)',
                      color: '#000', borderRadius: '10px', fontWeight: 900,
                      fontSize: '0.95rem', textDecoration: 'none',
                      boxShadow: '0 4px 20px rgba(212,175,55,0.3)',
                      transition: 'all 0.2s ease',
                    }}>
                      Quiero el Plan BLACK →
                    </Link>
                  </div>
                </div>

                {/* ── PLAN COMFORT ──────────────────────────────────────── */}
                <div style={{
                  background: 'linear-gradient(145deg, #0a0f1a 0%, #0f1e35 50%, #0a1020 100%)',
                  border: '1px solid rgba(59,130,246,0.4)',
                  borderRadius: '20px',
                  padding: '36px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 20px 60px rgba(59,130,246,0.1)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900, color: '#fff', letterSpacing: '0.1em', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                      PLAN COMFORT
                    </div>
                    <div style={{ padding: '4px 12px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: '20px', fontSize: '0.7rem', color: '#60A5FA', fontWeight: 800 }}>
                      FINANCIADO
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                      <div style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 900, color: '#FBBF24', letterSpacing: '-0.03em', lineHeight: 1 }}>
                        $180.000
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', paddingBottom: '6px' }}>/mes total</div>
                    </div>
                    <div style={{ marginTop: '8px', padding: '6px 12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>Cuota diaria:</span>
                      <span style={{ color: '#60A5FA', fontWeight: 800, fontSize: '0.85rem' }}>$20.000 /día operado</span>
                    </div>
                  </div>

                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: 1.6, borderLeft: '2px solid rgba(59,130,246,0.5)', paddingLeft: '12px' }}>
                    <strong>Membresía Crédito:</strong> Te financiamos la membresía de inicio para que empieces sin capital. Pagas $20.000 por día trabajado hasta completar la meta de $180.000. ¡Al cumplir la meta, el resto del mes es 100% gratis!
                  </p>

                  <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '10px', padding: '14px', fontSize: '0.82rem' }}>
                    <div style={{ color: '#FBBF24', fontWeight: 800, marginBottom: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      ¿Cómo funciona?
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
                      Pagas la cuota diaria solo los días que trabajas. La subes en la app cada mañana para activarte. A las 7am del día siguiente se pausa hasta la nueva cuota.
                    </div>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      '✓  Crédito Fim (inicia sin capital)',
                      '✓  Solo pagas los días que trabajas',
                      '✓  Gratis al completar la meta mensual',
                      '✓  100% de cada carrera directo a ti',
                      '✓  Comprobante diario verificado',
                    ].map(f => (
                      <li key={f} style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: '#60A5FA', fontWeight: 800 }}>{f.split('  ')[0]}</span>
                        <span>{f.split('  ')[1]}</span>
                      </li>
                    ))}
                  </ul>

                  <div style={{ borderTop: '1px solid rgba(59,130,246,0.2)', paddingTop: '20px', marginTop: 'auto' }}>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginBottom: '12px', textAlign: 'center' }}>
                      Transferencia bancaria diaria + comprobante en la app
                    </div>
                    <Link href="/register?role=driver&plan=COMFORT" style={{
                      display: 'block', textAlign: 'center', padding: '14px',
                      background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                      color: '#fff', borderRadius: '10px', fontWeight: 900,
                      fontSize: '0.95rem', textDecoration: 'none',
                      boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
                      transition: 'all 0.2s ease',
                    }}>
                      Quiero el Plan COMFORT →
                    </Link>
                  </div>
                </div>

                {/* ── PLAN FLEX ─────────────────────────────────────────── */}
                <div style={{
                  background: 'linear-gradient(145deg, #050f0a 0%, #0a1f14 50%, #07120d 100%)',
                  border: '1px solid rgba(16,185,129,0.35)',
                  borderRadius: '20px',
                  padding: '36px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 20px 60px rgba(16,185,129,0.08)',
                }}>
                  <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #10B981, #059669)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900, color: '#fff', letterSpacing: '0.1em', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 2 22 22 22"/></svg>
                      PLAN FLEX
                    </div>
                    <div style={{ padding: '4px 12px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '20px', fontSize: '0.7rem', color: '#34D399', fontWeight: 800 }}>
                      FIN DE SEMANA
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 900, color: '#34D399', letterSpacing: '-0.03em', lineHeight: 1 }}>
                      $60.000
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginTop: '6px' }}>por fin de semana (Vie → Dom)</div>
                  </div>

                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: 1.6, borderLeft: '2px solid rgba(16,185,129,0.4)', paddingLeft: '12px' }}>
                    Pensado para quienes solo trabajan el fin de semana. Pagas $60.000 y tienes acceso los Viernes, Sábado y Domingo. El resto de la semana la cuenta queda inactiva automáticamente.
                  </p>

                  <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d, i) => (
                        <div key={d} style={{
                          width: '36px', height: '36px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          background: i >= 4 ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${i >= 4 ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`,
                          color: i >= 4 ? '#34D399' : 'rgba(255,255,255,0.25)',
                          fontSize: '0.65rem', fontWeight: 800,
                        }}>
                          {d}
                        </div>
                      ))}
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} /> Activo
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border)' }} /> Bloqueado
                      </span>
                    </div>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      '✓  Activo solo Viernes, Sábado y Domingo',
                      '✓  Pago único semanal $60.000',
                      '✓  100% de cada carrera directo a ti',
                      '✓  Pago vía Mercado Pago (automático)',
                      '✓  Sin sorpresas ni cobros extras',
                    ].map(f => (
                      <li key={f} style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: '#34D399', fontWeight: 800 }}>{f.split('  ')[0]}</span>
                        <span>{f.split('  ')[1]}</span>
                      </li>
                    ))}
                  </ul>

                  <div style={{ borderTop: '1px solid rgba(16,185,129,0.2)', paddingTop: '20px', marginTop: 'auto' }}>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginBottom: '12px', textAlign: 'center' }}>
                      Pago seguro con Mercado Pago — activo el próximo viernes
                    </div>
                    <Link href="/register?role=driver&plan=FLEX" style={{
                      display: 'block', textAlign: 'center', padding: '14px',
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      color: '#fff', borderRadius: '10px', fontWeight: 900,
                      fontSize: '0.95rem', textDecoration: 'none',
                      boxShadow: '0 4px 20px rgba(16,185,129,0.25)',
                      transition: 'all 0.2s ease',
                    }}>
                      Quiero el Plan FLEX →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Guía Mercado Pago */}
          <section style={{ padding: '80px 24px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <h2 style={{ textAlign: 'center', marginBottom: '40px', fontSize: '2rem', fontWeight: 900 }}>¿Cómo funciona FIM pagos?</h2>
              <div style={{ background: 'var(--bg-primary)', padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <IconWalletColor />
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>Crea una cuenta en <strong>Mercado Pago</strong> (es gratis y personal).</p>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <IconLinkColor />
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>En tu app de Mercado Pago, ve a <strong>Cobrar con Link</strong> y crea un link genérico o usa tu código QR.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <IconProfileColor />
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>Pega ese link en tu perfil de <strong>Fim</strong> en la sección "Cobro Directo".</p>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <IconCheckColor />
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>¡Listo! Al terminar un viaje, el pasajero verá tu link y te pagará <strong>directo a tu cuenta</strong>.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Final Conductor */}
          <section style={{ padding: '80px 24px', textAlign: 'center', background: 'linear-gradient(180deg, var(--bg-primary) 0%, rgba(0,229,160,0.03) 100%)' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '16px' }}>Comienza a ganar de verdad</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' }}>
              Únete a la comunidad de transporte independiente más justa de Chile.
            </p>
            <Link href="/register?role=driver" className="btn btn-primary btn-lg" style={{ minWidth: '260px' }}>
              Registrarme para Conducir
            </Link>
          </section>
        </div>
      )}

      {/* Footer */}
      <footer style={{ padding: '48px 24px', borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', background: '#09090F' }}>
        <p style={{ marginBottom: '16px' }}>© 2026 Fim Platform. La red de conductores más rentable de Chile.</p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <Link href="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>Términos y Condiciones</Link>
          <Link href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>Políticas de Privacidad</Link>
        </div>
      </footer>
    </main>
  );
}
