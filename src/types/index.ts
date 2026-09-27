export type RawRecord = Record<string, unknown>;

export type Recipient = {
  id: string;
  remoteId: string;
  name: string;
  phone: string;
  phoneRaw: string;
  payload: Record<string, string>;
};

export type FieldMap = {
  id: string;
  name: string;
  phone: string;
};

export type DataSourceConfig = {
  endpoint: string;
  datasetName: string;
  refreshIntervalMinutes: number;
};

export type MessaTemplate = {
  id: string;
  name: string;
  body: string;
  builtIn: boolean;
  createdAt: number;
  updatedAt: number;
};

export type SimSubscription = {
  subscriptionId: number;
  slotIndex: number;
  displayName: string;
  carrierName?: string | null;
  phoneNumber?: string | null;
};

export type SmsRequest = {
  subscriptionId: number;
  phone: string;
  message: string;
};

export type SmsResult = {
  success: boolean;
  error?: string;
};

export type MessageStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'cancelled';

export type CampaignStatus =
  | 'draft'
  | 'ready'
  | 'sending'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'failed';

export type CampaignMessage = {
  recipientId: string;
  remoteId: string;
  name: string;
  phone: string;
  message: string;
  parts: number;
  status: MessageStatus;
  error?: string;
};

export type Campaign = {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  simSubscriptionId: number | null;
  simLabel: string;
  status: CampaignStatus;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  createdAt: number;
  completedAt?: number | null;
  messages: CampaignMessage[];
};

export type DatasetMeta = {
  id: string;
  name: string;
  endpoint: string;
  fields: string[];
  fieldMap: FieldMap;
  recordCount: number;
  lastSyncedAt: number;
};

export type DatasetSummary = {
  meta: DatasetMeta;
  recipients: Recipient[];
};

export type ValidationIssueKind =
  | 'missing-phone'
  | 'invalid-phone'
  | 'missing-variable'
  | 'empty-message'
  | 'duplicate-phone';

export type ValidationIssue = {
  kind: ValidationIssueKind;
  message: string;
  recipientId?: string;
  recipientName?: string;
};

export type ValidationReport = {
  issues: ValidationIssue[];
  validCount: number;
  invalidIds: string[];
  missingVariables: string[];
  canSend: boolean;
};

export type PermissionState = 'unknown' | 'granted' | 'denied';

export type AppSettings = {
  defaultSimSubscriptionId: number | null;
  defaultTemplateId: string | null;
  confirmBeforeSend: boolean;
  notifyOnComplete: boolean;
};
