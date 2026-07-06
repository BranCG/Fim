import { Router } from 'express';
import prisma from '../utils/prisma';
import { preapproval } from '../utils/mercadopago';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { roundCLP } from '../utils/pricing';
import { sendAdminPaymentNotification } from '../utils/mailer';
import dotenv from 'dotenv';
dotenv.config();

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || '', 
  options: { timeout: 5000 } 
});

const preference = new Preference(client);

const router = Router();

// ─── PAGO DE MEMBRESÍA BLACK / FLEX (Mercado Pago) ──────────────────────────
router.post('/membership/create-preference', async (req, res) => {
  try {
    const { driverId, email, plan } = req.body;
    if (!driverId || !email || !plan) {
      return res.status(400).json({ error: 'Faltan datos' });
    }

    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) return res.status(404).json({ error: 'Conductor no encontrado' });
    if (plan !== 'COMFORT' && driver.membershipPaid) {
      return res.status(400).json({ error: 'El conductor ya tiene membresía pagada' });
    }

    const configs = await prisma.systemConfig.findMany({
      where: { key: { in: ['membership_black_promo_price', 'membership_flex_promo_price', 'membership_comfort_promo_price'] } }
    });
    const configMap = configs.reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {});
    
    const blackPrice = parseInt((configMap.membership_black_promo_price || '49990').toString().replace(/\D/g, ''), 10);
    const flexPrice = parseInt((configMap.membership_flex_promo_price || '19990').toString().replace(/\D/g, ''), 10);
    const comfortPrice = parseInt((configMap.membership_comfort_promo_price || '8990').toString().replace(/\D/g, ''), 10);

    const planConfig: Record<string, { title: string; amount: number }> = {
      BLACK: { title: 'Membresía BLACK Fim — Acceso Mensual Ilimitado', amount: blackPrice },
      FLEX: { title: 'Membresía FLEX Fim — Fin de Semana (Vie-Sáb-Dom)', amount: flexPrice },
      COMFORT: { title: 'Cuota Diaria COMFORT Fim', amount: comfortPrice },
    };

    const config = planConfig[plan];
    let finalAmount = config.amount;
    const goal = plan === 'BLACK' ? 150 : 0;
    const hasDiscount = (driver.nextDiscount !== undefined && driver.nextDiscount > 0) || (driver.membershipProgress >= goal);
    
    if (hasDiscount && plan === 'BLACK') {
      finalAmount = Math.round(finalAmount * 0.8); // 20% dcto
    }

    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';

    const response = await preference.create({
      body: {
        items: [{ id: driverId, title: config.title, quantity: 1, unit_price: finalAmount, currency_id: 'CLP' }],
        payer: { email },
        back_urls: {
          success: `${baseUrl}/driver/membership-success?plan=${plan}`,
          failure: `${baseUrl}/driver/membership-failure`,
          pending: `${baseUrl}/driver/membership-pending`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.API_URL || 'http://localhost:3001'}/payments/membership-webhook`,
        external_reference: `${driverId}|${plan}`,
      }
    });

    // Guardar referencia de pago pendiente
    await prisma.driver.update({ where: { id: driverId }, data: { mpSubscriptionId: response.id } });

    res.json({ init_point: response.init_point, preferenceId: response.id });
  } catch (error) {
    console.error('Error al crear preferencia de membresía:', error);
    res.status(500).json({ error: 'Error interno al generar link de pago' });
  }
});

// ─── WEBHOOK DE MEMBRESÍA (recibe notificación de MP) ────────────────────────
router.post('/membership-webhook', async (req, res) => {
  try {
    const paymentId = req.query['data.id'] || req.body?.data?.id;
    const type = req.query.type || req.body?.type;

    console.log('🔔 Webhook membresía recibido:', { type, paymentId });

    if (type === 'payment' && paymentId) {
      const externalRef = req.body?.external_reference as string;
      if (externalRef) {
        const [driverId, plan] = externalRef.split('|');
        if (driverId && plan) {
          const driver = await prisma.driver.findUnique({ where: { id: driverId } });
          if (driver) {
            const now = new Date();
            const newStatus = driver.status === 'approved' ? 'active' : driver.status;

            if (plan === 'COMFORT') {
              const newDebt = Math.max(0, driver.comfortDebt - 20000);
              await prisma.driver.update({
                where: { id: driverId },
                data: {
                  comfortLastPaidAt: now,
                  comfortDebt: newDebt,
                  membershipPlan: 'COMFORT',
                  status: newStatus
                }
              });
              console.log(`✅ COMFORT: Conductor ${driverId} pagó cuota diaria vía Mercado Pago. Deuda restante: $${newDebt}`);
              
              const comfortConfig = await prisma.systemConfig.findUnique({ where: { key: 'membership_comfort_promo_price' } });
              const comfortPromoPrice = parseInt((comfortConfig?.value || '8990').toString().replace(/\D/g, ''), 10);
              const formattedComfortAmount = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(comfortPromoPrice);
              sendAdminPaymentNotification(driver.name, driver.id, plan, formattedComfortAmount).catch(e => console.error(e));
            } else {
              const baseDate = (driver.isTrial && driver.membershipExpiresAt && driver.membershipExpiresAt > now)
                ? new Date(driver.membershipExpiresAt)
                : now;
              let expiresAt = new Date(baseDate);
              if (plan === 'BLACK') {
                expiresAt.setMonth(expiresAt.getMonth() + 1);
              } else if (plan === 'FLEX') {
                // Expira el próximo lunes (fin del fin de semana)
                const daysUntilMonday = (8 - baseDate.getDay()) % 7 || 7;
                expiresAt.setDate(expiresAt.getDate() + daysUntilMonday);
              }

              await prisma.driver.update({
                where: { id: driverId },
                data: {
                  membershipPaid: true,
                  membershipDate: now,
                  membershipExpiresAt: expiresAt,
                  membershipPlan: plan,
                  isTrial: false, // Terminar periodo de prueba al pagar
                  status: newStatus
                }
              });
              console.log(`✅ Membresía ${plan} activada para conductor ${driverId} hasta ${expiresAt.toLocaleDateString('es-CL')}`);
              
              // Notificar al admin
              const configs = await prisma.systemConfig.findMany({
                where: { key: { in: ['membership_black_promo_price', 'membership_flex_promo_price'] } }
              });
              const configMap = configs.reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {});
              const hasBlackDiscount = (plan === 'BLACK' && ((driver.nextDiscount !== null && driver.nextDiscount > 0) || (driver.membershipProgress >= 150)));
              const blackPromoPrice = parseInt((configMap.membership_black_promo_price || '49990').toString().replace(/\D/g, ''), 10);
              const flexPromoPrice = parseInt((configMap.membership_flex_promo_price || '19990').toString().replace(/\D/g, ''), 10);
              const blackFinalPrice = hasBlackDiscount ? blackPromoPrice * 0.8 : blackPromoPrice;
              
              const amountValue = plan === 'BLACK' ? blackFinalPrice : flexPromoPrice;
              const formattedAmount = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amountValue);

              sendAdminPaymentNotification(driver.name, driver.id, plan, formattedAmount).catch(e => console.error(e));
            }
          }
        }
      }
    }
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error procesando webhook de membresía:', error);
    res.status(500).send('Internal Error');
  }
});

// ─── SIMULACRO MEMBRESÍA (solo desarrollo) ───────────────────────────────────
router.post('/membership/simulate', async (req, res) => {
  try {
    const { driverId, plan } = req.body;
    if (!driverId || !plan) return res.status(400).json({ error: 'Faltan datos' });

    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) return res.status(404).json({ error: 'Conductor no encontrado' });

    const now = new Date();
    const baseDate = (driver.isTrial && driver.membershipExpiresAt && driver.membershipExpiresAt > now)
      ? new Date(driver.membershipExpiresAt)
      : now;
    let expiresAt = new Date(baseDate);
    if (plan === 'BLACK') expiresAt.setMonth(expiresAt.getMonth() + 1);
    else if (plan === 'FLEX') expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.driver.update({
      where: { id: driverId },
      data: { 
        membershipPaid: true, 
        membershipDate: now, 
        membershipExpiresAt: expiresAt, 
        membershipPlan: plan, 
        isTrial: false, // Terminar periodo de prueba al pagar
        status: 'active' 
      }
    });

    res.json({ success: true, message: `Membresía ${plan} simulada hasta ${expiresAt.toLocaleDateString('es-CL')}` });
  } catch (error) {
    res.status(500).json({ error: 'Error simulando membresía' });
  }
});


// ─── MERCADOPAGO OAUTH (CONDUCTORES) ────────────────────────────────────────

router.get('/oauth/callback', async (req, res) => {
  try {
    const { code, state } = req.query; // El state es el driverId
    if (!code || !state) {
      return res.status(400).send('Faltan parámetros de OAuth');
    }

    const driverId = String(state);
    
    const clientId = process.env.MP_CLIENT_ID || '';
    const clientSecret = process.env.MP_CLIENT_SECRET || '';
    const redirectUri = process.env.MP_REDIRECT_URI || `${process.env.API_URL || 'http://localhost:3001'}/api/payments/oauth/callback`;

    // Intercambiar código por token
    const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      body: new URLSearchParams({
        client_secret: clientSecret,
        client_id: clientId,
        grant_type: 'authorization_code',
        code: String(code),
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.error('Error de OAuth MP:', tokenData);
      return res.status(400).send('No se pudo obtener el token de MercadoPago');
    }

    // Guardar tokens en el conductor
    await prisma.driver.update({
      where: { id: driverId },
      data: {
        mpAccessToken: tokenData.access_token,
        mpRefreshToken: tokenData.refresh_token,
        mpUserId: String(tokenData.user_id)
      }
    });

    // Redirigir de vuelta a la app (Deep link o Web)
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';
    res.redirect(`${baseUrl}/driver/compliance?success=oauth`);

  } catch (error) {
    console.error('Error en OAuth Callback:', error);
    res.status(500).send('Error interno en OAuth');
  }
});

// 1. Crear la suscripción (Preapproval)
router.post('/subscribe', async (req, res) => {
  try {
    const { driverId, email } = req.body;

    if (!driverId || !email) {
      return res.status(400).json({ error: 'Faltan datos del conductor' });
    }

    // Comprobar si el conductor ya tiene una membresía activa pagada
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) return res.status(404).json({ error: 'Conductor no encontrado' });

    if (driver.membershipPaid) {
      return res.status(400).json({ error: 'El conductor ya tiene su membresía pagada' });
    }

    // Configurar la suscripción
    const subscriptionData = {
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: 100000,
        currency_id: 'CLP',
      },
      back_url: 'https://fim.cl/driver', // En producción sería https://tu-dominio.com/driver
      reason: 'Suscripción Mensual Conductor Fim',
      payer_email: email, // El email de prueba o del usuario
    };

    const response = await preapproval.create({ body: subscriptionData });

    // Guardamos el ID de la suscripción pendiente en la BD
    if (response.id) {
      await prisma.driver.update({
        where: { id: driverId },
        data: { mpSubscriptionId: response.id },
      });
    }

    // Devolvemos el link de pago (init_point) al frontend
    res.json({ init_point: response.init_point });
  } catch (error) {
    console.error('Error al crear suscripción en Mercado Pago:', error);
    res.status(500).json({ error: 'Error interno del servidor al conectar con Mercado Pago' });
  }
});

// 2. Webhook (IPN) - Recibe las notificaciones de Mercado Pago
router.post('/webhook', async (req, res) => {
  try {
    // Mercado Pago envía notificaciones POST aquí
    console.log('🔔 Webhook de Mercado Pago recibido:', req.query, req.body);
    
    // El query o body contiene `type` y `data.id`
    // Para suscripciones, suele ser topic=preapproval o type=subscription_preapproval
    const type = req.query.type || req.query.topic;
    const dataId = req.query['data.id'] || req.query.id;

    if ((type === 'subscription_preapproval' || type === 'preapproval') && dataId) {
      // Obtenemos los detalles reales de la suscripción desde MP
      const subscriptionInfo = await preapproval.get({ id: String(dataId) });

      if (subscriptionInfo && subscriptionInfo.status === 'authorized') {
        // Encontramos al conductor por el mpSubscriptionId
        const driver = await prisma.driver.findFirst({
          where: { mpSubscriptionId: String(dataId) }
        });

        if (driver) {
          const now = new Date();
          const baseDate = (driver.isTrial && driver.membershipExpiresAt && driver.membershipExpiresAt > now)
            ? new Date(driver.membershipExpiresAt)
            : now;
          const expiresAt = new Date(baseDate);
          expiresAt.setMonth(expiresAt.getMonth() + 1);

          await prisma.driver.update({
            where: { id: driver.id },
            data: {
              membershipPaid: true,
              membershipDate: now,
              membershipExpiresAt: expiresAt,
              isTrial: false, // Terminar periodo de prueba al pagar
              status: 'active' // ¡Activar al conductor!
            }
          });
          console.log(`✅ Conductor ${driver.id} activado vía Mercado Pago.`);
        }
      }
    }

    // Siempre responder 200 OK a Mercado Pago rápidamente
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error procesando Webhook de suscripciones:', error);
    res.status(500).send('Internal Error');
  }
});

// Endpoint para SIMULAR el pago exitoso de la membresía en Desarrollo
router.post('/simulate-subscription', async (req, res) => {
  try {
    const { driverId } = req.body;
    if (!driverId) return res.status(400).json({ error: 'Falta driverId' });

    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    if (!driver) return res.status(404).json({ error: 'Conductor no encontrado' });

    const now = new Date();
    const baseDate = (driver.isTrial && driver.membershipExpiresAt && driver.membershipExpiresAt > now)
      ? new Date(driver.membershipExpiresAt)
      : now;
    const expiresAt = new Date(baseDate);
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    await prisma.driver.update({
      where: { id: driverId },
      data: {
        membershipPaid: true,
        membershipDate: now,
        membershipExpiresAt: expiresAt,
        isTrial: false, // Terminar periodo de prueba al pagar
        status: 'active'
      }
    });

    console.log(`✅ SIMULACRO: Conductor ${driverId} activado manualmente.`);
    res.json({ success: true, message: 'Pago simulado correctamente' });
  } catch (error) {
    console.error('Error al simular suscripción:', error);
    res.status(500).json({ error: 'Error simulando suscripción' });
  }
});

// ─── PAGOS AUTOMÁTICOS POR VIAJE (SPLIT PAYMENTS) ─────────────────────────

import { Payment } from 'mercadopago';

// 3. Guardar Tarjeta del Pasajero (Tokenización)
router.post('/passenger/cards', async (req, res) => {
  try {
    const { passengerId, cardToken } = req.body;
    if (!passengerId || !cardToken) return res.status(400).json({ error: 'Faltan datos' });

    // En un sistema real, aquí crearías un "Customer" en MP y guardarías la tarjeta.
    // Para simplificar, guardaremos el token directo para el próximo viaje (o el ID del Customer).
    await prisma.user.update({
      where: { id: passengerId },
      data: { mpCardToken: cardToken, paymentMethod: 'card' }
    });

    res.json({ success: true, message: 'Tarjeta guardada exitosamente' });
  } catch (error) {
    console.error('Error guardando tarjeta:', error);
    res.status(500).json({ error: 'Error al guardar la tarjeta' });
  }
});

// 4. Cobro Automático al finalizar el viaje (Split Payment al Conductor)
router.post('/trip/:id/auto-charge', async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: { passenger: true, driver: true }
    });

    if (!trip) return res.status(404).json({ error: 'Viaje no encontrado' });
    if (trip.paymentStatus === 'paid' || trip.isPaid) {
      return res.status(400).json({ error: 'El viaje ya fue pagado' });
    }
    if (!trip.driver || !trip.driver.mpAccessToken) {
      return res.status(400).json({ error: 'El conductor no tiene MercadoPago vinculado' });
    }
    if (!trip.passenger.mpCardToken) {
      return res.status(400).json({ error: 'El pasajero no tiene tarjeta guardada' });
    }

    let grossAmount = trip.finalPrice || trip.estimatedPrice;
    grossAmount = roundCLP(grossAmount);
    
    // Calcular comisión de Fim (ejemplo: 15% o cargo fijo)
    // Para este caso, el conductor se lleva todo el viaje porque Fim gana por membresías!
    // Pero si queremos cobrar la comisión de MercadoPago (ej. 3.49% + IVA)
    const mpFee = Math.round(grossAmount * 0.0415); // Aprox 4.15% total
    const fimFee = 0; // Fim no cobra comisión por viaje
    
    const amountToChargePassenger = grossAmount + mpFee;
    const amountToDriver = grossAmount;

    // Configurar cliente MP usando el token del CONDUCTOR (para que el dinero le caiga a él)
    const driverMpClient = new MercadoPagoConfig({ 
      accessToken: trip.driver.mpAccessToken,
      options: { timeout: 5000 } 
    });
    const payment = new Payment(driverMpClient);

    // Crear el pago automático
    const response = await payment.create({
      body: {
        transaction_amount: amountToChargePassenger,
        token: trip.passenger.mpCardToken,
        description: `Viaje Fim - ${trip.destAddress}`,
        installments: 1,
        payment_method_id: 'master', // O el que provea el frontend
        payer: {
          email: trip.passenger.email,
        },
        application_fee: fimFee, // Comisión para la plataforma Fim
        external_reference: trip.id,
      }
    });

    // Registrar pago y boleta interna
    if (response.status === 'approved' || response.status === 'in_process') {
      await prisma.trip.update({
        where: { id: trip.id },
        data: { isPaid: true, paymentStatus: response.status, mpPaymentId: String(response.id) }
      });

      await prisma.tripReceipt.create({
        data: {
          tripId: trip.id,
          passengerId: trip.passengerId,
          driverId: trip.driverId,
          grossAmount: amountToChargePassenger,
          netAmount: amountToDriver,
          mpFee: mpFee,
          fimFee: fimFee
        }
      });

      res.json({ success: true, status: response.status, paymentId: response.id });
    } else {
      res.status(400).json({ error: 'Pago rechazado por MercadoPago', status: response.status });
    }

  } catch (error) {
    console.error('Error procesando pago automático:', error);
    res.status(500).json({ error: 'Error interno al procesar el pago del viaje' });
  }
});

// 4. Webhook para pagos de viajes
router.post('/trip-webhook', async (req, res) => {
  try {
    // Aquí recibimos la notificación de Mercado Pago cuando un pasajero paga el viaje.
    // NOTA: En desarrollo local sin ngrok, este webhook no será llamado por Mercado Pago.
    // Para probar en local, el frontend tendrá que llamar a un endpoint de confirmación manual,
    // o podemos simular este webhook enviando un POST manualmente.
    
    const paymentId = req.query['data.id'] || req.body?.data?.id;
    const type = req.query.type || req.body?.type;

    if (type === 'payment' && paymentId) {
      // Idealmente aquí consultamos a la API de MP usando Payment.get({ id: paymentId })
      // para validar que el pago esté aprobado y obtener el external_reference (tripId).
      // Simularemos la lógica asumiendo que llega el external_reference en el body para pruebas.
      
      const tripId = req.body?.external_reference || req.query.external_reference;
      
      if (tripId) {
        const trip = await prisma.trip.findUnique({ where: { id: tripId as string } });
        
        if (trip && !trip.isPaid && trip.driverId) {
          // 1. Marcar viaje como pagado
          await prisma.trip.update({
            where: { id: trip.id },
            data: { isPaid: true, paymentStatus: 'paid', mpPaymentId: String(paymentId) }
          });
          
          // 2. Sumar saldo a la billetera del conductor
          const price = trip.finalPrice || trip.estimatedPrice;
          await prisma.driver.update({
            where: { id: trip.driverId },
            data: { walletBalance: { increment: price } }
          });
          
          console.log(`✅ Pago de viaje ${trip.id} procesado. $${price} sumados a la billetera del conductor ${trip.driverId}.`);
        }
      }
    }
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error procesando webhook de viaje:', error);
    res.status(500).send('Internal Error');
  }
});

// 5. Endpoint de simulacro de pago (Solo para Desarrollo)
// Ya que ngrok no está configurado, el frontend llamará a esto tras volver del checkout
router.post('/trip/:id/simulate-payment', async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await prisma.trip.findUnique({ where: { id } });
    
    if (trip && !trip.isPaid && trip.driverId) {
      const price = trip.finalPrice || trip.estimatedPrice;
      
      await prisma.trip.update({
        where: { id: trip.id },
        data: { isPaid: true, paymentStatus: 'paid' }
      });
      
      await prisma.driver.update({
        where: { id: trip.driverId },
        data: { walletBalance: { increment: price } }
      });
      
      console.log(`✅ SIMULACRO: Viaje ${trip.id} pagado. $${price} a la billetera.`);
      return res.json({ success: true, message: 'Pago simulado correctamente' });
    }
    res.json({ success: false, message: 'Viaje no válido o ya pagado' });
  } catch (err) {
    res.status(500).json({ error: 'Error simulando pago' });
  }
});

export default router;
