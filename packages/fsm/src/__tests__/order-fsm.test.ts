import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  FsmActor,
  FsmTransitionError,
  OrderFSM,
  OrderStatus,
  type OrderFsmContext,
} from '../index.js';

describe('OrderFSM', () => {
  const createInitialContext = (overrides?: Partial<OrderFsmContext>): OrderFsmContext => ({
    orderId: 'ord-12345',
    currentStatus: OrderStatus.DRAFT,
    customerId: 'cust-999',
    quotePriceGrosz: 25000, // 250.00 PLN in grosz
    currency: 'PLN',
    ...overrides,
  });

  describe('Happy path transitions', () => {
    it('executes full linear lifecycle from DRAFT to CLOSED', () => {
      let ctx = createInitialContext();

      // 1. DRAFT -> DIAGNOSED (CUSTOMER)
      let res = OrderFSM.transition(ctx, OrderStatus.DIAGNOSED, FsmActor.CUSTOMER);
      assert.strictEqual(res.success, true);
      if (!res.success) return;
      assert.strictEqual(res.to, OrderStatus.DIAGNOSED);
      assert.strictEqual(res.event.fromStatus, OrderStatus.DRAFT);
      assert.strictEqual(res.event.toStatus, OrderStatus.DIAGNOSED);
      assert.strictEqual(res.event.actor, FsmActor.CUSTOMER);
      ctx = res.context;

      // 2. DIAGNOSED -> ORDER_CONFIRMED (SYSTEM)
      res = OrderFSM.transition(ctx, OrderStatus.ORDER_CONFIRMED, FsmActor.SYSTEM);
      assert.strictEqual(res.success, true);
      if (!res.success) return;
      ctx = res.context;

      // 3. ORDER_CONFIRMED -> LABEL_GENERATED (CUSTOMER or SYSTEM)
      res = OrderFSM.transition(ctx, OrderStatus.LABEL_GENERATED, FsmActor.CUSTOMER);
      assert.strictEqual(res.success, true);
      if (!res.success) return;
      ctx = res.context;

      // 4. LABEL_GENERATED -> IN_TRANSIT_TO_HUB (SYSTEM)
      res = OrderFSM.transition(ctx, OrderStatus.IN_TRANSIT_TO_HUB, FsmActor.SYSTEM);
      assert.strictEqual(res.success, true);
      if (!res.success) return;
      ctx = res.context;

      // 5. IN_TRANSIT_TO_HUB -> RECEIVED_AT_WORKSHOP (COURIER / WEBHOOK)
      res = OrderFSM.transition(ctx, OrderStatus.RECEIVED_AT_WORKSHOP, FsmActor.COURIER);
      assert.strictEqual(res.success, true);
      if (!res.success) return;
      ctx = res.context;

      // 6. RECEIVED_AT_WORKSHOP -> INSPECTION_CONFIRMED (TECHNICIAN)
      res = OrderFSM.transition(ctx, OrderStatus.INSPECTION_CONFIRMED, FsmActor.TECHNICIAN);
      assert.strictEqual(res.success, true);
      if (!res.success) return;
      ctx = res.context;

      // 7. INSPECTION_CONFIRMED -> REPAIR_IN_PROGRESS (TECHNICIAN or CUSTOMER)
      res = OrderFSM.transition(ctx, OrderStatus.REPAIR_IN_PROGRESS, FsmActor.TECHNICIAN);
      assert.strictEqual(res.success, true);
      if (!res.success) return;
      ctx = res.context;

      // 8. REPAIR_IN_PROGRESS -> QUALITY_CONTROL (TECHNICIAN)
      res = OrderFSM.transition(ctx, OrderStatus.QUALITY_CONTROL, FsmActor.TECHNICIAN);
      assert.strictEqual(res.success, true);
      if (!res.success) return;
      ctx = res.context;

      // 9. QUALITY_CONTROL -> RETURN_IN_TRANSIT (TECHNICIAN)
      res = OrderFSM.transition(ctx, OrderStatus.RETURN_IN_TRANSIT, FsmActor.TECHNICIAN);
      assert.strictEqual(res.success, true);
      if (!res.success) return;
      ctx = res.context;

      // 10. RETURN_IN_TRANSIT -> DELIVERED (COURIER or WEBHOOK)
      res = OrderFSM.transition(ctx, OrderStatus.DELIVERED, FsmActor.WEBHOOK);
      assert.strictEqual(res.success, true);
      if (!res.success) return;
      ctx = res.context;

      // 11. DELIVERED -> FUNDS_RELEASED (CUSTOMER or COURIER)
      res = OrderFSM.transition(ctx, OrderStatus.FUNDS_RELEASED, FsmActor.CUSTOMER);
      assert.strictEqual(res.success, true);
      if (!res.success) return;
      ctx = res.context;

      // 12. FUNDS_RELEASED -> CLOSED (SYSTEM)
      res = OrderFSM.transition(ctx, OrderStatus.CLOSED, FsmActor.SYSTEM);
      assert.strictEqual(res.success, true);
      if (!res.success) return;
      ctx = res.context;

      assert.strictEqual(ctx.currentStatus, OrderStatus.CLOSED);
      assert.strictEqual(ctx.history?.length, 12);
      assert.strictEqual(OrderFSM.isTerminal(ctx.currentStatus), true);
    });
  });

  describe('Branches and alternative flows', () => {
    it('handles Price Adjustment cycle with customer approval', () => {
      const ctx = createInitialContext({ currentStatus: OrderStatus.RECEIVED_AT_WORKSHOP });

      // Workshop finds hidden defect -> PRICE_ADJUSTMENT_NEEDED
      const res1 = OrderFSM.transition(
        ctx,
        OrderStatus.PRICE_ADJUSTMENT_NEEDED,
        FsmActor.TECHNICIAN,
        { reason: 'Corrosion found on motherboard' },
      );
      assert.strictEqual(res1.success, true);
      if (!res1.success) return;
      assert.strictEqual(res1.event.reason, 'Corrosion found on motherboard');

      // Customer approves -> INSPECTION_CONFIRMED
      const res2 = OrderFSM.transition(
        res1.context,
        OrderStatus.INSPECTION_CONFIRMED,
        FsmActor.TECHNICIAN,
      );
      assert.strictEqual(res2.success, true);
      if (!res2.success) return;
      assert.strictEqual(res2.to, OrderStatus.INSPECTION_CONFIRMED);
    });

    it('handles Price Adjustment rejection with CANCELLED_AND_RETURNED', () => {
      const ctx = createInitialContext({ currentStatus: OrderStatus.PRICE_ADJUSTMENT_NEEDED });

      const res = OrderFSM.transition(
        ctx,
        OrderStatus.CANCELLED_AND_RETURNED,
        FsmActor.TECHNICIAN,
        { reason: 'Customer rejected higher repair quote' },
      );
      assert.strictEqual(res.success, true);
      if (!res.success) return;
      assert.strictEqual(res.to, OrderStatus.CANCELLED_AND_RETURNED);
      assert.strictEqual(OrderFSM.isTerminal(res.to), true);
    });

    it('handles Inspection Confirmation rejection with CANCELLED_AND_RETURNED', () => {
      const ctx = createInitialContext({ currentStatus: OrderStatus.INSPECTION_CONFIRMED });

      const res = OrderFSM.transition(
        ctx,
        OrderStatus.CANCELLED_AND_RETURNED,
        FsmActor.CUSTOMER,
      );
      assert.strictEqual(res.success, true);
      if (!res.success) return;
      assert.strictEqual(res.to, OrderStatus.CANCELLED_AND_RETURNED);
      assert.strictEqual(OrderFSM.isTerminal(res.to), true);
    });

    it('handles Dispute branch to UNDER_INVESTIGATION', () => {
      const ctx = createInitialContext({ currentStatus: OrderStatus.DELIVERED });

      // Customer disputes delivery within 48h
      const res1 = OrderFSM.transition(ctx, OrderStatus.DISPUTED, FsmActor.CUSTOMER);
      assert.strictEqual(res1.success, true);
      if (!res1.success) return;
      assert.strictEqual(res1.to, OrderStatus.DISPUTED);

      // Customer / Platform escalates to UNDER_INVESTIGATION
      const res2 = OrderFSM.transition(
        res1.context,
        OrderStatus.UNDER_INVESTIGATION,
        FsmActor.CUSTOMER,
      );
      assert.strictEqual(res2.success, true);
      if (!res2.success) return;
      assert.strictEqual(res2.to, OrderStatus.UNDER_INVESTIGATION);
      assert.strictEqual(OrderFSM.isTerminal(res2.to), true);
    });

    it('cancels from all cancellable early states', () => {
      const cancellableStatuses = [
        OrderStatus.DRAFT,
        OrderStatus.DIAGNOSED,
        OrderStatus.ORDER_CONFIRMED,
        OrderStatus.LABEL_GENERATED,
      ];

      for (const status of cancellableStatuses) {
        assert.strictEqual(OrderFSM.isCancellable(status), true);
        const actors = OrderFSM.getAllowedActors(status, OrderStatus.CANCELLED);
        assert.ok(actors.length > 0, `Status ${status} should have allowed actors to CANCELLED`);

        const ctx = createInitialContext({ currentStatus: status });
        const actor = actors[0]!;
        const res = OrderFSM.transition(ctx, OrderStatus.CANCELLED, actor);
        assert.strictEqual(res.success, true);
        if (!res.success) return;
        assert.strictEqual(res.to, OrderStatus.CANCELLED);
        assert.strictEqual(OrderFSM.isTerminal(res.to), true);
      }
    });

    it('resets DIAGNOSED back to DRAFT by SYSTEM', () => {
      const ctx = createInitialContext({ currentStatus: OrderStatus.DIAGNOSED });
      const res = OrderFSM.transition(ctx, OrderStatus.DRAFT, FsmActor.SYSTEM);
      assert.strictEqual(res.success, true);
      if (!res.success) return;
      assert.strictEqual(res.to, OrderStatus.DRAFT);
    });
  });

  describe('Invalid transitions and RBAC validations', () => {
    it('rejects jumping over required states', () => {
      const ctx = createInitialContext({ currentStatus: OrderStatus.DRAFT });
      const res = OrderFSM.transition(ctx, OrderStatus.REPAIR_IN_PROGRESS, FsmActor.TECHNICIAN);
      assert.strictEqual(res.success, false);
      if (res.success) return;
      assert.strictEqual(res.code, 'INVALID_TRANSITION');
      assert.match(res.error, /Invalid transition from 'DRAFT' to 'REPAIR_IN_PROGRESS'/);
    });

    it('rejects unauthorized actor even if transition path exists', () => {
      const ctx = createInitialContext({ currentStatus: OrderStatus.IN_TRANSIT_TO_HUB });
      // CUSTOMER cannot mark parcel as received at workshop (must be COURIER or WEBHOOK)
      const res = OrderFSM.transition(ctx, OrderStatus.RECEIVED_AT_WORKSHOP, FsmActor.CUSTOMER);
      assert.strictEqual(res.success, false);
      if (res.success) return;
      assert.strictEqual(res.code, 'UNAUTHORIZED_ACTOR');
      assert.match(res.error, /Actor 'CUSTOMER' is not authorized/);
    });

    it('rejects transition out of terminal state', () => {
      const ctx = createInitialContext({ currentStatus: OrderStatus.CLOSED });
      assert.strictEqual(OrderFSM.isTerminal(OrderStatus.CLOSED), true);
      assert.deepStrictEqual(OrderFSM.getNextStates(OrderStatus.CLOSED), []);

      const res = OrderFSM.transition(ctx, OrderStatus.DRAFT, FsmActor.SYSTEM);
      assert.strictEqual(res.success, false);
      if (res.success) return;
      assert.strictEqual(res.code, 'INVALID_TRANSITION');
    });

    it('assertTransition throws FsmTransitionError on violation', () => {
      const ctx = createInitialContext({ currentStatus: OrderStatus.DRAFT });
      assert.throws(
        () => OrderFSM.assertTransition(ctx, OrderStatus.CLOSED, FsmActor.SYSTEM),
        (err: unknown) => err instanceof FsmTransitionError && err.code === 'INVALID_TRANSITION',
      );
    });
  });

  describe('Helper static methods', () => {
    it('identifies terminal states correctly', () => {
      assert.strictEqual(OrderFSM.isTerminal(OrderStatus.CLOSED), true);
      assert.strictEqual(OrderFSM.isTerminal(OrderStatus.CANCELLED), true);
      assert.strictEqual(OrderFSM.isTerminal(OrderStatus.CANCELLED_AND_RETURNED), true);
      assert.strictEqual(OrderFSM.isTerminal(OrderStatus.UNDER_INVESTIGATION), true);
      assert.strictEqual(OrderFSM.isTerminal(OrderStatus.DRAFT), false);
      assert.strictEqual(OrderFSM.isTerminal(OrderStatus.REPAIR_IN_PROGRESS), false);
    });

    it('identifies cancellable states correctly', () => {
      assert.strictEqual(OrderFSM.isCancellable(OrderStatus.DRAFT), true);
      assert.strictEqual(OrderFSM.isCancellable(OrderStatus.DIAGNOSED), true);
      assert.strictEqual(OrderFSM.isCancellable(OrderStatus.ORDER_CONFIRMED), true);
      assert.strictEqual(OrderFSM.isCancellable(OrderStatus.LABEL_GENERATED), true);
      assert.strictEqual(OrderFSM.isCancellable(OrderStatus.REPAIR_IN_PROGRESS), false);
      assert.strictEqual(OrderFSM.isCancellable(OrderStatus.DELIVERED), false);
    });

    it('canTransition returns boolean based on state and actor', () => {
      assert.strictEqual(
        OrderFSM.canTransition(OrderStatus.DRAFT, OrderStatus.DIAGNOSED, FsmActor.CUSTOMER),
        true,
      );
      assert.strictEqual(
        OrderFSM.canTransition(OrderStatus.DRAFT, OrderStatus.DIAGNOSED, FsmActor.TECHNICIAN),
        false,
      );
      assert.strictEqual(
        OrderFSM.canTransition(OrderStatus.DRAFT, OrderStatus.DIAGNOSED),
        true,
      );
      assert.strictEqual(
        OrderFSM.canTransition(OrderStatus.DRAFT, OrderStatus.DELIVERED),
        false,
      );
    });

    it('getAllowedActors returns correct array or empty array', () => {
      assert.deepStrictEqual(
        OrderFSM.getAllowedActors(OrderStatus.DRAFT, OrderStatus.DIAGNOSED),
        [FsmActor.CUSTOMER],
      );
      assert.deepStrictEqual(
        OrderFSM.getAllowedActors(OrderStatus.ORDER_CONFIRMED, OrderStatus.LABEL_GENERATED),
        [FsmActor.CUSTOMER, FsmActor.SYSTEM],
      );
      assert.deepStrictEqual(
        OrderFSM.getAllowedActors(OrderStatus.DRAFT, OrderStatus.DELIVERED),
        [],
      );
    });
  });
});
