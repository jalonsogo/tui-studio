// Selection state management

import { create } from 'zustand';
import { useComponentStore } from './componentStore';
import type { ComponentNode } from '../types';

interface SelectionState {
  selectedIds: Set<string>;
  hoveredId: string | null;
  focusedId: string | null;

  // Actions
  select: (id: string, addToSelection?: boolean) => void;
  selectMultiple: (ids: string[]) => void;
  deselect: (id: string) => void;
  clearSelection: () => void;
  setHovered: (id: string | null) => void;
  setFocused: (id: string | null) => void;

  // Queries
  isSelected: (id: string) => boolean;
  getSelectedComponents: () => ComponentNode[];
  getSelectedCount: () => number;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  // Initial state
  selectedIds: new Set(),
  hoveredId: null,
  focusedId: null,

  // Select
  select: (id, addToSelection = false) => {
    set((state) => {
      const newSelectedIds = addToSelection
        ? new Set(state.selectedIds)
        : new Set<string>();

      if (newSelectedIds.has(id)) {
        newSelectedIds.delete(id);
      } else {
        newSelectedIds.add(id);
      }

      return {
        selectedIds: newSelectedIds,
        focusedId: id,
      };
    });
  },

  // Select multiple
  selectMultiple: (ids) => {
    set({ selectedIds: new Set(ids) });
  },

  // Deselect
  deselect: (id) => {
    set((state) => {
      const newSelectedIds = new Set(state.selectedIds);
      newSelectedIds.delete(id);
      return { selectedIds: newSelectedIds };
    });
  },

  // Clear selection
  clearSelection: () => {
    set({ selectedIds: new Set(), focusedId: null });
  },

  // Set hovered
  setHovered: (id) => {
    set({ hoveredId: id });
  },

  // Set focused
  setFocused: (id) => {
    set({ focusedId: id });
  },

  // Is selected
  isSelected: (id) => {
    return get().selectedIds.has(id);
  },

  // Get selected components
  getSelectedComponents: () => {
    const { selectedIds } = get();
    const componentStore = useComponentStore.getState();

    return Array.from(selectedIds)
      .map((id) => componentStore.getComponent(id))
      .filter((c): c is ComponentNode => c !== undefined);
  },

  // Get selected count
  getSelectedCount: () => {
    return get().selectedIds.size;
  },
}));
