/**
 * Glassmorphism tokens for Repair God design system.
 * Defines backdrop blurs, surface transparencies, and glass card presets.
 */

import { COLOR_GLASS, COLOR_GLASS_STRONG, COLOR_INK, COLOR_LINE } from './colors.js';

export const glassBlurs = {
  none: '0px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
} as const;

export const glassBlursPx = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
} as const;

export const glassVariants = {
  /**
   * Standard glass surface token: rgba(255, 255, 255, 0.55)
   */
  standard: {
    backgroundColor: COLOR_GLASS,
    backdropFilter: 'blur(12px) saturate(160%)',
    WebkitBackdropFilter: 'blur(12px) saturate(160%)',
    borderColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: '1px',
    borderStyle: 'solid',
    boxShadow: '0 8px 32px 0 rgba(29, 31, 43, 0.07)',
  },

  /**
   * Elevated strong glass surface token: rgba(255, 255, 255, 0.78)
   */
  strong: {
    backgroundColor: COLOR_GLASS_STRONG,
    backdropFilter: 'blur(16px) saturate(180%)',
    WebkitBackdropFilter: 'blur(16px) saturate(180%)',
    borderColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: '1px',
    borderStyle: 'solid',
    boxShadow: '0 12px 40px 0 rgba(29, 31, 43, 0.10)',
  },

  /**
   * Subtle glass overlay for secondary cards or badges
   */
  subtle: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    backdropFilter: 'blur(8px) saturate(140%)',
    WebkitBackdropFilter: 'blur(8px) saturate(140%)',
    borderColor: COLOR_LINE,
    borderWidth: '1px',
    borderStyle: 'solid',
    boxShadow: '0 4px 16px 0 rgba(29, 31, 43, 0.04)',
  },

  /**
   * Dark glass surface for modal backdrops or dark theme cards
   */
  dark: {
    backgroundColor: 'rgba(29, 31, 43, 0.75)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: '1px',
    borderStyle: 'solid',
    boxShadow: '0 16px 48px 0 rgba(0, 0, 0, 0.25)',
  },
} as const;

/**
 * Creates CSS style declarations for a given glass variant.
 */
export function getGlassStyle(variant: keyof typeof glassVariants = 'standard') {
  return glassVariants[variant];
}

export type GlassVariant = keyof typeof glassVariants;
