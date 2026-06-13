'use client';

import { useEffect, useRef, useState } from 'react';
import api from '@/lib/api';

interface BiometricModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selfieUrl: string | null | undefined;
}

export default function BiometricModal({ isOpen, onClose, onSuccess, selfieUrl }: BiometricModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<'init' | 'camera_active' | 'verifying' | 'success' | 'error'>('init');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 1. Manejo del Bypass de Cuentas de Prueba
  useEffect(() => {
    if (isOpen) {
      const isPlaceholder = 
        !selfieUrl || 
        selfieUrl.trim() === '' || 
        selfieUrl.includes('placehold.co') || 
        selfieUrl.includes('placeholder');

      if (isPlaceholder) {
        console.log('ℹ️ [Biometría] Omitiendo verificación facial en frontend (foto de perfil es placeholder/vacía)');
        onSuccess();
      } else {
        startCamera();
      }
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, selfieUrl]);

  // 2. Iniciar la cámara
  const startCamera = async () => {
    try {
      setStatus('init');
      setErrorMessage('');
      
      if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
        throw new Error('SECURE_CONTEXT_REQUIRED');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStatus('camera_active');
    } catch (err: any) {
      console.error('Error al acceder a la cámara:', err);
      setStatus('error');
      if (err.message === 'SECURE_CONTEXT_REQUIRED' || (typeof window !== 'undefined' && !window.isSecureContext)) {
        setErrorMessage('Acceso denegado: El navegador requiere una conexión segura (HTTPS o localhost) para permitir el uso de la cámara. Por favor accede mediante HTTPS o desde la misma máquina local.');
      } else {
        setErrorMessage('No se pudo acceder a la cámara. Por favor, concede permisos de cámara para continuar con la verificación.');
      }
    }
  };

  // 3. Detener la cámara
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // 4. Capturar foto y enviar a verificar
  const verifyFace = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setStatus('verifying');
    setErrorMessage('');

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Ajustar el canvas al tamaño del video
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        
        // Dibujar cuadro actual de la cámara en el canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Obtener Base64 de la imagen jpeg
        const selfieBase64 = canvas.toDataURL('image/jpeg', 0.85);

        // Llamar a la API del backend
        const response = await api.post('/auth/biometric-verify', { selfieBase64 });
        
        if (response.data.success) {
          setStatus('success');
          // Esperar 1.5s mostrando la animación de éxito antes de completar
          setTimeout(() => {
            onSuccess();
          }, 1500);
        } else {
          setStatus('error');
          setErrorMessage(response.data.error || 'No se pudo verificar tu identidad. Inténtalo de nuevo.');
        }
      }
    } catch (err: any) {
      console.error('Error durante la comparación biométrica:', err);
      setStatus('error');
      setErrorMessage(
        err.response?.data?.error || 
        'Error de comunicación con el servidor al realizar la verificación biométrica.'
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(9, 9, 15, 0.94)',
      backdropFilter: 'blur(16px)',
      zIndex: 20000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div className="card animate-scale-in" style={{
        width: '100%',
        maxWidth: '440px',
        background: '#0D0D15',
        border: '1px solid var(--border-accent)',
        borderRadius: '24px',
        padding: '32px 24px',
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decoración circular de fondo */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '150px',
          height: '150px',
          background: 'rgba(0, 229, 160, 0.04)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          pointerEvents: 'none'
        }} />

        <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '8px', color: 'white' }}>
          Verificación de Identidad
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5' }}>
          Para garantizar viajes 100% seguros y sin suplantación de cuentas, confirma tu rostro en la cámara.
        </p>

        {/* Contenedor del Escáner Circular */}
        <div style={{
          position: 'relative',
          width: '260px',
          height: '260px',
          margin: '0 auto 28px auto',
          borderRadius: '50%',
          border: status === 'success' ? '4px solid var(--accent)' : status === 'error' ? '4px solid var(--danger)' : '4px solid var(--border)',
          overflow: 'hidden',
          background: '#050508',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)'
        }}>
          {status === 'init' && (
            <div className="spinner" style={{ width: '40px', height: '40px' }} />
          )}

          {status === 'camera_active' || status === 'verifying' ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)' // Espejo para selfie natural
              }}
            />
          ) : null}

          {status === 'verifying' && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(9, 9, 15, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
              fontSize: '0.85rem',
              fontWeight: 700
            }}>
              <div className="spinner" style={{ width: '32px', height: '32px', marginBottom: '12px', borderColor: 'var(--accent) transparent var(--accent) transparent' }} />
              Analizando Rostro...
            </div>
          )}

          {status === 'success' && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 229, 160, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'fadeIn 0.3s'
            }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(0, 229, 160, 0.4)'
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'fadeIn 0.3s'
            }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)'
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            </div>
          )}

          {/* Anillo giratorio de escaneo durante escaneo activo */}
          {status === 'camera_active' && (
            <div style={{
              position: 'absolute',
              inset: '8px',
              border: '2px dashed rgba(0, 229, 160, 0.4)',
              borderRadius: '50%',
              animation: 'spin 12s linear infinite',
              pointerEvents: 'none'
            }} />
          )}
        </div>

        {/* Canvas oculto para captura de fotograma */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Mensaje de Error / Indicación */}
        {status === 'error' && errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            borderRadius: '12px',
            padding: '12px 14px',
            fontSize: '0.8rem',
            color: '#FCA5A5',
            marginBottom: '20px',
            lineHeight: '1.4'
          }}>
            {errorMessage}
          </div>
        )}

        {/* Acciones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {status === 'camera_active' && (
            <button className="btn btn-accent btn-block btn-lg" onClick={verifyFace} style={{ fontWeight: 800 }}>
              VERIFICAR ROSTRO
            </button>
          )}

          {status === 'error' && (
            <button className="btn btn-primary btn-block btn-lg" onClick={startCamera} style={{ fontWeight: 800 }}>
              REINTENTAR CAPTURA
            </button>
          )}

          {status !== 'success' && status !== 'verifying' && (
            <button className="btn btn-ghost btn-block" onClick={onClose} style={{ color: 'var(--text-muted)' }}>
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
