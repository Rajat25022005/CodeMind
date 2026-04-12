/**
 * Graph store — selected node, graph filter state.
 * Uses Zustand for selector-based re-renders.
 */
import { create } from 'zustand';

interface GraphState {
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  toggleNodeSelection: (id: string) => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  selectedNodeId: null,

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  toggleNodeSelection: (id) =>
    set({ selectedNodeId: get().selectedNodeId === id ? null : id }),
}));
