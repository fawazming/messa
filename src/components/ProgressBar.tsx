import { StyleSheet, View } from 'react-native';

import { Radius, palette } from '@/constants/theme';

type ProgressBarProps = {
  progress: number;
  color?: string;
  height?: number;
  trackColor?: string;
};

export function ProgressBar({
  progress,
  color = palette.indigo,
  height = 8,
  trackColor = palette.border,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
      style={[styles.track, { height, backgroundColor: trackColor }]}>
      <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
});
