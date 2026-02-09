// Canvas/viewport state management

import { create } from 'zustand';

interface CanvasState {
  // Dimensions (in terminal columns/rows)
  width: number;
  height: number;

  // View
  zoom: number;    // 1.0 = 100%
  panX: number;
  panY: number;

  // Grid
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number; // Cell size

  // Actions
  setCanvasSize: (width: number, height: number) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  resetView: () => void;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  // Initial state - default terminal size
  width: 80,
  height: 24,
  zoom: 1.0,
  panX: 0,
  panY: 0,
  showGrid: true,
  snapToGrid: false,
  gridSize: 1,

  // Set canvas size
  setCanvasSize: (width, height) => {
    set({
      width: Math.max(10, Math.min(200, width)),
      height: Math.max(10, Math.min(100, height)),
    });
  },

  // Set zoom
  setZoom: (zoom) => {
    set({
      zoom: Math.max(0.25, Math.min(4, zoom)),
    });
  },

  // Set pan
  setPan: (x, y) => {
    set({ panX: x, panY: y });
  },

  // Reset view
  resetView: () => {
    set({ zoom: 1.0, panX: 0, panY: 0 });
  },

  // Toggle grid
  toggleGrid: () => {
    set((state) => ({ showGrid: !state.showGrid }));
  },

  // Toggle snap to grid
  toggleSnapToGrid: () => {
    set((state) => ({ snapToGrid: !state.snapToGrid }));
  },

  // Set grid size
  setGridSize: (size) => {
    set({ gridSize: Math.max(1, size) });
  },
}));
