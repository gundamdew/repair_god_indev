import { z } from 'zod';
import { deviceCategorySchema, diagnosticSeveritySchema } from './enums.js';

/**
 * AI estimated price range in integer grosz.
 * Rule: NO floating point for money. 100 PLN = 10000 grosz.
 */
export const aiPriceRangeGroszeSchema = z.object({
  minGrosze: z.number().int().nonnegative('Minimum price in grosz must be non-negative'),
  maxGrosze: z.number().int().nonnegative('Maximum price in grosz must be non-negative'),
}).refine((data) => data.maxGrosze >= data.minGrosze, {
  message: 'maxGrosze must be greater than or equal to minGrosze',
  path: ['maxGrosze'],
});

export type AIPriceRangeGrosze = z.infer<typeof aiPriceRangeGroszeSchema>;

/**
 * AI estimated repair turnaround range in days.
 */
export const aiTurnaroundDaysSchema = z.object({
  minDays: z.number().int().min(1, 'Minimum turnaround is 1 day'),
  maxDays: z.number().int().min(1, 'Maximum turnaround is 1 day'),
}).refine((data) => data.maxDays >= data.minDays, {
  message: 'maxDays must be greater than or equal to minDays',
  path: ['maxDays'],
});

export type AITurnaroundDays = z.infer<typeof aiTurnaroundDaysSchema>;

/**
 * Request payload sent to the AI diagnostic intake pipeline.
 */
export const aiDiagnosticRequestSchema = z.object({
  deviceCategory: deviceCategorySchema,
  deviceBrand: z.string().min(1, 'Brand is required'),
  deviceModel: z.string().min(1, 'Model is required'),
  serialOrImei: z.string().optional().nullable(),
  reportedSymptoms: z.array(z.string().min(1)).min(1, 'At least one symptom must be selected'),
  userDescription: z.string().min(5, 'Description must be at least 5 characters long').max(2000),
  photoUrls: z.array(z.string().url('Each photo must be a valid URL')).min(1, 'At least one photo is required').max(10),
});

export type AIDiagnosticRequestDto = z.infer<typeof aiDiagnosticRequestSchema>;

/**
 * Output format produced by Gemini Multimodal AI Diagnostic Engine.
 */
export const aiDiagnosticOutputSchema = z.object({
  suspectedFailure: z.array(z.string().min(1)).min(1),
  severity: diagnosticSeveritySchema,
  batteryHazardWarning: z.boolean(),
  estimatedPartsRequired: z.array(z.string()),
  repairFeasibilityScore: z.number().min(0.0).max(1.0),
  estimatedPriceRangeGrosze: aiPriceRangeGroszeSchema,
  estimatedTurnaroundDays: aiTurnaroundDaysSchema,
  technicianFocusNotes: z.string(),
});

export type AIDiagnosticOutputDto = z.infer<typeof aiDiagnosticOutputSchema>;

/**
 * Complete stored AI diagnostic report entity.
 */
export const aiDiagnosticReportSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid().optional().nullable(),
  aiModelVersion: z.string().min(1),
  confidenceScore: z.number().min(0.0).max(1.0),
  suspectedFailure: z.array(z.string()),
  severity: diagnosticSeveritySchema,
  batteryHazardWarning: z.boolean(),
  estimatedPartsRequired: z.array(z.string()),
  repairFeasibilityScore: z.number().min(0.0).max(1.0),
  estimatedPriceRangeGrosze: aiPriceRangeGroszeSchema,
  estimatedTurnaroundDays: aiTurnaroundDaysSchema,
  technicianFocusNotes: z.string(),
  requiresManualReview: z.boolean().default(false),
  createdAt: z.string().datetime(),
});

export type AIDiagnosticReportDto = z.infer<typeof aiDiagnosticReportSchema>;

/**
 * On-site workshop physical inspection report submitted by a technician.
 */
export const technicianInspectionSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  technicianId: z.string().uuid(),
  confirmedAiDiagnosis: z.boolean(),
  findingsNotes: z.string().min(5, 'Findings notes must be at least 5 characters long'),
  inspectionPhotoUrls: z.array(z.string().url()).default([]),
  actualPartsRequired: z.array(z.string()).default([]),
  estimatedLaborMinutes: z.number().int().positive('Labor minutes must be positive'),
  requiresPriceAdjustment: z.boolean().default(false),
  proposedAdjustmentGrosze: z.number().int().optional().nullable(),
  createdAt: z.string().datetime(),
});

export type TechnicianInspectionDto = z.infer<typeof technicianInspectionSchema>;

/**
 * DTO for technician submitting inspection findings.
 */
export const submitTechnicianInspectionSchema = z.object({
  confirmedAiDiagnosis: z.boolean(),
  findingsNotes: z.string().min(5, 'Findings notes must be at least 5 characters long'),
  inspectionPhotoUrls: z.array(z.string().url()).default([]),
  actualPartsRequired: z.array(z.string()).default([]),
  estimatedLaborMinutes: z.number().int().positive('Labor minutes must be positive'),
  requiresPriceAdjustment: z.boolean().default(false),
  proposedAdjustmentGrosze: z.number().int().optional().nullable(),
});

export type SubmitTechnicianInspectionDto = z.infer<typeof submitTechnicianInspectionSchema>;
