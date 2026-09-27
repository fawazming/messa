import { useRouter } from 'expo-router';
import { CheckCircle2, ChevronRight, History, XCircle } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { FontSize, Radius, Spacing, palette } from '@/constants/theme';
import { useCampaigns } from '@/hooks/useCampaigns';
import type { CampaignStatus } from '@/types';
import { formatDateTime } from '@/utils/format';

const STATUS_TONE: Record<CampaignStatus, 'success' | 'warning' | 'error' | 'neutral' | 'indigo'> = {
  draft: 'neutral',
  ready: 'indigo',
  sending: 'warning',
  paused: 'warning',
  completed: 'success',
  cancelled: 'neutral',
  failed: 'error',
};

function statusLabel(status: CampaignStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function HistoryScreen() {
  const router = useRouter();
  const { campaigns, loading } = useCampaigns();

  return (
    <Screen title="History" subtitle={`${campaigns.length} campaign${campaigns.length === 1 ? '' : 's'}`} headerLarge>
      {loading && campaigns.length === 0 ? (
        <ActivityIndicator color={palette.indigo} style={styles.loader} />
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={<History size={26} color={palette.indigo} />}
          title="No campaigns yet"
          message="Your completed SMS campaigns will appear here."
        />
      ) : (
        <View style={styles.list}>
          {campaigns.map((campaign) => (
            <Pressable
              key={campaign.id}
              onPress={() => router.push(`/campaign/details/${campaign.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`${campaign.name}, ${campaign.sentCount} sent, ${campaign.failedCount} failed`}
              style={({ pressed }) => [pressed && styles.pressed]}>
              <Card>
                <View style={styles.row}>
                  <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>
                      {campaign.name}
                    </Text>
                    <Text style={styles.meta}>
                      {campaign.recipientCount} message{campaign.recipientCount === 1 ? '' : 's'}
                    </Text>
                    <View style={styles.resultRow}>
                      <View style={styles.resultItem}>
                        <CheckCircle2 size={13} color={palette.success} />
                        <Text style={styles.resultText}>{campaign.sentCount} sent</Text>
                      </View>
                      {campaign.failedCount > 0 ? (
                        <View style={styles.resultItem}>
                          <XCircle size={13} color={palette.error} />
                          <Text style={styles.resultText}>{campaign.failedCount} failed</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.date}>{formatDateTime(campaign.createdAt)}</Text>
                  </View>
                  <View style={styles.side}>
                    <Chip label={statusLabel(campaign.status)} tone={STATUS_TONE[campaign.status]} />
                    <ChevronRight size={18} color={palette.textSecondary} />
                  </View>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: Spacing.six,
  },
  list: {
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.85,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: FontSize.lead,
    fontWeight: '700',
    color: palette.text,
  },
  meta: {
    fontSize: FontSize.small,
    color: palette.textSecondary,
  },
  resultRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  resultText: {
    fontSize: FontSize.caption,
    color: palette.text,
    fontWeight: '600',
  },
  date: {
    fontSize: FontSize.caption,
    color: palette.textSecondary,
    marginTop: Spacing.one,
  },
  side: {
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  pressedCard: {
    borderRadius: Radius.card,
  },
});
