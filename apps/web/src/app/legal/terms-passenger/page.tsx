import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos y Condiciones del Pasajero - FIM',
  description: 'Conoce tus derechos, responsabilidades y las normas de la comunidad al viajar con FIM.'
};

export default function PassengerTermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', marginBottom: '24px', display: 'inline-block' }}>← Volver al inicio</Link>
        
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>Términos y Condiciones del Pasajero</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>Última actualización: 30 de Junio, 2026</p>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '32px', lineHeight: 1.7 }}>
          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>1. ¿Cómo funciona FIM?</h2>
            <p>
              FIM es una plataforma tecnológica que conecta a conductores independientes con pasajeros que requieren servicios de transporte.
              <strong>FIM no es una empresa de transporte ni provee el servicio directamente.</strong> Actuamos exclusivamente como intermediarios tecnológicos, asegurando una conexión segura, proporcionando estimaciones de tarifas y trazando la ruta mediante GPS. El contrato de transporte se realiza directamente entre el pasajero y el conductor.
            </p>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>2. Responsabilidades del Pasajero</h2>
            <p>
              Al utilizar FIM como pasajero, te comprometes a:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', listStyleType: 'disc' }}>
              <li><strong>Puntualidad:</strong> Estar listo en el punto de recogida al momento en que el conductor llegue.</li>
              <li><strong>Pago:</strong> Pagar el monto acordado por la aplicación directamente al conductor, ya sea en efectivo o a través de las pasarelas de pago indicadas por este (ej. Mercado Pago). FIM no se hace responsable por deudas no saldadas.</li>
              <li><strong>Respeto:</strong> Mantener una actitud respetuosa y cordial hacia el conductor y su vehículo.</li>
              <li><strong>Legalidad:</strong> No utilizar el servicio para transportar objetos ilícitos, peligrosos o que infrinjan la ley chilena.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>3. Cancelaciones y Penalizaciones</h2>
            <p>
              Entendemos que los planes cambian. Sin embargo, cancelar un viaje cuando el conductor ya está en camino afecta su tiempo y recursos.
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', listStyleType: 'disc' }}>
              <li><strong>Cancelación Gratuita:</strong> Puedes cancelar sin penalidad durante los primeros 2 minutos después de que el conductor haya aceptado el viaje.</li>
              <li><strong>Penalización por Cancelación Tardía:</strong> Si cancelas después del tiempo de gracia, o si el conductor cancela tras esperar más de 5 minutos en el punto de recogida, tu cuenta registrará una infracción. Múltiples cancelaciones injustificadas pueden derivar en la suspensión temporal o permanente de la cuenta.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>4. Reembolsos y Disputas</h2>
            <p>
              Debido a que el pago se realiza directamente del pasajero al conductor, FIM no retiene los fondos del viaje. 
              En caso de un cobro excesivo, un viaje no completado o disputas financieras, el pasajero debe contactar directamente al conductor o a la entidad financiera utilizada (ej. Mercado Pago). 
              No obstante, FIM mediará revisando la evidencia GPS de la ruta y podrá sancionar o expulsar al conductor en caso de fraude comprobado.
            </p>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>5. Conductas Prohibidas</h2>
            <p>
              Cualquier falta a estas normas resultará en la expulsión inmediata de la plataforma:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', listStyleType: 'disc' }}>
              <li>Uso de cuentas falsas o suplantación de identidad.</li>
              <li>Cualquier tipo de acoso verbal, físico o sexual hacia el conductor.</li>
              <li>Dañar intencionalmente el vehículo del conductor.</li>
              <li>Negarse a pagar el servicio de transporte al finalizar el trayecto.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>6. Soporte y Contacto</h2>
            <p>
              Si tienes un reclamo, problema de seguridad o consulta, nuestro equipo está para ayudarte:
              <br/><br/>
              <strong><a href="mailto:contacto@fimchile.cl" style={{ color: 'var(--accent)' }}>contacto@fimchile.cl</a></strong>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
