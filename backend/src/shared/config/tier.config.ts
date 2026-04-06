/**
 * Tier Configuration - Defines feature limits and capabilities for each subscription tier
 */

export enum PlanType {
  FREE = 'FREE',
  PRO = 'PRO',
}

export interface TierFeatures {
  maxUsers: number;
  maxTasks: number;
  apiRateLimit: number; // requests per hour
  tasksFeatures: {
    basicCrud: boolean;
    assignUsers: boolean;
    statusTracking: 'basic' | 'advanced';
    timeTracking: boolean;
    auditHistory: boolean;
  };
  kpiModule: {
    basicMetrics: boolean;
    filters: boolean;
    perEmployee: boolean;
    analytics: boolean;
  };
  payroll: {
    viewOnly: boolean;
    fullCrud: boolean;
    kpiBasedCalculation: boolean;
    flexibleCalculation: boolean;
  };
  reports: {
    typesCovered: string[];
    filterOptions: string[];
    csvExport: boolean;
    pdfExport: boolean;
    reportHistory: boolean;
  };
  rbac: {
    fixedRoles: boolean;
    customRoles: boolean;
    policyBased: boolean;
  };
  notifications: {
    inApp: boolean;
    advanced: boolean;
    telegram: boolean;
    email: boolean;
  };
  adminFeatures: {
    auditLogs: boolean;
    advancedTenantControl: boolean;
    dataExport: boolean;
  };
}

export const TIER_CONFIG: Record<PlanType, TierFeatures> = {
  [PlanType.FREE]: {
    maxUsers: 5,
    maxTasks: 50,
    apiRateLimit: 100,
    tasksFeatures: {
      basicCrud: true,
      assignUsers: true,
      statusTracking: 'basic',
      timeTracking: false,
      auditHistory: false,
    },
    kpiModule: {
      basicMetrics: true,
      filters: false,
      perEmployee: false,
      analytics: false,
    },
    payroll: {
      viewOnly: true,
      fullCrud: false,
      kpiBasedCalculation: false,
      flexibleCalculation: false,
    },
    reports: {
      typesCovered: ['KPI', 'Payroll'],
      filterOptions: ['date'],
      csvExport: true,
      pdfExport: false,
      reportHistory: false,
    },
    rbac: {
      fixedRoles: true,
      customRoles: false,
      policyBased: false,
    },
    notifications: {
      inApp: true,
      advanced: false,
      telegram: false,
      email: false,
    },
    adminFeatures: {
      auditLogs: false,
      advancedTenantControl: false,
      dataExport: false,
    },
  },
  [PlanType.PRO]: {
    maxUsers: 1000,
    maxTasks: 100000,
    apiRateLimit: 1000,
    tasksFeatures: {
      basicCrud: true,
      assignUsers: true,
      statusTracking: 'advanced',
      timeTracking: true,
      auditHistory: true,
    },
    kpiModule: {
      basicMetrics: true,
      filters: true,
      perEmployee: true,
      analytics: true,
    },
    payroll: {
      viewOnly: false,
      fullCrud: true,
      kpiBasedCalculation: true,
      flexibleCalculation: true,
    },
    reports: {
      typesCovered: ['KPI', 'Payroll', 'Tasks'],
      filterOptions: ['date', 'user', 'team'],
      csvExport: true,
      pdfExport: true,
      reportHistory: true,
    },
    rbac: {
      fixedRoles: false,
      customRoles: true,
      policyBased: true,
    },
    notifications: {
      inApp: true,
      advanced: true,
      telegram: true,
      email: true,
    },
    adminFeatures: {
      auditLogs: true,
      advancedTenantControl: true,
      dataExport: true,
    },
  },
};

/**
 * Get feature config for a given plan
 */
export function getTierFeatures(plan: PlanType | string): TierFeatures {
  return TIER_CONFIG[plan as PlanType] ?? TIER_CONFIG[PlanType.FREE];
}

/**
 * Check if a feature is available in a given plan
 */
export function isFeatureAvailable(
  plan: PlanType | string,
  featurePath: string
): boolean {
  const features = getTierFeatures(plan);
  const keys = featurePath.split('.');
  let current: any = features;

  for (const key of keys) {
    if (current?.[key] === undefined) return false;
    current = current[key];
  }

  return current === true;
}
