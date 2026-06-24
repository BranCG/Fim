import React, { useState, useEffect } from 'react';
import api, { formatCLP } from '@/lib/api';

const IconWallet = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></svg>;
const IconFuel = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="15" y2="22" /><line x1="4" y1="9" x2="14" y2="9" /><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" /><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" /></svg>;
const IconWrench = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>;
const IconTax = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2" /><rect x="9" y="9" width="6" height="6" /><line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" /><line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" /><line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" /><line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" /></svg>;
const IconAward = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></svg>;
const IconSettings = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
const IconInfo = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>;

export default function FinancesDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  
  // Config form state
  const [fuelEfficiency, setFuelEfficiency] = useState('');
  const [fuelPrice, setFuelPrice] = useState('');
  const [netIncomeGoal, setNetIncomeGoal] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Info Modal state
  const [infoModal, setInfoModal] = useState<{title: string, desc: string} | null>(null);

  const fetchData = async () => {
    try {
      const res = await api.get('/finances/dashboard');
      setData(res.data);
      setFuelEfficiency(res.data.config.fuelEfficiency?.toString() || '12');
      setFuelPrice(res.data.config.fuelPrice?.toString() || '1300');
      setNetIncomeGoal(res.data.goals.incomeGoal?.toString() || '1000000');
    } catch (err) {
      console.error('Error fetching finances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await api.put('/finances/config', {
        fuelEfficiency: parseFloat(fuelEfficiency),
        fuelPrice: parseInt(fuelPrice),
        netIncomeGoal: parseInt(netIncomeGoal)
      });
      setShowConfig(false);
      setLoading(true);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando tus finanzas...</div>;
  }

  if (!data) return null;

  // Calculamos el % de la meta de ingresos
  const incomeProgress = Math.max(0, Math.min((data.netIncome / data.goals.incomeGoal) * 100, 100));
  
  // Calculamos el % de la meta de descuento
  const discountGoalPercent = data.goals.discountGoal > 0 ? Math.min((data.goals.discountProgress / data.goals.discountGoal) * 100, 100) : 0;

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', animation: 'fadeIn 0.3s' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={{ flex: 1, paddingRight: '12px' }}>
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 8px 0', fontWeight: 800 }}>Fim Finanzas</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, lineHeight: 1.4 }}>
            Tu <strong>ingreso neto real</strong> se calcula restando todos tus costos operativos (bencina, mantención, impuestos y membresía) a tu recaudación bruta. 
            <br/><br/>
            Toca el <strong>engranaje dorado a tu derecha</strong> para configurar el rendimiento de tu vehículo y establecer tu meta motivadora de la semana.
          </p>
        </div>
        <button 
          onClick={() => setShowConfig(true)} 
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: 'var(--gold)', 
            cursor: 'pointer', 
            padding: '8px',
            animation: 'pulseGold 2s infinite',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(212, 175, 55, 0.4)'
          }}
        >
          <style>{`
            @keyframes pulseGold {
              0% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.7); transform: scale(1); }
              70% { box-shadow: 0 0 0 10px rgba(212, 175, 55, 0); transform: scale(1.1); }
              100% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); transform: scale(1); }
            }
          `}</style>
          <IconSettings />
        </button>
      </div>

      {/* TARJETA PRINCIPAL: INGRESO NETO */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(0, 229, 160, 0.1), rgba(0, 229, 160, 0.02))', 
        border: '1px solid rgba(0,229,160,0.3)', 
        borderRadius: 'var(--radius-lg)', 
        padding: '24px', 
        marginBottom: '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ color: 'var(--success)' }}><IconWallet /></div>
          <h2 style={{ margin: 0, fontSize: '1rem', color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ganancia Neta Real (Semana)</h2>
        </div>
        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>
          {formatCLP(data.netIncome)}
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
          Ingreso Bruto de la Semana: {formatCLP(data.gross.week)}
        </p>
      </div>

      {/* GASTOS OPERATIVOS */}
      <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-primary)' }}>Tus Costos Estimados (Esta Semana)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid rgba(255,69,96,0.2)' }}>
          <div style={{ color: 'var(--danger)' }}><IconFuel /></div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Bencina 
            <button onClick={() => setInfoModal({title: 'Cálculo de Bencina', desc: 'Se calcula dividiendo la distancia exacta recorrida en tus viajes por el rendimiento configurado (km/l), multiplicado por el precio del litro.'})} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 0, cursor: 'pointer', display: 'flex' }}><IconInfo /></button>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>-{formatCLP(data.expenses.fuel)}</div>
        </div>
        
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid rgba(255,165,0,0.2)' }}>
          <div style={{ color: 'orange' }}><IconWrench /></div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Deterioro
            <button onClick={() => setInfoModal({title: 'Deterioro / Mantención', desc: 'Es una estimación estándar de $50 CLP por cada kilómetro recorrido, para cubrir desgastes a largo plazo de neumáticos, aceite y reparaciones generales.'})} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 0, cursor: 'pointer', display: 'flex' }}><IconInfo /></button>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>-{formatCLP(data.expenses.wear)}</div>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid rgba(96,165,250,0.2)' }}>
          <div style={{ color: '#60A5FA' }}><IconTax /></div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Provisión SII
            <button onClick={() => setInfoModal({title: 'Provisión SII (13.75%)', desc: 'Reservamos un 13.75% calculado sobre tu Ingreso Bruto total (recaudación sin descontar costos) para simular de forma exacta tus futuras obligaciones tributarias de boletas de honorarios en Chile.'})} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 0, cursor: 'pointer', display: 'flex' }}><IconInfo /></button>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>-{formatCLP(data.expenses.taxes)}</div>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid rgba(212,175,55,0.2)' }}>
          <div style={{ color: 'var(--gold)' }}><IconWallet /></div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Membresía
            <button onClick={() => setInfoModal({title: 'Membresía Fim', desc: 'Es el valor de tu plan mensual de Fim prorrateado proporcionalmente a una semana, para que sepas exactamente cuál es tu costo fijo por operar en estos 7 días.'})} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 0, cursor: 'pointer', display: 'flex' }}><IconInfo /></button>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>-{formatCLP(data.expenses.membership)}</div>
        </div>
      </div>

      {/* METAS */}
      <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-primary)' }}>Progreso de Metas</h3>
      
      {/* Meta de Ingresos */}
      <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Meta de Ganancia (Semanal)</span>
          <span style={{ fontSize: '0.9rem', color: 'var(--accent)' }}>{formatCLP(data.netIncome)} / {formatCLP(data.goals.incomeGoal)}</span>
        </div>
        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.15)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${incomeProgress}%`, height: '100%', background: 'var(--success)', borderRadius: '4px', transition: 'width 1s ease-out' }} />
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'right' }}>
          {incomeProgress.toFixed(1)}% logrado
        </div>
      </div>

      {/* Meta de Descuento (Exclusiva) */}
      {data.goals.discountGoal > 0 && (
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.02))', 
          border: '1px solid var(--gold)', 
          borderRadius: 'var(--radius)', 
          padding: '20px' 
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ color: 'var(--gold)' }}><IconAward /></div>
            <div>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--gold)', display: 'block' }}>¡Descuento de Membresía!</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Completa {data.goals.discountGoal} viajes este mes para obtener un descuento exclusivo en tu próxima renovación.</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
            <span>Viajes Completados</span>
            <span style={{ fontWeight: 600 }}>{data.goals.discountProgress} / {data.goals.discountGoal}</span>
          </div>
          <div style={{ width: '100%', height: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '5px', overflow: 'hidden' }}>
            <div style={{ width: `${discountGoalPercent}%`, height: '100%', background: 'var(--gold)', borderRadius: '5px', transition: 'width 1s ease-out' }} />
          </div>
          {discountGoalPercent >= 100 && (
            <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600, textAlign: 'center' }}>
              ✨ ¡Felicidades! Has asegurado tu descuento para el próximo pago.
            </div>
          )}
        </div>
      )}

      {/* HISTORIAL DE METAS */}
      {data.history && data.history.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Historial de Metas</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Acá podrás ver tu historial de METAS. Con esto podrás ir viendo tu avance y tu % de éxito mediante las metas que vas cumpliendo semana a semana.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.history.map((week: any, idx: number) => (
              <div key={idx} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', opacity: idx === 0 ? 1 : 0.8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: idx === 0 ? 'var(--accent)' : 'var(--text-primary)' }}>{week.label}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatCLP(week.netIncome)} / {formatCLP(week.goal)}</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${week.progress}%`, height: '100%', background: week.progress >= 100 ? 'var(--success)' : (idx === 0 ? 'var(--accent)' : 'var(--text-secondary)'), borderRadius: '3px' }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: week.progress >= 100 ? 'var(--success)' : 'var(--text-muted)', textAlign: 'right', fontWeight: week.progress >= 100 ? 700 : 400 }}>
                  {week.progress >= 100 ? '¡Meta Cumplida! 🏆' : `${week.progress.toFixed(1)}% logrado`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DE CONFIGURACIÓN */}
      {showConfig && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '24px', animation: 'slideUp 0.3s' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem' }}>Ajustes de Vehículo y Metas</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Rendimiento en Ciudad (km/litro)</label>
              <input type="number" step="0.1" className="form-input" value={fuelEfficiency} onChange={e => setFuelEfficiency(e.target.value)} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Precio Bencina (CLP/litro)</label>
              <input type="number" className="form-input" value={fuelPrice} onChange={e => setFuelPrice(e.target.value)} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Meta de Ganancia Neta Semanal (CLP)</label>
              <input type="number" className="form-input" value={netIncomeGoal} onChange={e => setNetIncomeGoal(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowConfig(false)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSaveConfig} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE INFORMACIÓN (TOOLTIPS) */}
      {infoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setInfoModal(null)}>
          <div className="card" style={{ width: '100%', maxWidth: '350px', padding: '24px', animation: 'scaleIn 0.2s', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconInfo />
              {infoModal.title}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: '0 0 24px 0' }}>
              {infoModal.desc}
            </p>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setInfoModal(null)}>Entendido</button>
          </div>
        </div>
      )}
    </div>
  );
}
