import { StyleSheet, Text, View } from 'react-native';

import { MessaMark } from '@/components/Logo';
import { FontSize, Spacing, palette } from '@/constants/theme';

export function SplashView() {
  return (
    <View style={styles.container}>
      <MessaMark size={84} />
      <Text style={styles.wordmark}>MESSA</Text>
      <Text style={styles.tagline}>Turn Data Into Messages.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background,
    gap: Spacing.three,
  },
  wordmark: {
    fontSize: FontSize.display,
    fontWeight: '800',
    letterSpacing: 4,
    color: palette.indigo,
  },
  tagline: {
    fontSize: FontSize.body,
    color: palette.textSecondary,
  },
});
