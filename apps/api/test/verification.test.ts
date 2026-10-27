import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MoneyUtil } from '../src/common/money/money.util';
import { OrderFsmService } from '../src/common/fsm/order-fsm.service';
import { GeminiDiagnosticAdapter } from '../src/modules/diagnostics/adapters/gemini-diagnostic.adapter';
import { InPostShipXAdapter } from '../src/modules/logistics/adapters/inpost-shipx.adapter';
import { MockBlikPaymentAdapter } from '../src/modules/billing/adapters/blik-payment.adapter';
import { ConfigService } from '@nestjs/config';

describe('Repair God API - Comprehensive Verification Suite', () => {
  describe('1. Monetary Calculations (Integer Grosze)', () => {
    it('should assert and validate that money values are integers in grosz', () => {
      // 100 PLN = 10000 grosz
      assert.equal(MoneyUtil.plnToGrosze(100), 10000);
      assert.equal(MoneyUtil.formatPln(10000), '100.00 PLN');

      // 450.50 PLN = 45050 grosz
      assert.equal(MoneyUtil.plnToGrosze(450.50), 45050);
      assert.equal(MoneyUtil.formatPln(45050), '450.50 PLN');

      // Valid integer assertion
      assert.doesNotThrow(() => MoneyUtil.assertValidGrosze(10000));
      assert.doesNotThrow(() => MoneyUtil.assertValidGrosze(0));

      // Rejects floating point money
      assert.throws(() => MoneyUtil.assertValidGrosze(100.5), /must be an integer in grosze/);
      assert.throws(() => MoneyUtil.assertValidGrosze(-500), /cannot be negative/);
    });

    it('should calculate 23% VAT accurately using integer arithmetic', () => {
      // Gross 123.00 PLN (12300 grosz) -> Net 100.00 PLN (10000 grosz), VAT 23.00 PLN (2300 grosz)
      const vat = MoneyUtil.calculateVatFromGross(12300, 23);
      const net = MoneyUtil.calculateNetFromGross(12300, 23);
      assert.equal(vat, 2300);
      assert.equal(net, 10000);
      assert.equal(vat + net, 12300);
    });
  });

  describe('2. Order Finite State Machine (FSM)', () => {
    const fsm = new OrderFsmService();

    it('should allow valid transitions defined in docs/fsm.md', () => {
      assert.equal(fsm.canTransition('Draft', 'Diagnosed'), true);
      assert.equal(fsm.canTransition('Draft', 'Cancelled'), true);
      assert.equal(fsm.canTransition('Diagnosed', 'OrderConfirmed'), true);
      assert.equal(fsm.canTransition('OrderConfirmed', 'LabelGenerated'), true);
      assert.equal(fsm.canTransition('LabelGenerated', 'InTransitToHub'), true);
      assert.equal(fsm.canTransition('InTransitToHub', 'ReceivedAtWorkshop'), true);
      assert.equal(fsm.canTransition('ReceivedAtWorkshop', 'InspectionConfirmed'), true);
      assert.equal(fsm.canTransition('ReceivedAtWorkshop', 'PriceAdjustmentNeeded'), true);
      assert.equal(fsm.canTransition('PriceAdjustmentNeeded', 'InspectionConfirmed'), true);
      assert.equal(fsm.canTransition('PriceAdjustmentNeeded', 'CancelledAndReturned'), true);
      assert.equal(fsm.canTransition('InspectionConfirmed', 'RepairInProgress'), true);
      assert.equal(fsm.canTransition('RepairInProgress', 'QualityControl'), true);
      assert.equal(fsm.canTransition('QualityControl', 'ReturnInTransit'), true);
      assert.equal(fsm.canTransition('ReturnInTransit', 'Delivered'), true);
      assert.equal(fsm.canTransition('Delivered', 'FundsReleased'), true);
      assert.equal(fsm.canTransition('FundsReleased', 'Closed'), true);
    });

    it('should strictly reject invalid transitions', () => {
      // Cannot jump from Draft directly to Closed or RepairInProgress
      assert.equal(fsm.canTransition('Draft', 'Closed'), false);
      assert.equal(fsm.canTransition('Draft', 'RepairInProgress'), false);

      // Cannot capture funds before Delivered
      assert.equal(fsm.canTransition('RepairInProgress', 'FundsReleased'), false);
      assert.equal(fsm.canTransition('InTransitToHub', 'FundsReleased'), false);

      // Throws BadRequestException on invalid transition
      assert.throws(() => fsm.validateTransition('Draft', 'Closed'), /Invalid Order FSM transition/);
    });
  });

  describe('3. AI Diagnostic Engine (Gemini Simulation)', () => {
    it('should return structured Gemini output with prices in integer grosz', async () => {
      const configService = new ConfigService();
      const adapter = new GeminiDiagnosticAdapter(configService);

      const result = await adapter.diagnose({
        category: 'SMARTPHONE',
        brand: 'Apple',
        model: 'iPhone 15 Pro',
        symptoms: ['BROKEN_SCREEN', 'GLASS_SHATTERED'],
        userDescription: 'Ekran jest rozbity po upadku, dotyk działa',
      });

      assert.ok(result.suspectedFailure.length > 0);
      assert.ok(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(result.severity));
      assert.equal(typeof result.batteryHazardWarning, 'boolean');
      assert.ok(result.estimatedPartsRequired.length > 0);
      assert.ok(result.repairFeasibilityScore > 0 && result.repairFeasibilityScore <= 1.0);

      // Verify monetary bounds are integers in grosz
      assert.ok(Number.isInteger(result.estimatedPriceRangeGrosze.min));
      assert.ok(Number.isInteger(result.estimatedPriceRangeGrosze.max));
      assert.ok(result.estimatedPriceRangeGrosze.min > 0);
      assert.ok(result.estimatedPriceRangeGrosze.max >= result.estimatedPriceRangeGrosze.min);
    });
  });

  describe('4. InPost ShipX Logistics Adapter', () => {
    it('should generate valid 24-digit tracking number and PDF label URL', async () => {
      const configService = new ConfigService();
      const adapter = new InPostShipXAdapter(configService);

      const shipment = await adapter.createShipment({
        orderId: 'ord-test-1',
        senderLockerCode: 'WAW01A',
        receiverLockerCode: 'WAW14M',
        senderPhone: '+48500100200',
        receiverPhone: '+48221002030',
      });

      assert.ok(shipment.trackingNumber.startsWith('621000'));
      assert.ok(shipment.labelUrl.includes('.pdf'));
      assert.equal(shipment.status, 'LABEL_GENERATED');

      const tracking = await adapter.getTracking(shipment.trackingNumber);
      assert.ok(tracking.length > 0);

      const lockers = await adapter.searchLockers('Warszawa');
      assert.ok(lockers.length > 0);
      assert.ok(lockers.some((l) => l.name === 'WAW01A'));
    });
  });

  describe('5. BLIK & Escrow Safe Settlement', () => {
    it('should authorize BLIK and place funds in Escrow hold in integer grosz', async () => {
      const adapter = new MockBlikPaymentAdapter();
      const amountGrosze = 45000; // 450.00 PLN

      const auth = await adapter.authorizeBlik({
        orderId: 'ord-test-blik',
        blikCode: '777123',
        amountGrosze,
      });

      assert.equal(auth.status, 'AUTHORIZED');
      assert.equal(auth.amountGrosze, 45000);
      assert.equal(auth.paymentMethod, 'BLIK');

      const hold = await adapter.holdEscrow('ord-test-blik', amountGrosze);
      assert.equal(hold.status, 'HELD');
      assert.equal(hold.amountGrosze, 45000);

      const release = await adapter.releaseEscrow('ord-test-blik', amountGrosze);
      assert.equal(release.status, 'RELEASED');
      assert.equal(release.amountGrosze, 45000);
    });
  });
});
