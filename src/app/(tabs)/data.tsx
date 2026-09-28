import { useRouter } from 'expo-router';
import {
  Check,
  Database,
  Filter as FilterIcon,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { FilterPanel, type FilterGroup } from '@/components/FilterPanel';
import { RecipientRow } from '@/components/RecipientRow';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { FontSize, Radius, Spacing, palette } from '@/constants/theme';
import { DEFAULT_ENDPOINT, useAppStore } from '@/store/appStore';
import { useDataStore } from '@/store/dataStore';
import type { Recipient } from '@/types';
import { timeAgo } from '@/utils/format';

const IGNORED_FILTER_FIELDS = ['id', 'phone', 'phone_number', 'mobile', 'name', 'phone_raw'];

function buildFilterGroups(recipients: Recipient[]): FilterGroup[] {
  const values = new Map<string, Set<string>>();
  for (const recipient of recipients.slice(0, 300)) {
    for (const [key, value] of Object.entries(recipient.payload)) {
      if (!value) continue;
      if (IGNORED_FILTER_FIELDS.includes(key.toLowerCase())) continue;
      const set = values.get(key) ?? new Set<string>();
      set.add(value);
      values.set(key, set);
    }
  }

  return [...values.entries()]
    .filter(([, set]) => set.size > 1 && set.size <= 12)
    .slice(0, 3)
    .map(([field, set]) => ({ field, values: [...set].sort() }));
}

export default function DataScreen() {
  const router = useRouter();
  const recipients = useDataStore((state) => state.recipients);
  const meta = useDataStore((state) => state.meta);
  const query = useDataStore((state) => state.query);
  const setQuery = useDataStore((state) => state.setQuery);
  const selectedIds = useDataStore((state) => state.selectedIds);
  const toggleSelection = useDataStore((state) => state.toggleSelection);
  const setSelection = useDataStore((state) => state.setSelection);
  const clearSelection = useDataStore((state) => state.clearSelection);
  const syncing = useDataStore((state) => state.syncing);
  const sync = useDataStore((state) => state.sync);

  const endpoint = useAppStore((state) => state.dataSource.endpoint);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (recipients.length === 0 && !syncing && endpoint !== DEFAULT_ENDPOINT) {
      sync({ silent: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filterGroups = useMemo(() => buildFilterGroups(recipients), [recipients]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return recipients.filter((recipient) => {
      if (needle) {
        const matches =
          recipient.name.toLowerCase().includes(needle) ||
          recipient.phone.toLowerCase().includes(needle) ||
          recipient.phoneRaw.toLowerCase().includes(needle) ||
          recipient.remoteId.toLowerCase().includes(needle);
        if (!matches) return false;
      }
      for (const [field, selected] of Object.entries(filters)) {
        if (selected.length > 0 && !selected.includes(recipient.payload[field] ?? '')) {
          return false;
        }
      }
      return true;
    });
  }, [recipients, query, filters]);

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((recipient) => selectedIds.has(recipient.id));

  const activeFilterCount = Object.values(filters).reduce(
    (sum, values) => sum + values.length,
    0
  );

  const toggleFilterValue = (field: string, value: string) => {
    setFilters((prev) => {
      const current = prev[field] ?? [];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [field]: next };
    });
  };

  return (
    <Screen
      scroll={false}
      title="Recipients"
      subtitle={meta ? `${recipients.length.toLocaleString()} records · synced ${timeAgo(meta.lastSyncedAt)}` : undefined}
      headerLarge
      right={
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push('/recipient-editor')}
            accessibilityRole="button"
            accessibilityLabel="Add recipient"
            style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}>
            <Plus size={18} color={palette.indigo} />
          </Pressable>
          <Pressable
            onPress={() => sync()}
            disabled={syncing}
            accessibilityRole="button"
            accessibilityLabel="Refresh data"
            style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}>
            <RefreshCw size={18} color={palette.indigo} />
          </Pressable>
        </View>
      }
      contentStyle={styles.content}>
      <View style={styles.toolbar}>
        <TextField
          placeholder="Search recipients…"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          style={styles.searchInput}
          right={
            query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
                <X size={16} color={palette.textSecondary} />
              </Pressable>
            ) : (
              <Search size={16} color={palette.textSecondary} />
            )
          }
        />

        <View style={styles.selectionRow}>
          <Pressable
            onPress={() =>
              allVisibleSelected
                ? setSelection(filtered.map((r) => r.id), false)
                : setSelection(filtered.map((r) => r.id), true)
            }
            accessibilityRole="button"
            accessibilityState={{ checked: allVisibleSelected }}
            style={styles.selectAll}>
            <View style={[styles.smallCheckbox, allVisibleSelected && styles.smallCheckboxActive]}>
              {allVisibleSelected ? <Check size={13} color={palette.white} strokeWidth={3} /> : null}
            </View>
            <Text style={styles.selectAllLabel}>{allVisibleSelected ? 'Deselect all' : 'Select all'}</Text>
          </Pressable>

          <View style={styles.selectionRight}>
            <Chip label={`${selectedIds.size} selected`} tone="indigo" />
            {selectedIds.size > 0 ? (
              <Pressable onPress={clearSelection} accessibilityRole="button">
                <Text style={styles.clear}>Clear</Text>
              </Pressable>
            ) : null}
            {filterGroups.length > 0 ? (
              <Pressable
                onPress={() => setShowFilters((value) => !value)}
                accessibilityRole="button"
                accessibilityLabel="Toggle filters"
                style={styles.filterToggle}>
                <FilterIcon size={16} color={activeFilterCount ? palette.indigo : palette.textSecondary} />
                {activeFilterCount > 0 ? (
                  <Text style={styles.filterCount}>{activeFilterCount}</Text>
                ) : null}
              </Pressable>
            ) : null}
          </View>
        </View>

        {showFilters ? (
          <Card style={styles.filterCard}>
            <FilterPanel
              groups={filterGroups}
              selected={filters}
              onToggle={toggleFilterValue}
              onClear={() => setFilters({})}
            />
          </Card>
        ) : null}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecipientRow
            recipient={item}
            selected={selectedIds.has(item.id)}
            onToggle={toggleSelection}
            onLongPress={(recipient) => router.push(`/recipient-editor?id=${recipient.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={9}
        removeClippedSubviews
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            icon={<Database size={26} color={palette.indigo} />}
            title={recipients.length === 0 ? 'No recipient data' : 'No matches'}
            message={
              recipients.length === 0
                ? 'Connect a Google Sheet endpoint in Settings to load recipients.'
                : 'Try a different search or clear your filters.'
            }
            actionLabel={recipients.length === 0 ? undefined : 'Clear filters'}
            onAction={() => {
              setQuery('');
              setFilters({});
            }}
          />
        }
      />

      {selectedIds.size > 0 ? (
        <View style={styles.footer}>
          <Button
            label={`Continue with ${selectedIds.size}`}
            fullWidth
            onPress={() => router.push('/campaign/recipients')}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  toolbar: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  searchInput: {
    minHeight: 42,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  smallCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: palette.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallCheckboxActive: {
    backgroundColor: palette.indigo,
    borderColor: palette.indigo,
  },
  selectAllLabel: {
    fontSize: FontSize.small,
    fontWeight: '600',
    color: palette.text,
  },
  selectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  clear: {
    fontSize: FontSize.small,
    fontWeight: '700',
    color: palette.indigo,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  filterCount: {
    fontSize: FontSize.caption,
    fontWeight: '700',
    color: palette.indigo,
  },
  filterCard: {
    marginTop: Spacing.one,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
  },
  separator: {
    height: Spacing.two,
  },
  footer: {
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
    backgroundColor: palette.surface,
  },
});
