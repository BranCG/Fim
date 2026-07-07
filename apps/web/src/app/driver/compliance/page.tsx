'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, UploadCloud, AlertCircle, FileText, Link as LinkIcon, Download, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';

function ComplianceContent() {
  const [driver, setDriver] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const successParam = searchParams.get('success');

  useEffect(() => {
    fetchData();
    
    // Escuchar cuando el usuario vuelve a la app (cierra el navegador)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', fetchData);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', fetchData);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userStr = localStorage.getItem('fim_user');
      if (!userStr) {
        router.push('/');
        return;
      }
      const user = JSON.parse(userStr);

      try {
        const driverRes = await api.get(`/drivers/${user.id}`);
        const updatedDriver = driverRes.data;
        localStorage.setItem('fim_user', JSON.stringify({ ...user, ...updatedDriver }));
        setDriver(updatedDriver);
      } catch (err) {
        setDriver(user); // fallback
      }

      const docsRes = await api.get(`/tax/driver/${user.id}`);
      setDocuments(docsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLink = () => {
    const clientId = process.env.NEXT_PUBLIC_MP_CLIENT_ID || 'TU_CLIENT_ID';
    const redirectUri = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/payments/oauth/callback`;
    const url = `https://auth.mercadopago.com/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${driver?.id}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = url;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !driver) return;

    const formData = new FormData();
    formData.append('taxDocument', file);
    formData.append('driverId', driver.id);
    const now = new Date();
    formData.append('month', String(now.getMonth() + 1));
    formData.append('year', String(now.getFullYear()));
    formData.append('amount', '100000');

    try {
      setUploading(true);
      const res = await api.post('/tax/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      localStorage.setItem('fim_user', JSON.stringify({ ...driver, taxDocuments: [res.data.document, ...(driver.taxDocuments || [])] }));
      alert('Boleta subida exitosamente');
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-white/10 border-t-accent rounded-full animate-spin"></div>
    </div>
  );

  const isLinked = !!driver?.mpAccessToken;

  return (
    <div className="min-h-screen bg-background text-text-primary font-sans relative overflow-hidden">
      {/* Luces de fondo (Efecto ambiental premium) */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-accent/5 blur-[120px] pointer-events-none"></div>

      <header className="relative z-10 flex items-center gap-4 p-5 md:p-6 bg-background/80 backdrop-blur-xl border-b border-border sticky top-0">
        <button 
          onClick={() => router.push('/driver')} 
          className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-text-primary hover:bg-card/80 hover:border-border-accent transition-all hover:scale-105 active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-extrabold tracking-tight">Cumplimiento y Pagos</h1>
      </header>

      <main className="relative z-10 p-5 md:p-8 pb-32 max-w-2xl mx-auto w-full space-y-6">
        <p className="text-text-muted text-sm leading-relaxed mb-6">
          Mantén tu cuenta al día para seguir conduciendo y recibir pagos automáticos directamente a tu cuenta.
        </p>

        {successParam === 'oauth' && (
          <div className="bg-success/10 border border-success/20 text-success p-4 rounded-xl flex items-center gap-3 mb-6 animate-fade-in">
            <CheckCircle size={20} />
            <p className="m-0 text-sm font-semibold">¡Cuenta vinculada exitosamente!</p>
          </div>
        )}

        {/* 1. Recibir Pagos (MercadoPago) */}
        <div className="bg-card/80 backdrop-blur-md rounded-2xl p-6 border border-border relative overflow-hidden group hover:border-border-accent transition-colors duration-500 shadow-glass">
          <div className="absolute -top-4 -right-4 opacity-[0.03] text-accent pointer-events-none transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
            <LinkIcon size={160} />
          </div>

          <div className="flex items-start justify-between mb-5 relative z-10">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2 text-white m-0">
                <LinkIcon size={22} className="text-accent" />
                Recepción de Pagos
              </h2>
              <p className="text-text-muted text-xs mt-1.5 m-0">Vincula tu cuenta para recibir ganancias al instante.</p>
            </div>
            {isLinked ? (
              <span className="bg-success/10 text-success text-xs px-2 py-1 rounded-md font-semibold flex items-center gap-1">
                <CheckCircle size={14} /> Vinculada
              </span>
            ) : (
              <span className="bg-danger/10 text-danger-hover text-xs px-2 py-1 rounded-md font-semibold flex items-center gap-1">
                <AlertCircle size={14} /> Pendiente
              </span>
            )}
          </div>

          {!isLinked && (
            <button
              onClick={handleOAuthLink}
              className="w-full relative overflow-hidden group flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm transition-all duration-300 bg-[#009EE3] text-white hover:bg-[#008CDE] hover:scale-[1.02] active:scale-95"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative z-10">Vincular cuenta de Mercado Pago</span>
            </button>
          )}
        </div>

        {/* 2. Boletas de Honorarios (SII) */}
        <div className="bg-card/80 backdrop-blur-md rounded-2xl p-6 border border-border relative overflow-hidden group hover:border-border-accent transition-colors duration-500 shadow-glass">
          <h2 className="text-lg font-bold flex items-center gap-2 text-white m-0 mb-3 relative z-10">
            <FileText size={22} className="text-accent" />
            Declaración Mensual (SII)
          </h2>
          <p className="text-text-muted text-xs mb-5 leading-relaxed relative z-10">
            Debes subir la Boleta de Honorarios mensual (Retención 15.25%) correspondiente a tus ganancias por transporte de pasajeros.
          </p>

          <label className={`w-full flex flex-col items-center justify-center border-2 border-dashed border-border-accent rounded-xl p-8 cursor-pointer transition-all bg-accent/5 hover:bg-accent/10 relative z-10 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <UploadCloud size={32} className="text-accent mb-3" />
            <span className="text-sm font-semibold text-text-primary">
              {uploading ? 'Subiendo archivo...' : 'Subir archivo PDF'}
            </span>
            <input
              type="file"
              accept=".pdf,image/*"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {/* Historial de Documentos */}
        {documents.length > 0 && (
          <div className="animate-fade-in mt-2">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Historial de Boletas</h3>
            <div className="flex flex-col gap-3">
              {documents.map((doc: any) => (
                <div key={doc.id} className="bg-card/50 backdrop-blur-sm p-4 rounded-xl border border-border flex items-center justify-between group hover:border-border-accent transition-colors">
                  <div>
                    <p className="m-0 text-sm font-semibold text-white">Boleta - Mes {doc.month}/{doc.year}</p>
                    <p className="m-0 text-xs text-text-muted mt-1">
                      {new Date(doc.createdAt).toLocaleDateString('es-CL')} • ${doc.amount.toLocaleString('es-CL')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-2 py-1 rounded-md font-semibold tracking-wide ${
                      doc.status === 'approved' ? 'bg-success/10 text-success' : 
                      doc.status === 'rejected' ? 'bg-danger/10 text-danger-hover' : 
                      'bg-accent/10 text-accent'
                    }`}>
                      {doc.status === 'approved' ? 'Aprobado' : doc.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                    </span>
                    <a href={`${process.env.NEXT_PUBLIC_API_URL}${doc.fileUrl}`} target="_blank" rel="noreferrer" className="p-2 bg-background rounded-lg text-text-primary hover:text-accent transition-colors">
                      <Download size={16} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CompliancePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/10 border-t-accent rounded-full animate-spin"></div>
      </div>
    }>
      <ComplianceContent />
    </Suspense>
  );
}
