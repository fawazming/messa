import { isValidPhone, phoneKey } from '@/utils/phone';
import { renderTemplate } from '@/utils/template';
import type { Recipient, ValidationIssue, ValidationReport } from '@/types';

export function validateCampaign(
  recipients: Recipient[],
  templateBody: string
): ValidationReport {
  const issues: ValidationIssue[] = [];
  const invalidIds = new Set<string>();
  const missingVariables = new Set<string>();

  if (!templateBody.trim()) {
    issues.push({ kind: 'empty-message', message: 'The message template is empty.' });
    return {
      issues,
      validCount: 0,
      invalidIds: [],
      missingVariables: [],
      canSend: false,
    };
  }

  const phoneCounts = new Map<string, number>();
  for (const recipient of recipients) {
    const key = phoneKey(recipient.phone);
    if (key) phoneCounts.set(key, (phoneCounts.get(key) ?? 0) + 1);
  }

  for (const recipient of recipients) {
    const label = recipient.name || recipient.phone || recipient.remoteId;
    const notEmpty = recipient.phoneRaw || recipient.phone;

    if (!notEmpty) {
      issues.push({
        kind: 'missing-phone',
        message: `${label} has no phone number.`,
        recipientId: recipient.id,
        recipientName: recipient.name,
      });
      invalidIds.add(recipient.id);
      continue;
    }

    if (!isValidPhone(recipient.phone)) {
      issues.push({
        kind: 'invalid-phone',
        message: `${label} has an invalid phone number.`,
        recipientId: recipient.id,
        recipientName: recipient.name,
      });
      invalidIds.add(recipient.id);
      continue;
    }

    const key = phoneKey(recipient.phone);
    if (key && (phoneCounts.get(key) ?? 0) > 1) {
      issues.push({
        kind: 'duplicate-phone',
        message: `${label} shares a phone number with another selected recipient.`,
        recipientId: recipient.id,
        recipientName: recipient.name,
      });
    }

    const { text, missing } = renderTemplate(templateBody, recipient.payload);
    if (missing.length > 0) {
      missing.forEach((variable) => missingVariables.add(variable));
      issues.push({
        kind: 'missing-variable',
        message: `${label} is missing: ${missing.map((v) => `{{${v}}}`).join(', ')}.`,
        recipientId: recipient.id,
        recipientName: recipient.name,
      });
      invalidIds.add(recipient.id);
      continue;
    }

    if (!text.trim()) {
      issues.push({
        kind: 'empty-message',
        message: `${label} generated an empty message.`,
        recipientId: recipient.id,
        recipientName: recipient.name,
      });
      invalidIds.add(recipient.id);
    }
  }

  const validCount = recipients.length - invalidIds.size;
  return {
    issues,
    validCount,
    invalidIds: [...invalidIds],
    missingVariables: [...missingVariables],
    canSend: validCount > 0 && templateBody.trim().length > 0,
  };
}

export function summarizeIssues(report: ValidationReport): string[] {
  const counts = new Map<string, number>();
  for (const issue of report.issues) {
    counts.set(issue.kind, (counts.get(issue.kind) ?? 0) + 1);
  }
  const lines: string[] = [];
  for (const [kind, count] of counts) {
    switch (kind) {
      case 'missing-phone':
        lines.push(`${count} record${count === 1 ? '' : 's'} are missing phone numbers.`);
        break;
      case 'invalid-phone':
        lines.push(`${count} recipient${count === 1 ? '' : 's'} have invalid phone numbers.`);
        break;
      case 'missing-variable':
        lines.push(`${count} message${count === 1 ? '' : 's'} have unresolved template variables.`);
        break;
      case 'duplicate-phone':
        lines.push(`${count} recipient${count === 1 ? '' : 's'} share a phone number.`);
        break;
      case 'empty-message':
        lines.push('Some messages would be empty.');
        break;
    }
  }
  return lines;
}
