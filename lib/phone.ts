import { parsePhoneNumberFromString } from "libphonenumber-js";

/**
 * Normaliza un teléfono (tal como viene del scrape de Idealista, sin
 * prefijo internacional en la mayoría de los casos) a formato E.164
 * asumiendo región España. Devuelve null si no es un número válido.
 */
export function normalizeToE164Spain(rawPhone: string | null | undefined): string | null {
  if (!rawPhone) return null;

  const phoneNumber = parsePhoneNumberFromString(rawPhone, "ES");

  if (!phoneNumber || !phoneNumber.isValid()) {
    return null;
  }

  return phoneNumber.number; // formato E.164, ej. "+34600123456"
}
