import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
const smtpSecure = process.env.SMTP_SECURE === 'true'; // true for port 465, false for other ports
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || 'Fim <no-reply@fim.cl>';

function getTransporter() {
  if (!smtpHost || !smtpUser || !smtpPass) {
    return null;
  }
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`
┌──────────────────────────────────────────────────────────┐
│  [CORREO DE VERIFICACIÓN]                                │
├──────────────────────────────────────────────────────────┤
│  Para: ${email.padEnd(48)} │
│                                                          │
│  Tu código de verificación para Fim es:                  │
│                                                          │
│                     [  ${code}  ]                      │
│                                                          │
│  Este código expira en 15 minutos.                       │
│  Si no solicitaste este código, puedes ignorarlo.        │
└──────────────────────────────────────────────────────────┘
    `);
    return;
  }

  const mailOptions = {
    from: smtpFrom,
    to: email,
    subject: 'Verifica tu correo electrónico - Fim',
    text: `Tu código de verificación para Fim es: ${code}\n\nEste código expira en 15 minutos.\nSi no solicitaste este código, puedes ignorarlo.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #111827; margin: 0; font-size: 24px; font-weight: 800;">Fim</h2>
        </div>
        <div style="margin-bottom: 24px;">
          <h3 style="color: #1f2937; margin-top: 0;">Verifica tu correo electrónico</h3>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Gracias por registrarte en Fim. Por favor, utiliza el siguiente código para verificar tu correo electrónico:</p>
          <div style="text-align: center; margin: 32px 0;">
            <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 4px; padding: 12px 24px; background-color: #f3f4f6; color: #111827; border-radius: 8px; border: 1px solid #e5e7eb;">${code}</span>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">Este código expira en 15 minutos. Si no solicitaste este código, puedes ignorarlo con seguridad.</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <div style="text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Fim. Todos los derechos reservados.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Mailer] Correo de verificación enviado con éxito a: ${email}`);
  } catch (error) {
    console.error(`[Mailer] Error al enviar correo de verificación a ${email}:`, error);
  }
}

export async function sendPasswordResetEmail(email: string, code: string): Promise<void> {
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`
┌──────────────────────────────────────────────────────────┐
│  [CORREO DE RECUPERACIÓN]                                │
├──────────────────────────────────────────────────────────┤
│  Para: ${email.padEnd(48)} │
│                                                          │
│  Tu código de recuperación para restablecer tu contraseña  │
│  en Fim es:                                              │
│                                                          │
│                     [  ${code}  ]                      │
│                                                          │
│  Este código expira en 15 minutos.                       │
│  Si no solicitaste este código, puedes ignorarlo.        │
└──────────────────────────────────────────────────────────┘
    `);
    return;
  }

  const mailOptions = {
    from: smtpFrom,
    to: email,
    subject: 'Restablecer contraseña - Fim',
    text: `Tu código de recuperación para restablecer tu contraseña en Fim es: ${code}\n\nEste código expira en 15 minutos.\nSi no solicitaste este código, puedes ignorarlo.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #111827; margin: 0; font-size: 24px; font-weight: 800;">Fim</h2>
        </div>
        <div style="margin-bottom: 24px;">
          <h3 style="color: #1f2937; margin-top: 0;">Restablecer contraseña</h3>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Fim. Por favor, utiliza el siguiente código de recuperación:</p>
          <div style="text-align: center; margin: 32px 0;">
            <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 4px; padding: 12px 24px; background-color: #f3f4f6; color: #111827; border-radius: 8px; border: 1px solid #e5e7eb;">${code}</span>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">Este código expira en 15 minutos y solo puede utilizarse una vez. Si no solicitaste este código, puedes ignorarlo con seguridad y tu contraseña actual no cambiará.</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <div style="text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Fim. Todos los derechos reservados.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Mailer] Correo de recuperación enviado con éxito a: ${email}`);
  } catch (error) {
    console.error(`[Mailer] Error al enviar correo de recuperación a ${email}:`, error);
  }
}


