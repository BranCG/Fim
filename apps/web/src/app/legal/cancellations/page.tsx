import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Cancelaciones - FIM',
  description: 'Conoce las reglas y tiempos de gracia aplicables a las cancelaciones de viajes en FIM.'
};

export default function CancellationsPolicyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', marginBottom: '24px', display: 'inline-block' }}>← Volver al inicio</Link>
        
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>Política de Cancelaciones</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>Última actualización: 30 de Junio, 2026</p>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '32px', lineHeight: 1.7 }}>
          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>1. Principio General</h2>
            <p>
              En FIM entendemos que los imprevistos ocurren. Sin embargo, para garantizar una red confiable y eficiente tanto para conductores como pasajeros, las cancelaciones deben ser la excepción, no la regla. 
              El abuso constante de cancelaciones perjudica el ecosistema y resulta en sanciones a las cuentas infractoras.
            </p>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>2. Cancelaciones por Parte del Pasajero</h2>
            <p>
              Como pasajero, tienes las siguientes opciones y responsabilidades:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', listStyleType: 'disc' }}>
              <li><strong>Tiempo de Gracia:</strong> Puedes cancelar tu solicitud sin ninguna penalización ni marca en tu cuenta durante los primeros <strong>2 minutos</strong> después de que el conductor haya aceptado el viaje.</li>
              <li><strong>Cancelación Tardía:</strong> Si cancelas cuando el conductor ya lleva más de 2 minutos en ruta, tu cuenta sumará una advertencia de cancelación. </li>
              <li><strong>Inasistencia (No-show):</strong> Si el conductor llega al punto de recogida, espera al menos <strong>5 minutos</strong>, y no te presentas ni respondes, el conductor podrá cancelar el viaje indicando "Pasajero no se presentó". Esto también genera una infracción grave en tu historial de pasajero.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>3. Cancelaciones por Parte del Conductor</h2>
            <p>
              Como conductor independiente, eres libre de decidir qué viajes aceptar. Sin embargo, una vez que aceptas un viaje, adquieres un compromiso.
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', listStyleType: 'disc' }}>
              <li><strong>Cancelación Injustificada:</strong> Cancelar un viaje luego de haberlo aceptado sin una razón de fuerza mayor generará una métrica negativa en tu perfil. FIM exige mantener una tasa de cancelación por debajo del porcentaje permitido en tu zona.</li>
              <li><strong>Cancelaciones Válidas (Excepciones):</strong> Un conductor puede cancelar sin afectar sus métricas si el pasajero solicita un cambio drástico de ruta no acordado, si la cantidad de pasajeros excede la capacidad legal del vehículo, si hay menores sin asiento especial, o si el pasajero tiene comportamiento agresivo comprobable.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>4. Sanciones por Abuso</h2>
            <p>
              La acumulación recurrente de cancelaciones injustificadas (superando los umbrales de tolerancia de la plataforma en un periodo de 30 días) resultará en acciones automatizadas:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', listStyleType: 'disc' }}>
              <li>Notificación y advertencia inicial en la aplicación.</li>
              <li>Suspensión temporal de la cuenta por 24 a 48 horas.</li>
              <li>En casos extremos o recurrentes tras previas suspensiones, bloqueo permanente de la cuenta (para pasajeros o conductores).</li>
            </ul>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>5. Soporte y Contacto</h2>
            <p>
              Si crees que tu cuenta fue suspendida injustamente por una cancelación donde el GPS o la aplicación fallaron, comunícate con nosotros:
              <br/><br/>
              <strong><a href="mailto:contacto@fimchile.cl" style={{ color: 'var(--accent)' }}>contacto@fimchile.cl</a></strong>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
