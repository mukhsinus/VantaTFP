import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useAuthStore = create()(persist((set) => ({
    user: null,
    tenant: null,
    memberships: [],
    activeTenantId: null,
    accessToken: null,
    refreshToken: null,
    isSessionLoading: false,
    isHydrated: false,
    setAuth: (user, accessToken, refreshToken) => set((state) => ({
        user,
        tenant: state.tenant,
        memberships: state.memberships,
        activeTenantId: state.activeTenantId,
        accessToken,
        refreshToken: refreshToken ?? state.refreshToken,
    })),
    setSession: (session, accessToken, refreshToken) => set((state) => ({
        user: session.user,
        tenant: session.tenant,
        memberships: session.memberships,
        activeTenantId: session.activeTenantId,
        accessToken,
        refreshToken: refreshToken ?? state.refreshToken,
    })),
    setUser: (user) => set({ user }),
    setTokens: (accessToken, refreshToken) => set((state) => ({
        accessToken,
        refreshToken: refreshToken ?? state.refreshToken,
    })),
    setSessionLoading: (value) => set({ isSessionLoading: value }),
    clearAuth: () => set({
        user: null,
        tenant: null,
        memberships: [],
        activeTenantId: null,
        accessToken: null,
        refreshToken: null,
        isSessionLoading: false,
    }),
    setHydrated: () => set({ isHydrated: true }),
}), {
    name: 'tfp-auth',
    // Exclude isHydrated from storage — it is always false at startup
    // and only becomes true after the rehydration callback fires.
    partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        memberships: state.memberships,
        activeTenantId: state.activeTenantId,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
    }),
    onRehydrateStorage: () => () => {
        // Must not rely on the persisted slice carrying action methods — always
        // flip hydration via `getState()` so AuthGuard never deadlocks on a blank shell.
        useAuthStore.getState().setHydrated();
    },
}));
