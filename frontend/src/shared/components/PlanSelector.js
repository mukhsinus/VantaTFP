import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import './PlanSelector.css';
import { PlanType } from '../config/tier.config';
const PLAN_DETAILS = {
    [PlanType.FREE]: {
        id: PlanType.FREE,
        name: 'Free',
        description: 'Perfect for getting started',
        price: '$0',
        billingPeriod: '/month',
        highlights: ['5 team members', '50 tasks', 'Basic features'],
        features: [
            {
                category: 'Team Management',
                items: [
                    { name: '5 team members', included: true },
                    { name: 'Unlimited tasks', included: false },
                    { name: 'Custom roles', included: false },
                ],
            },
            {
                category: 'Task Management',
                items: [
                    { name: 'Task creation & assignment', included: true },
                    { name: 'Time tracking', included: false },
                    { name: 'Task history & audit', included: false },
                ],
            },
            {
                category: 'Payroll & KPI',
                items: [
                    { name: 'Payroll view (read-only)', included: true },
                    { name: 'Payroll management', included: false },
                    { name: 'KPI analytics', included: false },
                ],
            },
            {
                category: 'Reports & Admin',
                items: [
                    { name: 'Basic reports (CSV)', included: true },
                    { name: 'Advanced reports (PDF)', included: false },
                    { name: 'Audit logs', included: false },
                ],
            },
        ],
        cta: 'Get Started',
        ctaVariant: 'secondary',
    },
    [PlanType.PRO]: {
        id: PlanType.PRO,
        name: 'Pro',
        description: 'For growing teams',
        price: '$49',
        billingPeriod: '/month',
        highlights: ['1000 team members', 'Unlimited tasks', 'Advanced analytics', 'Priority support'],
        features: [
            {
                category: 'Team Management',
                items: [
                    { name: '1000 team members', included: true },
                    { name: 'Unlimited tasks', included: true },
                    { name: 'Custom roles & permissions', included: true },
                ],
            },
            {
                category: 'Task Management',
                items: [
                    { name: 'Task creation & assignment', included: true },
                    { name: 'Time tracking', included: true },
                    { name: 'Task history & audit', included: true },
                ],
            },
            {
                category: 'Payroll & KPI',
                items: [
                    { name: 'Full payroll management', included: true },
                    { name: 'KPI analytics & filtering', included: true },
                    { name: 'Per-employee KPI tracking', included: true },
                ],
            },
            {
                category: 'Reports & Admin',
                items: [
                    { name: 'Reports (CSV + PDF)', included: true },
                    { name: 'Report history', included: true },
                    { name: 'Audit logs', included: true },
                ],
            },
        ],
        cta: 'Upgrade to Pro',
        ctaVariant: 'primary',
    },
    [PlanType.ENTERPRISE]: {
        id: PlanType.ENTERPRISE,
        name: 'Enterprise',
        description: 'For large-scale operations',
        price: 'Custom',
        billingPeriod: 'pricing',
        highlights: ['10,000+ team members', 'All Pro features', 'Custom integrations', 'Dedicated support'],
        features: [
            {
                category: 'Team Management',
                items: [
                    { name: '10,000+ team members', included: true },
                    { name: 'Unlimited tasks', included: true },
                    { name: 'Advanced custom roles', included: true },
                ],
            },
            {
                category: 'Task Management',
                items: [
                    { name: 'All Pro features', included: true },
                    { name: 'Advanced time tracking', included: true },
                    { name: 'Complete audit history', included: true },
                ],
            },
            {
                category: 'Payroll & KPI',
                items: [
                    { name: 'Advanced payroll features', included: true },
                    { name: 'Custom KPI metrics', included: true },
                    { name: 'Enterprise analytics', included: true },
                ],
            },
            {
                category: 'Reports & Admin',
                items: [
                    { name: 'Custom reporting tools', included: true },
                    { name: 'API access', included: true },
                    { name: 'Dedicated account manager', included: true },
                ],
            },
        ],
        cta: 'Contact Sales',
        ctaVariant: 'secondary',
    },
};
/**
 * PlanSelector - Component to display and select pricing plans
 */
export function PlanSelector({ currentPlan = PlanType.FREE, onSelectPlan }) {
    return (_jsxs("div", { className: "plan-selector", children: [_jsxs("div", { className: "plan-selector__header", children: [_jsx("h1", { children: "Choose Your Plan" }), _jsx("p", { children: "Scale your HR management with the right plan for your team" })] }), _jsxs("div", { className: "plan-selector__toggle", children: [_jsx("span", { children: "Monthly" }), _jsxs("label", { className: "toggle-switch", children: [_jsx("input", { type: "checkbox", disabled: true }), _jsx("span", { className: "toggle-slider" })] }), _jsx("span", { children: "Billed Annually*(Save 20%)" })] }), _jsx("div", { className: "plans-grid", children: Object.values(PLAN_DETAILS).map((plan) => (_jsx(PlanCard, { plan: plan, isCurrentPlan: plan.id === currentPlan, onSelectPlan: onSelectPlan }, plan.id))) }), _jsxs("div", { className: "plan-selector__footer", children: [_jsx("p", { children: "All plans include core features. No credit card required to start." }), _jsx("p", { children: "Enterprise plans include dedicated support and custom integrations." })] })] }));
}
function PlanCard({ plan, isCurrentPlan = false, onSelectPlan }) {
    return (_jsxs("div", { className: `plan-card ${isCurrentPlan ? 'plan-card--current' : ''} ${plan.id === PlanType.PRO ? 'plan-card--featured' : ''}`, children: [plan.id === PlanType.PRO && _jsx("div", { className: "plan-card__badge", children: "Most Popular" }), _jsxs("div", { className: "plan-card__header", children: [_jsx("h3", { className: "plan-card__name", children: plan.name }), _jsx("p", { className: "plan-card__description", children: plan.description })] }), _jsxs("div", { className: "plan-card__price", children: [_jsx("span", { className: "plan-card__amount", children: plan.price }), plan.billingPeriod && _jsx("span", { className: "plan-card__period", children: plan.billingPeriod })] }), _jsx("div", { className: "plan-card__highlights", children: plan.highlights.map((highlight, idx) => (_jsx("span", { className: "plan-card__highlight", children: highlight }, idx))) }), _jsx("button", { className: `plan-card__button plan-card__button--${plan.ctaVariant}`, onClick: () => onSelectPlan?.(plan.id), disabled: isCurrentPlan, children: isCurrentPlan ? '✓ Current Plan' : plan.cta }), _jsx("div", { className: "plan-card__features", children: plan.features.map((featureGroup, groupIdx) => (_jsxs("div", { className: "feature-group", children: [_jsx("h4", { className: "feature-group__title", children: featureGroup.category }), _jsx("ul", { className: "feature-group__list", children: featureGroup.items.map((item, itemIdx) => (_jsxs("li", { className: `feature-item ${item.included ? 'feature-item--included' : 'feature-item--excluded'}`, children: [_jsx("span", { className: "feature-item__icon", children: item.included ? '✓' : '✕' }), _jsx("span", { className: "feature-item__name", children: item.name })] }, itemIdx))) })] }, groupIdx))) })] }));
}
/**
 * PlanComparisonTable - Side-by-side comparison of features
 */
export function PlanComparisonTable() {
    const [expandedSections, setExpandedSections] = useState(new Set(['Team Management']));
    const toggleSection = (section) => {
        const newSections = new Set(expandedSections);
        if (newSections.has(section)) {
            newSections.delete(section);
        }
        else {
            newSections.add(section);
        }
        setExpandedSections(newSections);
    };
    const allFeatures = PLAN_DETAILS[PlanType.PRO].features;
    return (_jsxs("div", { className: "comparison-table", children: [_jsx("h2", { children: "Feature Comparison" }), _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Feature" }), _jsx("th", { className: "col-free", children: _jsx("div", { className: "plan-header", children: "Free" }) }), _jsx("th", { className: "col-pro", children: _jsx("div", { className: "plan-header", children: "Pro" }) }), _jsx("th", { className: "col-enterprise", children: _jsx("div", { className: "plan-header", children: "Enterprise" }) })] }) }), _jsx("tbody", { children: allFeatures.map((group) => (_jsxs(React.Fragment, { children: [_jsx("tr", { className: "section-header", children: _jsx("td", { colSpan: 4, children: _jsxs("button", { className: "section-toggle", onClick: () => toggleSection(group.category), children: [_jsx("span", { className: "toggle-icon", children: expandedSections.has(group.category) ? '▼' : '▶' }), group.category] }) }) }), expandedSections.has(group.category) &&
                                    group.items.map((item) => (_jsxs("tr", { className: "feature-row", children: [_jsx("td", { className: "feature-name", children: item.name }), _jsx("td", { className: "col-free", children: _jsx(FeatureCell, { included: PLAN_DETAILS[PlanType.FREE].features
                                                        .find((g) => g.category === group.category)
                                                        ?.items.find((i) => i.name === item.name)?.included ?? false }) }), _jsx("td", { className: "col-pro", children: _jsx(FeatureCell, { included: item.included }) }), _jsx("td", { className: "col-enterprise", children: _jsx(FeatureCell, { included: true }) })] }, item.name)))] }, group.category))) })] })] }));
}
function FeatureCell({ included }) {
    return (_jsx("div", { className: `feature-cell ${included ? 'feature-cell--included' : 'feature-cell--excluded'}`, children: included ? '✓' : '✕' }));
}
