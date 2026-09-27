import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FontSize, palette } from '@/constants/theme';

type SectionTitleProps = {
  title: string;
  caption?: string;
  action?: ReactNode;
};

export function SectionTitle({ title, caption, action }: SectionTitleProps) {
  return (
    <View style={styles.row}>
      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  texts: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.section,
    fontWeight: '700',
    color: palette.text,
  },
  caption: {
    fontSize: FontSize.small,
    color: palette.textSecondary,
    marginTop: 1,
  },
});
