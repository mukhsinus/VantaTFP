import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CurrentUser } from '@shared/types/auth.types';

interface AuthState {
  user: CurrentUser | null;
  accessToken: string | null;

  /**
   * Becomes true once Zustand has finished rehydrating from localStorage.
   * The AuthGuard waits for this before deciding to redirect or render.
   * Prevents a flash where protected content briefly appears (or /login
   * flashes) before the stored session is loaded.
   */
  isHydrated: boolean;

  setAuth:     (user: CurrentUser, accessToken: string) => void;
  clearAuth:   () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:        null,
      accessToken: null,
      isHydrated:  false,

      setAuth: (user, accessToken) => set({ user, accessToken }),

      clearAuth: () => set({ user: null, accessToken: null }),

      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'tfp-auth',

      // Exclude isHydrated from storage — it is always false at startup
      // and only becomes true after the rehydration callback fires.
      partialize: (state) => ({
        user:        state.user,
        accessToken: state.accessToken,
      }),

      onRehydrateStorage: () => (state) => {
        // Called once Zustand has merged the stored values into the store.
        // If there is nothing in storage, state is still populated with defaults.
        state?.setHydrated();
      },
    }
  )
);
