// Wrapper de notificações.
// Por ora faz no-op porque o expo-notifications não funciona no Expo Go (SDK 53+).
// Quando rodar com EAS Build (development build ou standalone), podemos importar
// expo-notifications de verdade aqui.

import Constants from 'expo-constants';

export const isExpoGo = Constants.appOwnership === 'expo';

export function setupNotificationsHandler() {
  if (isExpoGo) {
    console.log('[notify] Expo Go detectado — notificações desabilitadas');
    return;
  }
  // No dev build, descomenta o trecho abaixo:
  // const Notifications = require('expo-notifications');
  // Notifications.setNotificationHandler({
  //   handleNotification: async () => ({
  //     shouldShowAlert: true,
  //     shouldPlaySound: false,
  //     shouldSetBadge: true,
  //   }),
  // });
}

export async function showLocalNotification({ title, body, badge }) {
  // Sempre só loga por ora. Pra ativar de verdade, descomenta o trecho acima
  // e o trecho abaixo num dev build.
  console.log('[notify]', title, '·', body);

  // const Notifications = require('expo-notifications');
  // await Notifications.scheduleNotificationAsync({
  //   content: { title, body, badge },
  //   trigger: null,
  // });
}
