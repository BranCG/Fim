const io = require('socket.io-client');

async function startAdminSpy() {
  console.log(`🕵️‍♂️ Iniciando espía como ADMIN...`);

  const socket = io('https://api.fimchile.cl', { transports: ['websocket', 'polling'] });

  socket.on('connect', () => {
    console.log('✅ Conectado a la API de producción. Solicitando admin:join...');
    socket.emit('admin:join');
    
    // El backend emite la lista de conductores cuando alguien se une o se actualiza
    setTimeout(() => {
      console.log('Esperando eventos de conductores...');
    }, 1000);
  });

  socket.on('error', (err) => {
    console.log('❌ Error del socket:', err);
  });

  socket.on('admin:online-drivers', (data) => {
    console.log('\n📊 ESTADO DE CONDUCTORES EN VIVO:');
    console.log(`Número de conductores en línea: ${data.length}`);
    console.log(JSON.stringify(data, null, 2));
    console.log('----------------------------------------------------');
    process.exit(0);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Desconectado');
  });
}

startAdminSpy();
