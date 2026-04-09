export const kpiKeys = {
    all: ['kpi'],
    lists: () => [...kpiKeys.all, 'list'],
    list: () => [...kpiKeys.lists()],
};
