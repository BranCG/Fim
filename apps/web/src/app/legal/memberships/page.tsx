import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Membresías - FIM',
  description: 'Información detallada sobre los planes, cobros, renovaciones y cancelaciones para conductores FIM.'
};

export default function MembershipsPolicyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', marginBottom: '24px', display: 'inline-block' }}>← Volver al inicio</Link>
        
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>Política de Membresías</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>Última actualización: 30 de Junio, 2026</p>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '32px', lineHeight: 1.7 }}>
          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>1. El Modelo de Suscripción de FIM</h2>
            <p>
              A diferencia de las plataformas tradicionales que cobran comisiones (20% a 30%) por cada viaje, FIM ofrece a los conductores un modelo de **Suscripción o Membresía**. 
              Bajo este esquema, el conductor paga una cuota fija recurrente a FIM por el uso de la tecnología (software, emparejamiento GPS, soporte) y, a cambio, **retiene el 100% de las ganancias** de todos los viajes que realice.
            </p>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>2. Ciclos de Facturación y Cobros</h2>
            <p>
              Las membresías se cobran de forma **prepagada** al inicio de cada ciclo de facturación (mensual, semanal u otro formato que elija el conductor). 
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', listStyleType: 'disc' }}>
              <li><strong>Renovación Automática:</strong> Para evitar interrupciones en el servicio y no perder viajes, la membresía se renueva y se cobra automáticamente al finalizar el ciclo vigente, utilizando el método de pago guardado por el conductor.</li>
              <li><strong>Pagos Fallidos:</strong> Si el método de pago declina el cargo automático, la cuenta del conductor pasará a estado suspendido y no podrá aceptar viajes nuevos hasta que se regularice la deuda. FIM realizará reintentos de cobro durante los días posteriores.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>3. Modificación y Cancelación de la Membresía</h2>
            <p>
              El conductor tiene control absoluto sobre su membresía.
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', listStyleType: 'disc' }}>
              <li><strong>Cancelación:</strong> El conductor puede cancelar la renovación automática de su membresía en cualquier momento directamente desde la App (Perfil &gt; Mi Membresía &gt; Cancelar). No hay contratos forzosos.</li>
              <li>Al cancelar, el conductor seguirá teniendo acceso a la plataforma hasta el último día del ciclo que ya pagó. Una vez transcurrido este periodo, la cuenta entrará en modo inactivo.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>4. Suspensión Administrativa</h2>
            <p>
              Si FIM suspende permanentemente a un conductor por infracción a los Términos y Condiciones o Políticas de Seguridad (ej. acoso, fraude, documentación falsa), **su membresía se cancelará inmediatamente para evitar cobros futuros**. No obstante, el periodo restante del mes actual no será reembolsado, considerándose una penalidad administrativa.
            </p>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>5. Política de Reembolsos</h2>
            <p>
              Debido a la naturaleza del servicio de software y acceso inmediato a la base de pasajeros, **no se emiten reembolsos prorrateados**. 
              Si un conductor paga un ciclo mensual y decide dejar de usar la aplicación al tercer día, no se devolverá el dinero correspondiente a los días restantes. 
              Los reembolsos completos solo procederán en caso de cobros duplicados por error comprobable del sistema de pasarela de pago.
            </p>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>6. Soporte y Contacto</h2>
            <p>
              Si detectas un error en la facturación o necesitas ayuda con tu membresía, escríbenos a:
              <br/><br/>
              <strong><a href="mailto:contacto@fimchile.cl" style={{ color: 'var(--accent)' }}>contacto@fimchile.cl</a></strong>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
