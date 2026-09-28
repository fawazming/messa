import { Database, LogOut, Plus, RefreshCw, Trash2, Upload } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { TextField } from '@/components/TextField';
import { MAX_CLOUD_ROWS } from '@/constants/config';
import { FontSize, Radius, Spacing, palette } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { useCloudStore } from '@/store/cloudStore';
import { useDataStore } from '@/store/dataStore';
import type { CloudTable } from '@/types';
import { timeAgo } from '@/utils/format';

export default function TablesScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const {
    tables,
    activeTableId,
    loading,
    busy,
    error,
    refresh,
    createTable,
    deleteTable,
    importInto,
    loadIntoApp,
    pushLocalToTable,
    updateTable,
  } = useCloudStore();

  const localCount = useDataStore((state) => state.recipients.length);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [columns, setColumns] = useState('name, phone');
  const [sourceUrl, setSourceUrl] = useState('');
  const [importFor, setImportFor] = useState<number | null>(null);
  const [importUrl, setImportUrl] = useState('');
  const [renameFor, setRenameFor] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const submitCreate = async () => {
    const created = await createTable(
      name,
      columns.split(',').map((column) => column.trim()).filter(Boolean),
      sourceUrl.trim() || undefined
    );
    if (created) {
      setShowCreate(false);
      setName('');
      setSourceUrl('');
    }
  };

  const doImport = async (table: CloudTable) => {
    if (!importUrl.trim()) {
      Alert.alert('Import', 'Paste a sheet.spacet.me JSON URL first.');
      return;
    }
    const imported = await importInto(table.id, importUrl.trim());
    if (imported >= 0) {
      Alert.alert('Imported', `${imported} rows loaded into “${table.name}”.`);
      setImportFor(null);
      setImportUrl('');
    }
  };

  const doPush = (table: CloudTable) => {
    Alert.alert(
      'Push local data',
      `Replace “${table.name}” with the ${localCount} recipients currently loaded in the app?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Push',
          onPress: async () => {
            const count = await pushLocalToTable(table);
            if (count >= 0) Alert.alert('Synced', `${count} rows uploaded to “${table.name}”.`);
          },
        },
      ]
    );
  };

  const confirmDelete = (table: CloudTable) => {
    Alert.alert('Delete table', `Delete “${table.name}” and all its rows?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTable(table.id) },
    ]);
  };

  const submitRename = async (table: CloudTable) => {
    if (renameValue.trim()) {
      await updateTable(table.id, { name: renameValue.trim() });
    }
    setRenameFor(null);
    setRenameValue('');
  };

  return (
    <Screen
      title="Cloud Tables"
      showBack
      subtitle={user ? `${user.email}` : undefined}
      right={
        <Pressable
          onPress={() => refresh()}
          accessibilityRole="button"
          accessibilityLabel="Refresh tables"
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <RefreshCw size={18} color={palette.indigo} />
        </Pressable>
      }>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Card>
        <SectionTitle
          title="Account"
          caption={user ? `${user.name} · max ${user.max_tables} tables` : 'Signed in'}
        />
        <View style={styles.accountRow}>
          <Chip label={`${tables.length}/${user?.max_tables ?? 10} tables`} tone="indigo" />
          <Chip label={`${MAX_CLOUD_ROWS} rows max`} tone="neutral" />
        </View>
        <Button
          label="Sign out"
          variant="secondary"
          size="sm"
          icon={<LogOut size={15} color={palette.text} />}
          onPress={logout}
        />
      </Card>

      <Button
        label={showCreate ? 'Close' : 'Create table'}
        variant={showCreate ? 'secondary' : 'primary'}
        fullWidth
        icon={<Plus size={17} color={showCreate ? palette.text : palette.white} />}
        onPress={() => setShowCreate((value) => !value)}
      />

      {showCreate ? (
        <Card style={styles.formCard}>
          <TextField label="Table name" value={name} onChangeText={setName} placeholder="September Fees" />
          <TextField
            label="Columns (comma separated)"
            value={columns}
            onChangeText={setColumns}
            autoCapitalize="none"
            placeholder="name, phone, class, balance"
          />
          <TextField
            label="Source URL (optional, sheet.spacet.me)"
            value={sourceUrl}
            onChangeText={setSourceUrl}
            autoCapitalize="none"
            keyboardType="url"
            placeholder="https://sheet.spacet.me/…/Recipients.json"
          />
          <Button label="Create table" onPress={submitCreate} loading={busy} fullWidth />
        </Card>
      ) : null}

      {loading && tables.length === 0 ? (
        <Text style={styles.muted}>Loading tables…</Text>
      ) : tables.length === 0 ? (
        <EmptyState
          icon={<Database size={26} color={palette.indigo} />}
          title="No cloud tables yet"
          message="Create a table, import from a Google Sheet, or push the recipients currently loaded in the app."
        />
      ) : (
        <View style={styles.list}>
          {tables.map((table) => {
            const active = table.id === activeTableId;
            return (
              <Card key={table.id} style={active ? styles.activeCard : undefined}>
                <View style={styles.tableHeader}>
                  <View style={styles.tableTitleWrap}>
                    <Text style={styles.tableName} numberOfLines={1}>
                      {table.name}
                    </Text>
                    <Text style={styles.muted}>
                      {table.row_count} rows · {table.columns.length} columns · updated{' '}
                      {timeAgo(new Date(table.updated_at).getTime())}
                    </Text>
                  </View>
                  {active ? <Chip label="Active" tone="success" /> : null}
                </View>

                <Text style={styles.url} selectable numberOfLines={1}>
                  {table.public_url}
                </Text>

                <View style={styles.actions}>
                  <Button
                    label={active ? 'Reload' : 'Load'}
                    size="sm"
                    variant={active ? 'secondary' : 'primary'}
                    onPress={() => loadIntoApp(table)}
                    loading={busy && active}
                  />
                  <Button
                    label="Import"
                    size="sm"
                    variant="secondary"
                    onPress={() => {
                      setImportFor(importFor === table.id ? null : table.id);
                      setImportUrl(table.source_url ?? '');
                    }}
                  />
                  <Button
                    label="Push"
                    size="sm"
                    variant="secondary"
                    icon={<Upload size={14} color={palette.text} />}
                    onPress={() => doPush(table)}
                  />
                  <Button
                    label="Rename"
                    size="sm"
                    variant="secondary"
                    onPress={() => {
                      setRenameFor(renameFor === table.id ? null : table.id);
                      setRenameValue(table.name);
                    }}
                  />
                  <Button
                    label="Delete"
                    size="sm"
                    variant="danger"
                    icon={<Trash2 size={14} color={palette.white} />}
                    onPress={() => confirmDelete(table)}
                  />
                </View>

                {importFor === table.id ? (
                  <View style={styles.subForm}>
                    <TextField
                      label="sheet.spacet.me JSON URL"
                      value={importUrl}
                      onChangeText={setImportUrl}
                      autoCapitalize="none"
                      keyboardType="url"
                      placeholder="https://sheet.spacet.me/…/Sheet1.json"
                    />
                    <Button label="Import now" size="sm" onPress={() => doImport(table)} loading={busy} />
                  </View>
                ) : null}

                {renameFor === table.id ? (
                  <View style={styles.subForm}>
                    <TextField label="New name" value={renameValue} onChangeText={setRenameValue} />
                    <Button label="Save name" size="sm" onPress={() => submitRename(table)} loading={busy} />
                  </View>
                ) : null}
              </Card>
            );
          })}
        </View>
      )}

      <Text style={styles.hint}>
        “Load” makes a table the active dataset for campaigns. “Push” uploads the recipients currently
        in the app into the table. Each table also exposes a read-only JSON URL you can use as a Data
        Source anywhere.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: palette.error,
    backgroundColor: palette.errorSoft,
    padding: Spacing.two,
    borderRadius: Radius.md,
    fontSize: FontSize.small,
  },
  accountRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginVertical: Spacing.two,
  },
  formCard: { gap: Spacing.two },
  list: { gap: Spacing.two },
  activeCard: { borderColor: palette.indigo, backgroundColor: palette.indigoSoft },
  tableHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  tableTitleWrap: { flex: 1 },
  tableName: { fontSize: FontSize.lead, fontWeight: '700', color: palette.text },
  muted: { fontSize: FontSize.small, color: palette.textSecondary },
  url: {
    fontSize: FontSize.caption,
    color: palette.indigo,
    marginTop: Spacing.one,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  subForm: { gap: Spacing.two, marginTop: Spacing.two },
  hint: {
    fontSize: FontSize.caption,
    color: palette.textSecondary,
    lineHeight: 18,
  },
});
