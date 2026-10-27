import {
  FsmActor,
  OrderStatus,
  ShipmentStatus,
  type StateTransition,
} from './types.js';

/**
 * Order Lifecycle State Transitions.
 * Derived from docs/fsm.md and product specification.
 */
export const ORDER_TRANSITIONS: readonly StateTransition<OrderStatus>[] = [
  // DRAFT -> DIAGNOSED, CANCELLED (CUSTOMER)
  {
    from: OrderStatus.DRAFT,
    to: OrderStatus.DIAGNOSED,
    allowedActors: [FsmActor.CUSTOMER],
    description: 'Customer initiates triage wizard and AI diagnostic completes',
  },
  {
    from: OrderStatus.DRAFT,
    to: OrderStatus.CANCELLED,
    allowedActors: [FsmActor.CUSTOMER],
    description: 'Customer abandons draft order',
  },

  // DIAGNOSED -> ORDER_CONFIRMED, DRAFT, CANCELLED (SYSTEM)
  {
    from: OrderStatus.DIAGNOSED,
    to: OrderStatus.ORDER_CONFIRMED,
    allowedActors: [FsmActor.SYSTEM],
    description: 'Payment authorized and escrow hold placed',
  },
  {
    from: OrderStatus.DIAGNOSED,
    to: OrderStatus.DRAFT,
    allowedActors: [FsmActor.SYSTEM],
    description: 'Diagnostic modified or reset back to draft',
  },
  {
    from: OrderStatus.DIAGNOSED,
    to: OrderStatus.CANCELLED,
    allowedActors: [FsmActor.SYSTEM],
    description: 'Diagnostic expired or cancelled by system',
  },

  // ORDER_CONFIRMED -> LABEL_GENERATED, CANCELLED (CUSTOMER, SYSTEM)
  {
    from: OrderStatus.ORDER_CONFIRMED,
    to: OrderStatus.LABEL_GENERATED,
    allowedActors: [FsmActor.CUSTOMER, FsmActor.SYSTEM],
    description: 'InPost ShipX shipping label generated',
  },
  {
    from: OrderStatus.ORDER_CONFIRMED,
    to: OrderStatus.CANCELLED,
    allowedActors: [FsmActor.CUSTOMER, FsmActor.SYSTEM],
    description: 'Order cancelled prior to parcel generation',
  },

  // LABEL_GENERATED -> IN_TRANSIT_TO_HUB, CANCELLED (SYSTEM)
  {
    from: OrderStatus.LABEL_GENERATED,
    to: OrderStatus.IN_TRANSIT_TO_HUB,
    allowedActors: [FsmActor.SYSTEM],
    description: 'Parcel dropped in Paczkomat or handed to courier',
  },
  {
    from: OrderStatus.LABEL_GENERATED,
    to: OrderStatus.CANCELLED,
    allowedActors: [FsmActor.SYSTEM],
    description: 'Label expired or voided prior to dispatch',
  },

  // IN_TRANSIT_TO_HUB -> RECEIVED_AT_WORKSHOP (COURIER, WEBHOOK)
  {
    from: OrderStatus.IN_TRANSIT_TO_HUB,
    to: OrderStatus.RECEIVED_AT_WORKSHOP,
    allowedActors: [FsmActor.COURIER, FsmActor.WEBHOOK],
    description: 'Workshop scans intake QR code',
  },

  // RECEIVED_AT_WORKSHOP -> INSPECTION_CONFIRMED, PRICE_ADJUSTMENT_NEEDED (TECHNICIAN)
  {
    from: OrderStatus.RECEIVED_AT_WORKSHOP,
    to: OrderStatus.INSPECTION_CONFIRMED,
    allowedActors: [FsmActor.TECHNICIAN],
    description: 'Technician confirms initial AI diagnosis without adjustments',
  },
  {
    from: OrderStatus.RECEIVED_AT_WORKSHOP,
    to: OrderStatus.PRICE_ADJUSTMENT_NEEDED,
    allowedActors: [FsmActor.TECHNICIAN],
    description: 'Hidden damage discovered requiring revised quote and customer approval',
  },

  // PRICE_ADJUSTMENT_NEEDED -> INSPECTION_CONFIRMED, CANCELLED_AND_RETURNED (TECHNICIAN)
  {
    from: OrderStatus.PRICE_ADJUSTMENT_NEEDED,
    to: OrderStatus.INSPECTION_CONFIRMED,
    allowedActors: [FsmActor.TECHNICIAN],
    description: 'Customer approves revised quote; technician logs approval',
  },
  {
    from: OrderStatus.PRICE_ADJUSTMENT_NEEDED,
    to: OrderStatus.CANCELLED_AND_RETURNED,
    allowedActors: [FsmActor.TECHNICIAN],
    description: 'Customer rejects revised quote; device marked for return',
  },

  // INSPECTION_CONFIRMED -> REPAIR_IN_PROGRESS, CANCELLED_AND_RETURNED (CUSTOMER, TECHNICIAN)
  // INSPECTION_CONFIRMED <-> PRICE_ADJUSTMENT_NEEDED branch
  {
    from: OrderStatus.INSPECTION_CONFIRMED,
    to: OrderStatus.REPAIR_IN_PROGRESS,
    allowedActors: [FsmActor.CUSTOMER, FsmActor.TECHNICIAN],
    description: 'Parts allocated and physical repair initiated',
  },
  {
    from: OrderStatus.INSPECTION_CONFIRMED,
    to: OrderStatus.PRICE_ADJUSTMENT_NEEDED,
    allowedActors: [FsmActor.TECHNICIAN],
    description: 'Additional hidden defects uncovered during pre-repair disassembly',
  },
  {
    from: OrderStatus.INSPECTION_CONFIRMED,
    to: OrderStatus.CANCELLED_AND_RETURNED,
    allowedActors: [FsmActor.CUSTOMER, FsmActor.TECHNICIAN],
    description: 'Order cancelled before repair commences, device returned',
  },

  // REPAIR_IN_PROGRESS -> QUALITY_CONTROL (TECHNICIAN)
  {
    from: OrderStatus.REPAIR_IN_PROGRESS,
    to: OrderStatus.QUALITY_CONTROL,
    allowedActors: [FsmActor.TECHNICIAN],
    description: 'Hardware repair finished, passing to QC inspection & photo logging',
  },

  // QUALITY_CONTROL -> RETURN_IN_TRANSIT (TECHNICIAN)
  {
    from: OrderStatus.QUALITY_CONTROL,
    to: OrderStatus.RETURN_IN_TRANSIT,
    allowedActors: [FsmActor.TECHNICIAN],
    description: 'Device passes QC and is handed over to courier for return',
  },

  // RETURN_IN_TRANSIT -> DELIVERED (COURIER, WEBHOOK)
  {
    from: OrderStatus.RETURN_IN_TRANSIT,
    to: OrderStatus.DELIVERED,
    allowedActors: [FsmActor.COURIER, FsmActor.WEBHOOK],
    description: 'Customer retrieves parcel from Paczkomat or courier delivery confirmed',
  },

  // DELIVERED -> FUNDS_RELEASED, DISPUTED (COURIER, CUSTOMER)
  {
    from: OrderStatus.DELIVERED,
    to: OrderStatus.FUNDS_RELEASED,
    allowedActors: [FsmActor.COURIER, FsmActor.CUSTOMER],
    description: 'Customer approves repair or 48-hour acceptance window expires',
  },
  {
    from: OrderStatus.DELIVERED,
    to: OrderStatus.DISPUTED,
    allowedActors: [FsmActor.COURIER, FsmActor.CUSTOMER],
    description: 'Customer flags an issue within the 48-hour warranty acceptance window',
  },

  // FUNDS_RELEASED -> CLOSED (SYSTEM)
  {
    from: OrderStatus.FUNDS_RELEASED,
    to: OrderStatus.CLOSED,
    allowedActors: [FsmActor.SYSTEM],
    description: 'Escrow settled, payout finalized, and order officially closed',
  },

  // DISPUTED -> UNDER_INVESTIGATION (CUSTOMER)
  {
    from: OrderStatus.DISPUTED,
    to: OrderStatus.UNDER_INVESTIGATION,
    allowedActors: [FsmActor.CUSTOMER],
    description: 'Dispute escalated to platform mediation & investigation',
  },
];

/**
 * Standard Courier / InPost ShipX Transitions for Shipment FSM.
 */
export const SHIPMENT_TRANSITIONS: readonly StateTransition<ShipmentStatus>[] = [
  // CREATED -> LABEL_GENERATED, CANCELLED
  {
    from: ShipmentStatus.CREATED,
    to: ShipmentStatus.LABEL_GENERATED,
    allowedActors: [FsmActor.SYSTEM, FsmActor.TECHNICIAN, FsmActor.CUSTOMER],
    description: 'Carrier label generated with barcode / tracking number',
  },
  {
    from: ShipmentStatus.CREATED,
    to: ShipmentStatus.CANCELLED,
    allowedActors: [FsmActor.SYSTEM, FsmActor.CUSTOMER, FsmActor.TECHNICIAN],
    description: 'Shipment booking cancelled before label generation',
  },

  // LABEL_GENERATED -> PICKED_UP, CANCELLED
  {
    from: ShipmentStatus.LABEL_GENERATED,
    to: ShipmentStatus.PICKED_UP,
    allowedActors: [FsmActor.COURIER, FsmActor.WEBHOOK],
    description: 'Parcel dropped at Paczkomat or picked up by courier',
  },
  {
    from: ShipmentStatus.LABEL_GENERATED,
    to: ShipmentStatus.CANCELLED,
    allowedActors: [FsmActor.SYSTEM, FsmActor.CUSTOMER, FsmActor.TECHNICIAN],
    description: 'Label cancelled / voided before dispatch',
  },

  // PICKED_UP -> IN_TRANSIT
  {
    from: ShipmentStatus.PICKED_UP,
    to: ShipmentStatus.IN_TRANSIT,
    allowedActors: [FsmActor.COURIER, FsmActor.WEBHOOK],
    description: 'Parcel in transit through logistics sorting network',
  },

  // IN_TRANSIT -> DELIVERED, RETURNED
  {
    from: ShipmentStatus.IN_TRANSIT,
    to: ShipmentStatus.DELIVERED,
    allowedActors: [FsmActor.COURIER, FsmActor.WEBHOOK],
    description: 'Parcel successfully delivered to destination',
  },
  {
    from: ShipmentStatus.IN_TRANSIT,
    to: ShipmentStatus.RETURNED,
    allowedActors: [FsmActor.COURIER, FsmActor.WEBHOOK],
    description: 'Parcel returned to sender due to delivery failure or expiry',
  },
];
