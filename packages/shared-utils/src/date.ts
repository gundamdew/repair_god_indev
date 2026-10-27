import { z } from 'zod';

export const POLISH_LOCALE = 'pl-PL' as const;

/**
 * Parses a Date input safely. Throws if invalid.
 */
export function parseDate(input: Date | string | number): Date {
  if (input instanceof Date) {
    if (isNaN(input.getTime())) {
      throw new Error(`Nieprawidłowa data: ${input}`);
    }
    return input;
  }
  const date = new Date(input);
  if (isNaN(date.getTime())) {
    throw new Error(`Nieprawidłowa data: ${input}`);
  }
  return date;
}

/**
 * Formats date into standard Polish short format: `DD.MM.YYYY`.
 *
 * @example
 * formatDate(new Date('2026-10-27T12:00:00Z')) // "27.10.2026"
 */
export function formatDate(input: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  const date = parseDate(input);
  if (options) {
    return new Intl.DateTimeFormat(POLISH_LOCALE, options).format(date);
  }
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Formats date into Polish long format: `27 października 2026`.
 */
export function formatDateLong(input: Date | string | number): string {
  const date = parseDate(input);
  return new Intl.DateTimeFormat(POLISH_LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Formats date and time into `DD.MM.YYYY, HH:mm`.
 */
export function formatDateTime(input: Date | string | number): string {
  const date = parseDate(input);
  const datePart = formatDate(date);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${datePart}, ${hours}:${minutes}`;
}

/**
 * Formats time into `HH:mm`.
 */
export function formatTime(input: Date | string | number): string {
  const date = parseDate(input);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Helper to select Polish noun declension for numerals:
 * - one (1) -> "minutę"
 * - few (2, 3, 4, 22, 23, 24...) -> "minuty"
 * - many (0, 5-21, 25-31...) -> "minut"
 */
export function getPolishPlural(value: number, one: string, few: string, many: string): string {
  const abs = Math.abs(value);
  if (abs === 1) return one;
  const rem10 = abs % 10;
  const rem100 = abs % 100;
  if (rem10 >= 2 && rem10 <= 4 && (rem100 < 10 || rem100 >= 20)) {
    return few;
  }
  return many;
}

/**
 * Returns human-readable relative time string in Polish.
 *
 * @example
 * formatRelativeTime(Date.now() - 30000) // "przed chwilą"
 * formatRelativeTime(Date.now() - 5 * 60000) // "5 minut temu"
 * formatRelativeTime(Date.now() - 2 * 3600000) // "2 godziny temu"
 */
export function formatRelativeTime(input: Date | string | number, baseInput?: Date | string | number): string {
  const target = parseDate(input);
  const base = baseInput ? parseDate(baseInput) : new Date();

  const diffMs = target.getTime() - base.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const isPast = diffSec <= 0;
  const absSec = Math.abs(diffSec);

  if (absSec < 45) {
    return isPast ? 'przed chwilą' : 'za chwilę';
  }

  const absMin = Math.round(absSec / 60);
  if (absMin < 60) {
    const unit = getPolishPlural(absMin, 'minutę', 'minuty', 'minut');
    return isPast ? `${absMin} ${unit} temu` : `za ${absMin} ${unit}`;
  }

  const absHours = Math.round(absMin / 60);
  if (absHours < 24) {
    const unit = getPolishPlural(absHours, 'godzinę', 'godziny', 'godzin');
    return isPast ? `${absHours} ${unit} temu` : `za ${absHours} ${unit}`;
  }

  const absDays = Math.round(absHours / 24);
  if (absDays === 1) {
    const time = formatTime(target);
    return isPast ? `wczoraj o ${time}` : `jutro o ${time}`;
  }

  if (absDays < 30) {
    const unit = absDays === 1 ? 'dzień' : 'dni';
    return isPast ? `${absDays} ${unit} temu` : `za ${absDays} ${unit}`;
  }

  const absMonths = Math.round(absDays / 30.4375);
  if (absMonths < 12) {
    const unit = getPolishPlural(absMonths, 'miesiąc', 'miesiące', 'miesięcy');
    return isPast ? `${absMonths} ${unit} temu` : `za ${absMonths} ${unit}`;
  }

  const absYears = Math.round(absDays / 365.25);
  const unit = getPolishPlural(absYears, 'rok', 'lata', 'lat');
  return isPast ? `${absYears} ${unit} temu` : `za ${absYears} ${unit}`;
}

/**
 * Adds business days (Monday-Friday) to a given date.
 */
export function addBusinessDays(input: Date | string | number, days: number): Date {
  const result = new Date(parseDate(input));
  let remaining = days;

  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    // 0 is Sunday, 6 is Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      remaining--;
    }
  }

  return result;
}

/**
 * Formats a business days range in Polish (e.g., "1–2 dni robocze", "1 dzień roboczy", "5–7 dni roboczych").
 */
export function formatBusinessDaysRange(minDays: number, maxDays: number): string {
  if (minDays === maxDays) {
    if (minDays === 1) return '1 dzień roboczy';
    const unit = getPolishPlural(minDays, 'dzień roboczy', 'dni robocze', 'dni roboczych');
    return `${minDays} ${unit}`;
  }

  const unit = getPolishPlural(maxDays, 'dzień roboczy', 'dni robocze', 'dni roboczych');
  return `${minDays}–${maxDays} ${unit}`;
}

/**
 * Checks if a given deadline timestamp is already in the past.
 */
export function isOverdue(deadline: Date | string | number, baseInput?: Date | string | number): boolean {
  const target = parseDate(deadline);
  const base = baseInput ? parseDate(baseInput) : new Date();
  return target.getTime() < base.getTime();
}

// ============================================================================
// Zod Schemas
// ============================================================================

export const isoDateStringSchema = z
  .string()
  .datetime({ message: 'Nieprawidłowy format daty ISO 8601' })
  .transform((val) => new Date(val));
