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
      setDriver(user);

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
    const redirectUri = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/payments/oauth/callback`;
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
    formData.append('amount', '100000'); // Monto de ejemplo, idealmente sacado de las ganancias del mes

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
    <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
    </div>
  );

  const isLinked = !!driver?.mpAccessToken;

  return (
    <div className="app-container">
      <header className="app-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
        <button 
          onClick={() => router.push('/driver')} 
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Cumplimiento y Pagos</h1>
      </header>

      <main className="main-content" style={{ padding: '24px 20px', paddingBottom: '100px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
          Mantén tu cuenta al día para seguir conduciendo y recibir pagos automáticos directamente a tu cuenta.
        </p>

        {successParam === 'oauth' && (
          <div className="animate-in" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'rgb(52, 211, 153)', padding: '16px', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <CheckCircle size={20} />
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>¡Cuenta vinculada exitosamente!</p>
          </div>
        )}

        {/* 1. Recibir Pagos (MercadoPago) */}
        <div className="card animate-in" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', margin: 0 }}>
                <LinkIcon size={20} color="var(--accent)" />
                Recepción de Pagos
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '6px', margin: 0 }}>Vincula tu cuenta para recibir ganancias al instante.</p>
            </div>
            {isLinked ? (
              <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'rgb(52, 211, 153)', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={14} /> Vinculada
              </span>
            ) : (
              <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'rgb(248, 113, 113)', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={14} /> Pendiente
              </span>
            )}
          </div>

          {!isLinked && (
            <button
              onClick={handleOAuthLink}
              className="btn"
              style={{ background: '#009EE3', color: '#fff', border: 'none', width: '100%', padding: '16px', fontWeight: 700, borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              Vincular cuenta de Mercado Pago
            </button>
          )}
        </div>

        {/* 2. Boletas de Honorarios (SII) */}
        <div className="card animate-in" style={{ animationDelay: '0.1s', padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', margin: 0, marginBottom: '12px' }}>
            <FileText size={20} color="var(--accent)" />
            Declaración Mensual (SII)
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '20px' }}>
            Debes subir la Boleta de Honorarios mensual (Retención 15.25%) correspondiente a tus ganancias por transporte de pasajeros.
          </p>

          <label style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border-accent)', borderRadius: 'var(--radius)', padding: '32px', cursor: 'pointer', transition: 'all 0.2s', opacity: uploading ? 0.5 : 1, background: 'rgba(212, 175, 55, 0.02)' }}>
            <UploadCloud size={32} color="var(--accent)" style={{ marginBottom: '12px' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {uploading ? 'Subiendo archivo...' : 'Subir archivo PDF'}
            </span>
            <input
              type="file"
              accept=".pdf,image/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>

        {/* Historial de Documentos */}
        {documents.length > 0 && (
          <div className="animate-in" style={{ animationDelay: '0.2s' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Historial de Boletas</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {documents.map((doc: any) => (
                <div key={doc.id} className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: 0 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>Boleta - Mes {doc.month}/{doc.year}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {new Date(doc.createdAt).toLocaleDateString('es-CL')} • ${doc.amount.toLocaleString('es-CL')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ 
                      fontSize: '0.7rem', padding: '4px 8px', borderRadius: '6px', fontWeight: 600,
                      background: doc.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : doc.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: doc.status === 'approved' ? 'rgb(52, 211, 153)' : doc.status === 'rejected' ? 'rgb(248, 113, 113)' : 'rgb(251, 191, 36)'
                    }}>
                      {doc.status === 'approved' ? 'Aprobado' : doc.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                    </span>
                    <a href={`${process.env.NEXT_PUBLIC_API_URL}${doc.fileUrl}`} target="_blank" rel="noreferrer" style={{ padding: '8px', background: 'var(--bg-primary)', borderRadius: '8px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }}></div>
      </div>
    }>
      <ComplianceContent />
    </Suspense>
  );
}
