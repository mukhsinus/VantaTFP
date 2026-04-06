import { jsx as _jsx } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import styles from './LanguageSwitcher.module.css';
const LANGUAGES = [
    { code: 'ru', labelKey: 'common.languages.ru' },
    { code: 'uz', labelKey: 'common.languages.uz' },
    { code: 'en', labelKey: 'common.languages.en' },
];
export function LanguageSwitcher({ fullWidth = false }) {
    const { t, i18n } = useTranslation();
    const activeLanguage = (i18n.resolvedLanguage ?? i18n.language ?? 'ru').split('-')[0];
    const changeLanguage = (lang) => {
        void i18n.changeLanguage(lang);
    };
    return (_jsx("div", { className: `${styles.switcher} ${fullWidth ? styles.fullWidth : ''}`, role: "group", "aria-label": t('common.languageSwitcher'), children: LANGUAGES.map((lang) => (_jsx("button", { type: "button", onClick: () => changeLanguage(lang.code), className: `${styles.button} ${activeLanguage === lang.code ? styles.buttonActive : ''}`, "aria-pressed": activeLanguage === lang.code, children: t(lang.labelKey) }, lang.code))) }));
}
