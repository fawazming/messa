import { NativeModule, requireOptionalNativeModule } from 'expo';

import type {
  MessaSmsModuleEvents,
  NativeSmsResult,
  SimSubscriptionPayload,
} from './MessaSms.types';

declare class MessaSmsModule extends NativeModule<MessaSmsModuleEvents> {
  getSubscriptionsAsync(): Promise<SimSubscriptionPayload[]>;
  sendSmsAsync(subscriptionId: number, destination: string, message: string): Promise<NativeSmsResult>;
}

// Returns null when the native module is not present (e.g. Expo Go / unsupported platform).
export default requireOptionalNativeModule<MessaSmsModule>('MessaSms');
