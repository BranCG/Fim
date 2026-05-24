import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando base de datos Fim...');

  // Admin usuario
  const adminHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fim.cl' },
    update: {},
    create: {
      email: 'admin@fim.cl',
      phone: '+56900000000',
      name: 'Administrador Fim',
      passwordHash: adminHash,
      role: 'admin',
      isVerified: true,
    },
  });
  console.log('✅ Admin creado:', admin.email);

  // Pasajero de prueba
  const passengerHash = await bcrypt.hash('test123', 12);
  const passenger = await prisma.user.upsert({
    where: { email: 'pasajero@test.cl' },
    update: {},
    create: {
      email: 'pasajero@test.cl',
      phone: '+56911111111',
      name: 'Juan Pasajero',
      passwordHash: passengerHash,
      role: 'passenger',
      rut: '12.345.678-9',
      birthDate: new Date('1990-05-15'),
      address: 'Av. Providencia 1000, Santiago',
      isVerified: true,
    },
  });
  console.log('✅ Pasajero de prueba:', passenger.email);

  // Conductor activo de prueba
  const driverHash = await bcrypt.hash('test123', 12);
  const driver = await prisma.driver.upsert({
    where: { email: 'conductor@test.cl' },
    update: {},
    create: {
      email: 'conductor@test.cl',
      phone: '+56922222222',
      name: 'Pedro Conductor',
      passwordHash: driverHash,
      rut: '15.678.901-2',
      birthDate: new Date('1985-08-20'),
      address: 'Av. Las Condes 5000, Santiago',
      idFrontUrl: 'https://via.placeholder.com/400x250?text=Cedula+Frente',
      idBackUrl: 'https://via.placeholder.com/400x250?text=Cedula+Dorso',
      licenseNumber: 'A1234567',
      licenseUrl: 'https://via.placeholder.com/400x250?text=Licencia',
      vehicleBrand: 'Toyota',
      vehicleModel: 'Corolla',
      vehicleYear: 2021,
      vehiclePlate: 'BCDF12',
      vehiclePhotoUrl: 'https://via.placeholder.com/400x250?text=Toyota+Corolla',
      tagNumber: 'TAG-12345678',
      status: 'active',
      membershipPaid: true,
      membershipDate: new Date(),
      totalRating: 4.8,
      totalTrips: 47,
    },
  });
  console.log('✅ Conductor activo de prueba:', driver.email);

  // Conductor pendiente de prueba
  const pendingHash = await bcrypt.hash('test123', 12);
  const pending = await prisma.driver.upsert({
    where: { email: 'pendiente@test.cl' },
    update: {},
    create: {
      email: 'pendiente@test.cl',
      phone: '+56933333333',
      name: 'Carlos Pendiente',
      passwordHash: pendingHash,
      rut: '18.901.234-5',
      birthDate: new Date('1992-03-10'),
      address: 'Av. Grecia 2500, Santiago',
      idFrontUrl: 'https://via.placeholder.com/400x250?text=Cedula+Frente',
      idBackUrl: 'https://via.placeholder.com/400x250?text=Cedula+Dorso',
      licenseNumber: 'B9876543',
      licenseUrl: 'https://via.placeholder.com/400x250?text=Licencia',
      vehicleBrand: 'Hyundai',
      vehicleModel: 'Accent',
      vehicleYear: 2019,
      vehiclePlate: 'WXYZ99',
      vehiclePhotoUrl: 'https://via.placeholder.com/400x250?text=Hyundai+Accent',
      tagNumber: 'TAG-87654321',
      status: 'pending',
    },
  });
  console.log('✅ Conductor pendiente de prueba:', pending.email);

  console.log('\n🎉 Seed completado!\n');
  console.log('═══════════════════════════════════');
  console.log('  Credenciales de prueba:');
  console.log('  Admin:      admin@fim.cl / admin123');
  console.log('  Pasajero:   pasajero@test.cl / test123');
  console.log('  Conductor:  conductor@test.cl / test123');
  console.log('  Pendiente:  pendiente@test.cl / test123');
  console.log('═══════════════════════════════════\n');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
