import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useAuthStore = create()(persist((set) => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isSessionLoading: false,
    isHydrated: false,
    setAuth: (user, accessToken, refreshToken) => set((state) => ({
        user,
        accessToken,
        refreshToken: refreshToken ?? state.refreshToken,
    })),
    setUser: (user) => set((state) => {
        if (state.user?.userId === user.userId)
            return state;
        return { user };
    }),
    setTokens: (accessToken, refreshToken) => set((state) => ({
        accessToken,
        refreshToken: refreshToken ?? state.refreshToken,
    })),
    setSessionLoading: (value) => set({ isSessionLoading: value }),
    clearAuth: () => set({ user: null, accessToken: null, refreshToken: null, isSessionLoading: false }),
    setHydrated: () => set({ isHydrated: true }),
}), {
    name: 'tfp-auth',
    // Exclude isHydrated from storage — it is always false at startup
    // and only becomes true after the rehydration callback fires.
    partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
    }),
    onRehydrateStorage: () => (state) => {
        // Called once Zustand has merged the stored values into the store.
        // If there is nothing in storage, state is still populated with defaults.
        state?.setHydrated();
    },
}));
