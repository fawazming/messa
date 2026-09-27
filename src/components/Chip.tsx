import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FontSize, Radius, Spacing, palette } from '@/constants/theme';

type Tone = 'neutral' | 'indigo' | 'cyan' | 'success' | 'warning' | 'error';

type ChipProps = {
  label: string;
  tone?: Tone;
  icon?: ReactNode;
};

const TONES: Record<Tone, { background: string; text: string }> = {
  neutral: { background: palette.background, text: palette.textSecondary },
  indigo: { background: palette.indigoSoft, text: palette.indigoDark },
  cyan: { background: palette.cyanSoft, text: '#0E7490' },
  success: { background: palette.successSoft, text: '#15803D' },
  warning: { background: palette.warningSoft, text: '#B45309' },
  error: { background: palette.errorSoft, text: '#B91C1C' },
};

export function Chip({ label, tone = 'neutral', icon }: ChipProps) {
  const colors = TONES[tone];
  return (
    <View style={[styles.chip, { backgroundColor: colors.background }]}>
      {icon}
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: FontSize.caption,
    fontWeight: '600',
  },
});
