import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminScopeState {
  selectedTenantId: string | null;
  setSelectedTenantId: (tenantId: string | null) => void;
  clearSelectedTenantId: () => void;
}

export const useAdminScopeStore = create<AdminScopeState>()(
  persist(
    (set) => ({
      selectedTenantId: null,
      setSelectedTenantId: (tenantId) =>
        set({
          selectedTenantId: tenantId && tenantId.trim() ? tenantId : null,
        }),
      clearSelectedTenantId: () => set({ selectedTenantId: null }),
    }),
    {
      name: 'tfp-admin-scope',
      partialize: (state) => ({ selectedTenantId: state.selectedTenantId }),
    }
  )
);
