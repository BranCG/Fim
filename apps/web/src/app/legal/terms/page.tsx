import Link from 'next/link';

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', marginBottom: '24px', display: 'inline-block' }}>← Volver al inicio</Link>
        
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>Términos y Condiciones de Uso</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>Última actualización: 14 de Junio, 2026</p>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '32px', lineHeight: 1.7 }}>
          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>1. Naturaleza de FIM como Intermediario Tecnológico</h2>
            <p>
              FIM es una plataforma tecnológica que opera bajo la modalidad de Software como Servicio (SaaS). FIM <strong>no es una empresa de transportes terrestres</strong>, no posee una flota de vehículos, no contrata ni emplea conductores, ni ejerce labores de supervisión laboral sobre los mismos. El servicio provisto por FIM se limita estrictamente a la intermediación tecnológica para facilitar que pasajeros y conductores independientes se conecten y coordinen trayectos de forma autónoma.
            </p>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>2. Independencia y Responsabilidad del Conductor</h2>
            <p>
              Los conductores asociados son colaboradores independientes que utilizan la plataforma de forma voluntaria y autónoma, sin relación de subordinación, dependencia ni exclusividad con FIM. Cada conductor independiente asume la total responsabilidad civil, penal y administrativa de los trayectos que decida aceptar:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', display: 'flex', flexDirection: 'column', gap: '8px', listStyleType: 'disc' }}>
              <li>Mantener al día toda la documentación vehicular exigida por las leyes chilenas (permiso de circulación, revisión técnica, seguro SOAP obligatorio y licencia de conducir profesional correspondiente).</li>
              <li>Cumplir rigurosamente con las normativas de tránsito, límites de velocidad y condiciones de seguridad vial vigentes en el país.</li>
              <li>Mantener el vehículo en perfectas condiciones mecánicas y de higiene para garantizar un trayecto seguro a los pasajeros.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>3. Responsabilidad del Pasajero y Límites de Capacidad</h2>
            <p>
              Al hacer uso de la plataforma, el pasajero se compromete a mantener una conducta respetuosa, seguir las normas básicas de convivencia y acatar las directrices del conductor en lo relativo a la seguridad del vehículo:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', display: 'flex', flexDirection: 'column', gap: '8px', listStyleType: 'disc' }}>
              <li><strong>Capacidad Máxima de Pasajeros:</strong> Por motivos de seguridad vial y de conformidad con el diseño estándar de los vehículos y seguros SOAP, la capacidad máxima permitida por viaje es de **4 personas** (incluyendo acompañantes). Bajo ninguna circunstancia se permitirá el abordaje de un número de pasajeros superior al límite indicado, quedando el conductor plenamente facultado para denegar el servicio si este se excede.</li>
              <li><strong>Respeto y Cuidado:</strong> El pasajero debe cuidar la integridad física del vehículo. Todo daño material provocado al automóvil durante el viaje por negligencia del pasajero será de su exclusiva responsabilidad pecuniaria.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>4. Comisiones, Tarifas y Flujo Financiero</h2>
            <p style={{ marginBottom: '12px' }}>
              FIM promueve un ecosistema de transporte libre y transparente. Por ello, <strong>FIM no cobra comisiones sobre las tarifas de los viajes</strong>:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', display: 'flex', flexDirection: 'column', gap: '8px', listStyleType: 'disc' }}>
              <li>El 100% del precio del viaje estimado y cobrado es propiedad directa y exclusiva del conductor independiente.</li>
              <li>Los pagos de los trayectos se liquidan directamente entre el pasajero y el conductor de forma física (efectivo) o mediante transferencia directa usando el enlace de cobro de Mercado Pago configurado por el propio conductor en su perfil. FIM no procesa, no recibe, ni retiene los fondos correspondientes a los viajes.</li>
              <li>FIM únicamente percibe ingresos mediante cobros fijos de **suscripciones de membresía** de software que los conductores independientes pagan voluntariamente para mantener activa su cuenta y recibir ofertas de viajes.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>5. Políticas de Cancelación de Viajes</h2>
            <p>
              Para optimizar la fluidez operativa y respetar el tiempo de los usuarios, se establecen las siguientes condiciones de cancelación:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', display: 'flex', flexDirection: 'column', gap: '8px', listStyleType: 'disc' }}>
              <li><strong>Fase de Búsqueda (Searching):</strong> El pasajero puede cancelar de manera inmediata, libre y sin justificación alguna su solicitud mientras la plataforma se encuentre buscando conductor en su zona. Esta cancelación directa no acarrea penalizaciones de ningún tipo.</li>
              <li><strong>Conductor Asignado / En Camino (Driver Assigned/Arrived):</strong> Si el pasajero decide cancelar el viaje una vez que un conductor ya ha aceptado la solicitud y se encuentra en trayecto a recogerlo, la plataforma le solicitará indicar de forma obligatoria el motivo de cancelación para fines de registro e indicación al conductor. Las cancelaciones reiteradas e injustificadas en esta fase podrían generar suspensiones temporales de la cuenta del pasajero por mal uso del sistema.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>6. Limitación de Responsabilidad</h2>
            <p>
              Al ser FIM un mero proveedor de infraestructura de software (SaaS), la plataforma no asume responsabilidad civil, contractual o extracontractual por accidentes, colisiones, robos, lesiones o fallecimientos acaecidos durante el trayecto. Las partes (conductor y pasajero) asumen y declaran conocer que el contrato de transporte se celebra de forma bilateral y directa y exclusiva entre ellos.
            </p>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>7. Soporte y Contacto Oficial</h2>
            <p>
              Ante cualquier duda, reclamo o reporte de seguridad, el canal oficial y dedicado de comunicación de FIM es nuestro correo electrónico de soporte: <strong>soporte@fim.cl</strong>. Toda comunicación enviada a esta casilla será atendida a la brevedad por nuestro equipo de atención y auditoría de la plataforma.
            </p>
          </div>
        </section>

        <div style={{ marginTop: '60px', textAlign: 'center' }}>
          <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', display: 'inline-block' }}>← Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}
