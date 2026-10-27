import { z } from 'zod';

/**
 * Currency constant for Repair God: PLN (Polski Złoty).
 * All monetary amounts in the system are strictly stored and calculated
 * as integer grosze (1 PLN = 100 groszy).
 */
export const CURRENCY = 'PLN' as const;
export type Currency = typeof CURRENCY;

export interface FormatPLNOptions {
  /**
   * Whether to hide the grosze part if it equals zero (e.g., "100 zł" instead of "100,00 zł").
   * Default: false
   */
  hideZeroGrosze?: boolean;

  /**
   * Whether to append the currency symbol "zł".
   * Default: true
   */
  withSymbol?: boolean;

  /**
   * Custom space character between thousands or before currency symbol.
   * Default: ' ' (non-breaking space \u00A0 can also be used if desired)
   */
  spaceChar?: string;
}

/**
 * Formats integer grosze into a formatted Polish currency string.
 *
 * @example
 * formatPLN(10000) // "100,00 zł"
 * formatPLN(1234567) // "12 345,67 zł"
 * formatPLN(0) // "0,00 zł"
 * formatPLN(-5000) // "-50,00 zł"
 * formatPLN(10000, { hideZeroGrosze: true }) // "100 zł"
 */
export function formatPLN(amountGrosze: number, options: FormatPLNOptions = {}): string {
  const { hideZeroGrosze = false, withSymbol = true, spaceChar = ' ' } = options;

  const safeGrosze = Number.isInteger(amountGrosze) ? amountGrosze : Math.round(amountGrosze);
  const isNegative = safeGrosze < 0;
  const absGrosze = Math.abs(safeGrosze);

  const zloty = Math.floor(absGrosze / 100);
  const grosze = absGrosze % 100;

  // Format zloty with thousands separator
  const zlotyStr = zloty.toString().replace(/\B(?=(\d{3})+(?!\d))/g, spaceChar);

  let formattedNumber: string;
  if (hideZeroGrosze && grosze === 0) {
    formattedNumber = zlotyStr;
  } else {
    const groszeStr = grosze.toString().padStart(2, '0');
    formattedNumber = `${zlotyStr},${groszeStr}`;
  }

  if (isNegative) {
    formattedNumber = `-${formattedNumber}`;
  }

  return withSymbol ? `${formattedNumber}${spaceChar}zł` : formattedNumber;
}

/**
 * Converts integer grosze to decimal PLN number.
 * Use strictly for external integrations/displays that require decimal floats.
 *
 * @example
 * groszeToPLN(10000) // 100
 * groszeToPLN(10050) // 100.5
 */
export function groszeToPLN(amountGrosze: number): number {
  const safeGrosze = Number.isInteger(amountGrosze) ? amountGrosze : Math.round(amountGrosze);
  return Number((safeGrosze / 100).toFixed(2));
}

/**
 * Converts decimal PLN to integer grosze, rounding safely to prevent float errors.
 *
 * @example
 * plnToGrosze(100) // 10000
 * plnToGrosze(100.50) // 10050
 * plnToGrosze(29.99) // 2999
 */
export function plnToGrosze(amountPLN: number): number {
  return Math.round(amountPLN * 100);
}

/**
 * Safely sums multiple amounts in grosze.
 */
export function addGrosze(...amounts: number[]): number {
  return amounts.reduce((acc, curr) => {
    const safe = Number.isInteger(curr) ? curr : Math.round(curr);
    return acc + safe;
  }, 0);
}

/**
 * Safely subtracts grosze (a - b).
 */
export function subtractGrosze(a: number, b: number): number {
  const safeA = Number.isInteger(a) ? a : Math.round(a);
  const safeB = Number.isInteger(b) ? b : Math.round(b);
  return safeA - safeB;
}

/**
 * Multiplies an integer grosze amount by a numeric multiplier (e.g. quantity or discount rate)
 * and rounds to nearest integer grosz.
 */
export function multiplyGrosze(amountGrosze: number, multiplier: number): number {
  const safe = Number.isInteger(amountGrosze) ? amountGrosze : Math.round(amountGrosze);
  return Math.round(safe * multiplier);
}

/**
 * Calculates standard Polish VAT (default 23%) from netto amount in grosze.
 * Returns integers in grosze for netto, vat, and brutto.
 */
export function calculateVat(
  nettoGrosze: number,
  vatRatePercent = 23
): { netto: number; vat: number; brutto: number } {
  const safeNetto = Number.isInteger(nettoGrosze) ? nettoGrosze : Math.round(nettoGrosze);
  const vat = Math.round((safeNetto * vatRatePercent) / 100);
  const brutto = safeNetto + vat;

  return {
    netto: safeNetto,
    vat,
    brutto,
  };
}

/**
 * Calculates netto amount and VAT from brutto amount in grosze.
 */
export function calculateNettoFromBrutto(
  bruttoGrosze: number,
  vatRatePercent = 23
): { netto: number; vat: number; brutto: number } {
  const safeBrutto = Number.isInteger(bruttoGrosze) ? bruttoGrosze : Math.round(bruttoGrosze);
  const netto = Math.round((safeBrutto * 100) / (100 + vatRatePercent));
  const vat = safeBrutto - netto;

  return {
    netto,
    vat,
    brutto: safeBrutto,
  };
}

// ============================================================================
// Zod Schemas
// ============================================================================

export const currencyCodeSchema = z.literal('PLN');

/**
 * Validates that an amount is a valid integer representing grosze.
 */
export const groszeSchema = z
  .number()
  .int({ message: 'Kwota musi być liczbą całkowitą w groszach' });

/**
 * Validates that an amount is a non-negative integer representing grosze (>= 0).
 */
export const nonNegativeGroszeSchema = z
  .number()
  .int({ message: 'Kwota musi być liczbą całkowitą w groszach' })
  .min(0, { message: 'Kwota w groszach nie może być ujemna' });

/**
 * Validates that an amount is a strictly positive integer representing grosze (> 0).
 */
export const positiveGroszeSchema = z
  .number()
  .int({ message: 'Kwota musi być liczbą całkowitą w groszach' })
  .positive({ message: 'Kwota w groszach musi być większa od zera' });

/**
 * Schema for monetary objects in DTOs.
 */
export const moneyObjectSchema = z.object({
  amountGrosze: nonNegativeGroszeSchema,
  currency: currencyCodeSchema.default('PLN'),
});

export type MoneyObject = z.infer<typeof moneyObjectSchema>;
