import { z } from 'zod';
import {
  escrowStatusSchema,
  fsmActorSchema,
  invoiceTypeSchema,
  paymentMethodSchema,
  paymentStatusSchema,
} from './enums.js';
import { addressSchema } from './user.js';

/**
 * Payment gateway providers supported by Repair God.
 */
export const paymentGatewaySchema = z.enum([
  'PAYU',
  'PRZELEWY24',
  'STRIPE',
  'BLIK_DIRECT',
  'MANUAL',
]);

export type PaymentGateway = z.infer<typeof paymentGatewaySchema>;

/**
 * Record of an individual payment transaction.
 * All monetary amounts are integers in grosz (100 PLN = 10000 grosz).
 */
export const paymentTransactionSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  amountGrosze: z.number().int().positive('Payment amount must be positive integer in grosz'),
  currency: z.literal('PLN').default('PLN'),
  method: paymentMethodSchema,
  status: paymentStatusSchema,
  gateway: paymentGatewaySchema,
  gatewayTransactionId: z.string().optional().nullable(),
  authorizationCode: z.string().optional().nullable(),
  errorMessage: z.string().optional().nullable(),
  paidAt: z.string().datetime().optional().nullable(),
  refundedAt: z.string().datetime().optional().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type PaymentTransactionDto = z.infer<typeof paymentTransactionSchema>;

/**
 * Escrow account holding customer funds safely until QC and acceptance.
 */
export const escrowAccountSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  amountGrosze: z.number().int().positive('Escrow amount must be positive integer in grosz'),
  currency: z.literal('PLN').default('PLN'),
  status: escrowStatusSchema,
  heldAt: z.string().datetime(),
  releaseScheduledAt: z.string().datetime().optional().nullable(),
  releasedAt: z.string().datetime().optional().nullable(),
  releaseAuthorizedBy: fsmActorSchema.optional().nullable(),
  customerAcceptanceDeadline: z.string().datetime().optional().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type EscrowAccountDto = z.infer<typeof escrowAccountSchema>;

/**
 * Payout distribution calculated upon successful order completion.
 */
export const payoutDistributionSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  workshopId: z.string().uuid(),
  totalAmountGrosze: z.number().int().positive('Total amount must be positive integer in grosz'),
  workshopPayoutGrosze: z.number().int().nonnegative('Workshop payout must be non-negative integer in grosz'),
  platformFeeGrosze: z.number().int().nonnegative('Platform fee must be non-negative integer in grosz'),
  logisticsCostGrosze: z.number().int().nonnegative('Logistics cost must be non-negative integer in grosz'),
  netWorkshopEarningsGrosze: z.number().int().nonnegative('Net workshop earnings must be non-negative integer in grosz'),
  status: z.enum(['PENDING', 'PROCESSED', 'FAILED']).default('PENDING'),
  payoutBatchId: z.string().optional().nullable(),
  processedAt: z.string().datetime().optional().nullable(),
  createdAt: z.string().datetime(),
});

export type PayoutDistributionDto = z.infer<typeof payoutDistributionSchema>;

/**
 * Single line item on an official invoice / receipt.
 */
export const invoiceLineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().int().positive('Quantity must be positive integer'),
  unitPriceNetGrosze: z.number().int().nonnegative('Unit net price must be non-negative integer in grosz'),
  vatRatePercent: z.number().int().min(0).max(100),
  vatAmountGrosze: z.number().int().nonnegative('VAT amount must be non-negative integer in grosz'),
  grossAmountGrosze: z.number().int().nonnegative('Gross amount must be non-negative integer in grosz'),
});

export type InvoiceLineItemDto = z.infer<typeof invoiceLineItemSchema>;

/**
 * Formal tax invoice / receipt schema adhering to Polish VAT regulations.
 */
export const invoiceSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  invoiceNumber: z.string().min(1, 'Invoice number is required (e.g. FV/2026/10/0042)'),
  type: invoiceTypeSchema,
  buyerName: z.string().min(1),
  buyerNip: z.string().optional().nullable(),
  buyerAddress: addressSchema,
  sellerName: z.string().min(1),
  sellerNip: z.string().min(1),
  sellerAddress: addressSchema,
  items: z.array(invoiceLineItemSchema).min(1),
  totalNetGrosze: z.number().int().nonnegative('Total net must be non-negative integer in grosz'),
  totalVatGrosze: z.number().int().nonnegative('Total VAT must be non-negative integer in grosz'),
  totalGrossGrosze: z.number().int().positive('Total gross must be positive integer in grosz'),
  currency: z.literal('PLN').default('PLN'),
  pdfUrl: z.string().url().optional().nullable(),
  issuedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export type InvoiceDto = z.infer<typeof invoiceSchema>;

/**
 * Schema for initiating a payment intent.
 */
export const createPaymentIntentSchema = z.object({
  orderId: z.string().uuid(),
  amountGrosze: z.number().int().positive('Amount must be positive integer in grosz'),
  method: paymentMethodSchema,
  blikCode: z.string().regex(/^\d{6}$/, 'BLIK code must be exactly 6 digits').optional(),
  returnUrl: z.string().url().optional(),
});

export type CreatePaymentIntentDto = z.infer<typeof createPaymentIntentSchema>;

/**
 * Schema for submitting a 6-digit BLIK code authorization.
 */
export const blikAuthorizeSchema = z.object({
  transactionId: z.string().uuid(),
  blikCode: z.string().regex(/^\d{6}$/, 'BLIK code must be exactly 6 digits'),
});

export type BlikAuthorizeDto = z.infer<typeof blikAuthorizeSchema>;

/**
 * Standardized payment gateway webhook notification payload.
 */
export const paymentWebhookSchema = z.object({
  gateway: paymentGatewaySchema,
  eventType: z.string().min(1),
  transactionId: z.string().min(1),
  status: paymentStatusSchema,
  amountGrosze: z.number().int().positive('Webhook amount must be positive integer in grosz'),
  currency: z.string().default('PLN'),
  rawPayload: z.record(z.unknown()).optional(),
});

export type PaymentWebhookDto = z.infer<typeof paymentWebhookSchema>;
