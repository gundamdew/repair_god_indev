import { z } from 'zod';
import {
  fsmActorSchema,
  orderStatusSchema,
  paymentMethodSchema,
  priceAdjustmentStatusSchema,
  repairUrgencySchema,
  shipmentMethodSchema,
} from './enums.js';
import { addressSchema } from './user.js';

/**
 * Detailed financial pricing breakdown of an order.
 * Rule: ALL monetary values MUST be integers in grosz (100 PLN = 10000 grosz).
 */
export const orderPricingSchema = z.object({
  diagnosticFeeGrosze: z.number().int().nonnegative('Diagnostic fee must be non-negative integer in grosz').default(0),
  repairCostGrosze: z.number().int().nonnegative('Repair cost must be non-negative integer in grosz').default(0),
  logisticsFeeGrosze: z.number().int().nonnegative('Logistics fee must be non-negative integer in grosz').default(0),
  platformCommissionGrosze: z.number().int().nonnegative('Platform commission must be non-negative integer in grosz').default(0),
  discountGrosze: z.number().int().nonnegative('Discount must be non-negative integer in grosz').default(0),
  totalAmountGrosze: z.number().int().nonnegative('Total amount must be non-negative integer in grosz'),
  currency: z.literal('PLN').default('PLN'),
});

export type OrderPricingDto = z.infer<typeof orderPricingSchema>;

/**
 * Line item representing a specific hardware part or repair service operation.
 */
export const repairOrderItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  isOemPart: z.boolean().default(false),
  partPriceGrosze: z.number().int().nonnegative('Part price must be non-negative integer in grosz').default(0),
  laborPriceGrosze: z.number().int().nonnegative('Labor price must be non-negative integer in grosz').default(0),
  totalGrosze: z.number().int().nonnegative('Line total must be non-negative integer in grosz'),
});

export type RepairOrderItemDto = z.infer<typeof repairOrderItemSchema>;

/**
 * Price adjustment proposal generated when technician finds hidden damage.
 * Rule: Scope and price can only change with explicit customer approval (Customer Approval Invariance).
 */
export const priceAdjustmentSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  originalPriceGrosze: z.number().int().nonnegative('Original price must be non-negative integer in grosz'),
  adjustedPriceGrosze: z.number().int().positive('Adjusted price must be positive integer in grosz'),
  differenceGrosze: z.number().int(), // positive for extra charge, negative for discount
  reason: z.string().min(10, 'Reason must be at least 10 characters long'),
  technicianNotes: z.string().min(10, 'Technician notes must be at least 10 characters long'),
  photoUrls: z.array(z.string().url()).min(1, 'At least one evidence photo is required'),
  status: priceAdjustmentStatusSchema.default('PENDING'),
  requestedAt: z.string().datetime(),
  decidedAt: z.string().datetime().optional().nullable(),
  customerDecisionNotes: z.string().optional().nullable(),
});

export type PriceAdjustmentDto = z.infer<typeof priceAdjustmentSchema>;

/**
 * Immutable audit trail record for state transitions in the Order FSM.
 */
export const orderStatusEventSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  fromStatus: orderStatusSchema,
  toStatus: orderStatusSchema,
  actor: fsmActorSchema,
  actorId: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime(),
});

export type OrderStatusEventDto = z.infer<typeof orderStatusEventSchema>;

/**
 * Core order entity schema.
 */
export const orderSchema = z.object({
  id: z.string().uuid(),
  orderNumber: z.string().min(1),
  customerId: z.string().uuid(),
  deviceId: z.string().uuid(),
  workshopId: z.string().uuid().optional().nullable(),
  technicianId: z.string().uuid().optional().nullable(),
  status: orderStatusSchema,
  urgency: repairUrgencySchema.default('STANDARD'),
  initialSymptoms: z.array(z.string()).min(1),
  userDescription: z.string().min(5),
  photos: z.array(z.string().url()).default([]),
  diagnosticReportId: z.string().uuid().optional().nullable(),
  pricing: orderPricingSchema,
  items: z.array(repairOrderItemSchema).default([]),
  inboundShipmentId: z.string().uuid().optional().nullable(),
  outboundShipmentId: z.string().uuid().optional().nullable(),
  activePriceAdjustmentId: z.string().uuid().optional().nullable(),
  preferredShipmentMethod: shipmentMethodSchema.default('INPOST_PACZKOMAT'),
  preferredPaymentMethod: paymentMethodSchema.default('BLIK'),
  shippingAddress: addressSchema.optional().nullable(),
  inpostLockerId: z.string().optional().nullable(),
  qcPassed: z.boolean().optional().nullable(),
  customerSignoffAt: z.string().datetime().optional().nullable(),
  warrantyExpiresAt: z.string().datetime().optional().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type OrderDto = z.infer<typeof orderSchema>;

/**
 * Schema for customer initiating a new repair triage / draft order.
 */
export const createOrderDraftSchema = z.object({
  deviceId: z.string().uuid(),
  urgency: repairUrgencySchema.default('STANDARD'),
  initialSymptoms: z.array(z.string().min(1)).min(1, 'At least one symptom must be selected'),
  userDescription: z.string().min(5, 'Description must be at least 5 characters long').max(2000),
  photoUrls: z.array(z.string().url()).min(1, 'At least one device photo is required').max(10),
  preferredShipmentMethod: shipmentMethodSchema.default('INPOST_PACZKOMAT'),
  preferredPaymentMethod: paymentMethodSchema.default('BLIK'),
});

export type CreateOrderDraftDto = z.infer<typeof createOrderDraftSchema>;

/**
 * Schema for confirming order after AI diagnosis, selecting logistics & escrow authorization.
 */
export const confirmOrderSchema = z.object({
  orderId: z.string().uuid(),
  shipmentMethod: shipmentMethodSchema,
  paymentMethod: paymentMethodSchema,
  shippingAddress: addressSchema,
  inpostLockerId: z.string().optional().nullable(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions' }),
  }),
});

export type ConfirmOrderDto = z.infer<typeof confirmOrderSchema>;

/**
 * Schema for technician proposing an adjusted quote upon discovering hidden defects.
 */
export const proposePriceAdjustmentSchema = z.object({
  orderId: z.string().uuid(),
  adjustedPriceGrosze: z.number().int().positive('Adjusted price must be positive integer in grosz'),
  reason: z.string().min(10, 'Reason must be at least 10 characters long'),
  technicianNotes: z.string().min(10, 'Technician notes must be at least 10 characters long'),
  photoUrls: z.array(z.string().url()).min(1, 'At least one evidence photo is required'),
});

export type ProposePriceAdjustmentDto = z.infer<typeof proposePriceAdjustmentSchema>;

/**
 * Schema for customer accepting or rejecting an adjusted quote.
 */
export const decidePriceAdjustmentSchema = z.object({
  adjustmentId: z.string().uuid(),
  decision: z.enum(['APPROVE', 'REJECT']),
  customerNotes: z.string().optional().nullable(),
});

export type DecidePriceAdjustmentDto = z.infer<typeof decidePriceAdjustmentSchema>;

/**
 * Schema for technician submitting final quality control (QC) signoff.
 */
export const qcSignoffSchema = z.object({
  orderId: z.string().uuid(),
  passed: z.boolean(),
  checklist: z.record(z.boolean()),
  qcPhotoUrls: z.array(z.string().url()).min(1, 'At least one post-repair photo is required'),
  notes: z.string().optional().nullable(),
});

export type QcSignoffDto = z.infer<typeof qcSignoffSchema>;

/**
 * Schema for customer confirming device receipt and signoff (or auto-signoff after 48h).
 */
export const customerAcceptanceSchema = z.object({
  orderId: z.string().uuid(),
  accepted: z.boolean(),
  feedbackRating: z.number().int().min(1).max(5).optional(),
  feedbackComment: z.string().optional().nullable(),
});

export type CustomerAcceptanceDto = z.infer<typeof customerAcceptanceSchema>;

/**
 * Schema for customer reporting an issue or filing a dispute within the 48h acceptance window.
 */
export const disputeOrderSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().min(10, 'Dispute reason must be at least 10 characters long'),
  details: z.string().min(20, 'Please provide detailed explanation of the problem'),
  photoUrls: z.array(z.string().url()).optional().default([]),
});

export type DisputeOrderDto = z.infer<typeof disputeOrderSchema>;

/**
 * Schema for querying and paginating orders.
 */
export const orderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: orderStatusSchema.optional(),
  customerId: z.string().uuid().optional(),
  workshopId: z.string().uuid().optional(),
  technicianId: z.string().uuid().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'totalAmountGrosze']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type OrderListQueryDto = z.infer<typeof orderListQuerySchema>;
