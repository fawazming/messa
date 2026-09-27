/**
 * MESSA design tokens.
 * Brand: Indigo primary, Signal Cyan accent, neutral operational surfaces.
 * See MESSA_Data_to_SMS_App_Brand_and_Product_Spec.md sections 8-12.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const palette = {
  indigo: '#4F46E5',
  indigoDark: '#3730A3',
  indigoSoft: '#EEF2FF',
  cyan: '#06B6D4',
  cyanSoft: '#ECFEFF',
  success: '#16A34A',
  successSoft: '#F0FDF4',
  warning: '#F59E0B',
  warningSoft: '#FFFBEB',
  error: '#DC2626',
  errorSoft: '#FEF2F2',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type ThemeColor = keyof typeof palette;

export const Colors = {
  light: {
    text: palette.text,
    textSecondary: palette.textSecondary,
    background: palette.background,
    backgroundElement: palette.surface,
    backgroundSelected: palette.indigoSoft,
    border: palette.border,
    primary: palette.indigo,
    accent: palette.cyan,
  },
  dark: {
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    background: '#0B1120',
    backgroundElement: '#111827',
    backgroundSelected: '#1E1B4B',
    border: '#1F2937',
    primary: '#818CF8',
    accent: '#22D3EE',
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 10,
  lg: 12,
  card: 14,
  xl: 16,
  pill: 999,
} as const;

export const FontSize = {
  caption: 12,
  small: 13,
  body: 15,
  lead: 16,
  section: 18,
  title: 24,
  display: 30,
} as const;

export const Shadow = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  android: { elevation: 1 },
  default: {},
});

export const TouchTarget = 48;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
