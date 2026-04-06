import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './LanguageSwitcher.module.css';

const LANGUAGES = [
  { code: 'ru', labelKey: 'common.languages.ru' },
  { code: 'uz', labelKey: 'common.languages.uz' },
  { code: 'en', labelKey: 'common.languages.en' },
] as const;

interface LanguageSwitcherProps {
  fullWidth?: boolean;
}

export function LanguageSwitcher({ fullWidth = false }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();
  const activeLanguage = (i18n.resolvedLanguage ?? i18n.language ?? 'ru').split('-')[0];

  const changeLanguage = (lang: 'ru' | 'uz' | 'en') => {
    void i18n.changeLanguage(lang);
  };

  return (
    <div
      className={`${styles.switcher} ${fullWidth ? styles.fullWidth : ''}`}
      role="group"
      aria-label={t('common.languageSwitcher')}
    >
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => changeLanguage(lang.code)}
          className={`${styles.button} ${activeLanguage === lang.code ? styles.buttonActive : ''}`}
          aria-pressed={activeLanguage === lang.code}
        >
          {t(lang.labelKey)}
        </button>
      ))}
    </div>
  );
}
