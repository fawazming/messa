import { deleteTemplate, getSetting, listTemplates, setSetting, upsertTemplate } from '@/db/database';
import { createId } from '@/utils/id';
import type { MessaTemplate, Recipient } from '@/types';

const SEEDED_KEY = 'templates_seeded_v1';
const now = Date.now;

type SeedTemplate = Pick<MessaTemplate, 'id' | 'name' | 'body'>;

export const BUILT_IN_TEMPLATES: SeedTemplate[] = [
  {
    id: 'builtin-fee-reminder',
    name: 'Fee Reminder',
    body: 'Dear {{name}}, your outstanding balance is {{currency balance}}. Please contact {{school}} for assistance.',
  },
  {
    id: 'builtin-exam-reminder',
    name: 'Exam Reminder',
    body: 'Dear {{name}}, your {{class}} examination begins soon. Please check with {{school}} for the timetable.',
  },
  {
    id: 'builtin-payment-confirmation',
    name: 'Payment Confirmation',
    body: 'Dear {{name}}, we have received your payment of {{currency balance}}. Thank you. - {{school}}',
  },
  {
    id: 'builtin-general-notice',
    name: 'General Notice',
    body: 'Hello {{name}}, this is a notice from {{school}}. Please contact the office for more information.',
  },
];

export async function seedTemplates(): Promise<void> {
  const seeded = await getSetting(SEEDED_KEY);
  if (seeded) return;

  const existing = await listTemplates();
  if (existing.length === 0) {
    for (const seed of BUILT_IN_TEMPLATES) {
      const timestamp = now();
      await upsertTemplate({
        ...seed,
        builtIn: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
  }
  await setSetting(SEEDED_KEY, 'true');
}

export async function loadTemplates(): Promise<MessaTemplate[]> {
  return listTemplates();
}

export async function createTemplate(name: string, body: string): Promise<MessaTemplate> {
  const timestamp = now();
  const template: MessaTemplate = {
    id: createId('tpl'),
    name: name.trim() || 'Untitled Template',
    body: body.trim(),
    builtIn: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await upsertTemplate(template);
  return template;
}

export async function updateTemplate(template: MessaTemplate): Promise<MessaTemplate> {
  const updated: MessaTemplate = { ...template, updatedAt: now() };
  await upsertTemplate(updated);
  return updated;
}

export async function removeTemplate(id: string): Promise<void> {
  await deleteTemplate(id);
}

/** Discover template variables from the loaded dataset. */
export function discoverTemplateVariables(recipients: Recipient[]): string[] {
  const fields = new Set<string>();
  for (const recipient of recipients.slice(0, 50)) {
    for (const key of Object.keys(recipient.payload)) {
      if (recipient.payload[key] !== '') fields.add(key);
    }
  }
  return [...fields].sort();
}

export const TEMPLATE_HELPERS = [
  { token: '{{date}}', label: 'Today' },
  { token: '{{date+7}}', label: 'Next week' },
];
