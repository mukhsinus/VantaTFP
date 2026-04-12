export const payrollKeys = {
    all: ['payroll'],
    lists: () => [...payrollKeys.all, 'list'],
    list: () => [...payrollKeys.lists()],
};
