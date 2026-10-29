import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

export type CalEvent = { date: Date; title: string; notes: string };

let cachedId: string | null = null;

/** Choisit l'agenda Google du téléphone (synchronisé), sinon un agenda modifiable. */
async function targetCalendarId(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  const perm = await Calendar.getCalendarPermissionsAsync();
  if (!perm.granted) {
    if (!perm.canAskAgain) return null;
    const asked = await Calendar.requestCalendarPermissionsAsync();
    if (!asked.granted) return null;
  }
  if (cachedId) return cachedId;

  const all = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = all.filter(
    (c) =>
      c.allowsModifications &&
      (Platform.OS !== 'android' ||
        c.accessLevel === Calendar.CalendarAccessLevel.OWNER ||
        c.accessLevel === Calendar.CalendarAccessLevel.ROOT),
  );
  const isGoogle = (c: Calendar.Calendar) => c.source?.type === 'com.google';
  const pick =
    writable.find((c) => isGoogle(c) && c.isPrimary) ??
    // Sur Android, l'agenda principal d'un compte Google porte le nom de l'adresse Gmail.
    writable.find((c) => isGoogle(c) && c.ownerAccount && c.name === c.ownerAccount) ??
    writable.find(isGoogle) ??
    writable.find((c) => c.isPrimary) ??
    writable[0];

  cachedId = pick?.id ?? null;
  return cachedId;
}

/** Ajoute les événements futurs à l'agenda. Retourne leurs identifiants. */
export async function addToCalendar(events: CalEvent[]): Promise<string[]> {
  try {
    const future = events.filter((e) => e.date.getTime() > Date.now() + 60_000);
    if (!future.length) return [];
    const calendarId = await targetCalendarId();
    if (!calendarId) return [];
    const ids: string[] = [];
    for (const e of future) {
      try {
        ids.push(
          await Calendar.createEventAsync(calendarId, {
            title: e.title,
            notes: e.notes,
            startDate: e.date,
            endDate: new Date(e.date.getTime() + 30 * 60_000),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        );
      } catch {
        // on passe à l'événement suivant
      }
    }
    return ids;
  } catch {
    return [];
  }
}

export async function removeFromCalendar(ids: string[] | undefined) {
  if (Platform.OS === 'web' || !ids?.length) return;
  await Promise.all(ids.map((id) => Calendar.deleteEventAsync(id).catch(() => {})));
}
