import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useAuthStore = create()(persist((set) => ({
    user: null,
    accessToken: null,
    isHydrated: false,
    setAuth: (user, accessToken) => set({ user, accessToken }),
    clearAuth: () => set({ user: null, accessToken: null }),
    setHydrated: () => set({ isHydrated: true }),
}), {
    name: 'tfp-auth',
    // Exclude isHydrated from storage — it is always false at startup
    // and only becomes true after the rehydration callback fires.
    partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
    }),
    onRehydrateStorage: () => (state) => {
        // Called once Zustand has merged the stored values into the store.
        // If there is nothing in storage, state is still populated with defaults.
        state?.setHydrated();
    },
}));
