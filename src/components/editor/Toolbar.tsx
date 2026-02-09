// Top toolbar with controls

import { Undo2, Redo2, ZoomIn, ZoomOut, Grid3x3, Save, Download } from 'lucide-react';
import { useComponentStore, useCanvasStore } from '../../stores';

export function Toolbar() {
  const componentStore = useComponentStore();
  const canvasStore = useCanvasStore();

  const canUndo = componentStore.historyIndex > 0;
  const canRedo = componentStore.historyIndex < componentStore.history.length - 1;

  return (
    <div className="h-14 px-4 flex items-center justify-between bg-card">
      {/* Left - Logo/Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold">TUI Designer</h1>
        <div className="text-sm text-muted-foreground">
          Phase 2: Editor UI
        </div>
      </div>

      {/* Center - Tools */}
      <div className="flex items-center gap-2">
        {/* Undo/Redo */}
        <div className="flex items-center gap-1 px-2 border-r border-border">
          <button
            onClick={() => componentStore.undo()}
            disabled={!canUndo}
            className="p-2 hover:bg-accent rounded disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo (Cmd+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => componentStore.redo()}
            disabled={!canRedo}
            className="p-2 hover:bg-accent rounded disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo (Cmd+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1 px-2 border-r border-border">
          <button
            onClick={() => canvasStore.setZoom(canvasStore.zoom - 0.25)}
            disabled={canvasStore.zoom <= 0.25}
            className="p-2 hover:bg-accent rounded disabled:opacity-30"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="min-w-[4rem] text-center text-sm">
            {Math.round(canvasStore.zoom * 100)}%
          </span>
          <button
            onClick={() => canvasStore.setZoom(canvasStore.zoom + 0.25)}
            disabled={canvasStore.zoom >= 4}
            className="p-2 hover:bg-accent rounded disabled:opacity-30"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => canvasStore.resetView()}
            className="px-2 py-1 text-xs hover:bg-accent rounded"
            title="Reset View"
          >
            Reset
          </button>
        </div>

        {/* Grid */}
        <div className="flex items-center gap-1 px-2">
          <button
            onClick={() => canvasStore.toggleGrid()}
            className={`p-2 hover:bg-accent rounded ${
              canvasStore.showGrid ? 'bg-accent' : ''
            }`}
            title="Toggle Grid"
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2">
        <button className="px-3 py-1.5 text-sm hover:bg-accent rounded flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save
        </button>
        <button className="px-3 py-1.5 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>
    </div>
  );
}
