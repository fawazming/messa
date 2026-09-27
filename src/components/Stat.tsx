import { StyleSheet, Text, View } from 'react-native';

import { FontSize, palette } from '@/constants/theme';

type StatProps = {
  label: string;
  value: string | number;
  tone?: 'default' | 'success' | 'error' | 'warning';
};

const TONE_COLOR: Record<NonNullable<StatProps['tone']>, string> = {
  default: palette.text,
  success: palette.success,
  error: palette.error,
  warning: palette.warning,
};

export function Stat({ label, value, tone = 'default' }: StatProps) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.value, { color: TONE_COLOR[tone] }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stat: {
    flex: 1,
    gap: 2,
  },
  value: {
    fontSize: FontSize.title,
    fontWeight: '800',
  },
  label: {
    fontSize: FontSize.caption,
    color: palette.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
