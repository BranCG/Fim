import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// Endpoint para obtener las métricas financieras del conductor
router.get('/dashboard', requireAuth, requireRole('driver'), async (req: Request, res: Response) => {
  try {
    const driverId = req.user!.id;
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: { 
        fuelEfficiency: true, 
        fuelPrice: true, 
        netIncomeGoal: true,
        membershipPlan: true,
      }
    });

    if (!driver) {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    // Definir rangos de tiempo (Hoy y Semana Actual)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Calcular inicio de la semana (Lunes)
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(now.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    // Obtener viajes del mes actual para la meta de descuento
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Consultar todos los viajes completados desde el inicio del mes
    const completedTrips = await prisma.trip.findMany({
      where: {
        driverId: driverId,
        status: 'completed',
        createdAt: { gte: startOfMonth }
      },
      select: {
        createdAt: true,
        estimatedPrice: true,
        distanceKm: true,
      }
    });

    let todayGross = 0;
    let weekGross = 0;
    let todayDistance = 0;
    let weekDistance = 0;
    let monthTripCount = 0;

    for (const trip of completedTrips) {
      monthTripCount++;
      const tripDate = new Date(trip.createdAt);
      
      if (tripDate >= startOfWeek) {
        weekGross += trip.estimatedPrice;
        weekDistance += trip.distanceKm;
      }
      
      if (tripDate >= startOfToday) {
        todayGross += trip.estimatedPrice;
        todayDistance += trip.distanceKm;
      }
    }

    // Cálculos de Costos (Basado en la semana)
    const fuelE = driver.fuelEfficiency || 12.0;
    const fuelP = driver.fuelPrice || 1300;
    
    const fuelCost = Math.round((weekDistance / fuelE) * fuelP);
    const wearCost = Math.round(weekDistance * 50); // 50 CLP por km
    const fixedCost = driver.membershipPlan === 'BLACK' ? Math.round(150000 / 4.3) : (driver.membershipPlan === 'COMFORT' ? 20000 * 7 : 60000); // Costo semanal prorrateado
    
    const totalExpenses = fuelCost + wearCost + fixedCost;
    const rawNet = weekGross - totalExpenses;
    
    // Provisión de impuestos (13.75%)
    const taxProvision = rawNet > 0 ? Math.round(rawNet * 0.1375) : 0;
    const realNetIncome = rawNet - taxProvision;

    // Metas de Membresía (Descuento)
    const discountGoal = driver.membershipPlan === 'BLACK' ? 150 : (driver.membershipPlan === 'FLEX' ? 40 : 0);
    const discountProgress = Math.min(monthTripCount, discountGoal);

    res.json({
      gross: {
        today: todayGross,
        week: weekGross,
      },
      expenses: {
        fuel: fuelCost,
        wear: wearCost,
        taxes: taxProvision,
        membership: fixedCost,
        total: totalExpenses
      },
      netIncome: realNetIncome,
      goals: {
        incomeGoal: driver.netIncomeGoal || 1000000,
        discountGoal,
        discountProgress,
      },
      config: {
        fuelEfficiency: driver.fuelEfficiency,
        fuelPrice: driver.fuelPrice
      }
    });
  } catch (error) {
    console.error('Error fetching finances:', error);
    res.status(500).json({ error: 'Error interno al calcular finanzas' });
  }
});

// Endpoint para actualizar configuración financiera del conductor
router.put('/config', requireAuth, requireRole('driver'), async (req: Request, res: Response) => {
  try {
    const { fuelEfficiency, fuelPrice, netIncomeGoal } = req.body;

    const driver = await prisma.driver.update({
      where: { id: req.user!.id },
      data: {
        fuelEfficiency: fuelEfficiency ? parseFloat(fuelEfficiency) : undefined,
        fuelPrice: fuelPrice ? parseInt(fuelPrice) : undefined,
        netIncomeGoal: netIncomeGoal ? parseInt(netIncomeGoal) : undefined
      }
    });

    res.json({ message: 'Configuración actualizada', config: { fuelEfficiency: driver.fuelEfficiency, fuelPrice: driver.fuelPrice, netIncomeGoal: driver.netIncomeGoal } });
  } catch (error) {
    console.error('Error updating finance config:', error);
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
});

export default router;
