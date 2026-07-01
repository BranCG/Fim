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

    // Consultar todos los viajes completados desde la fecha más antigua (12 semanas o inicio de mes)
    const historyWeeks = 12;
    const historyStartDate = new Date(startOfWeek);
    historyStartDate.setDate(historyStartDate.getDate() - ((historyWeeks - 1) * 7));
    
    const earliestDate = startOfMonth < historyStartDate ? startOfMonth : historyStartDate;

    const allRecentTrips = await prisma.trip.findMany({
      where: {
        driverId: driverId,
        status: 'completed',
        createdAt: { gte: earliestDate }
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
    
    // Para el historial (0 = esta semana, 1 = semana pasada, etc)
    const weeklyData = Array.from({ length: historyWeeks }, (_, i) => ({
      gross: 0,
      distance: 0,
      start: new Date(startOfWeek.getTime() - i * 7 * 24 * 60 * 60 * 1000)
    }));

    for (const trip of allRecentTrips) {
      const tripDate = new Date(trip.createdAt);
      
      if (tripDate >= startOfMonth) {
        monthTripCount++;
      }
      
      if (tripDate >= startOfWeek) {
        weekGross += trip.estimatedPrice;
        weekDistance += trip.distanceKm;
      }
      
      for (let i = 0; i < historyWeeks; i++) {
        if (tripDate >= weeklyData[i].start && (i === 0 || tripDate < weeklyData[i - 1].start)) {
          weeklyData[i].gross += trip.estimatedPrice;
          weeklyData[i].distance += trip.distanceKm;
          break;
        }
      }
      
      if (tripDate >= startOfToday) {
        todayGross += trip.estimatedPrice;
        todayDistance += trip.distanceKm;
      }
    }

    // Cálculos de Costos (Basado en la semana) y redondeados a 10s para consistencia
    const fuelE = driver.fuelEfficiency || 12.0;
    const fuelP = driver.fuelPrice || 1300;
    
    const round10 = (val: number) => Math.round(val / 10) * 10;

    const fuelCost = round10(Math.round((weekDistance / fuelE) * fuelP));
    const wearCost = round10(Math.round(weekDistance * 50)); // 50 CLP por km
    const fixedCost = round10(driver.membershipPlan === 'BLACK' ? Math.round((150000 / 30) * 7) : (driver.membershipPlan === 'COMFORT' ? 20000 * 7 : 60000));
    
    // Procesar el historial de las últimas 4 semanas
    const history = weeklyData.map((week, index) => {
      const wGross = round10(week.gross);
      const wFuel = round10(Math.round((week.distance / fuelE) * fuelP));
      const wWear = round10(Math.round(week.distance * 50));
      const wTax = round10(Math.round(wGross * 0.1375)); // SII sobre Bruto
      const wRawNet = wGross - (wFuel + wWear + fixedCost + wTax);
      const wNet = wRawNet;
      const incomeGoal = driver.netIncomeGoal || 1000000;
      const progress = Math.max(0, Math.min((wNet / incomeGoal) * 100, 100));
      
      let label = 'Esta semana';
      if (index === 1) label = 'Semana pasada';
      if (index > 1) {
        const d = new Date(week.start);
        label = `Semana del ${d.getDate()}/${d.getMonth() + 1}`;
      }

      return {
        label,
        netIncome: wNet,
        goal: incomeGoal,
        progress
      };
    });

    // Redondeamos también los ingresos para que la resta sea exacta
    weekGross = round10(weekGross);
    todayGross = round10(todayGross);

    // Provisión de impuestos (13.75%) sobre el Ingreso Bruto
    const taxProvision = round10(Math.round(weekGross * 0.1375));

    const totalExpenses = fuelCost + wearCost + fixedCost + taxProvision;
    const realNetIncome = weekGross - totalExpenses;

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
      history,
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
