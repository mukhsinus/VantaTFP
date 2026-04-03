import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CurrentUser } from '@shared/types/auth.types';

interface AuthState {
  user: CurrentUser | null;
  accessToken: string | null;
  setAuth: (user: CurrentUser, accessToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      clearAuth: () => set({ user: null, accessToken: null }),
    }),
    { name: 'tfp-auth' }
  )
);
