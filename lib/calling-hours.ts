import { toZonedTime } from "date-fns-tz";
import type { Settings } from "./types";

/**
 * Convierte el día de la semana de JS (0=domingo..6=sábado) a ISO
 * (1=lunes..7=domingo), que es como se guarda settings.calling_days.
 */
function toIsoWeekday(jsDay: number): number {
  return jsDay === 0 ? 7 : jsDay;
}

function parseHms(hms: string): { hours: number; minutes: number } {
  const [hours, minutes] = hms.split(":").map(Number);
  return { hours, minutes };
}

/**
 * Determina si `nowUtc` cae dentro de la ventana de llamada permitida,
 * evaluada en la zona horaria de `settings` (por defecto Europe/Madrid).
 */
export function isWithinCallingWindow(settings: Settings, nowUtc: Date): boolean {
  const zonedNow = toZonedTime(nowUtc, settings.timezone);

  const isoWeekday = toIsoWeekday(zonedNow.getDay());
  if (!settings.calling_days.includes(isoWeekday)) {
    return false;
  }

  const start = parseHms(settings.calling_hours_start);
  const end = parseHms(settings.calling_hours_end);

  const nowMinutes = zonedNow.getHours() * 60 + zonedNow.getMinutes();
  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;

  return nowMinutes >= startMinutes && nowMinutes < endMinutes;
}
