import React, { useState } from 'react';
import './PlanSelector.css';
import { PlanType, TIER_CONFIG } from '../config/tier.config';

export interface Plan {
  id: PlanType;
  name: string;
  description: string;
  price?: string;
  billingPeriod?: string;
  highlights: string[];
  features: {
    category: string;
    items: { name: string; included: boolean }[];
  }[];
  cta: string;
  ctaVariant: 'primary' | 'secondary' | 'outline';
}

const PLAN_DETAILS: Record<PlanType, Plan> = {
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

interface PlanSelectorProps {
  currentPlan?: PlanType;
  onSelectPlan?: (plan: PlanType) => void;
}

/**
 * PlanSelector - Component to display and select pricing plans
 */
export function PlanSelector({ currentPlan = PlanType.FREE, onSelectPlan }: PlanSelectorProps) {
  return (
    <div className="plan-selector">
      <div className="plan-selector__header">
        <h1>Choose Your Plan</h1>
        <p>Scale your HR management with the right plan for your team</p>
      </div>

      <div className="plan-selector__toggle">
        <span>Monthly</span>
        <label className="toggle-switch">
          <input type="checkbox" disabled />
          <span className="toggle-slider"></span>
        </label>
        <span>Billed Annually*(Save 20%)</span>
      </div>

      <div className="plans-grid">
        {Object.values(PLAN_DETAILS).map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={plan.id === currentPlan}
            onSelectPlan={onSelectPlan}
          />
        ))}
      </div>

      <div className="plan-selector__footer">
        <p>All plans include core features. No credit card required to start.</p>
        <p>Enterprise plans include dedicated support and custom integrations.</p>
      </div>
    </div>
  );
}

interface PlanCardProps {
  plan: Plan;
  isCurrentPlan?: boolean;
  onSelectPlan?: (plan: PlanType) => void;
}

function PlanCard({ plan, isCurrentPlan = false, onSelectPlan }: PlanCardProps) {
  return (
    <div className={`plan-card ${isCurrentPlan ? 'plan-card--current' : ''} ${plan.id === PlanType.PRO ? 'plan-card--featured' : ''}`}>
      {plan.id === PlanType.PRO && <div className="plan-card__badge">Most Popular</div>}

      <div className="plan-card__header">
        <h3 className="plan-card__name">{plan.name}</h3>
        <p className="plan-card__description">{plan.description}</p>
      </div>

      <div className="plan-card__price">
        <span className="plan-card__amount">{plan.price}</span>
        {plan.billingPeriod && <span className="plan-card__period">{plan.billingPeriod}</span>}
      </div>

      <div className="plan-card__highlights">
        {plan.highlights.map((highlight, idx) => (
          <span key={idx} className="plan-card__highlight">
            {highlight}
          </span>
        ))}
      </div>

      <button
        className={`plan-card__button plan-card__button--${plan.ctaVariant}`}
        onClick={() => onSelectPlan?.(plan.id)}
        disabled={isCurrentPlan}
      >
        {isCurrentPlan ? '✓ Current Plan' : plan.cta}
      </button>

      <div className="plan-card__features">
        {plan.features.map((featureGroup, groupIdx) => (
          <div key={groupIdx} className="feature-group">
            <h4 className="feature-group__title">{featureGroup.category}</h4>
            <ul className="feature-group__list">
              {featureGroup.items.map((item, itemIdx) => (
                <li
                  key={itemIdx}
                  className={`feature-item ${item.included ? 'feature-item--included' : 'feature-item--excluded'}`}
                >
                  <span className="feature-item__icon">
                    {item.included ? '✓' : '✕'}
                  </span>
                  <span className="feature-item__name">{item.name}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * PlanComparisonTable - Side-by-side comparison of features
 */
export function PlanComparisonTable() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['Team Management'])
  );

  const toggleSection = (section: string) => {
    const newSections = new Set(expandedSections);
    if (newSections.has(section)) {
      newSections.delete(section);
    } else {
      newSections.add(section);
    }
    setExpandedSections(newSections);
  };

  const allFeatures = PLAN_DETAILS[PlanType.PRO].features;

  return (
    <div className="comparison-table">
      <h2>Feature Comparison</h2>
      
      <table>
        <thead>
          <tr>
            <th>Feature</th>
            <th className="col-free">
              <div className="plan-header">Free</div>
            </th>
            <th className="col-pro">
              <div className="plan-header">Pro</div>
            </th>
            <th className="col-enterprise">
              <div className="plan-header">Enterprise</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {allFeatures.map((group) => (
            <React.Fragment key={group.category}>
              <tr className="section-header">
                <td colSpan={4}>
                  <button
                    className="section-toggle"
                    onClick={() => toggleSection(group.category)}
                  >
                    <span className="toggle-icon">
                      {expandedSections.has(group.category) ? '▼' : '▶'}
                    </span>
                    {group.category}
                  </button>
                </td>
              </tr>
              {expandedSections.has(group.category) &&
                group.items.map((item) => (
                  <tr key={item.name} className="feature-row">
                    <td className="feature-name">{item.name}</td>
                    <td className="col-free">
                      <FeatureCell
                        included={
                          PLAN_DETAILS[PlanType.FREE].features
                            .find((g) => g.category === group.category)
                            ?.items.find((i) => i.name === item.name)?.included ?? false
                        }
                      />
                    </td>
                    <td className="col-pro">
                      <FeatureCell included={item.included} />
                    </td>
                    <td className="col-enterprise">
                      <FeatureCell included={true} />
                    </td>
                  </tr>
                ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FeatureCell({ included }: { included: boolean }) {
  return (
    <div className={`feature-cell ${included ? 'feature-cell--included' : 'feature-cell--excluded'}`}>
      {included ? '✓' : '✕'}
    </div>
  );
}
