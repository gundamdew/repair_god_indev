import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatPLN,
  groszeToPLN,
  plnToGrosze,
  addGrosze,
  subtractGrosze,
  multiplyGrosze,
  calculateVat,
  calculateNettoFromBrutto,
  groszeSchema,
  nonNegativeGroszeSchema,
} from './currency.js';

import {
  isValidIMEI,
  calculateIMEICheckDigit,
  formatIMEI,
  isValidSerial,
  imeiSchema,
  serialNumberSchema,
} from './imei.js';

import {
  normalizePolishPhoneNumber,
  isValidPolishPhone,
  formatPolishPhone,
  toE164,
  polishPhoneSchema,
} from './phone.js';

import {
  formatDate,
  formatDateLong,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  addBusinessDays,
  formatBusinessDaysRange,
  isOverdue,
} from './date.js';

import {
  ORDER_STATUSES,
  getOrderStatusLabel,
  getOrderStatusDescription,
  getOrderStatusVariant,
  getOrderProgress,
  getOrderStepInfo,
  isActionRequiredByCustomer,
  isTerminalStatus,
  isOrderActive,
  orderStatusSchema,
} from './order.js';

// ============================================================================
// Currency Tests
// ============================================================================

test('currency: formatPLN formats grosze as Polish zloty', () => {
  assert.equal(formatPLN(10000), '100,00 zł');
  assert.equal(formatPLN(10050), '100,50 zł');
  assert.equal(formatPLN(0), '0,00 zł');
  assert.equal(formatPLN(1234567), '12 345,67 zł');
  assert.equal(formatPLN(-5000), '-50,00 zł');
  assert.equal(formatPLN(10000, { hideZeroGrosze: true }), '100 zł');
  assert.equal(formatPLN(10050, { hideZeroGrosze: true }), '100,50 zł');
  assert.equal(formatPLN(10000, { withSymbol: false }), '100,00');
});

test('currency: groszeToPLN and plnToGrosze conversions', () => {
  assert.equal(groszeToPLN(10000), 100);
  assert.equal(groszeToPLN(10050), 100.5);
  assert.equal(groszeToPLN(2999), 29.99);

  assert.equal(plnToGrosze(100), 10000);
  assert.equal(plnToGrosze(100.5), 10050);
  assert.equal(plnToGrosze(29.99), 2999);
});

test('currency: integer arithmetic and VAT calculations', () => {
  assert.equal(addGrosze(1000, 2050, 3000), 6050);
  assert.equal(subtractGrosze(5000, 1500), 3500);
  assert.equal(multiplyGrosze(1000, 1.23), 1230);

  const vatCalc = calculateVat(10000, 23);
  assert.equal(vatCalc.netto, 10000);
  assert.equal(vatCalc.vat, 2300);
  assert.equal(vatCalc.brutto, 12300);

  const bruttoCalc = calculateNettoFromBrutto(12300, 23);
  assert.equal(bruttoCalc.netto, 10000);
  assert.equal(bruttoCalc.vat, 2300);
  assert.equal(bruttoCalc.brutto, 12300);
});

test('currency: Zod schemas validate grosze integers', () => {
  assert.equal(groszeSchema.parse(5000), 5000);
  assert.throws(() => groszeSchema.parse(50.5));
  assert.equal(nonNegativeGroszeSchema.parse(0), 0);
  assert.throws(() => nonNegativeGroszeSchema.parse(-100));
});

// ============================================================================
// IMEI & Serial Tests
// ============================================================================

test('imei: Luhn check digit calculation and validation', () => {
  // Test with known valid IMEI
  const validImeiPrefix = '35209900176148';
  const checkDigit = calculateIMEICheckDigit(validImeiPrefix);
  assert.equal(checkDigit, 1);

  const fullValidImei = `${validImeiPrefix}${checkDigit}`;
  assert.equal(isValidIMEI(fullValidImei), true);
  assert.equal(isValidIMEI('35 209900 176148 1'), true);
  assert.equal(isValidIMEI('35-209900-176148-1'), true);

  // Invalid check digit
  assert.equal(isValidIMEI(`${validImeiPrefix}2`), false);
  // Invalid length
  assert.equal(isValidIMEI('12345'), false);
  // Non-numeric
  assert.equal(isValidIMEI('35209900176148A'), false);
});

test('imei: formatIMEI formats correctly', () => {
  assert.equal(formatIMEI('352099001761481'), '35-209900-176148-1');
  assert.equal(formatIMEI('352099001761481', ' '), '35 209900 176148 1');
});

test('imei: serial validation and Zod schema', () => {
  assert.equal(isValidSerial('C02G80XYZ088'), true);
  assert.equal(isValidSerial('SN-12345-AB'), true);
  assert.equal(isValidSerial('12'), false); // too short

  assert.equal(serialNumberSchema.parse(' c02g80xyz088 '), 'C02G80XYZ088');
  assert.equal(imeiSchema.parse('35 209900 176148 1'), '352099001761481');
});

// ============================================================================
// Phone Tests
// ============================================================================

test('phone: normalize, validate and format Polish phone numbers', () => {
  assert.equal(normalizePolishPhoneNumber('+48 501 234 567'), '501234567');
  assert.equal(normalizePolishPhoneNumber('0048501234567'), '501234567');
  assert.equal(normalizePolishPhoneNumber('501-234-567'), '501234567');

  assert.equal(isValidPolishPhone('501234567'), true);
  assert.equal(isValidPolishPhone('+48 501 234 567'), true);
  assert.equal(isValidPolishPhone('001234567'), false); // starts with 0
  assert.equal(isValidPolishPhone('12345'), false); // too short

  assert.equal(formatPolishPhone('501234567'), '+48 501 234 567');
  assert.equal(formatPolishPhone('+48501234567', { withCountryCode: false }), '501 234 567');
  assert.equal(formatPolishPhone('501234567', { separator: '-' }), '+48-501-234-567');

  assert.equal(toE164('501 234 567'), '+48501234567');
  assert.equal(polishPhoneSchema.parse('501 234 567'), '+48501234567');
});

// ============================================================================
// Date Tests
// ============================================================================

test('date: formatters produce expected Polish strings', () => {
  const d = new Date(2026, 9, 27, 14, 30, 0); // 27 Oct 2026, 14:30
  assert.equal(formatDate(d), '27.10.2026');
  assert.equal(formatDateLong(d), '27 października 2026');
  assert.equal(formatTime(d), '14:30');
  assert.equal(formatDateTime(d), '27.10.2026, 14:30');
});

test('date: formatRelativeTime handles past and future correctly', () => {
  const now = new Date(2026, 9, 27, 12, 0, 0);

  // 10 seconds ago
  assert.equal(formatRelativeTime(new Date(2026, 9, 27, 11, 59, 50), now), 'przed chwilą');
  // 5 minutes ago
  assert.equal(formatRelativeTime(new Date(2026, 9, 27, 11, 55, 0), now), '5 minut temu');
  // 2 minutes ago
  assert.equal(formatRelativeTime(new Date(2026, 9, 27, 11, 58, 0), now), '2 minuty temu');
  // 1 hour ago
  assert.equal(formatRelativeTime(new Date(2026, 9, 27, 11, 0, 0), now), '1 godzinę temu');
  // 3 hours ago
  assert.equal(formatRelativeTime(new Date(2026, 9, 27, 9, 0, 0), now), '3 godziny temu');
  // 10 minutes in future
  assert.equal(formatRelativeTime(new Date(2026, 9, 27, 12, 10, 0), now), 'za 10 minut');
});

test('date: business days calculation', () => {
  // Friday Oct 23, 2026 + 1 business day -> Monday Oct 26, 2026
  const friday = new Date(2026, 9, 23, 10, 0, 0);
  const nextBusinessDay = addBusinessDays(friday, 1);
  assert.equal(nextBusinessDay.getDay(), 1); // Monday
  assert.equal(nextBusinessDay.getDate(), 26);

  assert.equal(formatBusinessDaysRange(1, 2), '1–2 dni robocze');
  assert.equal(formatBusinessDaysRange(1, 1), '1 dzień roboczy');
  assert.equal(formatBusinessDaysRange(5, 7), '5–7 dni roboczych');

  assert.equal(isOverdue(new Date(2026, 9, 26), new Date(2026, 9, 27)), true);
  assert.equal(isOverdue(new Date(2026, 9, 28), new Date(2026, 9, 27)), false);
});

// ============================================================================
// Order Status Tests
// ============================================================================

test('order: status labels, descriptions and metadata', () => {
  for (const status of ORDER_STATUSES) {
    const label = getOrderStatusLabel(status);
    assert.ok(label && label.length > 0, `Status ${status} must have a label`);
    const desc = getOrderStatusDescription(status);
    assert.ok(desc && desc.length > 0, `Status ${status} must have a description`);
    const variant = getOrderStatusVariant(status);
    assert.ok(variant, `Status ${status} must have a variant`);
    const progress = getOrderProgress(status);
    assert.ok(progress >= 0 && progress <= 100, `Progress for ${status} must be 0-100`);
    const stepInfo = getOrderStepInfo(status);
    assert.ok(stepInfo.step >= 1 && stepInfo.step <= 5, `Step for ${status} must be 1-5`);
  }

  assert.equal(isActionRequiredByCustomer('PriceAdjustmentNeeded'), true);
  assert.equal(isActionRequiredByCustomer('Delivered'), true);
  assert.equal(isActionRequiredByCustomer('RepairInProgress'), false);

  assert.equal(isTerminalStatus('Closed'), true);
  assert.equal(isTerminalStatus('Cancelled'), true);
  assert.equal(isTerminalStatus('CancelledAndReturned'), true);
  assert.equal(isTerminalStatus('RepairInProgress'), false);

  assert.equal(isOrderActive('RepairInProgress'), true);
  assert.equal(isOrderActive('Closed'), false);

  assert.equal(orderStatusSchema.parse('InspectionConfirmed'), 'InspectionConfirmed');
  assert.throws(() => orderStatusSchema.parse('InvalidStatus'));
});
