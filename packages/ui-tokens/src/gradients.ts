/**
 * Gradient definitions for Repair God design system.
 */

import { COLOR_ACCENT, COLOR_ACCENT_SOFT, COLOR_GLASS, COLOR_GLASS_STRONG, COLOR_INK, COLOR_SUCCESS, COLOR_WARN } from './colors.js';

export const gradients = {
  accent: `linear-gradient(135deg, ${COLOR_ACCENT} 0%, #5a66a8 100%)`,
  accentSubtle: `linear-gradient(135deg, ${COLOR_ACCENT_SOFT} 0%, #ffffff 100%)`,
  glass: `linear-gradient(135deg, ${COLOR_GLASS_STRONG} 0%, ${COLOR_GLASS} 100%)`,
  glassCard: `linear-gradient(135deg, rgba(255, 255, 255, 0.70) 0%, rgba(255, 255, 255, 0.40) 100%)`,
  surface: 'linear-gradient(180deg, #ffffff 0%, #f6f7fb 100%)',
  surfaceSubtle: 'linear-gradient(180deg, #fafbfe 0%, #edf0f7 100%)',
  heroDark: `linear-gradient(160deg, ${COLOR_INK} 0%, #2a2e45 100%)`,
  success: `linear-gradient(135deg, ${COLOR_SUCCESS} 0%, #4f9672 100%)`,
  warn: `linear-gradient(135deg, ${COLOR_WARN} 0%, #c48b37 100%)`,
  glowAccent: `radial-gradient(circle at 50% 0%, rgba(63, 74, 138, 0.14) 0%, transparent 70%)`,
  glowCard: `radial-gradient(circle at top left, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.2) 100%)`,
} as const;

export type GradientKey = keyof typeof gradients;
