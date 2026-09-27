import { create } from 'zustand';

import {
  clearAllCachedData,
  getAppSettings,
  getSetting,
  saveAppSettings,
  setSetting,
} from '@/db/database';
import { hasSmsPermissions, requestSmsPermissions } from '@/services/smsService';
import type { AppSettings, DataSourceConfig, FieldMap, PermissionState } from '@/types';

export const DEFAULT_ENDPOINT =
  'https://sheet.spacet.me/1SPACET_SHEET_ID/Recipients.json';

const DEFAULT_DATA_SOURCE: DataSourceConfig = {
  endpoint: DEFAULT_ENDPOINT,
  datasetName: 'Recipients',
  refreshIntervalMinutes: 15,
};

const DEFAULT_FIELD_MAP: FieldMap = { id: 'id', name: 'name', phone: 'phone' };

type AppState = {
  hydrated: boolean;
  dataSource: DataSourceConfig;
  fieldMap: FieldMap;
  settings: AppSettings;
  smsPermission: PermissionState;
  hydrate: () => Promise<void>;
  setDataSource: (dataSource: DataSourceConfig) => Promise<void>;
  setFieldMap: (fieldMap: FieldMap) => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  refreshPermission: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
  clearCache: () => Promise<void>;
};

export const useAppStore = create<AppState>((set, get) => ({
  hydrated: false,
  dataSource: DEFAULT_DATA_SOURCE,
  fieldMap: DEFAULT_FIELD_MAP,
  settings: {
    defaultSimSubscriptionId: null,
    defaultTemplateId: null,
    confirmBeforeSend: true,
    notifyOnComplete: true,
  },
  smsPermission: 'unknown',

  hydrate: async () => {
    const [settings, dataSourceRaw, fieldMapRaw] = await Promise.all([
      getAppSettings(),
      getSetting('data_source'),
      getSetting('field_map'),
    ]);

    let dataSource = DEFAULT_DATA_SOURCE;
    if (dataSourceRaw) {
      try {
        dataSource = { ...DEFAULT_DATA_SOURCE, ...JSON.parse(dataSourceRaw) };
      } catch {
        // keep defaults
      }
    }

    let fieldMap = DEFAULT_FIELD_MAP;
    if (fieldMapRaw) {
      try {
        fieldMap = { ...DEFAULT_FIELD_MAP, ...JSON.parse(fieldMapRaw) };
      } catch {
        // keep defaults
      }
    }

    const granted = await hasSmsPermissions();
    set({
      hydrated: true,
      settings,
      dataSource,
      fieldMap,
      smsPermission: granted ? 'granted' : 'unknown',
    });
  },

  setDataSource: async (dataSource) => {
    set({ dataSource });
    await setSetting('data_source', JSON.stringify(dataSource));
  },

  setFieldMap: async (fieldMap) => {
    set({ fieldMap });
    await setSetting('field_map', JSON.stringify(fieldMap));
  },

  updateSettings: async (partial) => {
    const settings = { ...get().settings, ...partial };
    set({ settings });
    await saveAppSettings(settings);
  },

  refreshPermission: async () => {
    const granted = await hasSmsPermissions();
    set({ smsPermission: granted ? 'granted' : 'denied' });
  },

  requestPermission: async () => {
    const granted = await requestSmsPermissions();
    set({ smsPermission: granted ? 'granted' : 'denied' });
    return granted;
  },

  clearCache: async () => {
    await clearAllCachedData();
  },
}));
