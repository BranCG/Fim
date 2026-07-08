'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, CheckCircle, ShieldCheck, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react';

export default function PassengerPaymentsPage() {
  const [passenger, setPassenger] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addingCard, setAddingCard] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Inicializar SDK de Mercado Pago. Se requiere la Public Key en el .env
    const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || 'TEST-8fe6a928-8de1-4177-ad61-2b0c169a8e97'; // Reemplazar con real si no hay env
    initMercadoPago(publicKey, { locale: 'es-CL' });

    const userStr = localStorage.getItem('fim_user');
    if (!userStr) {
      router.push('/');
      return;
    }
    const user = JSON.parse(userStr);
    setPassenger(user);
    setLoading(false);
  }, [router]);

  const onSubmitCard = async (formData: any) => {
    if (!passenger) return;
    
    // formData.token es el token criptográfico real de MP
    const token = formData.token;
    if (!token) {
      alert('No se pudo generar el token de seguridad. Verifica los datos de la tarjeta.');
      return;
    }

    try {
      setAddingCard(true);
      await api.post('/payments/passenger/cards', {
        passengerId: passenger.id,
        cardToken: token
      });
      
      const updatedUser = { ...passenger, mpCardToken: token, paymentMethod: 'card' };
      localStorage.setItem('fim_user', JSON.stringify(updatedUser));
      setPassenger(updatedUser);
      
      alert('Tarjeta validada y guardada exitosamente.');
      setAddingCard(false);
    } catch (error) {
      console.error(error);
      alert('Error al guardar la tarjeta. Intenta nuevamente.');
      setAddingCard(false);
    }
  };

  const onErrorCard = (error: any) => {
    console.error('Error de Mercado Pago SDK:', error);
  };

  const onReadyCard = () => {
    console.log('Mercado Pago SDK Ready');
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-white/10 border-t-accent rounded-full animate-spin"></div>
    </div>
  );

  const hasCard = !!passenger?.mpCardToken;

  const initialization = {
    amount: 100, // MP requiere un amount para validar la tarjeta a veces (no se cobra)
    payer: {
      email: passenger?.email || 'pasajero@fim.cl',
    },
  };

  const customization = {
    visual: {
      style: {
        theme: 'dark' as const,
        customVariables: {
          textPrimaryColor: '#ffffff',
          textSecondaryColor: '#a1a1aa',
          inputBackgroundColor: '#09090b',
          inputTextColor: '#ffffff',
          inputBorderColor: '#27272a',
          inputFocusedBorderColor: '#00f2fe',
          buttonBackgroundColor: '#00f2fe',
          buttonTextColor: '#000000',
          buttonHoverBackgroundColor: '#00d8e6',
          baseColor: '#00f2fe',
        }
      }
    },
    paymentMethods: {
      maxInstallments: 1
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary font-sans relative overflow-hidden">
      {/* Luces de fondo ambientales */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-accent/5 blur-[120px] pointer-events-none"></div>

      <header className="relative z-10 flex items-center gap-4 p-5 md:p-6 bg-background/80 backdrop-blur-xl border-b border-border sticky top-0">
        <button 
          onClick={() => router.push('/passenger')} 
          className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-text-primary hover:bg-card/80 hover:border-border-accent transition-all hover:scale-105 active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-extrabold tracking-tight">Métodos de Pago</h1>
      </header>

      <main className="relative z-10 p-5 md:p-8 pb-32 max-w-2xl mx-auto w-full space-y-8">
        
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
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]"></div>
              
              <div className="w-14 h-9 bg-white/10 rounded flex items-center justify-center backdrop-blur-sm">
                <span className="text-[10px] font-black text-white/80 tracking-wider">CARD</span>
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-white tracking-widest">Tarjeta Vinculada</p>
                <p className="text-xs font-medium text-accent mt-0.5">Cobro Automático Seguro Activado</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                <CheckCircle size={18} className="text-accent" />
              </div>
            </div>
          ) : (
            <div className="bg-danger/10 border border-danger/20 text-danger-hover p-4 rounded-xl text-sm leading-relaxed font-medium">
              No tienes ninguna tarjeta guardada. Agrega una para disfrutar de abordaje sin fricción.
            </div>
          )}
        </div>

        {/* Formulario Seguro de Mercado Pago */}
        <div className="bg-card/80 backdrop-blur-md rounded-2xl p-6 border border-border shadow-glass hover:border-border/80 transition-colors">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white mb-2">
              {hasCard ? 'Reemplazar Tarjeta' : 'Agregar Nueva Tarjeta'}
            </h2>
            <p className="text-xs text-text-muted">
              Tus datos están protegidos y encriptados de extremo a extremo por Mercado Pago. Fim no almacena los números de tu tarjeta.
            </p>
          </div>

          <div className="mp-payment-container relative min-h-[400px]">
            {addingCard && (
              <div className="absolute inset-0 bg-card/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl">
                <div className="w-10 h-10 border-4 border-white/10 border-t-accent rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-semibold text-white animate-pulse">Guardando tarjeta de forma segura...</p>
              </div>
            )}
            
            <CardPayment
              initialization={initialization}
              customization={customization}
              onSubmit={onSubmitCard}
              onReady={onReadyCard}
              onError={onErrorCard}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
