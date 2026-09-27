import { useRouter } from 'expo-router';
import { AlertTriangle } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { SimSelector } from '@/components/SimSelector';
import { WizardSteps } from '@/components/WizardSteps';
import { FontSize, Spacing, palette } from '@/constants/theme';
import { NATIVE_SMS_AVAILABLE, getSubscriptions } from '@/services/smsService';
import { useAppStore } from '@/store/appStore';
import { useCampaignStore } from '@/store/campaignStore';
import { useDataStore } from '@/store/dataStore';
import { renderTemplate } from '@/utils/template';
import { estimateSmsLength } from '@/utils/smsLength';
import type { SimSubscription } from '@/types';

export default function CampaignSimScreen() {
  const router = useRouter();
  const template = useCampaignStore((state) => state.template);
  const simSubscriptionId = useCampaignStore((state) => state.simSubscriptionId);
  const setSim = useCampaignStore((state) => state.setSim);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const recipients = useDataStore((state) => state.recipients);
  const selectedIds = useDataStore((state) => state.selectedIds);

  const [subscriptions, setSubscriptions] = useState<SimSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getSubscriptions()
      .then((result) => {
        if (!active) return;
        setSubscriptions(result);
        if (result.length > 0 && simSubscriptionId == null) {
          setSim(result[0]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sample = useMemo(() => {
    const recipient = recipients.find((item) => selectedIds.has(item.id));
    return recipient ?? null;
  }, [recipients, selectedIds]);

  const preview = useMemo(() => {
    if (!template || !sample) return '';
    return renderTemplate(template.body, sample.payload).text;
  }, [template, sample]);
  const length = estimateSmsLength(preview);

  const onContinue = () => {
    if (simSubscriptionId == null) {
      Alert.alert('Select a SIM', 'Choose which SIM should send this campaign.');
      return;
    }
    updateSettings({ defaultSimSubscriptionId: simSubscriptionId || null });
    router.push('/campaign/review');
  };

  return (
    <Screen
      title="Sending SIM"
      showBack
      subtitle="Step 3 of 4"
      footer={
        <Button
          label="Review Campaign"
          fullWidth
          disabled={simSubscriptionId == null}
          onPress={onContinue}
        />
      }>
      <WizardSteps current={2} />

      {!NATIVE_SMS_AVAILABLE ? (
        <Card style={styles.notice}>
          <View style={styles.noticeRow}>
            <AlertTriangle size={16} color={palette.warning} />
            <Text style={styles.noticeTitle}>Demo mode</Text>
          </View>
          <Text style={styles.noticeText}>
            The native SMS module isn’t loaded. Build a development/production Android binary to send
            real messages. Sending will be simulated here.
          </Text>
        </Card>
      ) : null}

      <SectionTitle title="Select sending SIM" caption="Subscription details stay on this device" />
      <SimSelector
        subscriptions={subscriptions}
        selectedId={simSubscriptionId}
        onSelect={setSim}
        loading={loading}
      />

      <SectionTitle title="Preview" caption={sample ? `For ${sample.name || sample.remoteId}` : 'No recipient'} />
      <Card>
        <Text style={styles.previewText}>{preview || 'Select a template to preview.'}</Text>
        {preview ? (
          <Text style={styles.previewMeta}>
            {length.characters} characters · {length.parts} SMS
          </Text>
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: {
    backgroundColor: palette.warningSoft,
    borderColor: '#FDE68A',
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  noticeTitle: {
    fontSize: FontSize.body,
    fontWeight: '700',
    color: '#B45309',
  },
  noticeText: {
    marginTop: Spacing.one,
    fontSize: FontSize.small,
    color: '#92400E',
    lineHeight: 20,
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
});
