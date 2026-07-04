import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { sendPushNotification } from '../utils/firebase';

const router = Router();

// Middleware de seguridad para validar el secreto del agente
const requireAgentAuth = (req: Request, res: Response, next: NextFunction) => {
  const secret = req.headers['x-agent-secret'];
  
  // Contraseña de seguridad estricta para el agente
  if (secret !== 'fim_agent_secret_123') {
    return res.status(403).json({ error: 'Acceso denegado: Token de agente inválido.' });
  }
  
  // Opcional: Si el agente siempre corre en el mismo servidor (AWS local)
  // const ip = req.ip || req.connection.remoteAddress;
  // if (ip !== '127.0.0.1' && ip !== '::1') {
  //   return res.status(403).json({ error: 'Acceso denegado: IP no permitida.' });
  // }
  
  next();
};

router.use(requireAgentAuth);

// ─── ENDPOINTS PARA EL AGENTE DE OPENCLAW ───────────────────────────────────

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [activeDrivers, recentTrips] = await Promise.all([
      // 1. Conductores activos y en línea
      prisma.driver.count({ 
        where: { 
          status: 'active', 
          isOnline: true 
        } 
      }),
      // 2. Últimos 5 viajes
      prisma.trip.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          finalPrice: true,
          distanceKm: true,
          originAddress: true,
          destAddress: true,
          createdAt: true,
          passenger: { select: { name: true } },
          driver: { select: { name: true, vehiclePlate: true } },
        },
      })
    ]);

    return res.json({
      activeDrivers,
      recentTrips
    });
  } catch (err) {
    console.error('Error en /api/agent/stats:', err);
    return res.status(500).json({ error: 'Error interno del servidor al consultar estadísticas.' });
  }
});

// ─── NUEVOS ENDPOINTS (BÚSQUEDA, BANEO, FINANZAS, ANUNCIOS) ───────────────

router.get('/user/search', async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Falta parámetro de búsqueda (q).' });
  }

  try {
    const drivers = await prisma.driver.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { rut: { contains: q, mode: 'insensitive' } },
          { vehiclePlate: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true, email: true, status: true, rut: true, vehiclePlate: true, isDeleted: true }
    });

    const passengers = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { rut: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true, email: true, status: true, rut: true, isDeleted: true }
    });

    return res.json({
      drivers: drivers.map(d => ({ ...d, role: 'driver' })),
      passengers: passengers.map(p => ({ ...p, role: 'passenger' }))
    });
  } catch (err) {
    console.error('Error en /api/agent/user/search:', err);
    return res.status(500).json({ error: 'Error al buscar usuario.' });
  }
});

router.post('/user/ban', async (req: Request, res: Response) => {
  const { id, role } = req.body;
  if (!id || !role || (role !== 'driver' && role !== 'passenger')) {
    return res.status(400).json({ error: 'ID y rol (driver/passenger) son requeridos.' });
  }

  try {
    if (role === 'driver') {
      await prisma.driver.update({
        where: { id },
        data: { isDeleted: true, status: 'suspended', fcmToken: null }
      });
    } else {
      await prisma.user.update({
        where: { id },
        data: { isDeleted: true, status: 'suspended', fcmToken: null }
      });
    }
    return res.json({ success: true, message: `Usuario ${id} (${role}) ha sido suspendido exitosamente.` });
  } catch (err) {
    console.error('Error en /api/agent/user/ban:', err);
    return res.status(500).json({ error: 'Error al suspender usuario.' });
  }
});

router.get('/finances', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    
    // Día actual
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Semana actual (Lunes a Domingo)
    const dayOfWeek = now.getDay() || 7; // 1 = Lunes, 7 = Domingo
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - dayOfWeek + 1);

    // Mes actual
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Consultas de viajes
    const trips = await prisma.trip.findMany({
      where: {
        status: 'completed',
        completedAt: { gte: startOfMonth }
      },
      select: { completedAt: true, finalPrice: true, estimatedPrice: true }
    });

    let dayTotal = 0;
    let weekTotal = 0;
    let monthTotal = 0;
    
    let dayTrips = 0;
    let weekTrips = 0;
    let monthTrips = 0;

    trips.forEach(t => {
      const price = t.finalPrice ?? t.estimatedPrice ?? 0;
      if (!t.completedAt) return;
      
      const tripDate = t.completedAt.getTime();
      if (tripDate >= startOfDay.getTime()) { dayTotal += price; dayTrips++; }
      if (tripDate >= startOfWeek.getTime()) { weekTotal += price; weekTrips++; }
      if (tripDate >= startOfMonth.getTime()) { monthTotal += price; monthTrips++; }
    });

    const activeDriversCount = await prisma.driver.count({
      where: { status: 'active', isDeleted: false }
    });

    return res.json({
      dayTotal,
      weekTotal,
      monthTotal,
      dayTrips,
      weekTrips,
      monthTrips,
      activeDriversCount
    });
  } catch (err) {
    console.error('Error en /api/agent/finances:', err);
    return res.status(500).json({ error: 'Error al calcular finanzas.' });
  }
});

router.post('/broadcast', async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Falta el mensaje.' });
  }

  try {
    const activeDrivers = await prisma.driver.findMany({
      where: { status: 'active', fcmToken: { not: null } },
      select: { fcmToken: true }
    });

    let count = 0;
    for (const d of activeDrivers) {
      if (d.fcmToken) {
        await sendPushNotification(d.fcmToken, 'Mensaje del Administrador', message);
        count++;
      }
    }

    return res.json({ success: true, message: `Mensaje enviado a ${count} conductores.` });
  } catch (err) {
    console.error('Error en /api/agent/broadcast:', err);
    return res.status(500).json({ error: 'Error al enviar notificaciones.' });
  }
});

export default router;
