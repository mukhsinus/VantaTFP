export const kpiKeys = {
  all: ['kpi'] as const,
  lists: () => [...kpiKeys.all, 'list'] as const,
  list: () => [...kpiKeys.lists()] as const,
};
