import { NativeModule, registerWebModule } from 'expo';

import type {
  MessaSmsModuleEvents,
  NativeSmsResult,
  SimSubscriptionPayload,
} from './MessaSms.types';

// Direct SMS sending is not available on the web platform.
class MessaSmsModule extends NativeModule<MessaSmsModuleEvents> {
  async getSubscriptionsAsync(): Promise<SimSubscriptionPayload[]> {
    return [];
  }

  async sendSmsAsync(): Promise<NativeSmsResult> {
    return { success: false, error: 'SMS sending is not supported on this platform.' };
  }
}

export default registerWebModule(MessaSmsModule, 'MessaSms');
