import { FileText, Pencil, Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontSize, Radius, Spacing, palette } from '@/constants/theme';
import type { MessaTemplate } from '@/types';
import { extractVariables } from '@/utils/template';

type TemplateCardProps = {
  template: MessaTemplate;
  selected?: boolean;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  recipientCount?: number;
};

export function TemplateCard({
  template,
  selected,
  onPress,
  onEdit,
  onDelete,
  recipientCount,
}: TemplateCardProps) {
  const variables = extractVariables(template.body);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={template.name}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconWrap}>
            <FileText size={16} color={palette.indigo} strokeWidth={2.2} />
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {template.name}
          </Text>
        </View>
        <View style={styles.actions}>
          {onEdit ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Edit ${template.name}`}
              hitSlop={8}
              onPress={onEdit}
              style={styles.actionButton}>
              <Pencil size={16} color={palette.textSecondary} />
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Delete ${template.name}`}
              hitSlop={8}
              onPress={onDelete}
              style={styles.actionButton}>
              <Trash2 size={16} color={palette.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <Text style={styles.body} numberOfLines={3}>
        {template.body || 'Empty template'}
      </Text>

      <View style={styles.footer}>
        {variables.length > 0 ? (
          <Text style={styles.meta}>
            {variables.length} variable{variables.length === 1 ? '' : 's'}
          </Text>
        ) : (
          <Text style={styles.meta}>No variables</Text>
        )}
        {typeof recipientCount === 'number' ? (
          <Text style={styles.meta}>
            {recipientCount} recipient{recipientCount === 1 ? '' : 's'}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: palette.border,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  selected: {
    borderColor: palette.indigo,
    backgroundColor: palette.indigoSoft,
  },
  pressed: {
    opacity: 0.9,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: palette.indigoSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: FontSize.lead,
    fontWeight: '700',
    color: palette.text,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  actionButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  body: {
    fontSize: FontSize.body,
    color: palette.textSecondary,
    lineHeight: 21,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  meta: {
    fontSize: FontSize.caption,
    color: palette.textSecondary,
    fontWeight: '600',
  },
});
