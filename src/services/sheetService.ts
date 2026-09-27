import { createId } from '@/utils/id';
import { isValidPhone, normalizePhone } from '@/utils/phone';
import type { FieldMap, RawRecord, Recipient } from '@/types';

export type SheetErrorKind = 'network' | 'format' | 'empty';

export class SheetError extends Error {
  kind: SheetErrorKind;

  constructor(message: string, kind: SheetErrorKind) {
    super(message);
    this.name = 'SheetError';
    this.kind = kind;
  }
}

const MAX_RECORDS = 20000;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function coerceRecords(json: unknown): RawRecord[] {
  if (Array.isArray(json)) {
    return json.filter(isPlainObject);
  }
  if (isPlainObject(json)) {
    for (const key of ['data', 'records', 'rows', 'items', 'values', 'result']) {
      const candidate = json[key];
      if (Array.isArray(candidate)) return candidate.filter(isPlainObject);
    }
  }
  throw new SheetError('The data source returned an unexpected format.', 'format');
}

export async function fetchSheetJson(endpoint: string): Promise<RawRecord[]> {
  if (!endpoint) {
    throw new SheetError('No JSON endpoint configured.', 'empty');
  }

  let response: Response;
  try {
    response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
  } catch {
    throw new SheetError("Couldn't load data. Check your internet connection.", 'network');
  }

  if (!response.ok) {
    throw new SheetError(`Data source responded with status ${response.status}.`, 'network');
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new SheetError('The data source returned an unexpected format.', 'format');
  }

  const records = coerceRecords(json);
  if (records.length === 0) {
    throw new SheetError('The data source returned no records.', 'empty');
  }

  return records.slice(0, MAX_RECORDS);
}

/** Discover the union of field names across the first valid records. */
export function discoverFields(records: RawRecord[]): string[] {
  const fields = new Set<string>();
  for (const record of records.slice(0, 50)) {
    for (const key of Object.keys(record)) {
      if (key && key.trim()) fields.add(key.trim());
    }
  }
  return [...fields];
}

function findByCandidates(fields: string[], candidates: string[]): string {
  const lowered = fields.map((field) => ({ field, lower: field.toLowerCase() }));
  for (const candidate of candidates) {
    const exact = lowered.find((item) => item.lower === candidate);
    if (exact) return exact.field;
  }
  for (const candidate of candidates) {
    const partial = lowered.find((item) => item.lower.includes(candidate));
    if (partial) return partial.field;
  }
  return '';
}

/** Infer an id/name/phone field mapping from detected fields. */
export function inferFieldMap(fields: string[]): FieldMap {
  return {
    id: findByCandidates(fields, ['id', 'remote_id', 'code', 'reference', 'ref', 'no', 'number']),
    name: findByCandidates(fields, ['name', 'full_name', 'fullname', 'customer', 'student', 'member']),
    phone: findByCandidates(fields, ['phone', 'phone_number', 'mobile', 'msisdn', 'telephone', 'contact']),
  };
}

function stringifyValue(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return String(value);
}

export function normalizeRecipients(records: RawRecord[], fieldMap: FieldMap): Recipient[] {
  const seen = new Set<string>();

  return records
    .map((record, index): Recipient | null => {
      const payload: Record<string, string> = {};
      for (const [key, value] of Object.entries(record)) {
        payload[key] = stringifyValue(value);
      }

      const phoneRaw = fieldMap.phone ? payload[fieldMap.phone] ?? '' : '';
      const name = fieldMap.name ? payload[fieldMap.name] ?? '' : '';
      const remoteId = fieldMap.id ? payload[fieldMap.id] ?? '' : '';

      const hasAnyValue = Object.values(payload).some((value) => value !== '');
      if (!hasAnyValue) return null;

      const dedupeKey = remoteId || phoneRaw || `row-${index}`;
      if (seen.has(dedupeKey)) return null;
      seen.add(dedupeKey);

      return {
        id: `r_${dedupeKey}_${index}`.replace(/\s+/g, ''),
        remoteId: remoteId || String(index + 1),
        name,
        phone: normalizePhone(phoneRaw),
        phoneRaw,
        payload,
      };
    })
    .filter((recipient): recipient is Recipient => recipient !== null);
}

export type SyncResult = {
  records: RawRecord[];
  recipients: Recipient[];
  fields: string[];
  fieldMap: FieldMap;
  invalidPhoneIds: string[];
};

export function buildRecipients(records: RawRecord[], fieldMap?: FieldMap): SyncResult {
  const fields = discoverFields(records);
  const resolvedFieldMap = fieldMap && fieldMap.phone ? fieldMap : inferFieldMap(fields);
  const recipients = normalizeRecipients(records, resolvedFieldMap);
  const invalidPhoneIds = recipients.filter((r) => !isValidPhone(r.phone)).map((r) => r.id);
  return { records, recipients, fields, fieldMap: resolvedFieldMap, invalidPhoneIds };
}

export function createDatasetId(endpoint: string): string {
  return createId('ds');
}
