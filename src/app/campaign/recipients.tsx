import { useRouter } from 'expo-router';
import { Check, Search, Users, X } from 'lucide-react-native';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { RecipientRow } from '@/components/RecipientRow';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { WizardSteps } from '@/components/WizardSteps';
import { FontSize, Spacing, palette } from '@/constants/theme';
import { useDataStore } from '@/store/dataStore';
import { useCampaignStore } from '@/store/campaignStore';

export default function SelectRecipientsScreen() {
  const router = useRouter();
  const recipients = useDataStore((state) => state.recipients);
  const query = useDataStore((state) => state.query);
  const setQuery = useDataStore((state) => state.setQuery);
  const selectedIds = useDataStore((state) => state.selectedIds);
  const toggleSelection = useDataStore((state) => state.toggleSelection);
  const setSelection = useDataStore((state) => state.setSelection);
  const clearSelection = useDataStore((state) => state.clearSelection);
  const setCampaignName = useCampaignStore((state) => state.setCampaignName);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return recipients;
    return recipients.filter(
      (recipient) =>
        recipient.name.toLowerCase().includes(needle) ||
        recipient.phone.toLowerCase().includes(needle) ||
        recipient.remoteId.toLowerCase().includes(needle)
    );
  }, [recipients, query]);

  const allSelected =
    filtered.length > 0 && filtered.every((recipient) => selectedIds.has(recipient.id));

  return (
    <Screen
      scroll={false}
      title="Select Recipients"
      showBack
      subtitle="Step 1 of 4"
      contentStyle={styles.content}>
      <View style={styles.top}>
        <WizardSteps current={0} />
        <TextField
          placeholder="Search recipients…"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          style={styles.search}
          right={
            query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
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
              allSelected
                ? setSelection(filtered.map((r) => r.id), false)
                : setSelection(filtered.map((r) => r.id), true)
            }
            accessibilityRole="button"
            accessibilityState={{ checked: allSelected }}
            style={styles.selectAll}>
            <View style={[styles.checkbox, allSelected && styles.checkboxActive]}>
              {allSelected ? <Check size={13} color={palette.white} strokeWidth={3} /> : null}
            </View>
            <Text style={styles.selectAllLabel}>{allSelected ? 'Deselect all' : 'Select all'}</Text>
          </Pressable>
          <Text style={styles.count}>{selectedIds.size} selected</Text>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecipientRow
            recipient={item}
            selected={selectedIds.has(item.id)}
            onToggle={toggleSelection}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={9}
        ListEmptyComponent={
          <EmptyState
            icon={<Users size={26} color={palette.indigo} />}
            title={recipients.length === 0 ? 'No recipients loaded' : 'No matches'}
            message={
              recipients.length === 0
                ? 'Load recipient data from the Data tab first.'
                : 'Try a different search.'
            }
          />
        }
      />

      <View style={styles.footer}>
        {selectedIds.size > 0 ? (
          <Pressable onPress={clearSelection} accessibilityRole="button" style={styles.clearLink}>
            <Text style={styles.clearLabel}>Clear selection</Text>
          </Pressable>
        ) : null}
        <Button
          label={selectedIds.size > 0 ? `Continue with ${selectedIds.size}` : 'Select recipients'}
          fullWidth
          disabled={selectedIds.size === 0}
          onPress={() => {
            setCampaignName('');
            router.push('/campaign/template');
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  top: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  search: {
    minHeight: 42,
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
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: palette.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: palette.indigo,
    borderColor: palette.indigo,
  },
  selectAllLabel: {
    fontSize: FontSize.small,
    fontWeight: '600',
    color: palette.text,
  },
  count: {
    fontSize: FontSize.small,
    fontWeight: '700',
    color: palette.indigo,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
  },
  separator: {
    height: Spacing.two,
  },
  footer: {
    padding: Spacing.three,
    gap: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
    backgroundColor: palette.surface,
  },
  clearLink: {
    alignSelf: 'center',
  },
  clearLabel: {
    fontSize: FontSize.small,
    fontWeight: '600',
    color: palette.textSecondary,
  },
});
