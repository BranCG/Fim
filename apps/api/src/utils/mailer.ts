export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  console.log(`
┌──────────────────────────────────────────────────────────┐
│  📧 ENVIANDO CORREO DE VERIFICACIÓN (SIMULACIÓN)         │
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
}
