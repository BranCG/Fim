'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Car, Wallet, Banknote, MapPin, 
  TrendingUp, Smartphone, Zap, ArrowRight, ChevronRight, User, CircleDollarSign,
  Apple, Play
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import Logo from '@/components/Logo';
import SplashScreen from '@/components/SplashScreen';
import ThemeToggle from '@/components/ThemeToggle';
import api, { getSession } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<'passenger' | 'driver'>('passenger');
  const [tripsPerWeek, setTripsPerWeek] = useState(60);
  const [avgPrice, setAvgPrice] = useState(6000);
  const [loss, setLoss] = useState(0);

  useEffect(() => {
    const s = getSession();
    if (s && s?.user?.role) {
      router.push(s.user.role === 'admin' ? '/admin' : `/${s.user.role}`);
    }
  }, [router]);

  useEffect(() => {
    // Si el usuario abre esto desde la aplicación nativa (Android/iOS), 
    // se salta la landing page por completo.
    if (Capacitor.isNativePlatform()) {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    // Calculamos pérdida semanal asumiendo 30% de comisión en la competencia
    setLoss(Math.round(tripsPerWeek * avgPrice * 0.30));
  }, [tripsPerWeek, avgPrice]);

  const formatCLP = (val: number) => '$' + val.toLocaleString('es-CL');

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
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
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
                  <button className="btn" style={{ background: '#fff', color: '#000', padding: '14px 24px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '100px' }}>
                    <Apple size={22} fill="#000" /> 
                    <div style={{ textAlign: 'left', lineHeight: 1 }}>
                      <span style={{ fontSize: '0.65rem', display: 'block', opacity: 0.7 }}>Consíguelo en el</span>
                      <span style={{ fontWeight: 800, fontSize: '1rem' }}>App Store</span>
                    </div>
                  </button>
                  <button className="btn" style={{ background: '#fff', color: '#000', padding: '14px 24px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '100px' }}>
                    <Play size={22} fill="#000" /> 
                    <div style={{ textAlign: 'left', lineHeight: 1 }}>
                      <span style={{ fontSize: '0.65rem', display: 'block', opacity: 0.7 }}>Disponible en</span>
                      <span style={{ fontWeight: 800, fontSize: '1rem' }}>Google Play</span>
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
                <h1 style={{ fontSize: 'clamp(2rem, 8vw, 4rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.04em', marginBottom: '24px' }}>
                  El 100% de tu viaje <br />
                  <span style={{ color: 'var(--accent)', textShadow: 'var(--accent-glow)' }}>es tuyo.</span>
                </h1>
                <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px', lineHeight: 1.6 }}>
                  Dile adiós a las comisiones abusivas. Paga una suscripción justa y quédate con todo lo que ganes. Tú eres el dueño de tu volante.
                </p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn" style={{ background: '#fff', color: '#000', padding: '14px 24px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '100px' }}>
                    <Apple size={22} fill="#000" /> 
                    <div style={{ textAlign: 'left', lineHeight: 1 }}>
                      <span style={{ fontSize: '0.65rem', display: 'block', opacity: 0.7 }}>Consíguelo en el</span>
                      <span style={{ fontWeight: 800, fontSize: '1rem' }}>App Store</span>
                    </div>
                  </button>
                  <button className="btn" style={{ background: '#fff', color: '#000', padding: '14px 24px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '100px' }}>
                    <Play size={22} fill="#000" /> 
                    <div style={{ textAlign: 'left', lineHeight: 1 }}>
                      <span style={{ fontSize: '0.65rem', display: 'block', opacity: 0.7 }}>Disponible en</span>
                      <span style={{ fontWeight: 800, fontSize: '1rem' }}>Google Play</span>
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
            style={{ 
              display: 'flex', gap: '24px', overflowX: 'auto', scrollSnapType: 'x mandatory', 
              paddingBottom: '24px', margin: '0 -24px', paddingLeft: '24px', paddingRight: '24px',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {activeView === 'passenger' ? (
              <>
                {[
                  { icon: <ShieldCheck size={36}/>, title: 'Seguridad Militar', desc: 'Conductores validados con antecedentes y revisión estricta para tu total tranquilidad.' },
                  { icon: <MapPin size={36}/>, title: 'Rutas Optimizadas', desc: 'Llega más rápido a tu destino con nuestro sistema de navegación hiper-eficiente.' },
                  { icon: <Banknote size={36}/>, title: 'Tarifas Claras', desc: 'Sin multiplicadores dinámicos absurdos. Paga lo que ves desde el primer momento.' }
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
                  { icon: <CircleDollarSign size={36}/>, title: '0% Comisión', desc: 'Por primera vez en la industria, no tocamos tu dinero. Cada viaje va íntegro a tu bolsillo.' },
                  { icon: <TrendingUp size={36}/>, title: 'Ganancias Exponenciales', desc: 'Paga una tarifa plana mensual (o paga por viaje si prefieres) y escala tus ingresos.' },
                  { icon: <Smartphone size={36}/>, title: 'Control Total', desc: 'Tú eliges qué viajes aceptar y qué zonas transitar. Nosotros solo ponemos la tecnología.' }
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
        </div>
      </section>

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
              <button className="btn" style={{ background: '#1A1A1A', color: '#fff', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '8px', border: '1px solid #333' }}>
                <Apple size={24} fill="#fff" />
                <div style={{ textAlign: 'left', lineHeight: 1 }}>
                  <span style={{ fontSize: '0.6rem', display: 'block', opacity: 0.8 }}>Consíguelo en el</span>
                  <span style={{ fontWeight: 600, fontSize: '1rem' }}>App Store</span>
                </div>
              </button>
              <button className="btn" style={{ background: '#1A1A1A', color: '#fff', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '8px', border: '1px solid #333' }}>
                <Play size={24} fill="#fff" />
                <div style={{ textAlign: 'left', lineHeight: 1 }}>
                  <span style={{ fontSize: '0.6rem', display: 'block', opacity: 0.8 }}>DISPONIBLE EN</span>
                  <span style={{ fontWeight: 600, fontSize: '1rem' }}>Google Play</span>
                </div>
              </button>
            </div>
          </div>

          <div style={{ width: '100%', height: '1px', background: 'var(--border)', marginBottom: '40px', opacity: 0.5 }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '40px', marginBottom: '60px' }}>
            <div>
              <h4 style={{ fontWeight: 800, marginBottom: '20px', color: 'var(--text-primary)' }}>Conductores</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><Link href="#" style={{ color: 'var(--text-secondary)' }}>Conductores</Link></li>
              </ul>
              <h4 style={{ fontWeight: 800, margin: '30px 0 20px', color: 'var(--text-primary)' }}>Empresas</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><Link href="#" style={{ color: 'var(--text-secondary)' }}>Fim para empresas</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-secondary)' }}>Soluciones</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-secondary)' }}>Plataforma</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-secondary)' }}>Recursos</Link></li>
              </ul>
              <h4 style={{ fontWeight: 800, margin: '30px 0 20px', color: 'var(--text-primary)' }}>Pasajeros</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><Link href="#" style={{ color: 'var(--text-secondary)' }}>Viaja en Fim</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-secondary)' }}>Envíos</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-secondary)' }}>Tarifas</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 style={{ fontWeight: 800, marginBottom: '20px', color: 'var(--text-primary)' }}>Ads</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><Link href="#" style={{ color: 'var(--text-secondary)' }}>Fim Ads</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-secondary)' }}>Online</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-secondary)' }}>Offline</Link></li>
              </ul>
              <h4 style={{ fontWeight: 800, margin: '30px 0 20px', color: 'var(--text-primary)' }}>Centros de ayuda</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><Link href="#" style={{ color: 'var(--text-secondary)' }}>Pasajeros</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-secondary)' }}>Empresas</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-secondary)' }}>Flotas</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-secondary)' }}>Conductores</Link></li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontWeight: 800, marginBottom: '20px', color: 'var(--text-primary)' }}>Nosotros</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><Link href="#" style={{ color: 'var(--text-secondary)' }}>Sobre nosotros</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-secondary)' }}>Portal de Marca</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-secondary)' }}>Sostenibilidad</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-secondary)' }}>Seguridad</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-secondary)' }}>Gobierno Corporativo</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-secondary)' }}>Accesibilidad</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-secondary)' }}>Únete al equipo</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-secondary)' }}>Prensa</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-secondary)' }}>Blog</Link></li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontWeight: 800, marginBottom: '20px', color: 'var(--text-primary)' }}>Legal</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><Link href="#" style={{ color: 'var(--text-secondary)' }}>Términos y condiciones</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-secondary)' }}>Privacidad</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-secondary)' }}>Políticas de cookies</Link></li>
                <li><Link href="#" style={{ color: 'var(--text-secondary)' }}>Declaración de accesibilidad</Link></li>
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
