const io = require('socket.io-client');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFlow() {
  const passenger = await prisma.user.findFirst({ where: { role: 'passenger' } });
  const driver = await prisma.driver.findFirst({ where: { status: 'active' } }); // any active driver
  
  if (!passenger || !driver) return console.log('Mock users not found');
  console.log(`Using Passenger: ${passenger.email}, Driver: ${driver.email}`);

  const passengerSocket = io('https://api.fimchile.cl', { transports: ['websocket', 'polling'] });
  const driverSocket = io('https://api.fimchile.cl', { transports: ['websocket', 'polling'] });

  driverSocket.on('connect', () => {
    console.log('Driver socket connected to PRODUCTION API');
    driverSocket.emit('driver:online', {
      driverId: driver.id,
      lat: -33.4489,
      lng: -70.6693
    });
  });

  driverSocket.on('error', (err) => {
    console.log('Driver Socket Error:', err);
  });

  driverSocket.on('trip:request', (data) => {
    console.log('--- TRIP REQUEST RECEIVED BY DRIVER ---');
    console.log(data);
    process.exit(0);
  });

  passengerSocket.on('connect', async () => {
    console.log('Passenger socket connected to PRODUCTION API');
    // Wait for driver to go online
    setTimeout(async () => {
      // Create a mock trip first
      const trip = await prisma.trip.create({
        data: {
          passengerId: passenger.id,
          originLat: -33.4489,
          originLng: -70.6693,
          originAddress: 'Test Origin',
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

      console.log('Passenger requesting trip: ', trip.id);
      passengerSocket.emit('trip:search', {
        tripId: trip.id,
        passengerId: passenger.id,
        originLat: trip.originLat,
        originLng: trip.originLng
      });
      
      setTimeout(() => {
        console.log('Timeout waiting for driver to receive trip!');
        process.exit(1);
      }, 5000);
    }, 2000);
  });
}

testFlow();
