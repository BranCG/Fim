import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Eliminación de Cuenta - FIM',
  description: 'Guía paso a paso sobre cómo solicitar la eliminación definitiva de tu cuenta y datos en FIM.'
};

export default function AccountDeletionPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', marginBottom: '24px', display: 'inline-block' }}>← Volver al inicio</Link>
        
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>Eliminación de Cuenta</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>Última actualización: 30 de Junio, 2026</p>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '32px', lineHeight: 1.7 }}>
          <div>
            <p style={{ fontSize: '1.1rem', marginBottom: '16px' }}>
              En FIM respetamos tu privacidad y tu derecho a decidir sobre tus datos personales. 
              Si ya no deseas utilizar nuestros servicios, puedes solicitar la eliminación permanente de tu cuenta, tu perfil, y tus datos asociados mediante los siguientes métodos oficiales.
            </p>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--accent)', padding: '24px', borderRadius: '16px' }}>
            <h2 style={{ color: 'var(--accent)', marginBottom: '16px', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
              Método 1: Desde la Aplicación Móvil (Recomendado y Automático)
            </h2>
            <p style={{ marginBottom: '16px' }}>
              Es la vía más rápida y segura, ya que valida automáticamente tu identidad a través de tu sesión activa.
            </p>
            <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: 500 }}>
              <li>Abre la aplicación <strong>FIM</strong> en tu dispositivo (iOS o Android).</li>
              <li>Toca el ícono de <strong>Menú / Perfil</strong>.</li>
              <li>Dirígete a la sección de <strong>Configuración</strong> o <strong>Seguridad</strong>.</li>
              <li>Selecciona la opción <strong>"Eliminar mi cuenta"</strong>.</li>
              <li>Confirma tu decisión. Tu sesión se cerrará y el proceso de eliminación comenzará de inmediato.</li>
            </ol>
          </div>

          <div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '1.4rem' }}>Método 2: Solicitud vía Correo Electrónico (Soporte Web)</h2>
            <p style={{ marginBottom: '12px' }}>
              Si perdiste acceso a tu teléfono o no puedes abrir la aplicación, puedes solicitar la eliminación directamente a nuestro equipo de soporte técnico:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', listStyleType: 'disc' }}>
              <li><strong>Paso 1:</strong> Envía un correo electrónico a <strong><a href="mailto:contacto@fimchile.cl" style={{ color: 'var(--accent)' }}>contacto@fimchile.cl</a></strong>.</li>
              <li><strong>Paso 2:</strong> <em>El correo DEBE ser enviado obligatoriamente desde la misma dirección de correo con la que te registraste en FIM</em>. Esto es por tu propia seguridad, para validar que eres el titular de la cuenta.</li>
              <li><strong>Paso 3:</strong> En el asunto escribe "Solicitud de Eliminación de Cuenta". FIM procesará tu petición en un plazo legal no mayor a 10 días hábiles.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>¿Qué sucede con mis datos luego de la eliminación?</h2>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', listStyleType: 'disc' }}>
              <li>Tu fotografía de perfil, nombre, y métodos de pago asociados serán borrados de nuestros servidores públicos inmediatamente.</li>
              <li>Tu cuenta será desvinculada y ya no podrás iniciar sesión ni recuperar tu historial de calificaciones.</li>
              <li><strong>Excepción legal y fiscal:</strong> Según lo exigido por el Servicio de Impuestos Internos (SII) de Chile y para prevención de fraudes o investigaciones policiales en curso, FIM tiene la obligación de retener un registro encriptado inmutable de los viajes realizados, el GPS de dichos trayectos, y el registro de la transacción de membresía, por el periodo tributario mínimo que marca la ley. Esta información no se utiliza para fines comerciales ni publicitarios bajo ninguna circunstancia.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
