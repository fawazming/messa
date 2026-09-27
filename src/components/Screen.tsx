import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/AppHeader';
import { Spacing, palette } from '@/constants/theme';

type ScreenProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  right?: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  footer?: ReactNode;
  headerLarge?: boolean;
};

export function Screen({
  children,
  title,
  subtitle,
  showBack,
  onBack,
  right,
  scroll = true,
  contentStyle,
  footer,
  headerLarge,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const hasHeader = Boolean(title || showBack || right);

  const content = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.content,
        { paddingBottom: (footer ? Spacing.four : insets.bottom + Spacing.four) },
        contentStyle,
      ]}
      style={styles.scroll}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.flex, contentStyle]}>{children}</View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {hasHeader ? (
        <AppHeader
          title={title}
          subtitle={subtitle}
          showBack={showBack}
          onBack={onBack}
          right={right}
          large={headerLarge}
        />
      ) : null}
      {content}
      {footer ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.two }]}>{footer}</View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scroll: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.three,
  },
  footer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    gap: Spacing.two,
    backgroundColor: palette.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
  },
});
