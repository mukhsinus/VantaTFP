import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useBilling } from '@features/billing/hooks/useBilling';
import { Button } from '@shared/components/ui';
import styles from './TenantTrialExperience.module.css';
function trialDaysLeft(trialEndsAt) {
    if (!trialEndsAt)
        return 0;
    const end = new Date(trialEndsAt);
    const diffMs = end.getTime() - Date.now();
    return Math.max(0, Math.ceil(diffMs / 86_400_000));
}
/**
 * Trial banner + expired-trial blocking modal for tenant workspaces (uses GET /billing/current).
 */
export function TenantTrialExperience() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    /**
     * Must not pass `enabled: false` here: this hook shares `billingKeys.current()` with BillingPage
     * and other callers. A false observer would block the shared query and leave billing stuck loading.
     */
    const { data, isSuccess } = useBilling();
    const status = data?.status?.toLowerCase() ?? '';
    const isTrial = isSuccess && status === 'trial';
    const isPastDue = isSuccess && status === 'past_due';
    const daysLeft = useMemo(() => (isTrial && data?.trial_ends_at ? trialDaysLeft(data.trial_ends_at) : null), [isTrial, data?.trial_ends_at]);
    const trialLabel = useMemo(() => {
        if (daysLeft === null)
            return '';
        if (daysLeft === 0) {
            return t('billing.trial.bannerLastDay', { defaultValue: 'Free trial — ends today' });
        }
        return t('billing.trial.bannerDays', {
            count: daysLeft,
            defaultValue: 'Free trial — {{count}} days left',
        });
    }, [daysLeft, t]);
    useEffect(() => {
        if (isPastDue) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
            };
        }
        return undefined;
    }, [isPastDue]);
    const modal = isPastDue ? (createPortal(_jsxs("div", { className: styles.modalRoot, role: "presentation", children: [_jsx("div", { className: styles.modalBackdrop, "aria-hidden": true }), _jsxs("div", { className: styles.modalPanel, role: "alertdialog", "aria-modal": "true", "aria-labelledby": "trial-expired-title", children: [_jsx("p", { id: "trial-expired-title", className: styles.modalTitle, children: t('billing.trial.expiredMessage', {
                            defaultValue: 'Your trial has expired. Upgrade to continue.',
                        }) }), _jsx(Button, { type: "button", variant: "primary", size: "lg", className: styles.modalCta, onClick: () => navigate('/billing'), children: t('billing.trial.upgradeCta', { defaultValue: 'Upgrade' }) })] })] }), document.body)) : null;
    return (_jsxs(_Fragment, { children: [isTrial && trialLabel && (_jsxs("div", { className: styles.trialBanner, role: "status", children: [_jsx("span", { className: styles.trialBannerIcon, "aria-hidden": true, children: _jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("path", { d: "M12 6v6l4 2" })] }) }), _jsx("span", { className: styles.trialBannerText, children: trialLabel })] })), modal] }));
}
