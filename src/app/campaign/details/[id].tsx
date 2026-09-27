import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { FontSize, Spacing, palette } from '@/constants/theme';
import { getCampaign } from '@/db/database';
import type { Campaign } from '@/types';
import { formatDateTime, formatTime } from '@/utils/format';
import { prettyPhone } from '@/utils/phone';

export default function CampaignDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!id) {
      setLoading(false);
      return;
    }
    getCampaign(id)
      .then((result) => {
        if (active) setCampaign(result);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <Screen title="Campaign" showBack>
        <ActivityIndicator color={palette.indigo} style={styles.loader} />
      </Screen>
    );
  }

  if (!campaign) {
    return (
      <Screen title="Campaign" showBack>
        <Text style={styles.empty}>Campaign not found.</Text>
      </Screen>
    );
  }

  const failed = campaign.messages.filter((message) => message.status === 'failed');
  const sent = campaign.messages.filter((message) => message.status === 'sent');

  return (
    <Screen title={campaign.name} showBack subtitle={formatDateTime(campaign.createdAt)}>
      <Card>
        <View style={styles.headerRow}>
          <Chip label={campaign.status} tone={campaign.failedCount ? 'error' : 'success'} />
          <Text style={styles.total}>{campaign.recipientCount} messages</Text>
        </View>
        <View style={styles.summary}>
          <Row label="Sent" value={String(campaign.sentCount)} />
          <Row label="Failed" value={String(campaign.failedCount)} />
          <Row label="Template" value={campaign.templateName || '—'} />
          <Row label="SIM" value={campaign.simLabel || 'Android default'} />
          <Row label="Started" value={formatTime(campaign.createdAt)} />
          <Row label="Completed" value={formatTime(campaign.completedAt)} />
        </View>
      </Card>

      {failed.length > 0 ? (
        <>
          <SectionTitle title="Failed messages" caption={`${failed.length} could not be sent`} />
          <View style={styles.list}>
            {failed.map((message) => (
              <Card key={message.recipientId} style={styles.messageCard}>
                <Text style={styles.messageName}>{message.name || message.remoteId}</Text>
                <Text style={styles.messagePhone}>{prettyPhone(message.phone)}</Text>
                <Text style={styles.messageReason}>{message.error ?? 'SMS service unavailable'}</Text>
              </Card>
            ))}
          </View>
        </>
      ) : null}

      <SectionTitle title="Sent messages" caption={`${sent.length} delivered to the SMS service`} />
      <View style={styles.list}>
        {sent.map((message) => (
          <Card key={message.recipientId} style={styles.messageCard}>
            <Text style={styles.messageName}>{message.name || message.remoteId}</Text>
            <Text style={styles.messagePhone}>{prettyPhone(message.phone)}</Text>
            <Text style={styles.messageBody} numberOfLines={3}>
              {message.message}
            </Text>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: Spacing.six,
  },
  empty: {
    fontSize: FontSize.body,
    color: palette.textSecondary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  total: {
    fontSize: FontSize.small,
    color: palette.textSecondary,
  },
  summary: {
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowLabel: {
    fontSize: FontSize.body,
    color: palette.textSecondary,
  },
  rowValue: {
    fontSize: FontSize.body,
    fontWeight: '700',
    color: palette.text,
  },
  list: {
    gap: Spacing.two,
  },
  messageCard: {
    gap: 2,
  },
  messageName: {
    fontSize: FontSize.body,
    fontWeight: '700',
    color: palette.text,
  },
  messagePhone: {
    fontSize: FontSize.small,
    color: palette.textSecondary,
  },
  messageReason: {
    fontSize: FontSize.caption,
    color: palette.error,
    marginTop: Spacing.one,
  },
  messageBody: {
    fontSize: FontSize.small,
    color: palette.text,
    marginTop: Spacing.one,
    lineHeight: 19,
  },
});
