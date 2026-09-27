import { useLocalSearchParams, useRouter } from 'expo-router';
import { Save, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { TextField } from '@/components/TextField';
import { FontSize, Radius, Spacing, palette } from '@/constants/theme';
import { discoverTemplateVariables, TEMPLATE_HELPERS } from '@/services/templateService';
import { useDataStore } from '@/store/dataStore';
import { useTemplatesStore } from '@/store/templatesStore';
import { renderTemplate } from '@/utils/template';
import { estimateSmsLength } from '@/utils/smsLength';

const FALLBACK_PAYLOAD: Record<string, string> = {
  name: 'Aisha Yusuf',
  phone: '08012345678',
  class: 'JSS 2',
  balance: '25000',
  school: 'ABC College',
};

export default function TemplateEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const templates = useTemplatesStore((state) => state.templates);
  const create = useTemplatesStore((state) => state.create);
  const update = useTemplatesStore((state) => state.update);
  const remove = useTemplatesStore((state) => state.remove);

  const existing = useMemo(
    () => templates.find((template) => template.id === params.id),
    [templates, params.id]
  );

  const recipients = useDataStore((state) => state.recipients);
  const selectedIds = useDataStore((state) => state.selectedIds);
  const variables = useMemo(() => discoverTemplateVariables(recipients), [recipients]);

  const [name, setName] = useState(existing?.name ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [saving, setSaving] = useState(false);

  const sample = useMemo(() => {
    const selected = recipients.find((recipient) => selectedIds.has(recipient.id));
    const recipient = selected ?? recipients[0];
    return recipient?.payload ?? FALLBACK_PAYLOAD;
  }, [recipients, selectedIds]);

  const preview = useMemo(() => renderTemplate(body, sample).text, [body, sample]);
  const length = estimateSmsLength(preview);

  const insertVariable = (token: string) => {
    setBody((current) => {
      const before = current.slice(0, selection.start);
      const after = current.slice(selection.end);
      return `${before}${token}${after}`;
    });
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Template name required', 'Give this template a name before saving.');
      return;
    }
    if (!body.trim()) {
      Alert.alert('Message required', 'Write a message before saving.');
      return;
    }
    setSaving(true);
    try {
      if (existing) {
        await update({ ...existing, name: name.trim(), body });
      } else {
        await create(name.trim(), body);
      }
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!existing) return;
    Alert.alert('Delete template', `Delete “${existing.name}”?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await remove(existing.id);
          router.back();
        },
      },
    ]);
  };

  const tokenOptions = Array.from(
    new Set([...variables, ...TEMPLATE_HELPERS.map((helper) => helper.token)])
  );

  return (
    <Screen
      title={existing ? 'Edit Template' : 'New Template'}
      showBack
      footer={
        <>
          <Button label={existing ? 'Save Changes' : 'Create Template'} loading={saving} onPress={save} fullWidth icon={<Save size={17} color={palette.white} />} />
          {existing ? (
            <Button
              label="Delete Template"
              variant="ghost"
              onPress={confirmDelete}
              icon={<Trash2 size={16} color={palette.indigo} />}
            />
          ) : null}
        </>
      }>
      <TextField label="Template name" value={name} onChangeText={setName} placeholder="Fee Reminder" />
      <TextField
        label="Message"
        value={body}
        onChangeText={setBody}
        onSelectionChange={(event) => setSelection(event.nativeEvent.selection)}
        placeholder="Dear {{name}}, your outstanding balance is {{currency balance}}."
        multiline
      />

      <SectionTitle title="Available variables" caption="Tap to insert at cursor" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {tokenOptions.map((token) => (
          <Pressable
            key={token}
            onPress={() => insertVariable(token)}
            accessibilityRole="button"
            accessibilityLabel={`Insert ${token}`}
            style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
            <Text style={styles.chipText}>{token}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <SectionTitle title="Live preview" caption={sample.name ? `Using ${sample.name}` : 'Using sample data'} />
      <Card>
        <Text style={styles.previewText}>{preview || 'Your message preview will appear here.'}</Text>
        <Text style={styles.previewMeta}>
          {length.characters} characters · {length.parts} SMS · {length.encoding}
        </Text>
      </Card>

      <Card style={styles.helpCard}>
        <Text style={styles.helpTitle}>Formatting helpers</Text>
        <Text style={styles.helpText}>{'{{name}} plain field · {{currency balance}} formats ₦ · {{uppercase name}} · {{date}} / {{date+7}}'}</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    backgroundColor: palette.indigoSoft,
    borderWidth: 1,
    borderColor: palette.border,
  },
  chipText: {
    fontSize: FontSize.small,
    fontWeight: '600',
    color: palette.indigoDark,
  },
  pressed: {
    opacity: 0.7,
  },
  previewText: {
    fontSize: FontSize.body,
    color: palette.text,
    lineHeight: 22,
  },
  previewMeta: {
    marginTop: Spacing.two,
    fontSize: FontSize.caption,
    color: palette.textSecondary,
    fontWeight: '600',
  },
  helpCard: {
    backgroundColor: palette.background,
    borderColor: palette.border,
  },
  helpTitle: {
    fontSize: FontSize.small,
    fontWeight: '700',
    color: palette.text,
  },
  helpText: {
    marginTop: Spacing.one,
    fontSize: FontSize.caption,
    color: palette.textSecondary,
    lineHeight: 18,
  },
});
