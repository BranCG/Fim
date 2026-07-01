import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad - FIM',
  description: 'Conoce cómo recopilamos, usamos y protegemos tus datos, ubicación y métodos de pago en la plataforma FIM.'
};

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', marginBottom: '24px', display: 'inline-block' }}>← Volver al inicio</Link>
        
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>Política de Privacidad</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>Última actualización: 30 de Junio, 2026</p>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '32px', lineHeight: 1.7 }}>
          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>1. Información Recopilada y Datos Personales</h2>
            <p>
              Para operar la plataforma tecnológica de intermediación de transporte FIM, recopilamos y procesamos datos personales esenciales. Esto incluye:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', listStyleType: 'disc' }}>
              <li><strong>Datos de Identidad:</strong> Nombre, número telefónico, correo electrónico, RUT (para validación de antecedentes chilenos) y fotografías de seguridad (selfies y documentos).</li>
              <li><strong>Datos del Vehículo:</strong> En el caso de conductores, marca, modelo y patente del vehículo para seguridad del pasajero.</li>
              <li><strong>Comunicaciones:</strong> Mensajes enviados a través del sistema de chat interno de la aplicación.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>2. GPS y Ubicación en Tiempo Real</h2>
            <p>
              El pilar del servicio de FIM es la conexión en tiempo real entre pasajeros y conductores.
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', listStyleType: 'disc' }}>
              <li><strong>Conductores:</strong> Recopilamos la ubicación precisa en <strong>primer y segundo plano</strong> mientras la cuenta se encuentre en estado "Conectado". Esto permite asignar viajes, trazar rutas y calcular precios. Cuando el conductor se desconecta, el rastreo en segundo plano se detiene inmediatamente.</li>
              <li><strong>Pasajeros:</strong> Se recopila la ubicación para determinar el punto de recogida exacto cuando la aplicación está en uso (primer plano).</li>
            </ul>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>3. Pagos y Datos Financieros</h2>
            <p>
              FIM opera bajo un modelo de intermediación del 100% para el conductor.
              Nosotros <strong>no procesamos ni almacenamos directamente tarjetas de crédito</strong> de los usuarios para el pago de viajes. Los viajes se pagan en efectivo o mediante plataformas de pago de terceros gestionadas por el conductor (ej. Mercado Pago). FIM solo procesa de manera encriptada los pagos correspondientes a las membresías mensuales de los conductores, utilizando pasarelas con certificación PCI-DSS.
            </p>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>4. Registro de Evidencia y Auditoría</h2>
            <p>
              Para garantizar la máxima seguridad en nuestra comunidad, FIM actúa como un registro de evidencia legal. El sistema guarda automáticamente el registro inmutable de cada viaje en nuestra base de datos encriptada:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', listStyleType: 'disc' }}>
              <li>Hora exacta y ubicación (GPS) del inicio del viaje.</li>
              <li>Hora exacta y ubicación (GPS) del término del viaje.</li>
              <li>Códigos de seguridad: Código de subida y código de bajada del vehículo generados por el sistema.</li>
              <li>Identificación cruzada: Datos del pasajero, datos del conductor y placa patente del vehículo utilizado.</li>
            </ul>
            <p>Esta información estará a disposición de las autoridades chilenas mediante una orden judicial en caso de incidentes de seguridad.</p>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>5. Uso de Cookies</h2>
            <p>
              FIM utiliza "Cookies" y tecnologías de almacenamiento local en nuestra página web y aplicación móvil para:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', listStyleType: 'disc' }}>
              <li>Mantener tu sesión activa de manera segura y proteger tu cuenta contra accesos no autorizados.</li>
              <li>Recordar tus preferencias del sistema (como modo oscuro).</li>
              <li>FIM <strong>no utiliza cookies de seguimiento a través de aplicaciones (Cross-App Tracking)</strong> de terceros ni vendemos tus datos a agencias de publicidad.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>6. Sistema de Eliminación de Cuenta</h2>
            <p>
              Tienes el control total sobre tus datos. Puedes eliminar tu cuenta de FIM y solicitar el borrado de tus datos personales de manera definitiva.
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', listStyleType: 'disc' }}>
              <li><strong>Desde la App (Recomendado):</strong> Ve a Menú &gt; Perfil &gt; Configuración de Seguridad &gt; Eliminar mi cuenta. La eliminación se procesará directamente desde el dispositivo de forma automática.</li>
              <li><strong>Desde la Web:</strong> Visita nuestro centro de privacidad en fimchile.cl o envía un correo desde tu correo registrado.</li>
            </ul>
            <p>
              <em>Nota Legal:</em> Por exigencia del Servicio de Impuestos Internos (SII) de Chile y para prevención de fraudes, retendremos exclusivamente el registro de transacciones financieras y evidencia de viajes completados por el plazo legal mínimo requerido. Tu información pública (foto, perfil) se borrará de inmediato.
            </p>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>7. Soporte y Contacto</h2>
            <p>
              Para ejercer tus derechos de privacidad, solicitar tu información o si tienes dudas sobre el manejo de tus datos, el canal oficial y único de comunicación de FIM es:
              <br/><br/>
              <strong><a href="mailto:contacto@fimchile.cl" style={{ color: 'var(--accent)' }}>contacto@fimchile.cl</a></strong>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
