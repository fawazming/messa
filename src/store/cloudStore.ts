import { create } from 'zustand';

import { getSetting, setSetting } from '@/db/database';
import { ApiError, apiRequest } from '@/services/api';
import { useAppStore } from '@/store/appStore';
import { useDataStore } from '@/store/dataStore';
import type { CloudTable } from '@/types';

const ACTIVE_KEY = 'active_cloud_table';

type CloudState = {
  tables: CloudTable[];
  activeTableId: number | null;
  loading: boolean;
  busy: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  createTable: (name: string, columns: string[], sourceUrl?: string) => Promise<CloudTable | null>;
  updateTable: (id: number, patch: { name?: string; columns?: string[]; source_url?: string | null }) => Promise<void>;
  deleteTable: (id: number) => Promise<void>;
  importInto: (id: number, url: string) => Promise<number>;
  loadIntoApp: (table: CloudTable) => Promise<void>;
  pushLocalToTable: (table: CloudTable) => Promise<number>;
  addRow: (tableId: number, data: Record<string, string>) => Promise<void>;
  updateRow: (tableId: number, rowId: number, data: Record<string, string>) => Promise<void>;
  deleteRow: (tableId: number, rowId: number) => Promise<void>;
  reset: () => void;
  getActiveTable: () => CloudTable | null;
};

function describe(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export const useCloudStore = create<CloudState>((set, get) => ({
  tables: [],
  activeTableId: null,
  loading: false,
  busy: false,
  error: null,

  hydrate: async () => {
    const stored = await getSetting(ACTIVE_KEY);
    set({ activeTableId: stored ? Number(stored) : null });
    await get().refresh();
  },

  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const result = await apiRequest<{ tables: CloudTable[] }>('/tables');
      set((state) => {
        const exists = result.tables.some((table) => table.id === state.activeTableId);
        return {
          tables: result.tables,
          activeTableId: exists ? state.activeTableId : null,
          loading: false,
        };
      });
    } catch (error) {
      set({ loading: false, error: describe(error) });
    }
  },

  createTable: async (name, columns, sourceUrl) => {
    set({ busy: true, error: null });
    try {
      const result = await apiRequest<{ table: CloudTable }>('/tables', {
        method: 'POST',
        body: { name, columns, source_url: sourceUrl ?? null },
      });
      set((state) => ({ tables: [result.table, ...state.tables], busy: false }));
      return result.table;
    } catch (error) {
      set({ busy: false, error: describe(error) });
      return null;
    }
  },

  updateTable: async (id, patch) => {
    set({ busy: true, error: null });
    try {
      const result = await apiRequest<{ table: CloudTable }>(`/tables/${id}`, {
        method: 'PUT',
        body: patch,
      });
      set((state) => ({
        tables: state.tables.map((table) => (table.id === id ? result.table : table)),
        busy: false,
      }));
    } catch (error) {
      set({ busy: false, error: describe(error) });
    }
  },

  deleteTable: async (id) => {
    set({ busy: true, error: null });
    try {
      await apiRequest(`/tables/${id}`, { method: 'DELETE' });
      const nextActive = get().activeTableId === id ? null : get().activeTableId;
      if (get().activeTableId === id) {
        await setSetting(ACTIVE_KEY, null);
      }
      set((state) => ({
        tables: state.tables.filter((table) => table.id !== id),
        activeTableId: nextActive,
        busy: false,
      }));
    } catch (error) {
      set({ busy: false, error: describe(error) });
    }
  },

  importInto: async (id, url) => {
    set({ busy: true, error: null });
    try {
      const result = await apiRequest<{ imported: number; table: CloudTable }>(
        `/tables/${id}/import`,
        { method: 'POST', body: { url } }
      );
      set((state) => ({
        tables: state.tables.map((table) => (table.id === id ? result.table : table)),
        busy: false,
      }));
      if (get().activeTableId === id) {
        await useDataStore.getState().sync({ silent: true });
      }
      return result.imported;
    } catch (error) {
      set({ busy: false, error: describe(error) });
      return -1;
    }
  },

  loadIntoApp: async (table) => {
    set({ busy: true, error: null });
    try {
      await useAppStore.getState().setDataSource({
        endpoint: table.public_url,
        datasetName: table.name,
        refreshIntervalMinutes: useAppStore.getState().dataSource.refreshIntervalMinutes,
      });
      await setSetting(ACTIVE_KEY, String(table.id));
      set({ activeTableId: table.id, busy: false });
      await useDataStore.getState().sync({ silent: false });
    } catch (error) {
      set({ busy: false, error: describe(error) });
    }
  },

  pushLocalToTable: async (table) => {
    set({ busy: true, error: null });
    try {
      const recipients = useDataStore.getState().recipients;
      const rows = recipients.map((recipient) => recipient.payload);
      const result = await apiRequest<{ row_count: number; table: CloudTable }>(
        `/tables/${table.id}/replace`,
        { method: 'POST', body: { rows } }
      );
      set((state) => ({
        tables: state.tables.map((item) => (item.id === table.id ? result.table : item)),
        busy: false,
      }));
      if (get().activeTableId === table.id) {
        await useDataStore.getState().sync({ silent: true });
      }
      return result.row_count;
    } catch (error) {
      set({ busy: false, error: describe(error) });
      return -1;
    }
  },

  addRow: async (tableId, data) => {
    set({ busy: true, error: null });
    try {
      await apiRequest(`/tables/${tableId}/rows`, { method: 'POST', body: { data } });
      set({ busy: false });
      if (get().activeTableId === tableId) await useDataStore.getState().sync({ silent: true });
      await get().refresh();
    } catch (error) {
      set({ busy: false, error: describe(error) });
    }
  },

  updateRow: async (tableId, rowId, data) => {
    set({ busy: true, error: null });
    try {
      await apiRequest(`/tables/${tableId}/rows/${rowId}`, { method: 'PUT', body: { data } });
      set({ busy: false });
      if (get().activeTableId === tableId) await useDataStore.getState().sync({ silent: true });
    } catch (error) {
      set({ busy: false, error: describe(error) });
    }
  },

  deleteRow: async (tableId, rowId) => {
    set({ busy: true, error: null });
    try {
      await apiRequest(`/tables/${tableId}/rows/${rowId}`, { method: 'DELETE' });
      set({ busy: false });
      if (get().activeTableId === tableId) await useDataStore.getState().sync({ silent: true });
      await get().refresh();
    } catch (error) {
      set({ busy: false, error: describe(error) });
    }
  },

  getActiveTable: () => {
    const { tables, activeTableId } = get();
    return tables.find((table) => table.id === activeTableId) ?? null;
  },

  reset: () => set({ tables: [], activeTableId: null, error: null, busy: false }),
}));
