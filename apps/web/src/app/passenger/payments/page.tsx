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

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length >= 3) {
      val = val.slice(0, 2) + '/' + val.slice(2, 4);
    }
    setExpiry(val);
  };

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
    const fakeToken = `tok_${Math.random().toString(36).substr(2, 9)}`;

    try {
      setAddingCard(true);
      await api.post('/payments/passenger/cards', {
        passengerId: passenger.id,
        cardToken: fakeToken
      });
      
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
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-white/10 border-t-accent rounded-full animate-spin"></div>
    </div>
  );

  const hasCard = !!passenger?.mpCardToken;

  return (
    <div className="min-h-screen bg-background text-text-primary font-sans relative overflow-hidden">
      {/* Luces de fondo (Efecto ambiental premium) */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-accent/5 blur-[120px] pointer-events-none"></div>

      <header className="relative z-10 flex items-center gap-4 p-5 md:p-6 bg-background/80 backdrop-blur-xl border-b border-border sticky top-0">
        <button 
          onClick={() => router.push('/passenger')} 
          className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-text-primary hover:bg-card/80 hover:border-border-accent transition-all hover:scale-105 active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-extrabold tracking-tight">Mis Tarjetas</h1>
      </header>

      <main className="relative z-10 p-5 md:p-8 pb-32 max-w-2xl mx-auto w-full space-y-6">
        
        {/* Tarjeta Actual */}
        <div className="bg-card/80 backdrop-blur-md rounded-2xl p-6 border border-border relative overflow-hidden group hover:border-border-accent transition-colors duration-500 shadow-glass">
          <div className="absolute -top-4 -right-4 opacity-[0.03] text-accent pointer-events-none transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
            <ShieldCheck size={160} />
          </div>
          
          <h2 className="text-lg font-bold flex items-center gap-2 mb-5 text-white">
            <CreditCard size={22} className="text-accent" />
            Método de Pago Principal
          </h2>
          
          {hasCard ? (
            <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 flex items-center gap-4 relative overflow-hidden">
              {/* Brillo dinámico en la tarjeta */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]"></div>
              
              <div className="w-14 h-9 bg-white/10 rounded flex items-center justify-center backdrop-blur-sm">
                <span className="text-[10px] font-black text-white/80 tracking-wider">VISA</span>
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-white tracking-widest">•••• •••• •••• 4242</p>
                <p className="text-xs font-medium text-accent mt-0.5">Cobro Automático Activado</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                <CheckCircle size={18} className="text-accent" />
              </div>
            </div>
          ) : (
            <div className="bg-danger/10 border border-danger/20 text-danger-hover p-4 rounded-xl text-sm leading-relaxed font-medium">
              No tienes ninguna tarjeta guardada. Agrega una para disfrutar de pagos automáticos y un abordaje sin fricción.
            </div>
          )}
        </div>

        {/* Formulario Agregar Nueva */}
        <div className="bg-card/80 backdrop-blur-md rounded-2xl p-6 border border-border shadow-glass hover:border-border/80 transition-colors">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-6 text-white">
            <Plus size={22} className="text-accent" />
            {hasCard ? 'Reemplazar Tarjeta' : 'Agregar Nueva Tarjeta'}
          </h2>

          <form onSubmit={handleSaveCard} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider ml-1">Número de Tarjeta</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="0000 0000 0000 0000" 
                  value={cardNumber}
                  onChange={e => setCardNumber(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm font-medium text-white placeholder-white/20 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                  required
                />
                <CreditCard size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30" />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider ml-1">Nombre en la tarjeta</label>
              <input 
                type="text" 
                placeholder="Juan Pérez" 
                value={cardName}
                onChange={e => setCardName(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm font-medium text-white placeholder-white/20 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider ml-1">Vence (MM/AA)</label>
                <input 
                  type="text" 
                  placeholder="12/25" 
                  value={expiry}
                  onChange={handleExpiryChange}
                  maxLength={5}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm font-medium text-white placeholder-white/20 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-center tracking-widest"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider ml-1">CVC</label>
                <input 
                  type="text" 
                  placeholder="123" 
                  value={cvc}
                  maxLength={4}
                  onChange={e => setCvc(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm font-medium text-white placeholder-white/20 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-center tracking-widest"
                  required
                />
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={addingCard}
                className={`w-full relative overflow-hidden group flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base transition-all duration-300 ${
                  addingCard 
                  ? 'bg-card border border-border text-text-muted' 
                  : 'bg-accent text-black hover:bg-accent-hover hover:scale-[1.02] hover:shadow-accent active:scale-95'
                }`}
              >
                {!addingCard && (
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                )}
                
                {addingCard ? (
                  <div className="w-5 h-5 border-2 border-text-muted border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <ShieldCheck size={20} className="relative z-10" />
                )}
                <span className="relative z-10">{addingCard ? 'Procesando Tarjeta...' : 'Guardar Tarjeta Segura'}</span>
              </button>
              
              <div className="flex items-center justify-center gap-2 mt-5 text-text-muted opacity-80">
                <ShieldCheck size={14} className="text-accent" /> 
                <p className="text-xs font-medium">Procesado y encriptado por Mercado Pago.</p>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
