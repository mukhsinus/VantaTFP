export const employeesKeys = {
    all: ['employees'],
    lists: () => [...employeesKeys.all, 'list'],
    list: () => [...employeesKeys.lists()],
};
