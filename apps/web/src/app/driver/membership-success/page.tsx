'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import api from '@/lib/api';

function MembershipSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || 'tu membresía';

  useEffect(() => {
    // Almacenar localmente que el pago fue exitoso
    const verifyStatus = async () => {
      try {
        const userStr = localStorage.getItem('fim_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const r = await api.get('/drivers/me');
          localStorage.setItem('fim_user', JSON.stringify({ ...user, ...r.data.driver }));
        }
      } catch (e) {
        console.error(e);
      }
    };
    verifyStatus();

    const timer = setTimeout(() => {
      router.push('/driver');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
        <CheckCircle size={48} className="text-success" />
      </div>
      <h1 className="text-2xl font-black mb-2">¡Pago Exitoso!</h1>
      <p className="text-text-muted mb-8 max-w-sm">
        Tu pago de {plan} se ha procesado correctamente. Ya estás listo para conectarte y recibir viajes.
      </p>
      
      <div className="spinner border-t-accent mb-6" style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <p className="text-sm font-semibold text-accent">Redirigiendo al mapa...</p>
      
      <button 
        onClick={() => router.push('/driver')}
        className="mt-8 btn btn-outline btn-block max-w-xs"
      >
        Ir al Mapa ahora
      </button>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}

export default function MembershipSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div></div>}>
      <MembershipSuccessContent />
    </Suspense>
  );
}
