// Service to handle local notifications on both Capacitor (native mobile) and Web (HTML5 Notification API)

export async function requestNotificationPermission() {
  if (typeof window === 'undefined') return false;

  // 1. Try Capacitor local notifications
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const check = await LocalNotifications.checkPermissions();
    if (check.display === 'granted') {
      return true;
    }
    const req = await LocalNotifications.requestPermissions();
    return req.display === 'granted';
  } catch (e) {
    // Capacitor not available
  }

  // 2. Try HTML5 Notification API
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
  }

  return false;
}

export async function sendLocalNotification(title: string, body: string) {
  if (typeof window === 'undefined') return;

  console.log(`[Notification] Sending: "${title}" - "${body}"`);

  // 1. Try Capacitor Local Notifications first (works in background on Android/iOS)
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    
    // Check permission
    const check = await LocalNotifications.checkPermissions();
    if (check.display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: Math.floor(Math.random() * 100000) + 1,
          schedule: { at: new Date(Date.now() + 50) }, // Deliver almost immediately
          sound: undefined,
          attachments: undefined,
          actionTypeId: '',
          extra: null
        }
      ]
    });
    console.log('[Notification] Sent via Capacitor LocalNotifications');
    return;
  } catch (e) {
    // Capacitor not available or failed, fallback to browser Notification API
  }

  // 2. Try HTML5 Notification API
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
      console.log('[Notification] Sent via HTML5 Notification API');
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(title, { body });
        console.log('[Notification] Sent via HTML5 Notification API (after granting permission)');
      }
    }
  }
}

import api from './api';

export async function initializePushNotifications() {
  if (typeof window === 'undefined') return;

  const isCapacitor = (window as any).Capacitor;
  if (!isCapacitor) {
    console.log('[Push] Capacitor no disponible, omitiendo inicialización de notificaciones push nativas.');
    return;
  }

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // Crear el canal de notificaciones push de alta prioridad para Android (heads-up / banner)
    await PushNotifications.createChannel({
      id: 'fim-notifications-high-v1',
      name: 'Alertas de Viaje Fim',
      description: 'Canal de alta prioridad para llamadas de viajes, chat y alertas emergentes con sonido y vibración.',
      importance: 5, // IMPORTANCE_HIGH (Android: 5 / Max, pop up on screen)
      visibility: 1, // VISIBILITY_PUBLIC
      sound: 'default',
      vibration: true,
    });
    console.log('[Push] Canal de notificaciones push de alta prioridad creado con éxito: fim-notifications-high-v1');

    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('[Push] Permiso para notificaciones push denegado.');
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', async (token) => {
      console.log('[Push] Registro exitoso, token FCM:', token.value);
      try {
        await api.post('/auth/fcm-token', { fcmToken: token.value });
        console.log('[Push] Token FCM enviado con éxito al servidor.');
      } catch (err) {
        console.error('[Push] Error al enviar token FCM al servidor:', err);
      }
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('[Push] Error en el registro de push:', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[Push] Notificación recibida en primer plano:', notification);
      sendLocalNotification(
        notification.title || 'Nueva Notificación',
        notification.body || ''
      );
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[Push] Acción de notificación realizada:', action);
    });

  } catch (error) {
    console.error('[Push] Error al inicializar las notificaciones push:', error);
  }
}
