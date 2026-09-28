import { useLocalSearchParams, useRouter } from 'expo-router';
import { Cloud, Save, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { TextField } from '@/components/TextField';
import { FontSize, Spacing, palette } from '@/constants/theme';
import { useCloudStore } from '@/store/cloudStore';
import { useDataStore } from '@/store/dataStore';

export default function RecipientEditorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const recipients = useDataStore((state) => state.recipients);
  const fields = useDataStore((state) => state.fields);
  const meta = useDataStore((state) => state.meta);
  const addRecipient = useDataStore((state) => state.addRecipient);
  const updateRecipient = useDataStore((state) => state.updateRecipient);
  const removeRecipient = useDataStore((state) => state.removeRecipient);

  const activeTable = useCloudStore((state) => state.getActiveTable());
  const pushLocalToTable = useCloudStore((state) => state.pushLocalToTable);
  const busy = useCloudStore((state) => state.busy);

  const existing = useMemo(
    () => (id ? recipients.find((recipient) => recipient.id === id) : undefined),
    [id, recipients]
  );

  const fieldKeys = useMemo(() => {
    const base = fields.length > 0 ? fields : ['name', 'phone'];
    const keys = new Set(base);
    keys.add('name');
    keys.add('phone');
    return Array.from(keys);
  }, [fields]);

  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const key of fieldKeys) {
      initial[key] = existing?.payload[key] ?? '';
    }
    return initial;
  });
  const [saving, setSaving] = useState(false);

  const setValue = (key: string, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const syncToCloud = async () => {
    if (!activeTable) return;
    await pushLocalToTable(activeTable);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (existing) {
        await updateRecipient(existing.id, values);
      } else {
        await addRecipient(values);
      }
      await syncToCloud();
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!existing) return;
    Alert.alert('Delete recipient', 'Remove this recipient from the current dataset?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeRecipient(existing.id);
          await syncToCloud();
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen
      title={existing ? 'Edit Recipient' : 'Add Recipient'}
      showBack
      footer={
        <>
          <Button
            label={existing ? 'Save changes' : 'Add recipient'}
            fullWidth
            loading={saving || busy}
            onPress={save}
            icon={<Save size={16} color={palette.white} />}
          />
          {existing ? (
            <Button
              label="Delete recipient"
              variant="ghost"
              onPress={confirmDelete}
              icon={<Trash2 size={16} color={palette.indigo} />}
            />
          ) : null}
        </>
      }>
      {activeTable ? (
        <Card style={styles.cloudCard}>
          <SectionTitle
            title="Cloud synced"
            caption={`Changes will be pushed to “${activeTable.name}”.`}
          />
          <View style={styles.cloudRow}>
            <Cloud size={16} color="#0E7490" />
            <Text style={styles.cloudText}>{activeTable.public_url}</Text>
          </View>
        </Card>
      ) : (
        <Text style={styles.muted}>
          Saving locally{meta ? ` to “${meta.name}”` : ''}. Load a cloud table to sync changes.
        </Text>
      )}

      {fieldKeys.map((key) => (
        <TextField
          key={key}
          label={key.replace(/_/g, ' ')}
          value={values[key] ?? ''}
          onChangeText={(value) => setValue(key, value)}
          autoCapitalize={key.toLowerCase().includes('phone') ? 'none' : 'sentences'}
          keyboardType={key.toLowerCase().includes('phone') ? 'phone-pad' : 'default'}
          placeholder={key === 'name' ? 'Aisha Yusuf' : key === 'phone' ? '080…' : ''}
        />
      ))}

      <Text style={styles.hint}>
        Fields come from the active dataset. Add more columns in the cloud table to see them here.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cloudCard: {
    backgroundColor: palette.cyanSoft,
    borderColor: '#A5F3FC',
    gap: Spacing.one,
  },
  cloudRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cloudText: {
    flex: 1,
    fontSize: FontSize.caption,
    color: '#0E7490',
  },
  muted: {
    fontSize: FontSize.small,
    color: palette.textSecondary,
  },
  hint: {
    fontSize: FontSize.caption,
    color: palette.textSecondary,
    lineHeight: 18,
  },
});
