import { create } from 'zustand';

interface AppState {
  selectedReleaseIds: string[];
  setSelectedReleaseIds: (ids: string[]) => void;
  toggleReleaseId: (id: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedReleaseIds: [],
  setSelectedReleaseIds: (ids) => set({ selectedReleaseIds: ids }),
  toggleReleaseId: (id) =>
    set((state) => {
      const exists = state.selectedReleaseIds.includes(id);
      return {
        selectedReleaseIds: exists
          ? state.selectedReleaseIds.filter((x) => x !== id)
          : [...state.selectedReleaseIds, id],
      };
    }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
