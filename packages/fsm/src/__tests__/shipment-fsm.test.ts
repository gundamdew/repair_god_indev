import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  FsmActor,
  FsmTransitionError,
  ShipmentFSM,
  ShipmentStatus,
  type ShipmentFsmContext,
} from '../index.js';

describe('ShipmentFSM', () => {
  const createInitialContext = (overrides?: Partial<ShipmentFsmContext>): ShipmentFsmContext => ({
    shipmentId: 'shp-12345',
    orderId: 'ord-12345',
    currentStatus: ShipmentStatus.CREATED,
    carrier: 'INPOST',
    trackingNumber: '624000123456789012345678',
    ...overrides,
  });

  describe('Happy path courier transitions', () => {
    it('executes full shipment lifecycle from CREATED to DELIVERED', () => {
      let ctx = createInitialContext();

      // 1. CREATED -> LABEL_GENERATED (SYSTEM or TECHNICIAN or CUSTOMER)
      let res = ShipmentFSM.transition(ctx, ShipmentStatus.LABEL_GENERATED, FsmActor.SYSTEM);
      assert.strictEqual(res.success, true);
      if (!res.success) return;
      assert.strictEqual(res.to, ShipmentStatus.LABEL_GENERATED);
      ctx = res.context;

      // 2. LABEL_GENERATED -> PICKED_UP (COURIER or WEBHOOK)
      res = ShipmentFSM.transition(ctx, ShipmentStatus.PICKED_UP, FsmActor.COURIER);
      assert.strictEqual(res.success, true);
      if (!res.success) return;
      assert.strictEqual(res.to, ShipmentStatus.PICKED_UP);
      ctx = res.context;

      // 3. PICKED_UP -> IN_TRANSIT (COURIER or WEBHOOK)
      res = ShipmentFSM.transition(ctx, ShipmentStatus.IN_TRANSIT, FsmActor.WEBHOOK);
      assert.strictEqual(res.success, true);
      if (!res.success) return;
      assert.strictEqual(res.to, ShipmentStatus.IN_TRANSIT);
      ctx = res.context;

      // 4. IN_TRANSIT -> DELIVERED (COURIER or WEBHOOK)
      res = ShipmentFSM.transition(ctx, ShipmentStatus.DELIVERED, FsmActor.COURIER);
      assert.strictEqual(res.success, true);
      if (!res.success) return;
      assert.strictEqual(res.to, ShipmentStatus.DELIVERED);
      ctx = res.context;

      assert.strictEqual(ShipmentFSM.isTerminal(ctx.currentStatus), true);
      assert.strictEqual(ctx.history?.length, 4);
    });

    it('handles return to sender when delivery fails', () => {
      const ctx = createInitialContext({ currentStatus: ShipmentStatus.IN_TRANSIT });

      const res = ShipmentFSM.transition(
        ctx,
        ShipmentStatus.RETURNED,
        FsmActor.WEBHOOK,
        { reason: 'Parcel not collected from locker within 48h' },
      );
      assert.strictEqual(res.success, true);
      if (!res.success) return;
      assert.strictEqual(res.to, ShipmentStatus.RETURNED);
      assert.strictEqual(ShipmentFSM.isTerminal(res.to), true);
      assert.strictEqual(res.event.reason, 'Parcel not collected from locker within 48h');
    });

    it('cancels shipment from CREATED and LABEL_GENERATED', () => {
      assert.strictEqual(ShipmentFSM.isCancellable(ShipmentStatus.CREATED), true);
      assert.strictEqual(ShipmentFSM.isCancellable(ShipmentStatus.LABEL_GENERATED), true);
      assert.strictEqual(ShipmentFSM.isCancellable(ShipmentStatus.PICKED_UP), false);

      const ctx = createInitialContext({ currentStatus: ShipmentStatus.LABEL_GENERATED });
      const res = ShipmentFSM.transition(ctx, ShipmentStatus.CANCELLED, FsmActor.CUSTOMER);
      assert.strictEqual(res.success, true);
      if (!res.success) return;
      assert.strictEqual(res.to, ShipmentStatus.CANCELLED);
      assert.strictEqual(ShipmentFSM.isTerminal(res.to), true);
    });
  });

  describe('Invalid transitions and RBAC', () => {
    it('rejects illegal transitions', () => {
      const ctx = createInitialContext({ currentStatus: ShipmentStatus.CREATED });
      const res = ShipmentFSM.transition(ctx, ShipmentStatus.DELIVERED, FsmActor.COURIER);
      assert.strictEqual(res.success, false);
      if (res.success) return;
      assert.strictEqual(res.code, 'INVALID_TRANSITION');
    });

    it('rejects unauthorized actor', () => {
      const ctx = createInitialContext({ currentStatus: ShipmentStatus.LABEL_GENERATED });
      // CUSTOMER cannot mark parcel as PICKED_UP (courier scan required)
      const res = ShipmentFSM.transition(ctx, ShipmentStatus.PICKED_UP, FsmActor.CUSTOMER);
      assert.strictEqual(res.success, false);
      if (res.success) return;
      assert.strictEqual(res.code, 'UNAUTHORIZED_ACTOR');
    });

    it('assertTransition throws FsmTransitionError on violation', () => {
      const ctx = createInitialContext({ currentStatus: ShipmentStatus.DELIVERED });
      assert.throws(
        () => ShipmentFSM.assertTransition(ctx, ShipmentStatus.CREATED, FsmActor.SYSTEM),
        (err: unknown) => err instanceof FsmTransitionError && err.code === 'INVALID_TRANSITION',
      );
    });
  });

  describe('Static helper methods', () => {
    it('returns allowed actors', () => {
      const actors = ShipmentFSM.getAllowedActors(
        ShipmentStatus.LABEL_GENERATED,
        ShipmentStatus.PICKED_UP,
      );
      assert.deepStrictEqual(actors, [FsmActor.COURIER, FsmActor.WEBHOOK]);
    });

    it('returns next states', () => {
      const next = ShipmentFSM.getNextStates(ShipmentStatus.IN_TRANSIT);
      assert.deepStrictEqual(next, [ShipmentStatus.DELIVERED, ShipmentStatus.RETURNED]);
    });
  });
});
