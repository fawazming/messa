import { Check } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontSize, Radius, Spacing, palette } from '@/constants/theme';
import type { Recipient } from '@/types';
import { isValidPhone, prettyPhone } from '@/utils/phone';

type RecipientRowProps = {
  recipient: Recipient;
  selected: boolean;
  onToggle: (id: string) => void;
  onLongPress?: (recipient: Recipient) => void;
};

function detailEntries(recipient: Recipient): { label: string; value: string }[] {
  return Object.entries(recipient.payload)
    .filter(([, value]) => value !== '')
    .filter(([key]) => !['name', 'phone', 'id', 'phone_number', 'mobile'].includes(key.toLowerCase()))
    .slice(0, 2)
    .map(([key, value]) => ({ label: key.replace(/_/g, ' '), value }));
}

function RecipientRowComponent({ recipient, selected, onToggle, onLongPress }: RecipientRowProps) {
  const valid = isValidPhone(recipient.phone);
  const details = detailEntries(recipient);

  return (
    <Pressable
      onPress={() => onToggle(recipient.id)}
      onLongPress={onLongPress ? () => onLongPress(recipient) : undefined}
      delayLongPress={350}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${recipient.name || recipient.remoteId}, ${recipient.phone || 'no phone number'}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected ? <Check size={16} color={palette.white} strokeWidth={3} /> : null}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {recipient.name || 'Unnamed recipient'}
          </Text>
        </View>
        <Text style={[styles.phone, !valid && styles.phoneInvalid]}>
          {recipient.phone ? prettyPhone(recipient.phone) : 'No phone number'}
        </Text>
        {details.length > 0 ? (
          <View style={styles.details}>
            {details.map((detail) => (
              <Text key={detail.label} style={styles.detail} numberOfLines={1}>
                <Text style={styles.detailLabel}>{detail.label}: </Text>
                {detail.value}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export const RecipientRow = memo(RecipientRowComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    backgroundColor: palette.surface,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  pressed: {
    backgroundColor: palette.background,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: palette.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxSelected: {
    backgroundColor: palette.indigo,
    borderColor: palette.indigo,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: FontSize.body,
    fontWeight: '700',
    color: palette.text,
    flex: 1,
  },
  phone: {
    fontSize: FontSize.small,
    color: palette.textSecondary,
  },
  phoneInvalid: {
    color: palette.error,
  },
  details: {
    marginTop: Spacing.one,
    gap: 1,
  },
  detail: {
    fontSize: FontSize.caption,
    color: palette.textSecondary,
  },
  detailLabel: {
    textTransform: 'capitalize',
    fontWeight: '600',
    color: palette.text,
  },
});
