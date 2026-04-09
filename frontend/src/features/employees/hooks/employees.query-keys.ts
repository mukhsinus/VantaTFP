export const employeesKeys = {
  all: ['employees'] as const,
  lists: () => [...employeesKeys.all, 'list'] as const,
  list: () => [...employeesKeys.lists()] as const,
};
