import * as SQLite from 'expo-sqlite';

import type {
  AppSettings,
  Campaign,
  CampaignMessage,
  CampaignStatus,
  DatasetMeta,
  FieldMap,
  MessageStatus,
  MessaTemplate,
  Recipient,
} from '@/types';

const DATABASE_NAME = 'messa.db';
const DATABASE_VERSION = 1;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = versionRow?.user_version ?? 0;
  if (current >= DATABASE_VERSION) return;

  if (current < 1) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS datasets (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        fields_json TEXT NOT NULL,
        field_map_json TEXT NOT NULL,
        record_count INTEGER NOT NULL DEFAULT 0,
        last_synced_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS recipients (
        id TEXT PRIMARY KEY NOT NULL,
        dataset_id TEXT NOT NULL,
        remote_id TEXT,
        name TEXT,
        phone TEXT,
        payload_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_recipients_dataset ON recipients (dataset_id);

      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        body TEXT NOT NULL,
        is_builtin INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS campaigns (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        template_id TEXT,
        template_name TEXT,
        sim_subscription_id INTEGER,
        sim_label TEXT,
        status TEXT NOT NULL,
        recipient_count INTEGER NOT NULL DEFAULT 0,
        sent_count INTEGER NOT NULL DEFAULT 0,
        failed_count INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        completed_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS campaign_recipients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id TEXT NOT NULL,
        recipient_id TEXT,
        remote_id TEXT,
        name TEXT,
        phone TEXT,
        message TEXT,
        parts INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL,
        error TEXT,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign
        ON campaign_recipients (campaign_id);

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT
      );
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(async (db) => {
      await migrate(db);
      return db;
    });
  }
  return dbPromise;
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                    */
/* -------------------------------------------------------------------------- */

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string | null }>(
    'SELECT value FROM settings WHERE key = ?',
    key
  );
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string | null): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value
  );
}

export async function getAppSettings(): Promise<AppSettings> {
  const raw = await getSetting('app_settings');
  const defaults: AppSettings = {
    defaultSimSubscriptionId: null,
    defaultTemplateId: null,
    confirmBeforeSend: true,
    notifyOnComplete: true,
  };
  if (!raw) return defaults;
  try {
    return { ...defaults, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return defaults;
  }
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  await setSetting('app_settings', JSON.stringify(settings));
}

/* -------------------------------------------------------------------------- */
/* Dataset + recipients                                                        */
/* -------------------------------------------------------------------------- */

export async function saveDataset(meta: DatasetMeta, recipients: Recipient[]): Promise<void> {
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync('DELETE FROM recipients');
    await txn.runAsync('DELETE FROM datasets');
    await txn.runAsync(
      `INSERT INTO datasets (id, name, endpoint, fields_json, field_map_json, record_count, last_synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      meta.id,
      meta.name,
      meta.endpoint,
      JSON.stringify(meta.fields),
      JSON.stringify(meta.fieldMap),
      meta.recordCount,
      meta.lastSyncedAt
    );
    for (const recipient of recipients) {
      await txn.runAsync(
        `INSERT INTO recipients (id, dataset_id, remote_id, name, phone, payload_json, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        recipient.id,
        meta.id,
        recipient.remoteId,
        recipient.name,
        recipient.phone,
        JSON.stringify(recipient.payload),
        meta.lastSyncedAt
      );
    }
  });
}

export async function loadDataset(): Promise<{ meta: DatasetMeta; recipients: Recipient[] } | null> {
  const db = await getDatabase();
  const datasetRow = await db.getFirstAsync<{
    id: string;
    name: string;
    endpoint: string;
    fields_json: string;
    field_map_json: string;
    record_count: number;
    last_synced_at: number;
  }>('SELECT * FROM datasets LIMIT 1');

  if (!datasetRow) return null;

  const rows = await db.getAllAsync<{
    id: string;
    remote_id: string | null;
    name: string | null;
    phone: string | null;
    payload_json: string;
  }>('SELECT id, remote_id, name, phone, payload_json FROM recipients WHERE dataset_id = ?', datasetRow.id);

  const recipients: Recipient[] = rows.map((row) => ({
    id: row.id,
    remoteId: row.remote_id ?? '',
    name: row.name ?? '',
    phone: row.phone ?? '',
    phoneRaw: row.phone ?? '',
    payload: safeParse(row.payload_json, {}),
  }));

  const meta: DatasetMeta = {
    id: datasetRow.id,
    name: datasetRow.name,
    endpoint: datasetRow.endpoint,
    fields: safeParse(datasetRow.fields_json, []),
    fieldMap: safeParse<FieldMap>(datasetRow.field_map_json, { id: '', name: '', phone: '' }),
    recordCount: datasetRow.record_count,
    lastSyncedAt: datasetRow.last_synced_at,
  };

  return { meta, recipients };
}

export async function clearDataset(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync('DELETE FROM recipients; DELETE FROM datasets;');
}

/* -------------------------------------------------------------------------- */
/* Templates                                                                   */
/* -------------------------------------------------------------------------- */

type TemplateRow = {
  id: string;
  name: string;
  body: string;
  is_builtin: number;
  created_at: number;
  updated_at: number;
};

export async function listTemplates(): Promise<MessaTemplate[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TemplateRow>('SELECT * FROM templates ORDER BY updated_at DESC');
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    body: row.body,
    builtIn: row.is_builtin === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function upsertTemplate(template: MessaTemplate): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO templates (id, name, body, is_builtin, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       body = excluded.body,
       updated_at = excluded.updated_at`,
    template.id,
    template.name,
    template.body,
    template.builtIn ? 1 : 0,
    template.createdAt,
    template.updatedAt
  );
}

export async function deleteTemplate(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM templates WHERE id = ?', id);
}

/* -------------------------------------------------------------------------- */
/* Campaigns                                                                   */
/* -------------------------------------------------------------------------- */

export async function insertCampaign(campaign: Campaign, messages: CampaignMessage[]): Promise<void> {
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(
      `INSERT INTO campaigns
        (id, name, template_id, template_name, sim_subscription_id, sim_label, status,
         recipient_count, sent_count, failed_count, created_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         status = excluded.status,
         sent_count = excluded.sent_count,
         failed_count = excluded.failed_count,
         completed_at = excluded.completed_at`,
      campaign.id,
      campaign.name,
      campaign.templateId,
      campaign.templateName,
      campaign.simSubscriptionId,
      campaign.simLabel,
      campaign.status,
      campaign.recipientCount,
      campaign.sentCount,
      campaign.failedCount,
      campaign.createdAt,
      campaign.completedAt ?? null
    );

    await txn.runAsync('DELETE FROM campaign_recipients WHERE campaign_id = ?', campaign.id);
    for (const message of messages) {
      await txn.runAsync(
        `INSERT INTO campaign_recipients
          (campaign_id, recipient_id, remote_id, name, phone, message, parts, status, error, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        campaign.id,
        message.recipientId,
        message.remoteId,
        message.name,
        message.phone,
        message.message,
        message.parts,
        message.status,
        message.error ?? null,
        campaign.createdAt
      );
    }
  });
}

export async function updateCampaign(campaign: Campaign): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE campaigns SET
       status = ?, sent_count = ?, failed_count = ?, completed_at = ?
     WHERE id = ?`,
    campaign.status,
    campaign.sentCount,
    campaign.failedCount,
    campaign.completedAt ?? null,
    campaign.id
  );

  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const message of campaign.messages) {
      await txn.runAsync(
        `UPDATE campaign_recipients SET status = ?, error = ?
         WHERE campaign_id = ? AND recipient_id = ?`,
        message.status,
        message.error ?? null,
        campaign.id,
        message.recipientId
      );
    }
  });
}

type CampaignRow = {
  id: string;
  name: string;
  template_id: string | null;
  template_name: string | null;
  sim_subscription_id: number | null;
  sim_label: string | null;
  status: CampaignStatus;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  created_at: number;
  completed_at: number | null;
};

function mapCampaign(row: CampaignRow): Campaign {
  return {
    id: row.id,
    name: row.name,
    templateId: row.template_id ?? '',
    templateName: row.template_name ?? '',
    simSubscriptionId: row.sim_subscription_id,
    simLabel: row.sim_label ?? '',
    status: row.status,
    recipientCount: row.recipient_count,
    sentCount: row.sent_count,
    failedCount: row.failed_count,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    messages: [],
  };
}

export async function listCampaigns(): Promise<Campaign[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CampaignRow>('SELECT * FROM campaigns ORDER BY created_at DESC');
  return rows.map(mapCampaign);
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<CampaignRow>('SELECT * FROM campaigns WHERE id = ?', id);
  if (!row) return null;
  const campaign = mapCampaign(row);
  const messages = await db.getAllAsync<{
    recipient_id: string | null;
    remote_id: string | null;
    name: string | null;
    phone: string | null;
    message: string | null;
    parts: number;
    status: MessageStatus;
    error: string | null;
  }>(
    'SELECT recipient_id, remote_id, name, phone, message, parts, status, error FROM campaign_recipients WHERE campaign_id = ?',
    id
  );
  campaign.messages = messages.map((message) => ({
    recipientId: message.recipient_id ?? '',
    remoteId: message.remote_id ?? '',
    name: message.name ?? '',
    phone: message.phone ?? '',
    message: message.message ?? '',
    parts: message.parts,
    status: message.status,
    error: message.error ?? undefined,
  }));
  return campaign;
}

export async function clearHistory(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync('DELETE FROM campaign_recipients; DELETE FROM campaigns;');
}

/* -------------------------------------------------------------------------- */
/* Cache maintenance                                                           */
/* -------------------------------------------------------------------------- */

export async function clearAllCachedData(): Promise<void> {
  await clearDataset();
  await clearHistory();
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
