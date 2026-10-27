import { z } from 'zod';
import {
  shipmentDirectionSchema,
  shipmentMethodSchema,
  shipmentStatusSchema,
} from './enums.js';
import { addressSchema } from './user.js';

/**
 * InPost Paczkomat locker size categories according to ShipX specification.
 */
export const inpostBoxTemplateSchema = z.enum(['A', 'B', 'C']);
export type InpostBoxTemplate = z.infer<typeof inpostBoxTemplateSchema>;

/**
 * Physical parcel dimensions and weight.
 */
export const parcelDimensionsSchema = z.object({
  lengthMm: z.number().int().positive('Length must be positive integer in millimeters'),
  widthMm: z.number().int().positive('Width must be positive integer in millimeters'),
  heightMm: z.number().int().positive('Height must be positive integer in millimeters'),
  weightGrams: z.number().int().positive('Weight must be positive integer in grams'),
  inpostTemplate: inpostBoxTemplateSchema.optional(),
});

export type ParcelDimensionsDto = z.infer<typeof parcelDimensionsSchema>;

/**
 * Paczkomat location profile used for locker pickup and drop-off points.
 */
export const paczkomatPointSchema = z.object({
  name: z.string().min(1, 'Locker ID is required (e.g. WAW01M)'),
  address: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().regex(/^\d{2}-\d{3}$/, 'Postal code must be XX-XXX'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  locationDescription: z.string().optional().nullable(),
  openingHours: z.string().default('24/7'),
  easyAccessZone: z.boolean().default(false),
});

export type PaczkomatPointDto = z.infer<typeof paczkomatPointSchema>;

/**
 * Shipment entity representing a delivery segment.
 */
export const shipmentSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  direction: shipmentDirectionSchema,
  method: shipmentMethodSchema,
  status: shipmentStatusSchema,
  trackingNumber: z.string().optional().nullable(),
  trackingUrl: z.string().url().optional().nullable(),
  labelUrl: z.string().url().optional().nullable(),
  shipXShipmentId: z.string().optional().nullable(),
  senderAddress: addressSchema,
  recipientAddress: addressSchema,
  senderPaczkomatId: z.string().optional().nullable(),
  recipientPaczkomatId: z.string().optional().nullable(),
  dimensions: parcelDimensionsSchema,
  insuranceAmountGrosze: z.number().int().nonnegative('Insurance amount must be non-negative integer in grosz').default(0),
  dispatchedAt: z.string().datetime().optional().nullable(),
  deliveredAt: z.string().datetime().optional().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ShipmentDto = z.infer<typeof shipmentSchema>;

/**
 * DTO for creating a new shipment segment.
 */
export const createShipmentSchema = z.object({
  orderId: z.string().uuid(),
  direction: shipmentDirectionSchema,
  method: shipmentMethodSchema,
  senderAddress: addressSchema,
  recipientAddress: addressSchema,
  senderPaczkomatId: z.string().optional().nullable(),
  recipientPaczkomatId: z.string().optional().nullable(),
  dimensions: parcelDimensionsSchema,
  insuranceAmountGrosze: z.number().int().nonnegative('Insurance amount in grosz must be non-negative').default(0),
});

export type CreateShipmentDto = z.infer<typeof createShipmentSchema>;

/**
 * Payload sent by InPost ShipX webhook notifications.
 */
export const inpostWebhookPayloadSchema = z.object({
  event: z.string().min(1),
  shipmentId: z.string().min(1),
  trackingNumber: z.string().min(1),
  status: z.string().min(1),
  timestamp: z.string(),
  signature: z.string().optional(),
});

export type InPostWebhookPayloadDto = z.infer<typeof inpostWebhookPayloadSchema>;

/**
 * Query schema for searching nearby Paczkomaty.
 */
export const paczkomatSearchQuerySchema = z.object({
  city: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().default(5),
  query: z.string().optional(),
});

export type PaczkomatSearchQueryDto = z.infer<typeof paczkomatSearchQuerySchema>;
