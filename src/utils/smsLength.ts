const GSM7_BASIC =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\u001BÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?' +
  '¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';

const GSM7_EXTENDED = '^{}\\[~]|€';

const GSM7_SET = new Set(GSM7_BASIC.split(''));
const GSM7_EXT_SET = new Set(GSM7_EXTENDED.split(''));

export type SmsLengthEstimate = {
  characters: number;
  parts: number;
  encoding: 'GSM-7' | 'UCS-2';
  unicode: boolean;
  remainingInPart: number;
};

/**
 * Estimate the number of SMS parts for a message.
 * GSM-7: 160 chars single, 153 per part for multipart.
 * UCS-2: 70 chars single, 67 per part for multipart.
 * This is an estimate, not a carrier billing guarantee.
 */
export function estimateSmsLength(message: string): SmsLengthEstimate {
  const characters = message.length;
  if (characters === 0) {
    return { characters: 0, parts: 0, encoding: 'GSM-7', unicode: false, remainingInPart: 160 };
  }

  let gsmUnits = 0;
  let unicode = false;

  for (const char of message) {
    if (GSM7_SET.has(char)) {
      gsmUnits += 1;
    } else if (GSM7_EXT_SET.has(char)) {
      gsmUnits += 2;
    } else {
      unicode = true;
      break;
    }
  }

  if (!unicode) {
    const parts = gsmUnits <= 160 ? 1 : Math.ceil(gsmUnits / 153);
    const capacity = parts === 1 ? 160 : parts * 153;
    return {
      characters,
      parts,
      encoding: 'GSM-7',
      unicode: false,
      remainingInPart: capacity - gsmUnits,
    };
  }

  const parts = characters <= 70 ? 1 : Math.ceil(characters / 67);
  const capacity = parts === 1 ? 70 : parts * 67;
  return {
    characters,
    parts,
    encoding: 'UCS-2',
    unicode: true,
    remainingInPart: capacity - characters,
  };
}

export function formatSmsLength(message: string): string {
  const { characters, parts } = estimateSmsLength(message);
  return `${characters} characters · ${parts} SMS`;
}

export function totalParts(messages: string[]): number {
  return messages.reduce((sum, message) => sum + estimateSmsLength(message).parts, 0);
}
