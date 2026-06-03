import emojiRegex from 'emoji-regex';

const EMOJI_REGEX = emojiRegex();

export const FALLBACK_EMOJI = "📋";

export function extractEmoji(text: string): string | null {
  const trimmed = text.trim();
  const match = trimmed.match(EMOJI_REGEX)
  return match ? match[0] : null;
}

export function isValidEmoji(value: string): boolean {
  if (!value) return false;
  const emoji = extractEmoji(value);
  return emoji === value.trim();
}
