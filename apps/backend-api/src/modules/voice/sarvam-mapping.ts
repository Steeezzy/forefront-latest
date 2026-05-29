const LANGUAGE_CODE_BY_NAME: Record<string, string> = {
  english: 'en-IN',
  'english (india)': 'en-IN',
  hindi: 'hi-IN',
  tamil: 'ta-IN',
  telugu: 'te-IN',
  malayalam: 'ml-IN',
  kannada: 'kn-IN',
  marathi: 'mr-IN',
  gujarati: 'gu-IN',
  bengali: 'bn-IN',
  punjabi: 'pa-IN',
  odia: 'or-IN',
  urdu: 'ur-IN',
};

function normalizeLocale(code: string): string {
  const parts = code.split('-');
  if (parts.length !== 2) return 'en-IN';
  return `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
}

export function toSarvamLanguageCode(language?: string): string {
  const value = (language || '').trim();
  if (!value) return 'en-IN';

  if (/^[a-z]{2}-[a-z]{2}$/i.test(value)) {
    return normalizeLocale(value);
  }

  return LANGUAGE_CODE_BY_NAME[value.toLowerCase()] || 'en-IN';
}

export function toSarvamSpeaker(voice?: string): string {
  const value = (voice || '').trim().toLowerCase();
  if (!value) return 'tanya';

  // Frontend stores Sarvam voices as sarvam-<speaker>
  const rawSpeaker = value.replace(/^sarvam-/, '');

  const speakerAliases: Record<string, string> = {
    // Legacy UI voices kept for backwards compatibility.
    raj: 'tarun',
    naina: 'kavitha',

    // Common alternate spellings.
    kavita: 'kavitha',
    tania: 'tanya',
  };

  return speakerAliases[rawSpeaker] || rawSpeaker || 'tanya';
}
