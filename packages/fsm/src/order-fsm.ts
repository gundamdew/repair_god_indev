import { randomUUID } from 'node:crypto';
import { ORDER_TRANSITIONS } from './transitions.js';
import {
  FsmActor,
  FsmTransitionError,
  OrderStatus,
  orderFsmContextSchema,
  type OrderFsmContext,
  type OrderStatusEvent,
  type TransitionResult,
  type TransitionSuccessResult,
} from './types.js';

/**
 * Order Lifecycle Finite State Machine.
 * Enforces deterministic order state transitions as defined in docs/fsm.md.
 */
export class OrderFSM {
  /**
   * Retrieves all allowable next states from the specified state.
   *
   * @param from The current order status.
   * @returns Array of unique target OrderStatuses.
   */
  static getNextStates(from: OrderStatus): OrderStatus[] {
    const states = ORDER_TRANSITIONS
      .filter((t) => t.from === from)
      .map((t) => t.to);
    return Array.from(new Set(states));
  }

  /**
   * Retrieves all actors permitted to execute a transition between the two statuses.
   *
   * @param from The source order status.
   * @param to The destination order status.
   * @returns Array of allowed FsmActors, or empty array if transition is invalid.
   */
  static getAllowedActors(from: OrderStatus, to: OrderStatus): FsmActor[] {
    const transition = ORDER_TRANSITIONS.find((t) => t.from === from && t.to === to);
    return transition ? [...transition.allowedActors] : [];
  }

  /**
   * Determines if a transition from `from` to `to` is legally allowed.
   * If `actor` is provided, also checks whether that actor is authorized.
   *
   * @param from Source order status.
   * @param to Destination order status.
   * @param actor Optional actor triggering the transition.
   * @returns `true` if transition is permissible; otherwise `false`.
   */
  static canTransition(from: OrderStatus, to: OrderStatus, actor?: FsmActor): boolean {
    const transition = ORDER_TRANSITIONS.find((t) => t.from === from && t.to === to);
    if (!transition) {
      return false;
    }
    if (actor !== undefined) {
      return transition.allowedActors.includes(actor);
    }
    return true;
  }

  /**
   * Checks whether the given status is a terminal state (no outgoing transitions).
   * Terminal states: CLOSED, CANCELLED, CANCELLED_AND_RETURNED, UNDER_INVESTIGATION.
   *
   * @param status The status to verify.
   * @returns `true` if the status is terminal; otherwise `false`.
   */
  static isTerminal(status: OrderStatus): boolean {
    return this.getNextStates(status).length === 0;
  }

  /**
   * Checks whether an order in this status can be cancelled (directly transition to CANCELLED).
   * Applicable states: DRAFT, DIAGNOSED, ORDER_CONFIRMED, LABEL_GENERATED.
   *
   * @param status The status to verify.
   * @returns `true` if the order is cancellable; otherwise `false`.
   */
  static isCancellable(status: OrderStatus): boolean {
    const cancellableStatuses: readonly OrderStatus[] = [
      OrderStatus.DRAFT,
      OrderStatus.DIAGNOSED,
      OrderStatus.ORDER_CONFIRMED,
      OrderStatus.LABEL_GENERATED,
    ];
    return cancellableStatuses.includes(status);
  }

  /**
   * Asserts that a transition is allowed, throwing an FsmTransitionError if not.
   *
   * @param from Source status.
   * @param to Destination status.
   * @param actor Actor triggering the transition.
   * @throws FsmTransitionError if the transition is invalid or actor unauthorized.
   */
  static assertCanTransition(from: OrderStatus, to: OrderStatus, actor: FsmActor): void {
    const transition = ORDER_TRANSITIONS.find((t) => t.from === from && t.to === to);
    if (!transition) {
      throw new FsmTransitionError(
        from,
        to,
        actor,
        'INVALID_TRANSITION',
        `Invalid order status transition from '${from}' to '${to}'. Allowed next states: [${this.getNextStates(from).join(', ')}]`,
      );
    }
    if (!transition.allowedActors.includes(actor)) {
      throw new FsmTransitionError(
        from,
        to,
        actor,
        'UNAUTHORIZED_ACTOR',
        `Actor '${actor}' is not authorized to transition from '${from}' to '${to}'. Allowed actors: [${transition.allowedActors.join(', ')}]`,
      );
    }
  }

  /**
   * Executes a state transition on the provided Order context.
   * On success, generates an OrderStatusEvent and returns the updated context.
   * On failure, returns a failure result with descriptive error and code.
   *
   * @param context Current Order FSM context.
   * @param to Desired target status.
   * @param actor Actor performing the transition.
   * @param options Optional transition metadata, reason, or note.
   * @returns TransitionResult
   */
  static transition(
    context: OrderFsmContext,
    to: OrderStatus,
    actor: FsmActor,
    options?: {
      reason?: string;
      note?: string;
      metadata?: Record<string, unknown>;
    },
  ): TransitionResult {
    const parseResult = orderFsmContextSchema.safeParse(context);
    if (!parseResult.success) {
      return {
        success: false,
        from: context.currentStatus,
        to,
        actor,
        error: `OrderFsmContext validation failed: ${parseResult.error.message}`,
        code: 'VALIDATION_FAILED',
      };
    }

    const from = context.currentStatus;
    const transitionDef = ORDER_TRANSITIONS.find((t) => t.from === from && t.to === to);

    if (!transitionDef) {
      const allowedNext = this.getNextStates(from);
      return {
        success: false,
        from,
        to,
        actor,
        error: `Invalid transition from '${from}' to '${to}'. Allowed next states: [${allowedNext.join(', ')}]`,
        code: 'INVALID_TRANSITION',
      };
    }

    if (!transitionDef.allowedActors.includes(actor)) {
      const allowedActors = transitionDef.allowedActors;
      return {
        success: false,
        from,
        to,
        actor,
        error: `Actor '${actor}' is not authorized to transition from '${from}' to '${to}'. Allowed actors: [${allowedActors.join(', ')}]`,
        code: 'UNAUTHORIZED_ACTOR',
      };
    }

    const event: OrderStatusEvent = {
      id: randomUUID(),
      orderId: context.orderId,
      fromStatus: from,
      toStatus: to,
      actor,
      timestamp: new Date(),
      ...(options?.reason ? { reason: options.reason } : {}),
      ...(options?.note ? { note: options.note } : {}),
      ...(options?.metadata ? { metadata: options.metadata } : {}),
    };

    const updatedContext: OrderFsmContext = {
      ...context,
      currentStatus: to,
      updatedAt: event.timestamp,
      history: context.history ? [...context.history, event] : [event],
    };

    return {
      success: true,
      from,
      to,
      actor,
      event,
      context: updatedContext,
    };
  }

  /**
   * Performs the transition and asserts success, throwing an FsmTransitionError on failure.
   */
  static assertTransition(
    context: OrderFsmContext,
    to: OrderStatus,
    actor: FsmActor,
    options?: {
      reason?: string;
      note?: string;
      metadata?: Record<string, unknown>;
    },
  ): TransitionSuccessResult<OrderStatus, OrderFsmContext, OrderStatusEvent> {
    const result = this.transition(context, to, actor, options);
    if (!result.success) {
      throw new FsmTransitionError(result.from, result.to, result.actor, result.code, result.error);
    }
    return result;
  }
}
