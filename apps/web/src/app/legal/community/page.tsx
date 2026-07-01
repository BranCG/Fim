import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Comunidad y Seguridad - FIM',
  description: 'Nuestras estrictas normas de comportamiento, prevención de fraudes y cero tolerancia ante el acoso y la violencia.'
};

export default function CommunityPolicyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', marginBottom: '24px', display: 'inline-block' }}>← Volver al inicio</Link>
        
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>Comunidad y Seguridad</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>Última actualización: 30 de Junio, 2026</p>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '32px', lineHeight: 1.7 }}>
          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>1. Un Entorno Seguro para Todos</h2>
            <p>
              La seguridad es el pilar de FIM. Nuestra visión es que tanto conductores como pasajeros lleguen a sus destinos en un ambiente de confianza mutua, libre de riesgos y con los máximos estándares de calidad. Para lograr esto, aplicamos políticas de <strong>cero tolerancia</strong> frente a conductas inapropiadas o ilícitas.
            </p>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>2. Cuentas Falsas y Suplantación</h2>
            <p>
              Toda cuenta (ya sea de conductor o pasajero) debe corresponder a una persona natural real. 
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', listStyleType: 'disc' }}>
              <li><strong>Validación Biométrica:</strong> Los conductores pasan por controles de identidad rigurosos. Quien conduce el vehículo debe ser la misma persona de la foto validada en la plataforma.</li>
              <li><strong>Prohibición Estricta:</strong> Prestar, vender o arrendar una cuenta de conductor de FIM resulta en un baneo definitivo e inapelable de todos los involucrados y su reporte a las autoridades policiales.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>3. Fraude Tecnológico</h2>
            <p>
              No permitimos actividades que busquen vulnerar, engañar o manipular la tecnología de intermediación de FIM:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', listStyleType: 'disc' }}>
              <li>Uso de aplicaciones falsificadoras de GPS ("Fake GPS").</li>
              <li>Confabulación entre cuentas de pasajeros y conductores para inflar métricas, generar viajes simulados o evadir las normativas de membresías.</li>
              <li>Alteración, ingeniería inversa o scraping de la aplicación.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>4. Cero Tolerancia a la Violencia y el Acoso</h2>
            <p>
              Toda interacción durante la prestación del servicio debe ser profesional y respetuosa. Conllevarán a la desactivación permanente e inmediata de la cuenta:
            </p>
            <ul style={{ paddingLeft: '20px', margin: '12px 0', listStyleType: 'disc' }}>
              <li><strong>Violencia Física o Verbal:</strong> Agresiones, amenazas, insultos o cualquier comportamiento discriminatorio (por raza, religión, nacionalidad, orientación sexual o identidad de género).</li>
              <li><strong>Acoso Sexual o Insinuaciones:</strong> Está estrictamente prohibido realizar comentarios sobre la apariencia, hacer preguntas íntimas innecesarias, buscar contacto físico, o contactar a un usuario por medios externos a la app tras finalizar el trayecto.</li>
            </ul>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>5. Colaboración con las Autoridades</h2>
            <p>
              FIM almacena la evidencia de la ruta, el horario exacto y los datos de perfil de ambas partes. Ante cualquier reporte de incidente delictual, FIM Chile SpA cooperará activamente y de inmediato con Carabineros de Chile, la Policía de Investigaciones (PDI) y el Ministerio Público, entregando toda la telemetría correspondiente tras una orden oficial.
            </p>
          </div>

          <div>
            <h2 style={{ color: 'var(--accent)', marginBottom: '12px', fontSize: '1.4rem' }}>6. Reportes y Contacto</h2>
            <p>
              Si presenciaste o fuiste víctima de una violación a estas políticas, repórtalo inmediatamente. FIM maneja estas denuncias de forma confidencial y prioritaria.
              <br/><br/>
              <strong><a href="mailto:contacto@fimchile.cl" style={{ color: 'var(--accent)' }}>contacto@fimchile.cl</a></strong>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
