import { useRouter } from 'expo-router';
import { CheckCircle2, Send, Square, XCircle } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { Stat } from '@/components/Stat';
import { FontSize, Spacing, palette } from '@/constants/theme';
import { useCampaignStore } from '@/store/campaignStore';

export default function SendingScreen() {
  const router = useRouter();
  const status = useCampaignStore((state) => state.status);
  const messages = useCampaignStore((state) => state.messages);
  const currentIndex = useCampaignStore((state) => state.currentIndex);
  const simLabel = useCampaignStore((state) => state.simLabel);
  const stats = useCampaignStore((state) => state.stats);
  const start = useCampaignStore((state) => state.start);
  const stop = useCampaignStore((state) => state.stop);
  const started = useRef(false);

  const current = messages[currentIndex];
  const summary = stats();

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      start();
    }
  }, [start]);

  useEffect(() => {
    if (status === 'completed' || status === 'cancelled') {
      router.replace('/campaign/result');
    }
  }, [status, router]);

  return (
    <Screen
      title="Sending…"
      subtitle="Do not close the app"
      footer={
        <Button
          label="Stop"
          variant="danger"
          fullWidth
          disabled={!summary.pending && status !== 'sending'}
          icon={<Square size={15} color={palette.white} />}
          onPress={stop}
        />
      }>
      <Card>
        <View style={styles.progressHeader}>
          <Text style={styles.percent}>{summary.progress}%</Text>
          <Text style={styles.fraction}>
            {summary.sent + summary.failed} / {summary.total}
          </Text>
        </View>
        <ProgressBar progress={summary.progress} height={10} />
      </Card>

      <Card>
        <View style={styles.statsRow}>
          <Stat label="Sent" value={summary.sent} tone="success" />
          <Stat label="Failed" value={summary.failed} tone={summary.failed ? 'error' : 'default'} />
          <Stat label="Pending" value={summary.pending} />
        </View>
      </Card>

      <Card>
        <Text style={styles.currentLabel}>Current recipient</Text>
        <Text style={styles.currentName}>{current?.name || current?.remoteId || '—'}</Text>
        <Text style={styles.currentPhone}>{current?.phone || ''}</Text>
        <View style={styles.statusRow}>
          {current?.status === 'sent' ? (
            <>
              <CheckCircle2 size={16} color={palette.success} />
              <Text style={styles.statusText}>Sent</Text>
            </>
          ) : current?.status === 'failed' ? (
            <>
              <XCircle size={16} color={palette.error} />
              <Text style={styles.statusText}>{current.error ?? 'Failed'}</Text>
            </>
          ) : (
            <>
              <Send size={16} color={palette.cyan} />
              <Text style={styles.statusText}>Sending via {simLabel || 'selected SIM'}</Text>
            </>
          )}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.two,
  },
  percent: {
    fontSize: 40,
    fontWeight: '800',
    color: palette.indigo,
  },
  fraction: {
    fontSize: FontSize.body,
    fontWeight: '700',
    color: palette.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  currentLabel: {
    fontSize: FontSize.caption,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: palette.textSecondary,
  },
  currentName: {
    fontSize: FontSize.section,
    fontWeight: '700',
    color: palette.text,
    marginTop: Spacing.one,
  },
  currentPhone: {
    fontSize: FontSize.small,
    color: palette.textSecondary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  statusText: {
    fontSize: FontSize.small,
    color: palette.text,
    flex: 1,
  },
});
