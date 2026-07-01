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
              Las membresías se cobran de forma <strong>prepagada</strong> (mensual, semanal u otro formato que elija el conductor). 
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', listStyleType: 'disc' }}>
              <li><strong>Pago Manual por Enlace:</strong> FIM cobra en base a un link de pago generado automáticamente dependiendo de la membresía que elija el conductor. Este link de Mercado Pago se proporcionará una vez elegida la membresía en la aplicación.</li>
              <li><strong>Sin Cargos Automáticos:</strong> FIM no guarda los datos de tu tarjeta de crédito ni realiza cargos automáticos sorpresas.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>3. Expiración de la Membresía</h2>
            <p>
              No existen contratos forzosos ni procesos complejos de cancelación, ya que las membresías <strong>no se renuevan automáticamente</strong>.
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', listStyleType: 'disc' }}>
              <li><strong>Vencimiento:</strong> Toda membresía expira automáticamente el día 30 de su ciclo a las 00:00 hrs.</li>
              <li><strong>Renovación Voluntaria:</strong> Una vez transcurrido este periodo, la cuenta entrará en modo inactivo. El conductor tendrá la oportunidad de elegir otra membresía o seguir con la misma, pagando de forma independiente mediante un nuevo link de Mercado Pago proporcionado por la aplicación.</li>
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
