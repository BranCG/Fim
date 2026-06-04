'use client';

import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { createWorker } from 'tesseract.js';
import api, { saveSession, getSession, uploadFile } from '@/lib/api';
import Logo from '@/components/Logo';

const IconCrown = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7z"/>
    <path d="M5 20h14"/>
  </svg>
);

const IconShield = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const IconZap = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

type Role = 'passenger' | 'driver';
type Step = 1 | 2 | 3 | 4;
type MembershipPlan = 'BLACK' | 'COMFORT' | 'FLEX';

interface FileUpload {
  file: File | null;
  preview: string | null;
  url: string | null;
  loading: boolean;
  isValidated?: boolean;
}

const emptyUpload = (): FileUpload => ({ file: null, preview: null, url: null, loading: false });

function validateRut(rut: string) {
  const cleanRut = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
  if (!/^[0-9]{7,8}[0-9K]$/.test(cleanRut)) return false;
  
  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);
  
  let suma = 0;
  let multiplo = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    suma += parseInt(body[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  
  const dvEsperado = 11 - (suma % 11);
  const dvFinal = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
  
  return dv === dvFinal;
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string) {
  return /^\+569[0-9]{8}$/.test(phone);
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roleParam = (searchParams.get('role') || 'passenger') as Role;
  const planParam = (searchParams.get('plan') || 'BLACK') as MembershipPlan;

  const [role, setRole] = useState<Role>(roleParam);
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Google specific states
  const isGoogleParam = searchParams.get('google') === 'true';
  const googleEmail = searchParams.get('email') || '';
  const googleName = searchParams.get('name') || '';
  const googleCredentialParam = searchParams.get('credential') || '';

  const [isGoogle, setIsGoogle] = useState(isGoogleParam);
  const [googleCredential, setGoogleCredential] = useState(googleCredentialParam);

  // Email verification states
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  // Legal
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Step 1 - Basic data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+569');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rut, setRut] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [address, setAddress] = useState('');

  // Autocomplete address states
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const ignoreNextAutocompleteRef = useRef(false);
  const addressContainerRef = useRef<HTMLDivElement>(null);

  // Step 2 - Documents
  const [idFront, setIdFront] = useState<FileUpload>(emptyUpload());
  const [idBack, setIdBack] = useState<FileUpload>(emptyUpload());
  const [selfie, setSelfie] = useState<FileUpload>(emptyUpload());

  // Step 3 - Driver vehicle (solo conductores)
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseFront, setLicenseFront] = useState<FileUpload>(emptyUpload());
  const [licenseBack, setLicenseBack] = useState<FileUpload>(emptyUpload());
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [tagNumber, setTagNumber] = useState('');
  const [vehiclePhoto, setVehiclePhoto] = useState<FileUpload>(emptyUpload());

  // Step 4 — Membresía (solo conductores)
  const [membershipPlan, setMembershipPlan] = useState<MembershipPlan>(planParam);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobileApp = (window as any).Capacitor || 
        window.location.origin.includes('capacitor://') || 
        ((window.location.hostname === 'localhost' || window.location.hostname === '') && window.location.port === '');
      setIsMobile(!!isMobileApp);
    }
  }, []);

  useEffect(() => {
    const s = getSession();
    if (s && s.user && s.user.role) {
      if (s.user.role === 'driver') {
        router.push('/driver');
      } else {
        router.push('/passenger');
      }
    }
  }, [router]);

  useEffect(() => {
    if (isGoogleParam) {
      setIsGoogle(true);
      setName(googleName);
      setEmail(googleEmail);
      setGoogleCredential(googleCredentialParam);
    }
  }, [isGoogleParam, googleName, googleEmail, googleCredentialParam]);

  useEffect(() => {
    if (isMobile) return;
    if (isGoogle) return;

    const handleCredentialResponse = async (response: any) => {
      setLoading(true);
      setError('');
      try {
        const res = await api.post('/auth/google/check', {
          credential: response.credential,
        });

        if (res.data.exists) {
          const userData = res.data.user || res.data.driver;
          saveSession(res.data.accessToken, { ...userData, role: res.data.role });
          if (res.data.role === 'admin') router.push('/admin');
          else if (res.data.role === 'driver') router.push('/driver');
          else router.push('/passenger');
        } else {
          setIsGoogle(true);
          setGoogleCredential(response.credential);
          setName(res.data.name || '');
          setEmail(res.data.email || '');
          setError('');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Error al conectar con Google');
      } finally {
        setLoading(false);
      }
    };

    const initGoogleRegister = () => {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
        const client_id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '1047712170366-g8kvdh9cbrp0h9o9dghfsq7g8r0f6u1a.apps.googleusercontent.com';
        (window as any).google.accounts.id.initialize({
          client_id,
          callback: handleCredentialResponse,
        });

        const btnContainer = document.getElementById('google-register-btn-container');
        if (btnContainer) {
          (window as any).google.accounts.id.renderButton(
            btnContainer,
            { theme: 'outline', size: 'large', type: 'standard', shape: 'rectangular', text: 'signup_with', logo_alignment: 'left' }
          );
        }
      }
    };

    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
        initGoogleRegister();
        clearInterval(interval);
      }
    }, 200);

    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isGoogle, isMobile, router]);

  // Debounced search for address suggestions
  useEffect(() => {
    if (address.trim().length < 3) {
      setAddressSuggestions([]);
      setShowAddressDropdown(false);
      return;
    }

    if (ignoreNextAutocompleteRef.current) {
      ignoreNextAutocompleteRef.current = false;
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearchingAddress(true);
      try {
        const res = await api.get('/auth/autocomplete', {
          params: { q: address },
        });
        setAddressSuggestions(res.data.predictions || []);
        setShowAddressDropdown(true);
      } catch (err) {
        console.error('Error fetching autocomplete suggestions:', err);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [address]);

  // Click outside to close suggestion dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (addressContainerRef.current && !addressContainerRef.current.contains(event.target as Node)) {
        setShowAddressDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNativeGoogleSignup = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
      await GoogleAuth.initialize({
        clientId: '974516739677-bvnm3kh8fn6qv6u59rqga6scbpdqtl4a.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
      const user = await GoogleAuth.signIn();
      if (user && user.authentication && user.authentication.idToken) {
        const res = await api.post('/auth/google/check', {
          credential: user.authentication.idToken,
        });

        if (res.data.exists) {
          const userData = res.data.user || res.data.driver;
          saveSession(res.data.accessToken, { ...userData, role: res.data.role });
          if (res.data.role === 'admin') router.push('/admin');
          else if (res.data.role === 'driver') router.push('/driver');
          else router.push('/passenger');
        } else {
          setIsGoogle(true);
          setGoogleCredential(user.authentication.idToken);
          setName(res.data.name || '');
          setEmail(res.data.email || '');
          setError('');
        }
      } else {
        setError('No se pudo obtener el token de autenticación de Google');
      }
    } catch (err: any) {
      console.error('Native Google Signup Error:', err);
      const errMsg = err?.message || err?.errorMessage || (typeof err === 'string' ? err : JSON.stringify(err)) || '';
      const isCancel = errMsg.toLowerCase().includes('cancel') ||
                       errMsg.toLowerCase().includes('12501') ||
                       errMsg.toLowerCase().includes('user finished');
      if (!isCancel) {
        setError(`Error al registrarse con Google: ${errMsg}`);
      }
    } finally {
      setLoading(false);
    }
  };
  

  const totalSteps = role === 'driver' ? 4 : 2;

  async function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: FileUpload) => void,
    docType: string
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    
    // Validar duplicados
    const currentUploads = [idFront, idBack, selfie, licenseFront, licenseBack, vehiclePhoto];
    const isDuplicate = currentUploads.some(u => u.file && u.file.name === file.name && u.file.size === file.size);
    if (isDuplicate) {
      setError('Ya has subido esta misma foto para otro documento.');
      return;
    }

    setter({ file, preview, url: null, loading: true });
    setError('');

    try {
      let ocrText = '';

      try {
        const ocrPromise = (async () => {
          const worker = await createWorker('spa'); // Idioma español
          const { data: { text } } = await worker.recognize(file);
          await worker.terminate();
          return (text || '').toUpperCase();
        })();

        const timeoutPromise = new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('OCR Timeout')), 3500)
        );

        // Omitir OCR en dispositivos móviles (Capacitor) para prevenir bloqueos por Web Workers/CDN
        const isMobile = typeof window !== 'undefined' && 
          ((window as any).Capacitor || 
           window.location.origin.includes('capacitor://') || 
           ((window.location.hostname === 'localhost' || window.location.hostname === '') && window.location.port === ''));

        if (!isMobile) {
          ocrText = await Promise.race([ocrPromise, timeoutPromise]);
        } else {
          console.log('Fim: Omitiendo validación OCR en plataforma móvil');
        }
      } catch (ocrErr) {
        console.warn('La validación OCR falló, fue omitida o superó el tiempo límite:', ocrErr);
      }

      if (ocrText) {
        let keywords: string[] = [];
        let docName = '';

        if (docType === 'id-front' || docType === 'id-back') {
          keywords = ['CHILE', 'RUN', 'REPUBLICA', 'CEDULA', 'IDENTIDAD', 'NACIMIENTO', 'DOCUMENTO', 'ESTADO CIVIL', 'CHL', 'INCHL', 'PATERNO', 'MATERNO', '<<<<'];
          docName = 'Cédula de Identidad';
        } else if (docType === 'license-front' || docType === 'license-back') {
          keywords = ['LICENCIA', 'CONDUCTOR', 'CONDUCIR', 'CHILE', 'CLASE', 'MUNICIPALIDAD', 'OTORGADA', 'FECHA'];
          docName = 'Licencia de Conducir';
        }

        if (keywords.length > 0) {
          const foundKeywords = keywords.filter(k => ocrText.includes(k));
          if (foundKeywords.length === 0) {
            setError(`No pudimos detectar una ${docName} chilena en la imagen. Por favor, asegúrate de tomar una foto nítida, bien enfocada y con buena iluminación.`);
            setter({ file: null, preview: null, url: null, loading: false });
            return;
          }
        }
      }

      const url = await uploadFile(file);
      setter({ file, preview, url, loading: false, isValidated: true });
    } catch (err) {
      console.error('Upload Error:', err);
      setter({ file, preview, url: null, loading: false });
      setError('Error al subir la imagen al servidor. Por favor, intenta nuevamente.');
    }
  }

  function renderUploadArea(
    label: string,
    upload: FileUpload,
    setter: (v: FileUpload) => void,
    id: string,
    hint?: string
  ) {
    return (
      <div className="form-group">
        <label className="form-label">{label}</label>
        <label htmlFor={id} className={`upload-area ${upload.loading ? 'dragging' : ''}`} style={{ position: 'relative', overflow: 'hidden' }}>
          {upload.preview ? (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={upload.preview} alt={label} style={{ opacity: upload.loading ? 0.5 : 1 }} />
              {upload.loading && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
                  <div className="spinner" style={{ marginBottom: '8px' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>ESCANEANDO...</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Toca para capturar</p>
              {hint && <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '4px' }}>{hint}</p>}
            </div>
          )}
        </label>
        <input id={id} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, setter, id)} />
      </div>
    );
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      const res = await api.post('/auth/verify-email', {
        email: verificationEmail,
        role,
        code: verificationCode
      });
      const userData = res.data.user;
      saveSession(res.data.accessToken, { ...userData, role });
      setVerificationSuccess(true);
      setTimeout(() => {
        if (role === 'driver') router.push('/driver');
        else router.push('/passenger');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Código incorrecto o expirado');
    } finally {
      setVerifying(false);
    }
  }

  async function handleResendCode() {
    setResending(true);
    setError('');
    try {
      await api.post('/auth/resend-code', {
        email: verificationEmail,
        role
      });
      alert('Código reenviado con éxito. Revisa tu correo (o los logs del servidor).');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al reenviar código');
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setError('');
    if (!acceptedTerms) {
      setError('Debes aceptar los Términos y Condiciones.');
      setLoading(false);
      return;
    }
    try {
      if (role === 'passenger') {
        if (isGoogle) {
          const res = await api.post('/auth/google/register', {
            credential: googleCredential,
            phone,
            name,
            rut,
            birthDate,
            address,
            role: 'passenger',
            idFrontUrl: idFront.url,
            idBackUrl: idBack.url,
            selfieUrl: selfie.url
          });
          saveSession(res.data.accessToken, { ...res.data.user, role: 'passenger' });
          router.push('/passenger');
        } else {
          const res = await api.post('/auth/passenger/register', { name, email, phone, password, rut, birthDate, address, idFrontUrl: idFront.url, idBackUrl: idBack.url, selfieUrl: selfie.url });
          if (res.data.status === 'verification_pending') {
            setVerificationEmail(email);
            setVerificationPending(true);
          } else {
            saveSession(res.data.accessToken, { ...res.data.user, role: 'passenger' });
            router.push('/passenger');
          }
        }
      } else {
        if (isGoogle) {
          const res = await api.post('/auth/google/register', {
            credential: googleCredential,
            phone,
            name,
            rut,
            birthDate,
            address,
            role: 'driver',
            idFrontUrl: idFront.url,
            idBackUrl: idBack.url,
            selfieUrl: selfie.url,
            licenseNumber,
            licenseUrl: licenseFront.url,
            licenseBackUrl: licenseBack.url,
            vehicleBrand,
            vehicleModel,
            vehicleYear,
            vehiclePlate,
            tagNumber,
            vehiclePhotoUrl: vehiclePhoto.url,
            membershipPlan
          });
          saveSession(res.data.accessToken, { ...res.data.driver, role: 'driver' });
          router.push('/driver');
        } else {
          const res = await api.post('/auth/driver/register', { name, email, phone, password, rut, birthDate, address, idFrontUrl: idFront.url, idBackUrl: idBack.url, selfieUrl: selfie.url, licenseNumber, licenseUrl: licenseFront.url, licenseBackUrl: licenseBack.url, vehicleBrand, vehicleModel, vehicleYear, vehiclePlate, tagNumber, vehiclePhotoUrl: vehiclePhoto.url, membershipPlan });
          if (res.data.status === 'verification_pending') {
            setVerificationEmail(email);
            setVerificationPending(true);
          } else {
            saveSession(res.data.accessToken, { ...res.data.driver, role: 'driver' });
            router.push('/driver');
          }
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrarse.');
    } finally {
      setLoading(false);
    }
  }

  if (verificationPending) {
    return (
      <div className="app-container" style={{ background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>
        <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '40px 32px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <Logo width="160" height="60" />
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(212,175,55,0.1)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px 0'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.4rem' }}>Verifica tu correo</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Hemos enviado un código de 6 dígitos a <br/>
              <strong style={{ color: 'var(--text-primary)' }}>{verificationEmail}</strong>
            </p>
          </div>

          {verificationSuccess ? (
            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', padding: '20px', borderRadius: '12px' }}>
              <div style={{ color: '#10B981', fontSize: '1.2rem', fontWeight: 700, marginBottom: '4px' }}>¡Verificado con éxito!</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Redirigiendo a tu panel...</p>
            </div>
          ) : (
            <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="form-group">
                <label className="form-label" style={{ textAlign: 'center', display: 'block', marginBottom: '12px' }}>Código de 6 dígitos</label>
                <input
                  className="form-input text-center"
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  style={{
                    fontSize: '1.8rem',
                    letterSpacing: '8px',
                    textAlign: 'center',
                    fontWeight: 700,
                    padding: '12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    border: '2px solid var(--border)'
                  }}
                  required
                />
              </div>

              {error && (
                <div style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', color: '#ef4444' }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                className={`btn btn-primary btn-lg btn-block ${verifying ? 'btn-loading' : ''}`}
                disabled={verifying || verificationCode.length !== 6}
              >
                {verifying ? '' : 'Verificar código →'}
              </button>

              <div style={{ marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resending}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    opacity: resending ? 0.5 : 1
                  }}
                >
                  {resending ? 'Reenviando...' : 'Reenviar código por correo'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  function nextStep() {
    setError('');
    if (step === 1) {
      if (!name) { setError('Por favor, ingresa tu nombre completo.'); return; }
      if (!email) { setError('Por favor, ingresa tu correo electrónico.'); return; }
      if (!validateEmail(email)) { setError('El formato del correo electrónico es inválido.'); return; }
      if (!rut) { setError('Por favor, ingresa tu RUT.'); return; }
      if (!validateRut(rut)) { setError('El RUT ingresado es inválido.'); return; }
      if (!phone) { setError('Por favor, ingresa tu número de teléfono.'); return; }
      if (!validatePhone(phone)) { setError('El teléfono es inválido. Debe tener el formato +569XXXXXXXX.'); return; }
      if (!address) { setError('Por favor, ingresa tu dirección.'); return; }
      if (!birthDate) { setError('Por favor, ingresa tu fecha de nacimiento.'); return; }
      if (!isGoogle) {
        if (!password) { setError('Por favor, ingresa una contraseña.'); return; }
        if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
        if (!confirmPassword) { setError('Por favor, confirma tu contraseña.'); return; }
        if (password !== confirmPassword) { setError('Las contraseñas ingresadas no coinciden.'); return; }
      }
    }
    if (step === 2) {
      if (!selfie.url) { setError('Por favor, sube la foto de tu Selfie con la Cédula.'); return; }
      if (!idFront.url) { setError('Por favor, sube la foto frontal de tu Cédula.'); return; }
      if (!idBack.url) { setError('Por favor, sube la foto posterior de tu Cédula.'); return; }
    }
    if (step === 3 && role === 'driver') {
      if (!vehiclePlate) { setError('Por favor, ingresa la patente de tu vehículo.'); return; }
      if (!vehicleBrand) { setError('Por favor, ingresa la marca de tu vehículo.'); return; }
      if (!vehicleModel) { setError('Por favor, ingresa el modelo de tu vehículo.'); return; }
      if (!vehicleYear) { setError('Por favor, ingresa el año de tu vehículo.'); return; }
      if (!licenseNumber) { setError('Por favor, ingresa el número de tu licencia.'); return; }
      if (!licenseFront.url) { setError('Por favor, sube la foto frontal de tu licencia de conducir.'); return; }
      if (!licenseBack.url) { setError('Por favor, sube la foto posterior de tu licencia de conducir.'); return; }
      if (!vehiclePhoto.url) { setError('Por favor, sube la foto de tu vehículo.'); return; }
    }
    setStep(prev => (prev + 1) as Step);
  }

  const steps = role === 'driver' ? ['Datos', 'ID', 'Vehículo', 'Pagos'] : ['Datos', 'ID'];

  return (
    <div className="app-container" style={{ background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px' }}>
      
      <div style={{ position: 'absolute', top: '24px', left: '24px' }}>
        <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          ← REGRESAR AL INICIO
        </Link>
      </div>

      <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '40px 32px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <Logo width="160" height="60" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {steps.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '24px', height: '24px', borderRadius: '50%', 
                  background: step > i + 1 ? 'var(--accent)' : step === i + 1 ? 'var(--accent)' : 'var(--bg-secondary)',
                  color: step >= i + 1 ? '#09090F' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800
                }}>
                  {step > i + 1 ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : i + 1}
                </div>
                {i < steps.length - 1 && <div style={{ width: '12px', height: '1px', background: 'var(--border)' }} />}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '4px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', marginBottom: '32px' }}>
          {(['passenger', 'driver'] as Role[]).map(r => (
            <button key={r} onClick={() => { setRole(r); setStep(1); }} style={{ padding: '10px', border: 'none', borderRadius: 'calc(var(--radius) - 4px)', fontWeight: 600, fontSize: '0.8rem', background: role === r ? 'var(--accent)' : 'transparent', color: role === r ? '#09090F' : 'var(--text-muted)', cursor: 'pointer', transition: 'var(--transition)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {r === 'passenger' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/><path d="M12 10V6"/><path d="M9 6h6"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
              )}
              {r === 'passenger' ? 'Pasajero' : 'Conductor'}
            </button>
          ))}
        </div>

        {error && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '360px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div>
                <h3 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.1rem', marginBottom: '8px' }}>Atención</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>{error}</p>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => setError('')} 
                style={{ width: '100%', marginTop: '8px' }}
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        <div style={{ minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {!isGoogle && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '8px', width: '100%' }}>
                    {isMobile ? (
                      <button
                        type="button"
                        onClick={handleNativeGoogleSignup}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '12px',
                          width: '100%',
                          maxWidth: '356px',
                          height: '44px',
                          background: '#ffffff',
                          border: '1px solid #dadce0',
                          borderRadius: '4px',
                          color: '#3c4043',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'background-color .218s, border-color .218s',
                          boxShadow: 'none',
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Registrarse con Google
                      </button>
                    ) : (
                      <div id="google-register-btn-container" style={{ width: '100%', minHeight: '44px', display: 'flex', justifyContent: 'center' }}></div>
                    )}
                  </div>
                  <div className="divider" style={{ margin: '16px 0', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', position: 'relative' }}>
                    <span style={{ background: 'var(--bg-card)', padding: '0 12px', position: 'relative', zIndex: 1 }}>o regístrate con email</span>
                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--border)', zIndex: 0 }} />
                  </div>
                </>
              )}
              {isGoogle && (
                <div style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '10px', padding: '12px', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  <span>Registro vinculado con cuenta de Google</span>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Nombre completo</label>
                <input 
                  className="form-input" 
                  placeholder="Ej: Juan Pérez" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  readOnly={isGoogle}
                  style={isGoogle ? { opacity: 0.7, background: 'var(--bg-secondary)' } : {}}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input 
                  className="form-input" 
                  placeholder="tu@email.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  readOnly={isGoogle}
                  style={isGoogle ? { opacity: 0.7, background: 'var(--bg-secondary)' } : {}}
                />
              </div>
              <div className="form-group">
                <label className="form-label">RUT (sin puntos y con guión)</label>
                <input 
                  className="form-input" 
                  placeholder="12345678-9" 
                  value={rut} 
                  onChange={e => {
                    const val = e.target.value.replace(/\./g, '').replace(/[^0-9kK-]/g, '');
                    setRut(val);
                  }} 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input 
                  className="form-input" 
                  placeholder="+569..." 
                  value={phone} 
                  onChange={e => {
                    const prefix = '+569';
                    let val = e.target.value;
                    if (!val.startsWith(prefix)) {
                      val = prefix;
                    } else {
                      const rest = val.slice(prefix.length).replace(/\D/g, '');
                      val = prefix + rest.slice(0, 8);
                    }
                    setPhone(val);
                  }} 
                />
              </div>
              <div className="form-group" style={{ position: 'relative' }} ref={addressContainerRef}>
                <label className="form-label">Dirección</label>
                <input 
                  className="form-input" 
                  placeholder="Tu dirección actual" 
                  value={address} 
                  onChange={e => {
                    ignoreNextAutocompleteRef.current = false;
                    setAddress(e.target.value);
                  }} 
                  onFocus={() => {
                    if (addressSuggestions.length > 0) {
                      setShowAddressDropdown(true);
                    }
                  }}
                />
                {isSearchingAddress && (
                  <div style={{ position: 'absolute', right: '12px', top: '38px', display: 'flex', alignItems: 'center' }}>
                    <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', marginBottom: 0 }} />
                  </div>
                )}
                {showAddressDropdown && addressSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.5)',
                    zIndex: 100,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    padding: '6px'
                  }}>
                    {addressSuggestions.map((suggestion: any) => (
                      <div
                        key={suggestion.id}
                        onClick={() => {
                          ignoreNextAutocompleteRef.current = true;
                          setAddress(suggestion.description);
                          setAddressSuggestions([]);
                          setShowAddressDropdown(false);
                        }}
                        style={{
                          padding: '10px 12px',
                          fontSize: '0.85rem',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          transition: 'background 0.15s ease',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span style={{ fontSize: '0.82rem', lineHeight: '1.4' }}>
                          {suggestion.description}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Fecha de Nacimiento</label>
                <input className="form-input" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} style={{ colorScheme: 'dark' }} />
              </div>
              {!isGoogle && (
                <>
                  <div className="form-group">
                    <label className="form-label">Contraseña</label>
                    <input className="form-input" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirmar Contraseña</label>
                    <input className="form-input" type="password" placeholder="Repite tu contraseña" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  </div>
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '8px' }}>Necesitamos validar tu identidad para continuar.</p>
              {renderUploadArea('Selfie con Cédula', selfie, setSelfie, 'selfie-file')}
              {renderUploadArea('Cédula (Frontal)', idFront, setIdFront, 'id-front')}
              {renderUploadArea('Cédula (Posterior)', idBack, setIdBack, 'id-back')}
            </div>
          )}

          {step === 3 && role === 'driver' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Patente</label>
                <input className="form-input" placeholder="ABCD 12" value={vehiclePlate} onChange={e => setVehiclePlate(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Marca</label>
                  <input className="form-input" placeholder="Ej: Toyota" value={vehicleBrand} onChange={e => setVehicleBrand(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Modelo</label>
                  <input className="form-input" placeholder="Ej: Corolla" value={vehicleModel} onChange={e => setVehicleModel(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Año</label>
                <input className="form-input" placeholder="2024" value={vehicleYear} onChange={e => setVehicleYear(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Número de Licencia</label>
                <input className="form-input" placeholder="Ej: 12.345.678-9" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} />
              </div>
              {renderUploadArea('Licencia de Conducir (Frontal)', licenseFront, setLicenseFront, 'license-front')}
              {renderUploadArea('Licencia de Conducir (Posterior)', licenseBack, setLicenseBack, 'license-back')}
              {renderUploadArea('Foto del Vehículo', vehiclePhoto, setVehiclePhoto, 'vehicle-photo')}
            </div>
          )}

          {step === 4 && role === 'driver' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '4px' }}>Elige tu plan de acceso a Fim. <strong>0% comisión</strong> por carrera.</p>

              {/* PLAN BLACK */}
              <div onClick={() => setMembershipPlan('BLACK')} style={{ cursor: 'pointer', borderRadius: '14px', padding: '20px', transition: 'all 0.2s ease', background: 'linear-gradient(135deg, #0a0a0f, #1a1a2e)', border: membershipPlan === 'BLACK' ? '2px solid #D4AF37' : '1px solid rgba(212,175,55,0.2)', boxShadow: membershipPlan === 'BLACK' ? '0 0 20px rgba(212,175,55,0.2)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1, minWidth: '180px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: `2px solid #D4AF37`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: membershipPlan === 'BLACK' ? '#D4AF37' : 'transparent', flexShrink: 0 }}>
                      {membershipPlan === 'BLACK' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <span style={{ color: '#D4AF37', fontWeight: 900, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <IconCrown /> PLAN BLACK
                    </span>
                    <span style={{ background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '20px', padding: '2px 8px', fontSize: '0.62rem', color: '#D4AF37', fontWeight: 800 }}>MÁS POPULAR</span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ color: '#D4AF37', fontWeight: 900, fontSize: '1.4rem', lineHeight: 1 }}>$150.000</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>/mes</div>
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>Pago único mensual. Acceso ilimitado 30 días. Pago automático vía <strong style={{color:'#D4AF37'}}>Mercado Pago</strong>.</p>
              </div>

              {/* PLAN COMFORT */}
              <div onClick={() => setMembershipPlan('COMFORT')} style={{ cursor: 'pointer', borderRadius: '14px', padding: '20px', transition: 'all 0.2s ease', background: 'linear-gradient(135deg, #0a0f1a, #0f1e35)', border: membershipPlan === 'COMFORT' ? '2px solid #3B82F6' : '1px solid rgba(59,130,246,0.2)', boxShadow: membershipPlan === 'COMFORT' ? '0 0 20px rgba(59,130,246,0.2)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1, minWidth: '180px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: `2px solid #3B82F6`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: membershipPlan === 'COMFORT' ? '#3B82F6' : 'transparent', flexShrink: 0 }}>
                      {membershipPlan === 'COMFORT' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <span style={{ color: '#60A5FA', fontWeight: 900, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <IconShield /> PLAN COMFORT
                    </span>
                    <span style={{ background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '20px', padding: '2px 8px', fontSize: '0.62rem', color: '#60A5FA', fontWeight: 800 }}>Membresía Crédito</span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ color: '#FBBF24', fontWeight: 900, fontSize: '1.4rem', lineHeight: 1 }}>$180.000</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>/mes total</div>
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                  Te financiamios el inicio. Pagas $20.000 por día operado. Si no trabajas, no pagas. Al completar los $180.000 el resto del mes es gratis.
                </p>
              </div>

              {/* PLAN FLEX */}
              <div onClick={() => setMembershipPlan('FLEX')} style={{ cursor: 'pointer', borderRadius: '14px', padding: '20px', transition: 'all 0.2s ease', background: 'linear-gradient(135deg, #050f0a, #0a1f14)', border: membershipPlan === 'FLEX' ? '2px solid #10B981' : '1px solid rgba(16,185,129,0.2)', boxShadow: membershipPlan === 'FLEX' ? '0 0 20px rgba(16,185,129,0.2)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1, minWidth: '180px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: `2px solid #10B981`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: membershipPlan === 'FLEX' ? '#10B981' : 'transparent', flexShrink: 0 }}>
                      {membershipPlan === 'FLEX' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <span style={{ color: '#34D399', fontWeight: 900, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <IconZap /> PLAN FLEX
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ color: '#34D399', fontWeight: 900, fontSize: '1.4rem', lineHeight: 1 }}>$60.000</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>/fin de semana</div>
                  </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>Activo solo Viernes, Sábado y Domingo. Pago vía <strong style={{color:'#34D399'}}>Mercado Pago</strong>. El resto de la semana la cuenta queda inactiva.</p>
              </div>

              {/* Resumen del plan elegido */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ color: membershipPlan === 'BLACK' ? '#D4AF37' : membershipPlan === 'COMFORT' ? '#60A5FA' : '#34D399', marginTop: '2px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {membershipPlan === 'BLACK' && <IconCrown />}
                  {membershipPlan === 'COMFORT' && <IconShield />}
                  {membershipPlan === 'FLEX' && <IconZap />}
                </div>
                <div>
                  {membershipPlan === 'BLACK' && 'Seleccionaste BLACK. Después del registro, serás redirigido a Mercado Pago para pagar $150.000. Tu cuenta se activa automáticamente al confirmar el pago.'}
                  {membershipPlan === 'COMFORT' && 'Seleccionaste COMFORT. Pagas $20.000 cada mañana por transferencia y subes el comprobante en la app para activar el día. El admin valida el primer comprobante.'}
                  {membershipPlan === 'FLEX' && 'Seleccionaste FLEX. Después del registro, pagas $60.000 con Mercado Pago. Tu cuenta queda activa los Viernes, Sábados y Domingos automáticamente.'}
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: '32px' }}>
            {step === totalSteps && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', alignItems: 'center' }}>
                <input type="checkbox" id="terms" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }} />
                <label htmlFor="terms" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Acepto los <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>Términos y Condiciones</span>
                </label>
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              {step > 1 && <button className="btn btn-secondary" onClick={() => setStep(prev => (prev - 1) as Step)} style={{ flex: 1 }}>Atrás</button>}
              {step < totalSteps ? (
                <button className="btn btn-primary" onClick={nextStep} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  Continuar
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </button>
              ) : (
                <button className="btn btn-primary btn-block ${loading ? 'btn-loading' : ''}" onClick={handleSubmit} disabled={loading} style={{ flex: 2 }}>
                  {loading ? '' : 'Registrarse ahora'}
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="text-center" style={{ textAlign: 'center', marginTop: '32px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="app-container">
      <Suspense fallback={<div>Cargando...</div>}>
        <RegisterFormWithPendingWrapper />
      </Suspense>
    </div>
  );
}

function RegisterFormWithPendingWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobileApp = (window as any).Capacitor || 
        window.location.origin.includes('capacitor://') || 
        ((window.location.hostname === 'localhost' || window.location.hostname === '') && window.location.port === '');
      setIsMobile(!!isMobileApp);
    }
  }, []);
  
  return (
    <>
      <RegisterForm />
      {!isMobile && <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />}
    </>
  );
}
