import { Server, Socket } from 'socket.io';
import prisma from '../utils/prisma';
import { calculateDistance } from '../utils/pricing';

// ─── Mapa de conductores online ───────────────────────────────────────────
// driverId -> { socketId, lat, lng }
const onlineDrivers = new Map<string, { socketId: string; lat: number; lng: number }>();

import { setDriverLocationInRedis, removeDriverLocationFromRedis, updateDriverLocationDbThrottled } from '../utils/redis';

export async function updateDriverLocation(driverId: string, lat: number, lng: number) {
  // 1. Actualizar el mapa local en memoria si está online
  const driverSock = onlineDrivers.get(driverId);
  if (driverSock) {
    driverSock.lat = lat;
    driverSock.lng = lng;
  }

  // 2. Guardar en caché Redis
  await setDriverLocationInRedis(driverId, lat, lng);

  // 3. Persistencia amortiguada en PostgreSQL (máx. cada 5 min)
  await updateDriverLocationDbThrottled(driverId, lat, lng);

  // 4. Si tiene un viaje activo, notificar al pasajero en tiempo real
  if (ioInstance) {
    const activeTrip = await prisma.trip.findFirst({
      where: {
        driverId,
        status: { in: ['driver_assigned', 'driver_arrived', 'in_progress'] },
      },
      orderBy: { createdAt: 'desc' },
    }).catch(() => null);

    if (activeTrip) {
      ioInstance.to(`trip:${activeTrip.id}`).emit('driver:moved', { lat, lng });
    }
  }
}

let ioInstance: Server | null = null;

// ─── Mapa de viajes activos con búsqueda ─────────────────────────────────
// tripId -> { passengerId, passengerSocketId, driversNotified: Set<driverId>, currentDriverId, currentDriverSocketId }
const activeSearches = new Map<string, {
  passengerId: string;
  passengerSocketId: string;
  driversNotified: Set<string>;
  currentDriverId?: string;
  currentDriverSocketId?: string;
  timer?: NodeJS.Timeout;
}>();

export function cancelActiveSearch(tripId: string, reason?: string) {
  const search = activeSearches.get(tripId);
  if (search) {
    if (search.timer) clearTimeout(search.timer);
    if (search.currentDriverId && ioInstance) {
      ioInstance.to(`driver:${search.currentDriverId}`).emit('trip:cancelled', {
        tripId,
        reason: reason || 'El pasajero canceló la solicitud antes de ser aceptada.'
      });
    }
    activeSearches.delete(tripId);
    console.log(`[Socket] Búsqueda activa cancelada para viaje ${tripId}`);
  }
}

export function setupSocketHandlers(io: Server) {
  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Conectado: ${socket.id}`);

    // ─── CONDUCTOR: se conecta y anuncia su posición ───────────────────────
    socket.on('driver:online', async ({ driverId, lat, lng }: { driverId: string; lat: number; lng: number }) => {
      onlineDrivers.set(driverId, { socketId: socket.id, lat, lng });
      socket.data.driverId = driverId;
      socket.join(`driver:${driverId}`);

      await prisma.driver.update({
        where: { id: driverId },
        data: { isOnline: true, lastLat: lat, lastLng: lng, lastSeen: new Date() },
      }).catch(console.error);

      // Guardar en caché Redis
      await setDriverLocationInRedis(driverId, lat, lng);

      console.log(`[Socket] Conductor ${driverId} en línea en (${lat}, ${lng})`);
    });

    // ─── CONDUCTOR: se desconecta manualmente ──────────────────────────────
    socket.on('driver:offline', async ({ driverId }: { driverId: string }) => {
      const driverData = onlineDrivers.get(driverId);
      let finalLat = driverData?.lat;
      let finalLng = driverData?.lng;

      onlineDrivers.delete(driverId);
      socket.leave(`driver:${driverId}`);

      await prisma.driver.update({
        where: { id: driverId },
        data: { 
          isOnline: false,
          ...(finalLat !== undefined ? { lastLat: finalLat } : {}),
          ...(finalLng !== undefined ? { lastLng: finalLng } : {}),
          lastSeen: new Date()
        },
      }).catch(console.error);

      // Eliminar caché de Redis
      await removeDriverLocationFromRedis(driverId);

      console.log(`[Socket] Conductor ${driverId} fuera de línea`);
    });

    // ─── CONDUCTOR: actualiza posición ────────────────────────────────────
    socket.on('driver:location', async ({ driverId, lat, lng }: { driverId: string; lat: number; lng: number }) => {
      await updateDriverLocation(driverId, lat, lng);
    });

    // ─── PASAJERO: se une a su sala de viaje ──────────────────────────────
    socket.on('passenger:join-trip', ({ tripId }: { tripId: string }) => {
      socket.join(`trip:${tripId}`);
      socket.data.tripId = tripId;
    });

    // ─── PASAJERO: solicita un viaje ──────────────────────────────────────
    socket.on('trip:search', async ({ tripId, passengerId, originLat, originLng }: {
      tripId: string;
      passengerId: string;
      originLat: number;
      originLng: number;
    }) => {
      console.log(`[Socket] Solicitud de viaje recibida: Trip=${tripId}, Pax=${passengerId} en (${originLat}, ${originLng})`);
      console.log(`[Socket] Conductores online actualmente: ${onlineDrivers.size}`);

      socket.join(`trip:${tripId}`);

      activeSearches.set(tripId, {
        passengerId,
        passengerSocketId: socket.id,
        driversNotified: new Set(),
      });

      await findAndNotifyDriver(io, tripId, originLat, originLng);
    });

    // ─── CONDUCTOR: acepta el viaje ───────────────────────────────────────
    socket.on('driver:accept', async ({ tripId, driverId }: { tripId: string; driverId: string }) => {
      const search = activeSearches.get(tripId);
      if (!search) {
        socket.emit('trip:cancelled', {
          tripId,
          reason: 'Este viaje ya no está disponible o fue cancelado por el pasajero.'
        });
        return;
      }

      // Ignorar si el conductor que acepta no es el asignado actualmente
      if (search.currentDriverId !== driverId) return;

      // Limpiar timer de timeout
      if (search.timer) clearTimeout(search.timer);
      activeSearches.delete(tripId);

      try {
        // Asignar conductor al viaje
        const trip = await prisma.trip.update({
          where: { id: tripId },
          data: {
            driverId,
            status: 'driver_assigned',
            acceptedAt: new Date(),
            otpCode: Math.floor(1000 + Math.random() * 9000).toString(), // 4 dígitos
          },
          include: {
            driver: {
              select: {
                id: true, name: true, phone: true,
                vehicleBrand: true, vehicleModel: true,
                vehiclePlate: true, vehiclePhotoUrl: true,
                totalRating: true, totalTrips: true,
                lastLat: true, lastLng: true,
                mercadoPagoLink: true,
                membershipPlan: true,
              },
            },
            passenger: { select: { id: true, name: true, phone: true } },
          },
        });

        socket.join(`trip:${tripId}`);

        // Notificar al pasajero que fue aceptado
        io.to(`trip:${tripId}`).emit('trip:accepted', { trip });
        // Notificar al conductor confirmación
        socket.emit('trip:confirmed', { trip });

        console.log(`[Socket] Viaje ${tripId} aceptado por conductor ${driverId}`);
      } catch (err) {
        console.error('[Socket] Error aceptando viaje:', err);
      }
    });

    // ─── CONDUCTOR: rechaza el viaje (buscar otro conductor) ──────────────
    socket.on('driver:reject', async ({ tripId, driverId, originLat, originLng }: {
      tripId: string; driverId: string; originLat: number; originLng: number;
    }) => {
      const search = activeSearches.get(tripId);
      if (!search) return;

      // Ignorar si el conductor que rechaza no es el asignado actualmente
      if (search.currentDriverId !== driverId) return;

      search.driversNotified.add(driverId);
      if (search.timer) clearTimeout(search.timer);

      // Buscar siguiente conductor disponible
      await findAndNotifyDriver(io, tripId, originLat, originLng);
    });

    // ─── CONDUCTOR: inició viaje (requiere OTP) ──────────────────────────
    socket.on('driver:start-trip', async ({ tripId, otpCode }: { tripId: string; otpCode: string }) => {
      try {
        const trip = await prisma.trip.findUnique({ where: { id: tripId } });
        if (!trip) return;

        if (trip.otpCode !== otpCode) {
          return socket.emit('error', { message: 'Código de seguridad incorrecto. Pídelo al pasajero.' });
        }

        const updated = await prisma.trip.update({
          where: { id: tripId },
          data: { status: 'in_progress', startedAt: new Date() },
        });

        io.to(`trip:${tripId}`).emit('trip:started', { trip: updated });
        console.log(`[Socket] Viaje ${tripId} iniciado con éxito`);
      } catch (err) {
        console.error('[Socket] Error iniciando viaje:', err);
      }
    });

    // ─── CONDUCTOR: llegó al punto de recogida ────────────────────────────
    socket.on('driver:arrived', async ({ tripId }: { tripId: string }) => {
      await prisma.trip.update({
        where: { id: tripId },
        data: { status: 'driver_arrived', driverArrivedAt: new Date() },
      }).catch(console.error);

      io.to(`trip:${tripId}`).emit('trip:driver-arrived', { tripId });
    });

    // ─── CONDUCTOR: solicita pago al pasajero ───────────────────────────
    socket.on('trip:request-payment', async ({ tripId }: { tripId: string }) => {
      console.log(`[Socket] Conductor solicita pago para viaje ${tripId}`);
      try {
        const completionOtp = Math.floor(1000 + Math.random() * 9000).toString(); // 4 dígitos
        await prisma.trip.update({
          where: { id: tripId },
          data: { 
            paymentStatus: 'requested',
            otpCode: completionOtp, // Reutilizar otpCode para código de término
          },
        });
        io.to(`trip:${tripId}`).emit('trip:payment-requested', { otpCode: completionOtp });
      } catch (err) {
        console.error('Error updating paymentStatus to requested:', err);
      }
    });

    // ─── CONDUCTOR: verifica código de término del viaje ───────────────────
    socket.on('driver:verify-completion-otp', async ({ tripId, otpCode }: { tripId: string, otpCode: string }) => {
      console.log(`[Socket] Conductor verifica código de término para viaje ${tripId}: ${otpCode}`);
      try {
        const trip = await prisma.trip.findUnique({ where: { id: tripId } });
        if (!trip) return;

        if (trip.otpCode !== otpCode) {
          return socket.emit('trip:completion-otp-failed', { message: 'Código de término incorrecto. Solicítaselo al pasajero.' });
        }

        const updated = await prisma.trip.update({
          where: { id: tripId },
          data: { paymentStatus: 'otp_verified' },
        });

        io.to(`trip:${tripId}`).emit('trip:completion-otp-verified', { trip: updated });
        console.log(`[Socket] Código de término verificado con éxito para viaje ${tripId}`);
      } catch (err) {
        console.error('[Socket] Error verificando código de término:', err);
      }
    });

    // ─── CHAT EN VIVO: Mensajes de texto ──────────────────────────────────
    socket.on('trip:message', (data: { tripId: string, senderId: string, senderName: string, text: string }) => {
      console.log(`[Socket] Mensaje de chat recibido para viaje ${data.tripId} de ${data.senderName}: ${data.text}`);
      io.to(`trip:${data.tripId}`).emit('trip:message', {
        ...data,
        timestamp: new Date().toISOString()
      });
    });

    // ─── PASAJERO: confirma que envió el pago ─────────────────────────────
    socket.on('trip:passenger-confirmed-payment', async ({ tripId, receiptUrl }: { tripId: string, receiptUrl?: string }) => {
      console.log(`[Socket] Pasajero confirma pago para viaje ${tripId}`);
      try {
        await prisma.trip.update({
          where: { id: tripId },
          data: { paymentStatus: 'passenger_confirmed' },
        });
      } catch (err) {
        console.error('Error updating paymentStatus to passenger_confirmed:', err);
      }
      io.to(`trip:${tripId}`).emit('trip:passenger-confirmed-payment', { receiptUrl });
    });


    // ─── REPORTE DE SEGURIDAD ─────────────────────────────────────────────
    socket.on('safety:report', async (data: { tripId: string, reporterId: string, reportedUserId: string, reason: string, description: string }) => {
      try {
        console.warn(`🚨 [REPORTE DE SEGURIDAD] Viaje: ${data.tripId} | Reportado por: ${data.reporterId} | Hacia: ${data.reportedUserId} | Razón: ${data.reason} | Descripción: ${data.description}`);
        console.log(`[Socket] REPORTE DE SEGURIDAD RECIBIDO para viaje ${data.tripId}`);
        socket.emit('safety:report-received', { success: true });
      } catch (err) {
        console.error('[Socket] Error al guardar reporte:', err);
      }
    });

    // ─── CONDUCTOR: completó el viaje ──────────────────────────────────────
    socket.on('trip:complete', async ({ tripId }: { tripId: string }) => {
      try {
        const trip = await prisma.trip.update({
          where: { id: tripId },
          data: {
            status: 'completed',
            completedAt: new Date(),
            isPaid: true,
            paymentStatus: 'paid',
          },
        });

        // Actualizar estadísticas del conductor
        await prisma.driver.update({
          where: { id: trip.driverId! },
          data: {
            totalTrips: { increment: 1 },
          }
        });

        io.to(`trip:${tripId}`).emit('trip:completed', {
          tripId,
          finalPrice: trip.estimatedPrice,
          paymentMethod: trip.paymentMethod,
        });

        console.log(`[Socket] Viaje ${tripId} completado. Precio: $${trip.estimatedPrice}`);
      } catch (err) {
        console.error('[Socket] Error completando viaje:', err);
      }
    });

    // ─── DESCONEXIÓN ──────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      const driverId = socket.data.driverId;
      if (driverId) {
        const driverData = onlineDrivers.get(driverId);
        let finalLat = driverData?.lat;
        let finalLng = driverData?.lng;

        onlineDrivers.delete(driverId);
        
        await prisma.driver.update({
          where: { id: driverId },
          data: { 
            isOnline: false,
            ...(finalLat !== undefined ? { lastLat: finalLat } : {}),
            ...(finalLng !== undefined ? { lastLng: finalLng } : {}),
            lastSeen: new Date()
          },
        }).catch(console.error);

        // Eliminar caché de Redis
        await removeDriverLocationFromRedis(driverId);

        console.log(`[Socket] Conductor ${driverId} desconectado`);
      }
    });
  });
}

// ─── BUSCAR Y NOTIFICAR AL CONDUCTOR MÁS CERCANO ─────────────────────────
async function findAndNotifyDriver(
  io: Server,
  tripId: string,
  originLat: number,
  originLng: number,
) {
  const search = activeSearches.get(tripId);
  if (!search) return;

  // Obtener conductores activos no notificados aún
  const availableDrivers = Array.from(onlineDrivers.entries())
    .filter(([dId]) => !search.driversNotified.has(dId))
    .map(([dId, data]) => ({
      driverId: dId,
      socketId: data.socketId,
      distance: calculateDistance(originLat, originLng, data.lat, data.lng),
      lat: data.lat,
      lng: data.lng,
    }))
    .sort((a, b) => a.distance - b.distance);

  console.log(`[Socket] Conductores disponibles filtrados: ${availableDrivers.length}`);
  availableDrivers.forEach(d => console.log(` - Conductor ${d.driverId} a ${d.distance.toFixed(2)}km`));

  if (availableDrivers.length === 0) {
    // No hay conductores disponibles
    await prisma.trip.update({
      where: { id: tripId },
      data: { status: 'cancelled', cancelReason: 'Sin conductores disponibles', cancelledAt: new Date() },
    }).catch(console.error);

    io.to(`trip:${tripId}`).emit('trip:no-drivers', { tripId });
    activeSearches.delete(tripId);
    return;
  }

  const nearest = availableDrivers[0];
  search.driversNotified.add(nearest.driverId);
  search.currentDriverId = nearest.driverId;
  search.currentDriverSocketId = nearest.socketId;

  // Obtener datos del viaje para enviarlo al conductor
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { passenger: { select: { name: true, phone: true } } },
  }).catch(() => null);

  if (!trip) return;

  // Notificar al conductor con timer de 30 segundos
  io.to(nearest.socketId).emit('trip:request', {
    trip: {
      ...trip,
      driverDistance: nearest.distance,
    },
  });

  // Si el conductor no responde en 30 segundos, pasar al siguiente
  search.timer = setTimeout(() => {
    const currentSearch = activeSearches.get(tripId);
    if (currentSearch) {
      findAndNotifyDriver(io, tripId, originLat, originLng);
    }
  }, 30000);
}
