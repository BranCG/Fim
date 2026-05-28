import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

let firebaseApp: admin.app.App | null = null;

try {
  if (process.env.FIREBASE_CREDENTIALS) {
    const creds = JSON.parse(process.env.FIREBASE_CREDENTIALS);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(creds),
    });
    console.log('[Firebase] Inicializado con credenciales de variable de entorno.');
  } else {
    const possiblePaths = [
      path.join(process.cwd(), 'firebase-service-account.json'),
      path.join(process.cwd(), 'apps/api/firebase-service-account.json'),
      path.join(__dirname, '../../firebase-service-account.json'),
      path.join(__dirname, '../firebase-service-account.json'),
      '/var/www/Fim/apps/api/firebase-service-account.json',
    ];

    let foundPath: string | null = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        foundPath = p;
        break;
      }
    }

    if (foundPath) {
      const serviceAccount = require(foundPath);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log(`[Firebase] Inicializado con archivo de credenciales: ${foundPath}`);
    } else {
      console.warn('[Firebase] Advertencia: No se encontró archivo de credenciales de Firebase ni variable FIREBASE_CREDENTIALS. Las notificaciones push se simularán en los logs.');
    }
  }
} catch (error) {
  console.error('[Firebase] Error al inicializar Firebase Admin:', error);
}

export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  if (!firebaseApp) {
    console.log(`[Firebase Simulación] Push no enviado (Firebase no inicializado). Token: ${token.substring(0, 10)}... | Título: "${title}" | Contenido: "${body}"`);
    return;
  }

  try {
    const message: admin.messaging.Message = {
      token,
      notification: {
        title,
        body,
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          clickAction: 'FCM_PLUGIN_ACTIVITY',
          channelId: 'fim-notifications-high-v1',
          defaultVibrateTimings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log('[Firebase] Mensaje push enviado con éxito:', response);
    return response;
  } catch (error) {
    console.error('[Firebase] Error al enviar notificación push:', error);
  }
}
