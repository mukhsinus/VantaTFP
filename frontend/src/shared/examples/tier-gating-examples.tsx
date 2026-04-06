/**
 * Example implementations showing how to use tier gating in components
 * These demonstrate patterns for the Payroll, KPI, and Tasks modules
 */

// ============================================================================
// EXAMPLE 1: Payroll Module - Conditional CRUD based on tier
// ============================================================================

import React from 'react';
import { usePayrollAccess } from '../hooks/useUserTier';
import { UpgradeBanner, UpgradeFeatureGuard } from '../components/UpgradeBanner';

export function PayrollListExample() {
  const { canEdit, isReadOnly, plan, message } = usePayrollAccess();

  return (
    <div>
      <h1>Payroll Management</h1>

      {/* Show message if read-only */}
      {isReadOnly && (
        <UpgradeBanner
          featureName="Payroll Editing"
          currentPlan={plan ?? 'free'}
          onUpgradeClick={() => window.location.href = '/upgrade'}
          dismissible={true}
        />
      )}

      {/* Payroll list always visible */}
      <div className="payroll-list">
        {/* List items */}
      </div>

      {/* Create button disabled if can't edit */}
      {canEdit && (
        <button className="btn--primary">
          Create New Payroll Entry
        </button>
      )}

      {!canEdit && (
        <button className="btn--primary" disabled title={message}>
          Create New Payroll Entry (Upgrade Required)
        </button>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: KPI Module - Analytics locked behind tier
// ============================================================================

import { useKpiAccess } from '../hooks/useUserTier';

export function KpiAnalyticsExample() {
  const { canViewAnalytics, plan, messages } = useKpiAccess();

  return (
    <div className="kpi-container">
      <h2>KPI Analytics & Reports</h2>

      <UpgradeFeatureGuard
        available={canViewAnalytics}
        featureName={`KPI Analytics Dashboard`}
        currentPlan={plan ?? 'free'}
        fallback={
          <div className="placeholder-content">
            <p>Analytics and detailed reporting are available in PRO and ENTERPRISE plans.</p>
            <button onClick={() => window.location.href = '/upgrade'}>
              Upgrade to view KPI Analytics
            </button>
          </div>
        }
      >
        {/* Real analytics dashboard component */}
        <div className="analytics-dashboard">
          <canvas id="kpi-chart"></canvas>
          {/* Chart implementation */}
        </div>
      </UpgradeFeatureGuard>
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: Tasks Module - Time tracking feature with guard
// ============================================================================

import { useTasksAccess } from '../hooks/useUserTier';

export function TaskTimeTrackingExample() {
  const { canTrackTime, plan, messages } = useTasksAccess();

  return (
    <div className="task-time-tracking">
      <h3>Time Tracking</h3>

      {!canTrackTime && (
        <UpgradeBanner
          featureName="Time Tracking"
          currentPlan={plan ?? 'free'}
          variant="inline"
          dismissible={true}
        />
      )}

      {canTrackTime ? (
        <div className="time-tracker">
          <input type="time" placeholder="Start time" />
          <input type="time" placeholder="End time" />
          <button>Log Time</button>
        </div>
      ) : (
        <div style={{ opacity: 0.5, pointerEvents: 'none' }}>
          <input type="time" placeholder="Start time" disabled />
          <input type="time" placeholder="End time" disabled />
          <button disabled>Log Time</button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Reports Module - Export options based on tier
// ============================================================================

import { getTierFeatures } from '../config/tier.config';
import { useUserTier } from '../hooks/useUserTier';
import { UpgradeLockIcon } from '../components/UpgradeBanner';

export function ReportExportExample() {
  const { plan } = useUserTier();
  const features = getTierFeatures(plan);

  return (
    <div className="report-export-options">
      <h3>Export Report</h3>

      <div className="export-buttons">
        {features.reports.csvExport && (
          <button className="btn--export">
            📥 Export as CSV
          </button>
        )}

        {features.reports.pdfExport ? (
          <button className="btn--export">
            📄 Export as PDF
          </button>
        ) : (
          <button className="btn--export" disabled title="PDF export requires PRO plan">
            📄 Export as PDF
            <UpgradeLockIcon />
          </button>
        )}
      </div>

      {!features.reports.pdfExport && (
        <p className="note">PDF export is available in PRO and ENTERPRISE plans.</p>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: User Management - Enforce user limits
// ============================================================================

import { useUserLimits } from '../hooks/useUserTier';

export function UserManagementExample() {
  const { maxUsers, isFreeTier, plan } = useUserLimits();
  const [userCount, setUserCount] = React.useState(3);
  const canAddMore = userCount < maxUsers;

  return (
    <div className="user-management">
      <h2>Team Members</h2>

      <div className="user-count-display">
        You have <strong>{userCount}</strong> / <strong>{maxUsers}</strong> team members
        {isFreeTier && <span className="free-tier-badge">Free Tier</span>}
      </div>

      {canAddMore ? (
        <button className="btn--primary">
          + Add Team Member
        </button>
      ) : (
        <div className="at-limit-message">
          <p>You've reached the user limit for your {plan} plan.</p>
          <button onClick={() => window.location.href = '/upgrade'}>
            Upgrade to add more users
          </button>
        </div>
      )}

      <div className="user-list">
        {/* User list items */}
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: Navigation - Hide/show menu items based on tier
// ============================================================================

import { useFeatureAccess } from '../hooks/useUserTier';

export function NavMenuExample() {
  const payrollAccess = useFeatureAccess('payroll.fullCrud');
  const kpiAnalytics = useFeatureAccess('kpiModule.analytics');
  const customRbac = useFeatureAccess('rbac.customRoles');

  return (
    <nav className="sidebar">
      <ul>
        <li><a href="/dashboard">Dashboard</a></li>
        <li><a href="/tasks">Tasks</a></li>
        <li><a href="/users">Team</a></li>

        {payrollAccess.available && (
          <li>
            <a href="/payroll">Payroll</a>
          </li>
        )}

        <li>
          <a href="/kpi">
            KPI
            {kpiAnalytics.upgradeRequired && <span className="pro-badge">Pro</span>}
          </a>
        </li>

        {customRbac.available && (
          <li>
            <a href="/roles">Custom Roles</a>
          </li>
        )}
      </ul>
    </nav>
  );
}
