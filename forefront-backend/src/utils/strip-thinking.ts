/**
 * Central utility for stripping AI reasoning/thinking tags from model output.
 *
 * Sarvam-M, Gemini, and Claude sometimes emit chain-of-thought blocks wrapped
 * in `<think>`, `<thinking>`, or `<|thinking|>` tags.  These MUST never reach
 * the end-user (chat widget, voice TTS, API response).
 *
 * Import this single function instead of duplicating regex everywhere.
 */

const THINKING_PATTERNS: RegExp[] = [
  // Standard tags (greedy-lazy, dotAll via [\s\S])
  /<think>[\s\S]*?<\/think>/gi,
  /<thinking>[\s\S]*?<\/thinking>/gi,
  // Pipe-delimited variant some models use
  /<\|thinking\|>[\s\S]*?<\|\/thinking\|>/gi,
  // Orphaned opening/closing tags (malformed output)
  /<\/?think>/gi,
  /<\/?thinking>/gi,
  /<\|?\/?thinking\|?>/gi,
  // HTML-entity-encoded variants (from template engines)
  /&lt;think&gt;[\s\S]*?&lt;\/think&gt;/gi,
  /&lt;thinking&gt;[\s\S]*?&lt;\/thinking&gt;/gi,
];

/**
 * Strip all thinking/reasoning tags from AI model output.
 *
 * @param input  Raw text from an AI model (Sarvam-M, Gemini, Claude, etc.)
 * @returns      Cleaned text safe for display or TTS
 */
export function stripThinkingTags(input: string): string {
  if (!input) return '';

  let cleaned = input;
  for (const pattern of THINKING_PATTERNS) {
    cleaned = cleaned.replace(pattern, ' ');
  }

  // Collapse whitespace and trim
  return cleaned.replace(/\s+/g, ' ').trim();
}

/**
 * Full cleanup for user-facing text: strips thinking tags, markdown bold,
 * code fences, and stray backticks.  Intended for chat responses and voice.
 */
export function cleanModelOutput(input: string): string {
  if (!input) return '';

  let cleaned = stripThinkingTags(input);

  // Remove markdown bold & italic markers
  cleaned = cleaned.replace(/\*\*/g, '');
  cleaned = cleaned.replace(/\*/g, '');

  // Remove code fences
  cleaned = cleaned.replace(/```[\s\S]*?```/g, ' ');
  cleaned = cleaned.replace(/`/g, '');

  return cleaned.replace(/\s+/g, ' ').trim();
}
