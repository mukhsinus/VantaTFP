const groupNumber = (amount, locale) => {
    const normalized = Number.isFinite(amount) ? Math.round(amount) : 0;
    const numberLocale = locale === 'en' ? 'en-US' : 'ru-RU';
    return new Intl.NumberFormat(numberLocale, {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
        useGrouping: true,
    })
        .format(normalized)
        .replace(/[\u00A0\u202F]/g, ' ');
};
export function formatCurrency(amount, locale) {
    const value = groupNumber(amount, locale);
    if (locale === 'ru') {
        return `${value} сум`;
    }
    if (locale === 'uz') {
        return `${value} so'm`;
    }
    return `${value} UZS`;
}
