import React from 'react';
import './UpgradeBanner.css';

export interface UpgradeBannerProps {
  featureName: string;
  currentPlan: string;
  targetPlans?: string[];
  onUpgradeClick?: () => void;
  dismissible?: boolean;
  variant?: 'inline' | 'modal' | 'badge';
}

/**
 * UpgradeBanner - Shows upgrade prompts for pro features
 */
export function UpgradeBanner({
  featureName,
  currentPlan,
  targetPlans = ['PRO', 'ENTERPRISE'],
  onUpgradeClick,
  dismissible = false,
  variant = 'inline',
}: UpgradeBannerProps) {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
  };

  const targetPlanText = targetPlans.join(' or ');

  if (variant === 'badge') {
    return (
      <span className="upgrade-badge" title={`Available in ${targetPlanText} plans`}>
        <span className="badge-icon">⭐</span>
        Pro
      </span>
    );
  }

  return (
    <div className={`upgrade-banner upgrade-banner--${variant}`}>
      <div className="upgrade-banner__content">
        <div className="upgrade-banner__icon">✨</div>
        <div className="upgrade-banner__message">
          <strong>{featureName}</strong> is only available in {targetPlanText} plans.
          {currentPlan && <span> You're currently on <strong>{currentPlan}</strong>.</span>}
        </div>
      </div>

      <div className="upgrade-banner__actions">
        <button
          className="upgrade-banner__button upgrade-banner__button--primary"
          onClick={onUpgradeClick}
        >
          Upgrade Now
        </button>
        {dismissible && (
          <button
            className="upgrade-banner__button upgrade-banner__button--dismiss"
            onClick={handleDismiss}
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * UpgradeLockIcon - Small lock icon for disabled features
 */
export function UpgradeLockIcon() {
  return (
    <span className="upgrade-lock-icon" title="Upgrade required">
      🔒
    </span>
  );
}

/**
 * UpgradeFeatureGuard - Wrapper component to show/hide features based on tier
 */
export interface UpgradeFeatureGuardProps {
  available: boolean;
  featureName: string;
  currentPlan: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function UpgradeFeatureGuard({
  available,
  featureName,
  currentPlan,
  fallback,
  children,
}: UpgradeFeatureGuardProps) {
  if (available) {
    return <>{children}</>;
  }

  return (
    <div className="upgrade-feature-guard">
      {fallback || (
        <>
          <UpgradeBanner
            featureName={featureName}
            currentPlan={currentPlan}
            variant="inline"
            dismissible={true}
          />
          <div className="upgrade-feature-guard__disabled-content" style={{ opacity: 0.5, pointerEvents: 'none' }}>
            {children}
          </div>
        </>
      )}
    </div>
  );
}
