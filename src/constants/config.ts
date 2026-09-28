/** Cloud service + sales details. */
export const DEFAULT_API_BASE_URL = 'https://messa.sgm.ng/api';

export const WHATSAPP_NUMBER = '2348108097322';
export const WHATSAPP_DISPLAY = '08108097322';
export const VENDOR = 'RayyanTech';
export const REGISTRATION_FEE = 5000;
export const REGISTRATION_CURRENCY = 'NGN';

export function whatsappTokenLink(): string {
  const message = `Hello ${VENDOR}, I want to get a MESSA registration token. I have paid ${REGISTRATION_CURRENCY} ${REGISTRATION_FEE.toLocaleString()}.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const MAX_CLOUD_TABLES = 10;
export const MAX_CLOUD_ROWS = 512;
