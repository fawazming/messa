import { useFocusEffect, useRouter } from 'expo-router';
import {
  AlertTriangle,
  ArrowRight,
  CardSim,
  Database,
  RefreshCw,
  Send,
  Settings,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { MessaMark } from '@/components/Logo';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { Stat } from '@/components/Stat';
import { FontSize, Radius, Spacing, palette } from '@/constants/theme';
import { useCampaigns } from '@/hooks/useCampaigns';
import { getSubscriptions } from '@/services/smsService';
import { useAppStore } from '@/store/appStore';
import { useCloudStore } from '@/store/cloudStore';
import { useDataStore } from '@/store/dataStore';
import { useTemplatesStore } from '@/store/templatesStore';
import type { SimSubscription } from '@/types';
import { greeting, timeAgo } from '@/utils/format';
import { maskPhone } from '@/utils/phone';

function startOfToday(): number {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export default function HomeScreen() {
  const router = useRouter();
  const meta = useDataStore((state) => state.meta);
  const recipientCount = useDataStore((state) => state.recipients.length);
  const selectedCount = useDataStore((state) => state.selectedIds.size);
  const syncing = useDataStore((state) => state.syncing);
  const offline = useDataStore((state) => state.offline);
  const error = useDataStore((state) => state.error);
  const sync = useDataStore((state) => state.sync);
  const templateCount = useTemplatesStore((state) => state.templates.length);
  const settings = useAppStore((state) => state.settings);
  const dataSource = useAppStore((state) => state.dataSource);
  const cloudTables = useCloudStore((state) => state.tables);
  const activeCloudId = useCloudStore((state) => state.activeTableId);
  const { campaigns } = useCampaigns();
  const [subscriptions, setSubscriptions] = useState<SimSubscription[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getSubscriptions().then((result) => {
        if (active) setSubscriptions(result);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  const today = startOfToday();
  const todaysCampaigns = campaigns.filter((campaign) => campaign.createdAt >= today);
  const sentToday = todaysCampaigns.reduce((sum, campaign) => sum + campaign.sentCount, 0);
  const failedToday = todaysCampaigns.reduce((sum, campaign) => sum + campaign.failedCount, 0);

  const activeSim =
    subscriptions.find((sub) => sub.subscriptionId === settings.defaultSimSubscriptionId) ??
    subscriptions[0] ??
    null;

  const connected = recipientCount > 0 && !error;

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>{greeting()}</Text>
          <View style={styles.brandRow}>
            <MessaMark size={30} />
            <Text style={styles.brand}>MESSA</Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          hitSlop={8}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Settings size={22} color={palette.text} />
        </Pressable>
      </View>

      {error ? (
        <Card style={styles.alertCard}>
          <View style={styles.alertRow}>
            <AlertTriangle size={18} color={palette.warning} />
            <Text style={styles.alertTitle}>
              {error.kind === 'network' ? 'Offline' : 'Data problem'}
            </Text>
          </View>
          <Text style={styles.alertMessage}>{error.message}</Text>
          <Button
            label="Try again"
            variant="secondary"
            size="sm"
            onPress={() => sync()}
            icon={<RefreshCw size={16} color={palette.text} />}
          />
        </Card>
      ) : null}

      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>DATA SOURCE</Text>
          <Chip
            label={connected ? 'Connected' : 'No data'}
            tone={connected ? 'success' : 'warning'}
          />
        </View>
        <Text style={styles.cardTitle}>{meta?.name ?? dataSource.datasetName}</Text>
        <Text style={styles.cardMeta}>
          {recipientCount > 0 ? `${recipientCount.toLocaleString()} records` : 'No records loaded'}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardMeta}>
            {meta ? `Last synced ${timeAgo(meta.lastSyncedAt)}` : 'Never synced'}
            {offline ? ' · offline cache' : ''}
          </Text>
          <Pressable
            onPress={() => sync()}
            disabled={syncing}
            accessibilityRole="button"
            accessibilityLabel="Refresh recipient data"
            style={({ pressed }) => [styles.refresh, pressed && styles.pressed]}>
            <RefreshCw size={15} color={palette.indigo} />
            <Text style={styles.refreshLabel}>{syncing ? 'Refreshing…' : 'Refresh'}</Text>
          </Pressable>
        </View>
      </Card>

      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>SENDING SIM</Text>
          <Chip label={activeSim?.displayName ?? 'Not set'} tone="cyan" icon={<CardSim size={12} color="#0E7490" />} />
        </View>
        <Text style={styles.cardTitle}>
          {activeSim ? activeSim.carrierName ?? activeSim.displayName : 'No SIM selected'}
        </Text>
        {activeSim?.phoneNumber ? (
          <Text style={styles.cardMeta}>{maskPhone(activeSim.phoneNumber)}</Text>
        ) : (
          <Text style={styles.cardMeta}>Carrier SIM selection</Text>
        )}
        <Pressable
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.inlineLink, pressed && styles.pressed]}>
          <Text style={styles.inlineLinkLabel}>Change SIM</Text>
          <ArrowRight size={15} color={palette.indigo} />
        </Pressable>
      </Card>

      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>CLOUD</Text>
          <Chip label={`${cloudTables.length} table${cloudTables.length === 1 ? '' : 's'}`} tone="indigo" />
        </View>
        <Text style={styles.cardTitle}>
          {cloudTables.find((table) => table.id === activeCloudId)?.name ?? 'No active cloud table'}
        </Text>
        <Text style={styles.cardMeta}>
          Sync recipients from up to 10 tables of 512 rows per account.
        </Text>
        <Pressable
          onPress={() => router.push('/tables')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.inlineLink, pressed && styles.pressed]}>
          <Text style={styles.inlineLinkLabel}>Manage cloud tables</Text>
          <ArrowRight size={15} color={palette.indigo} />
        </Pressable>
      </Card>

      <Button
        label={selectedCount > 0 ? `Continue (${selectedCount} selected)` : 'Start New Message'}
        onPress={() => router.push('/campaign/recipients')}
        icon={<Send size={18} color={palette.white} />}
        fullWidth
      />

      <Card>
        <SectionTitle title="Today" caption={`${templateCount} template${templateCount === 1 ? '' : 's'} available`} />
        <View style={styles.statsRow}>
          <Stat label="Sent" value={sentToday} tone="success" />
          <Stat label="Failed" value={failedToday} tone={failedToday > 0 ? 'error' : 'default'} />
          <Stat label="Selected" value={selectedCount} />
        </View>
      </Card>

      {recipientCount === 0 && !syncing ? (
        <Card style={styles.placeholder}>
          <Database size={20} color={palette.indigo} />
          <View style={styles.placeholderText}>
            <Text style={styles.placeholderTitle}>No recipient data yet</Text>
            <Text style={styles.cardMeta}>
              Connect a Google Sheet JSON endpoint in Settings, then refresh.
            </Text>
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  headerText: {
    gap: Spacing.one,
  },
  greeting: {
    fontSize: FontSize.body,
    color: palette.textSecondary,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  brand: {
    fontSize: FontSize.display,
    fontWeight: '800',
    letterSpacing: 3,
    color: palette.text,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: FontSize.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: palette.textSecondary,
  },
  cardTitle: {
    fontSize: FontSize.lead,
    fontWeight: '700',
    color: palette.text,
    marginTop: Spacing.one,
  },
  cardMeta: {
    fontSize: FontSize.small,
    color: palette.textSecondary,
  },
  cardFooter: {
    marginTop: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  refresh: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  refreshLabel: {
    fontSize: FontSize.small,
    fontWeight: '700',
    color: palette.indigo,
  },
  inlineLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  inlineLinkLabel: {
    fontSize: FontSize.small,
    fontWeight: '700',
    color: palette.indigo,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: Spacing.three,
    gap: Spacing.three,
  },
  alertCard: {
    backgroundColor: palette.warningSoft,
    borderColor: '#FDE68A',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  alertTitle: {
    fontSize: FontSize.lead,
    fontWeight: '700',
    color: '#B45309',
  },
  alertMessage: {
    fontSize: FontSize.small,
    color: '#92400E',
    marginTop: Spacing.one,
    marginBottom: Spacing.two,
  },
  placeholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  placeholderText: {
    flex: 1,
    gap: 2,
  },
  placeholderTitle: {
    fontSize: FontSize.lead,
    fontWeight: '700',
    color: palette.text,
  },
});
