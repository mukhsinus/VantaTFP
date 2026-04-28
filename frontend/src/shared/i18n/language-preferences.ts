import i18n from './i18n';

export const SUPPORTED_LANGUAGES = ['ru', 'uz', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const USER_LANGUAGE_PREFIX = 'tfp-lang:user:';

export function toSupportedLanguage(language: string | null | undefined): SupportedLanguage | null {
  if (!language) return null;
  const normalized = language.split('-')[0];
  if (SUPPORTED_LANGUAGES.includes(normalized as SupportedLanguage)) {
    return normalized as SupportedLanguage;
  }
  return null;
}

export function getCurrentSupportedLanguage(): SupportedLanguage {
  return toSupportedLanguage(i18n.resolvedLanguage ?? i18n.language) ?? 'uz';
}

export function getUserLanguage(userId: string): SupportedLanguage | null {
  if (typeof window === 'undefined' || !userId) return null;
  const stored = window.localStorage.getItem(`${USER_LANGUAGE_PREFIX}${userId}`);
  return toSupportedLanguage(stored);
}

export function setUserLanguage(userId: string, language: SupportedLanguage): void {
  if (typeof window === 'undefined' || !userId) return;
  window.localStorage.setItem(`${USER_LANGUAGE_PREFIX}${userId}`, language);
}
