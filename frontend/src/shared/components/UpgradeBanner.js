import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import './UpgradeBanner.css';
/**
 * UpgradeBanner - Shows upgrade prompts for pro features
 */
export function UpgradeBanner({ featureName, currentPlan, targetPlans = ['PRO', 'ENTERPRISE'], onUpgradeClick, dismissible = false, variant = 'inline', }) {
    const [dismissed, setDismissed] = React.useState(false);
    if (dismissed)
        return null;
    const handleDismiss = () => {
        setDismissed(true);
    };
    const targetPlanText = targetPlans.join(' or ');
    if (variant === 'badge') {
        return (_jsxs("span", { className: "upgrade-badge", title: `Available in ${targetPlanText} plans`, children: [_jsx("span", { className: "badge-icon", children: "\u2B50" }), "Pro"] }));
    }
    return (_jsxs("div", { className: `upgrade-banner upgrade-banner--${variant}`, children: [_jsxs("div", { className: "upgrade-banner__content", children: [_jsx("div", { className: "upgrade-banner__icon", children: "\u2728" }), _jsxs("div", { className: "upgrade-banner__message", children: [_jsx("strong", { children: featureName }), " is only available in ", targetPlanText, " plans.", currentPlan && _jsxs("span", { children: [" You're currently on ", _jsx("strong", { children: currentPlan }), "."] })] })] }), _jsxs("div", { className: "upgrade-banner__actions", children: [_jsx("button", { className: "upgrade-banner__button upgrade-banner__button--primary", onClick: onUpgradeClick, children: "Upgrade Now" }), dismissible && (_jsx("button", { className: "upgrade-banner__button upgrade-banner__button--dismiss", onClick: handleDismiss, "aria-label": "Dismiss", children: "\u2715" }))] })] }));
}
/**
 * UpgradeLockIcon - Small lock icon for disabled features
 */
export function UpgradeLockIcon() {
    return (_jsx("span", { className: "upgrade-lock-icon", title: "Upgrade required", children: "\uD83D\uDD12" }));
}
export function UpgradeFeatureGuard({ available, featureName, currentPlan, fallback, children, }) {
    if (available) {
        return _jsx(_Fragment, { children: children });
    }
    return (_jsx("div", { className: "upgrade-feature-guard", children: fallback || (_jsxs(_Fragment, { children: [_jsx(UpgradeBanner, { featureName: featureName, currentPlan: currentPlan, variant: "inline", dismissible: true }), _jsx("div", { className: "upgrade-feature-guard__disabled-content", style: { opacity: 0.5, pointerEvents: 'none' }, children: children })] })) }));
}
