import { z } from 'zod';

export const POLAND_COUNTRY_CODE = '+48' as const;

export interface FormatPhoneOptions {
  /**
   * Whether to include the international country prefix (+48).
   * Default: true
   */
  withCountryCode?: boolean;

  /**
   * Separator character between 3-digit number groups.
   * Default: ' '
   */
  separator?: string;
}

/**
 * Removes formatting characters (spaces, dashes, parentheses, slashes, dots).
 */
export function cleanPhoneNumber(phone: string): string {
  if (typeof phone !== 'string') return '';
  return phone.replace(/[\s\-\(\)\/\.]+/g, '').trim();
}

/**
 * Normalizes a Polish phone number to its 9-digit national subscriber number.
 * Strips leading +48, 0048, or 48.
 *
 * @example
 * normalizePolishPhoneNumber('+48 501 234 567') // '501234567'
 * normalizePolishPhoneNumber('0048501234567')  // '501234567'
 * normalizePolishPhoneNumber('501234567')      // '501234567'
 */
export function normalizePolishPhoneNumber(phone: string): string {
  let cleaned = cleanPhoneNumber(phone);

  // Strip international prefix
  if (cleaned.startsWith('+48')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('0048')) {
    cleaned = cleaned.slice(4);
  } else if (cleaned.length === 11 && cleaned.startsWith('48')) {
    cleaned = cleaned.slice(2);
  }

  return cleaned;
}

/**
 * Validates whether the given string is a valid 9-digit Polish phone number.
 * Accepts numbers with or without +48 country code.
 */
export function isValidPolishPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const normalized = normalizePolishPhoneNumber(phone);

  // Must be 9 digits, starting with 1-9 (Polish numbers do not start with 0)
  return /^[1-9]\d{8}$/.test(normalized);
}

/**
 * Formats a Polish phone number into standard grouped format:
 * `+48 501 234 567` or `501 234 567`.
 */
export function formatPolishPhone(phone: string, options: FormatPhoneOptions = {}): string {
  const { withCountryCode = true, separator = ' ' } = options;

  if (!isValidPolishPhone(phone)) {
    return phone;
  }

  const normalized = normalizePolishPhoneNumber(phone);
  const part1 = normalized.slice(0, 3);
  const part2 = normalized.slice(3, 6);
  const part3 = normalized.slice(6, 9);
  const grouped = `${part1}${separator}${part2}${separator}${part3}`;

  return withCountryCode ? `${POLAND_COUNTRY_CODE}${separator}${grouped}` : grouped;
}

/**
 * Formats a phone number to standard E.164 format (+48XXXXXXXXX).
 */
export function toE164(phone: string): string {
  const normalized = normalizePolishPhoneNumber(phone);
  if (!isValidPolishPhone(phone)) {
    throw new Error(`Nieprawidłowy polski numer telefonu: ${phone}`);
  }
  return `${POLAND_COUNTRY_CODE}${normalized}`;
}

// ============================================================================
// Zod Schemas
// ============================================================================

/**
 * Zod schema that validates a Polish phone number and normalizes it to E.164 (+48XXXXXXXXX).
 */
export const polishPhoneSchema = z
  .string()
  .min(1, 'Numer telefonu jest wymagany')
  .transform(cleanPhoneNumber)
  .refine(isValidPolishPhone, {
    message: 'Nieprawidłowy polski numer telefonu (wymagane 9 cyfr, np. 501 234 567 lub +48 501 234 567)',
  })
  .transform((val) => toE164(val));

/**
 * Zod schema that validates a Polish phone number and formats it for human display (+48 501 234 567).
 */
export const formattedPolishPhoneSchema = z
  .string()
  .min(1, 'Numer telefonu jest wymagany')
  .transform(cleanPhoneNumber)
  .refine(isValidPolishPhone, {
    message: 'Nieprawidłowy polski numer telefonu',
  })
  .transform((val) => formatPolishPhone(val));
