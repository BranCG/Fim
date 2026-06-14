import Link from 'next/link';
import Logo from '@/components/Logo';

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <Logo />
          <h1 style={{ marginTop: '24px', fontSize: '2.5rem', fontWeight: 900 }}>Políticas de Privacidad</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Última actualización: 14 de Junio, 2026</p>
        </div>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '32px', lineHeight: 1.7 }}>
          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px' }}>1. Declaración de Uso de Permisos Nativos</h2>
            <p style={{ marginBottom: '12px' }}>
              Para garantizar el correcto funcionamiento del software en dispositivos móviles Android (Google Play) e iOS (Apple App Store), FIM requiere el acceso a determinados permisos nativos del sistema. A continuación se detalla y justifica el uso de cada uno:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', display: 'flex', flexDirection: 'column', gap: '12px', listStyleType: 'disc' }}>
              <li>
                <strong>Ubicación y GPS (Primer y Segundo Plano):</strong> 
                <br />
                <em>Uso:</em> Acceso a la geolocalización precisa del dispositivo.
                <br />
                <em>Justificación:</em> Es indispensable para estimar la ruta del viaje, calcular la distancia y tarifa correspondiente, y permitir que los pasajeros ubiquen conductores cercanos. En el caso de los <strong>conductores independientes</strong>, la ubicación se recopila en <strong>segundo plano</strong> (cuando la pantalla está apagada o la aplicación está minimizada) mientras se encuentren en estado "Online" (En Línea). Esto es esencial para que el algoritmo les asigne viajes cercanos en tiempo real.
              </li>
              <li>
                <strong>Cámara:</strong> 
                <br />
                <em>Uso:</em> Acceso al hardware de captura fotográfica del celular.
                <br />
                <em>Justificación:</em> Requerida exclusivamente para el registro y la validación de seguridad de pasajeros y conductores (ej. fotografías de licencia de conducir, cédula de identidad y validación biométrica facial para prevenir suplantaciones de identidad).
              </li>
              <li>
                <strong>Micrófono:</strong> 
                <br />
                <em>Uso:</em> Acceso a la entrada de audio del dispositivo.
                <br />
                <em>Justificación:</em> Utilizado únicamente para permitir llamadas de voz seguras integradas en la app entre pasajero y conductor, facilitando la coordinación sin necesidad de exponer los números telefónicos privados de las partes.
              </li>
              <li>
                <strong>Contactos:</strong> 
                <br />
                <em>Uso:</em> Acceso a la libreta de contactos del teléfono.
                <br />
                <em>Justificación:</em> Utilizado para la función de seguridad "Contactos de Emergencia". Permite al usuario seleccionar un contacto de confianza directamente desde su libreta para compartir los datos del trayecto en tiempo real y emitir alertas automáticas en caso de incidentes.
              </li>
              <li>
                <strong>Notificaciones Push:</strong> 
                <br />
                <em>Uso:</em> Envío de alertas visuales y sonoras en el sistema operativo.
                <br />
                <em>Justificación:</em> Se envían notificaciones estrictamente <strong>funcionales y operativas</strong> para alertar al pasajero cuando el conductor va en camino, cuando ha llegado al punto de recogida, o al recibir mensajes en el chat interno. Para los conductores, se utiliza para alertar sobre solicitudes de viaje disponibles. FIM no realiza envíos de notificaciones promocionales o publicitarias sin el consentimiento explícito del usuario.
              </li>
            </ul>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px' }}>2. App Privacy (Declaración Apple App Store)</h2>
            <p style={{ marginBottom: '12px' }}>
              De conformidad con las directrices de privacidad de Apple, declaramos de forma transparente el tratamiento de los datos del usuario:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', display: 'flex', flexDirection: 'column', gap: '8px', listStyleType: 'disc' }}>
              <li><strong>Datos Recopilados:</strong> Datos de geolocalización (GPS), dirección de correo electrónico, número de teléfono, historial de trayectos (origen, destino, duración, precio), datos del vehículo del conductor (marca, modelo, patente) y fotos de perfil/documentos de identidad.</li>
              <li><strong>Datos Compartidos:</strong> FIM no comparte, arrienda ni vende datos personales de los usuarios a redes publicitarias o terceros. Los datos de identidad y trayecto solo se comparten entre el pasajero y el conductor para coordinar el viaje en curso, y se resguardan en servidores encriptados.</li>
              <li><strong>Seguimiento (User Tracking):</strong> FIM no realiza seguimiento de la actividad del usuario a través de aplicaciones o sitios web de otras empresas para fines publicitarios.</li>
              <li><strong>Comercio Físico y Pasarela de Pago:</strong> FIM opera bajo el modelo de intermediación de un servicio físico (transporte). Por esta razón, de acuerdo con las políticas de Apple, los pagos se realizan mediante transferencia, efectivo directo, o mediante el enlace de cobro de Mercado Pago provisto directamente por el conductor independiente. FIM no vende contenido digital ni utiliza compras integradas (In-App Purchases) de Apple.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px' }}>3. Almacenamiento de Transacciones (Auditoría y SII)</h2>
            <p>
              Aunque FIM es un intermediario tecnológico y no retiene comisiones por los viajes, nuestra base de datos almacena el registro exacto de cada transacción comercial para efectos fiscales, cumplimiento tributario ante el Servicio de Impuestos Internos (SII) de Chile y auditorías internas:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', display: 'flex', flexDirection: 'column', gap: '8px', listStyleType: 'disc' }}>
              <li>ID único de pago/Transacción.</li>
              <li>Fecha y hora exactas de inicio y fin de los trayectos.</li>
              <li>Identificación del conductor independiente y del pasajero.</li>
              <li>Monto total cobrado por el viaje o la membresía SaaS.</li>
              <li>Cálculo de impuestos estimados asociados a los servicios de transporte independientes.</li>
              <li>Folio de boleta de servicio correspondiente ante el SII.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px' }}>4. Trazabilidad de Seguridad e Incidentes</h2>
            <p style={{ marginBottom: '12px' }}>
              Al ser FIM una herramienta de intermediación SaaS, queda excluida de responsabilidad por siniestros de tránsito o incidentes personales ocurridos durante los viajes. La recopilación de ubicación GPS y la verificación de RUT y documentos de identidad de conductores y pasajeros tiene el propósito exclusivo de dotar de <strong>trazabilidad técnica</strong>.
            </p>
            <p>
              En caso de cualquier eventualidad, robo, accidente o colisión, esta información histórica almacenada en servidores encriptados permite a las partes contar con el registro de la ruta real del vehículo y de los perfiles involucrados.
            </p>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px' }}>5. Cooperación con la Justicia</h2>
            <p>
              Ante incidentes delictivos graves, sospechas de delitos o accidentes de tránsito con consecuencias físicas o daños, FIM colaborará activamente con las instituciones judiciales chilenas. Entregaremos de forma expedita e íntegra a <strong>Carabineros de Chile</strong>, la <strong>Policía de Investigaciones (PDI)</strong>, la <strong>Fiscalía (Ministerio Público)</strong> y los tribunales competentes todos los registros de ubicación GPS (en tiempo real e históricos), identidades verificadas (RUT, selfies) e historial de viajes requeridos formalmente bajo las leyes del país.
            </p>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px' }}>6. Derechos y Eliminación de Cuentas</h2>
            <p>
              Cualquier usuario (pasajero o conductor) tiene derecho a solicitar la eliminación definitiva de su cuenta y de todos sus datos personales. Para ello, o para cualquier consulta sobre privacidad, puedes contactarnos a través de nuestra dirección de correo electrónico dedicada de soporte: <strong>soporte@fim.cl</strong>. FIM responderá a tu solicitud en un plazo máximo de 10 días hábiles. Los datos estrictamente contables o fiscales exigidos por las leyes tributarias chilenas serán retenidos por el plazo legal mínimo requerido antes de su eliminación definitiva.
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
