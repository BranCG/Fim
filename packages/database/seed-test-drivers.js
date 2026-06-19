const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando conductores de prueba...');

  const passHash = await bcrypt.hash('admin123', 12);
  const now = new Date();

  // 1. Conductor con 14 días Free Pass de registro
  const trialExpires = new Date();
  trialExpires.setDate(now.getDate() + 14);

  const trialDriver = await prisma.driver.upsert({
    where: { email: 'trial@fim.cl' },
    update: {
      status: 'active',
      isTrial: true,
      membershipPaid: false,
      membershipExpiresAt: trialExpires,
      membershipPlan: 'BLACK'
    },
    create: {
      email: 'trial@fim.cl',
      phone: '+56911110001',
      name: 'Trial Free Pass 14 Dias',
      passwordHash: passHash,
      rut: '11.111.111-1',
      birthDate: new Date('1995-01-01'),
      address: 'Av. Trial 123, Santiago',
      idFrontUrl: 'https://via.placeholder.com/400x250?text=Trial+Frente',
      idBackUrl: 'https://via.placeholder.com/400x250?text=Trial+Dorso',
      licenseNumber: 'LIC-TRIAL123',
      licenseUrl: 'https://via.placeholder.com/400x250?text=Trial+Licencia',
      vehicleBrand: 'Kia',
      vehicleModel: 'Rio',
      vehicleYear: 2020,
      vehiclePlate: 'TRIA14',
      vehiclePhotoUrl: 'https://via.placeholder.com/400x250?text=Kia+Rio',
      tagNumber: 'TAG-TRIAL123',
      status: 'active',
      isTrial: true,
      membershipPaid: false,
      membershipExpiresAt: trialExpires,
      membershipPlan: 'BLACK',
      totalRating: 5.0,
      totalTrips: 0
    }
  });
  console.log('✅ Conductor TRIAL creado/actualizado:', trialDriver.email);

  // 2. Conductor con membresía BLACK activa, sin Free Pass de registro
  const blackExpires = new Date();
  blackExpires.setDate(now.getDate() + 30);

  const date20DaysAgo = new Date();
  date20DaysAgo.setDate(date20DaysAgo.getDate() - 20);

  const blackDriver = await prisma.driver.upsert({
    where: { email: 'black@fim.cl' },
    update: {
      status: 'active',
      isTrial: false,
      membershipPaid: true,
      membershipExpiresAt: blackExpires,
      membershipPlan: 'BLACK',
      createdAt: date20DaysAgo
    },
    create: {
      email: 'black@fim.cl',
      phone: '+56911110002',
      name: 'Membresia Black Activa',
      passwordHash: passHash,
      rut: '22.222.222-2',
      birthDate: new Date('1990-01-01'),
      address: 'Av. Black 456, Santiago',
      idFrontUrl: 'https://via.placeholder.com/400x250?text=Black+Frente',
      idBackUrl: 'https://via.placeholder.com/400x250?text=Black+Dorso',
      licenseNumber: 'LIC-BLACK456',
      licenseUrl: 'https://via.placeholder.com/400x250?text=Black+Licencia',
      vehicleBrand: 'Hyundai',
      vehicleModel: 'Elantra',
      vehicleYear: 2021,
      vehiclePlate: 'BLAC30',
      vehiclePhotoUrl: 'https://via.placeholder.com/400x250?text=Hyundai+Elantra',
      tagNumber: 'TAG-BLACK456',
      status: 'active',
      isTrial: false,
      membershipPaid: true,
      membershipExpiresAt: blackExpires,
      membershipPlan: 'BLACK',
      totalRating: 5.0,
      totalTrips: 12,
      createdAt: date20DaysAgo
    }
  });
  console.log('✅ Conductor BLACK creado/actualizado:', blackDriver.email);

  console.log('🎉 Seed de prueba completado.');
}

main()
  .catch(e => {
    console.error('❌ Error en el seed de prueba:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
