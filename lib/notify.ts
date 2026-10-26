import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let channelReady = false;

async function ensurePermission() {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android' && !channelReady) {
    await Notifications.setNotificationChannelAsync('salaison', {
      name: 'Rappels salaison',
      importance: Notifications.AndroidImportance.HIGH,
    });
    channelReady = true;
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/** Programme un rappel à une date future. Retourne l'identifiant, ou null. */
export async function scheduleAt(date: Date, title: string, body: string): Promise<string | null> {
  try {
    if (date.getTime() <= Date.now() + 60_000) return null;
    if (!(await ensurePermission())) return null;
    return await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: 'salaison' },
    });
  } catch {
    return null;
  }
}

export async function cancel(ids: string[]) {
  if (Platform.OS === 'web') return;
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
}
