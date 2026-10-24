import { Language } from '../types';

export function detectUserLanguage(): Language {
  // 1. Check if user already has an explicit preference saved
  try {
    const saved = localStorage.getItem('masterai_lang');
    if (saved && (saved === 'tr' || saved === 'en' || saved === 'de' || saved === 'es')) {
      return saved as Language;
    }
  } catch {}

  // 2. Check browser languages (navigator.languages and navigator.language)
  try {
    const navLangs = navigator.languages ? [...navigator.languages] : [];
    if (navigator.language) navLangs.push(navigator.language);

    for (const l of navLangs) {
      const code = l.toLowerCase().slice(0, 2);
      if (code === 'tr') return 'tr';
      if (code === 'de') return 'de';
      if (code === 'es') return 'es';
      if (code === 'en') return 'en';
    }
  } catch {}

  // 3. Check Location / TimeZone Heuristic
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone.toLowerCase();
    if (tz.includes('istanbul') || tz.includes('turkey') || tz.includes('ankara')) {
      return 'tr';
    }
    if (tz.includes('berlin') || tz.includes('vienna') || tz.includes('zurich')) {
      return 'de';
    }
    if (
      tz.includes('madrid') ||
      tz.includes('buenos_aires') ||
      tz.includes('mexico') ||
      tz.includes('bogota') ||
      tz.includes('santiago') ||
      tz.includes('lima')
    ) {
      return 'es';
    }
  } catch {}

  // Fallback default
  return 'tr';
}
