import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { Radius, Shadow, Spacing, palette } from '@/constants/theme';

type CardProps = ViewProps & {
  children?: ReactNode;
  padded?: boolean;
};

export function Card({ style, children, padded = true, ...rest }: CardProps) {
  return (
    <View style={[styles.card, padded && styles.padded, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    ...Shadow,
  },
  padded: {
    padding: Spacing.three,
  },
});
