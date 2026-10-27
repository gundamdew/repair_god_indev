/**
 * Typography tokens for Repair God design system.
 * Primary typeface: 'Manrope', -apple-system, sans-serif
 */

export const fontFamilies = {
  primary: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  sans: "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
} as const;

export const fontSizes = {
  xs: {
    fontSize: '0.75rem',     // 12px
    lineHeight: '1rem',      // 16px
    pixelSize: 12,
    pixelLineHeight: 16,
  },
  sm: {
    fontSize: '0.875rem',    // 14px
    lineHeight: '1.25rem',   // 20px
    pixelSize: 14,
    pixelLineHeight: 20,
  },
  base: {
    fontSize: '1rem',        // 16px
    lineHeight: '1.5rem',    // 24px
    pixelSize: 16,
    pixelLineHeight: 24,
  },
  lg: {
    fontSize: '1.125rem',    // 18px
    lineHeight: '1.75rem',   // 28px
    pixelSize: 18,
    pixelLineHeight: 28,
  },
  xl: {
    fontSize: '1.25rem',     // 20px
    lineHeight: '1.75rem',   // 28px
    pixelSize: 20,
    pixelLineHeight: 28,
  },
  '2xl': {
    fontSize: '1.5rem',      // 24px
    lineHeight: '2rem',      // 32px
    pixelSize: 24,
    pixelLineHeight: 32,
  },
  '3xl': {
    fontSize: '1.875rem',    // 30px
    lineHeight: '2.25rem',   // 36px
    pixelSize: 30,
    pixelLineHeight: 36,
  },
  '4xl': {
    fontSize: '2.25rem',     // 36px
    lineHeight: '2.5rem',    // 40px
    pixelSize: 36,
    pixelLineHeight: 40,
  },
  '5xl': {
    fontSize: '3rem',        // 48px
    lineHeight: '1.15',
    pixelSize: 48,
    pixelLineHeight: 56,
  },
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export const fontWeightsNumeric = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

export const letterSpacings = {
  tighter: '-0.04em',
  tight: '-0.02em',
  normal: '0em',
  wide: '0.02em',
  wider: '0.05em',
} as const;

export const typography = {
  fontFamilies,
  fontSizes,
  fontWeights,
  fontWeightsNumeric,
  letterSpacings,
} as const;

export type Typography = typeof typography;
export type FontSizeKey = keyof typeof fontSizes;
export type FontWeightKey = keyof typeof fontWeights;
