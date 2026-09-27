import { create } from 'zustand';

import { insertCampaign, updateCampaign } from '@/db/database';
import { sendSms } from '@/services/smsService';
import { useDataStore } from '@/store/dataStore';
import { estimateSmsLength } from '@/utils/smsLength';
import { renderTemplate } from '@/utils/template';
import { createId } from '@/utils/id';
import { formatDateTime } from '@/utils/format';
import type {
  Campaign,
  CampaignMessage,
  CampaignStatus,
  MessaTemplate,
  Recipient,
  SimSubscription,
} from '@/types';

let stopRequested = false;

type CampaignStats = {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  progress: number;
  parts: number;
};

type CampaignState = {
  id: string;
  name: string;
  template: MessaTemplate | null;
  simSubscriptionId: number | null;
  simLabel: string;
  simCarrier: string;
  messages: CampaignMessage[];
  status: CampaignStatus;
  running: boolean;
  currentIndex: number;
  startedAt: number | null;
  completedAt: number | null;
  error: string | null;
  setTemplate: (template: MessaTemplate) => void;
  setSim: (subscription: SimSubscription) => void;
  setCampaignName: (name: string) => void;
  buildMessages: (recipients?: Recipient[]) => number;
  start: () => Promise<void>;
  stop: () => void;
  retryFailed: () => Promise<void>;
  reset: () => void;
  stats: () => CampaignStats;
};

function buildCampaignMessage(
  recipient: { id: string; remoteId: string; name: string; phone: string; payload: Record<string, string> },
  templateBody: string
): CampaignMessage {
  const { text } = renderTemplate(templateBody, recipient.payload);
  return {
    recipientId: recipient.id,
    remoteId: recipient.remoteId,
    name: recipient.name,
    phone: recipient.phone,
    message: text,
    parts: estimateSmsLength(text).parts,
    status: 'pending',
  };
}

function toCampaign(state: CampaignState): Campaign {
  const stats = computeStats(state.messages);
  return {
    id: state.id,
    name: state.name || 'Untitled Campaign',
    templateId: state.template?.id ?? '',
    templateName: state.template?.name ?? 'Custom Message',
    simSubscriptionId: state.simSubscriptionId,
    simLabel: state.simLabel,
    status: state.status,
    recipientCount: state.messages.length,
    sentCount: stats.sent,
    failedCount: stats.failed,
    createdAt: state.startedAt ?? Date.now(),
    completedAt: state.completedAt,
    messages: state.messages,
  };
}

function computeStats(messages: CampaignMessage[]): CampaignStats {
  let sent = 0;
  let failed = 0;
  let pending = 0;
  let parts = 0;
  for (const message of messages) {
    if (message.status === 'sent') sent += 1;
    else if (message.status === 'failed') failed += 1;
    else if (message.status !== 'cancelled') pending += 1;
    parts += message.parts;
  }
  const total = messages.length;
  const progress = total === 0 ? 0 : Math.round(((sent + failed) / total) * 100);
  return { total, sent, failed, pending, progress, parts };
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  id: createId('cmp'),
  name: '',
  template: null,
  simSubscriptionId: null,
  simLabel: '',
  simCarrier: '',
  messages: [],
  status: 'draft',
  running: false,
  currentIndex: 0,
  startedAt: null,
  completedAt: null,
  error: null,

  setTemplate: (template) => set({ template, status: 'draft' }),

  setSim: (subscription) =>
    set({
      simSubscriptionId: subscription.subscriptionId,
      simLabel: subscription.displayName,
      simCarrier: subscription.carrierName ?? '',
    }),

  setCampaignName: (name) => set({ name }),

  buildMessages: (overrideRecipients) => {
    const { template } = get();
    const recipients = overrideRecipients ?? useDataStore.getState().selectedRecipients();
    if (!template || recipients.length === 0) {
      set({ messages: [] });
      return 0;
    }
    const messages = recipients.map((recipient) => buildCampaignMessage(recipient, template.body));
    set({ messages, status: 'ready', error: null });
    return messages.length;
  },

  start: async () => {
    const state = get();
    if (state.running || state.messages.length === 0) return;

    stopRequested = false;
    const startedAt = state.startedAt ?? Date.now();
    const name =
      state.name ||
      `${state.template?.name ?? 'Campaign'} — ${formatDateTime(startedAt)}`;

    set({
      running: true,
      status: 'sending',
      startedAt,
      completedAt: null,
      error: null,
      name,
    });

    try {
      await insertCampaign(toCampaign({ ...get(), name }), get().messages);
    } catch {
      // Non-fatal: continue sending even if history persistence fails.
    }

    const queue = get().messages.map((message, index) => ({ message, index }));

    for (const { index } of queue) {
      if (stopRequested) break;

      const current = get().messages[index];
      if (!current || current.status !== 'pending') continue;

      set((prev) => {
        const messages = [...prev.messages];
        messages[index] = { ...messages[index], status: 'sending' };
        return { messages, currentIndex: index };
      });

      const result = await sendSms({
        subscriptionId: get().simSubscriptionId ?? 0,
        phone: current.phone,
        message: current.message,
      });

      set((prev) => {
        const messages = [...prev.messages];
        messages[index] = {
          ...messages[index],
          status: result.success ? 'sent' : 'failed',
          error: result.success ? undefined : result.error ?? 'SMS service unavailable',
        };
        return { messages };
      });
    }

    const finalMessages = get().messages;
    const completedAt = Date.now();
    const cancelled = stopRequested && finalMessages.some((message) => message.status === 'pending');
    const finalStatus: CampaignStatus = cancelled ? 'cancelled' : 'completed';

    set({ running: false, status: finalStatus, completedAt });

    try {
      await updateCampaign(
        toCampaign({ ...get(), status: finalStatus, completedAt, messages: finalMessages })
      );
    } catch {
      // ignore persistence failure
    }
  },

  stop: () => {
    stopRequested = true;
    set({ status: 'paused' });
  },

  retryFailed: async () => {
    set((prev) => ({
      messages: prev.messages.map((message) =>
        message.status === 'failed' ? { ...message, status: 'pending', error: undefined } : message
      ),
      completedAt: null,
    }));
    await get().start();
  },

  reset: () =>
    set({
      id: createId('cmp'),
      name: '',
      template: null,
      simSubscriptionId: null,
      simLabel: '',
      simCarrier: '',
      messages: [],
      status: 'draft',
      running: false,
      currentIndex: 0,
      startedAt: null,
      completedAt: null,
      error: null,
    }),

  stats: () => computeStats(get().messages),
}));
