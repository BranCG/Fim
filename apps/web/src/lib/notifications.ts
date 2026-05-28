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
