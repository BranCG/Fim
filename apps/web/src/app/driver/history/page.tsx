'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api, { formatCLP, getSession } from '@/lib/api';

const IconMap = ({ size = 24 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Maps--Streamline-Ultimate" height={size} width={size}>
    <desc>Maps Streamline Icon: https://streamlinehq.com</desc>
    <path fill="#c2f3ff" d="M3 5.82L9 3v14.77l-6 2.82V5.82z" strokeWidth="1" />
    <path fill="#e3e3e3" d="M9 3l6 2.82v14.77L9 17.77V3z" strokeWidth="1" />
    <path fill="#c2f3ff" d="M15 5.82L21 3v14.77l-6 2.82V5.82z" strokeWidth="1" />
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M3 5.82v14.77l6-2.82 6 2.82 6-2.82V3l-6 2.82L9 3 3 5.82zM9 3v14.77M15 5.82v14.77" strokeWidth="1" />
    <path fill="#ff808c" d="M12 7.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" strokeWidth="1" />
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M12 7.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" strokeWidth="1" />
  </svg>
);

interface Trip {
  id: string;
  createdAt: string;
  originAddress: string;
  destAddress: string;
  estimatedPrice: number;
  status: string;
  paymentMethod: string;
  passenger: { name: string };
  rating?: { score: number; comment?: string };
}

export default function DriverHistoryPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaxGuide, setShowTaxGuide] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const paginatedTrips = trips.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(trips.length / itemsPerPage);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.push('/login'); return; }

    api.get('/trips/driver-trips')
      .then(r => setTrips(r.data.trips))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="app-container" style={{ padding: '24px', background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <Link href="/driver" style={{ color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          VOLVER AL MAPA
        </Link>
      </header>

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconMap size={28} />
          Historial de Viajes
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Tus ganancias y recorridos completados.</p>
      </div>

      {/* Resumen Financiero y Tributario */}
      {!loading && trips.length > 0 && (
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, #161624 0%, #0c0c14 100%)',
          border: '1px solid var(--border)',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '24px',
          boxShadow: 'var(--shadow)'
        }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent)', marginBottom: '14px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Resumen Tributario (SII Chile 2026)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Ganancia Bruta (100%)</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>
                {formatCLP(trips.reduce((acc, t) => acc + t.estimatedPrice, 0))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Retención Renta (15.25%)</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--danger)' }}>
                {formatCLP(Math.round(trips.reduce((acc, t) => acc + t.estimatedPrice, 0) * 0.1525))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Estimado Líquido</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--accent)' }}>
                {formatCLP(Math.round(trips.reduce((acc, t) => acc + t.estimatedPrice, 0) * (1 - 0.1525)))}
              </div>
            </div>
          </div>
          
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.02)', 
            borderLeft: '3px solid var(--accent)', 
            padding: '10px 12px', 
            borderRadius: '0 var(--radius) var(--radius) 0',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.4',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            alignItems: 'flex-start'
          }}>
            <div>
              <strong>Nota de Cumplimiento:</strong> En Chile, el transporte terrestre de personas está <strong>exento de IVA (19%)</strong>. Sin embargo, corresponde declarar la <strong>retención del 15,25% de Impuesto a la Renta</strong> sobre tus ingresos netos en tu declaración anual (Operación Renta). Como Fim no intermedia tus pagos de pasajeros, te sugerimos emitir mensualmente tus boletas de honorarios.
            </div>
            <button 
              className="btn btn-accent btn-block" 
              onClick={() => setShowTaxGuide(true)}
              style={{ 
                fontSize: '0.8rem', 
                padding: '10px 16px', 
                fontWeight: 800, 
                whiteSpace: 'normal', 
                height: 'auto', 
                textAlign: 'center', 
                marginTop: '12px' 
              }}
            >
              📖 Guía Paso a Paso: Cómo Emitir tu Boleta en el SII
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner" />
        </div>
      ) : trips.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.3, display: 'flex', justifyContent: 'center' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="19" r="3" />
              <circle cx="18" cy="5" r="3" />
              <path d="M9 19h8.5a4.5 4.5 0 0 0 0-9H9a4.5 4.5 0 0 1 0-9h6" />
            </svg>
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Aún no has completado ningún viaje.</p>
          <Link href="/driver" className="btn btn-primary" style={{ marginTop: '24px' }}>Empezar a conducir</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {paginatedTrips.map(trip => (
            <div key={trip.id} className="card" style={{ border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    {new Date(trip.createdAt).toLocaleDateString('es-CL', { dateStyle: 'long' })} · {new Date(trip.createdAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{trip.passenger.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--gold)' }}>{formatCLP(trip.estimatedPrice)}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>
                    {trip.paymentMethod === 'cash' ? '💵 Efectivo' : '💳 Mercado Pago'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }} />
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{trip.originAddress}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--warning)' }} />
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{trip.destAddress}</div>
                </div>
              </div>

              {trip.rating && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i < trip.rating!.score ? 'var(--warning)' : 'rgba(255,255,255,0.1)'}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    ))}
                  </div>
                  {trip.rating.comment && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>"{trip.rating.comment}"</span>}
                </div>
              )}
            </div>
          ))}
          
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary"
                style={{ opacity: currentPage === 1 ? 0.5 : 1, padding: '8px 16px' }}
              >
                ← Anteriores
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Página {currentPage} de {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-secondary"
                style={{ opacity: currentPage === totalPages ? 0.5 : 1, padding: '8px 16px' }}
              >
                Siguientes →
              </button>
            </div>
          )}
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
                  Selecciona el archivo PDF o imagen de la boleta recién emitida y súbela en tu pantalla de cumplimiento tributario. Tu cuenta se mantendrá al día.
                </p>
              </div>
            </div>
            
            <button className="btn btn-accent btn-block" onClick={() => setShowTaxGuide(false)} style={{ marginTop: '24px' }}>Entendido, continuar</button>
          </div>
        </div>
      )}
    </div>
  );
}
