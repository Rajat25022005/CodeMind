/**
 * UI store — drift panel, general UI state.
 * Uses Zustand for selector-based re-renders.
 */
import { create } from 'zustand';

interface UIState {
  driftOpen: boolean;
  setDriftOpen: (open: boolean) => void;
  toggleDrift: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  driftOpen: false,

  setDriftOpen: (open) => set({ driftOpen: open }),

  toggleDrift: () => set((s) => ({ driftOpen: !s.driftOpen })),
}));
