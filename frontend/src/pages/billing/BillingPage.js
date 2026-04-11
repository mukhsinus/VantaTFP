import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, PageSkeleton } from '@shared/components/ui';
import { useBilling, usePlans, useBillingUpgrade } from '@features/billing/hooks/useBilling';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { shouldShowBillingFullSkeleton, sortPlans } from './billing-page.utils';
import styles from './BillingPage.module.css';
/** API requests/hour label for Basic card (aligns with backend default catalog). */
const BASIC_PLAN_API_HR = 100;
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
    if (data.trial_ends_at) {
        return new Date(data.trial_ends_at).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }
    return '—';
}
function buildLimitMessages(data, t) {
    const msgs = [];
    if (data.users_limit != null &&
        data.users_limit > 0 &&
        data.users_used >= data.users_limit) {
        msgs.push(t('billing.alert.users', { defaultValue: 'User seats limit reached.' }));
    }
    if (data.tasks_limit != null &&
        data.tasks_limit > 0 &&
        data.tasks_used >= data.tasks_limit) {
        msgs.push(t('billing.alert.tasks', { defaultValue: 'Task limit reached.' }));
    }
    if (data.api_limit != null &&
        data.api_limit > 0 &&
        data.api_used >= data.api_limit) {
        msgs.push(t('billing.alert.api', { defaultValue: 'API rate limit reached for this hour.' }));
    }
    return msgs;
}
function ProgressRow({ label, used, limit, t, }) {
    const unlimited = limit === null || limit === undefined;
    const p = pctUsed(used, limit);
    return (_jsxs("div", { className: styles.progressBlock, children: [_jsxs("div", { className: styles.progressLabelRow, children: [_jsx("span", { className: styles.progressLabel, children: label }), _jsx("span", { className: styles.progressMeta, children: unlimited
                            ? t('billing.unlimited', { defaultValue: 'Unlimited' })
                            : `${used} / ${limit}` })] }), !unlimited && (_jsx("div", { className: styles.progressTrack, children: _jsx("div", { className: `${styles.progressFill} ${p >= 100 ? styles.progressFillWarning : ''}`, style: { width: `${p}%` } }) }))] }));
}
function PlanCard({ plan, isCurrent, isPro, disabled, canUpgrade, onUpgrade, t, }) {
    return (_jsxs("div", { className: `${styles.planCard} ${isPro ? styles.planCardHighlighted : ''}`, children: [_jsx("h3", { className: styles.planCardName, children: plan.name }), _jsxs("p", { className: styles.planCardPrice, children: ["$", plan.price, _jsx("span", { className: styles.planCardPriceSuffix, children: "/month" })] }), _jsxs("ul", { className: styles.planCardList, children: [plan.name === 'basic' && (_jsxs(_Fragment, { children: [_jsx("li", { children: t('billing.card.usersUpTo', {
                                    count: plan.users,
                                    defaultValue: 'Up to {{count}} users',
                                }) }), _jsx("li", { children: t('billing.card.tasksCount', {
                                    count: plan.tasks,
                                    defaultValue: '{{count}} tasks',
                                }) }), _jsx("li", { children: t('billing.card.apiHr', {
                                    count: BASIC_PLAN_API_HR,
                                    defaultValue: '{{count}} API/hr',
                                }) })] })), plan.name === 'pro' && (_jsxs(_Fragment, { children: [_jsx("li", { children: t('billing.card.usersUpTo', {
                                    count: plan.users,
                                    defaultValue: 'Up to {{count}} users',
                                }) }), _jsx("li", { children: t('billing.card.tasksCount', {
                                    count: plan.tasks,
                                    defaultValue: '{{count}} tasks',
                                }) })] })), plan.name === 'unlimited' && (_jsx("li", { children: t('billing.card.unlimitedLine', { defaultValue: 'Unlimited' }) }))] }), _jsx("div", { className: styles.planCardCta, children: _jsx(Button, { variant: isCurrent ? 'secondary' : 'primary', size: "lg", className: styles.tapButton, disabled: disabled, onClick: () => canUpgrade && !isCurrent && onUpgrade(), style: { width: '100%' }, children: isCurrent
                        ? t('billing.cta.current', { defaultValue: 'Current plan' })
                        : t('billing.cta.upgrade', { defaultValue: 'Upgrade' }) }) })] }));
}
export function BillingPage() {
    const { t } = useTranslation();
    const { isAdmin, isSuperAdmin } = useCurrentUser();
    const { data: billing, isError, error, isPending: billingIsPending, isFetching: billingIsFetching, } = useBilling();
    const plansQuery = usePlans();
    const upgrade = useBillingUpgrade();
    const plansAnchorRef = useRef(null);
    const sortedPlans = useMemo(() => {
        const raw = plansQuery.data;
        const list = Array.isArray(raw) ? raw : [];
        return sortPlans(list);
    }, [plansQuery.data]);
    const currentPlan = billing?.plan?.toLowerCase();
    const canUpgrade = isAdmin && !isSuperAdmin;
    const limitMessages = useMemo(() => (billing ? buildLimitMessages(billing, t) : []), [billing, t]);
    const anyLimitReached = limitMessages.length > 0;
    const showStickyUpgrade = sortedPlans.length > 0 &&
        !plansQuery.isError &&
        !(plansQuery.isFetching && plansQuery.data === undefined) &&
        billing?.plan?.toLowerCase() !== 'platform';
    const scrollToPlans = useCallback(() => {
        plansAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);
    const billingStatusLower = (billing?.status ?? '').toLowerCase();
    const billingPlanLower = billing?.plan?.toLowerCase() ?? '';
    useEffect(() => {
        const lockScroll = billingStatusLower === 'past_due' && billingPlanLower !== 'platform';
        if (!lockScroll)
            return undefined;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, [billingStatusLower, billingPlanLower]);
    if (shouldShowBillingFullSkeleton({
        billingData: billing,
        billingIsError: isError,
        billingIsPending: billingIsPending,
        billingIsFetching: billingIsFetching,
    })) {
        return _jsx(PageSkeleton, {});
    }
    if (isError || !billing) {
        return (_jsx(EmptyState, { title: t('billing.unavailableTitle', { defaultValue: 'Billing unavailable' }), description: error instanceof Error
                ? error.message
                : t('billing.unavailableDesc', { defaultValue: 'Could not load billing info.' }) }));
    }
    const data = billing;
    const statusLower = (data.status ?? '').toLowerCase();
    const isTrial = statusLower === 'trial';
    const isPastDue = statusLower === 'past_due';
    const isPlatform = data.plan.toLowerCase() === 'platform';
    const daysLeft = isTrial && data.trial_ends_at ? trialDaysLeft(data.trial_ends_at) : null;
    const trialBannerText = daysLeft !== null
        ? daysLeft === 0
            ? t('billing.trial.bannerLastDay', { defaultValue: 'Free trial — ends today' })
            : t('billing.trial.bannerDays', {
                count: daysLeft,
                defaultValue: 'Free trial — {{count}} days left',
            })
        : '';
    const pastDueModal = isPastDue && !isPlatform
        ? createPortal(_jsxs("div", { className: styles.billingPastDueOverlay, role: "presentation", children: [_jsx("div", { className: styles.billingPastDueBackdrop, "aria-hidden": true }), _jsxs("div", { className: styles.billingPastDuePanel, role: "alertdialog", "aria-modal": "true", "aria-labelledby": "billing-past-due-title", children: [_jsx("p", { id: "billing-past-due-title", className: styles.billingPastDueTitle, children: t('billing.trial.expiredMessage', {
                                defaultValue: 'Your trial has expired. Upgrade to continue.',
                            }) }), _jsx(Button, { type: "button", variant: "primary", size: "lg", className: styles.tapButton, onClick: scrollToPlans, children: t('billing.trial.upgradeCta', { defaultValue: 'Upgrade' }) })] })] }), document.body)
        : null;
    return (_jsxs("div", { className: `page-container ${styles.billingContainer} ${showStickyUpgrade ? styles.pageRootStickyPad : ''}`, children: [pastDueModal, isTrial && trialBannerText && (_jsxs("div", { className: styles.billingTrialBanner, role: "status", children: [_jsx("span", { className: styles.billingTrialBannerIcon, "aria-hidden": true, children: _jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("path", { d: "M12 6v6l4 2" })] }) }), _jsx("span", { children: trialBannerText })] })), _jsxs("header", { className: styles.header, children: [_jsx("h1", { className: styles.title, children: t('billing.title', { defaultValue: 'Billing' }) }), _jsx("p", { className: styles.subtitle, children: t('billing.subtitle', {
                            defaultValue: 'Manage your subscription, usage, and payment details in one place.',
                        }) })] }), _jsxs("div", { className: styles.billingMainGrid, children: [_jsxs("section", { ref: plansAnchorRef, id: "billing-plans-anchor", "aria-labelledby": "billing-plans-heading", children: [_jsx("h2", { id: "billing-plans-heading", className: styles.sectionLabel, children: t('billing.section.plans', { defaultValue: 'Plans' }) }), plansQuery.isFetching && plansQuery.data === undefined && !plansQuery.isError && (_jsx("div", { className: styles.plansLoading, children: t('common.loading', { defaultValue: 'Loading…' }) })), plansQuery.isError && (_jsx("div", { className: styles.plansLoading, role: "alert", children: t('billing.plansError', { defaultValue: 'Could not load plans.' }) })), sortedPlans.length > 0 && (_jsx("div", { className: styles.plansScroll, children: sortedPlans.map((plan) => {
                                    const id = plan.name;
                                    const isCurrent = !isPlatform && currentPlan === id;
                                    const isPro = id === 'pro';
                                    const disabled = upgrade.isPending || isCurrent || isPlatform || !canUpgrade;
                                    return (_jsx(PlanCard, { plan: plan, isCurrent: isCurrent, isPro: isPro, disabled: disabled, canUpgrade: canUpgrade, onUpgrade: () => upgrade.mutate(id), t: t }, plan.name));
                                }) })), !plansQuery.isFetching && !plansQuery.isError && sortedPlans.length === 0 && (_jsx("div", { className: styles.plansLoading, role: "status", children: t('billing.plansEmpty', { defaultValue: 'No plans available.' }) })), upgrade.isError && (_jsx("p", { className: styles.upgradeError, children: upgrade.error instanceof Error
                                    ? upgrade.error.message
                                    : t('billing.upgradeFailed', { defaultValue: 'Upgrade failed' }) }))] }), _jsxs("aside", { className: styles.usageBlock, "aria-labelledby": "current-plan-heading", children: [_jsx("h2", { id: "current-plan-heading", className: styles.currentPanelTitle, children: t('billing.section.current', { defaultValue: 'Current plan' }) }), _jsx("p", { className: styles.planNameDisplay, children: isPlatform ? 'Platform' : data.plan }), _jsx(ProgressRow, { label: t('billing.usage.users', { defaultValue: 'Users' }), used: data.users_used, limit: isPlatform ? null : data.users_limit, t: t }), _jsx(ProgressRow, { label: t('billing.usage.tasks', { defaultValue: 'Tasks' }), used: data.tasks_used, limit: isPlatform ? null : data.tasks_limit, t: t }), _jsx(ProgressRow, { label: t('billing.usage.api', { defaultValue: 'API (this hour)' }), used: data.api_used, limit: isPlatform ? null : data.api_limit, t: t }), _jsx("hr", { className: styles.divider }), _jsxs("div", { className: styles.metaRow, children: [_jsx("span", { className: styles.metaKey, children: t('billing.renewal', { defaultValue: 'Renewal date' }) }), _jsx("span", { className: styles.metaVal, children: isPlatform ? '—' : formatRenewal(data, t) })] }), _jsxs("div", { className: styles.metaRow, children: [_jsx("span", { className: styles.metaKey, children: t('billing.paymentMethod', { defaultValue: 'Payment method' }) }), _jsx("span", { className: styles.metaVal, children: isPlatform ? '—' : t('billing.paymentFake', { defaultValue: 'Visa •••• 4242' }) })] })] })] }), _jsxs("section", { className: styles.overviewSection, "aria-labelledby": "subscription-overview-heading", children: [_jsx("h2", { id: "subscription-overview-heading", className: styles.overviewTitle, children: t('billing.section.overview', { defaultValue: 'Subscription overview' }) }), _jsx("div", { className: styles.overviewCard, children: _jsxs("div", { className: styles.overviewGrid, children: [_jsxs("div", { children: [_jsx("p", { className: styles.overviewItemTitle, children: t('billing.cycle', { defaultValue: 'Billing cycle' }) }), _jsx("p", { className: styles.overviewItemValue, children: t('billing.cycleMonthly', { defaultValue: 'Monthly' }) })] }), _jsxs("div", { children: [_jsx("p", { className: styles.overviewItemTitle, children: t('billing.nextPayment', { defaultValue: 'Next payment' }) }), _jsx("p", { className: styles.overviewItemValue, children: isPlatform ? '—' : data.trial_ends_at ? formatRenewal(data, t) : '—' })] }), _jsxs("div", { children: [_jsx("p", { className: styles.overviewItemTitle, children: t('billing.history', { defaultValue: 'Billing history' }) }), _jsx("div", { className: styles.historyPlaceholder, children: t('billing.historyEmpty', { defaultValue: 'No invoices yet.' }) })] })] }) })] }), anyLimitReached && !isPlatform && (_jsx("div", { className: styles.limitAlert, role: "alert", children: limitMessages.join(' ') })), _jsxs("section", { className: styles.securitySection, "aria-labelledby": "billing-security-heading", children: [_jsx("h2", { id: "billing-security-heading", className: styles.overviewTitle, children: t('billing.section.security', { defaultValue: 'Security' }) }), _jsxs("div", { className: styles.securityCard, children: [_jsx("div", { className: styles.securityIcon, "aria-hidden": true, children: _jsxs("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.75", children: [_jsx("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" }), _jsx("path", { d: "M9 12l2 2 4-4" })] }) }), _jsxs("div", { children: [_jsx("p", { className: styles.securityTitle, children: t('billing.security.title', { defaultValue: 'Your workspace is protected' }) }), _jsx("p", { className: styles.securityText, children: t('billing.security.body', {
                                            defaultValue: 'Payments are processed securely. We never store full card numbers on our servers. Two-factor authentication and role-based access help keep your data safe.',
                                        }) })] })] })] }), showStickyUpgrade && !isPlatform && (_jsx("div", { className: styles.stickyUpgrade, children: _jsx(Button, { type: "button", variant: "primary", size: "lg", className: styles.stickyUpgradeButton, onClick: scrollToPlans, children: t('billing.cta.stickyUpgrade', { defaultValue: 'Upgrade Plan' }) }) }))] }));
}
