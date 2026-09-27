import { Check, Signal } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { FontSize, Radius, Spacing, palette } from '@/constants/theme';
import type { SimSubscription } from '@/types';
import { maskPhone } from '@/utils/phone';

type SimSelectorProps = {
  subscriptions: SimSubscription[];
  selectedId: number | null;
  onSelect: (subscription: SimSubscription) => void;
  loading?: boolean;
};

const ASK_OPTION: SimSubscription = {
  subscriptionId: 0,
  slotIndex: -1,
  displayName: 'Ask Android each time',
  carrierName: null,
  phoneNumber: null,
};

export function SimSelector({ subscriptions, selectedId, onSelect, loading }: SimSelectorProps) {
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={palette.indigo} />
        <Text style={styles.loadingText}>Detecting SIM cards…</Text>
      </View>
    );
  }

  const options = [...subscriptions, ASK_OPTION];

  return (
    <View style={styles.list}>
      {options.map((subscription) => {
        const selected = selectedId === subscription.subscriptionId;
        return (
          <Pressable
            key={subscription.subscriptionId}
            onPress={() => onSelect(subscription)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={
              subscription.carrierName
                ? `${subscription.displayName}, ${subscription.carrierName}`
                : subscription.displayName
            }
            style={({ pressed }) => [
              styles.option,
              selected && styles.optionSelected,
              pressed && styles.pressed,
            ]}>
            <View style={[styles.radio, selected && styles.radioSelected]}>
              {selected ? <Check size={14} color={palette.white} strokeWidth={3} /> : null}
            </View>

            <View style={styles.body}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{subscription.displayName}</Text>
                {subscription.slotIndex >= 0 ? (
                  <Signal size={14} color={palette.cyan} />
                ) : null}
              </View>
              {subscription.carrierName ? (
                <Text style={styles.carrier}>{subscription.carrierName}</Text>
              ) : null}
              {subscription.phoneNumber ? (
                <Text style={styles.number}>{maskPhone(subscription.phoneNumber)}</Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}

      {subscriptions.length === 0 ? (
        <Text style={styles.hint}>
          No SIM subscriptions detected. Grant phone permission or choose “Ask Android each time”.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.two,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  loadingText: {
    fontSize: FontSize.body,
    color: palette.textSecondary,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  optionSelected: {
    borderColor: palette.indigo,
    backgroundColor: palette.indigoSoft,
  },
  pressed: {
    opacity: 0.9,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: palette.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: palette.indigo,
    borderColor: palette.indigo,
  },
  body: {
    flex: 1,
    gap: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    fontSize: FontSize.lead,
    fontWeight: '700',
    color: palette.text,
  },
  carrier: {
    fontSize: FontSize.small,
    color: palette.textSecondary,
  },
  number: {
    fontSize: FontSize.caption,
    color: palette.textSecondary,
  },
  hint: {
    fontSize: FontSize.small,
    color: palette.textSecondary,
    lineHeight: 20,
  },
});
