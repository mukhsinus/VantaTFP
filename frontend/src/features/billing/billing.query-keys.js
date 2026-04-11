export const billingKeys = {
    all: ['billing'],
    current: () => [...billingKeys.all, 'current'],
    plans: () => [...billingKeys.all, 'plans'],
};
