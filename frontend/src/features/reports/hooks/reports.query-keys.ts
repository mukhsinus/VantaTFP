export const reportsKeys = {
  all: ['reports'] as const,
  history: (type?: string) => [...reportsKeys.all, 'history', type ?? 'all'] as const,
  generate: () => [...reportsKeys.all, 'generate'] as const,
};
