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
    const userStr = localStorage.getItem('user');
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
      localStorage.setItem('user', JSON.stringify(updatedUser));
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

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">Cargando...</div>;

  const hasCard = !!passenger?.mpCardToken;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 pb-24 font-sans">
      <div className="max-w-md mx-auto pt-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push('/passenger')} className="p-2 bg-gray-900 rounded-full hover:bg-gray-800 transition">
            <ArrowLeft className="w-5 h-5 text-gray-300" />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Mis Tarjetas</h1>
        </div>

        {/* Tarjeta Actual */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <ShieldCheck className="w-24 h-24" />
          </div>
          
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            Método de Pago Principal
          </h2>
          
          {hasCard ? (
            <div className="bg-gray-950/50 rounded-xl p-4 border border-emerald-500/30 flex items-center gap-4">
              <div className="w-12 h-8 bg-gray-800 rounded flex items-center justify-center">
                <span className="text-xs font-bold text-gray-400">VISA</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">•••• •••• •••• 4242</p>
                <p className="text-xs text-gray-500">Cobro Automático Activado</p>
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl text-sm">
              No tienes ninguna tarjeta guardada. Agrega una para disfrutar de pagos automáticos al finalizar tus viajes.
            </div>
          )}
        </div>

        {/* Formulario Agregar Nueva */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-blue-400" />
            {hasCard ? 'Reemplazar Tarjeta' : 'Agregar Tarjeta'}
          </h2>

          <form onSubmit={handleSaveCard} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Número de Tarjeta</label>
              <input 
                type="text" 
                placeholder="0000 0000 0000 0000" 
                value={cardNumber}
                onChange={e => setCardNumber(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Nombre en la tarjeta</label>
              <input 
                type="text" 
                placeholder="Juan Pérez" 
                value={cardName}
                onChange={e => setCardName(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-400 mb-1">Vencimiento (MM/AA)</label>
                <input 
                  type="text" 
                  placeholder="12/25" 
                  value={expiry}
                  onChange={e => setExpiry(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-400 mb-1">CVC</label>
                <input 
                  type="text" 
                  placeholder="123" 
                  value={cvc}
                  onChange={e => setCvc(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={addingCard}
                className={`w-full ${addingCard ? 'bg-gray-700' : 'bg-blue-600 hover:bg-blue-500'} text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center gap-2`}
              >
                <ShieldCheck className="w-5 h-5" />
                {addingCard ? 'Guardando de forma segura...' : 'Guardar Tarjeta Segura'}
              </button>
              <p className="text-center text-xs text-gray-500 mt-3">
                Procesado de forma segura por Mercado Pago. 100% encriptado.
              </p>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
