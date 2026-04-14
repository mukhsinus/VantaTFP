import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, PageSkeleton } from '@shared/components/ui';
import { useBilling, useBillingUpgrade } from '@features/billing/hooks/useBilling';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import styles from './BillingPage.module.css';
function trialDaysLeft(trialEndsAt) {
    if (!trialEndsAt)
        return 0;
    const end = new Date(trialEndsAt);
    const diffMs = end.getTime() - Date.now();
    return Math.max(0, Math.ceil(diffMs / 86_400_000));
}
function pctUsed(used, limit) {
    if (limit === null || limit === undefined || limit <= 0)
        return 0;
    return Math.min(100, (used / limit) * 100);
}
function formatRenewal(data, t) {
    const value = data.renewal_date ?? data.trial_ends_at;
    if (value) {
        return new Date(value).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }
    return '—';
}
function buildLimitMessages(data, t) {
    const msgs = [];
    if (data.limits.users != null &&
        data.limits.users > 0 &&
        data.usage.users >= data.limits.users) {
        msgs.push(t('billing.alert.users', { defaultValue: 'User seats limit reached.' }));
    }
    if (data.limits.tasks != null &&
        data.limits.tasks > 0 &&
        data.usage.tasks >= data.limits.tasks) {
        msgs.push(t('billing.alert.tasks', { defaultValue: 'Task limit reached.' }));
    }
    if (data.limits.api_rate_per_hour != null &&
        data.limits.api_rate_per_hour > 0 &&
        data.usage.api_requests >= data.limits.api_rate_per_hour) {
        msgs.push(t('billing.alert.api', { defaultValue: 'API rate limit reached for this hour.' }));
    }
    return msgs;
}
function ProgressRow({ label, used, limit, t, }) {
    const hasLimit = limit !== null && limit !== undefined;
    const p = pctUsed(used, limit);
    return (_jsxs("div", { className: styles.progressBlock, children: [_jsxs("div", { className: styles.progressLabelRow, children: [_jsx("span", { className: styles.progressLabel, children: label }), _jsx("span", { className: styles.progressMeta, children: hasLimit ? `${used} / ${limit}` : t('common.states.notAvailable', { defaultValue: '—' }) })] }), hasLimit && (_jsx("div", { className: styles.progressTrack, children: _jsx("div", { className: `${styles.progressFill} ${p >= 100 ? styles.progressFillWarning : ''}`, style: { width: `${p}%` } }) }))] }));
}
function PlanCard({ plan, pendingPaymentExists, isCurrent, canUpgrade, onUpgrade, t, }) {
    const isPro = plan.name === 'pro';
    const disabled = pendingPaymentExists || isCurrent || !canUpgrade;
    const ctaLabel = pendingPaymentExists
        ? t('billing.cta.pendingApproval', { defaultValue: 'Pending approval' })
        : isCurrent
            ? t('billing.cta.current', { defaultValue: 'Current plan' })
            : t('billing.cta.requestUpgrade', { defaultValue: 'Request upgrade' });
    const usersLabel = t('billing.card.usersUpTo', {
        count: plan.users,
        defaultValue: 'Up to {{count}} users',
    });
    const tasksLabel = t('billing.card.tasksCount', {
        count: plan.tasks,
        defaultValue: '{{count}} tasks',
    });
    return (_jsxs("div", { className: `${styles.planCard} ${isPro ? styles.planCardHighlighted : ''}`, children: [_jsx("h3", { className: styles.planCardName, children: plan.name }), _jsxs("p", { className: styles.planCardPrice, children: ["$", plan.price, _jsx("span", { className: styles.planCardPriceSuffix, children: "/month" })] }), _jsxs("ul", { className: styles.planCardList, children: [_jsx("li", { children: usersLabel }), _jsx("li", { children: tasksLabel })] }), _jsx("div", { className: styles.planCardCta, children: _jsx(Button, { variant: isCurrent || pendingPaymentExists ? 'secondary' : 'primary', size: "lg", className: styles.tapButton, disabled: disabled, onClick: () => !disabled && onUpgrade(), style: { width: '100%' }, children: ctaLabel }) })] }));
}
export function BillingPage() {
    const { t } = useTranslation();
    const { isAdmin, isSuperAdmin } = useCurrentUser();
    const { data: billing, isError, error, isPending: billingIsPending, isFetching: billingIsFetching, } = useBilling();
    const upgrade = useBillingUpgrade();
    const currentPlan = billing?.plan?.name?.toLowerCase();
    const canUpgrade = isAdmin && !isSuperAdmin;
    const limitMessages = useMemo(() => (billing ? buildLimitMessages(billing, t) : []), [billing, t]);
    const anyLimitReached = limitMessages.length > 0;
    if ((billingIsPending || billingIsFetching) && !billing) {
        return _jsx(PageSkeleton, {});
    }
    if (isError || !billing) {
        return (_jsx(EmptyState, { title: t('billing.unavailableTitle', { defaultValue: 'Billing temporarily unavailable' }), description: error instanceof Error
                ? error.message
                : t('billing.unavailableDesc', { defaultValue: 'Billing temporarily unavailable' }) }));
    }
    const data = billing;
    const statusLower = (data.status ?? '').toLowerCase();
    const isTrial = statusLower === 'trial';
    const isPastDue = statusLower === 'past_due';
    const isPlatform = data.plan.name.toLowerCase() === 'platform';
    const pendingApproval = data.pending_payment?.status === 'pending';
    const daysLeft = isTrial && data.trial_ends_at ? trialDaysLeft(data.trial_ends_at) : null;
    const plans = Array.isArray(data.available_plans) ? data.available_plans : [];
    const trialBannerText = daysLeft === null
        ? null
        : daysLeft === 0
            ? t('billing.trial.bannerLastDay', { defaultValue: 'Free trial — ends today' })
            : t('billing.trial.bannerDays', {
                count: daysLeft,
                defaultValue: 'Free trial — {{count}} days left',
            });
    return (_jsxs("div", { className: `page-container ${styles.billingContainer}`, children: [isTrial && trialBannerText && (_jsxs("div", { className: styles.billingTrialBanner, role: "status", children: [_jsx("span", { className: styles.billingTrialBannerIcon, "aria-hidden": true, children: _jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("path", { d: "M12 6v6l4 2" })] }) }), _jsx("span", { children: trialBannerText })] })), isPastDue && !isPlatform && (_jsx("div", { className: styles.limitAlert, role: "alert", children: t('billing.trial.expiredRequired', { defaultValue: 'Trial expired — upgrade required' }) })), pendingApproval && data.pending_payment && (_jsxs("div", { className: styles.billingTrialBanner, role: "status", children: [_jsx("span", { children: t('billing.pendingApproval', {
                            defaultValue: 'Waiting for approval from super admin',
                        }) }), _jsxs("span", { children: [' ', t('billing.pendingRequested', {
                                defaultValue: 'Requested: {{plan}} (pending approval)',
                                plan: data.pending_payment.plan,
                            })] }), _jsxs("span", { children: [' ', t('billing.pendingAwaitingAdmin', {
                                defaultValue: 'Awaiting approval by system administrator',
                            })] })] })), _jsxs("header", { className: styles.header, children: [_jsx("h1", { className: styles.title, children: t('billing.title', { defaultValue: 'Billing' }) }), _jsx("p", { className: styles.subtitle, children: t('billing.subtitle', {
                            defaultValue: 'Manage your subscription, usage, and payment details in one place.',
                        }) })] }), _jsxs("div", { className: styles.billingMainGrid, children: [_jsxs("section", { id: "billing-plans-anchor", "aria-labelledby": "billing-plans-heading", children: [_jsx("h2", { id: "billing-plans-heading", className: styles.sectionLabel, children: t('billing.section.plans', { defaultValue: 'Plans' }) }), plans.length > 0 ? (_jsx("div", { className: styles.plansScroll, children: plans.map((plan) => {
                                    const id = plan.name;
                                    const isCurrent = !isPlatform && currentPlan === id;
                                    return (_jsx(PlanCard, { plan: plan, pendingPaymentExists: pendingApproval, isCurrent: isCurrent, canUpgrade: canUpgrade && !isPlatform && !upgrade.isPending, onUpgrade: () => upgrade.mutate(id), t: t }, plan.name));
                                }) })) : (_jsx("div", { className: styles.plansLoading, role: "status", children: t('billing.plansEmpty', { defaultValue: 'No plans available.' }) })), upgrade.isError && (_jsx("p", { className: styles.upgradeError, children: upgrade.error instanceof Error
                                    ? upgrade.error.message
                                    : t('billing.upgradeFailed', { defaultValue: 'Upgrade failed' }) }))] }), _jsxs("aside", { className: styles.usageBlock, "aria-labelledby": "current-plan-heading", children: [_jsx("h2", { id: "current-plan-heading", className: styles.currentPanelTitle, children: t('billing.section.current', { defaultValue: 'Current plan' }) }), _jsx("p", { className: styles.planNameDisplay, children: isPlatform ? 'Platform' : data.plan.name }), _jsx(ProgressRow, { label: t('billing.usage.users', { defaultValue: 'Users' }), used: data.usage.users, limit: isPlatform ? null : data.limits.users, t: t }), _jsx(ProgressRow, { label: t('billing.usage.tasks', { defaultValue: 'Tasks' }), used: data.usage.tasks, limit: isPlatform ? null : data.limits.tasks, t: t }), _jsx(ProgressRow, { label: t('billing.usage.api', { defaultValue: 'API (this hour)' }), used: data.usage.api_requests, limit: isPlatform ? null : data.limits.api_rate_per_hour, t: t }), _jsx("hr", { className: styles.divider }), _jsxs("div", { className: styles.metaRow, children: [_jsx("span", { className: styles.metaKey, children: t('billing.renewal', { defaultValue: 'Renewal date' }) }), _jsx("span", { className: styles.metaVal, children: isPlatform ? '—' : formatRenewal(data, t) })] }), _jsxs("div", { className: styles.metaRow, children: [_jsx("span", { className: styles.metaKey, children: t('billing.paymentMethod', { defaultValue: 'Payment method' }) }), _jsx("span", { className: styles.metaVal, children: isPlatform ? '—' : data.payment_method ?? '—' })] })] })] }), _jsxs("section", { className: styles.overviewSection, "aria-labelledby": "subscription-overview-heading", children: [_jsx("h2", { id: "subscription-overview-heading", className: styles.overviewTitle, children: t('billing.section.overview', { defaultValue: 'Subscription overview' }) }), _jsx("div", { className: styles.overviewCard, children: _jsxs("div", { className: styles.overviewGrid, children: [_jsxs("div", { children: [_jsx("p", { className: styles.overviewItemTitle, children: t('billing.cycle', { defaultValue: 'Billing cycle' }) }), _jsx("p", { className: styles.overviewItemValue, children: t('billing.cycleMonthly', { defaultValue: 'Monthly' }) })] }), _jsxs("div", { children: [_jsx("p", { className: styles.overviewItemTitle, children: t('billing.nextPayment', { defaultValue: 'Next payment' }) }), _jsx("p", { className: styles.overviewItemValue, children: isPlatform ? '—' : formatRenewal(data, t) })] }), _jsxs("div", { children: [_jsx("p", { className: styles.overviewItemTitle, children: t('billing.history', { defaultValue: 'Billing history' }) }), _jsx("div", { className: styles.historyPlaceholder, children: t('billing.historyEmpty', { defaultValue: 'No invoices yet.' }) })] })] }) })] }), anyLimitReached && !isPlatform && (_jsx("div", { className: styles.limitAlert, role: "alert", children: limitMessages.join(' ') })), _jsxs("section", { className: styles.securitySection, "aria-labelledby": "billing-security-heading", children: [_jsx("h2", { id: "billing-security-heading", className: styles.overviewTitle, children: t('billing.section.security', { defaultValue: 'Security' }) }), _jsxs("div", { className: styles.securityCard, children: [_jsx("div", { className: styles.securityIcon, "aria-hidden": true, children: _jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.75", children: [_jsx("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" }), _jsx("path", { d: "M9 12l2 2 4-4" })] }) }), _jsxs("div", { children: [_jsx("p", { className: styles.securityTitle, children: t('billing.security.title', { defaultValue: 'Your workspace is protected' }) }), _jsx("p", { className: styles.securityText, children: t('billing.security.body', {
                                            defaultValue: 'Payments are processed securely. We never store full card numbers on our servers. Two-factor authentication and role-based access help keep your data safe.',
                                        }) })] })] })] })] }));
}
