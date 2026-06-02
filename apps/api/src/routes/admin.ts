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
        idFrontUrl: true, idBackUrl: true, selfieUrl: true,
        licenseNumber: true, licenseUrl: true, licenseBackUrl: true,
        vehicleBrand: true, vehicleModel: true, vehicleYear: true,
        vehiclePlate: true, vehiclePhotoUrl: true, tagNumber: true,
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
        vehicleBrand: true, vehicleModel: true, vehiclePlate: true,
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

    const newStatus = driver.membershipPaid ? 'active' : 'approved';

    const updated = await prisma.driver.update({
      where: { id: req.params.id },
      data: { status: newStatus, adminNotes: null },
    });
    return res.json({ message: `Conductor aprobado. Estado: ${newStatus}`, driver: updated });
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

    if (driver.membershipPlan === 'BLACK') {
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      membershipExpiresAt = expires;
    } else if (driver.membershipPlan === 'FLEX') {
      const expires = new Date();
      const daysUntilMonday = (8 - expires.getDay()) % 7 || 7;
      expires.setDate(expires.getDate() + daysUntilMonday);
      expires.setHours(7, 0, 0, 0); // Lunes a las 7 AM
      membershipExpiresAt = expires;
    } else if (driver.membershipPlan === 'COMFORT') {
      comfortLastPaidAt = now;
      comfortDebt = 0; // Se pone al día al confirmar pago inicial
    }

    const updated = await prisma.driver.update({
      where: { id: req.params.id },
      data: {
        membershipPaid: true,
        membershipDate: now,
        membershipExpiresAt,
        comfortLastPaidAt,
        comfortDebt,
        status: 'active',
      },
    });
    return res.json({ message: 'Membresía confirmada. Conductor activado.', driver: updated });
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

// ─── PASAJEROS ────────────────────────────────────────────────────────────
router.get('/passengers', async (_req: Request, res: Response) => {
  try {
    const passengers = await prisma.user.findMany({
      where: { role: 'passenger' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, phone: true,
        rut: true, isVerified: true, createdAt: true,
        idFrontUrl: true, idBackUrl: true, selfieUrl: true,
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

// ─── MARCAR/CAMBIAR CUMPLIMIENTO TRIBUTARIO DEL CONDUCTOR ────────────────
router.post('/drivers/:id/toggle-tax-compliance', async (req: Request, res: Response) => {
  try {
    const { taxCompliant } = req.body;
    const driver = await prisma.driver.update({
      where: { id: req.params.id },
      data: {
        taxCompliant,
        // Si lo marcamos como no complaciente, también apagamos su estado en línea
        isOnline: taxCompliant ? undefined : false,
      },
    });
    return res.json({ message: `Estado tributario del conductor actualizado. Cumplimiento: ${taxCompliant}`, driver });
  } catch (err) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

// ─── APROBAR DOCUMENTO TRIBUTARIO ─────────────────────────────────────────
router.post('/drivers/:id/approve-tax-document', async (req: Request, res: Response) => {
  try {
    const driver = await prisma.driver.update({
      where: { id: req.params.id },
      data: {
        taxCompliant: true,
        taxPendingReview: false,
      },
    });
    return res.json({ message: 'Documento tributario aprobado con éxito.', driver });
  } catch (err) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

// ─── RECHAZAR DOCUMENTO TRIBUTARIO ────────────────────────────────────────
router.post('/drivers/:id/reject-tax-document', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const driver = await prisma.driver.update({
      where: { id: req.params.id },
      data: {
        taxCompliant: false,
        taxPendingReview: false,
        adminNotes: reason || 'Documento tributario inválido o rechazado.',
      },
    });
    return res.json({ message: 'Documento tributario rechazado.', driver });
  } catch (err) {
    return res.status(500).json({ error: 'Error interno' });
  }
});

export default router;
