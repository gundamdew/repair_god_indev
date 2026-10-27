/**
 * Shadow definitions for Repair God design system.
 * Provides both CSS box-shadow strings and React Native shadow objects.
 */

import { COLOR_INK } from './colors.js';

export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(29, 31, 43, 0.04)',
  sm: '0 1px 3px 0 rgba(29, 31, 43, 0.06), 0 1px 2px -1px rgba(29, 31, 43, 0.04)',
  md: '0 4px 6px -1px rgba(29, 31, 43, 0.08), 0 2px 4px -2px rgba(29, 31, 43, 0.04)',
  lg: '0 10px 15px -3px rgba(29, 31, 43, 0.08), 0 4px 6px -4px rgba(29, 31, 43, 0.03)',
  xl: '0 20px 25px -5px rgba(29, 31, 43, 0.10), 0 8px 10px -6px rgba(29, 31, 43, 0.04)',
  '2xl': '0 25px 50px -12px rgba(29, 31, 43, 0.18)',
  glass: '0 8px 32px 0 rgba(29, 31, 43, 0.07)',
  glassElevated: '0 16px 48px 0 rgba(29, 31, 43, 0.12)',
  floating: '0 12px 36px -4px rgba(29, 31, 43, 0.14)',
  inner: 'inset 0 2px 4px 0 rgba(29, 31, 43, 0.05)',
  accentGlow: '0 8px 24px -4px rgba(63, 74, 138, 0.28)',
} as const;

/**
 * Cross-platform shadow objects for React Native / NativeWind.
 */
export const nativeShadows = {
  sm: {
    shadowColor: COLOR_INK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: COLOR_INK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: COLOR_INK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowColor: COLOR_INK,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  glass: {
    shadowColor: COLOR_INK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 5,
  },
} as const;

export type ShadowKey = keyof typeof shadows;
export type NativeShadowKey = keyof typeof nativeShadows;
