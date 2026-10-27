import { z } from 'zod';
import { systemRoleSchema } from './enums.js';

/**
 * Polish postal code format (e.g. "00-001").
 */
export const polishPostalCodeRegex = /^\d{2}-\d{3}$/;

/**
 * Polish phone number format: optionally starts with +48, followed by 9 digits with optional spaces or dashes.
 */
export const polishPhoneRegex = /^(\+48)?\s?[1-9]\d{2}[\s-]?\d{3}[\s-]?\d{3}$/;

/**
 * Polish NIP (Tax Identification Number) format: 10 consecutive digits.
 */
export const polishNipRegex = /^\d{10}$/;

/**
 * Polish REGON (National Business Registry Number): 9 or 14 consecutive digits.
 */
export const polishRegonRegex = /^(\d{9}|\d{14})$/;

/**
 * Physical postal address schema.
 */
export const addressSchema = z.object({
  street: z.string().min(1, 'Street name is required').max(100),
  houseNumber: z.string().min(1, 'House number is required').max(20),
  apartmentNumber: z.string().max(20).optional().nullable(),
  city: z.string().min(1, 'City is required').max(100),
  postalCode: z.string().regex(polishPostalCodeRegex, 'Postal code must be in XX-XXX format'),
  country: z.string().default('PL'),
});

export type AddressDto = z.infer<typeof addressSchema>;

/**
 * Enterprise client business profile.
 */
export const enterpriseCompanySchema = z.object({
  companyName: z.string().min(2, 'Company name is required').max(255),
  nip: z.string().regex(polishNipRegex, 'NIP must be exactly 10 digits'),
  regon: z.string().regex(polishRegonRegex, 'REGON must be 9 or 14 digits').optional().nullable(),
  vatNumber: z.string().max(30).optional().nullable(),
  address: addressSchema,
  contactPerson: z.string().min(2, 'Contact person is required').max(100),
  contactEmail: z.string().email('Invalid contact email'),
  contactPhone: z.string().min(9, 'Invalid contact phone number'),
  monthlyBillingEnabled: z.boolean().default(false),
  creditLimitGrosze: z.number().int().nonnegative('Credit limit must be non-negative integer in grosz').default(0),
});

export type EnterpriseCompanyDto = z.infer<typeof enterpriseCompanySchema>;

/**
 * Core user profile schema.
 */
export const userProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: systemRoleSchema,
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phoneNumber: z.string().optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  isEmailVerified: z.boolean().default(false),
  isActive: z.boolean().default(true),
  defaultAddress: addressSchema.optional().nullable(),
  enterpriseCompany: enterpriseCompanySchema.optional().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type UserProfileDto = z.infer<typeof userProfileSchema>;

/**
 * Schema for creating a new user (admin or internal invocation).
 */
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  role: systemRoleSchema.default('CUSTOMER'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phoneNumber: z.string().optional().nullable(),
  defaultAddress: addressSchema.optional().nullable(),
  enterpriseCompany: enterpriseCompanySchema.optional().nullable(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;

/**
 * Schema for updating an existing user's profile.
 */
export const updateUserProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phoneNumber: z.string().optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  defaultAddress: addressSchema.optional().nullable(),
});

export type UpdateUserProfileDto = z.infer<typeof updateUserProfileSchema>;

/**
 * Schema for changing a user's role (admin-only).
 */
export const updateUserRoleSchema = z.object({
  role: systemRoleSchema,
});

export type UpdateUserRoleDto = z.infer<typeof updateUserRoleSchema>;

/**
 * User search and pagination query schema.
 */
export const userListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: systemRoleSchema.optional(),
  search: z.string().max(100).optional(),
  isActive: z.coerce.boolean().optional(),
});

export type UserListQueryDto = z.infer<typeof userListQuerySchema>;
