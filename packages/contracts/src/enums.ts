import { z } from 'zod';

/**
 * System roles for Role-Based Access Control (RBAC).
 */
export const SystemRole = {
  CUSTOMER: 'CUSTOMER',
  TECHNICIAN: 'TECHNICIAN',
  WORKSHOP_OWNER: 'WORKSHOP_OWNER',
  ENTERPRISE_MANAGER: 'ENTERPRISE_MANAGER',
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
} as const;

export const systemRoleSchema = z.enum([
  SystemRole.CUSTOMER,
  SystemRole.TECHNICIAN,
  SystemRole.WORKSHOP_OWNER,
  SystemRole.ENTERPRISE_MANAGER,
  SystemRole.PLATFORM_ADMIN,
]);

export type SystemRole = z.infer<typeof systemRoleSchema>;

/**
 * Deterministic finite state machine statuses for the Order lifecycle.
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
 * Logistics and transport statuses.
 */
export const ShipmentStatus = {
  CREATED: 'CREATED',
  LABEL_GENERATED: 'LABEL_GENERATED',
  PICKED_UP: 'PICKED_UP',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  RETURNED: 'RETURNED',
} as const;

export const shipmentStatusSchema = z.enum([
  ShipmentStatus.CREATED,
  ShipmentStatus.LABEL_GENERATED,
  ShipmentStatus.PICKED_UP,
  ShipmentStatus.IN_TRANSIT,
  ShipmentStatus.DELIVERED,
  ShipmentStatus.RETURNED,
]);

export type ShipmentStatus = z.infer<typeof shipmentStatusSchema>;

/**
 * Supported shipment / delivery methods.
 */
export const ShipmentMethod = {
  INPOST_PACZKOMAT: 'INPOST_PACZKOMAT',
  COURIER: 'COURIER',
  PERSONAL_DROPOFF: 'PERSONAL_DROPOFF',
} as const;

export const shipmentMethodSchema = z.enum([
  ShipmentMethod.INPOST_PACZKOMAT,
  ShipmentMethod.COURIER,
  ShipmentMethod.PERSONAL_DROPOFF,
]);

export type ShipmentMethod = z.infer<typeof shipmentMethodSchema>;

/**
 * Direction of parcel transit.
 */
export const ShipmentDirection = {
  TO_WORKSHOP: 'TO_WORKSHOP',
  RETURN_TO_CUSTOMER: 'RETURN_TO_CUSTOMER',
} as const;

export const shipmentDirectionSchema = z.enum([
  ShipmentDirection.TO_WORKSHOP,
  ShipmentDirection.RETURN_TO_CUSTOMER,
]);

export type ShipmentDirection = z.infer<typeof shipmentDirectionSchema>;

/**
 * Electronic device categories supported by the platform.
 */
export const DeviceCategory = {
  SMARTPHONE: 'SMARTPHONE',
  LAPTOP: 'LAPTOP',
  TABLET: 'TABLET',
  CONSOLE: 'CONSOLE',
  WEARABLE: 'WEARABLE',
  HOME_ELECTRONICS: 'HOME_ELECTRONICS',
} as const;

export const deviceCategorySchema = z.enum([
  DeviceCategory.SMARTPHONE,
  DeviceCategory.LAPTOP,
  DeviceCategory.TABLET,
  DeviceCategory.CONSOLE,
  DeviceCategory.WEARABLE,
  DeviceCategory.HOME_ELECTRONICS,
]);

export type DeviceCategory = z.infer<typeof deviceCategorySchema>;

/**
 * Physical condition of the device.
 */
export const DeviceCondition = {
  EXCELLENT: 'EXCELLENT',
  GOOD: 'GOOD',
  FAIR: 'FAIR',
  DAMAGED: 'DAMAGED',
  CRITICAL: 'CRITICAL',
} as const;

export const deviceConditionSchema = z.enum([
  DeviceCondition.EXCELLENT,
  DeviceCondition.GOOD,
  DeviceCondition.FAIR,
  DeviceCondition.DAMAGED,
  DeviceCondition.CRITICAL,
]);

export type DeviceCondition = z.infer<typeof deviceConditionSchema>;

/**
 * Diagnostic severity classifications.
 */
export const DiagnosticSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export const diagnosticSeveritySchema = z.enum([
  DiagnosticSeverity.LOW,
  DiagnosticSeverity.MEDIUM,
  DiagnosticSeverity.HIGH,
  DiagnosticSeverity.CRITICAL,
]);

export type DiagnosticSeverity = z.infer<typeof diagnosticSeveritySchema>;

/**
 * Payment methods accepted by the platform.
 */
export const PaymentMethod = {
  BLIK: 'BLIK',
  APPLE_PAY: 'APPLE_PAY',
  GOOGLE_PAY: 'GOOGLE_PAY',
  CREDIT_CARD: 'CREDIT_CARD',
  CASH: 'CASH',
  BANK_TRANSFER: 'BANK_TRANSFER',
} as const;

export const paymentMethodSchema = z.enum([
  PaymentMethod.BLIK,
  PaymentMethod.APPLE_PAY,
  PaymentMethod.GOOGLE_PAY,
  PaymentMethod.CREDIT_CARD,
  PaymentMethod.CASH,
  PaymentMethod.BANK_TRANSFER,
]);

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

/**
 * Payment transaction statuses.
 */
export const PaymentStatus = {
  PENDING: 'PENDING',
  AUTHORIZED: 'AUTHORIZED',
  CAPTURED: 'CAPTURED',
  REFUNDED: 'REFUNDED',
  FAILED: 'FAILED',
} as const;

export const paymentStatusSchema = z.enum([
  PaymentStatus.PENDING,
  PaymentStatus.AUTHORIZED,
  PaymentStatus.CAPTURED,
  PaymentStatus.REFUNDED,
  PaymentStatus.FAILED,
]);

export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

/**
 * Escrow account hold & release statuses.
 */
export const EscrowStatus = {
  HELD: 'HELD',
  RELEASED: 'RELEASED',
  REFUNDED: 'REFUNDED',
  DISPUTED: 'DISPUTED',
} as const;

export const escrowStatusSchema = z.enum([
  EscrowStatus.HELD,
  EscrowStatus.RELEASED,
  EscrowStatus.REFUNDED,
  EscrowStatus.DISPUTED,
]);

export type EscrowStatus = z.infer<typeof escrowStatusSchema>;

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
 * Invoice types according to Polish accounting law.
 */
export const InvoiceType = {
  B2C_RECEIPT: 'B2C_RECEIPT',
  B2C_INVOICE: 'B2C_INVOICE',
  B2B_VAT_INVOICE: 'B2B_VAT_INVOICE',
} as const;

export const invoiceTypeSchema = z.enum([
  InvoiceType.B2C_RECEIPT,
  InvoiceType.B2C_INVOICE,
  InvoiceType.B2B_VAT_INVOICE,
]);

export type InvoiceType = z.infer<typeof invoiceTypeSchema>;

/**
 * Price adjustment approval status.
 */
export const PriceAdjustmentStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export const priceAdjustmentStatusSchema = z.enum([
  PriceAdjustmentStatus.PENDING,
  PriceAdjustmentStatus.APPROVED,
  PriceAdjustmentStatus.REJECTED,
]);

export type PriceAdjustmentStatus = z.infer<typeof priceAdjustmentStatusSchema>;

/**
 * Service speed / urgency tier.
 */
export const RepairUrgency = {
  STANDARD: 'STANDARD',
  EXPRESS: 'EXPRESS',
} as const;

export const repairUrgencySchema = z.enum([
  RepairUrgency.STANDARD,
  RepairUrgency.EXPRESS,
]);

export type RepairUrgency = z.infer<typeof repairUrgencySchema>;
