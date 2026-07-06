import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { updateDriverLocation } from '../socket/handlers';
import { checkCoordinateInAllowedRegion } from '../utils/location';
import { sendAdminPaymentNotification } from '../utils/mailer';

const router = Router();

// ─── ESTADO DEL CONDUCTOR (para el dashboard) ─────────────────────────────
router.get('/me', requireAuth, requireRole('driver'), async (req: Request, res: Response) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, name: true, email: true, phone: true,
        status: true, membershipPaid: true, membershipDate: true,
        membershipPlan: true, membershipGoal: true, membershipProgress: true,
        membershipExpiresAt: true,
        dailyCashTripsCount: true,
        comfortDebt: true, comfortLastPaidAt: true, comfortReceiptUrl: true,
        membershipWeekStart: true,
        isOnline: true, lastLat: true, lastLng: true,
        vehicleBrand: true, vehicleModel: true, vehicleYear: true,
        vehiclePlate: true, vehiclePhotoUrl: true, tagNumber: true,
        totalRating: true, totalTrips: true,
        adminNotes: true, mpAccessToken: true, walletBalance: true,
        isTrial: true, nextDiscount: true,
        giftDaysPending: true,
        createdAt: true,
        selfieUrl: true, lastBiometricAuth: true,
      },
    });

    if (!driver) return res.status(404).json({ error: 'Conductor no encontrado' });

    let isPromoActive = false;
    let freePassDays = 0;
    const configRows = await prisma.systemConfig.findMany({
      where: { key: { in: ['free_pass_enabled', 'free_pass_start_date', 'free_pass_end_date', 'free_pass_days'] } }
    });
    const config = configRows.reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {});

    if (config.free_pass_enabled === 'true') {
      const startDate = new Date(config.free_pass_start_date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(config.free_pass_end_date);
      endDate.setHours(23, 59, 59, 999);
      freePassDays = parseInt((config.free_pass_days || '0').toString().replace(/\D/g, ''), 10);

      const driverCreatedAt = new Date(driver.createdAt);
      if (driverCreatedAt >= startDate && driverCreatedAt <= endDate) {
        const driverAgeDays = (new Date().getTime() - driverCreatedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (driverAgeDays <= freePassDays) {
          isPromoActive = true;
        }
      }
    }

    const isTrialActive = !!(driver.isTrial && driver.membershipExpiresAt && new Date(driver.membershipExpiresAt) > new Date());
    const effectivePromoActive = isPromoActive || isTrialActive;

    return res.json({ driver: { ...driver, isPromoActive: effectivePromoActive, isTrialActive, freePassDays } });
  } catch (err) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

// ─── ACTUALIZAR POSICIÓN GPS ──────────────────────────────────────────────
router.post('/location', requireAuth, requireRole('driver'), async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.body;

    await updateDriverLocation(req.user!.id, lat, lng);

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Error al actualizar posición' });
  }
});

// ─── CAMBIAR ESTADO EN LÍNEA ──────────────────────────────────────────────
router.post('/toggle-online', requireAuth, requireRole('driver'), async (req: Request, res: Response) => {
  try {
    const { isOnline } = req.body;

    const driver = await prisma.driver.findUnique({ where: { id: req.user!.id } });
    if (!driver) return res.status(404).json({ error: 'No encontrado' });

    if (isOnline) {
      // 1. Verificación Biométrica estricta (Cada 8 horas), omitida para cuentas sin foto (devs)
      const isPlaceholder = !driver.selfieUrl || driver.selfieUrl.trim() === '' || driver.selfieUrl.includes('placehold');
      if (!isPlaceholder) {
        const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);
        if (!driver.lastBiometricAuth || driver.lastBiometricAuth < eightHoursAgo) {
          return res.status(403).json({ error: 'Biometric Required' });
        }
      }

      // 2. Otras validaciones antes de conectar
      if (driver.status !== 'active' && driver.status !== 'approved') {
        return res.status(403).json({ error: 'Debes estar aprobado por un administrador' });
      }

      // ── Validaciones por plan ─────────────────────────────────────────────
      // Validar área de cobertura geográfica (últimas coordenadas del conductor)
      if (driver.lastLat !== null && driver.lastLng !== null) {
        const locationCheck = await checkCoordinateInAllowedRegion(driver.lastLat, driver.lastLng);
        if (!locationCheck.allowed) {
          return res.status(403).json({
            error: `No puedes ponerte en línea fuera de la zona de cobertura. Actualmente operamos en: ${locationCheck.activeZonesText}.`
          });
        }
      }
      const now = new Date();
      const plan = driver.membershipPlan;
      
      // Lógica de promoción de lanzamiento (Free Pass Dinámico)
      let isPromoActive = false;
      const configRows = await prisma.systemConfig.findMany({
        where: { key: { in: ['free_pass_enabled', 'free_pass_start_date', 'free_pass_end_date', 'free_pass_days'] } }
      });
      const config = configRows.reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {});

      if (config.free_pass_enabled === 'true') {
        const startDate = new Date(config.free_pass_start_date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(config.free_pass_end_date);
        endDate.setHours(23, 59, 59, 999);
        const freeDays = parseInt((config.free_pass_days || '0').toString().replace(/\D/g, ''), 10);

        const driverCreatedAt = new Date(driver.createdAt);
        
        if (driverCreatedAt >= startDate && driverCreatedAt <= endDate) {
          const driverAgeDays = (now.getTime() - driverCreatedAt.getTime()) / (1000 * 60 * 60 * 24);
          if (driverAgeDays <= freeDays) {
            isPromoActive = true;
          }
        }
      }

      const isTrialActive = !!(driver.isTrial && driver.membershipExpiresAt && driver.membershipExpiresAt > now);
      const isEligibleToGoOnline = isPromoActive || isTrialActive;

      if (plan === 'BLACK') {
        // Requiere membresía pagada y vigente, a menos que esté en promoción o prueba
        if (!isEligibleToGoOnline) {
          if (!driver.membershipPaid) {
            return res.status(403).json({ error: 'Debes pagar tu membresía BLACK ($150.000) para activarte.' });
          }
          if (driver.membershipExpiresAt && driver.membershipExpiresAt < now) {
            await prisma.driver.update({ where: { id: driver.id }, data: { membershipPaid: false } });
            return res.status(403).json({ error: 'Tu membresía BLACK venció. Renuévala para continuar.' });
          }
        }
      }

      if (plan === 'FLEX') {
        // Solo puede operar Viernes(5), Sábado(6), Domingo(0)
        const dayOfWeek = now.getDay(); // 0=Dom, 5=Vie, 6=Sáb
        if (dayOfWeek !== 0 && dayOfWeek !== 5 && dayOfWeek !== 6) {
          return res.status(403).json({ 
            error: 'La membresía FLEX solo está activa Viernes, Sábado y Domingo. Hoy no puedes operar.'
          });
        }
        if (!isEligibleToGoOnline) {
          if (!driver.membershipPaid) {
            return res.status(403).json({ error: 'Debes pagar tu membresía FLEX ($60.000) para activarte este fin de semana.' });
          }
          // Verificar si la membresía FLEX sigue vigente (fin de semana actual)
          if (driver.membershipExpiresAt && driver.membershipExpiresAt < now) {
            await prisma.driver.update({ where: { id: driver.id }, data: { membershipPaid: false } });
            return res.status(403).json({ error: 'Tu membresía FLEX venció. Debes pagar el nuevo fin de semana ($60.000).' });
          }
        }
      }

      if (plan === 'COMFORT') {
        // Debe haber pagado la cuota diaria de $20.000, a menos que esté en promoción o prueba
        if (!isEligibleToGoOnline) {
          if (driver.comfortLastPaidAt) {
            const lastPaid = new Date(driver.comfortLastPaidAt);
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            if (lastPaid < todayStart) {
              return res.status(403).json({ 
                error: `Debes pagar tu cuota diaria COMFORT de $20.000 para trabajar hoy. Deuda acumulada: $${driver.comfortDebt.toLocaleString('es-CL')}`
              });
            }
          } else {
            return res.status(403).json({ 
              error: 'Debes subir el comprobante de tu primer pago diario COMFORT de $20.000 para activarte.'
            });
          }
        }
      }
    }



    const updated = await prisma.driver.update({
      where: { id: req.user!.id },
      data: { isOnline },
    });

    return res.json({ isOnline: updated.isOnline });
  } catch (err) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

// ─── VIAJE ACTIVO DEL CONDUCTOR ───────────────────────────────────────────
router.get('/active-trip', requireAuth, requireRole('driver'), async (req: Request, res: Response) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: {
        driverId: req.user!.id,
        status: { in: ['driver_assigned', 'driver_arrived', 'in_progress'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        passenger: { select: { id: true, name: true, phone: true } },
      },
    });

    return res.json({ trip });
  } catch (err) {
    return res.status(500).json({ error: 'Error interno' });
  }
});




// ─── PAGO DIARIO COMFORT ─────────────────────────────────────────────────
router.post('/pay-comfort-daily', requireAuth, requireRole('driver'), async (req: Request, res: Response) => {
  try {
    const { receiptUrl } = req.body;
    if (!receiptUrl) return res.status(400).json({ error: 'El comprobante de pago es obligatorio' });

    const driver = await prisma.driver.findUnique({ where: { id: req.user!.id } });
    if (!driver) return res.status(404).json({ error: 'Conductor no encontrado' });

    const now = new Date();
    const dailyAmount = 20000;

    // Calcular nuevo saldo de deuda
    const newDebt = Math.max(0, (driver.comfortDebt || 0) - dailyAmount);

    const updateData: any = {
      comfortLastPaidAt: now,
      comfortReceiptUrl: receiptUrl,
      comfortDebt: newDebt,
      // Si la cuenta estaba bloqueada, la reactivamos
      isOnline: false, // Se tendrá que volver a activar manualmente
    };

    if (driver.membershipPlan !== 'COMFORT') {
      updateData.membershipPlan = 'COMFORT';
      updateData.isTrial = false;
      updateData.membershipPaid = false;
    }

    await prisma.driver.update({
      where: { id: req.user!.id },
      data: updateData,
    });

    console.log(`✅ COMFORT: Conductor ${driver.id} pagó cuota diaria $20.000. Deuda restante: $${newDebt.toLocaleString('es-CL')}`);
    
    // Notificar al admin
    sendAdminPaymentNotification(driver.name, driver.id, 'COMFORT (Cuota Diaria)', '$20.000').catch(e => console.error(e));

    return res.json({ ok: true, message: 'Pago diario registrado. Ahora puedes activarte.', comfortDebt: newDebt });
  } catch (err) {
    return res.status(500).json({ error: 'Error al registrar pago diario' });
  }
});

// ─── ACUMULAR DEUDA COMFORT (interno) ────────────────────────────────────
// Este endpoint puede llamarse desde un cron job para acumular la deuda a las 7am
router.post('/comfort-accrue-debt', async (req: Request, res: Response) => {
  try {
    const secretKey = req.headers['x-cron-secret'];
    if (secretKey !== process.env.CRON_SECRET && secretKey !== 'fim-internal-cron') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    // Encontrar todos los conductores COMFORT activos que no estén en su periodo de prueba
    const now = new Date();
    const comfortDrivers = await prisma.driver.findMany({
      where: { 
        membershipPlan: 'COMFORT', 
        status: 'active',
        OR: [
          { isTrial: false },
          { membershipExpiresAt: { lt: now } }
        ]
      }
    });

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let updated = 0;
    for (const driver of comfortDrivers) {
      // Si no pagó hoy, acumular deuda
      const lastPaid = driver.comfortLastPaidAt ? new Date(driver.comfortLastPaidAt) : null;
      const paidToday = lastPaid && lastPaid >= todayStart;
      if (!paidToday) {
        await prisma.driver.update({
          where: { id: driver.id },
          data: { 
            comfortDebt: { increment: 20000 },
            isOnline: false // Forzar desconexión
          }
        });
        updated++;
      }
    }

    return res.json({ ok: true, message: `Deuda acumulada para ${updated} conductores COMFORT.` });
  } catch (err) {
    return res.status(500).json({ error: 'Error al acumular deuda' });
  }
});

// ─── LIMPIAR DÍAS DE REGALO PENDIENTES ─────────────────────────────────────
router.post('/me/clear-gift-pending', requireAuth, requireRole('driver'), async (req: Request, res: Response) => {
  try {
    await prisma.driver.update({
      where: { id: req.user!.id },
      data: { giftDaysPending: 0 }
    });
    return res.json({ ok: true });
  } catch (err) {
    console.error('Error clearing gift pending days:', err);
    return res.status(500).json({ error: 'Error al limpiar días de regalo pendientes' });
  }
});

export default router;
