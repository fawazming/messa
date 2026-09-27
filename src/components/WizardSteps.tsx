import { Check } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { FontSize, Radius, Spacing, palette } from '@/constants/theme';

export const WIZARD_STEPS = ['Data', 'Message', 'SIM', 'Send'] as const;

type WizardStepsProps = {
  current: number;
};

export function WizardSteps({ current }: WizardStepsProps) {
  return (
    <View style={styles.container}>
      {WIZARD_STEPS.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <View key={step} style={styles.step}>
            <View style={styles.row}>
              <View
                style={[
                  styles.dot,
                  done && styles.dotDone,
                  active && styles.dotActive,
                ]}>
                {done ? (
                  <Check size={11} color={palette.white} strokeWidth={3.5} />
                ) : (
                  <Text style={[styles.dotText, active && styles.dotTextActive]}>
                    {index + 1}
                  </Text>
                )}
              </View>
              {index < WIZARD_STEPS.length - 1 ? (
                <View style={[styles.line, done && styles.lineDone]} />
              ) : null}
            </View>
            <Text style={[styles.label, (done || active) && styles.labelActive]}>{step}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: palette.borderStrong,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: palette.success,
    borderColor: palette.success,
  },
  dotActive: {
    backgroundColor: palette.indigo,
    borderColor: palette.indigo,
  },
  dotText: {
    fontSize: FontSize.caption,
    fontWeight: '700',
    color: palette.textSecondary,
  },
  dotTextActive: {
    color: palette.white,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: palette.border,
  },
  lineDone: {
    backgroundColor: palette.success,
  },
  label: {
    fontSize: FontSize.caption,
    color: palette.textSecondary,
    fontWeight: '600',
  },
  labelActive: {
    color: palette.text,
  },
});
