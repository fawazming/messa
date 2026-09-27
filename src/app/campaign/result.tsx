import { useRouter } from 'expo-router';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { Stat } from '@/components/Stat';
import { FontSize, Spacing, palette } from '@/constants/theme';
import { useCampaignStore } from '@/store/campaignStore';
import { prettyPhone } from '@/utils/phone';

export default function ResultScreen() {
  const router = useRouter();
  const messages = useCampaignStore((state) => state.messages);
  const status = useCampaignStore((state) => state.status);
  const stats = useCampaignStore((state) => state.stats);
  const retryFailed = useCampaignStore((state) => state.retryFailed);
  const reset = useCampaignStore((state) => state.reset);
  const [showFailed, setShowFailed] = useState(false);

  const summary = stats();
  const failed = messages.filter((message) => message.status === 'failed');
  const cancelledCount = messages.filter((message) => message.status === 'pending').length;

  useEffect(() => {
    setShowFailed(failed.length > 0 && failed.length <= 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const done = () => {
    reset();
    router.replace('/(tabs)');
  };

  return (
    <Screen
      scroll
      title="Message Complete"
      footer={
        <>
          <Button label="Done" fullWidth onPress={done} />
          {failed.length > 0 ? (
            <Button
              label="Retry Failed"
              variant="secondary"
              fullWidth
              icon={<RotateCcw size={16} color={palette.text} />}
              onPress={async () => {
                await retryFailed();
                router.replace('/campaign/sending');
              }}
            />
          ) : null}
        </>
      }>
      <Card style={styles.hero}>
        <View style={styles.heroIcon}>
          {failed.length > 0 ? (
            <XCircle size={30} color={palette.warning} />
          ) : (
            <CheckCircle2 size={30} color={palette.success} />
          )}
        </View>
        <Text style={styles.heroTitle}>
          {status === 'cancelled'
            ? 'Campaign stopped'
            : failed.length > 0
              ? 'Campaign finished with errors'
              : 'All messages sent'}
        </Text>
        <Text style={styles.heroSubtitle}>
          {summary.sent} sent · {summary.failed} failed · {summary.total} total
        </Text>
        <View style={styles.progress}>
          <ProgressBar
            progress={summary.progress}
            color={failed.length > 0 ? palette.warning : palette.success}
          />
        </View>
      </Card>

      <Card>
        <View style={styles.statsRow}>
          <Stat label="Sent" value={summary.sent} tone="success" />
          <Stat label="Failed" value={summary.failed} tone={summary.failed ? 'error' : 'default'} />
          {cancelledCount > 0 ? <Stat label="Skipped" value={cancelledCount} tone="warning" /> : null}
        </View>
      </Card>

      {failed.length > 0 ? (
        <>
          <Button
            label={showFailed ? 'Hide failed messages' : `View ${failed.length} failed`}
            variant="secondary"
            fullWidth
            onPress={() => setShowFailed((value) => !value)}
          />
          {showFailed ? (
            <View style={styles.failedList}>
              {failed.map((message) => (
                <Card key={message.recipientId} style={styles.failedCard}>
                  <Text style={styles.failedName}>
                    {message.name || message.remoteId}
                  </Text>
                  <Text style={styles.failedPhone}>{prettyPhone(message.phone)}</Text>
                  <Text style={styles.failedReason}>
                    Reason: {message.error ?? 'SMS service unavailable'}
                  </Text>
                </Card>
              ))}
            </View>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background,
  },
  heroTitle: {
    fontSize: FontSize.section,
    fontWeight: '800',
    color: palette.text,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: FontSize.body,
    color: palette.textSecondary,
  },
  progress: {
    alignSelf: 'stretch',
    marginTop: Spacing.two,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  failedList: {
    gap: Spacing.two,
  },
  failedCard: {
    gap: 2,
  },
  failedName: {
    fontSize: FontSize.body,
    fontWeight: '700',
    color: palette.text,
  },
  failedPhone: {
    fontSize: FontSize.small,
    color: palette.textSecondary,
  },
  failedReason: {
    fontSize: FontSize.caption,
    color: palette.error,
    marginTop: Spacing.one,
  },
});
