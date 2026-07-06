'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, CheckCircle, ShieldCheck, Plus, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';

export default function PassengerPaymentsPage() {
  const [passenger, setPassenger] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addingCard, setAddingCard] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('fim_user');
    if (!userStr) {
      router.push('/');
      return;
    }
    const user = JSON.parse(userStr);
    setPassenger(user);
    setLoading(false);
  }, []);

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passenger) return;
    
    // NOTA: En un entorno de producción, aquí se usaría el SDK de MercadoPago
    // (MercadoPago.js) para tokenizar la tarjeta de forma segura sin que los datos 
    // pasen por nuestro servidor. Como este es un prototipo, simularemos el token.
    const fakeToken = `tok_${Math.random().toString(36).substr(2, 9)}`;

    try {
      setAddingCard(true);
      await api.post('/payments/passenger/cards', {
        passengerId: passenger.id,
        cardToken: fakeToken
      });
      
      // Actualizar estado local
      const updatedUser = { ...passenger, mpCardToken: fakeToken, paymentMethod: 'card' };
      localStorage.setItem('fim_user', JSON.stringify(updatedUser));
      setPassenger(updatedUser);
      
      alert('Tarjeta guardada exitosamente para cobros automáticos.');
      setAddingCard(false);
      setCardNumber(''); setCardName(''); setExpiry(''); setCvc('');
    } catch (error) {
      console.error(error);
      alert('Error al guardar la tarjeta');
      setAddingCard(false);
    }
  };

  if (loading) return (
    <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
    </div>
  );

  const hasCard = !!passenger?.mpCardToken;

  return (
    <div className="app-container">
      <header className="app-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
        <button 
          onClick={() => router.push('/passenger')} 
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Mis Tarjetas</h1>
      </header>

      <main className="main-content" style={{ padding: '24px 20px', paddingBottom: '100px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        
        {/* Tarjeta Actual */}
        <div className="card animate-in" style={{ position: 'relative', overflow: 'hidden', marginBottom: '24px', padding: '24px' }}>
          <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.05, pointerEvents: 'none' }}>
            <ShieldCheck size={120} />
          </div>
          
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#fff' }}>
            <CreditCard size={20} color="var(--accent)" />
            Método de Pago Principal
          </h2>
          
          {hasCard ? (
            <div style={{ 
              background: 'rgba(212, 175, 55, 0.05)', 
              border: '1px solid rgba(212, 175, 55, 0.2)', 
              borderRadius: 'var(--radius)', 
              padding: '16px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px' 
            }}>
              <div style={{ width: '48px', height: '32px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>VISA</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>•••• •••• •••• 4242</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--accent)' }}>Cobro Automático Activado</p>
              </div>
              <CheckCircle size={24} color="var(--accent)" />
            </div>
          ) : (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'rgba(255, 150, 150, 1)', padding: '16px', borderRadius: 'var(--radius)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              No tienes ninguna tarjeta guardada. Agrega una para disfrutar de pagos automáticos al finalizar tus viajes.
            </div>
          )}
        </div>

        {/* Formulario Agregar Nueva */}
        <div className="card animate-in" style={{ animationDelay: '0.1s', padding: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#fff' }}>
            <Plus size={20} color="var(--accent)" />
            {hasCard ? 'Reemplazar Tarjeta' : 'Agregar Tarjeta'}
          </h2>

          <form onSubmit={handleSaveCard} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Número de Tarjeta</label>
              <input 
                type="text" 
                className="form-input"
                placeholder="0000 0000 0000 0000" 
                value={cardNumber}
                onChange={e => setCardNumber(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nombre en la tarjeta</label>
              <input 
                type="text" 
                className="form-input"
                placeholder="Juan Pérez" 
                value={cardName}
                onChange={e => setCardName(e.target.value)}
                required
              />
            </div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Vencimiento (MM/AA)</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="12/25" 
                  value={expiry}
                  onChange={e => setExpiry(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>CVC</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="123" 
                  value={cvc}
                  onChange={e => setCvc(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <button 
                type="submit" 
                className="btn btn-primary btn-block"
                disabled={addingCard}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', fontWeight: 800 }}
              >
                {addingCard ? (
                  <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                ) : (
                  <ShieldCheck size={20} />
                )}
                {addingCard ? 'Guardando...' : 'Guardar Tarjeta Segura'}
              </button>
              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <ShieldCheck size={14} /> Procesado de forma segura por Mercado Pago.
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
