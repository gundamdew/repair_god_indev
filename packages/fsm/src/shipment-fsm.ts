import { randomUUID } from 'node:crypto';
import { SHIPMENT_TRANSITIONS } from './transitions.js';
import {
  FsmActor,
  FsmTransitionError,
  ShipmentStatus,
  shipmentFsmContextSchema,
  type ShipmentFsmContext,
  type ShipmentStatusEvent,
  type ShipmentTransitionResult,
  type TransitionSuccessResult,
} from './types.js';

/**
 * Shipment Lifecycle Finite State Machine.
 * Enforces deterministic courier/logistics state transitions (InPost ShipX & couriers).
 */
export class ShipmentFSM {
  /**
   * Retrieves all allowable next states from the specified shipment status.
   *
   * @param from The current shipment status.
   * @returns Array of unique target ShipmentStatuses.
   */
  static getNextStates(from: ShipmentStatus): ShipmentStatus[] {
    const states = SHIPMENT_TRANSITIONS
      .filter((t) => t.from === from)
      .map((t) => t.to);
    return Array.from(new Set(states));
  }

  /**
   * Retrieves all actors permitted to execute a shipment transition between two statuses.
   *
   * @param from The source shipment status.
   * @param to The destination shipment status.
   * @returns Array of allowed FsmActors, or empty array if transition is invalid.
   */
  static getAllowedActors(from: ShipmentStatus, to: ShipmentStatus): FsmActor[] {
    const transition = SHIPMENT_TRANSITIONS.find((t) => t.from === from && t.to === to);
    return transition ? [...transition.allowedActors] : [];
  }

  /**
   * Determines if a transition from `from` to `to` is legally allowed.
   * If `actor` is provided, also checks whether that actor is authorized.
   *
   * @param from Source shipment status.
   * @param to Destination shipment status.
   * @param actor Optional actor triggering the transition.
   * @returns `true` if transition is permissible; otherwise `false`.
   */
  static canTransition(from: ShipmentStatus, to: ShipmentStatus, actor?: FsmActor): boolean {
    const transition = SHIPMENT_TRANSITIONS.find((t) => t.from === from && t.to === to);
    if (!transition) {
      return false;
    }
    if (actor !== undefined) {
      return transition.allowedActors.includes(actor);
    }
    return true;
  }

  /**
   * Checks whether the given shipment status is a terminal state (no outgoing transitions).
   * Terminal states: DELIVERED, RETURNED, CANCELLED.
   *
   * @param status The status to verify.
   * @returns `true` if terminal; otherwise `false`.
   */
  static isTerminal(status: ShipmentStatus): boolean {
    return this.getNextStates(status).length === 0;
  }

  /**
   * Checks whether a shipment in this status can be cancelled.
   * Applicable states: CREATED, LABEL_GENERATED.
   *
   * @param status The status to verify.
   * @returns `true` if cancellable; otherwise `false`.
   */
  static isCancellable(status: ShipmentStatus): boolean {
    const cancellableStatuses: readonly ShipmentStatus[] = [
      ShipmentStatus.CREATED,
      ShipmentStatus.LABEL_GENERATED,
    ];
    return cancellableStatuses.includes(status);
  }

  /**
   * Asserts that a shipment transition is allowed, throwing an FsmTransitionError if not.
   *
   * @param from Source status.
   * @param to Destination status.
   * @param actor Actor triggering the transition.
   * @throws FsmTransitionError if the transition is invalid or actor unauthorized.
   */
  static assertCanTransition(from: ShipmentStatus, to: ShipmentStatus, actor: FsmActor): void {
    const transition = SHIPMENT_TRANSITIONS.find((t) => t.from === from && t.to === to);
    if (!transition) {
      throw new FsmTransitionError(
        from,
        to,
        actor,
        'INVALID_TRANSITION',
        `Invalid shipment status transition from '${from}' to '${to}'. Allowed next states: [${this.getNextStates(from).join(', ')}]`,
      );
    }
    if (!transition.allowedActors.includes(actor)) {
      throw new FsmTransitionError(
        from,
        to,
        actor,
        'UNAUTHORIZED_ACTOR',
        `Actor '${actor}' is not authorized to transition shipment from '${from}' to '${to}'. Allowed actors: [${transition.allowedActors.join(', ')}]`,
      );
    }
  }

  /**
   * Executes a state transition on the provided Shipment context.
   * On success, generates a ShipmentStatusEvent and returns the updated context.
   * On failure, returns a failure result with descriptive error and code.
   *
   * @param context Current Shipment FSM context.
   * @param to Desired target status.
   * @param actor Actor performing the transition.
   * @param options Optional transition metadata, location, or reason.
   * @returns ShipmentTransitionResult
   */
  static transition(
    context: ShipmentFsmContext,
    to: ShipmentStatus,
    actor: FsmActor,
    options?: {
      reason?: string;
      location?: string;
      metadata?: Record<string, unknown>;
    },
  ): ShipmentTransitionResult {
    const parseResult = shipmentFsmContextSchema.safeParse(context);
    if (!parseResult.success) {
      return {
        success: false,
        from: context.currentStatus,
        to,
        actor,
        error: `ShipmentFsmContext validation failed: ${parseResult.error.message}`,
        code: 'VALIDATION_FAILED',
      };
    }

    const from = context.currentStatus;
    const transitionDef = SHIPMENT_TRANSITIONS.find((t) => t.from === from && t.to === to);

    if (!transitionDef) {
      const allowedNext = this.getNextStates(from);
      return {
        success: false,
        from,
        to,
        actor,
        error: `Invalid shipment transition from '${from}' to '${to}'. Allowed next states: [${allowedNext.join(', ')}]`,
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
        error: `Actor '${actor}' is not authorized to transition shipment from '${from}' to '${to}'. Allowed actors: [${allowedActors.join(', ')}]`,
        code: 'UNAUTHORIZED_ACTOR',
      };
    }

    const event: ShipmentStatusEvent = {
      id: randomUUID(),
      shipmentId: context.shipmentId,
      ...(context.orderId ? { orderId: context.orderId } : {}),
      fromStatus: from,
      toStatus: to,
      actor,
      timestamp: new Date(),
      ...(options?.reason ? { reason: options.reason } : {}),
      ...(options?.location ? { location: options.location } : {}),
      ...(options?.metadata ? { metadata: options.metadata } : {}),
    };

    const updatedContext: ShipmentFsmContext = {
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
   * Performs the shipment transition and asserts success, throwing an FsmTransitionError on failure.
   */
  static assertTransition(
    context: ShipmentFsmContext,
    to: ShipmentStatus,
    actor: FsmActor,
    options?: {
      reason?: string;
      location?: string;
      metadata?: Record<string, unknown>;
    },
  ): TransitionSuccessResult<ShipmentStatus, ShipmentFsmContext, ShipmentStatusEvent> {
    const result = this.transition(context, to, actor, options);
    if (!result.success) {
      throw new FsmTransitionError(result.from, result.to, result.actor, result.code, result.error);
    }
    return result;
  }
}
