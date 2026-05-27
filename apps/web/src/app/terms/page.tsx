import Link from 'next/link';
import Logo from '@/components/Logo';

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <Logo />
          <h1 style={{ marginTop: '24px', fontSize: '2.5rem', fontWeight: 900 }}>Términos y Condiciones de Uso</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Última actualización: 26 de Mayo, 2026</p>
        </div>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '32px', lineHeight: 1.7 }}>
          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px' }}>1. Naturaleza de FIM como Intermediario Tecnológico</h2>
            <p>
              FIM es exclusivamente una plataforma tecnológica de intermediación bajo el modelo de Software como Servicio (SaaS). 
              FIM <strong>no es una empresa de transporte terrestre</strong>, <strong>no posee vehículos propios</strong>, <strong>no presta servicios de transporte directo</strong> y <strong>no emplea conductores</strong>. El rol de FIM se limita estrictamente a actuar como intermediario tecnológico para conectar a pasajeros con conductores independientes que utilizan nuestra plataforma como una herramienta para prestar sus propios servicios.
            </p>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px' }}>2. Independencia y Rol de los Conductores</h2>
            <p>
              Todos los conductores de la plataforma son trabajadores independientes y colaboradores autónomos. No existe ninguna relación de subordinación, dependencia ni vínculo laboral de ningún tipo entre FIM y los conductores. FIM <strong>no actúa como empleador</strong>. Los conductores determinan sus propios horarios y disponibilidad libremente y son responsables de cumplir con las exigencias legales chilenas vigentes para la conducción de vehículos.
            </p>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px' }}>3. Flujo Financiero y Administración de Pagos</h2>
            <p>
              FIM <strong>no cobra los viajes de los pasajeros</strong>, <strong>no recibe, no retiene ni administra pagos</strong> correspondientes a las tarifas de los trayectos. El 100% de la tarifa del viaje pertenece directamente al conductor independiente y es cobrado de forma inmediata y en tiempo real a través de efectivo físico o del enlace de cobro de Mercado Pago provisto por el conductor. FIM solo percibe ingresos mediante suscripciones fijas de membresía que los conductores independientes pagan para acceder al uso de la plataforma.
            </p>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px' }}>4. Exclusión de Garantías y Disponibilidad</h2>
            <p>
              FIM ofrece la plataforma "tal como está" y no garantiza el funcionamiento ininterrumpido del software ni la disponibilidad constante de conductores o pasajeros en un área geográfica o momento determinado. El acceso a la plataforma puede suspenderse temporalmente por mantenimiento, fallas de red o causas ajenas al control directo de FIM.
            </p>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px' }}>5. Limitación de Responsabilidad y Riesgo de Accidentes</h2>
            <p style={{ marginBottom: '12px' }}>
              En FIM priorizamos la seguridad, pero debido a nuestra naturaleza de intermediarios tecnológicos, <strong>FIM queda completamente excluida de cualquier tipo de responsabilidad civil o penal</strong> por accidentes de tránsito, daños físicos, lesiones personales, decesos, robos, secuestros, daños vehiculares o pérdidas de bienes ocurridas durante la realización de un trayecto.
            </p>
            <p>
              El conductor independiente es el único y exclusivo responsable civil y penal del trayecto, debiendo mantener sus seguros SOAP y de responsabilidad civil obligatorios vigentes en Chile en óptimas condiciones. Asimismo, ni FIM ni el conductor asociado son responsables por la pérdida, daño u olvido de objetos personales dentro del vehículo.
            </p>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px' }}>6. Datos de Transacciones Registrados</h2>
            <p>
              Para garantizar la transparencia ante la legislación chilena y respaldar operativamente la plataforma, FIM registra y almacena el historial de las siguientes transacciones y datos:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', display: 'flex', flexDirection: 'column', gap: '8px', listStyleType: 'disc' }}>
              <li>ID único de pago / Transacción.</li>
              <li>Fecha, hora de inicio y término del viaje.</li>
              <li>Datos del conductor independiente y del pasajero.</li>
              <li>Monto estimado y final del trayecto.</li>
              <li>Cálculo de impuestos estimados (ej. IVA) para el cumplimiento fiscal del conductor.</li>
              <li>Estado de la transacción y estado del viaje.</li>
              <li>Membresía del conductor y Folio de la boleta de servicio correspondiente ante el SII.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px' }}>7. Colaboración con las Autoridades y la Justicia</h2>
            <p>
              Ante eventos de seguridad graves, denuncias, accidentes o posibles delitos penales, FIM cooperará activamente y de manera transparente con Carabineros de Chile, la Policía de Investigaciones (PDI), los tribunales de justicia y el Ministerio Público. Entregaremos toda la información de posicionamiento GPS, datos de usuarios, números telefónicos y registros del historial del viaje requeridos formalmente para esclarecer los hechos.
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
