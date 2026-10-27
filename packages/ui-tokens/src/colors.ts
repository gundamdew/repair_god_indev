/**
 * Core color palette tokens extracted from UI prototype and brand guidelines.
 */

export const COLOR_INK = '#1d1f2b';
export const COLOR_MUTED = '#6b6f80';
export const COLOR_LINE = 'rgba(29, 31, 43, 0.08)';
export const COLOR_ACCENT = '#3f4a8a';
export const COLOR_ACCENT_SOFT = '#e6e8f6';
export const COLOR_SUCCESS = '#3d7a5c';
export const COLOR_WARN = '#a8742a';
export const COLOR_GLASS = 'rgba(255, 255, 255, 0.55)';
export const COLOR_GLASS_STRONG = 'rgba(255, 255, 255, 0.78)';

export const colors = {
  ink: {
    DEFAULT: COLOR_INK,
    light: '#323547',
    dark: '#12131b',
    50: '#f5f6f9',
    100: '#e5e7ee',
    200: '#c5c9d9',
    300: '#989eb8',
    400: '#646b8f',
    500: '#3f466b',
    600: '#2b304f',
    700: '#22253f',
    800: '#1d1f2b',
    900: '#12131b',
  },
  muted: {
    DEFAULT: COLOR_MUTED,
    light: '#8e92a4',
    dark: '#4f5260',
  },
  line: {
    DEFAULT: COLOR_LINE,
    subtle: 'rgba(29, 31, 43, 0.04)',
    strong: 'rgba(29, 31, 43, 0.16)',
    inverse: 'rgba(255, 255, 255, 0.16)',
  },
  accent: {
    DEFAULT: COLOR_ACCENT,
    soft: COLOR_ACCENT_SOFT,
    hover: '#323c73',
    active: '#272f5c',
    light: '#5d69b0',
    50: '#f3f4fa',
    100: '#e6e8f6',
    200: '#d0d4ee',
    300: '#abb2e1',
    400: '#7c88cf',
    500: COLOR_ACCENT,
    600: '#323c73',
    700: '#272f5c',
    800: '#1f2549',
    900: '#14172f',
  },
  success: {
    DEFAULT: COLOR_SUCCESS,
    soft: '#e9f4ee',
    hover: '#31634b',
    dark: '#244937',
  },
  warn: {
    DEFAULT: COLOR_WARN,
    soft: '#fcf4e8',
    hover: '#8c5f21',
    dark: '#684515',
  },
  error: {
    DEFAULT: '#c93b3b',
    soft: '#fdf0f0',
    hover: '#a82e2e',
    dark: '#7e1f1f',
  },
  surface: {
    white: '#ffffff',
    base: '#f8f9fc',
    elevated: '#ffffff',
    subtle: '#f1f3f9',
    overlay: 'rgba(29, 31, 43, 0.45)',
  },
  glass: {
    DEFAULT: COLOR_GLASS,
    strong: COLOR_GLASS_STRONG,
    subtle: 'rgba(255, 255, 255, 0.35)',
    border: 'rgba(255, 255, 255, 0.45)',
    dark: 'rgba(29, 31, 43, 0.75)',
  },
} as const;

/**
 * CSS custom property tokens corresponding to prototype variables.
 */
export const cssVariables = {
  '--ink': COLOR_INK,
  '--muted': COLOR_MUTED,
  '--line': COLOR_LINE,
  '--accent': COLOR_ACCENT,
  '--accent-soft': COLOR_ACCENT_SOFT,
  '--success': COLOR_SUCCESS,
  '--warn': COLOR_WARN,
  '--glass': COLOR_GLASS,
  '--glass-strong': COLOR_GLASS_STRONG,
} as const;

export type Colors = typeof colors;
export type CssVariableKey = keyof typeof cssVariables;
