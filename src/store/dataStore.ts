import { create } from 'zustand';

import { loadDataset, saveDataset } from '@/db/database';
import { SheetError, buildRecipients, fetchSheetJson } from '@/services/sheetService';
import { useAppStore } from '@/store/appStore';
import { createId } from '@/utils/id';
import { normalizePhone } from '@/utils/phone';
import type { DatasetMeta, Recipient } from '@/types';

type DataError = {
  kind: 'network' | 'format' | 'empty' | 'unknown';
  message: string;
};

type DataState = {
  meta: DatasetMeta | null;
  recipients: Recipient[];
  fields: string[];
  invalidPhoneIds: string[];
  query: string;
  selectedIds: Set<string>;
  loading: boolean;
  syncing: boolean;
  offline: boolean;
  error: DataError | null;
  hydrateFromCache: () => Promise<void>;
  sync: (options?: { silent?: boolean }) => Promise<void>;
  setQuery: (query: string) => void;
  toggleSelection: (id: string) => void;
  setSelection: (ids: string[], selected: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  filteredRecipients: () => Recipient[];
  selectedRecipients: () => Recipient[];
  addRecipient: (payload: Record<string, string>) => Promise<Recipient>;
  updateRecipient: (id: string, payload: Record<string, string>) => Promise<void>;
  removeRecipient: (id: string) => Promise<void>;
};

function recipientFromPayload(
  payload: Record<string, string>,
  fieldMap: { id: string; name: string; phone: string },
  index: number
): Recipient {
  const phoneRaw = (fieldMap.phone && payload[fieldMap.phone]) || payload.phone || payload.phone_number || '';
  const name = (fieldMap.name && payload[fieldMap.name]) || payload.name || '';
  const remoteId = (fieldMap.id && payload[fieldMap.id]) || '';
  return {
    id: createId('r'),
    remoteId: remoteId || String(index + 1),
    name,
    phone: normalizePhone(phoneRaw),
    phoneRaw,
    payload,
  };
}

function matchesQuery(recipient: Recipient, query: string): boolean {
  if (!query) return true;
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    recipient.name.toLowerCase().includes(needle) ||
    recipient.phone.toLowerCase().includes(needle) ||
    recipient.phoneRaw.toLowerCase().includes(needle) ||
    recipient.remoteId.toLowerCase().includes(needle)
  );
}

export const useDataStore = create<DataState>((set, get) => ({
  meta: null,
  recipients: [],
  fields: [],
  invalidPhoneIds: [],
  query: '',
  selectedIds: new Set<string>(),
  loading: false,
  syncing: false,
  offline: false,
  error: null,

  hydrateFromCache: async () => {
    set({ loading: true });
    try {
      const cached = await loadDataset();
      if (cached) {
        const invalid = cached.recipients
          .filter((recipient) => !recipient.phone)
          .map((recipient) => recipient.id);
        set({
          meta: cached.meta,
          recipients: cached.recipients,
          fields: cached.meta.fields,
          invalidPhoneIds: invalid,
          loading: false,
        });
        if (cached.meta.fieldMap?.phone) {
          await useAppStore.getState().setFieldMap(cached.meta.fieldMap);
        }
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  sync: async (options) => {
    const { dataSource, fieldMap, setFieldMap } = useAppStore.getState();
    set({ syncing: !options?.silent, error: null });

    try {
      const records = await fetchSheetJson(dataSource.endpoint);
      const result = buildRecipients(records, fieldMap);
      const meta: DatasetMeta = {
        id: 'local-dataset',
        name: dataSource.datasetName || 'Recipients',
        endpoint: dataSource.endpoint,
        fields: result.fields,
        fieldMap: result.fieldMap,
        recordCount: result.recipients.length,
        lastSyncedAt: Date.now(),
      };

      await saveDataset(meta, result.recipients);
      if (result.fieldMap.phone && result.fieldMap !== fieldMap) {
        await setFieldMap(result.fieldMap);
      }

      set((state) => {
        const validIds = new Set(result.recipients.map((recipient) => recipient.id));
        const selected = new Set([...state.selectedIds].filter((id) => validIds.has(id)));
        return {
          meta,
          recipients: result.recipients,
          fields: result.fields,
          invalidPhoneIds: result.invalidPhoneIds,
          selectedIds: selected,
          syncing: false,
          offline: false,
          error: null,
        };
      });
    } catch (error) {
      const sheetError = error instanceof SheetError ? error : null;
      set({
        syncing: false,
        offline: get().recipients.length > 0,
        error: {
          kind: sheetError?.kind ?? 'unknown',
          message: sheetError?.message ?? 'Unable to load recipient data.',
        },
      });
    }
  },

  setQuery: (query) => set({ query }),

  toggleSelection: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),

  setSelection: (ids, selected) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      for (const id of ids) {
        if (selected) next.add(id);
        else next.delete(id);
      }
      return { selectedIds: next };
    }),

  selectAll: () =>
    set({
      selectedIds: new Set(get().filteredRecipients().map((recipient) => recipient.id)),
    }),

  clearSelection: () => set({ selectedIds: new Set<string>() }),

  filteredRecipients: () => {
    const { recipients, query } = get();
    if (!query.trim()) return recipients;
    return recipients.filter((recipient) => matchesQuery(recipient, query));
  },

  selectedRecipients: () => {
    const { recipients, selectedIds } = get();
    return recipients.filter((recipient) => selectedIds.has(recipient.id));
  },

  addRecipient: async (payload) => {
    const { recipients, meta } = get();
    const fieldMap = useAppStore.getState().fieldMap;
    const recipient = recipientFromPayload(payload, fieldMap, recipients.length);
    const next = [recipient, ...recipients];
    const nextFields = Array.from(
      new Set([...(meta?.fields ?? []), ...Object.keys(payload)])
    );
    const nextMeta = meta
      ? { ...meta, recordCount: next.length, fields: nextFields, lastSyncedAt: meta.lastSyncedAt }
      : meta;
    set({ recipients: next, meta: nextMeta, fields: nextFields });
    if (nextMeta) await saveDataset(nextMeta, next);
    return recipient;
  },

  updateRecipient: async (id, payload) => {
    const { recipients, meta } = get();
    const fieldMap = useAppStore.getState().fieldMap;
    const next = recipients.map((recipient) => {
      if (recipient.id !== id) return recipient;
      const rebuilt = recipientFromPayload(payload, fieldMap, 0);
      return { ...recipient, ...rebuilt, id: recipient.id, remoteId: recipient.remoteId };
    });
    set({ recipients: next });
    if (meta) await saveDataset({ ...meta, recordCount: next.length }, next);
  },

  removeRecipient: async (id) => {
    const { recipients, meta, selectedIds } = get();
    const next = recipients.filter((recipient) => recipient.id !== id);
    const nextSelection = new Set(selectedIds);
    nextSelection.delete(id);
    set({ recipients: next, selectedIds: nextSelection });
    if (meta) await saveDataset({ ...meta, recordCount: next.length }, next);
  },
}));
