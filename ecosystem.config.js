module.exports = {
  apps: [
    {
      name: 'fim-api',
      script: 'apps/api/dist/index.js',
      instances: 1, // Usar 1 para mantener consistencia de sockets en memoria. Para escalar a 'max', configurar socket.io-redis adapter.
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '800M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
