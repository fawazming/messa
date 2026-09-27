import { ChevronDown, Check } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FontSize, Radius, Spacing, palette } from '@/constants/theme';

export type SelectOption = {
  label: string;
  value: string;
};

type SelectFieldProps = {
  label?: string;
  value?: string;
  placeholder?: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function SelectField({
  label,
  value,
  placeholder = 'Select…',
  options,
  onChange,
  disabled,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable
        onPress={disabled ? undefined : () => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: Boolean(disabled), expanded: open }}
        style={({ pressed }) => [
          styles.control,
          pressed && !disabled && styles.pressed,
          disabled && styles.disabled,
        ]}>
        <Text style={[styles.value, !selected && styles.placeholder]} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        <ChevronDown size={18} color={palette.textSecondary} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            {label ? <Text style={styles.sheetTitle}>{label}</Text> : null}
            <ScrollView style={styles.sheetList}>
              {options.length === 0 ? (
                <Text style={styles.empty}>No options available.</Text>
              ) : null}
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
                    <Text style={[styles.optionLabel, active && styles.optionActive]}>
                      {option.label}
                    </Text>
                    {active ? <Check size={18} color={palette.indigo} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  label: {
    fontSize: FontSize.small,
    fontWeight: '600',
    color: palette.text,
  },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: Radius.md,
    backgroundColor: palette.surface,
    paddingHorizontal: Spacing.three,
    minHeight: 46,
  },
  pressed: {
    backgroundColor: palette.background,
  },
  disabled: {
    opacity: 0.5,
  },
  value: {
    flex: 1,
    fontSize: FontSize.body,
    color: palette.text,
  },
  placeholder: {
    color: palette.textSecondary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.three,
    maxHeight: '70%',
  },
  sheetTitle: {
    fontSize: FontSize.section,
    fontWeight: '700',
    color: palette.text,
    marginBottom: Spacing.two,
  },
  sheetList: {
    flexGrow: 0,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
  },
  optionLabel: {
    fontSize: FontSize.body,
    color: palette.text,
  },
  optionActive: {
    color: palette.indigo,
    fontWeight: '700',
  },
  empty: {
    fontSize: FontSize.body,
    color: palette.textSecondary,
    paddingVertical: Spacing.three,
  },
});
