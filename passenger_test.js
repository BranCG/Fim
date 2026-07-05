const io = require('socket.io-client');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function startPassengerTest() {
  const passenger = await prisma.user.findFirst({ where: { role: 'passenger' } });
  if (!passenger) return console.log('Pasajero no encontrado');
  
  console.log(`🧍‍♂️ Iniciando pasajero simulado para probar el celular del usuario...`);

  // We connect to the PRODUCTION API!
  const socket = io('https://api.fimchile.cl', { transports: ['websocket', 'polling'] });

  socket.on('connect', async () => {
    console.log('✅ Pasajero conectado. Creando viaje cerca del conductor en La Granja...');
    
    // Create a mock trip EXACTLY at the driver's location (-33.5486, -70.6233)
    const trip = await prisma.trip.create({
      data: {
        passengerId: passenger.id,
        originLat: -33.5486,
        originLng: -70.6233,
        originAddress: 'Test Origin Pasajero Automático',
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

    console.log(`🚀 Emitiendo trip:search para viaje ${trip.id}...`);
    socket.emit('trip:search', {
      tripId: trip.id,
      passengerId: passenger.id,
      originLat: trip.originLat,
      originLng: trip.originLng
    });

    // We will listen if the driver accepts or rejects!
    // But wait, the passenger socket doesn't receive `driver:reject`. 
    // The passenger socket receives `trip:cancelled` if no driver accepts!
    
  });

  socket.on('trip:accepted', (data) => {
    console.log('🎉 EL CONDUCTOR ACEPTÓ EL VIAJE!', data);
    process.exit(0);
  });

  socket.on('trip:cancelled', (data) => {
    console.log('❌ El viaje fue cancelado. Razón:', data.reason);
    if (data.reason === 'Sin conductores disponibles') {
       console.log('🛑 ESTO SIGNIFICA QUE EL CELULAR DEL CONDUCTOR RECHAZÓ O IGNORÓ EL VIAJE, O NUNCA LE LLEGÓ.');
    }
    process.exit(0);
  });

}

startPassengerTest();
