import { z } from 'zod';

/**
 * Deterministic finite state machine statuses for the Order lifecycle.
 * Source of truth: docs/fsm.md & packages/contracts
 */
export const OrderStatus = {
  DRAFT: 'DRAFT',
  DIAGNOSED: 'DIAGNOSED',
  ORDER_CONFIRMED: 'ORDER_CONFIRMED',
  LABEL_GENERATED: 'LABEL_GENERATED',
  IN_TRANSIT_TO_HUB: 'IN_TRANSIT_TO_HUB',
  RECEIVED_AT_WORKSHOP: 'RECEIVED_AT_WORKSHOP',
  INSPECTION_CONFIRMED: 'INSPECTION_CONFIRMED',
  PRICE_ADJUSTMENT_NEEDED: 'PRICE_ADJUSTMENT_NEEDED',
  REPAIR_IN_PROGRESS: 'REPAIR_IN_PROGRESS',
  QUALITY_CONTROL: 'QUALITY_CONTROL',
  RETURN_IN_TRANSIT: 'RETURN_IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  FUNDS_RELEASED: 'FUNDS_RELEASED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
  CANCELLED_AND_RETURNED: 'CANCELLED_AND_RETURNED',
  DISPUTED: 'DISPUTED',
  UNDER_INVESTIGATION: 'UNDER_INVESTIGATION',
} as const;

export const orderStatusSchema = z.enum([
  OrderStatus.DRAFT,
  OrderStatus.DIAGNOSED,
  OrderStatus.ORDER_CONFIRMED,
  OrderStatus.LABEL_GENERATED,
  OrderStatus.IN_TRANSIT_TO_HUB,
  OrderStatus.RECEIVED_AT_WORKSHOP,
  OrderStatus.INSPECTION_CONFIRMED,
  OrderStatus.PRICE_ADJUSTMENT_NEEDED,
  OrderStatus.REPAIR_IN_PROGRESS,
  OrderStatus.QUALITY_CONTROL,
  OrderStatus.RETURN_IN_TRANSIT,
  OrderStatus.DELIVERED,
  OrderStatus.FUNDS_RELEASED,
  OrderStatus.CLOSED,
  OrderStatus.CANCELLED,
  OrderStatus.CANCELLED_AND_RETURNED,
  OrderStatus.DISPUTED,
  OrderStatus.UNDER_INVESTIGATION,
]);

export type OrderStatus = z.infer<typeof orderStatusSchema>;

/**
 * Actors capable of triggering transitions in the FSM.
 */
export const FsmActor = {
  CUSTOMER: 'CUSTOMER',
  TECHNICIAN: 'TECHNICIAN',
  SYSTEM: 'SYSTEM',
  COURIER: 'COURIER',
  WEBHOOK: 'WEBHOOK',
} as const;

export const fsmActorSchema = z.enum([
  FsmActor.CUSTOMER,
  FsmActor.TECHNICIAN,
  FsmActor.SYSTEM,
  FsmActor.COURIER,
  FsmActor.WEBHOOK,
]);

export type FsmActor = z.infer<typeof fsmActorSchema>;

/**
 * Logistics and transport statuses for Shipment FSM.
 */
export const ShipmentStatus = {
  CREATED: 'CREATED',
  LABEL_GENERATED: 'LABEL_GENERATED',
  PICKED_UP: 'PICKED_UP',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  RETURNED: 'RETURNED',
  CANCELLED: 'CANCELLED',
} as const;

export const shipmentStatusSchema = z.enum([
  ShipmentStatus.CREATED,
  ShipmentStatus.LABEL_GENERATED,
  ShipmentStatus.PICKED_UP,
  ShipmentStatus.IN_TRANSIT,
  ShipmentStatus.DELIVERED,
  ShipmentStatus.RETURNED,
  ShipmentStatus.CANCELLED,
]);

export type ShipmentStatus = z.infer<typeof shipmentStatusSchema>;

/**
 * Monetary validation schema: strict non-negative integer in grosz (100 PLN = 10000 grosz).
 * Currency is strictly PLN. Floating point values are forbidden.
 */
export const moneyGroszSchema = z
  .number()
  .int('Monetary amounts must be an integer in grosz')
  .nonnegative('Monetary amounts must be non-negative');

/**
 * Audit event emitted for every deterministic Order state transition.
 */
export const orderStatusEventSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().min(1),
  fromStatus: orderStatusSchema,
  toStatus: orderStatusSchema,
  actor: fsmActorSchema,
  timestamp: z.date(),
  reason: z.string().optional(),
  note: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type OrderStatusEvent = z.infer<typeof orderStatusEventSchema>;

/**
 * Execution context representing the current state and parameters of an Order.
 */
export const orderFsmContextSchema = z.object({
  orderId: z.string().min(1),
  currentStatus: orderStatusSchema,
  customerId: z.string().optional(),
  workshopId: z.string().optional(),
  technicianId: z.string().optional(),
  quotePriceGrosz: moneyGroszSchema.optional(),
  adjustedPriceGrosz: moneyGroszSchema.optional(),
  currency: z.literal('PLN').default('PLN'),
  metadata: z.record(z.unknown()).optional(),
  history: z.array(orderStatusEventSchema).optional(),
  updatedAt: z.date().optional(),
});

export type OrderFsmContext = z.infer<typeof orderFsmContextSchema>;

/**
 * Audit event emitted for every deterministic Shipment state transition.
 */
export const shipmentStatusEventSchema = z.object({
  id: z.string().uuid(),
  shipmentId: z.string().min(1),
  orderId: z.string().optional(),
  fromStatus: shipmentStatusSchema,
  toStatus: shipmentStatusSchema,
  actor: fsmActorSchema,
  timestamp: z.date(),
  reason: z.string().optional(),
  location: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type ShipmentStatusEvent = z.infer<typeof shipmentStatusEventSchema>;

/**
 * Execution context representing the current state and parameters of a Shipment.
 */
export const shipmentFsmContextSchema = z.object({
  shipmentId: z.string().min(1),
  orderId: z.string().optional(),
  currentStatus: shipmentStatusSchema,
  carrier: z.string().default('INPOST'),
  trackingNumber: z.string().optional(),
  senderAddress: z.record(z.unknown()).optional(),
  recipientAddress: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
  history: z.array(shipmentStatusEventSchema).optional(),
  updatedAt: z.date().optional(),
});

export type ShipmentFsmContext = z.infer<typeof shipmentFsmContextSchema>;

/**
 * Transition failure codes.
 */
export type FsmErrorCode = 'INVALID_TRANSITION' | 'UNAUTHORIZED_ACTOR' | 'VALIDATION_FAILED';

/**
 * Generic transition definition interface.
 */
export interface StateTransition<TStatus, TActor = FsmActor> {
  from: TStatus;
  to: TStatus;
  allowedActors: readonly TActor[];
  description?: string;
}

/**
 * Generic successful transition result.
 */
export interface TransitionSuccessResult<TStatus, TContext, TEvent> {
  success: true;
  from: TStatus;
  to: TStatus;
  actor: FsmActor;
  event: TEvent;
  context: TContext;
}

/**
 * Generic failed transition result.
 */
export interface TransitionFailureResult<TStatus> {
  success: false;
  from: TStatus;
  to: TStatus;
  actor: FsmActor;
  error: string;
  code: FsmErrorCode;
}

/**
 * TransitionResult for Order FSM transitions.
 */
export type TransitionResult =
  | TransitionSuccessResult<OrderStatus, OrderFsmContext, OrderStatusEvent>
  | TransitionFailureResult<OrderStatus>;

/**
 * ShipmentTransitionResult for Shipment FSM transitions.
 */
export type ShipmentTransitionResult =
  | TransitionSuccessResult<ShipmentStatus, ShipmentFsmContext, ShipmentStatusEvent>
  | TransitionFailureResult<ShipmentStatus>;

/**
 * Custom error thrown when a transition assertion fails.
 */
export class FsmTransitionError extends Error {
  constructor(
    public readonly from: string,
    public readonly to: string,
    public readonly actor: string,
    public readonly code: FsmErrorCode,
    message?: string,
  ) {
    super(
      message ??
        `Cannot transition from '${from}' to '${to}' by actor '${actor}' (error code: ${code})`,
    );
    this.name = 'FsmTransitionError';
  }
}
