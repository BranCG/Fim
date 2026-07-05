import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';

const router = Router();

router.get('/public', async (_req: Request, res: Response) => {
  try {
    const keys = [
      'promo_ribbon_enabled', 
      'promo_ribbon_text_driver', 
      'promo_ribbon_text_passenger',
      'membership_black_normal_price',
      'membership_black_promo_price',
      'membership_comfort_normal_price',
      'membership_comfort_promo_price',
      'membership_flex_normal_price',
      'membership_flex_promo_price'
    ];
    const configs = await prisma.systemConfig.findMany({
      where: { key: { in: keys } },
    });
    const configMap = configs.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    return res.json({ config: configMap });
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener configuraciones públicas' });
  }
});

router.post('/seed-demo', async (_req: Request, res: Response) => {
  try {
    console.log('[Seed] Iniciando generación de perfiles de demostración...');
    const passwordHash = await bcrypt.hash('123456', 10);

    const passengerEmails = ['pasajero1@fim.cl', 'pasajero2@fim.cl'];
    const dbPassengers = await prisma.user.findMany({
      where: { email: { in: passengerEmails } }
    });
    const passengerIds = dbPassengers.map(p => p.id);

    const driverEmails = ['conductor1@fim.cl', 'conductor2@fim.cl', 'conductor3@fim.cl', 'conductor4@fim.cl'];
    const dbDrivers = await prisma.driver.findMany({
      where: { email: { in: driverEmails } }
    });
    const driverIds = dbDrivers.map(d => d.id);

    // Limpieza
    if (passengerIds.length > 0 || driverIds.length > 0) {
      await prisma.rating.deleteMany({
        where: {
          OR: [
            { passengerId: { in: passengerIds } },
            { driverId: { in: driverIds } }
          ]
        }
      });
      await prisma.trip.deleteMany({
        where: {
          OR: [
            { passengerId: { in: passengerIds } },
            { driverId: { in: driverIds } }
          ]
        }
      });
    }

    if (passengerIds.length > 0) {
      await prisma.refreshToken.deleteMany({
        where: { userId: { in: passengerIds } }
      });
    }
    if (driverIds.length > 0) {
      await prisma.refreshToken.deleteMany({
        where: { driverId: { in: driverIds } }
      });
    }

    await prisma.user.deleteMany({ where: { email: { in: passengerEmails } } });
    await prisma.driver.deleteMany({ where: { email: { in: driverEmails } } });

    // Crear Pasajeros
    const p1 = await prisma.user.create({
      data: {
        email: 'pasajero1@fim.cl',
        phone: '+56911111111',
        name: 'Juan Pasajero',
        passwordHash,
        role: 'passenger',
        isVerified: true,
        rut: '11.111.111-1'
      }
    });

    const p2 = await prisma.user.create({
      data: {
        email: 'pasajero2@fim.cl',
        phone: '+56922222222',
        name: 'Maria Pasajera',
        passwordHash,
        role: 'passenger',
        isVerified: true,
        rut: '22.222.222-2'
      }
    });

    const blackExpires = new Date();
    blackExpires.setMonth(blackExpires.getMonth() + 1);

    // Pedro: BLACK, Casi en la meta (142 de 150 viajes)
    const d1 = await prisma.driver.create({
      data: {
        email: 'conductor1@fim.cl',
        phone: '+56933333333',
        name: 'Pedro Conductor',
        passwordHash,
        rut: '33.333.333-3',
        birthDate: new Date('1990-01-01'),
        address: 'Alameda 123, Santiago',
        idFrontUrl: 'https://placehold.co/600x400?text=ID+Front',
        idBackUrl: 'https://placehold.co/600x400?text=ID+Back',
        selfieUrl: 'https://placehold.co/600x400?text=Selfie',
        licenseNumber: 'LIC-111',
        licenseUrl: 'https://placehold.co/600x400?text=License',
        vehicleBrand: 'BMW',
        vehicleModel: 'Serie 3',
        vehicleYear: 2022,
        vehiclePlate: 'ABCD-12',
        vehicleColor: 'Negro',
        vehiclePhotoUrl: 'https://placehold.co/600x400?text=Car',
        tagNumber: 'TAG-111',
        status: 'active',
        membershipPaid: true,
        membershipPlan: 'BLACK',
        membershipExpiresAt: blackExpires,
        membershipProgress: 142,
        membershipGoal: 150,
        nextDiscount: 0,
        totalRating: 4.8,
        totalTrips: 142,
        topQualities: ['Respetuoso y cordial', 'Vehículo en buen estado', 'Conduce muy bien']
      }
    });

    // Luis: COMFORT, sin meta (cobro diario)
    const d2 = await prisma.driver.create({
      data: {
        email: 'conductor2@fim.cl',
        phone: '+56944444444',
        name: 'Luis Conductor (COMFORT)',
        passwordHash,
        rut: '44.444.444-4',
        birthDate: new Date('1995-05-05'),
        address: 'Providencia 456, Santiago',
        idFrontUrl: 'https://placehold.co/600x400?text=ID+Front',
        idBackUrl: 'https://placehold.co/600x400?text=ID+Back',
        selfieUrl: 'https://placehold.co/600x400?text=Selfie',
        licenseNumber: 'LIC-222',
        licenseUrl: 'https://placehold.co/600x400?text=License',
        vehicleBrand: 'Hyundai',
        vehicleModel: 'Tucson',
        vehicleYear: 2021,
        vehiclePlate: 'EFGH-34',
        vehicleColor: 'Gris',
        vehiclePhotoUrl: 'https://placehold.co/600x400?text=Car',
        tagNumber: 'TAG-222',
        status: 'active',
        membershipPaid: false,
        membershipPlan: 'COMFORT',
        membershipGoal: 0,
        comfortDebt: 0,
        comfortLastPaidAt: new Date(),
        totalRating: 4.5,
        totalTrips: 52,
        topQualities: ['Respetuoso y cordial', 'Vehículo en buen estado']
      }
    });

    const flexExpires = new Date();
    const daysUntilMonday = (8 - flexExpires.getDay()) % 7 || 7;
    flexExpires.setDate(flexExpires.getDate() + daysUntilMonday);

    // Carlos: FLEX, A la mitad de la meta (20 de 40 viajes)
    const d3 = await prisma.driver.create({
      data: {
        email: 'conductor3@fim.cl',
        phone: '+56955555555',
        name: 'Carlos Flex (FLEX)',
        passwordHash,
        rut: '55.555.555-5',
        birthDate: new Date('1992-08-15'),
        address: 'Las Condes 789, Santiago',
        idFrontUrl: 'https://placehold.co/600x400?text=ID+Front',
        idBackUrl: 'https://placehold.co/600x400?text=ID+Back',
        selfieUrl: 'https://placehold.co/600x400?text=Selfie',
        licenseNumber: 'LIC-333',
        licenseUrl: 'https://placehold.co/600x400?text=License',
        vehicleBrand: 'Kia',
        vehicleModel: 'Sportage',
        vehicleYear: 2023,
        vehiclePlate: 'IJKL-56',
        vehicleColor: 'Azul',
        vehiclePhotoUrl: 'https://placehold.co/600x400?text=Car',
        tagNumber: 'TAG-333',
        status: 'active',
        membershipPaid: true,
        membershipPlan: 'FLEX',
        membershipExpiresAt: flexExpires,
        membershipProgress: 20,
        membershipGoal: 40,
        nextDiscount: 0,
        totalRating: 3.2,
        totalTrips: 20,
        topQualities: ['Buena conversación']
      }
    });

    // Sofia: BLACK, Meta cumplida (155 de 150 viajes)
    const d4 = await prisma.driver.create({
      data: {
        email: 'conductor4@fim.cl',
        phone: '+56966666666',
        name: 'Sofia Conductora',
        passwordHash,
        rut: '66.666.666-6',
        birthDate: new Date('1994-11-20'),
        address: 'Vitacura 999, Santiago',
        idFrontUrl: 'https://placehold.co/600x400?text=ID+Front',
        idBackUrl: 'https://placehold.co/600x400?text=ID+Back',
        selfieUrl: 'https://placehold.co/600x400?text=Selfie',
        licenseNumber: 'LIC-444',
        licenseUrl: 'https://placehold.co/600x400?text=License',
        vehicleBrand: 'Toyota',
        vehicleModel: 'Corolla',
        vehicleYear: 2020,
        vehiclePlate: 'MNOP-78',
        vehicleColor: 'Blanco',
        vehiclePhotoUrl: 'https://placehold.co/600x400?text=Car',
        tagNumber: 'TAG-444',
        status: 'active',
        membershipPaid: true,
        membershipPlan: 'BLACK',
        membershipExpiresAt: blackExpires,
        membershipProgress: 155,
        membershipGoal: 150,
        nextDiscount: 20,
        totalRating: 4.9,
        totalTrips: 155,
        topQualities: ['Conduce muy bien', 'Respetuoso y cordial', 'Vehículo en buen estado']
      }
    });

    // Crear viajes y calificaciones para Pedro
    const pedroTripsData = [
      { passengerId: p1.id, origin: "Alameda 100, Santiago", dest: "Providencia 1200, Providencia", score: 5, comment: "Excelente conductor, muy respetuoso", tags: ['Respetuoso y cordial', 'Vehículo en buen estado'] },
      { passengerId: p2.id, origin: "Apoquindo 3000, Las Condes", dest: "Vitacura 2000, Vitacura", score: 5, comment: "Auto muy limpio y manejo suave", tags: ['Vehículo en buen estado', 'Conduce muy bien'] },
      { passengerId: p1.id, origin: "Santiago Centro", dest: "Ñuñoa", score: 4, comment: "Buen viaje, muy educado", tags: ['Respetuoso y cordial'] },
      { passengerId: p2.id, origin: "Las Condes", dest: "Santiago", score: 5, comment: "Excelente conversación y amabilidad", tags: ['Respetuoso y cordial'] },
      { passengerId: p1.id, origin: "Providencia", dest: "Las Condes", score: 5, comment: "Todo excelente", tags: ['Vehículo en buen estado', 'Conduce muy bien'] }
    ];

    for (const data of pedroTripsData) {
      const trip = await prisma.trip.create({
        data: {
          passengerId: data.passengerId,
          driverId: d1.id,
          originAddress: data.origin,
          destAddress: data.dest,
          originLat: -33.4489,
          originLng: -70.6693,
          destLat: -33.4262,
          destLng: -70.6184,
          distanceKm: 5.2,
          durationMin: 15,
          estimatedPrice: 5000,
          finalPrice: 5000,
          status: 'completed',
          paymentMethod: 'cash',
          isPaid: true,
          paymentStatus: 'paid',
          completedAt: new Date()
        }
      });
      await prisma.rating.create({
        data: {
          tripId: trip.id,
          passengerId: data.passengerId,
          driverId: d1.id,
          driverScore: data.score,
          driverComment: data.comment,
          tags: data.tags
        }
      });
    }

    // Crear viajes y calificaciones para Luis
    const luisTripsData = [
      { passengerId: p1.id, origin: "Alameda 200", dest: "Providencia 1500", score: 5, comment: "Muy amable", tags: ['Respetuoso y cordial'] },
      { passengerId: p2.id, origin: "Apoquindo 4000", dest: "Vitacura 1000", score: 4, comment: "Auto en excelentes condiciones", tags: ['Vehículo en buen estado'] }
    ];

    for (const data of luisTripsData) {
      const trip = await prisma.trip.create({
        data: {
          passengerId: data.passengerId,
          driverId: d2.id,
          originAddress: data.origin,
          destAddress: data.dest,
          originLat: -33.4489,
          originLng: -70.6693,
          destLat: -33.4262,
          destLng: -70.6184,
          distanceKm: 4.8,
          durationMin: 12,
          estimatedPrice: 6000,
          finalPrice: 6000,
          status: 'completed',
          paymentMethod: 'cash',
          isPaid: true,
          paymentStatus: 'paid',
          completedAt: new Date()
        }
      });
      await prisma.rating.create({
        data: {
          tripId: trip.id,
          passengerId: data.passengerId,
          driverId: d2.id,
          driverScore: data.score,
          driverComment: data.comment,
          tags: data.tags
        }
      });
    }

    // Crear viajes y calificaciones para Carlos (Bajo promedio / Alertas)
    const carlosTripsData = [
      { passengerId: p1.id, origin: "Apoquindo 5000", dest: "Vitacura 3000", score: 5, comment: "Muy simpático y conversador", tags: ['Buena conversación'] },
      { passengerId: p2.id, origin: "Ñuñoa 500", dest: "Santiago 1000", score: 2, comment: "Maniobras un poco bruscas y exceso de velocidad", tags: ['Conductor maneja mal', 'Exceso de Velocidad'] },
      { passengerId: p1.id, origin: "Alameda 500", dest: "Providencia 2000", score: 3, comment: "El auto tenía olor a cigarrillo", tags: ['Vehículo huele mal'] },
      { passengerId: p2.id, origin: "Las Condes 2000", dest: "Vitacura 4000", score: 3, comment: "Iba muy rápido", tags: ['Exceso de Velocidad'] }
    ];

    for (const data of carlosTripsData) {
      const trip = await prisma.trip.create({
        data: {
          passengerId: data.passengerId,
          driverId: d3.id,
          originAddress: data.origin,
          destAddress: data.dest,
          originLat: -33.4489,
          originLng: -70.6693,
          destLat: -33.4262,
          destLng: -70.6184,
          distanceKm: 6.5,
          durationMin: 18,
          estimatedPrice: 7000,
          finalPrice: 7000,
          status: 'completed',
          paymentMethod: 'cash',
          isPaid: true,
          paymentStatus: 'paid',
          completedAt: new Date()
        }
      });
      await prisma.rating.create({
        data: {
          tripId: trip.id,
          passengerId: data.passengerId,
          driverId: d3.id,
          driverScore: data.score,
          driverComment: data.comment,
          tags: data.tags
        }
      });
    }

    // Crear viajes y calificaciones para Sofia
    const sofiaTripsData = [
      { passengerId: p1.id, origin: "Vitacura 5000", dest: "Las Condes 1000", score: 5, comment: "Excelente, la mejor conductora", tags: ['Conduce muy bien', 'Respetuoso y cordial'] },
      { passengerId: p2.id, origin: "Providencia 1000", dest: "Santiago Centro", score: 5, comment: "Manejo impecable, auto reluciente", tags: ['Conduce muy bien', 'Vehículo en buen estado'] },
      { passengerId: p1.id, origin: "Las Condes 500", dest: "Ñuñoa", score: 5, comment: "Muy atenta y educada", tags: ['Respetuoso y cordial'] },
      { passengerId: p2.id, origin: "Santiago 2000", dest: "Alameda 1000", score: 5, comment: "Auto en perfectas condiciones", tags: ['Vehículo en buen estado'] },
      { passengerId: p1.id, origin: "Vitacura 100", dest: "Providencia 300", score: 4, comment: "Buen viaje", tags: ['Conduce muy bien'] }
    ];

    for (const data of sofiaTripsData) {
      const trip = await prisma.trip.create({
        data: {
          passengerId: data.passengerId,
          driverId: d4.id,
          originAddress: data.origin,
          destAddress: data.dest,
          originLat: -33.4489,
          originLng: -70.6693,
          destLat: -33.4262,
          destLng: -70.6184,
          distanceKm: 5.5,
          durationMin: 16,
          estimatedPrice: 6000,
          finalPrice: 6000,
          status: 'completed',
          paymentMethod: 'cash',
          isPaid: true,
          paymentStatus: 'paid',
          completedAt: new Date()
        }
      });
      await prisma.rating.create({
        data: {
          tripId: trip.id,
          passengerId: data.passengerId,
          driverId: d4.id,
          driverScore: data.score,
          driverComment: data.comment,
          tags: data.tags
        }
      });
    }

    console.log('[Seed] Perfiles de demostración generados con éxito.');
    return res.json({ success: true, message: 'Seeded demo profiles successfully!' });
  } catch (err: any) {
    console.error('Error seeding demo profiles:', err);
    return res.status(500).json({ error: 'Error seeding demo profiles: ' + err.message });
  }
});

export default router;
