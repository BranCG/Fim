'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Car, Wallet, Banknote, MapPin,
  TrendingUp, Smartphone, Zap, ArrowRight, ChevronRight, User, CircleDollarSign,
  Apple, Play, CreditCard, Link2, CheckCircle2, QrCode
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import Logo from '@/components/Logo';
import SplashScreen from '@/components/SplashScreen';
import ThemeToggle from '@/components/ThemeToggle';
import api, { getSession } from '@/lib/api';
import { Caveat } from 'next/font/google';

const caveat = Caveat({ subsets: ['latin'], weight: ['700'] });

const AppleBadgeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 384 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.3 48.6-.7 90.4-82.5 102.7-119.3-65.2-30.7-61.7-90-61.8-91.3zM243.6 86.4c16.9-20.9 28.5-50.5 25.4-80.4-25.2 1-56.1 16.9-73.6 37.9-14.7 17.6-28.5 48.2-24.8 77.4 28.5 2.1 57-14.2 73-34.9z" />
  </svg>
);

const GooglePlayBadgeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.5 2C3.1 2.4 2.8 3.1 2.8 4V20C2.8 20.9 3.1 21.6 3.5 22L3.6 22L14 11.6L14 11.5L14 11.4L3.6 2L3.5 2Z" fill="#00E676" />
    <path d="M17.4 15L14 11.5L14 11.4L14 11.3L17.4 7.9L17.5 8L21.7 10.4C22.9 11.1 22.9 12.2 21.7 12.9L17.5 15.3L17.4 15Z" fill="#FFCA28" />
    <path d="M17.5 15.3L14 11.5L3.5 22C4 22.5 4.9 22.6 5.8 22.1L17.5 15.3Z" fill="#F44336" />
    <path d="M17.5 8L5.8 1.3C4.9 0.8 4 0.9 3.5 1.4L14 11.4L17.5 8Z" fill="#29B6F6" />
  </svg>
);

export default function Home() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<'passenger' | 'driver'>('passenger');
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [tripsPerWeek, setTripsPerWeek] = useState(60);
  const [avgPrice, setAvgPrice] = useState(6000);
  const [loss, setLoss] = useState(0);
  const [activeTimelineStep, setActiveTimelineStep] = useState(1);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (s && s.user && s.user.role) {
      if (s.user.role === 'admin') router.replace('/admin');
      else if (s.user.role === 'driver') router.replace('/driver');
      else router.replace('/passenger');
    }
  }, [router]);

  useEffect(() => {
    // Si el usuario abre esto desde la aplicación nativa (Android/iOS), 
    // lo enviamos a la vista clásica de la app (/mobile).
    if (typeof window !== 'undefined') {
      const isMobileApp = (window as any).Capacitor ||
        window.location.origin.includes('capacitor://') ||
        ((window.location.hostname === 'localhost' || window.location.hostname === '') && window.location.port === '');

      if (isMobileApp) {
        router.replace('/mobile');
      }
    }
  }, [router]);

  useEffect(() => {
    // Calculamos pérdida semanal asumiendo 30% de comisión en la competencia
    setLoss(Math.round(tripsPerWeek * avgPrice * 0.30));
  }, [tripsPerWeek, avgPrice]);

  const formatCLP = (val: number) => '$' + val.toLocaleString('es-CL');

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setActiveCardIndex(0);
      return;
    }
    const ratio = el.scrollLeft / maxScroll;
    if (ratio < 0.3) setActiveCardIndex(0);
    else if (ratio < 0.7) setActiveCardIndex(1);
    else setActiveCardIndex(2);
  };

  // Variantes de animación
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
      overflowX: 'hidden',
      position: 'relative',
      ...(activeView === 'driver' ? {
        '--accent': '#8B5CF6',
        '--accent-dark': '#7C3AED',
        '--accent-glow': '0 0 40px rgba(139, 92, 246, 0.4)',
      } : {
        '--accent': '#00E5A0',
        '--accent-dark': '#00B37E',
        '--accent-glow': '0 0 40px rgba(0, 229, 160, 0.4)',
      }) as React.CSSProperties
    }}>
      <SplashScreen />

      {/* Marquee Banner */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60,
        background: '#FEF08A', color: '#000', height: '30px',
        display: 'flex', alignItems: 'center', overflow: 'hidden',
        fontSize: '0.8rem', fontWeight: 800, whiteSpace: 'nowrap'
      }}>
        <div style={{
          display: 'inline-block',
          animation: 'marquee 15s linear infinite',
          paddingLeft: '100%'
        }}>
          {activeView === 'driver' ? "30 DÍAS FREE PASS SOLO CON TU REGISTRO" : "30 DÍAS 25% DE DESCUENTO SOLO CON TU REGISTRO"}
          <span style={{ marginLeft: '50px' }}>
            {activeView === 'driver' ? "30 DÍAS FREE PASS SOLO CON TU REGISTRO" : "30 DÍAS 25% DE DESCUENTO SOLO CON TU REGISTRO"}
          </span>
          <span style={{ marginLeft: '50px' }}>
            {activeView === 'driver' ? "30 DÍAS FREE PASS SOLO CON TU REGISTRO" : "30 DÍAS 25% DE DESCUENTO SOLO CON TU REGISTRO"}
          </span>
          <span style={{ marginLeft: '50px' }}>
            {activeView === 'driver' ? "30 DÍAS FREE PASS SOLO CON TU REGISTRO" : "30 DÍAS 25% DE DESCUENTO SOLO CON TU REGISTRO"}
          </span>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes marquee {
          0% { transform: translate(0, 0); }
          100% { transform: translate(-100%, 0); }
        }
      `}} />
      {/* Ruido sutil de fondo (Cinematic Texture) */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, opacity: 0.03, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
      }} />

      {/* Navbar Minimalista */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        style={{
          position: 'fixed', top: '30px', left: 0, right: 0, zIndex: 50,
          padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Logo width="80" height="30" subtitle={false} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ThemeToggle />
          <Link href="/register" className="btn" style={{
            background: 'var(--accent)', color: '#000', boxShadow: 'var(--accent-glow)',
            padding: '8px 16px', fontSize: '0.85rem'
          }}>Crear Cuenta</Link>
        </div>
      </motion.nav>

      {/* ─── HERO SECTION ─── */}
      <section style={{
        position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 24px 60px', zIndex: 1
      }}>
        {/* Orbe de luz de fondo */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '600px', height: '600px', background: 'var(--accent)', filter: 'blur(250px)', opacity: 0.15, zIndex: -1,
          transition: 'background 0.5s ease'
        }} />

        <motion.div initial="hidden" animate="visible" variants={staggerContainer} style={{ maxWidth: '900px', zIndex: 10 }}>

          {/* Toggle Pasajero/Conductor Apple Style */}
          <motion.div variants={fadeInUp} style={{
            background: 'var(--bg-card)', padding: '6px', borderRadius: '100px',
            display: 'inline-flex', marginBottom: '40px', border: '1px solid var(--border)', backdropFilter: 'blur(20px)',
            maxWidth: '100%', overflowX: 'auto'
          }}>
            <button onClick={() => setActiveView('passenger')} style={{
              padding: '10px 16px', borderRadius: '100px', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
              background: activeView === 'passenger' ? 'var(--accent)' : 'transparent',
              color: activeView === 'passenger' ? '#000' : 'var(--text-secondary)',
              boxShadow: activeView === 'passenger' ? 'var(--accent-glow)' : 'none'
            }}>
              <User size={16} /> Pasajero
            </button>
            <button onClick={() => setActiveView('driver')} style={{
              padding: '10px 16px', borderRadius: '100px', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
              background: activeView === 'driver' ? 'var(--accent)' : 'transparent',
              color: activeView === 'driver' ? '#000' : 'var(--text-secondary)',
              boxShadow: activeView === 'driver' ? 'var(--accent-glow)' : 'none'
            }}>
              <Car size={16} /> Conductor
            </button>
          </motion.div>

          <AnimatePresence mode="wait">
            {activeView === 'passenger' ? (
              <motion.div key="passenger-hero" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
                <h1 style={{ fontSize: 'clamp(2rem, 8vw, 4rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.04em', marginBottom: '24px' }}>
                  Muévete a tu ritmo. <br />
                  <span style={{ color: 'var(--accent)', textShadow: 'var(--accent-glow)' }}>Sin sorpresas.</span>
                </h1>
                <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px', lineHeight: 1.6 }}>
                  La plataforma de movilidad que respeta tu tiempo y tu dinero. Conductores verificados, tarifas transparentes y viajes seguros.
                </p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn" style={{ background: '#1A1A1A', color: '#fff', padding: '10px 20px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '12px', border: '1px solid #333' }}>
                    <AppleBadgeIcon />
                    <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                      <span style={{ fontSize: '0.65rem', display: 'block', opacity: 0.8 }}>Consíguelo en el</span>
                      <span style={{ fontWeight: 600, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>App Store</span>
                    </div>
                  </button>
                  <button className="btn" style={{ background: '#1A1A1A', color: '#fff', padding: '10px 20px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '12px', border: '1px solid #333' }}>
                    <GooglePlayBadgeIcon />
                    <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                      <span style={{ fontSize: '0.65rem', display: 'block', opacity: 0.8 }}>DISPONIBLE EN</span>
                      <span style={{ fontWeight: 600, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>Google Play</span>
                    </div>
                  </button>
                </div>
                <div style={{ marginTop: '24px' }}>
                  <Link href="/register" className="btn" style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', padding: '10px 20px', fontSize: '0.9rem' }}>
                    o Crear una cuenta en la web
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div key="driver-hero" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
                <h1 style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '24px' }}>
                  La red de conductores independientes <br />
                  <span className={caveat.className} style={{ color: 'var(--accent)', fontSize: '1.4em', fontWeight: 700, transform: 'rotate(-3deg)', display: 'inline-block', textShadow: 'var(--accent-glow)' }}>más rentable</span> <br />
                  de Chile.
                </h1>
                <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px', lineHeight: 1.6 }}>
                  Dile adiós a las comisiones abusivas. Conduce con <strong style={{ color: 'var(--accent)' }}>0% comisión</strong> y quédate con todo lo que ganes. Tú eres el dueño de tu volante.
                </p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn" style={{ background: '#1A1A1A', color: '#fff', padding: '10px 20px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '12px', border: '1px solid #333' }}>
                    <AppleBadgeIcon />
                    <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                      <span style={{ fontSize: '0.65rem', display: 'block', opacity: 0.8 }}>Consíguelo en el</span>
                      <span style={{ fontWeight: 600, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>App Store</span>
                    </div>
                  </button>
                  <button className="btn" style={{ background: '#1A1A1A', color: '#fff', padding: '10px 20px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '12px', border: '1px solid #333' }}>
                    <GooglePlayBadgeIcon />
                    <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                      <span style={{ fontSize: '0.65rem', display: 'block', opacity: 0.8 }}>DISPONIBLE EN</span>
                      <span style={{ fontWeight: 600, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>Google Play</span>
                    </div>
                  </button>
                </div>
                <div style={{ marginTop: '24px' }}>
                  <Link href="/register" className="btn" style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', padding: '10px 20px', fontSize: '0.9rem' }}>
                    o Crear una cuenta de Conductor
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* ─── FEATURES SECTION (Glassmorphism Cards) ─── */}
      <section style={{ padding: '100px 24px', zIndex: 2, position: 'relative' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={staggerContainer}
            className="cards-carousel"
            onScroll={handleScroll}
            style={{
              display: 'flex', gap: '24px', overflowX: 'auto', scrollSnapType: 'x mandatory',
              paddingBottom: '24px', margin: '0 -24px', paddingLeft: '24px', paddingRight: '24px',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {activeView === 'passenger' ? (
              <>
                {[
                  { icon: <ShieldCheck size={36} />, title: 'Seguridad Militar', desc: 'Conductores validados con antecedentes y revisión estricta para tu total tranquilidad.' },
                  { icon: <MapPin size={36} />, title: 'Rutas Optimizadas', desc: 'Llega más rápido a tu destino con nuestro sistema de navegación hiper-eficiente.' },
                  { icon: <Banknote size={36} />, title: 'Tarifas Claras', desc: 'Sin multiplicadores dinámicos absurdos. Paga lo que ves desde el primer momento.' }
                ].map((feature, i) => (
                  <motion.div key={i} variants={fadeInUp} className="card-glass carousel-item" style={{
                    padding: 'clamp(24px, 5vw, 40px)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '24px',
                    transition: 'all 0.3s ease', cursor: 'default', flex: '0 0 85%', maxWidth: '350px', scrollSnapAlign: 'start'
                  }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <div style={{ color: 'var(--accent)', marginBottom: '24px' }}>{feature.icon}</div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', fontWeight: 800 }}>{feature.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>{feature.desc}</p>
                  </motion.div>
                ))}
              </>
            ) : (
              <>
                {[
                  { icon: <CircleDollarSign size={36} />, title: '0% Comisión', desc: 'Por primera vez en la industria, no tocamos tu dinero. Cada viaje va íntegro a tu bolsillo.' },
                  { icon: <TrendingUp size={36} />, title: 'Ganancias Exponenciales', desc: 'Paga una tarifa plana mensual (o paga por viaje si prefieres) y escala tus ingresos.' },
                  { icon: <Smartphone size={36} />, title: 'Control Total', desc: 'Tú eliges qué viajes aceptar y qué zonas transitar. Nosotros solo ponemos la tecnología.' }
                ].map((feature, i) => (
                  <motion.div key={i} variants={fadeInUp} className="card-glass carousel-item" style={{
                    padding: 'clamp(24px, 5vw, 40px)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '24px',
                    transition: 'all 0.3s ease', cursor: 'default', flex: '0 0 85%', maxWidth: '350px', scrollSnapAlign: 'start'
                  }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <div style={{ color: 'var(--accent)', marginBottom: '24px' }}>{feature.icon}</div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', fontWeight: 800 }}>{feature.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>{feature.desc}</p>
                  </motion.div>
                ))}
              </>
            )}
          </motion.div>

          {/* Carousel Pagination Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                width: activeCardIndex === i ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: activeCardIndex === i ? 'var(--accent)' : 'var(--border)',
                transition: 'all 0.3s ease'
              }} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── PASSENGER GUIDE (Only shows for Passengers) ─── */}
      <AnimatePresence>
        {activeView === 'passenger' && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ padding: '40px 24px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', overflow: 'hidden' }}
          >
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, textAlign: 'center', marginBottom: '40px', letterSpacing: '-0.02em' }}>¿Cómo funciona Fim para Pasajeros?</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: 'var(--bg-main)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                    <div style={{ background: '#fff', color: '#000', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>1. Cotiza y Pide</h3>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Ingresa tu origen y destino. El sistema calculará la tarifa justa sin tarifas dinámicas especulativas.</p>
                    </div>
                  </div>
                </div>
                <div style={{ background: 'var(--bg-main)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                    <div style={{ background: '#1A1A1A', color: '#fff', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #333' }}>
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>2. Código OTP Seguro</h3>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Al abordar el auto, indícale al conductor tu código de seguridad OTP exclusivo para autorizar el viaje.</p>
                    </div>
                  </div>
                </div>
                <div style={{ background: 'var(--bg-main)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                    <div style={{ background: '#fff', color: '#000', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Smartphone size={20} />
                      <div style={{ position: 'absolute', background: 'var(--accent)', width: '12px', height: '12px', borderRadius: '50%', transform: 'translate(10px, 10px)' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>3. Pago Directo</h3>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Paga con tarjeta mediante Mercado Pago, transferencia directa al chofer o efectivo. Sin intermediarios.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ─── DRIVER ACTIVATION & TUTORIAL (Only shows for Drivers) ─── */}
      <AnimatePresence>
        {activeView === 'driver' && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ padding: '60px 24px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', overflow: 'hidden' }}
          >
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <span style={{ color: '#9d7cff', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Proceso de Activación</span>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '8px', marginBottom: '16px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Línea de Tiempo<br />del Conductor</h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>Sigue estos sencillos pasos para registrarte, activar tu cuenta y comenzar a conducir con Fim.</p>
              </div>

              {/* Timeline Steps */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '40px', position: 'relative' }}>
                <div style={{ position: 'absolute', height: '2px', background: 'var(--border)', width: '60%', zIndex: 0 }} />
                {[1, 2, 3].map((step) => (
                  <div key={step} style={{ flex: 1, display: 'flex', justifyContent: 'center', zIndex: 1 }}>
                    <button
                      onClick={() => setActiveTimelineStep(step)}
                      style={{
                        width: '48px', height: '48px', borderRadius: '50%', fontWeight: 800, fontSize: '1.2rem',
                        background: activeTimelineStep === step ? '#9d7cff' : 'var(--bg-main)',
                        color: activeTimelineStep === step ? '#fff' : '#9d7cff',
                        border: activeTimelineStep === step ? 'none' : '2px solid var(--border)',
                        transition: 'all 0.3s ease', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      {step}
                    </button>
                  </div>
                ))}
              </div>

              {/* Step Content */}
              <div style={{ background: 'var(--bg-main)', padding: '32px', borderRadius: '24px', border: '1px solid var(--border)', marginBottom: '32px', minHeight: '200px' }}>
                <span style={{ color: '#9d7cff', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>PASO {activeTimelineStep}</span>
                {activeTimelineStep === 1 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '16px', lineHeight: 1.2 }}>Registro y Validación Biométrica</h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Regístrate como Conductor en Fim. Sube tu licencia de conducir y pasa la verificación de identidad para garantizar la seguridad de la comunidad.</p>
                  </motion.div>
                )}
                {activeTimelineStep === 2 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '16px', lineHeight: 1.2 }}>Configura tu Método de Cobro</h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Asocia tu cuenta bancaria o enlace de Mercado Pago. En Fim, el dinero va directo del pasajero a ti, sin intermediarios ni retenciones.</p>
                  </motion.div>
                )}
                {activeTimelineStep === 3 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '16px', lineHeight: 1.2 }}>¡Empieza a ganar el 100%!</h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Conéctate, acepta viajes y mira cómo tus ganancias crecen de verdad. Conduce con la tranquilidad de que no hay comisiones ocultas.</p>
                  </motion.div>
                )}
              </div>

              {/* Tutorial Mercado Pago Toggle */}
              <div style={{ border: '1px solid #9d7cff', borderRadius: '24px', overflow: 'hidden' }}>
                <button
                  onClick={() => setShowTutorial(!showTutorial)}
                  style={{ width: '100%', padding: '20px', background: 'transparent', border: 'none', color: '#9d7cff', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', cursor: 'pointer' }}
                >
                  TUTORIAL FIM PAGOS
                  <motion.div animate={{ rotate: showTutorial ? 180 : 0 }}><ChevronRight size={20} style={{ transform: 'rotate(-90deg)' }} /></motion.div>
                </button>
                <AnimatePresence>
                  {showTutorial && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                      <div style={{ padding: '0 24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                          <div style={{ background: '#FEF08A', color: '#854D0E', padding: '8px', borderRadius: '8px' }}><CreditCard size={24} /></div>
                          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>Crea una cuenta en <strong>Mercado Pago</strong> (es gratis y personal).</p>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                          <div style={{ background: '#BFDBFE', color: '#1E3A8A', padding: '8px', borderRadius: '8px' }}><Link2 size={24} /></div>
                          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>En tu app de Mercado Pago, ve a <strong>Cobrar con Link</strong> y crea un link genérico o usa tu código QR.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                          <div style={{ background: '#FED7AA', color: '#9A3412', padding: '8px', borderRadius: '8px' }}><User size={24} /></div>
                          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>Pega ese link en tu perfil de <strong>Fim</strong> en la sección "Cobro Directo".</p>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                          <div style={{ background: '#BBF7D0', color: '#166534', padding: '8px', borderRadius: '8px' }}><CircleDollarSign size={24} /></div>
                          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>¡Listo! Al terminar un viaje, el pasajero verá tu link y te pagará <strong>directo a tu cuenta</strong>.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ─── DRIVER CALCULATOR (Only shows for Drivers) ─── */}
      <AnimatePresence>
        {activeView === 'driver' && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ padding: '60px 24px 120px', overflow: 'hidden' }}
          >
            <div className="card-glass" style={{ maxWidth: '1000px', margin: '0 auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '32px', padding: 'clamp(24px, 5vw, 60px)' }}>

              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '16px' }}>Calcula tu <span style={{ color: 'var(--accent)' }}>Pérdida Actual</span></h2>
                <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Descubre cuánto dinero le estás regalando a las apps tradicionales cada semana.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Viajes por semana</span>
                      <span style={{ color: 'var(--accent)', fontWeight: 900, fontSize: '1.2rem' }}>{tripsPerWeek}</span>
                    </div>
                    <input type="range" min="10" max="150" value={tripsPerWeek} onChange={(e) => setTripsPerWeek(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Precio prom. por viaje</span>
                      <span style={{ color: 'var(--accent)', fontWeight: 900, fontSize: '1.2rem' }}>{formatCLP(avgPrice)}</span>
                    </div>
                    <input type="range" min="2000" max="25000" step="500" value={avgPrice} onChange={(e) => setAvgPrice(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }} />
                  </div>
                </div>

                <div className="card-glass" style={{ background: 'var(--bg-secondary)', padding: 'clamp(24px, 5vw, 40px)', borderRadius: '24px', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px' }}>Estás perdiendo aprox.</p>
                  <h3 style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', fontWeight: 900, color: 'var(--accent)', textShadow: 'var(--accent-glow)', marginBottom: '8px' }}>
                    {formatCLP(loss)}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>A la semana (Asumiendo 30% de comisión en otras apps)</p>
                  <Link href="/register" className="btn" style={{ background: 'var(--accent)', color: '#000', width: '100%', padding: '16px', fontSize: '1rem', boxShadow: 'var(--accent-glow)', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    Recuperar mi dinero <Zap size={18} />
                  </Link>
                </div>
              </div>

            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: 'var(--bg-secondary)', padding: '60px 0', borderTop: '1px solid var(--border)', fontSize: '0.9rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          {/* Top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '24px' }}>
            <Logo width="120" height="45" subtitle={false} />
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <button className="btn" style={{ background: '#1A1A1A', color: '#fff', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '8px', border: '1px solid #333' }}>
                <AppleBadgeIcon />
                <div style={{ textAlign: 'left', lineHeight: 1 }}>
                  <span style={{ fontSize: '0.6rem', display: 'block', opacity: 0.8 }}>Consíguelo en el</span>
                  <span style={{ fontWeight: 600, fontSize: '1rem', letterSpacing: '-0.02em' }}>App Store</span>
                </div>
              </button>
              <button className="btn" style={{ background: '#1A1A1A', color: '#fff', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '8px', border: '1px solid #333' }}>
                <GooglePlayBadgeIcon />
                <div style={{ textAlign: 'left', lineHeight: 1 }}>
                    <div style={{ fontSize: '0.6rem', display: 'block', opacity: 0.8 }}>DISPONIBLE EN</div>
                  <span style={{ fontWeight: 600, fontSize: '1rem', letterSpacing: '-0.02em' }}>Google Play</span>
                </div>
              </button>
            </div>
          </div>

          <div style={{ width: '100%', height: '1px', background: 'var(--border)', marginBottom: '40px', opacity: 0.5 }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '60px' }}>
            <div>
              <h4 style={{ fontWeight: 800, marginBottom: '20px', color: 'var(--text-primary)' }}>Plataforma</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><Link href="/" style={{ color: 'var(--text-secondary)' }}>Inicio</Link></li>
                <li><a href="mailto:contacto@fimchile.cl" style={{ color: 'var(--text-secondary)' }}>Contacto</a></li>
                <li><a href="mailto:contacto@fimchile.cl" style={{ color: 'var(--text-secondary)' }}>Centro de ayuda</a></li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontWeight: 800, marginBottom: '20px', color: 'var(--text-primary)' }}>Términos y Condiciones</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><Link href="/legal/terms-passenger" style={{ color: 'var(--text-secondary)' }}>Términos del Pasajero</Link></li>
                <li><Link href="/legal/terms-driver" style={{ color: 'var(--text-secondary)' }}>Términos del Conductor</Link></li>
                <li><Link href="/legal/memberships" style={{ color: 'var(--text-secondary)' }}>Política de Membresías</Link></li>
                <li><Link href="/legal/cancellations" style={{ color: 'var(--text-secondary)' }}>Política de Cancelaciones</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontWeight: 800, marginBottom: '20px', color: 'var(--text-primary)' }}>Privacidad y Seguridad</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><Link href="/legal/privacy" style={{ color: 'var(--text-secondary)' }}>Política de Privacidad</Link></li>
                <li><Link href="/legal/community" style={{ color: 'var(--text-secondary)' }}>Comunidad y Seguridad</Link></li>
                <li><Link href="/legal/account-deletion" style={{ color: 'var(--text-secondary)' }}>Eliminación de Cuenta</Link></li>
              </ul>
            </div>
          </div>

          <div style={{ width: '100%', height: '1px', background: 'var(--border)', marginBottom: '30px', opacity: 0.5 }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              Chile ▾
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', color: 'var(--text-primary)' }}>
              <Link href="#" style={{ color: 'inherit' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </Link>
              <Link href="#" style={{ color: 'inherit' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
              </Link>
              <Link href="https://www.instagram.com/fim.chile/" target="_blank" style={{ color: 'inherit' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </Link>
              <Link href="#" style={{ color: 'inherit' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </Link>
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              © {new Date().getFullYear()} Fim Chile SpA
            </div>
          </div>
        </div>
      </footer>

      {/* Global CSS Overrides */}
      <style>{`
        .cards-carousel::-webkit-scrollbar {
          display: none;
        }
        .cards-carousel {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        input[type=range] {
          -webkit-appearance: none;
          background: rgba(255,255,255,0.1);
          height: 8px;
          border-radius: 4px;
          outline: none;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          box-shadow: var(--accent-glow);
          transition: transform 0.1s;
        }
        input[type=range]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
      `}</style>
    </main>
  );
}
