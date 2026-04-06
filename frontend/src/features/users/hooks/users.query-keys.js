export const usersKeys = {
    all: ['users'],
    lists: () => [...usersKeys.all, 'list'],
    list: () => [...usersKeys.lists()],
    details: () => [...usersKeys.all, 'detail'],
    detail: (id) => [...usersKeys.details(), id],
};
