import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontSize, Radius, Spacing, palette } from '@/constants/theme';

export type FilterGroup = {
  field: string;
  values: string[];
};

type FilterPanelProps = {
  groups: FilterGroup[];
  selected: Record<string, string[]>;
  onToggle: (field: string, value: string) => void;
  onClear: () => void;
};

export function FilterPanel({ groups, selected, onToggle, onClear }: FilterPanelProps) {
  const hasSelection = Object.values(selected).some((values) => values.length > 0);

  if (groups.length === 0) {
    return (
      <Text style={styles.empty}>No filterable fields detected in this dataset.</Text>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Filter</Text>
        {hasSelection ? (
          <Pressable onPress={onClear} accessibilityRole="button">
            <Text style={styles.clear}>Clear filters</Text>
          </Pressable>
        ) : null}
      </View>

      {groups.map((group) => (
        <View key={group.field} style={styles.group}>
          <Text style={styles.groupLabel}>{group.field.replace(/_/g, ' ')}</Text>
          <View style={styles.values}>
            {group.values.map((value) => {
              const active = (selected[group.field] ?? []).includes(value);
              return (
                <Pressable
                  key={value}
                  onPress={() => onToggle(group.field, value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{value}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLabel: {
    fontSize: FontSize.small,
    fontWeight: '700',
    color: palette.text,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  clear: {
    fontSize: FontSize.small,
    fontWeight: '600',
    color: palette.indigo,
  },
  group: {
    gap: Spacing.one,
  },
  groupLabel: {
    fontSize: FontSize.small,
    fontWeight: '600',
    color: palette.textSecondary,
    textTransform: 'capitalize',
  },
  values: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  chipActive: {
    backgroundColor: palette.indigoSoft,
    borderColor: palette.indigo,
  },
  chipText: {
    fontSize: FontSize.caption,
    color: palette.text,
    fontWeight: '600',
  },
  chipTextActive: {
    color: palette.indigoDark,
  },
  empty: {
    fontSize: FontSize.small,
    color: palette.textSecondary,
  },
});
