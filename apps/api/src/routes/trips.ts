import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { calculateDistance, calculateTripPrice, estimateDuration, roundCLP } from '../utils/pricing';
import { cancelActiveSearch } from '../socket/handlers';

const router = Router();

// ─── SOLICITAR VIAJE ──────────────────────────────────────────────────────
router.post('/request', requireAuth, requireRole('passenger'), async (req: Request, res: Response) => {
  try {
    // Verificar si el pasajero está aprobado/verificado
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { isVerified: true }
    });
    if (!user || !user.isVerified) {
      return res.status(403).json({ error: 'Tu cuenta aún no ha sido verificada por el administrador. Debes esperar la validación de tus documentos para pedir viajes.' });
    }

    const {
      originLat, originLng, originAddress,
      destLat, destLng, destAddress,
      paymentMethod,
      passengerCount,
    } = req.body;

    const count = Number(passengerCount) || 1;
    if (count < 1 || count > 4) {
      return res.status(400).json({ error: 'El número de pasajeros debe estar entre 1 y 4.' });
    }

    const distanceKm = calculateDistance(originLat, originLng, destLat, destLng) * 1.3;
    const durationMin = estimateDuration(distanceKm);
    let estimatedPrice = calculateTripPrice(distanceKm, durationMin);

    // 50% de Descuento en el PRIMER viaje del pasajero (Tope $8.000)
    const pastTripsCount = await prisma.trip.count({ where: { passengerId: req.user!.id } });
    let isDiscounted = false;
    if (pastTripsCount === 0) {
      const discount = Math.min(roundCLP(estimatedPrice * 0.5), 8000);
      estimatedPrice = roundCLP(estimatedPrice - discount);
      isDiscounted = true;
    }

    // Cobro de TAG automático si el viaje es de más de 5.0 km reales
    const isTagApplied = distanceKm > 5.0;
    if (isTagApplied) {
      estimatedPrice += 1500;
    }

    // Ajustar el precio base al precio de la tarjeta (aplicar recargo del 3.19% de forma general)
    estimatedPrice = roundCLP(estimatedPrice * 1.0319);

    const finalDestAddress = isTagApplied ? `${destAddress} (Incluye TAG)` : destAddress;

    const trip = await prisma.trip.create({
      data: {
        passengerId: req.user!.id,
        originLat, originLng, originAddress,
        destLat, destLng, destAddress: finalDestAddress,
        distanceKm,
        durationMin,
        estimatedPrice,
        isDiscounted,
        paymentMethod: paymentMethod || 'cash',
        status: 'searching',
        passengerCount: count,
      },
      include: { passenger: { select: { id: true, name: true, phone: true } } },
    });

    return res.status(201).json({ trip });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al crear el viaje' });
  }
});

// ─── PRECIO ESTIMADO (SIN CREAR VIAJE) ───────────────────────────────────
router.post('/estimate', requireAuth, async (req: Request, res: Response) => {
  try {
    const { originLat, originLng, destLat, destLng } = req.body;
    const distanceKm = calculateDistance(originLat, originLng, destLat, destLng) * 1.3;
    const durationMin = estimateDuration(distanceKm);
    let estimatedPrice = calculateTripPrice(distanceKm, durationMin);

    // 50% de Descuento en el PRIMER viaje del pasajero (Tope $8.000)
    const pastTripsCount = await prisma.trip.count({ where: { passengerId: req.user!.id } });
    let isDiscounted = false;
    if (pastTripsCount === 0) {
      const discount = Math.min(roundCLP(estimatedPrice * 0.5), 8000);
      estimatedPrice = roundCLP(estimatedPrice - discount);
      isDiscounted = true;
    }

    // Cobro de TAG automático si el viaje es de más de 5.0 km reales
    const isTagApplied = distanceKm > 5.0;
    if (isTagApplied) {
      estimatedPrice += 1500;
    }

    // Ajustar el precio base al precio de la tarjeta (aplicar recargo del 3.19% de forma general)
    estimatedPrice = roundCLP(estimatedPrice * 1.0319);

    return res.json({ distanceKm, durationMin, estimatedPrice, isDiscounted });
  } catch (err) {
    return res.status(500).json({ error: 'Error al calcular precio' });
  }
});

// ─── OBTENER VIAJE ACTIVO ────────────────────────────────────────────────
router.get('/active', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;

    if (role === 'driver') {
      const trip = await prisma.trip.findFirst({
        where: {
          driverId: userId,
          status: { in: ['driver_assigned', 'driver_arrived', 'in_progress'] },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          passenger: { select: { id: true, name: true, phone: true } },
        },
      });
      return res.json({ trip });
    } else {
      const trip = await prisma.trip.findFirst({
        where: {
          passengerId: userId,
          status: { in: ['searching', 'driver_assigned', 'driver_arrived', 'in_progress'] },
        },
        orderBy: { createdAt: 'desc' },
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
        },
      });
      return res.json({ trip });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al obtener viaje activo' });
  }
});

// ─── HISTORIAL PASAJERO ───────────────────────────────────────────────────
router.get('/my-trips', requireAuth, requireRole('passenger'), async (req: Request, res: Response) => {
  try {
    const trips = await prisma.trip.findMany({
      where: { passengerId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: {
        driver: { select: { id: true, name: true, phone: true, vehicleBrand: true, vehicleModel: true, vehiclePlate: true, totalRating: true } },
        rating: true,
      },
    });
    return res.json({ trips });
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// ─── HISTORIAL CONDUCTOR ──────────────────────────────────────────────────
router.get('/driver-trips', requireAuth, requireRole('driver'), async (req: Request, res: Response) => {
  try {
    const trips = await prisma.trip.findMany({
      where: { driverId: req.user!.id, status: 'completed' },
      orderBy: { createdAt: 'desc' },
      include: {
        passenger: { select: { id: true, name: true, phone: true } },
        rating: true,
      },
    });

    const totalEarnings = trips.reduce((sum: number, t: any) => sum + (t.finalPrice || t.estimatedPrice), 0);

    return res.json({ trips, totalEarnings });
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// ─── CANCELAR VIAJE ───────────────────────────────────────────────────────
router.post('/:id/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const role = req.user!.role;

    const trip = await prisma.trip.findUnique({ where: { id } });
    if (!trip) return res.status(404).json({ error: 'Viaje no encontrado' });

    if (!['searching', 'driver_assigned', 'driver_arrived'].includes(trip.status)) {
      return res.status(400).json({ error: 'No se puede cancelar en este estado' });
    }

    if (trip.status === 'searching') {
      cancelActiveSearch(id);
    }

    const updated = await prisma.trip.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledBy: role,
        cancelReason: reason,
        cancelledAt: new Date(),
      },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`trip:${id}`).emit('trip:cancelled', {
        tripId: id,
        cancelledBy: role,
        reason: role === 'passenger' ? 'El pasajero ha cancelado el viaje' : (reason || 'Cancelado por el conductor'),
      });
    }

    // Enviar push notification al cancelar
    const userToNotifyId = role === 'passenger' ? trip.driverId : trip.passengerId;
    if (userToNotifyId) {
      if (role === 'passenger') {
        prisma.driver.findUnique({
          where: { id: userToNotifyId },
          select: { fcmToken: true }
        }).then(driver => {
          if (driver && driver.fcmToken) {
            const { sendPushNotification } = require('../utils/firebase');
            sendPushNotification(
              driver.fcmToken,
              "Viaje Cancelado",
              "El pasajero ha cancelado el viaje",
              { tripId: id, type: 'trip_cancelled' }
            );
          }
        }).catch(console.error);
      } else {
        prisma.user.findUnique({
          where: { id: userToNotifyId },
          select: { fcmToken: true }
        }).then(user => {
          if (user && user.fcmToken) {
            const { sendPushNotification } = require('../utils/firebase');
            sendPushNotification(
              user.fcmToken,
              "Viaje Cancelado",
              `El conductor canceló el viaje: "${reason || 'Sin motivo especificado'}"`,
              { tripId: id, type: 'trip_cancelled' }
            );
          }
        }).catch(console.error);
      }
    }

    return res.json({ trip: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Error al cancelar' });
  }
});

// ─── CALIFICAR VIAJE ─────────────────────────────────────────────────────
router.post('/:id/rate', requireAuth, requireRole('passenger'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { driverScore, driverComment } = req.body;

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: { rating: true },
    });

    if (!trip || trip.passengerId !== req.user!.id) {
      return res.status(404).json({ error: 'Viaje no encontrado' });
    }
    if (trip.status !== 'completed') {
      return res.status(400).json({ error: 'Solo puedes calificar viajes completados' });
    }
    if (trip.rating) {
      return res.status(409).json({ error: 'Ya calificaste este viaje' });
    }
    if (!trip.driverId) return res.status(400).json({ error: 'Sin conductor asignado' });

    const rating = await prisma.rating.create({
      data: {
        tripId: id,
        passengerId: req.user!.id,
        driverId: trip.driverId,
        driverScore,
        driverComment,
      },
    });

    // Actualizar rating promedio del conductor
    const allRatings = await prisma.rating.findMany({ where: { driverId: trip.driverId } });
    const avgRating = allRatings.reduce((s: number, r: any) => s + r.driverScore, 0) / allRatings.length;
    await prisma.driver.update({
      where: { id: trip.driverId },
      data: { totalRating: avgRating, totalTrips: { increment: 1 } },
    });

    return res.status(201).json({ rating });
  } catch (err) {
    return res.status(500).json({ error: 'Error al calificar' });
  }
});

// ─── GOOGLE MAPS / NOMINATIM GEOPROXY ──────────────────────────────────────
router.get('/autocomplete', requireAuth, async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    const originLat = req.query.originLat ? Number(req.query.originLat) : null;
    const originLng = req.query.originLng ? Number(req.query.originLng) : null;

    if (!q || q.trim().length < 3) {
      return res.json({ predictions: [] });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      // Usar Google Places Autocomplete API
      let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(q)}&key=${apiKey}&components=country:cl&language=es`;
      if (originLat && originLng) {
        url += `&location=${originLat},${originLng}&radius=20000`; // Sesgar a 20km alrededor del origen
      }
      const response = await fetch(url);
      const data: any = await response.json();
      
      if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Google Autocomplete ERROR:', data.status, data.error_message || '');
      }

      const predictions = (data.predictions || []).map((p: any) => ({
        id: p.place_id,
        description: p.description,
        isGoogle: true
      }));
      return res.json({ predictions });
    } else {
      // Fallback a Nominatim (OpenStreetMap)
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=cl&limit=6&addressdetails=1`;
      if (originLat && originLng) {
        url += `&lat=${originLat}&lon=${originLng}`;
      }
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Fim-App-API/1.0 (contact@fim.cl)' }
      });
      const data: any = await response.json();
      const predictions = (data || []).map((item: any) => {
        const addr = item.address;
        const street = addr?.road || addr?.pedestrian || addr?.footway || item.display_name.split(',')[0];
        const number = addr?.house_number ? ` ${addr.house_number}` : '';
        const comuna = addr?.suburb || addr?.neighbourhood || addr?.city_district || addr?.town || addr?.city || '';
        const description = `${street}${number}, ${comuna}`.trim().replace(/^,\s*|,\s*$/g, '') || item.display_name;
        return {
          id: `osm:${item.place_id}`,
          description,
          lat: Number(item.lat),
          lng: Number(item.lon),
          isGoogle: false
        };
      });
      return res.json({ predictions });
    }
  } catch (err) {
    console.error('Error in /autocomplete proxy:', err);
    return res.status(500).json({ error: 'Error al buscar direcciones' });
  }
});

router.get('/place-details', requireAuth, async (req: Request, res: Response) => {
  try {
    const placeId = req.query.placeId as string;
    if (!placeId) {
      return res.status(400).json({ error: 'placeId requerido' });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      // Usar Google Place Details API
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=geometry,formatted_address`;
      const response = await fetch(url);
      const data: any = await response.json();
      
      if (data.status && data.status !== 'OK') {
        console.error('Google Place Details ERROR:', data.status, data.error_message || '');
      }

      if (data.result && data.result.geometry && data.result.geometry.location) {
        const { lat, lng } = data.result.geometry.location;
        return res.json({
          lat,
          lng,
          address: data.result.formatted_address || ''
        });
      }
      return res.status(404).json({ error: 'Ubicación no encontrada' });
    } else {
      return res.status(400).json({ error: 'Google API key no configurada' });
    }
  } catch (err) {
    console.error('Error in /place-details proxy:', err);
    return res.status(500).json({ error: 'Error al obtener detalles del lugar' });
  }
});

router.get('/reverse-geocode', requireAuth, async (req: Request, res: Response) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Coordenadas lat/lng requeridas y deben ser números' });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      // Usar Google Geocoding API
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=es`;
      const response = await fetch(url);
      const data: any = await response.json();
      
      if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Google Geocoding ERROR:', data.status, data.error_message || '');
      }

      if (data.results && data.results.length > 0) {
        const address = data.results[0].formatted_address;
        return res.json({ address });
      }
      return res.status(404).json({ error: 'Dirección no encontrada' });
    } else {
      // Fallback a Nominatim Reverse Geocoding
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Fim-App-API/1.0 (contact@fim.cl)' }
      });
      const data: any = await response.json();
      if (data && data.display_name) {
        const addr = data.address;
        const street = addr?.road || addr?.pedestrian || addr?.footway || data.display_name.split(',')[0];
        const number = addr?.house_number ? ` ${addr.house_number}` : '';
        const comuna = addr?.suburb || addr?.neighbourhood || addr?.city_district || addr?.town || addr?.city || '';
        const address = `${street}${number}, ${comuna}`.trim().replace(/^,\s*|,\s*$/g, '') || data.display_name;
        return res.json({ address });
      }
      return res.status(404).json({ error: 'Dirección no encontrada' });
    }
  } catch (err) {
    console.error('Error in /reverse-geocode proxy:', err);
    return res.status(500).json({ error: 'Error al realizar geocodificación inversa' });
  }
});

export default router;

