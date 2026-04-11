export const billingKeys = {
  all: ['billing'] as const,
  current: () => [...billingKeys.all, 'current'] as const,
  plans: () => [...billingKeys.all, 'plans'] as const,
};
