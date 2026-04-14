export const billingKeys = {
    all: ['billing'],
    current: () => [...billingKeys.all, 'current'],
};
