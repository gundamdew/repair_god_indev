import { z } from 'zod';
import { deviceCategorySchema } from './enums.js';
import { addressSchema, polishNipRegex, polishRegonRegex } from './user.js';

/**
 * Verified partner workshop profile.
 * All monetary amounts are integers in grosz.
 */
export const workshopSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Workshop name is required').max(100),
  legalName: z.string().min(1, 'Legal registered entity name is required').max(200),
  nip: z.string().regex(polishNipRegex, 'NIP must be exactly 10 digits'),
  regon: z.string().regex(polishRegonRegex, 'REGON must be 9 or 14 digits').optional().nullable(),
  email: z.string().email(),
  phone: z.string().min(9),
  address: addressSchema,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  specialties: z.array(deviceCategorySchema).min(1, 'At least one specialty category is required'),
  isActive: z.boolean().default(true),
  isVerified: z.boolean().default(false),
  rating: z.number().min(0.0).max(5.0).default(5.0),
  reviewCount: z.number().int().nonnegative().default(0),
  totalCompletedOrders: z.number().int().nonnegative().default(0),
  commissionRateBasisPoints: z.number().int().min(0).max(10000).default(1500), // 1500 = 15.00%
  standardLaborRateGrosze: z.number().int().positive('Standard labor rate must be positive integer in grosz'),
  maxActiveOrders: z.number().int().positive().default(20),
  currentActiveOrders: z.number().int().nonnegative().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type WorkshopDto = z.infer<typeof workshopSchema>;

/**
 * Service technician entity profile.
 */
export const technicianSchema = z.object({
  id: z.string().uuid(),
  workshopId: z.string().uuid(),
  userId: z.string().uuid(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  specialties: z.array(deviceCategorySchema).default([]),
  isAvailable: z.boolean().default(true),
  activeAssignedOrdersCount: z.number().int().nonnegative().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type TechnicianDto = z.infer<typeof technicianSchema>;

/**
 * Schema for onboarding a new workshop partner.
 */
export const createWorkshopSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  legalName: z.string().min(1, 'Legal name is required').max(200),
  nip: z.string().regex(polishNipRegex, 'NIP must be exactly 10 digits'),
  regon: z.string().regex(polishRegonRegex, 'REGON must be 9 or 14 digits').optional().nullable(),
  email: z.string().email(),
  phone: z.string().min(9),
  address: addressSchema,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  specialties: z.array(deviceCategorySchema).min(1, 'At least one specialty is required'),
  commissionRateBasisPoints: z.number().int().min(0).max(10000).default(1500),
  standardLaborRateGrosze: z.number().int().positive('Labor rate must be positive integer in grosz'),
  maxActiveOrders: z.number().int().positive().default(20),
});

export type CreateWorkshopDto = z.infer<typeof createWorkshopSchema>;

/**
 * Schema for updating workshop profile details.
 */
export const updateWorkshopSchema = createWorkshopSchema.partial();

export type UpdateWorkshopDto = z.infer<typeof updateWorkshopSchema>;

/**
 * Schema for registering a new technician.
 */
export const createTechnicianSchema = z.object({
  workshopId: z.string().uuid(),
  userId: z.string().uuid(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  specialties: z.array(deviceCategorySchema).default([]),
});

export type CreateTechnicianDto = z.infer<typeof createTechnicianSchema>;

/**
 * Schema for updating technician profile.
 */
export const updateTechnicianSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().optional().nullable(),
  specialties: z.array(deviceCategorySchema).optional(),
  isAvailable: z.boolean().optional(),
});

export type UpdateTechnicianDto = z.infer<typeof updateTechnicianSchema>;

/**
 * Spatial query schema for locating optimal partner workshops.
 */
export const nearbyWorkshopQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radiusKm: z.coerce.number().positive().default(25),
  category: deviceCategorySchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type NearbyWorkshopQueryDto = z.infer<typeof nearbyWorkshopQuerySchema>;

/**
 * Aggregated workshop operational performance metrics.
 */
export const workshopPerformanceMetricsSchema = z.object({
  workshopId: z.string().uuid(),
  averageRepairTimeHours: z.number().nonnegative(),
  customerSatisfactionScore: z.number().min(0.0).max(5.0),
  disputeRatePercent: z.number().min(0.0).max(100.0),
  onTimeDeliveryRatePercent: z.number().min(0.0).max(100.0),
  totalRepairsLast30Days: z.number().int().nonnegative(),
});

export type WorkshopPerformanceMetricsDto = z.infer<typeof workshopPerformanceMetricsSchema>;
