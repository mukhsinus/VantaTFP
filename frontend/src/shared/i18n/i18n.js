import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ru from './locales/ru.json';
import uz from './locales/uz.json';
const LANG_STORAGE_KEY = 'lang';
const SUPPORTED_LANGUAGES = ['ru', 'uz', 'en'];
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function mergeWithFallback(base, overrides) {
    const result = { ...base };
    Object.entries(overrides).forEach(([key, value]) => {
        const baseValue = result[key];
        if (isRecord(baseValue) && isRecord(value)) {
            result[key] = mergeWithFallback(baseValue, value);
            return;
        }
        result[key] = value;
    });
    return result;
}
function getInitialLanguage() {
    if (typeof window === 'undefined')
        return 'ru';
    const storedLanguage = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (storedLanguage && SUPPORTED_LANGUAGES.includes(storedLanguage)) {
        return storedLanguage;
    }
    return 'ru';
}
const initialLanguage = getInitialLanguage();
const ruTranslation = mergeWithFallback(en, ru);
const uzTranslation = mergeWithFallback(en, uz);
i18n.use(initReactI18next).init({
    lng: initialLanguage,
    fallbackLng: 'en',
    resources: {
        ru: { translation: ruTranslation },
        uz: { translation: uzTranslation },
        en: { translation: en },
    },
    interpolation: {
        escapeValue: false,
    },
});
if (typeof window !== 'undefined') {
    window.localStorage.setItem(LANG_STORAGE_KEY, initialLanguage);
    i18n.on('languageChanged', (lang) => {
        window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    });
}
export default i18n;
