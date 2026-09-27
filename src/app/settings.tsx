import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { useFocusEffect } from 'expo-router';
import { Check, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { SelectField, type SelectOption } from '@/components/SelectField';
import { TextField } from '@/components/TextField';
import { FontSize, Radius, Spacing, palette } from '@/constants/theme';
import { getSubscriptions } from '@/services/smsService';
import { fetchSheetJson, discoverFields, inferFieldMap } from '@/services/sheetService';
import { useAppStore } from '@/store/appStore';
import { useDataStore } from '@/store/dataStore';
import type { SimSubscription } from '@/types';

type TestResult =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; records: number; fields: string[] }
  | { status: 'error'; message: string };

export default function SettingsScreen() {
  const dataSource = useAppStore((state) => state.dataSource);
  const fieldMap = useAppStore((state) => state.fieldMap);
  const settings = useAppStore((state) => state.settings);
  const smsPermission = useAppStore((state) => state.smsPermission);
  const setDataSource = useAppStore((state) => state.setDataSource);
  const setFieldMap = useAppStore((state) => state.setFieldMap);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const requestPermission = useAppStore((state) => state.requestPermission);
  const clearCache = useAppStore((state) => state.clearCache);
  const fields = useDataStore((state) => state.fields);

  const [endpoint, setEndpoint] = useState(dataSource.endpoint);
  const [datasetName, setDatasetName] = useState(dataSource.datasetName);
  const [test, setTest] = useState<TestResult>({ status: 'idle' });
  const [subscriptions, setSubscriptions] = useState<SimSubscription[]>([]);
  const [saving, setSaving] = useState(false);

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

  const fieldOptions: SelectOption[] = [
    { label: 'None', value: '' },
    ...fields.map((field) => ({ label: field, value: field })),
  ];

  const simOptions: SelectOption[] = [
    { label: 'Ask Android each time', value: '0' },
    ...subscriptions.map((subscription) => ({
      label: `${subscription.displayName}${subscription.carrierName ? ` — ${subscription.carrierName}` : ''}`,
      value: String(subscription.subscriptionId),
    })),
  ];

  const runTest = async () => {
    setTest({ status: 'loading' });
    try {
      const records = await fetchSheetJson(endpoint.trim());
      const detected = discoverFields(records);
      setTest({ status: 'ok', records: records.length, fields: detected });
      if (!fieldMap.phone) {
        const inferred = inferFieldMap(detected);
        setFieldMap(inferred);
      }
    } catch (error) {
      setTest({
        status: 'error',
        message: error instanceof Error ? error.message : 'Connection failed.',
      });
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await setDataSource({
        ...dataSource,
        endpoint: endpoint.trim(),
        datasetName: datasetName.trim() || 'Recipients',
      });
      Alert.alert('Saved', 'Data source settings updated.');
    } finally {
      setSaving(false);
    }
  };

  const onClearCache = () => {
    Alert.alert('Clear cache', 'Remove cached recipients and campaign history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearCache();
          useDataStore.setState({
            meta: null,
            recipients: [],
            fields: [],
            selectedIds: new Set<string>(),
            error: null,
            offline: false,
          });
          Alert.alert('Cache cleared', 'Local recipient data and history were removed.');
        },
      },
    ]);
  };

  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen title="Settings" showBack subtitle="Data, SMS and storage">
      <SectionTitle title="Data Source" />
      <Card style={styles.card}>
        <TextField
          label="JSON endpoint"
          value={endpoint}
          onChangeText={setEndpoint}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder="https://sheet.spacet.me/…/Recipients.json"
        />
        <TextField
          label="Dataset name"
          value={datasetName}
          onChangeText={setDatasetName}
          placeholder="Recipients"
        />
        <View style={styles.row}>
          <Button
            label="Test Connection"
            variant="secondary"
            size="sm"
            loading={test.status === 'loading'}
            onPress={runTest}
            icon={<RefreshCw size={15} color={palette.text} />}
          />
          <Button label="Save" size="sm" onPress={save} loading={saving} />
        </View>

        {test.status === 'ok' ? (
          <View style={styles.testResult}>
            <Chip label={`${test.records} records found`} tone="success" icon={<Check size={12} color="#15803D" />} />
            <Text style={styles.testText}>{test.fields.length} fields detected</Text>
            <Text style={styles.testFields}>{test.fields.join(', ')}</Text>
          </View>
        ) : null}
        {test.status === 'error' ? (
          <Text style={styles.testError}>{test.message}</Text>
        ) : null}
      </Card>

      <SectionTitle title="Field Mapping" caption="Map detected JSON fields to recipient attributes" />
      <Card style={styles.card}>
        <SelectField
          label="Phone field"
          value={fieldMap.phone}
          options={fieldOptions}
          onChange={(value) => setFieldMap({ ...fieldMap, phone: value })}
          disabled={fields.length === 0}
        />
        <SelectField
          label="Name field"
          value={fieldMap.name}
          options={fieldOptions}
          onChange={(value) => setFieldMap({ ...fieldMap, name: value })}
          disabled={fields.length === 0}
        />
        <SelectField
          label="ID field"
          value={fieldMap.id}
          options={fieldOptions}
          onChange={(value) => setFieldMap({ ...fieldMap, id: value })}
          disabled={fields.length === 0}
        />
      </Card>

      <SectionTitle title="SMS" />
      <Card style={styles.card}>
        <SelectField
          label="Default SIM"
          value={String(settings.defaultSimSubscriptionId ?? 0)}
          options={simOptions}
          onChange={(value) =>
            updateSettings({ defaultSimSubscriptionId: value === '0' ? null : Number(value) })
          }
        />
        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text style={styles.switchLabel}>Confirm before sending</Text>
            <Text style={styles.switchHint}>Require an explicit confirmation for every campaign.</Text>
          </View>
          <Switch
            value={settings.confirmBeforeSend}
            onValueChange={(value) => updateSettings({ confirmBeforeSend: value })}
            trackColor={{ true: palette.indigo, false: palette.borderStrong }}
          />
        </View>
        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text style={styles.switchLabel}>Notify when complete</Text>
            <Text style={styles.switchHint}>Show a summary alert when a campaign finishes.</Text>
          </View>
          <Switch
            value={settings.notifyOnComplete}
            onValueChange={(value) => updateSettings({ notifyOnComplete: value })}
            trackColor={{ true: palette.indigo, false: palette.borderStrong }}
          />
        </View>
        <View style={styles.permissionRow}>
          <Chip
            label={smsPermission === 'granted' ? 'SMS access granted' : 'SMS access required'}
            tone={smsPermission === 'granted' ? 'success' : 'warning'}
            icon={<ShieldCheck size={12} color={smsPermission === 'granted' ? '#15803D' : '#B45309'} />}
          />
          {smsPermission !== 'granted' ? (
            <Button label="Allow SMS access" size="sm" onPress={() => requestPermission()} />
          ) : null}
        </View>
      </Card>

      <SectionTitle title="Storage" />
      <Card style={styles.card}>
        <Text style={styles.switchHint}>
          MESSA caches the latest successful dataset and campaign history on this device.
        </Text>
        <Button
          label="Clear cache & history"
          variant="danger"
          size="sm"
          icon={<Trash2 size={15} color={palette.white} />}
          onPress={onClearCache}
        />
      </Card>

      <SectionTitle title="About" />
      <Card style={styles.card}>
        <View style={styles.aboutRow}>
          <Text style={styles.switchLabel}>MESSA</Text>
          <Text style={styles.switchHint}>Version {version}</Text>
        </View>
        <Text style={styles.switchHint}>Turn Data Into Messages.</Text>
        <View style={styles.links}>
          <Pressable onPress={() => Linking.openURL('https://docs.expo.dev')} accessibilityRole="link">
            <Text style={styles.link}>Privacy</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL('https://docs.expo.dev')} accessibilityRole="link">
            <Text style={styles.link}>Terms</Text>
          </Pressable>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  testResult: {
    gap: Spacing.one,
  },
  testText: {
    fontSize: FontSize.small,
    color: palette.text,
    fontWeight: '600',
  },
  testFields: {
    fontSize: FontSize.caption,
    color: palette.textSecondary,
  },
  testError: {
    fontSize: FontSize.small,
    color: palette.error,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  switchText: {
    flex: 1,
    gap: 1,
  },
  switchLabel: {
    fontSize: FontSize.body,
    fontWeight: '600',
    color: palette.text,
  },
  switchHint: {
    fontSize: FontSize.caption,
    color: palette.textSecondary,
    lineHeight: 18,
  },
  permissionRow: {
    gap: Spacing.two,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  links: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
  link: {
    fontSize: FontSize.body,
    fontWeight: '600',
    color: palette.indigo,
  },
});
