import { z } from 'zod';
import { deviceCategorySchema, deviceConditionSchema } from './enums.js';

/**
 * IMEI validation: 15 consecutive numeric digits.
 */
export const imeiRegex = /^\d{15}$/;

/**
 * Single entry in the immutable device repair passport/history.
 */
export const devicePassportEntrySchema = z.object({
  id: z.string().uuid(),
  deviceId: z.string().uuid(),
  orderId: z.string().uuid(),
  repairDate: z.string().datetime(),
  description: z.string().min(1),
  partsReplaced: z.array(z.string()).default([]),
  technicianNotes: z.string().optional().nullable(),
  workshopName: z.string().min(1),
  warrantyExpiresAt: z.string().datetime().optional().nullable(),
  createdAt: z.string().datetime(),
});

export type DevicePassportEntryDto = z.infer<typeof devicePassportEntrySchema>;

/**
 * Device entity profile schema.
 */
export const deviceSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  category: deviceCategorySchema,
  brand: z.string().min(1, 'Brand is required').max(100),
  model: z.string().min(1, 'Model is required').max(100),
  serialNumber: z.string().max(100).optional().nullable(),
  imei: z.string().regex(imeiRegex, 'IMEI must be exactly 15 digits').optional().nullable(),
  purchaseYear: z.number().int().min(1990).max(new Date().getFullYear() + 1).optional().nullable(),
  condition: deviceConditionSchema.default('GOOD'),
  color: z.string().max(50).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type DeviceDto = z.infer<typeof deviceSchema>;

/**
 * Device with its complete repair passport.
 */
export const deviceWithPassportSchema = deviceSchema.extend({
  passportEntries: z.array(devicePassportEntrySchema).default([]),
});

export type DeviceWithPassportDto = z.infer<typeof deviceWithPassportSchema>;

/**
 * Schema for registering a new device.
 */
export const createDeviceSchema = z.object({
  category: deviceCategorySchema,
  brand: z.string().min(1, 'Brand is required').max(100),
  model: z.string().min(1, 'Model is required').max(100),
  serialNumber: z.string().max(100).optional().nullable(),
  imei: z.string().regex(imeiRegex, 'IMEI must be exactly 15 digits').optional().nullable(),
  purchaseYear: z.number().int().min(1990).max(new Date().getFullYear() + 1).optional().nullable(),
  condition: deviceConditionSchema.default('GOOD'),
  color: z.string().max(50).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export type CreateDeviceDto = z.infer<typeof createDeviceSchema>;

/**
 * Schema for updating an existing device profile.
 */
export const updateDeviceSchema = createDeviceSchema.partial();

export type UpdateDeviceDto = z.infer<typeof updateDeviceSchema>;

/**
 * Query filters for searching user devices.
 */
export const deviceListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: deviceCategorySchema.optional(),
  brand: z.string().optional(),
  search: z.string().optional(),
});

export type DeviceListQueryDto = z.infer<typeof deviceListQuerySchema>;
