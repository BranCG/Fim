'use client';

import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Settings, Type, Volume2, VolumeX, X } from 'lucide-react';

export function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [fontScale, setFontScale] = useState<'normal' | 'lg' | 'xl'>('normal');
  const [narratorEnabled, setNarratorEnabled] = useState(false);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsNative(Capacitor.isNativePlatform());
    }
  }, []);

  // Manejar el cambio de fuente
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const html = document.documentElement;
      html.classList.remove('accessible-font-lg', 'accessible-font-xl');
      if (fontScale === 'lg') html.classList.add('accessible-font-lg');
      if (fontScale === 'xl') html.classList.add('accessible-font-xl');
    }
  }, [fontScale]);

  // Manejar el Narrador de voz
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleGlobalClick = (e: MouseEvent) => {
      if (!narratorEnabled) return;
      
      const target = e.target as HTMLElement;
      // No leer si el clic es dentro del widget mismo
      if (target.closest('.accessibility-widget')) return;

      const text = target.innerText || target.textContent;
      if (text && text.trim().length > 0) {
        window.speechSynthesis.cancel(); // Cancelar locución anterior
        const utterance = new SpeechSynthesisUtterance(text.trim());
        utterance.lang = 'es-CL'; // Español Chile (o el más cercano disponible)
        utterance.rate = 0.95; // Un poco más lento para mejor comprensión
        window.speechSynthesis.speak(utterance);
      }
    };

    if (narratorEnabled) {
      document.addEventListener('click', handleGlobalClick, { capture: true });
    } else {
      window.speechSynthesis?.cancel();
    }

    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, [narratorEnabled]);

  // No renderizar en la app nativa si así se desea
  if (isNative) return null;

  return (
    <div className="accessibility-widget" style={{
      position: 'fixed',
      bottom: '24px',
      left: '24px',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '12px'
    }}>
      {/* Menú desplegable */}
      {isOpen && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: 'var(--shadow-lg)',
          width: '280px',
          animation: 'slideUp 0.3s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Accesibilidad</h3>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          {/* Control de Fuente */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Type size={16} /> Tamaño del texto
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setFontScale('normal')}
                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: fontScale === 'normal' ? '1.5px solid var(--accent)' : '1px solid var(--border)', background: fontScale === 'normal' ? 'rgba(0,229,160,0.1)' : 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}
              >
                Normal
              </button>
              <button 
                onClick={() => setFontScale('lg')}
                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: fontScale === 'lg' ? '1.5px solid var(--accent)' : '1px solid var(--border)', background: fontScale === 'lg' ? 'rgba(0,229,160,0.1)' : 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '1.1rem' }}
              >
                A+
              </button>
              <button 
                onClick={() => setFontScale('xl')}
                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: fontScale === 'xl' ? '1.5px solid var(--accent)' : '1px solid var(--border)', background: fontScale === 'xl' ? 'rgba(0,229,160,0.1)' : 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '1.25rem' }}
              >
                A++
              </button>
            </div>
          </div>

          {/* Control de Narrador */}
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {narratorEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />} Lector de pantalla
            </div>
            <button 
              onClick={() => setNarratorEnabled(!narratorEnabled)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: narratorEnabled ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                background: narratorEnabled ? 'rgba(0,229,160,0.1)' : 'transparent',
                color: narratorEnabled ? 'var(--accent)' : 'var(--text-primary)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              {narratorEnabled ? 'Narrador Activado' : 'Activar Narrador'}
            </button>
            {narratorEnabled && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.4 }}>
                Haz clic en cualquier texto de la pantalla para escucharlo en voz alta.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Botón Flotante */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--accent)',
          border: 'none',
          color: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(0,229,160,0.4)',
          cursor: 'pointer',
          transition: 'transform 0.2s'
        }}
        aria-label="Opciones de Accesibilidad"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 10h8" />
          <path d="M12 10v6" />
          <path d="M12 16h2" />
        </svg>
      </button>
    </div>
  );
}
