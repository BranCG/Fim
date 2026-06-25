'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Car, Wallet, Banknote, MapPin, 
  TrendingUp, Smartphone, Zap, ArrowRight, ChevronRight, User, CircleDollarSign
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
                  <button className="btn" style={{ background: 'var(--accent)', color: '#000', padding: '14px 28px', fontSize: '1rem', boxShadow: 'var(--accent-glow)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Smartphone size={20} /> Descargar App
                  </button>
                  <Link href="/register" className="btn" style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '14px 28px', fontSize: '1rem' }}>
                    Registro Web
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
                  <button className="btn" style={{ background: 'var(--accent)', color: '#000', padding: '14px 28px', fontSize: '1rem', boxShadow: 'var(--accent-glow)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Smartphone size={20} /> Descargar App Conductor
                  </button>
                  <Link href="/register" className="btn" style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '14px 28px', fontSize: '1rem' }}>
                    Registro Web
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
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}
          >
            {activeView === 'passenger' ? (
              <>
                {[
                  { icon: <ShieldCheck size={36}/>, title: 'Seguridad Militar', desc: 'Conductores validados con antecedentes y revisión estricta para tu total tranquilidad.' },
                  { icon: <MapPin size={36}/>, title: 'Rutas Optimizadas', desc: 'Llega más rápido a tu destino con nuestro sistema de navegación hiper-eficiente.' },
                  { icon: <Banknote size={36}/>, title: 'Tarifas Claras', desc: 'Sin multiplicadores dinámicos absurdos. Paga lo que ves desde el primer momento.' }
                ].map((feature, i) => (
                  <motion.div key={i} variants={fadeInUp} className="card-glass" style={{
                    padding: '40px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '24px',
                    transition: 'all 0.3s ease', cursor: 'default'
                  }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <div style={{ color: 'var(--accent)', marginBottom: '24px' }}>{feature.icon}</div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', fontWeight: 800 }}>{feature.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{feature.desc}</p>
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
                  <motion.div key={i} variants={fadeInUp} className="card-glass" style={{
                    padding: '40px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '24px',
                    transition: 'all 0.3s ease', cursor: 'default'
                  }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <div style={{ color: 'var(--accent)', marginBottom: '24px' }}>{feature.icon}</div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '16px', fontWeight: 800 }}>{feature.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{feature.desc}</p>
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
            <div className="card-glass" style={{ maxWidth: '1000px', margin: '0 auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '32px', padding: '60px' }}>
              
              <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '16px' }}>Calcula tu <span style={{ color: 'var(--accent)' }}>Pérdida Actual</span></h2>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Descubre cuánto dinero le estás regalando a las apps tradicionales cada semana.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '60px', alignItems: 'center' }}>
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

                <div className="card-glass" style={{ background: 'var(--bg-secondary)', padding: '40px', borderRadius: '24px', border: '1px solid var(--border)', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '8px' }}>Estás perdiendo aprox.</p>
                  <h3 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 900, color: 'var(--danger)', textShadow: '0 0 40px rgba(255,69,96,0.3)', marginBottom: '8px' }}>
                    {formatCLP(loss)}
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '32px' }}>A la semana (Asumiendo 30% de comisión en otras apps)</p>
                  <Link href="/register" className="btn" style={{ background: 'var(--accent)', color: '#000', width: '100%', padding: '20px', fontSize: '1.1rem', boxShadow: 'var(--accent-glow)' }}>
                    Recuperar mi dinero <Zap size={20} />
                  </Link>
                </div>
              </div>

            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ─── FOOTER ─── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '60px 40px', background: 'var(--bg-secondary)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', opacity: 0.6 }}>
            <Logo width="120" height="45" subtitle={true} />
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
            © {new Date().getFullYear()} Fim Mobility. Todos los derechos reservados. <br/>
            Conectando pasajeros y conductores de manera inteligente y justa.
          </p>
        </div>
      </footer>
      
      {/* Global CSS Overrides for Range Sliders */}
      <style>{`
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
