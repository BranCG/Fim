const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetAll() {
  console.log('🔄 Re-sincronizando y reseteando credenciales de prueba...');
  const commonHash = await bcrypt.hash('123456', 12);
  const testHash = await bcrypt.hash('test123', 12);

  // 1. Reseteo de pasajeros seeded
  const p1 = await prisma.user.upsert({
    where: { email: 'pasajero1@fim.cl' },
    update: { passwordHash: commonHash, isVerified: true },
    create: {
      email: 'pasajero1@fim.cl',
      phone: '+56911111111',
      name: 'Juan Pasajero',
      passwordHash: commonHash,
      role: 'passenger',
      isVerified: true,
      rut: '11.111.111-1'
    }
  });
  console.log(`✅ Pasajero de prueba listo: ${p1.email} / Clave: 123456`);

  const p2 = await prisma.user.upsert({
    where: { email: 'pasajero2@fim.cl' },
    update: { passwordHash: commonHash, isVerified: true },
    create: {
      email: 'pasajero2@fim.cl',
      phone: '+56922222222',
      name: 'Maria Pasajera',
      passwordHash: commonHash,
      role: 'passenger',
      isVerified: true,
      rut: '22.222.222-2'
    }
  });
  console.log(`✅ Pasajero de prueba listo: ${p2.email} / Clave: 123456`);

  // 2. Pasajero alternativo test123
  const pTest = await prisma.user.upsert({
    where: { email: 'pasajero@test.cl' },
    update: { passwordHash: testHash, isVerified: true },
    create: {
      email: 'pasajero@test.cl',
      phone: '+56999999999',
      name: 'Test Pasajero',
      passwordHash: testHash,
      role: 'passenger',
      isVerified: true,
      rut: '99.999.999-9'
    }
  });
  console.log(`✅ Pasajero de prueba listo: ${pTest.email} / Clave: test123`);

  // 3. Reseteo de conductores seeded — uno por plan
  const blackExpires = new Date(); blackExpires.setMonth(blackExpires.getMonth() + 1);
  const d1 = await prisma.driver.upsert({
    where: { email: 'conductor1@fim.cl' },
    update: { passwordHash: commonHash, status: 'active', membershipPaid: true, membershipPlan: 'BLACK', membershipExpiresAt: blackExpires, taxCompliant: true },
    create: {
      email: 'conductor1@fim.cl',
      phone: '+56933333333',
      name: 'Pedro',
      passwordHash: commonHash,
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
      vehiclePhotoUrl: 'https://placehold.co/600x400?text=Car',
      tagNumber: 'TAG-111',
      status: 'active',
      membershipPaid: true,
      membershipPlan: 'BLACK',
      membershipGoal: 150000,
      membershipExpiresAt: blackExpires,
      taxCompliant: true,
    }
  });
  console.log(`✅ Conductor BLACK listo: ${d1.email} / Clave: 123456`);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d2 = await prisma.driver.upsert({
    where: { email: 'conductor2@fim.cl' },
    update: { passwordHash: commonHash, status: 'active', membershipPaid: false, membershipPlan: 'COMFORT', comfortDebt: 0, comfortLastPaidAt: new Date(), taxCompliant: true },
    create: {
      email: 'conductor2@fim.cl',
      phone: '+56944444444',
      name: 'Luis Confort (COMFORT)',
      passwordHash: commonHash,
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
      vehiclePhotoUrl: 'https://placehold.co/600x400?text=Car',
      tagNumber: 'TAG-222',
      status: 'active',
      membershipPaid: false,
      membershipPlan: 'COMFORT',
      membershipGoal: 180000,
      comfortDebt: 0,
      comfortLastPaidAt: new Date(), // Pagó hoy
      taxCompliant: true,
    }
  });
  console.log(`✅ Conductor COMFORT listo: ${d2.email} / Clave: 123456`);

  const flexExpires = new Date(); 
  const daysUntilMonday = (8 - flexExpires.getDay()) % 7 || 7;
  flexExpires.setDate(flexExpires.getDate() + daysUntilMonday);
  const d3 = await prisma.driver.upsert({
    where: { email: 'conductor3@fim.cl' },
    update: { passwordHash: commonHash, status: 'active', membershipPaid: true, membershipPlan: 'FLEX', membershipExpiresAt: flexExpires, taxCompliant: true },
    create: {
      email: 'conductor3@fim.cl',
      phone: '+56955555555',
      name: 'Carlos Flex (FLEX)',
      passwordHash: commonHash,
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
      vehiclePhotoUrl: 'https://placehold.co/600x400?text=Car',
      tagNumber: 'TAG-333',
      status: 'active',
      membershipPaid: true,
      membershipPlan: 'FLEX',
      membershipGoal: 60000,
      membershipExpiresAt: flexExpires,
      taxCompliant: true,
    }
  });
  console.log(`✅ Conductor FLEX listo: ${d3.email} / Clave: 123456`);

  // 4. Admin reseteado
  const adminHash = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@fim.cl' },
    update: { passwordHash: adminHash },
    create: {
      email: 'admin@fim.cl',
      phone: '+56900000000',
      name: 'Administrador Fim',
      passwordHash: adminHash,
      role: 'admin',
      isVerified: true,
    }
  });
  console.log(`✅ Admin listo: admin@fim.cl / Clave: admin123`);

  await prisma.$disconnect();
  console.log('🎉 Sincronización completa con éxito.');
  console.log('');
  console.log('📋 CUENTAS DE PRUEBA:');
  console.log('  Pasajeros: pasajero1@fim.cl / 123456');
  console.log('  Conductor BLACK:   conductor1@fim.cl / 123456');
  console.log('  Conductor COMFORT: conductor2@fim.cl / 123456');
  console.log('  Conductor FLEX:    conductor3@fim.cl / 123456');
  console.log('  Admin: admin@fim.cl / admin123');
}

resetAll();
