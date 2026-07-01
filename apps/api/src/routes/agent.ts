import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

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

export default router;
