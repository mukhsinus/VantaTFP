export const reportsKeys = {
    all: ['reports'],
    history: (type) => [...reportsKeys.all, 'history', type ?? 'all'],
    generate: () => [...reportsKeys.all, 'generate'],
};
