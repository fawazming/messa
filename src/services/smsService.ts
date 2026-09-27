import { PermissionsAndroid, Platform } from 'react-native';

import nativeMessaSms from '../../modules/messa-sms';
import type { SimSubscription, SmsRequest, SmsResult } from '@/types';

export const NATIVE_SMS_AVAILABLE = nativeMessaSms != null;

/** Used for the clickable prototype and Expo Go, where the native module is absent. */
const DEMO_SUBSCRIPTIONS: SimSubscription[] = [
  {
    subscriptionId: 1,
    slotIndex: 0,
    displayName: 'SIM 1',
    carrierName: 'MTN Nigeria',
    phoneNumber: null,
  },
  {
    subscriptionId: 2,
    slotIndex: 1,
    displayName: 'SIM 2',
    carrierName: 'Airtel Nigeria',
    phoneNumber: null,
  },
];

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function hasSmsPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const sms = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.SEND_SMS);
    if (!sms) return false;
    const phone = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE
    );
    return phone;
  } catch {
    return false;
  }
}

export async function requestSmsPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.SEND_SMS,
      PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
    ]);
    const smsGranted =
      result[PermissionsAndroid.PERMISSIONS.SEND_SMS] === PermissionsAndroid.RESULTS.GRANTED;
    const phoneGranted =
      result[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] ===
      PermissionsAndroid.RESULTS.GRANTED;
    return smsGranted && phoneGranted;
  } catch {
    return false;
  }
}

export async function getSubscriptions(): Promise<SimSubscription[]> {
  if (!nativeMessaSms) {
    await delay(150);
    return DEMO_SUBSCRIPTIONS;
  }
  try {
    const subscriptions = await nativeMessaSms.getSubscriptionsAsync();
    return subscriptions.map((subscription) => ({
      subscriptionId: subscription.subscriptionId,
      slotIndex: subscription.slotIndex ?? 0,
      displayName: subscription.displayName || `SIM ${(subscription.slotIndex ?? 0) + 1}`,
      carrierName: subscription.carrierName ?? null,
      phoneNumber: subscription.phoneNumber ?? null,
    }));
  } catch {
    return [];
  }
}

export async function sendSms(request: SmsRequest): Promise<SmsResult> {
  if (!request.phone) {
    return { success: false, error: 'Missing phone number' };
  }
  if (!request.message.trim()) {
    return { success: false, error: 'Message is empty' };
  }

  if (!nativeMessaSms) {
    await delay(220);
    return { success: true };
  }

  try {
    const result = await nativeMessaSms.sendSmsAsync(
      request.subscriptionId,
      request.phone,
      request.message
    );
    return { success: Boolean(result?.success), error: result?.error };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SMS could not be sent',
    };
  }
}

export type BatchCallbacks = {
  onProgress?: (completed: number, total: number, result: SmsResult, request: SmsRequest) => void;
  shouldStop?: () => boolean;
};

/**
 * Sequential queue with concurrency 1, per spec section 46.
 * Prevents the telephony subsystem and the UI from being overwhelmed.
 */
export async function sendBatch(
  requests: SmsRequest[],
  callbacks: BatchCallbacks = {}
): Promise<SmsResult[]> {
  const results: SmsResult[] = [];

  for (let index = 0; index < requests.length; index += 1) {
    if (callbacks.shouldStop?.()) break;

    const request = requests[index];
    const result = await sendSms(request);
    results.push(result);
    callbacks.onProgress?.(index + 1, requests.length, result, request);
  }

  return results;
}

export async function testSubscription(subscriptionId: number): Promise<SmsResult> {
  if (!nativeMessaSms) {
    await delay(100);
    return { success: true };
  }
  const subs = await getSubscriptions();
  const found = subs.some((sub) => sub.subscriptionId === subscriptionId);
  return found
    ? { success: true }
    : { success: false, error: 'Selected SIM is unavailable.' };
}
