import Redis from 'ioredis';
import prisma from './prisma';

const redisUrl = process.env.REDIS_URL;

let redis: Redis | null = null;
const memoryFallback = new Map<string, any>();

if (redisUrl) {
  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
    });
    redis.on('connect', () => console.log('🔌 [Redis] Conectado exitosamente'));
    redis.on('error', (err) => {
      console.error('❌ [Redis] Error de conexión, usando fallback en memoria:', err.message);
    });
  } catch (err) {
    console.error('❌ [Redis] Error al inicializar:', err);
  }
} else {
  console.warn('⚠️ [Redis] REDIS_URL no está definida. Se usará un fallback en memoria para geolocalización local.');
}

export default redis;

// Amortiguador de actualizaciones a la base de datos (máximo una vez cada 5 minutos por conductor)
const lastDbUpdate = new Map<string, number>();

export async function updateDriverLocationDbThrottled(driverId: string, lat: number, lng: number): Promise<void> {
  const now = Date.now();
  const lastUpdate = lastDbUpdate.get(driverId) || 0;
  // 5 minutos = 300,000 ms
  if (now - lastUpdate > 300000) {
    lastDbUpdate.set(driverId, now);
    try {
      await prisma.driver.update({
        where: { id: driverId },
        data: { lastLat: lat, lastLng: lng, lastSeen: new Date() }
      });
      console.log(`💾 [Prisma] Persistido GPS de conductor ${driverId} a DB (amortiguado)`);
    } catch (err) {
      console.error(`[Prisma] Error en actualización amortiguada para conductor ${driverId}:`, err);
    }
  }
}

// Guardar ubicación
export async function setDriverLocationInRedis(driverId: string, lat: number, lng: number): Promise<void> {
  const data = {
    lat: lat.toString(),
    lng: lng.toString(),
    lastSeen: new Date().toISOString()
  };

  if (redis && redis.status === 'ready') {
    try {
      await redis.hset(`driver:location:${driverId}`, data);
      await redis.expire(`driver:location:${driverId}`, 86400); // 24 horas
      return;
    } catch (err) {
      console.error('[Redis] Error al guardar ubicación, usando fallback:', err);
    }
  }

  // Fallback en memoria
  memoryFallback.set(`driver:location:${driverId}`, data);
}

// Recuperar ubicación
export async function getDriverLocationFromRedis(driverId: string): Promise<{ lat: number; lng: number; lastSeen: string } | null> {
  if (redis && redis.status === 'ready') {
    try {
      const data = await redis.hgetall(`driver:location:${driverId}`);
      if (data && data.lat && data.lng) {
        return {
          lat: parseFloat(data.lat),
          lng: parseFloat(data.lng),
          lastSeen: data.lastSeen
        };
      }
      return null;
    } catch (err) {
      console.error('[Redis] Error al recuperar ubicación, usando fallback:', err);
    }
  }

  // Fallback en memoria
  const data = memoryFallback.get(`driver:location:${driverId}`);
  if (data) {
    return {
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lng),
      lastSeen: data.lastSeen
    };
  }
  return null;
}

// Eliminar ubicación
export async function removeDriverLocationFromRedis(driverId: string): Promise<void> {
  if (redis && redis.status === 'ready') {
    try {
      await redis.del(`driver:location:${driverId}`);
      return;
    } catch (err) {
      console.error('[Redis] Error al eliminar ubicación de Redis:', err);
    }
  }
  memoryFallback.delete(`driver:location:${driverId}`);
}
