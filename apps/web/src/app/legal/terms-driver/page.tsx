import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos y Condiciones del Conductor - FIM',
  description: 'Conoce tus derechos, obligaciones, el modelo de 0% comisión y normativas al conducir con FIM.'
};

export default function DriverTermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', marginBottom: '24px', display: 'inline-block' }}>← Volver al inicio</Link>
        
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>Términos y Condiciones del Conductor</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>Última actualización: 30 de Junio, 2026</p>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '32px', lineHeight: 1.7 }}>
          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>1. Naturaleza de la Relación y 0% Comisión</h2>
            <p>
              El Conductor es un prestador de servicios independiente. Al utilizar la aplicación FIM, **no existe relación laboral, de subordinación o dependencia con FIM Chile SpA.**
              FIM opera bajo un modelo disruptivo de **0% de comisión por viaje**. El conductor retiene el 100% de las ganancias generadas por sus trayectos, los cuales son pagados directamente por el pasajero al conductor (en efectivo o mediante plataformas externas como Mercado Pago). A cambio del uso de la tecnología, el conductor accede a pagar una membresía recurrente.
            </p>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>2. Requisitos Documentales</h2>
            <p>
              Para ser habilitado en la plataforma, el conductor debe proveer documentación vigente y verídica:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', listStyleType: 'disc' }}>
              <li>Licencia de conducir chilena vigente.</li>
              <li>Cédula de Identidad.</li>
              <li>Permiso de circulación y seguro obligatorio (SOAP) del vehículo al día.</li>
              <li>Fotografía tipo selfie para validación biométrica de identidad.</li>
            </ul>
            <p>FIM se reserva el derecho de rechazar la activación o desactivar temporalmente una cuenta si la documentación está expirada, es ilegible o se sospecha adulteración.</p>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>3. Obligaciones del Conductor</h2>
            <p>
              El Conductor se compromete a:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', listStyleType: 'disc' }}>
              <li>Cobrar exclusivamente el monto sugerido o acordado en la aplicación, sin exigir cobros extras injustificados.</li>
              <li>Conducir de manera segura, respetando en todo momento la Ley de Tránsito vigente de Chile.</li>
              <li>Mantener el vehículo limpio, en buenas condiciones mecánicas y sanitarias.</li>
              <li>No delegar ni prestar su cuenta a terceros. Quien conduce debe ser exactamente la misma persona registrada y validada en la plataforma.</li>
              <li>Asumir toda responsabilidad tributaria (ej. declaración ante el SII) sobre los ingresos recibidos por los pasajeros.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>4. Responsabilidad sobre el Vehículo</h2>
            <p>
              El conductor es el único y exclusivo responsable de cualquier multa, infracción de tránsito, daño físico, material o choque que ocurra durante la prestación del servicio. FIM actúa exclusivamente como intermediario de software y no provee seguros contra accidentes ni asume responsabilidad civil, penal o monetaria por incidentes viales.
            </p>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>5. Causales de Suspensión o Bloqueo</h2>
            <p>
              FIM podrá suspender o bloquear de manera permanente la cuenta de un conductor por las siguientes razones:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', listStyleType: 'disc' }}>
              <li>Tasa alta y recurrente de cancelación de viajes sin justificación válida (afectando el servicio al pasajero).</li>
              <li>Reportes graves por parte de pasajeros: conducción temeraria, acoso, agresión, estado de ebriedad, o vehículos en mal estado.</li>
              <li>Comprobación de fraude: usar aplicaciones de manipulación de GPS, confabular viajes falsos, o suplantación de identidad (prestar la cuenta).</li>
              <li>Falta de pago oportuno de la membresía correspondiente para utilizar la plataforma tecnológica.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>6. Soporte y Contacto</h2>
            <p>
              Para apelaciones de cuentas, consultas de cobros o reporte de incidentes graves, nuestro canal único oficial es:
              <br/><br/>
              <strong><a href="mailto:contacto@fimchile.cl" style={{ color: 'var(--accent)' }}>contacto@fimchile.cl</a></strong>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
