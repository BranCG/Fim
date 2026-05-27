import Link from 'next/link';
import Logo from '@/components/Logo';

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <Logo />
          <h1 style={{ marginTop: '24px', fontSize: '2.5rem', fontWeight: 900 }}>Políticas de Privacidad</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Última actualización: 26 de Mayo, 2026</p>
        </div>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '32px', lineHeight: 1.7 }}>
          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px' }}>1. Datos Personales Recolectados</h2>
            <p style={{ marginBottom: '12px' }}>
              En FIM nos tomamos muy en serio la seguridad y privacidad de nuestros usuarios. Para poder prestar el servicio de intermediación tecnológica y ofrecer una experiencia segura y confiable, recolectamos y procesamos los siguientes datos de carácter personal:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', display: 'flex', flexDirection: 'column', gap: '8px', listStyleType: 'disc' }}>
              <li><strong>Ubicación Geográfica y GPS:</strong> Datos de geolocalización precisos y en tiempo real (coordenadas GPS) de pasajeros y conductores independientes durante el transcurso del viaje y su trayecto. En el caso de los conductores, estos datos se recolectan en segundo plano mientras la aplicación esté activa y en modo online para permitir la correcta asignación de viajes.</li>
              <li><strong>Números Telefónicos:</strong> Teléfonos de contacto proporcionados por los pasajeros y conductores independientes al registrarse, indispensables para la autenticación de cuentas y la comunicación directa y segura durante la coordinación del servicio.</li>
              <li><strong>Perfiles de Identidad:</strong> Nombres completos, RUT/cédula de identidad, dirección de correo electrónico, fotografías de perfil (selfie) y fotos de la documentación requerida para la verificación de identidad y seguridad.</li>
              <li><strong>Historial de Viajes:</strong> Registro detallado de las solicitudes de trayectos, incluyendo las direcciones exactas de origen y destino, fecha, hora, duración y reportes de incidentes.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px' }}>2. Almacenamiento de Datos de Transacciones (Fines de Auditoría y SII)</h2>
            <p>
              Como plataforma tecnológica SaaS, FIM no administra pagos directos de los pasajeros a los conductores ni cobra comisiones por los viajes. Sin embargo, para efectos fiscales de los conductores independientes, cumplimiento tributario chileno y auditorías internas del servicio, nuestra base de datos almacena el registro exacto de cada transacción comercial con los siguientes detalles:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', display: 'flex', flexDirection: 'column', gap: '8px', listStyleType: 'disc' }}>
              <li>ID único de pago / Transacción asociada.</li>
              <li>Fecha y hora exactas de la transacción y del viaje.</li>
              <li>Identificación del Conductor independiente que prestó el servicio y del Pasajero.</li>
              <li>Monto total cobrado por el trayecto o la membresía del software.</li>
              <li>Cálculo de impuestos estimados (ej. Impuesto al Valor Agregado - IVA) correspondientes al servicio prestado por el conductor independiente.</li>
              <li>Estado de la transacción (Aprobado, Pendiente, Rechazado).</li>
              <li>Plan de membresía activo del conductor independiente.</li>
              <li>Folio de la boleta de servicio de transporte correspondiente ante el Servicio de Impuestos Internos (SII).</li>
            </ul>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px' }}>3. Trazabilidad y Gestión de Seguridad (Riesgo de Accidentes)</h2>
            <p style={{ marginBottom: '12px' }}>
              Dado que FIM es un intermediario tecnológico y no presta servicios de transporte, queda excluida de toda responsabilidad civil y penal en caso de accidentes de tránsito, siniestros, robos u otros incidentes ocurridos durante los viajes. La recolección de los datos de ubicación GPS, perfiles verificados y teléfonos de contacto tiene como propósito fundamental otorgar <strong>trazabilidad técnica</strong> y seguridad a los usuarios.
            </p>
            <p>
              En caso de cualquier eventualidad, colisión o reclamo, estos registros permiten verificar la ocurrencia del viaje, los trayectos recorridos, y la identidad de las personas asociadas al evento, brindando resguardo y transparencia a todas las partes involucradas.
            </p>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px' }}>4. Colaboración Activa con las Autoridades y la Justicia</h2>
            <p>
              FIM mantiene un compromiso inquebrantable con la ley y la seguridad pública. Ante la ocurrencia de accidentes de tránsito, denuncias de robos, agresiones o cualquier sospecha de delito penal, FIM cooperará plenamente con la justicia chilena. 
              Entregaremos de manera oportuna, formal y transparente a **Carabineros de Chile**, la **Policía de Investigaciones (PDI)**, el **Ministerio Público (Fiscalía)** y los tribunales de justicia competentes toda la información y registros almacenados que sean requeridos formalmente (incluyendo ubicación GPS en tiempo real e histórica, números de teléfono, perfiles de identidad verificados con sus fotos y RUT, e historial de viajes) para facilitar las investigaciones pertinentes y proteger a los usuarios.
            </p>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px' }}>5. Seguridad de los Datos</h2>
            <p>
              Toda la información personal recolectada es almacenada en servidores seguros y encriptados, bajo estrictas medidas de seguridad técnica y administrativa para evitar su pérdida, alteración, acceso no autorizado o divulgación indebida. FIM jamás comercializa, arrienda o comparte datos personales con terceros para fines publicitarios o ajenos a la prestación y seguridad de la plataforma.
            </p>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px' }}>6. Derechos del Usuario y Eliminación de Datos</h2>
            <p>
              Los usuarios tienen derecho a acceder, rectificar o solicitar la eliminación total de su cuenta y datos personales registrados en FIM en cualquier momento mediante una solicitud enviada a los canales de soporte oficiales. Cabe señalar que aquellos datos de carácter transaccional e histórico (como folios de boletas del SII y registros de auditoría de pagos) deberán ser retenidos por el tiempo exigido por las leyes contables, tributarias y comerciales vigentes en Chile.
            </p>
          </div>
        </section>

        <div style={{ marginTop: '60px', textAlign: 'center' }}>
          <Link href="/" className="btn btn-primary">Volver al Inicio</Link>
        </div>
      </div>
    </div>
  );
}
