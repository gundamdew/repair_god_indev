import { z } from 'zod';
import { systemRoleSchema } from './enums.js';
import { polishNipRegex, polishRegonRegex, userProfileSchema } from './user.js';

/**
 * User credentials login request.
 */
export const loginRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export type LoginRequestDto = z.infer<typeof loginRequestSchema>;

/**
 * End customer registration request.
 */
export const registerCustomerRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phoneNumber: z.string().optional().nullable(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms of service' }),
  }),
});

export type RegisterCustomerRequestDto = z.infer<typeof registerCustomerRequestSchema>;

/**
 * B2B Enterprise manager registration request.
 */
export const registerEnterpriseRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  companyName: z.string().min(2, 'Company name is required').max(200),
  nip: z.string().regex(polishNipRegex, 'NIP must be exactly 10 digits'),
  regon: z.string().regex(polishRegonRegex, 'REGON must be 9 or 14 digits').optional().nullable(),
  contactPerson: z.string().min(2, 'Contact person name is required').max(100),
  phoneNumber: z.string().min(9, 'Valid phone number is required'),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms of service' }),
  }),
});

export type RegisterEnterpriseRequestDto = z.infer<typeof registerEnterpriseRequestSchema>;

/**
 * OAuth2 / JWT access & refresh token pair.
 */
export const tokenPairSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresInSeconds: z.number().int().positive(),
  tokenType: z.literal('Bearer').default('Bearer'),
});

export type TokenPairDto = z.infer<typeof tokenPairSchema>;

/**
 * Refresh token exchange request.
 */
export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenRequestDto = z.infer<typeof refreshTokenRequestSchema>;

/**
 * Decoded JWT claims payload.
 */
export const jwtPayloadSchema = z.object({
  sub: z.string().uuid('Subject must be a valid user UUID'),
  email: z.string().email(),
  role: systemRoleSchema,
  workshopId: z.string().uuid().optional().nullable(),
  enterpriseId: z.string().uuid().optional().nullable(),
  permissions: z.array(z.string()).default([]),
  iat: z.number().int().optional(),
  exp: z.number().int().optional(),
});

export type JwtPayloadDto = z.infer<typeof jwtPayloadSchema>;

/**
 * Authenticated user password update.
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8, 'Current password must be at least 8 characters'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
}).refine((data) => data.newPassword !== data.currentPassword, {
  message: 'New password must differ from current password',
  path: ['newPassword'],
});

export type ChangePasswordRequestDto = z.infer<typeof changePasswordSchema>;

/**
 * Password reset initiation request.
 */
export const forgotPasswordRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ForgotPasswordRequestDto = z.infer<typeof forgotPasswordRequestSchema>;

/**
 * Password reset completion with one-time verification token.
 */
export const resetPasswordConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export type ResetPasswordConfirmDto = z.infer<typeof resetPasswordConfirmSchema>;

/**
 * Email verification token submission.
 */
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export type VerifyEmailRequestDto = z.infer<typeof verifyEmailSchema>;

/**
 * Full authentication response including user profile and token pair.
 */
export const authResponseSchema = z.object({
  user: userProfileSchema,
  tokens: tokenPairSchema,
});

export type AuthResponseDto = z.infer<typeof authResponseSchema>;
