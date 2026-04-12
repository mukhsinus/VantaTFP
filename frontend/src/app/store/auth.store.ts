import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CurrentUser } from '@shared/types/auth.types';

interface AuthState {
  user: CurrentUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isSessionLoading: boolean;

  /**
   * Becomes true once Zustand has finished rehydrating from localStorage.
   * The AuthGuard waits for this before deciding to redirect or render.
   * Prevents a flash where protected content briefly appears (or /login
   * flashes) before the stored session is loaded.
   */
  isHydrated: boolean;

  setAuth:     (user: CurrentUser, accessToken: string, refreshToken?: string | null) => void;
  setUser:     (user: CurrentUser) => void;
  setTokens:   (accessToken: string, refreshToken?: string | null) => void;
  setSessionLoading: (value: boolean) => void;
  clearAuth:   () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:        null,
      accessToken: null,
      refreshToken: null,
      isSessionLoading: false,
      isHydrated:  false,

      setAuth: (user, accessToken, refreshToken) =>
        set((state) => ({
          user,
          accessToken,
          refreshToken: refreshToken ?? state.refreshToken,
        })),

      setUser: (user) => set({ user }),

      setTokens: (accessToken, refreshToken) =>
        set((state) => ({
          accessToken,
          refreshToken: refreshToken ?? state.refreshToken,
        })),

      setSessionLoading: (value) => set({ isSessionLoading: value }),

      clearAuth: () => set({ user: null, accessToken: null, refreshToken: null, isSessionLoading: false }),

      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'tfp-auth',

      // Exclude isHydrated from storage — it is always false at startup
      // and only becomes true after the rehydration callback fires.
      partialize: (state) => ({
        user:        state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),

      onRehydrateStorage: () => () => {
        // Must not rely on the persisted slice carrying action methods — always
        // flip hydration via `getState()` so AuthGuard never deadlocks on a blank shell.
        useAuthStore.getState().setHydrated();
      },
    }
  )
);
