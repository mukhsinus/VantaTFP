import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Button, EmptyState, PageSkeleton } from '@shared/components/ui';
import { useBilling, usePlans, useBillingUpgrade } from '@features/billing/hooks/useBilling';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import type { BillingCurrentDto, BillingPlanCatalogItem, BillingPlanId } from '@entities/billing/billing.types';
import { shouldShowBillingFullSkeleton, sortPlans } from './billing-page.utils';
import styles from './BillingPage.module.css';

function trialDaysLeft(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0;
  const end = new Date(trialEndsAt);
  const diffMs = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / 86_400_000));
}

function pctUsed(used: number, limit: number | null | undefined): number {
  if (limit === null || limit === undefined || limit <= 0) return 0;
  return Math.min(100, (used / limit) * 100);
}

function formatRenewal(data: BillingCurrentDto, t: (k: string, o?: { defaultValue?: string }) => string): string {
  if (data.trial_ends_at) {
    return new Date(data.trial_ends_at).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  return '—';
}

function buildLimitMessages(data: BillingCurrentDto, t: (k: string, o?: { defaultValue?: string }) => string): string[] {
  const msgs: string[] = [];
  if (
    data.limits.users != null &&
    data.limits.users > 0 &&
    data.usage.users >= data.limits.users
  ) {
    msgs.push(t('billing.alert.users', { defaultValue: 'User seats limit reached.' }));
  }
  if (
    data.limits.tasks != null &&
    data.limits.tasks > 0 &&
    data.usage.tasks >= data.limits.tasks
  ) {
    msgs.push(t('billing.alert.tasks', { defaultValue: 'Task limit reached.' }));
  }
  if (
    data.limits.api_rate_per_hour != null &&
    data.limits.api_rate_per_hour > 0 &&
    data.usage.api_requests >= data.limits.api_rate_per_hour
  ) {
    msgs.push(t('billing.alert.api', { defaultValue: 'API rate limit reached for this hour.' }));
  }
  return msgs;
}

function ProgressRow({
  label,
  used,
  limit,
  t,
}: {
  label: string;
  used: number;
  limit: number | null;
  t: (k: string, o?: { defaultValue?: string }) => string;
}) {
  const unlimited = limit === null || limit === undefined;
  const p = pctUsed(used, limit);

  return (
    <div className={styles.progressBlock}>
      <div className={styles.progressLabelRow}>
        <span className={styles.progressLabel}>{label}</span>
        <span className={styles.progressMeta}>
          {unlimited
            ? t('billing.unlimited', { defaultValue: 'Unlimited' })
            : `${used} / ${limit}`}
        </span>
      </div>
      {!unlimited && (
        <div className={styles.progressTrack}>
          <div
            className={`${styles.progressFill} ${p >= 100 ? styles.progressFillWarning : ''}`}
            style={{ width: `${p}%` }}
          />
        </div>
      )}
    </div>
  );
}

function PlanCard({
  plan,
  isCurrent,
  isPro,
  disabled,
  canUpgrade,
  onUpgrade,
  t,
}: {
  plan: BillingPlanCatalogItem;
  isCurrent: boolean;
  isPro: boolean;
  disabled: boolean;
  canUpgrade: boolean;
  onUpgrade: () => void;
  t: (k: string, o?: { defaultValue?: string; count?: number }) => string;
}) {
  return (
    <div className={`${styles.planCard} ${isPro ? styles.planCardHighlighted : ''}`}>
      <h3 className={styles.planCardName}>{plan.name}</h3>
      <p className={styles.planCardPrice}>
        ${plan.price}
        <span className={styles.planCardPriceSuffix}>/month</span>
      </p>
      <ul className={styles.planCardList}>
        {plan.name === 'basic' && (
          <>
            <li>
              {t('billing.card.usersUpTo', {
                count: plan.users,
                defaultValue: 'Up to {{count}} users',
              })}
            </li>
            <li>
              {t('billing.card.tasksCount', {
                count: plan.tasks,
                defaultValue: '{{count}} tasks',
              })}
            </li>
          </>
        )}
        {(plan.name === 'pro' || plan.name === 'business') && (
          <>
            <li>
              {t('billing.card.usersUpTo', {
                count: plan.users,
                defaultValue: 'Up to {{count}} users',
              })}
            </li>
            <li>
              {t('billing.card.tasksCount', {
                count: plan.tasks,
                defaultValue: '{{count}} tasks',
              })}
            </li>
          </>
        )}
        {plan.name === 'enterprise' && (
          <li>{t('billing.card.unlimitedLine', { defaultValue: 'Unlimited users and tasks' })}</li>
        )}
      </ul>
      <div className={styles.planCardCta}>
        <Button
          variant={isCurrent ? 'secondary' : 'primary'}
          size="lg"
          className={styles.tapButton}
          disabled={disabled}
          onClick={() => canUpgrade && !isCurrent && onUpgrade()}
          style={{ width: '100%' }}
        >
          {isCurrent
            ? t('billing.cta.current', { defaultValue: 'Current plan' })
            : t('billing.cta.upgrade', { defaultValue: 'Upgrade' })}
        </Button>
      </div>
    </div>
  );
}

export function BillingPage() {
  const { t } = useTranslation();
  const { isAdmin, isSuperAdmin } = useCurrentUser();
  const {
    data: billing,
    isError,
    error,
    isPending: billingIsPending,
    isFetching: billingIsFetching,
  } = useBilling();
  const plansQuery = usePlans();
  const upgrade = useBillingUpgrade();
  const plansAnchorRef = useRef<HTMLElement | null>(null);

  const sortedPlans = useMemo(() => {
    const raw = plansQuery.data;
    const list = Array.isArray(raw) ? raw : [];
    return sortPlans(list as BillingPlanCatalogItem[]);
  }, [plansQuery.data]);

  const currentPlan = billing?.plan?.name?.toLowerCase() as BillingPlanId | 'platform';
  const canUpgrade = isAdmin && !isSuperAdmin;

  const limitMessages = useMemo(() => (billing ? buildLimitMessages(billing, t) : []), [billing, t]);
  const anyLimitReached = limitMessages.length > 0;

  const showStickyUpgrade =
    sortedPlans.length > 0 &&
    !plansQuery.isError &&
    !(plansQuery.isFetching && plansQuery.data === undefined) &&
    billing?.plan?.name?.toLowerCase() !== 'platform';

  const scrollToPlans = useCallback(() => {
    plansAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const billingStatusLower = (billing?.status ?? '').toLowerCase();
  const billingPlanLower = billing?.plan?.name?.toLowerCase() ?? '';
  useEffect(() => {
    const lockScroll = billingStatusLower === 'past_due' && billingPlanLower !== 'platform';
    if (!lockScroll) return undefined;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [billingStatusLower, billingPlanLower]);

  if (
    shouldShowBillingFullSkeleton({
      billingData: billing,
      billingIsError: isError,
      billingIsPending: billingIsPending,
      billingIsFetching: billingIsFetching,
    })
  ) {
    return <PageSkeleton />;
  }

  if (isError || !billing) {
    return (
      <EmptyState
        title={t('billing.unavailableTitle', { defaultValue: 'Billing unavailable' })}
        description={
          error instanceof Error
            ? error.message
            : t('billing.unavailableDesc', { defaultValue: 'Could not load billing info.' })
        }
      />
    );
  }

  const data = billing;
  const statusLower = (data.status ?? '').toLowerCase();
  const isTrial = statusLower === 'trial';
  const isPastDue = statusLower === 'past_due';
  const isPlatform = data.plan.name.toLowerCase() === 'platform';
  const pendingApproval = data.pending_payment?.status === 'pending';
  const daysLeft = isTrial && data.trial_ends_at ? trialDaysLeft(data.trial_ends_at) : null;

  const trialBannerText =
    daysLeft !== null
      ? daysLeft === 0
        ? t('billing.trial.bannerLastDay', { defaultValue: 'Free trial — ends today' })
        : t('billing.trial.bannerDays', {
            count: daysLeft,
            defaultValue: 'Free trial — {{count}} days left',
          })
      : '';

  const pastDueModal =
    isPastDue && !isPlatform
      ? createPortal(
          <div className={styles.billingPastDueOverlay} role="presentation">
            <div className={styles.billingPastDueBackdrop} aria-hidden />
            <div
              className={styles.billingPastDuePanel}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="billing-past-due-title"
            >
              <p id="billing-past-due-title" className={styles.billingPastDueTitle}>
                {t('billing.trial.expiredMessage', {
                  defaultValue: 'Your trial has expired. Upgrade to continue.',
                })}
              </p>
              <Button type="button" variant="primary" size="lg" className={styles.tapButton} onClick={scrollToPlans}>
                {t('billing.trial.upgradeCta', { defaultValue: 'Upgrade' })}
              </Button>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className={`page-container ${styles.billingContainer} ${showStickyUpgrade ? styles.pageRootStickyPad : ''}`}>
      {pastDueModal}

      {isTrial && trialBannerText && (
        <div className={styles.billingTrialBanner} role="status">
          <span className={styles.billingTrialBannerIcon} aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </span>
          <span>{trialBannerText}</span>
        </div>
      )}

      <header className={styles.header}>
        <h1 className={styles.title}>{t('billing.title', { defaultValue: 'Billing' })}</h1>
        <p className={styles.subtitle}>
          {t('billing.subtitle', {
            defaultValue: 'Manage your subscription, usage, and payment details in one place.',
          })}
        </p>
      </header>

      <div className={styles.billingMainGrid}>
        <section ref={plansAnchorRef} id="billing-plans-anchor" aria-labelledby="billing-plans-heading">
          <h2 id="billing-plans-heading" className={styles.sectionLabel}>
            {t('billing.section.plans', { defaultValue: 'Plans' })}
          </h2>
          {plansQuery.isFetching && plansQuery.data === undefined && !plansQuery.isError && (
            <div className={styles.plansLoading}>{t('common.loading', { defaultValue: 'Loading…' })}</div>
          )}
          {plansQuery.isError && (
            <div className={styles.plansLoading} role="alert">
              {t('billing.plansError', { defaultValue: 'Could not load plans.' })}
            </div>
          )}
          {sortedPlans.length > 0 && (
            <div className={styles.plansScroll}>
              {sortedPlans.map((plan) => {
                const id = plan.name as BillingPlanId;
                const isCurrent = !isPlatform && currentPlan === id;
                const isPro = id === 'pro';
                const disabled = upgrade.isPending || isCurrent || isPlatform || !canUpgrade || pendingApproval;
                return (
                  <PlanCard
                    key={plan.name}
                    plan={plan}
                    isCurrent={isCurrent}
                    isPro={isPro}
                    disabled={disabled}
                    canUpgrade={canUpgrade}
                    onUpgrade={() => upgrade.mutate(id)}
                    t={t}
                  />
                );
              })}
            </div>
          )}
          {pendingApproval && (
            <p className={styles.plansLoading} role="status">
              {t('billing.pendingApproval', { defaultValue: 'Waiting for approval from super admin.' })}
            </p>
          )}
          {!plansQuery.isFetching && !plansQuery.isError && sortedPlans.length === 0 && (
            <div className={styles.plansLoading} role="status">
              {t('billing.plansEmpty', { defaultValue: 'No plans available.' })}
            </div>
          )}
          {upgrade.isError && (
            <p className={styles.upgradeError}>
              {upgrade.error instanceof Error
                ? upgrade.error.message
                : t('billing.upgradeFailed', { defaultValue: 'Upgrade failed' })}
            </p>
          )}
        </section>

        <aside className={styles.usageBlock} aria-labelledby="current-plan-heading">
          <h2 id="current-plan-heading" className={styles.currentPanelTitle}>
            {t('billing.section.current', { defaultValue: 'Current plan' })}
          </h2>
          <p className={styles.planNameDisplay}>{isPlatform ? 'Platform' : data.plan.name}</p>

          <ProgressRow
            label={t('billing.usage.users', { defaultValue: 'Users' })}
            used={data.usage.users}
            limit={isPlatform ? null : data.limits.users}
            t={t}
          />
          <ProgressRow
            label={t('billing.usage.tasks', { defaultValue: 'Tasks' })}
            used={data.usage.tasks}
            limit={isPlatform ? null : data.limits.tasks}
            t={t}
          />
          <ProgressRow
            label={t('billing.usage.api', { defaultValue: 'API (this hour)' })}
            used={data.usage.api_requests}
            limit={isPlatform ? null : data.limits.api_rate_per_hour}
            t={t}
          />

          <hr className={styles.divider} />

          <div className={styles.metaRow}>
            <span className={styles.metaKey}>{t('billing.renewal', { defaultValue: 'Renewal date' })}</span>
            <span className={styles.metaVal}>{isPlatform ? '—' : formatRenewal(data, t)}</span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaKey}>{t('billing.paymentMethod', { defaultValue: 'Payment method' })}</span>
            <span className={styles.metaVal}>
              {isPlatform ? '—' : t('billing.paymentFake', { defaultValue: 'Visa •••• 4242' })}
            </span>
          </div>
        </aside>
      </div>

      <section className={styles.overviewSection} aria-labelledby="subscription-overview-heading">
        <h2 id="subscription-overview-heading" className={styles.overviewTitle}>
          {t('billing.section.overview', { defaultValue: 'Subscription overview' })}
        </h2>
        <div className={styles.overviewCard}>
          <div className={styles.overviewGrid}>
            <div>
              <p className={styles.overviewItemTitle}>{t('billing.cycle', { defaultValue: 'Billing cycle' })}</p>
              <p className={styles.overviewItemValue}>
                {t('billing.cycleMonthly', { defaultValue: 'Monthly' })}
              </p>
            </div>
            <div>
              <p className={styles.overviewItemTitle}>{t('billing.nextPayment', { defaultValue: 'Next payment' })}</p>
              <p className={styles.overviewItemValue}>
                {isPlatform ? '—' : data.trial_ends_at ? formatRenewal(data, t) : '—'}
              </p>
            </div>
            <div>
              <p className={styles.overviewItemTitle}>{t('billing.history', { defaultValue: 'Billing history' })}</p>
              <div className={styles.historyPlaceholder}>
                {t('billing.historyEmpty', { defaultValue: 'No invoices yet.' })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {anyLimitReached && !isPlatform && (
        <div className={styles.limitAlert} role="alert">
          {limitMessages.join(' ')}
        </div>
      )}

      <section className={styles.securitySection} aria-labelledby="billing-security-heading">
        <h2 id="billing-security-heading" className={styles.overviewTitle}>
          {t('billing.section.security', { defaultValue: 'Security' })}
        </h2>
        <div className={styles.securityCard}>
          <div className={styles.securityIcon} aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div>
            <p className={styles.securityTitle}>
              {t('billing.security.title', { defaultValue: 'Your workspace is protected' })}
            </p>
            <p className={styles.securityText}>
              {t('billing.security.body', {
                defaultValue:
                  'Payments are processed securely. We never store full card numbers on our servers. Two-factor authentication and role-based access help keep your data safe.',
              })}
            </p>
          </div>
        </div>
      </section>

      {showStickyUpgrade && !isPlatform && (
        <div className={styles.stickyUpgrade}>
          <Button type="button" variant="primary" size="lg" className={styles.stickyUpgradeButton} onClick={scrollToPlans}>
            {t('billing.cta.stickyUpgrade', { defaultValue: 'Upgrade Plan' })}
          </Button>
        </div>
      )}
    </div>
  );
}
