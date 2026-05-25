'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';
import SplashScreen from '@/components/SplashScreen';
import { getSession } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [tripsPerWeek, setTripsPerWeek] = useState(60);
  const [avgPrice, setAvgPrice] = useState(6000);
  const [loss, setLoss] = useState(0);
  const [activeView, setActiveView] = useState<'passenger' | 'driver'>('passenger');

  useEffect(() => {
    const s = getSession();
    if (s && s.user && s.user.role) {
      if (s.user.role === 'driver') {
        router.push('/driver');
      } else {
        router.push('/passenger');
      }
    }
  }, [router]);

  useEffect(() => {
    // Calculamos pérdida mensual (4 semanas) asumiendo 25% de comisión
    const calculatedLoss = Math.round(tripsPerWeek * 4 * avgPrice * 0.25);
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
          ? '¡PROMO LANZAMIENTO! 50% DCTO EN TU 1er VIAJE (TOPE $8.000)'
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
            userSelect: 'none'
          }}>
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
            userSelect: 'none'
          }}>
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
          {/* Promo Pasajero Section */}
          <section style={{ 
            padding: '60px 24px', 
            background: 'linear-gradient(135deg, rgba(0,229,160,0.08) 0%, rgba(9,9,15,1) 100%)',
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            textAlign: 'center'
          }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px' }}>Beneficio Pasajeros</div>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                50% DCTO en tu primer viaje 
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '24px' }}>
                Regístrate hoy y viaja a mitad de precio. <br />
                <span style={{ display: 'inline-block', background: 'rgba(255,165,0,0.1)', color: 'var(--warning)', padding: '6px 14px', borderRadius: '4px', fontWeight: 800, marginTop: '12px', fontSize: '0.95rem' }}>
                  TOPE MÁXIMO DE DESCUENTO: $8.000
                </span>
              </p>
              <Link href="/register?role=passenger" className="btn btn-accent btn-lg" style={{ boxShadow: '0 0 20px rgba(0,229,160,0.25)' }}>
                Obtener mi descuento ahora
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
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  ),
                  title: '1. Cotiza y Pide',
                  desc: 'Ingresa tu origen y destino. El sistema calculará la tarifa justa sin tarifas dinámicas especulativas.'
                },
                {
                  icon: (
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  ),
                  title: '2. Código OTP Seguro',
                  desc: 'Al abordar el auto, indícale al conductor tu código de seguridad OTP exclusivo para autorizar el viaje.'
                },
                {
                  icon: (
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                  ),
                  title: '3. Pago Directo',
                  desc: 'Paga con tarjeta mediante el enlace de Mercado Pago del conductor o en efectivo. Sin cargos extra de intermediación.'
                },
                {
                  icon: (
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  ),
                  title: '4. Viajes Regulados',
                  desc: 'Viaja con conductores validados con control de identidad y cumplimiento tributario del SII al día.'
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

          {/* Línea de Tiempo del Conductor y el SII */}
          <section style={{ padding: '80px 24px', background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px' }}>PROCESO DE ACTIVACIÓN</div>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'white' }}>
                  Línea de Tiempo del Conductor
                </h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '10px', fontSize: '0.95rem' }}>
                  Sigue estos 4 sencillos pasos para registrarte, formalizarte y comenzar a conducir con Fim.
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
                    desc: 'Regístrate como Conductor en Fim. Deberás subir tu licencia de conducir profesional y pasar el control de verificación de identidad biométrico.'
                  },
                  {
                    step: '2',
                    title: 'Inicio de Actividades en el SII',
                    desc: 'Declara el giro de transporte de pasajeros por carretera (Código 492230) en sii.cl para cumplir con el marco regulatorio tributario en Chile.'
                  },
                  {
                    step: '3',
                    title: 'Vincula tu Mercado Pago',
                    desc: 'Pega tu enlace de cobro de Mercado Pago en la app. Los pasajeros te transferirán directo a tu cuenta el monto (incluyendo el recargo de 3.19% de la tarjeta).'
                  },
                  {
                    step: '4',
                    title: 'Cumplimiento Tributario Fim (15.25%)',
                    desc: 'Fim valida mensualmente tu cumplimiento. Sube tu Boleta de Honorarios emitida en el SII con la retención provisoria sugerida para mantener tu cuenta habilitada.'
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
                <div style={{ fontSize: '0.9rem', color: '#ff4757', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.1em' }}>Pérdida mensual estimada</div>
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
                  💎 Membresías de Conductor
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
                  <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #D4AF37, #B8960C)', padding: '6px 20px', borderRadius: '0 0 10px 10px', fontSize: '0.72rem', fontWeight: 900, color: '#000', letterSpacing: '0.1em' }}>
                    ⭐ MÁS POPULAR
                  </div>

                  {/* Glow efecto */}
                  <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '12px' }}>
                    <div style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #D4AF37, #B8960C)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900, color: '#000', letterSpacing: '0.1em' }}>
                      🖤 PLAN BLACK
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
                    <div style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900, color: '#fff', letterSpacing: '0.1em' }}>
                      🟡 PLAN COMFORT
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
                    <div style={{ color: '#FBBF24', fontWeight: 800, marginBottom: '6px' }}>⏰ ¿Cómo funciona?</div>
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
                    <div style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #10B981, #059669)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900, color: '#fff', letterSpacing: '0.1em' }}>
                      🟢 PLAN FLEX
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
                    <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                      🟢 Activo · ⬜ Bloqueado
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

              {/* Comparador resumen */}
              <div style={{ marginTop: '48px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '16px', padding: '28px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Característica</th>
                      <th style={{ textAlign: 'center', padding: '10px 16px', color: '#D4AF37', fontWeight: 900 }}>🖤 BLACK</th>
                      <th style={{ textAlign: 'center', padding: '10px 16px', color: '#60A5FA', fontWeight: 900 }}>🟡 COMFORT</th>
                      <th style={{ textAlign: 'center', padding: '10px 16px', color: '#34D399', fontWeight: 900 }}>🟢 FLEX</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Precio', '$150.000/mes', '$20.000/día', '$60.000/fin de semana'],
                      ['Días activos', 'Los 30 del mes', 'Los que trabajes', 'Vie · Sáb · Dom'],
                      ['Forma de pago', 'Mercado Pago', 'Transferencia + comprobante', 'Mercado Pago'],
                      ['Comisión por carrera', '0%', '0%', '0%'],
                      ['Ideal para', 'Conductor full-time', 'Conductor variable', 'Conductor de fin de semana'],
                    ].map(([feature, black, comfort, flex]) => (
                      <tr key={String(feature)} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{feature}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: '#D4AF37', fontWeight: 700 }}>{black}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: '#60A5FA', fontWeight: 700 }}>{comfort}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', color: '#34D399', fontWeight: 700 }}>{flex}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Guía Mercado Pago */}
          <section style={{ padding: '80px 24px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <h2 style={{ textAlign: 'center', marginBottom: '40px', fontSize: '2rem', fontWeight: 900 }}>Cómo recibir pagos con tarjeta</h2>
              <div style={{ background: 'var(--bg-primary)', padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ background: 'var(--accent)', color: 'black', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>1</div>
                    <p>Crea una cuenta en <strong>Mercado Pago</strong> (es gratis y personal).</p>
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ background: 'var(--accent)', color: 'black', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>2</div>
                    <p>En tu app de Mercado Pago, ve a <strong>Cobrar con Link</strong> y crea un link genérico o usa tu código QR.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ background: 'var(--accent)', color: 'black', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>3</div>
                    <p>Pega ese link en tu perfil de <strong>Fim</strong> en la sección "Cobro Directo".</p>
                  </div>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ background: 'var(--accent)', color: 'black', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>4</div>
                    <p>¡Listo! Al terminar un viaje, el pasajero verá tu link y te pagará <strong>directo a tu cuenta</strong>.</p>
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
