import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren ser admin
router.use(requireAuth, requireRole('admin'));

// ─── ESTADÍSTICAS GENERALES ───────────────────────────────────────────────
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [
      totalDrivers, pendingDrivers, activeDrivers,
      totalPassengers, pendingPassengers, totalTrips, completedTrips,
      membershipsPaid,
    ] = await Promise.all([
      prisma.driver.count(),
      prisma.driver.count({ where: { status: 'pending' } }),
      prisma.driver.count({ where: { status: 'active', isOnline: true } }),
      prisma.user.count({ where: { role: 'passenger' } }),
      prisma.user.count({ where: { role: 'passenger', isVerified: false } }),
      prisma.trip.count(),
      prisma.trip.count({ where: { status: 'completed' } }),
      prisma.driver.count({ where: { membershipPaid: true } }),
    ]);

    const membershipRevenue = membershipsPaid * 100000;

    const recentTrips = await prisma.trip.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        passenger: { select: { name: true } },
        driver: { select: { name: true } },
      },
    });

    return res.json({
      stats: {
        totalDrivers, pendingDrivers, activeDrivers,
        totalPassengers, pendingPassengers, totalTrips, completedTrips,
        membershipsPaid, membershipRevenue,
      },
      recentTrips,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// ─── CONDUCTORES PENDIENTES DE VALIDACIÓN ────────────────────────────────
router.get('/drivers/pending', async (_req: Request, res: Response) => {
  try {
    const drivers = await prisma.driver.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, name: true, email: true, phone: true,
        rut: true, birthDate: true, address: true,
        idFrontUrl: true, idBackUrl: true, selfieUrl: true, backgroundDocUrl: true,
        licenseNumber: true, licenseUrl: true, licenseBackUrl: true,
        vehicleBrand: true, vehicleModel: true, vehicleYear: true,
        vehiclePlate: true, vehiclePhotoUrl: true, tagNumber: true,
        vehicleColor: true,
        membershipPaid: true, membershipPlan: true, comfortReceiptUrl: true,
        createdAt: true,
      },
    });
    return res.json({ drivers });
  } catch (err) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

// ─── TODOS LOS CONDUCTORES ────────────────────────────────────────────────
router.get('/drivers', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const drivers = await prisma.driver.findMany({
      where: status ? { status: String(status) } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, phone: true,
        rut: true, status: true, membershipPaid: true,
        membershipPlan: true, membershipExpiresAt: true,
        comfortDebt: true, comfortReceiptUrl: true, comfortLastPaidAt: true,
        vehicleBrand: true, vehicleModel: true, vehiclePlate: true, vehicleColor: true,
        totalRating: true, totalTrips: true, isOnline: true,
        createdAt: true,
      },
    });
    return res.json({ drivers });
  } catch (err) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

// ─── DETALLE DE UN CONDUCTOR ──────────────────────────────────────────────
router.get('/drivers/:id', async (req: Request, res: Response) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: req.params.id },
      include: {
        trips: {
          orderBy: { createdAt: 'desc' },
          include: { passenger: { select: { name: true } } }
        },
        ratings: {
          orderBy: { createdAt: 'desc' },
          include: { passenger: { select: { name: true } } }
        }
      }
    });
    if (!driver) return res.status(404).json({ error: 'No encontrado' });
    return res.json({ driver });
  } catch (err) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

// ─── APROBAR CONDUCTOR ────────────────────────────────────────────────────
router.post('/drivers/:id/approve', async (req: Request, res: Response) => {
  try {
    const driver = await prisma.driver.findUnique({ where: { id: req.params.id } });
    if (!driver) return res.status(404).json({ error: 'Conductor no encontrado' });

    const trialExpiration = new Date();
    trialExpiration.setDate(trialExpiration.getDate() + 14);

    const updated = await prisma.driver.update({
      where: { id: req.params.id },
      data: {
        status: 'active', // Activar inmediatamente
        adminNotes: null,
        isTrial: true, // Habilitar Free Pass
        membershipExpiresAt: trialExpiration,
        membershipPaid: false,
      },
    });
    return res.json({ message: 'Conductor aprobado y activado con 14 días de Free Pass', driver: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

// ─── RECHAZAR CONDUCTOR ───────────────────────────────────────────────────
router.post('/drivers/:id/reject', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const driver = await prisma.driver.update({
      where: { id: req.params.id },
      data: { status: 'rejected', adminNotes: reason },
    });
    return res.json({ message: 'Conductor rechazado', driver });
  } catch (err) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

// ─── MARCAR MEMBRESÍA COMO PAGADA ─────────────────────────────────────────
router.post('/drivers/:id/membership-paid', async (req: Request, res: Response) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: req.params.id }
    });
    if (!driver) return res.status(404).json({ error: 'Conductor no encontrado' });

    const now = new Date();
    let membershipExpiresAt: Date | null = null;
    let comfortLastPaidAt: Date | null = driver.comfortLastPaidAt;
    let comfortDebt = driver.comfortDebt;
    let basePrice = 0;
    let membershipGoal = 0;

    const baseDate = (driver.isTrial && driver.membershipExpiresAt && driver.membershipExpiresAt > now)
      ? new Date(driver.membershipExpiresAt)
      : now;

    if (driver.membershipPlan === 'BLACK') {
      basePrice = 150000;
      membershipGoal = 150;
      const expires = new Date(baseDate);
      expires.setDate(expires.getDate() + 30);
      membershipExpiresAt = expires;
    } else if (driver.membershipPlan === 'FLEX') {
      basePrice = 60000;
      membershipGoal = 40;
      const expires = new Date(baseDate);
      const daysUntilMonday = (8 - expires.getDay()) % 7 || 7;
      expires.setDate(expires.getDate() + daysUntilMonday);
      expires.setHours(7, 0, 0, 0); // Lunes a las 7 AM
      membershipExpiresAt = expires;
    } else if (driver.membershipPlan === 'COMFORT') {
      basePrice = 20000; // Cuota diaria
      comfortLastPaidAt = now;
      comfortDebt = 0; // Se pone al día al confirmar pago inicial
    }

    const discountPercent = driver.nextDiscount || 0;
    const finalPricePaid = basePrice * (1 - discountPercent / 100);

    const updated = await prisma.driver.update({
      where: { id: req.params.id },
      data: {
        membershipPaid: true,
        membershipDate: now,
        membershipExpiresAt,
        comfortLastPaidAt,
        comfortDebt,
        status: 'active',
        isTrial: false, // Quitar estado de prueba al procesar pago oficial
        membershipProgress: 0, // Resetear progreso de viajes
        membershipGoal,
        nextDiscount: 0, // Consumir descuento acumulado
      },
    });
    return res.json({ 
      message: `Membresía confirmada. Conductor activado. Pago final registrado: $${finalPricePaid.toLocaleString('es-CL')} (Descuento aplicado: ${discountPercent}%)`, 
      driver: updated 
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

// ─── SUSPENDER CONDUCTOR ──────────────────────────────────────────────────
router.post('/drivers/:id/suspend', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const driver = await prisma.driver.update({
      where: { id: req.params.id },
      data: { status: 'suspended', isOnline: false, adminNotes: reason },
    });
    return res.json({ message: 'Conductor suspendido', driver });
  } catch (err) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

// ─── ELIMINAR CONDUCTOR PERMANENTE ────────────────────────────────────────
router.delete('/drivers/:id', async (req: Request, res: Response) => {
  try {
    const driverId = req.params.id;
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) return res.status(404).json({ error: 'Conductor no encontrado' });

    await prisma.$transaction([
      prisma.rating.deleteMany({ where: { OR: [{ driverId }, { trip: { driverId } }] } }),
      prisma.trip.deleteMany({ where: { driverId } }),
      prisma.refreshToken.deleteMany({ where: { driverId } }),
      prisma.driver.delete({ where: { id: driverId } }),
    ]);

    return res.json({ message: 'Conductor eliminado permanentemente' });
  } catch (err) {
    console.error('Error al eliminar conductor:', err);
    return res.status(500).json({ error: 'Error al eliminar conductor' });
  }
});

// ─── PASAJEROS ────────────────────────────────────────────────────────────
router.get('/passengers', async (_req: Request, res: Response) => {
  try {
    const passengers = await prisma.user.findMany({
      where: { role: 'passenger' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, phone: true,
        rut: true, isVerified: true, createdAt: true,
        idFrontUrl: true, idBackUrl: true, selfieUrl: true, backgroundDocUrl: true,
      },
    });
    return res.json({ passengers });
  } catch (err) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

// ─── DETALLE DE PASAJERO ──────────────────────────────────────────────────
router.get('/passengers/:id', async (req: Request, res: Response) => {
  try {
    const passenger = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        trips: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            originAddress: true,
            destAddress: true,
            otpCode: true,
            dropoffOtpCode: true,
            estimatedPrice: true,
            finalPrice: true,
            paymentMethod: true,
            createdAt: true,
            startedAt: true,
            completedAt: true,
            cancelledAt: true,
            driver: { select: { name: true, vehiclePlate: true } },
          }
        }
      }
    });
    if (!passenger || passenger.role !== 'passenger') {
      return res.status(404).json({ error: 'Pasajero no encontrado' });
    }
    return res.json({ passenger });
  } catch (err) {
    console.error('Error en GET /admin/passengers/:id:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

// ─── APROBAR PASAJERO ─────────────────────────────────────────────────────
router.post('/passengers/:id/approve', async (req: Request, res: Response) => {
  try {
    const passenger = await prisma.user.update({
      where: { id: req.params.id },
      data: { isVerified: true },
    });
    return res.json({ message: 'Pasajero aprobado con éxito', passenger });
  } catch (err) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

// ─── RECHAZAR PASAJERO ────────────────────────────────────────────────────
router.post('/passengers/:id/reject', async (req: Request, res: Response) => {
  try {
    const passenger = await prisma.user.update({
      where: { id: req.params.id },
      data: { isVerified: false },
    });
    return res.json({ message: 'Pasajero rechazado con éxito', passenger });
  } catch (err) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

// ─── ELIMINAR PASAJERO PERMANENTE ─────────────────────────────────────────
router.delete('/passengers/:id', async (req: Request, res: Response) => {
  try {
    const passengerId = req.params.id;
    const passenger = await prisma.user.findUnique({ where: { id: passengerId } });
    if (!passenger || passenger.role !== 'passenger') {
      return res.status(404).json({ error: 'Pasajero no encontrado' });
    }

    await prisma.$transaction([
      prisma.rating.deleteMany({ where: { OR: [{ passengerId }, { trip: { passengerId } }] } }),
      prisma.trip.deleteMany({ where: { passengerId } }),
      prisma.refreshToken.deleteMany({ where: { userId: passengerId } }),
      prisma.user.delete({ where: { id: passengerId } }),
    ]);

    return res.json({ message: 'Pasajero eliminado permanentemente' });
  } catch (err) {
    console.error('Error al eliminar pasajero:', err);
    return res.status(500).json({ error: 'Error al eliminar pasajero' });
  }
});

// ─── REPORTE DE INGRESOS (DIARIO) ─────────────────────────────────────────
router.get('/revenue-report', async (req: Request, res: Response) => {
  try {
    const { date } = req.query; // YYYY-MM-DD
    const targetDate = date ? new Date(String(date)) : new Date();
    
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const trips = await prisma.trip.findMany({
      where: {
        status: 'completed',
        completedAt: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        driver: { select: { name: true } },
      },
    });

    // Agrupar por conductor y método de pago
    const stats: Record<string, any> = {};

    trips.forEach((t: any) => {
      const key = `${t.driverId}_${t.paymentMethod}`;
      const amount = t.finalPrice || t.estimatedPrice;
      
      if (!stats[key]) {
        stats[key] = {
          driverId: t.driverId,
          driverName: t.driver?.name || 'Desconocido',
          paymentMethod: t.paymentMethod,
          totalAmount: 0,
          tripCount: 0,
        };
      }
      stats[key].totalAmount += amount;
      stats[key].tripCount += 1;
    });

    return res.json({ report: Object.values(stats) });
  } catch (err) {
    return res.status(500).json({ error: 'Error al generar reporte' });
  }
});

// ─── SYSTEM CONFIG ────────────────────────────────────────────────────────
router.get('/config', async (_req: Request, res: Response) => {
  try {
    const configs = await prisma.systemConfig.findMany();
    // Convert to object
    const configMap = configs.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    return res.json({ config: configMap });
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener configuraciones' });
  }
});

router.post('/config', async (req: Request, res: Response) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: 'Key es requerida' });

    const config = await prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    return res.json({ message: 'Configuración actualizada', config });
  } catch (err) {
    return res.status(500).json({ error: 'Error al actualizar configuración' });
  }
});

// ─── REPORTES DE SEGURIDAD ────────────────────────────────────────────────
router.get('/safety-reports', async (_req: Request, res: Response) => {
  try {
    const reports = await prisma.safetyReport.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        trip: {
          include: {
            passenger: {
              select: { id: true, name: true, phone: true }
            },
            driver: {
              select: { id: true, name: true, phone: true, vehiclePlate: true, vehicleBrand: true, vehicleModel: true, vehicleColor: true }
            }
          }
        }
      }
    });
    return res.json({ reports });
  } catch (err) {
    console.error('Error al obtener reportes de seguridad:', err);
    return res.status(500).json({ error: 'Error al obtener reportes de seguridad' });
  }
});

router.post('/safety-reports/:id/resolve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const report = await prisma.safetyReport.update({
      where: { id },
      data: {
        resolved: true,
        adminNotes: adminNotes || 'Resuelto por el administrador.',
      },
      include: {
        trip: {
          include: {
            passenger: {
              select: { id: true, name: true, phone: true }
            },
            driver: {
              select: { id: true, name: true, phone: true, vehiclePlate: true }
            }
          }
        }
      }
    });
    return res.json({ message: 'Alerta de seguridad resuelta', report });
  } catch (err) {
    console.error('Error al resolver reporte de seguridad:', err);
    return res.status(500).json({ error: 'Error al resolver reporte de seguridad' });
  }
});


router.post('/drivers/:id/adjust-membership', async (req: Request, res: Response) => {
  try {
    const { isTrial, expirationDays, membershipPlan, nextDiscount } = req.body;
    
    const driver = await prisma.driver.findUnique({ where: { id: req.params.id } });
    if (!driver) return res.status(404).json({ error: 'Conductor no encontrado' });

    const data: any = {};
    if (typeof isTrial === 'boolean') {
      data.isTrial = isTrial;
      if (isTrial) {
        data.membershipPaid = true; // Habilitar operación inmediata
        data.status = 'active';
      }
    }

    if (typeof expirationDays === 'number') {
      const expires = new Date();
      expires.setDate(expires.getDate() + expirationDays);
      data.membershipExpiresAt = expires;
    }

    if (membershipPlan) {
      data.membershipPlan = membershipPlan;
      if (membershipPlan === 'BLACK') {
        data.membershipGoal = 150;
      } else if (membershipPlan === 'FLEX') {
        data.membershipGoal = 40;
      }
    }

    if (typeof nextDiscount === 'number') {
      data.nextDiscount = nextDiscount;
    }

    const updated = await prisma.driver.update({
      where: { id: req.params.id },
      data,
    });

    return res.json({ message: 'Membresía y plazos actualizados con éxito.', driver: updated });
  } catch (err) {
    console.error('Error al ajustar membresía:', err);
    return res.status(500).json({ error: 'Error al actualizar plazos del conductor' });
  }
});

// ─── REGALO MASIVO DE DÍAS DE MEMBRESÍA (FREE PASS FIM) ───────────────────
router.post('/gift-free-days', async (req: Request, res: Response) => {
  try {
    const { days } = req.body;
    const daysNum = Math.floor(Number(days));
    if (isNaN(daysNum) || daysNum <= 0) {
      return res.status(400).json({ error: 'La cantidad de días debe ser un número entero positivo.' });
    }

    // Buscar todos los conductores con estado 'active' o 'approved'
    const drivers = await prisma.driver.findMany({
      where: {
        status: { in: ['active', 'approved'] }
      },
      select: {
        id: true,
        membershipExpiresAt: true,
        fcmToken: true,
        createdAt: true,
        isTrial: true,
        membershipPaid: true
      }
    });

    const configRows = await prisma.systemConfig.findMany({
      where: { key: { in: ['free_pass_enabled', 'free_pass_start_date', 'free_pass_end_date', 'free_pass_days'] } }
    });
    const config = configRows.reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {});

    const now = new Date();
    let updatedCount = 0;

    for (const d of drivers) {
      // Calcular periodo de registro free pass (14 días desde su creación)
      const freeDays = parseInt(config.free_pass_days || '14', 10);
      const trialExpirationDate = new Date(d.createdAt);
      trialExpirationDate.setDate(trialExpirationDate.getDate() + freeDays);

      const isInRegistrationFreePass = trialExpirationDate > now;

      // Si se encuentra en el periodo de 14 días de registro free pass, NO se le regalan días.
      if (isInRegistrationFreePass) {
        continue;
      }

      // Si no tiene los días por registro (su periodo ya venció o pasó), sí recibe los días de regalo.
      let baseExpiresDate = now;
      if (d.membershipExpiresAt && d.membershipExpiresAt > now) {
        baseExpiresDate = d.membershipExpiresAt;
      }

      const newExpiresAt = new Date(baseExpiresDate.getTime());
      newExpiresAt.setDate(newExpiresAt.getDate() + daysNum);

      await prisma.driver.update({
        where: { id: d.id },
        data: {
          membershipExpiresAt: newExpiresAt,
          giftDaysPending: { increment: daysNum },
          membershipPaid: true // Se activa o extiende su membresía pagada
        }
      });

      updatedCount++;

      // Enviar notificación push si tienen token
      if (d.fcmToken) {
        try {
          const { sendPushNotification } = require('../utils/firebase');
          await sendPushNotification(
            d.fcmToken,
            "🎁 ¡Días de Regalo en Fim!",
            `Te hemos obsequiado ${daysNum} días de membresía gratis. Tu fecha de expiración se ha extendido al ${newExpiresAt.toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })}.`,
            { type: 'gift_days_applied', days: String(daysNum) }
          );
        } catch (pushErr) {
          console.error(`Error al enviar push a conductor ${d.id}:`, pushErr);
        }
      }
    }

    return res.json({
      message: `Se han otorgado ${daysNum} días de regalo con éxito a ${updatedCount} conductores.`,
      updatedCount
    });
  } catch (err) {
    console.error('Error al otorgar días de regalo masivos:', err);
    return res.status(500).json({ error: 'Error al otorgar días de regalo masivos.' });
  }
});

export default router;


