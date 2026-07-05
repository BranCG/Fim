const io = require('socket.io-client');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function startPassenger() {
  const passenger = await prisma.user.findFirst({ where: { role: 'passenger' } });
  if (!passenger) return console.log('Pasajero no encontrado');
  
  console.log(`🧍‍♂️ Iniciando pasajero simulado: ${passenger.email}`);

  const socket = io('https://api.fimchile.cl', { transports: ['websocket', 'polling'] });

  socket.on('connect', async () => {
    console.log('✅ Pasajero conectado. Creando viaje en DB y emitiendo trip:search...');
    
    // Create a mock trip
    const trip = await prisma.trip.create({
      data: {
        passengerId: passenger.id,
        originLat: -33.4489,
        originLng: -70.6693,
        originAddress: 'Test Origin Passenger',
        destLat: -33.4262,
        destLng: -70.6184,
        destAddress: 'Test Dest',
        distanceKm: 5,
        durationMin: 15,
        estimatedPrice: 5000,
        paymentMethod: 'cash',
        status: 'searching'
      }
    });

    socket.emit('trip:search', {
      tripId: trip.id,
      passengerId: passenger.id,
      originLat: trip.originLat,
      originLng: trip.originLng
    });

    console.log(`🚀 trip:search emitido para viaje ${trip.id}!`);
    setTimeout(() => process.exit(0), 5000);
  });
}

startPassenger();
