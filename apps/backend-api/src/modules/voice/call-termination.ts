const STRONG_END_PHRASES = [
  'bye',
  'goodbye',
  'that is all',
  "that's all",
  'nothing else',
  'end call',
  'hang up',
  'disconnect',
  'stop call',
];

const SHORT_END_UTTERANCES = new Set([
  'no',
  'nope',
  'nah',
  'no thanks',
  'no thank you',
  'thanks',
  'thank you',
  'ok thanks',
  'okay thanks',
  'all good',
]);

function normalizeUtterance(input: string): string {
  return (input || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function shouldEndVoiceCallFromUserInput(input: string): boolean {
  const normalized = normalizeUtterance(input);
  if (!normalized) return false;

  for (const phrase of STRONG_END_PHRASES) {
    if (normalized.includes(phrase)) {
      return true;
    }
  }

  const tokenCount = normalized.split(' ').filter(Boolean).length;
  if (tokenCount <= 4 && SHORT_END_UTTERANCES.has(normalized)) {
    return true;
  }

  return false;
}

export function defaultVoiceFarewell(): string {
  return 'Thank you for calling. Have a great day. Goodbye.';
}
