import { create } from 'zustand';
export const useToastStore = create((set) => ({
    toasts: [],
    addToast: (toast) => {
        const id = crypto.randomUUID();
        set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
        // Auto-dismiss after 4 s
        setTimeout(() => {
            set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
        }, 4000);
    },
    removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
// Imperative helpers — safe to call outside React components
export const toast = {
    success: (title, description) => useToastStore.getState().addToast({ type: 'success', title, description }),
    error: (title, description) => useToastStore.getState().addToast({ type: 'error', title, description }),
    info: (title, description) => useToastStore.getState().addToast({ type: 'info', title, description }),
};
