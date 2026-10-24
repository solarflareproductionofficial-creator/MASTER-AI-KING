export function formatWithEmojiPreference(text: string, allowEmoji: boolean): string {
  if (allowEmoji) return text;
  // Regex to strip emojis, pictographs, and flags
  return text
    .replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\uFE0F\u200D]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}
