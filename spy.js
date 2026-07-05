const io = require('socket.io-client');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function startSpy() {
  const driver = await prisma.driver.findFirst({ where: { email: 'conductor1@fim.cl' } });
  if (!driver) return console.log('Conductor no encontrado');
  
  console.log(`📡 Iniciando espía como conductor: ${driver.email} (ID: ${driver.id})`);

  const socket = io('https://api.fimchile.cl', { transports: ['websocket', 'polling'] });

  socket.on('connect', () => {
    console.log('✅ Conectado a la API de producción. Emitiendo driver:online...');
    socket.emit('driver:online', {
      driverId: driver.id,
      lat: -33.4489,
      lng: -70.6693
    });
  });

  socket.on('error', (err) => {
    console.log('❌ Error del socket:', err);
  });

  socket.on('trip:request', (data) => {
    console.log('\n🚨🚨🚨 ¡VIAJE ENTRANTE RECIBIDO EN EL ESPÍA! 🚨🚨🚨');
    console.log(JSON.stringify(data, null, 2));
    console.log('----------------------------------------------------');
  });

  socket.on('disconnect', () => {
    console.log('🔌 Desconectado');
  });
}

startSpy();
