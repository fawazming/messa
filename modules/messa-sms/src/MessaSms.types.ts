export type SimSubscriptionPayload = {
  subscriptionId: number;
  slotIndex: number;
  displayName: string;
  carrierName: string | null;
  phoneNumber: string | null;
};

export type NativeSmsResult = {
  success: boolean;
  error?: string;
};

export type SmsEventPayload = {
  subscriptionId: number;
  phone: string;
  success: boolean;
  error?: string;
};

export type MessaSmsModuleEvents = {
  onSmsSent: (payload: SmsEventPayload) => void;
  onSmsFailed: (payload: SmsEventPayload) => void;
};
