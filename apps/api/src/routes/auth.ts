import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { generateTokens, requireAuth } from '../middleware/auth';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/mailer';
import { OAuth2Client } from 'google-auth-library';
import axios from 'axios';
import { compareFaces } from '../utils/rekognition';

const router = Router();

const googleClientId = process.env.GOOGLE_CLIENT_ID || '1047712170366-g8kvdh9cbrp0h9o9dghfsq7g8r0f6u1a.apps.googleusercontent.com';
const googleClient = new OAuth2Client(googleClientId);

async function verifyGoogleToken(idToken: string) {
  if (!idToken) throw new Error('Token de Google no proporcionado');
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: googleClientId,
  });
  const payload = ticket.getPayload();
  if (!payload) throw new Error('Token de Google inválido');
  return payload;
}

// ─── REGISTRO PASAJERO ────────────────────────────────────────────────────
router.post('/passenger/register', async (req: Request, res: Response) => {
  try {
    const { email, phone, name, password, rut, birthDate, address, idFrontUrl, idBackUrl, selfieUrl, backgroundDocUrl } = req.body;

    if (!email || !phone || !name || !password) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Verificar si ya existe (incluyendo RUT para evitar 500 Unique Constraint Error)
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone },
          ...(rut ? [{ rut }] : [])
        ]
      },
    });
    if (existing) {
      return res.status(409).json({ error: 'Email, teléfono o RUT ya registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await prisma.user.create({
      data: {
        email,
        phone,
        name,
        passwordHash,
        rut,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        address,
        idFrontUrl,
        idBackUrl,
        selfieUrl,
        backgroundDocUrl,
        role: 'passenger',
        emailVerified: false,
        emailCode: code,
      },
    });

    await sendVerificationEmail(email, code);

    return res.status(201).json({
      status: 'verification_pending',
      email: user.email,
      role: 'passenger',
      message: 'Código de verificación enviado a tu correo'
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── LOGIN PASAJERO ───────────────────────────────────────────────────────
router.post('/passenger/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    if (!user.emailVerified) {
      return res.json({
        status: 'verification_pending',
        email: user.email,
        role: 'passenger',
        message: 'Por favor verifica tu correo electrónico'
      });
    }

    const tokens = generateTokens({
      id: user.id,
      role: user.role as 'passenger' | 'driver' | 'admin',
      email: user.email,
    });

    return res.json({
      message: 'Login exitoso',
      user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified },
      ...tokens,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── REGISTRO CONDUCTOR ───────────────────────────────────────────────────
router.post('/driver/register', async (req: Request, res: Response) => {
  try {
    const {
      email, phone, name, password, rut, birthDate, address,
      licenseNumber, vehicleBrand, vehicleModel, vehicleYear, vehiclePlate, tagNumber, vehicleColor,
      idFrontUrl, idBackUrl, selfieUrl, licenseUrl, licenseBackUrl, vehiclePhotoUrl,
      membershipPlan,
      backgroundDocUrl,
    } = req.body;

    const required = [email, phone, name, password, rut, birthDate, address,
      licenseNumber, vehicleBrand, vehicleModel, vehicleYear, vehiclePlate,
      idFrontUrl, idBackUrl, selfieUrl, licenseUrl, licenseBackUrl, vehiclePhotoUrl, membershipPlan,
      backgroundDocUrl];

    if (required.some(v => !v)) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    if (name.trim().split(' ').length < 3) {
      return res.status(400).json({ error: 'Debes ingresar nombres y ambos apellidos' });
    }

    if (Number(vehicleYear) < 2007) {
      return res.status(400).json({ error: 'Solo aceptamos vehículos del año 2007 en adelante' });
    }

    // Verificar duplicados
    const existing = await prisma.driver.findFirst({
      where: { OR: [{ email }, { phone }, { rut }, { vehiclePlate }] },
    });
    if (existing) {
      return res.status(409).json({ error: 'Email, teléfono, RUT o patente ya están registrados en el sistema' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const driver = await prisma.driver.create({
      data: {
        email, phone, name, passwordHash,
        rut, birthDate: new Date(birthDate), address,
        idFrontUrl, idBackUrl, selfieUrl, backgroundDocUrl,
        licenseNumber, licenseUrl, licenseBackUrl,
        vehicleBrand, vehicleModel,
        vehicleYear: Number(vehicleYear),
        vehiclePlate, vehiclePhotoUrl, tagNumber: tagNumber || "",
        vehicleColor: vehicleColor || "",
        membershipPlan,
        membershipGoal: membershipPlan === 'PROGRESSIVE' ? 120000 : 100000,
        status: 'pending',
        emailVerified: false,
        emailCode: code,
      },
    });

    await sendVerificationEmail(email, code);

    return res.status(201).json({
      status: 'verification_pending',
      email: driver.email,
      role: 'driver',
      message: 'Código de verificación enviado a tu correo'
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── LOGIN CONDUCTOR ──────────────────────────────────────────────────────
router.post('/driver/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const driver = await prisma.driver.findUnique({ where: { email } });
    if (!driver) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const valid = await bcrypt.compare(password, driver.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    if (!driver.emailVerified) {
      return res.json({
        status: 'verification_pending',
        email: driver.email,
        role: 'driver',
        message: 'Por favor verifica tu correo electrónico'
      });
    }

    const tokens = generateTokens({
      id: driver.id,
      role: 'driver',
      email: driver.email,
    });

    return res.json({
      message: 'Login exitoso',
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        status: driver.status,
        membershipPaid: driver.membershipPaid,
        walletBalance: driver.walletBalance,
      },
      ...tokens,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── LOGIN ADMIN ──────────────────────────────────────────────────────────
router.post('/admin/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const tokens = generateTokens({ id: user.id, role: 'admin', email: user.email });

    return res.json({
      message: 'Login admin exitoso',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      ...tokens,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── USUARIO ACTUAL (PERFIL) ──────────────────────────────────────────────
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;

    if (role === 'driver') {
      const driver = await prisma.driver.findUnique({
        where: { id: userId },
      });
      if (!driver) return res.status(404).json({ error: 'Conductor no encontrado' });
      return res.json({
        user: {
          id: driver.id,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          role: 'driver',
          status: driver.status,
          membershipPaid: driver.membershipPaid,
          walletBalance: driver.walletBalance,
        }
      });
    } else {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
      return res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified,
          idFrontUrl: user.idFrontUrl,
          idBackUrl: user.idBackUrl,
          selfieUrl: user.selfieUrl,
        }
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── VERIFICACIÓN BIOMÉTRICA (FACE MATCH) ──────────────────────────────────
router.post('/biometric-verify', requireAuth, async (req: Request, res: Response) => {
  try {
    const { selfieBase64 } = req.body;
    if (!selfieBase64) {
      return res.status(400).json({ error: 'Selfie en formato Base64 es requerida' });
    }

    const userId = req.user!.id;
    const role = req.user!.role;

    let selfieUrl: string | null = null;

    if (role === 'driver') {
      const driver = await prisma.driver.findUnique({
        where: { id: userId },
        select: { selfieUrl: true }
      });
      selfieUrl = driver?.selfieUrl || null;
    } else {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { selfieUrl: true }
      });
      selfieUrl = user?.selfieUrl || null;
    }

    // Verificar si la cuenta tiene un selfieUrl nulo, vacío o que es un placeholder de prueba
    if (!selfieUrl || selfieUrl.trim() === '' || selfieUrl.includes('placehold.co') || selfieUrl.includes('placeholder')) {
      console.log(`ℹ️ [Biometría] Bypass automático para cuenta de prueba (ID: ${userId}, SelfieUrl: ${selfieUrl})`);
      return res.json({ success: true, bypassed: true, message: 'Bypass de verificación biométrica para cuenta de prueba' });
    }

    // Convertir la selfie recibida (Base64) a Buffer
    const base64Data = selfieBase64.replace(/^data:image\/\w+;base64,/, "");
    const targetBuffer = Buffer.from(base64Data, 'base64');

    // Descargar la foto oficial (selfieUrl) y convertirla a Buffer
    let sourceBuffer: Buffer;
    try {
      const response = await axios.get(selfieUrl, { responseType: 'arraybuffer' });
      sourceBuffer = Buffer.from(response.data);
    } catch (downloadErr) {
      console.error(`❌ [Biometría] Error al descargar foto de referencia desde ${selfieUrl}:`, downloadErr);
      return res.status(400).json({ error: 'No se pudo descargar la foto de referencia registrada en el perfil para realizar la verificación.' });
    }

    // Ejecutar comparación facial en AWS Rekognition o Mock
    const similarity = await compareFaces(sourceBuffer, targetBuffer);
    console.log(`ℹ️ [Biometría] Similitud obtenida: ${similarity.toFixed(2)}% para usuario ID: ${userId}`);

    if (similarity >= 92) {
      return res.json({ success: true, similarity, message: 'Verificación biométrica exitosa.' });
    } else {
      return res.status(400).json({ 
        error: `La selfie no coincide con la foto registrada en el perfil (Similitud: ${similarity.toFixed(1)}%). Por favor, tómate la foto con mejor iluminación o de frente.`, 
        similarity 
      });
    }
  } catch (err: any) {
    console.error('❌ [Biometría] Error en el flujo de verificación biométrica:', err);
    return res.status(500).json({ error: 'Error interno en el servidor al realizar la verificación biométrica.' });
  }
});

// ─── CAMBIAR CONTRASEÑA ──────────────────────────────────────────────────
router.post('/change-password', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    if (role === 'driver') {
      const driver = await prisma.driver.findUnique({ where: { id: userId } });
      if (!driver) return res.status(404).json({ error: 'Conductor no encontrado' });

      const valid = await bcrypt.compare(currentPassword, driver.passwordHash);
      if (!valid) return res.status(400).json({ error: 'La contraseña actual es incorrecta' });

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await prisma.driver.update({
        where: { id: userId },
        data: { passwordHash },
      });
    } else {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) return res.status(400).json({ error: 'La contraseña actual es incorrecta' });

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      });
    }

    return res.json({ message: 'Contraseña actualizada con éxito' });
  } catch (err) {
    console.error('Error al cambiar contraseña:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── ACTUALIZAR TOKEN FCM ─────────────────────────────────────────────────
router.post('/fcm-token', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    const { fcmToken } = req.body;

    if (fcmToken === undefined) {
      return res.status(400).json({ error: 'fcmToken es requerido' });
    }

    if (role === 'driver') {
      await prisma.driver.update({
        where: { id: userId },
        data: { fcmToken },
      });
      console.log(`[FCM] Token actualizado para conductor ${userId}: ${fcmToken ? fcmToken.substring(0, 10) : 'null'}...`);
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: { fcmToken },
      });
      console.log(`[FCM] Token actualizado para pasajero ${userId}: ${fcmToken ? fcmToken.substring(0, 10) : 'null'}...`);
    }

    return res.json({ message: 'Token FCM actualizado con éxito' });
  } catch (err) {
    console.error('Error al actualizar token FCM:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── ELIMINAR CUENTA PERMANENTE ──────────────────────────────────────────
router.post('/delete-account', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;

    if (role === 'driver') {
      await prisma.$transaction([
        prisma.rating.deleteMany({ where: { OR: [{ driverId: userId }, { trip: { driverId: userId } }] } }),
        prisma.trip.deleteMany({ where: { driverId: userId } }),
        prisma.refreshToken.deleteMany({ where: { driverId: userId } }),
        prisma.driver.delete({ where: { id: userId } }),
      ]);
      console.log(`❌ Conductor ${userId} eliminado permanentemente.`);
    } else {
      await prisma.$transaction([
        prisma.rating.deleteMany({ where: { OR: [{ passengerId: userId }, { trip: { passengerId: userId } }] } }),
        prisma.trip.deleteMany({ where: { passengerId: userId } }),
        prisma.refreshToken.deleteMany({ where: { userId: userId } }),
        prisma.user.delete({ where: { id: userId } }),
      ]);
      console.log(`❌ Pasajero ${userId} eliminado permanentemente.`);
    }

    return res.json({ message: 'Tu cuenta ha sido eliminada permanentemente.' });
  } catch (err) {
    console.error('Error al eliminar cuenta:', err);
    return res.status(500).json({ error: 'Error interno al eliminar la cuenta' });
  }
});

// ─── VERIFICAR EMAIL ──────────────────────────────────────────────────────
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { email, role, code } = req.body;
    if (!email || !role || !code) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    if (role === 'driver') {
      const driver = await prisma.driver.findUnique({ where: { email } });
      if (!driver) return res.status(404).json({ error: 'Conductor no encontrado' });

      if (driver.emailCode !== code) {
        return res.status(400).json({ error: 'Código de verificación incorrecto' });
      }

      const updated = await prisma.driver.update({
        where: { email },
        data: { emailVerified: true, emailCode: null }
      });

      const tokens = generateTokens({ id: updated.id, role: 'driver', email: updated.email });
      return res.json({
        message: 'Verificación exitosa',
        user: { id: updated.id, name: updated.name, email: updated.email, role: 'driver', status: updated.status, membershipPaid: updated.membershipPaid },
        ...tokens
      });
    } else {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

      if (user.emailCode !== code) {
        return res.status(400).json({ error: 'Código de verificación incorrecto' });
      }

      const updated = await prisma.user.update({
        where: { email },
        data: { emailVerified: true, emailCode: null }
      });

      const tokens = generateTokens({ id: updated.id, role: updated.role as 'passenger' | 'admin', email: updated.email });
      return res.json({
        message: 'Verificación exitosa',
        user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role, isVerified: updated.isVerified },
        ...tokens
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── REENVIAR CÓDIGO EMAIL ────────────────────────────────────────────────
router.post('/resend-code', async (req: Request, res: Response) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    if (role === 'driver') {
      const driver = await prisma.driver.findUnique({ where: { email } });
      if (!driver) return res.status(404).json({ error: 'Conductor no encontrado' });

      await prisma.driver.update({
        where: { email },
        data: { emailCode: code }
      });
    } else {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

      await prisma.user.update({
        where: { email },
        data: { emailCode: code }
      });
    }

    await sendVerificationEmail(email, code);
    return res.json({ message: 'Código reenviado con éxito' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── GOOGLE CHECK ──────────────────────────────────────────────────────────
router.post('/google/check', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Token de Google es requerido' });
    }

    const payload = await verifyGoogleToken(credential);
    const email = payload.email;
    if (!email) {
      return res.status(400).json({ error: 'No se pudo obtener el email del token de Google' });
    }

    const driver = await prisma.driver.findUnique({ where: { email } });
    if (driver) {
      const tokens = generateTokens({ id: driver.id, role: 'driver', email: driver.email });
      return res.json({
        exists: true,
        role: 'driver',
        user: { id: driver.id, name: driver.name, email: driver.email, role: 'driver', status: driver.status, membershipPaid: driver.membershipPaid },
        ...tokens
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const tokens = generateTokens({ id: user.id, role: user.role as 'passenger' | 'admin', email: user.email });
      return res.json({
        exists: true,
        role: user.role,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified },
        ...tokens
      });
    }

    return res.json({
      exists: false,
      email,
      name: payload.name || '',
    });
  } catch (err) {
    console.error('Error en /google/check:', err);
    return res.status(401).json({ error: 'Token de Google inválido o expirado' });
  }
});

// ─── GOOGLE REGISTER ───────────────────────────────────────────────────────
router.post('/google/register', async (req: Request, res: Response) => {
  try {
    const {
      credential, phone, name, rut, birthDate, address, role,
      idFrontUrl, idBackUrl, selfieUrl, backgroundDocUrl,
      // Conductor specific
      licenseNumber, licenseUrl, licenseBackUrl,
      vehicleBrand, vehicleModel, vehicleYear, vehiclePlate, tagNumber, vehiclePhotoUrl, vehicleColor,
      membershipPlan
    } = req.body;

    if (!credential || !phone || !name || !role) {
      return res.status(400).json({ error: 'Faltan campos obligatorios de Google' });
    }

    const payload = await verifyGoogleToken(credential);
    const email = payload.email;
    if (!email) {
      return res.status(400).json({ error: 'No se pudo obtener el email del token de Google' });
    }

    const dummyPasswordHash = await bcrypt.hash('GOOGLE_OAUTH_DUMMY_PASSWORD_' + Math.random(), 12);

    if (role === 'driver') {
      const required = [rut, birthDate, address, licenseNumber, vehicleBrand, vehicleModel, vehicleYear, vehiclePlate, idFrontUrl, idBackUrl, selfieUrl, backgroundDocUrl, licenseUrl, licenseBackUrl, vehiclePhotoUrl, membershipPlan];
      if (required.some(v => !v)) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para el conductor' });
      }

      const existing = await prisma.driver.findFirst({
        where: { OR: [{ email }, { phone }, { rut }, { vehiclePlate }] }
      });
      if (existing) {
        return res.status(409).json({ error: 'Email, teléfono, RUT o patente ya registrados' });
      }

      const driver = await prisma.driver.create({
        data: {
          email, phone, name, passwordHash: dummyPasswordHash,
          rut, birthDate: new Date(birthDate), address,
          idFrontUrl, idBackUrl, selfieUrl, backgroundDocUrl,
          licenseNumber, licenseUrl, licenseBackUrl,
          vehicleBrand, vehicleModel, vehicleYear: Number(vehicleYear),
          vehiclePlate, vehiclePhotoUrl, tagNumber: tagNumber || "",
          vehicleColor: vehicleColor || "",
          membershipPlan,
          membershipGoal: membershipPlan === 'PROGRESSIVE' ? 120000 : 100000,
          status: 'pending',
          emailVerified: true, // Google ya está verificado
        }
      });

      const tokens = generateTokens({ id: driver.id, role: 'driver', email: driver.email });
      return res.status(201).json({
        message: 'Registro exitoso',
        driver: { id: driver.id, name: driver.name, email: driver.email, role: 'driver', status: driver.status },
        ...tokens
      });
    } else {
      const required = [rut, birthDate, address, idFrontUrl, idBackUrl, selfieUrl, backgroundDocUrl];
      if (required.some(v => !v)) {
        return res.status(400).json({ error: 'Faltan campos de verificación obligatorios' });
      }

      const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { phone }, { rut }] }
      });
      if (existing) {
        return res.status(409).json({ error: 'Email, teléfono o RUT ya registrados' });
      }

      const user = await prisma.user.create({
        data: {
          email, phone, name, passwordHash: dummyPasswordHash,
          rut, birthDate: birthDate ? new Date(birthDate) : undefined, address,
          idFrontUrl, idBackUrl, selfieUrl,
          role: 'passenger',
          emailVerified: true, // Google ya está verificado
        }
      });

      const tokens = generateTokens({ id: user.id, role: 'passenger', email: user.email });
      return res.status(201).json({
        message: 'Registro exitoso',
        user: { id: user.id, name: user.name, email: user.email, role: 'passenger', isVerified: user.isVerified },
        ...tokens
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al registrar con Google o token inválido' });
  }
});

// ─── PUBLIC NOMINATIM/GOOGLE AUTOCOMPLETE GEOPROXY ────────────────────────
router.get('/autocomplete', async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q || q.trim().length < 3) {
      return res.json({ predictions: [] });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      // Usar Google Places Autocomplete API
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&key=${apiKey}&components=country:cl&language=es`;
      const response = await fetch(url);
      const data: any = await response.json();
      
      if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Google Autocomplete ERROR:', data.status, data.error_message || '');
      }

      const predictions = (data.predictions || []).map((p: any) => ({
        id: p.place_id,
        description: p.description,
        isGoogle: true
      }));
      return res.json({ predictions });
    } else {
      // Fallback a Nominatim (OpenStreetMap)
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=cl&limit=6&addressdetails=1`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Fim-App-API/1.0 (contact@fim.cl)' }
      });
      const data: any = await response.json();
      const predictions = (data || []).map((item: any) => {
        const addr = item.address;
        const street = addr?.road || addr?.pedestrian || addr?.footway || item.display_name.split(',')[0];
        const number = addr?.house_number ? ` ${addr.house_number}` : '';
        const comuna = addr?.suburb || addr?.neighbourhood || addr?.city_district || addr?.town || addr?.city || '';
        const description = `${street}${number}, ${comuna}`.trim().replace(/^,\s*|,\s*$/g, '') || item.display_name;
        return {
          id: `osm:${item.place_id}`,
          description,
          lat: Number(item.lat),
          lng: Number(item.lon),
          isGoogle: false
        };
      });
      return res.json({ predictions });
    }
  } catch (err) {
    console.error('Error in public /autocomplete proxy:', err);
    return res.status(500).json({ error: 'Error al buscar direcciones' });
  }
});

// ─── SOLICITAR RECUPERACIÓN DE CONTRASEÑA ──────────────────────────────────
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({ error: 'Email y rol son obligatorios' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    if (role === 'driver') {
      const driver = await prisma.driver.findFirst({
        where: { email: { equals: normalizedEmail, mode: 'insensitive' } }
      });
      if (driver) {
        await prisma.driver.update({
          where: { id: driver.id },
          data: {
            resetCode: code,
            resetCodeExpires: expiresAt
          }
        });
        await sendPasswordResetEmail(driver.email, code);
      }
    } else {
      const user = await prisma.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: 'insensitive' } }
      });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            resetCode: code,
            resetCodeExpires: expiresAt
          }
        });
        await sendPasswordResetEmail(user.email, code);
      }
    }

    // Respuesta genérica para evitar enumeración de usuarios (Cumplimiento ISO 27001)
    return res.json({
      message: 'Si el correo electrónico está registrado, recibirás un código de recuperación.'
    });
  } catch (err) {
    console.error('Error en /forgot-password:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── RESTABLECER CONTRASEÑA CON CÓDIGO ──────────────────────────────────────
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, role, code, newPassword } = req.body;
    if (!email || !role || !code || !newPassword) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (role === 'driver') {
      const driver = await prisma.driver.findFirst({
        where: { email: { equals: normalizedEmail, mode: 'insensitive' } }
      });
      if (!driver || !driver.resetCode || driver.resetCode !== code || !driver.resetCodeExpires || driver.resetCodeExpires < new Date()) {
        return res.status(400).json({ error: 'El código de recuperación es inválido o ha expirado' });
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await prisma.driver.update({
        where: { id: driver.id },
        data: {
          passwordHash,
          resetCode: null,
          resetCodeExpires: null
        }
      });
    } else {
      const user = await prisma.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: 'insensitive' } }
      });
      if (!user || !user.resetCode || user.resetCode !== code || !user.resetCodeExpires || user.resetCodeExpires < new Date()) {
        return res.status(400).json({ error: 'El código de recuperación es inválido o ha expirado' });
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetCode: null,
          resetCodeExpires: null
        }
      });
    }

    return res.json({ message: 'Contraseña restablecida con éxito' });
  } catch (err) {
    console.error('Error en /reset-password:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
