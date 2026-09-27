import { useRouter } from 'expo-router';
import { AlertTriangle, CheckCircle2, Send } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { TextField } from '@/components/TextField';
import { WizardSteps } from '@/components/WizardSteps';
import { FontSize, Spacing, palette } from '@/constants/theme';
import { summarizeIssues, validateCampaign } from '@/services/validationService';
import { useAppStore } from '@/store/appStore';
import { useCampaignStore } from '@/store/campaignStore';
import { useDataStore } from '@/store/dataStore';
import { renderTemplate } from '@/utils/template';
import { estimateSmsLength } from '@/utils/smsLength';

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

export default function CampaignReviewScreen() {
  const router = useRouter();
  const template = useCampaignStore((state) => state.template);
  const simLabel = useCampaignStore((state) => state.simLabel);
  const simCarrier = useCampaignStore((state) => state.simCarrier);
  const simSubscriptionId = useCampaignStore((state) => state.simSubscriptionId);
  const buildMessages = useCampaignStore((state) => state.buildMessages);
  const recipients = useDataStore((state) => state.recipients);
  const selectedIds = useDataStore((state) => state.selectedIds);
  const confirmBeforeSend = useAppStore((state) => state.settings.confirmBeforeSend);
  const [confirmText, setConfirmText] = useState('');

  const selected = useMemo(
    () => recipients.filter((recipient) => selectedIds.has(recipient.id)),
    [recipients, selectedIds]
  );

  const report = useMemo(
    () => validateCampaign(selected, template?.body ?? ''),
    [selected, template]
  );

  const validRecipients = useMemo(
    () => selected.filter((recipient) => !report.invalidIds.includes(recipient.id)),
    [selected, report]
  );

  const totalParts = useMemo(() => {
    if (!template) return 0;
    return validRecipients.reduce(
      (sum, recipient) =>
        sum + estimateSmsLength(renderTemplate(template.body, recipient.payload).text).parts,
      0
    );
  }, [validRecipients, template]);

  const issues = summarizeIssues(report);
  const requiresTyping = confirmBeforeSend && validRecipients.length > 20;
  const canSend =
    report.canSend &&
    validRecipients.length > 0 &&
    (!requiresTyping || confirmText.trim().toUpperCase() === 'SEND');

  const onSend = () => {
    if (!template) {
      Alert.alert('No template', 'Choose a message template first.');
      return;
    }
    buildMessages(validRecipients);
    router.push('/campaign/sending');
  };

  return (
    <Screen
      title="Review Campaign"
      showBack
      subtitle="Step 4 of 4"
      footer={
        <>
          <Button label="Cancel" variant="secondary" fullWidth onPress={() => router.back()} />
          <Button
            label={`Send ${validRecipients.length} Message${validRecipients.length === 1 ? '' : 's'}`}
            fullWidth
            disabled={!canSend}
            onPress={onSend}
            icon={<Send size={17} color={palette.white} />}
          />
        </>
      }>
      <WizardSteps current={3} />

      <Card>
        <SectionTitle title="Ready to send" caption="Review the details before sending" />
        <View style={styles.summary}>
          <SummaryRow label="Recipients" value={String(validRecipients.length)} />
          <SummaryRow label="Template" value={template?.name ?? '—'} />
          <SummaryRow
            label="SIM"
            value={
              simSubscriptionId === 0
                ? 'Ask Android each time'
                : `${simLabel}${simCarrier ? ` — ${simCarrier}` : ''}`
            }
          />
          <SummaryRow label="Messages" value={String(validRecipients.length)} />
          <SummaryRow label="Estimated SMS parts" value={String(totalParts)} />
        </View>
      </Card>

      {report.issues.length > 0 ? (
        <Card style={styles.warningCard}>
          <View style={styles.warningHeader}>
            <AlertTriangle size={16} color={palette.warning} />
            <Text style={styles.warningTitle}>Validation</Text>
          </View>
          {issues.map((issue) => (
            <Text key={issue} style={styles.warningText}>
              • {issue}
            </Text>
          ))}
          {validRecipients.length < selected.length ? (
            <Text style={styles.warningText}>
              {selected.length - validRecipients.length} recipient
              {selected.length - validRecipients.length === 1 ? '' : 's'} will be skipped.
            </Text>
          ) : null}
        </Card>
      ) : (
        <Card style={styles.successCard}>
          <View style={styles.warningHeader}>
            <CheckCircle2 size={16} color={palette.success} />
            <Text style={styles.successTitle}>Everything looks ready.</Text>
          </View>
          <Text style={styles.warningText}>All selected recipients passed validation.</Text>
        </Card>
      )}

      {requiresTyping ? (
        <Card>
          <TextField
            label="Type SEND to confirm"
            value={confirmText}
            onChangeText={setConfirmText}
            autoCapitalize="characters"
            placeholder="SEND"
          />
          <Text style={styles.warningText}>
            This batch has more than 20 recipients and requires explicit confirmation.
          </Text>
        </Card>
      ) : null}

      <Chip
        label={`${validRecipients.length} recipient${validRecipients.length === 1 ? '' : 's'} · ${totalParts} SMS part${totalParts === 1 ? '' : 's'}`}
        tone="indigo"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
  },
  summaryLabel: {
    fontSize: FontSize.body,
    color: palette.textSecondary,
  },
  summaryValue: {
    fontSize: FontSize.body,
    fontWeight: '700',
    color: palette.text,
    flexShrink: 1,
    textAlign: 'right',
  },
  warningCard: {
    backgroundColor: palette.warningSoft,
    borderColor: '#FDE68A',
    gap: Spacing.one,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  warningTitle: {
    fontSize: FontSize.body,
    fontWeight: '700',
    color: '#B45309',
  },
  warningText: {
    fontSize: FontSize.small,
    color: '#92400E',
    lineHeight: 20,
  },
  successCard: {
    backgroundColor: palette.successSoft,
    borderColor: '#BBF7D0',
    gap: Spacing.one,
  },
  successTitle: {
    fontSize: FontSize.body,
    fontWeight: '700',
    color: '#15803D',
  },
});
