import type { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { FontSize, Radius, Spacing, palette } from '@/constants/theme';

type TextFieldProps = TextInputProps & {
  label?: string;
  helper?: string;
  error?: string;
  right?: ReactNode;
};

export function TextField({ label, helper, error, right, style, ...rest }: TextFieldProps) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputWrap, error ? styles.inputError : null]}>
        <TextInput
          placeholderTextColor={palette.textSecondary}
          style={[styles.input, rest.multiline && styles.multiline, style]}
          {...rest}
        />
        {right}
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helper}>{helper}</Text>
      ) : null}
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
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: Radius.md,
    backgroundColor: palette.surface,
    paddingHorizontal: Spacing.three,
  },
  inputError: {
    borderColor: palette.error,
  },
  input: {
    flex: 1,
    minHeight: 46,
    fontSize: FontSize.body,
    color: palette.text,
    paddingVertical: Spacing.two,
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  helper: {
    fontSize: FontSize.caption,
    color: palette.textSecondary,
  },
  error: {
    fontSize: FontSize.caption,
    color: palette.error,
  },
});
