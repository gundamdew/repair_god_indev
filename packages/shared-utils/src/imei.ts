import { z } from 'zod';

/**
 * Strips whitespace, hyphens, and non-alphanumeric characters from IMEI.
 */
export function cleanIMEI(imei: string): string {
  if (typeof imei !== 'string') return '';
  return imei.replace(/[\s\-\.]+/g, '').trim();
}

/**
 * Calculates the Luhn check digit for a 14-digit IMEI prefix.
 *
 * @param imei14 First 14 digits of an IMEI
 * @returns Check digit (0-9)
 */
export function calculateIMEICheckDigit(imei14: string): number {
  const cleaned = cleanIMEI(imei14);
  if (!/^\d{14}$/.test(cleaned)) {
    throw new Error('Wymagane dokładnie 14 cyfr do obliczenia cyfry kontrolnej IMEI');
  }

  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const digit = parseInt(cleaned.charAt(i), 10);
    // Double every second digit (1-indexed even positions: index 1, 3, 5, 7, 9, 11, 13)
    if (i % 2 === 1) {
      const doubled = digit * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    } else {
      sum += digit;
    }
  }

  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

/**
 * Validates a 15-digit IMEI number using the Luhn checksum algorithm.
 *
 * @param imei 15-digit IMEI string (spaces and hyphens allowed)
 * @returns boolean
 */
export function isValidIMEI(imei: string): boolean {
  if (!imei || typeof imei !== 'string') return false;

  const cleaned = cleanIMEI(imei);
  if (!/^\d{15}$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const digit = parseInt(cleaned.charAt(i), 10);
    // Double every second digit (index 1, 3, 5, 7, 9, 11, 13)
    if (i % 2 === 1) {
      const doubled = digit * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    } else {
      sum += digit;
    }
  }

  return sum % 10 === 0;
}

/**
 * Formats a 15-digit IMEI into standard human-readable format:
 * `AA-BBBBBB-CCCCCC-D` (TAC: 8 digits, SNR: 6 digits, CD: 1 digit)
 */
export function formatIMEI(imei: string, separator = '-'): string {
  const cleaned = cleanIMEI(imei);
  if (!/^\d{15}$/.test(cleaned)) {
    return imei;
  }

  const tac1 = cleaned.slice(0, 2);
  const tac2 = cleaned.slice(2, 8);
  const snr = cleaned.slice(8, 14);
  const cd = cleaned.slice(14, 15);

  return `${tac1}${separator}${tac2}${separator}${snr}${separator}${cd}`;
}

/**
 * Strips whitespace and transforms serial number to uppercase.
 */
export function cleanSerial(serial: string): string {
  if (typeof serial !== 'string') return '';
  return serial.trim().toUpperCase();
}

/**
 * Validates electronic device serial numbers (Apple, Dell, Lenovo, Samsung, HP, Sony, etc.).
 * Serial numbers typically contain 4-32 alphanumeric characters and optional hyphens.
 */
export function isValidSerial(serial: string): boolean {
  if (!serial || typeof serial !== 'string') return false;
  const cleaned = cleanSerial(serial);

  // Length 4-32, alphanumeric + hyphens, must contain at least 2 alphanumeric chars
  if (!/^[A-Z0-9-]{4,32}$/.test(cleaned)) return false;
  const alphaNumCount = (cleaned.match(/[A-Z0-9]/g) || []).length;
  return alphaNumCount >= 3;
}

// ============================================================================
// Zod Schemas
// ============================================================================

export const imeiSchema = z
  .string()
  .min(1, 'Numer IMEI jest wymagany')
  .transform(cleanIMEI)
  .refine(isValidIMEI, {
    message: 'Nieprawidłowy numer IMEI (wymagane 15 cyfr zgodnych z algorytmem Luhna)',
  });

export const serialNumberSchema = z
  .string()
  .min(1, 'Numer seryjny jest wymagany')
  .transform(cleanSerial)
  .refine(isValidSerial, {
    message: 'Nieprawidłowy numer seryjny urządzenia (4–32 znaki alfanumeryczne)',
  });

/**
 * Validates either an IMEI or a Serial Number
 */
export const deviceIdentifierSchema = z.string().superRefine((val, ctx) => {
  const cleanedImei = cleanIMEI(val);
  if (/^\d{15}$/.test(cleanedImei)) {
    if (!isValidIMEI(cleanedImei)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nieprawidłowa cyfra kontrolna numeru IMEI',
      });
    }
    return;
  }

  if (!isValidSerial(val)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Podaj poprawny 15-cyfrowy IMEI lub numer seryjny urządzenia (min. 4 znaki)',
    });
  }
});
