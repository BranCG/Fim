'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, UploadCloud, AlertCircle, FileText, Link as LinkIcon, Download } from 'lucide-react';
import api from '@/lib/api';

export default function CompliancePage() {
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
      const userStr = localStorage.getItem('user');
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
    // URL generada en tu app de MercadoPago Developers (OAuth)
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
      await api.post('/tax/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Boleta subida exitosamente');
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando...</div>;

  const isLinked = !!driver?.mpAccessToken; // En producción esto vendría validado desde el backend

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 pb-24">
      <div className="max-w-md mx-auto space-y-6 pt-4">
        <h1 className="text-2xl font-bold tracking-tight">Cumplimiento y Pagos</h1>
        <p className="text-gray-400 text-sm">
          Mantén tu cuenta al día para seguir conduciendo y recibir pagos automáticos directamente a tu cuenta.
        </p>

        {successParam === 'oauth' && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <p className="text-sm font-medium">¡Cuenta vinculada exitosamente!</p>
          </div>
        )}

        {/* 1. Recibir Pagos (MercadoPago) */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-blue-400" />
                Recepción de Pagos
              </h2>
              <p className="text-gray-400 text-xs mt-1">Vincula tu cuenta para recibir ganancias al instante.</p>
            </div>
            {isLinked ? (
              <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Vinculada
              </span>
            ) : (
              <span className="bg-red-500/10 text-red-400 text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Pendiente
              </span>
            )}
          </div>

          {!isLinked && (
            <button
              onClick={handleOAuthLink}
              className="w-full bg-[#009EE3] hover:bg-[#008CCh] text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Vincular cuenta de Mercado Pago
            </button>
          )}
        </div>

        {/* 2. Boletas de Honorarios (SII) */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Declaración Mensual (SII)
          </h2>
          <p className="text-gray-400 text-xs mb-4">
            Debes subir la Boleta de Honorarios mensual (Retención 15.25%) correspondiente a tus ganancias por transporte de pasajeros.
          </p>

          <label className={`w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-xl p-6 cursor-pointer hover:bg-gray-800/50 transition-colors ${uploading ? 'opacity-50' : ''}`}>
            <UploadCloud className="w-8 h-8 text-gray-500 mb-2" />
            <span className="text-sm font-medium text-gray-300">
              {uploading ? 'Subiendo...' : 'Subir archivo PDF'}
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
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Historial de Boletas</h3>
            {documents.map((doc: any) => (
              <div key={doc.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Boleta - Mes {doc.month}/{doc.year}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(doc.createdAt).toLocaleDateString('es-CL')} • ${doc.amount.toLocaleString('es-CL')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                    doc.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                    doc.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                    'bg-amber-500/10 text-amber-400'
                  }`}>
                    {doc.status === 'approved' ? 'Aprobado' : doc.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                  </span>
                  <a href={`${process.env.NEXT_PUBLIC_API_URL}${doc.fileUrl}`} target="_blank" rel="noreferrer" className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
                    <Download className="w-4 h-4 text-gray-300" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
