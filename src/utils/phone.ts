const NIGERIA_CC = '234';

/**
 * Normalize common Nigerian phone formats to E.164.
 * Unusual/international numbers are preserved rather than silently rewritten.
 */
export function normalizePhone(raw: string): string {
  if (!raw) return '';
  const value = String(raw).trim();
  if (!value) return '';

  const hadPlus = value.startsWith('+');
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith(NIGERIA_CC) && digits.length === 13) {
    return `+${digits}`;
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return `+${NIGERIA_CC}${digits.slice(1)}`;
  }
  if (!hadPlus && digits.length === 10) {
    return `+${NIGERIA_CC}${digits}`;
  }
  if (hadPlus) {
    return `+${digits}`;
  }
  return value;
}

export function isValidPhone(raw: string): boolean {
  const normalized = normalizePhone(raw);
  return /^\+[1-9]\d{7,14}$/.test(normalized);
}

export function maskPhone(raw: string): string {
  const normalized = normalizePhone(raw);
  if (!normalized) return '';
  const digits = normalized.replace('+', '');
  if (digits.length <= 6) return normalized;
  const cc = digits.slice(0, Math.max(1, digits.length - 9));
  const rest = digits.slice(cc.length);
  const visibleTail = rest.slice(-3);
  return `+${cc} ${'•'.repeat(Math.max(0, rest.length - 3))}${visibleTail}`;
}

export function prettyPhone(raw: string): string {
  const normalized = normalizePhone(raw);
  if (!normalized) return '';
  const digits = normalized.replace('+', '');
  if (digits.startsWith(NIGERIA_CC) && digits.length === 13) {
    const rest = digits.slice(3);
    return `+234 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`;
  }
  return normalized;
}

export function phoneKey(raw: string): string {
  const normalized = normalizePhone(raw);
  return normalized.replace(/\D/g, '');
}
