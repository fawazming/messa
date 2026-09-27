import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { TemplateCard } from '@/components/TemplateCard';
import { TextField } from '@/components/TextField';
import { WizardSteps } from '@/components/WizardSteps';
import { FontSize, Spacing, palette } from '@/constants/theme';
import { useCampaignStore } from '@/store/campaignStore';
import { useDataStore } from '@/store/dataStore';
import { useTemplatesStore } from '@/store/templatesStore';
import { renderTemplate } from '@/utils/template';
import { estimateSmsLength } from '@/utils/smsLength';

export default function CampaignTemplateScreen() {
  const router = useRouter();
  const templates = useTemplatesStore((state) => state.templates);
  const selectedTemplate = useCampaignStore((state) => state.template);
  const setTemplate = useCampaignStore((state) => state.setTemplate);
  const recipients = useDataStore((state) => state.recipients);
  const selectedIds = useDataStore((state) => state.selectedIds);
  const [customBody, setCustomBody] = useState(
    selectedTemplate?.id === 'custom' ? selectedTemplate.body : ''
  );

  const sample = useMemo(() => {
    const recipient = recipients.find((item) => selectedIds.has(item.id));
    return recipient?.payload ?? { name: 'Aisha Yusuf', balance: '25000', school: 'ABC College' };
  }, [recipients, selectedIds]);

  const preview = useMemo(
    () => (selectedTemplate ? renderTemplate(selectedTemplate.body, sample).text : ''),
    [selectedTemplate, sample]
  );
  const length = estimateSmsLength(preview);

  const chooseCustom = (value: string) => {
    setCustomBody(value);
    setTemplate({
      id: 'custom',
      name: 'Custom Message',
      body: value,
      builtIn: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  return (
    <Screen
      title="Choose Message"
      showBack
      subtitle="Step 2 of 4"
      footer={
        <Button
          label="Continue"
          fullWidth
          disabled={!selectedTemplate || !selectedTemplate.body.trim()}
          onPress={() => router.push('/campaign/sim')}
        />
      }>
      <WizardSteps current={1} />

      <SectionTitle title="Templates" caption={`${templates.length} saved`} />
      <View style={styles.list}>
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            selected={selectedTemplate?.id === template.id}
            onPress={() => setTemplate(template)}
          />
        ))}
      </View>

      <SectionTitle title="Custom Message" caption="Write a one-off message with variables" />
      <TextField
        value={customBody}
        onChangeText={chooseCustom}
        placeholder="Dear {{name}}, …"
        multiline
      />

      {selectedTemplate ? (
        <Card>
          <Text style={styles.previewLabel}>Preview</Text>
          <Text style={styles.previewText}>{preview}</Text>
          <Text style={styles.previewMeta}>
            {length.characters} characters · {length.parts} SMS
          </Text>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.two,
  },
  previewLabel: {
    fontSize: FontSize.caption,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: palette.textSecondary,
    textTransform: 'uppercase',
  },
  previewText: {
    marginTop: Spacing.one,
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
});
