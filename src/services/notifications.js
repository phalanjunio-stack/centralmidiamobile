// Local notifications — reage a eventos do liveSync e dispara push local
// Não usa servidor push (Expo/FCM) — só local. Quando o app está em background,
// o sistema mostra a notificação. Quando aberto, mostra como toast in-app.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

let configured = false;

export async function configureNotifications() {
  if (configured) return;
  configured = true;

  // Como notificações se comportam quando o app está em foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: false, // foreground: deixar o UploadToast cuidar
      shouldPlaySound: false,
      shouldSetBadge: true,
    }),
  });

  // Permissões
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('[notif] permissão negada');
    return;
  }

  // Canal Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('contourline-default', {
      name: 'Contourline Backup',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 120, 60, 120],
      lightColor: '#1F8BFF',
      sound: null,
    });
    await Notifications.setNotificationChannelAsync('contourline-team', {
      name: 'Atividade da equipe',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 80],
      lightColor: '#00C16A',
      sound: null,
    });
  }
}

/**
 * Dispara notificação local imediatamente.
 */
export async function notify({ title, body, channelId = 'contourline-default', data = {} }) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        priority: 'high',
      },
      trigger: null, // imediato
      ...(Platform.OS === 'android' ? { identifier: undefined, channelId } : {}),
    });
  } catch (e) {
    console.log('[notif] falhou:', e?.message);
  }
}

export async function clearBadge() {
  try { await Notifications.setBadgeCountAsync(0); } catch {}
}

/**
 * Reage a eventos do liveSync e dispara notificações relevantes.
 * @param {object} msg  - { type, data }
 * @param {object} ctx  - { isForeground: boolean, currentDeviceId: string }
 */
export function handleLiveEventForNotif(msg, ctx = {}) {
  if (!msg?.type) return;

  switch (msg.type) {
    case 'CAPTURE_RECEIVED': {
      const fromOther = msg.data?.deviceId && msg.data.deviceId !== ctx.currentDeviceId;
      if (!fromOther) return; // não notifica capturas do próprio device
      notify({
        title: '📸 Nova captura da equipe',
        body: `${msg.data.profileName || 'Alguém'} adicionou "${msg.data.name || 'arquivo'}"`,
        channelId: 'contourline-team',
        data: { type: 'team-capture', captureId: msg.data.id },
      });
      break;
    }
    case 'DRIVE_SYNCED': {
      // Não notifica cada sync — apenas log
      break;
    }
    case 'ERROR': {
      if (msg.data?.code === 'DISK_FULL') {
        notify({
          title: '⚠ Disco cheio na Central',
          body: 'Libere espaço pra continuar recebendo capturas.',
          data: { type: 'server-error' },
        });
      }
      break;
    }
  }
}
