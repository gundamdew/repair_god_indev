import test from 'node:test';
import assert from 'node:assert/strict';

import {
  COLOR_INK,
  COLOR_MUTED,
  COLOR_LINE,
  COLOR_ACCENT,
  COLOR_ACCENT_SOFT,
  COLOR_SUCCESS,
  COLOR_WARN,
  COLOR_GLASS,
  COLOR_GLASS_STRONG,
  colors,
  cssVariables,
} from './colors.js';

import {
  fontFamilies,
  fontSizes,
  fontWeights,
  letterSpacings,
} from './typography.js';

import {
  spacing,
  spacingPx,
  radii,
  radiiPx,
} from './spacing.js';

import { gradients } from './gradients.js';
import { shadows, nativeShadows } from './shadows.js';
import { glassBlurs, glassVariants, getGlassStyle } from './glass.js';

test('ui-tokens: colors match required prototype specifications', () => {
  assert.equal(COLOR_INK, '#1d1f2b');
  assert.equal(COLOR_MUTED, '#6b6f80');
  assert.equal(COLOR_LINE, 'rgba(29, 31, 43, 0.08)');
  assert.equal(COLOR_ACCENT, '#3f4a8a');
  assert.equal(COLOR_ACCENT_SOFT, '#e6e8f6');
  assert.equal(COLOR_SUCCESS, '#3d7a5c');
  assert.equal(COLOR_WARN, '#a8742a');
  assert.equal(COLOR_GLASS, 'rgba(255, 255, 255, 0.55)');
  assert.equal(COLOR_GLASS_STRONG, 'rgba(255, 255, 255, 0.78)');

  assert.equal(cssVariables['--ink'], '#1d1f2b');
  assert.equal(cssVariables['--muted'], '#6b6f80');
  assert.equal(cssVariables['--line'], 'rgba(29, 31, 43, 0.08)');
  assert.equal(cssVariables['--accent'], '#3f4a8a');
  assert.equal(cssVariables['--accent-soft'], '#e6e8f6');
  assert.equal(cssVariables['--success'], '#3d7a5c');
  assert.equal(cssVariables['--warn'], '#a8742a');
  assert.equal(cssVariables['--glass'], 'rgba(255, 255, 255, 0.55)');
  assert.equal(cssVariables['--glass-strong'], 'rgba(255, 255, 255, 0.78)');
});

test('ui-tokens: typography includes Manrope and standard scales', () => {
  assert.ok(fontFamilies.sans.includes('Manrope'));
  assert.ok(fontFamilies.sans.includes('-apple-system'));
  assert.equal(fontSizes.base.fontSize, '1rem');
  assert.equal(fontSizes.base.pixelSize, 16);
  assert.equal(fontWeights.regular, '400');
  assert.equal(fontWeights.bold, '700');
  assert.equal(letterSpacings.normal, '0em');
});

test('ui-tokens: spacing and radii scales', () => {
  assert.equal(spacing[4], '1rem');
  assert.equal(spacingPx[4], 16);
  assert.equal(radii.md, '8px');
  assert.equal(radiiPx.md, 8);
  assert.equal(radii.full, '9999px');
});

test('ui-tokens: gradients definitions', () => {
  assert.ok(gradients.accent.includes(COLOR_ACCENT));
  assert.ok(gradients.glass.includes(COLOR_GLASS));
  assert.ok(gradients.glass.includes(COLOR_GLASS_STRONG));
});

test('ui-tokens: shadows include web CSS and React Native objects', () => {
  assert.ok(shadows.md.includes('rgba(29, 31, 43'));
  assert.ok(shadows.glass.includes('0 8px 32px'));
  assert.equal(nativeShadows.md.elevation, 4);
});

test('ui-tokens: glass tokens and helper', () => {
  assert.equal(glassBlurs.lg, '12px');
  assert.equal(glassVariants.standard.backgroundColor, COLOR_GLASS);
  assert.equal(glassVariants.strong.backgroundColor, COLOR_GLASS_STRONG);
  assert.deepEqual(getGlassStyle('standard'), glassVariants.standard);
});
