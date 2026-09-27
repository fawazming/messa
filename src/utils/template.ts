import { formatCurrency, formatDate, toNumber } from './format';

const VARIABLE_PATTERN = /{{\s*([^{}]+?)\s*}}/g;
const DATE_PATTERN = /^date(?:\+(\d+))?$/;

export type RenderResult = {
  text: string;
  missing: string[];
};

export function extractVariables(body: string): string[] {
  const found = new Set<string>();
  for (const match of body.matchAll(VARIABLE_PATTERN)) {
    found.add(match[1].trim());
  }
  return [...found];
}

function lookup(key: string, record: Record<string, string>): string | undefined {
  const direct = record[key];
  if (direct !== undefined && direct !== null && String(direct).trim() !== '') {
    return String(direct);
  }
  const lower = key.toLowerCase();
  const match = Object.keys(record).find((field) => field.toLowerCase() === lower);
  if (match && String(record[match]).trim() !== '') {
    return String(record[match]);
  }
  return undefined;
}

function applyHelper(expression: string, record: Record<string, string>): string | undefined {
  const [rawHelper, ...rest] = expression.split(/\s+/);
  const helper = rawHelper.toLowerCase();

  if (helper === 'uppercase') return lookup(rest.join(' '), record)?.toUpperCase();
  if (helper === 'lowercase') return lookup(rest.join(' '), record)?.toLowerCase();
  if (helper === 'currency') {
    const value = lookup(rest.join(' '), record);
    return value === undefined ? undefined : formatCurrency(value);
  }
  return undefined;
}

/**
 * Mustache-style renderer. Supports {{field}} and safe helpers
 * ({{uppercase field}}, {{lowercase field}}, {{currency amount}}, {{date}}, {{date+7}}).
 * Never evaluates arbitrary JavaScript.
 */
export function renderTemplate(body: string, record: Record<string, string>): RenderResult {
  const missing = new Set<string>();
  const dateMatch = (key: string) => DATE_PATTERN.exec(key);

  const text = body.replace(VARIABLE_PATTERN, (_match, rawKey: string) => {
    const key = rawKey.trim();

    const dateExpr = dateMatch(key);
    if (dateExpr) {
      return formatDate(new Date(), dateExpr[1] ? Number(dateExpr[1]) : 0);
    }

    if (/\s/.test(key)) {
      const helperValue = applyHelper(key, record);
      if (helperValue !== undefined) return helperValue;
    }

    const value = lookup(key, record);
    if (value === undefined) {
      missing.add(key);
      return `{{${key}}}`;
    }
    return value;
  });

  return { text, missing: [...missing] };
}

export function hasVariables(body: string): boolean {
  return extractVariables(body).length > 0;
}
