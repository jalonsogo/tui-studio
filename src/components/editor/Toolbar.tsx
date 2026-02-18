// Top toolbar with controls

import { useState, useEffect } from 'react';
import { Undo2, Redo2, ZoomIn, ZoomOut, Grid3x3, Save, Download, Palette, Search } from 'lucide-react';
import { useComponentStore, useCanvasStore, useThemeStore } from '../../stores';
import { ExportModal } from '../export/ExportModal';
import { THEME_NAMES } from '../../stores/themeStore';
import { ComponentToolbar } from './ComponentToolbar';

export function Toolbar() {
  const componentStore = useComponentStore();
  const canvasStore = useCanvasStore();
  const themeStore = useThemeStore();
  const [exportOpen, setExportOpen] = useState(false);
  const [isToolbarDocked, setIsToolbarDocked] = useState(() =>
    JSON.parse(localStorage.getItem('toolbar-docked') || 'false')
  );

  const canUndo = componentStore.historyIndex > 0;
  const canRedo = componentStore.historyIndex < componentStore.history.length - 1;

  // Listen for toolbar dock state changes
  useEffect(() => {
    const handleDockedChange = () => {
      setIsToolbarDocked(JSON.parse(localStorage.getItem('toolbar-docked') || 'false'));
    };
    window.addEventListener('toolbar-docked-changed', handleDockedChange);
    return () => window.removeEventListener('toolbar-docked-changed', handleDockedChange);
  }, []);

  return (
    <>
      <div className="h-14 px-4 flex items-center justify-between bg-background border-b border-border">
        {/* Left - Logo/Title */}
        <div className="flex items-center gap-3">
          <img src="/tui-studio.svg" alt="TUIStudio" className="w-7 h-7" />
          <div>
            <h1 className="text-sm font-semibold leading-none">TUIStudio</h1>
            <div className="text-[10px] text-muted-foreground mt-0.5">Terminal UI Design Tool</div>
          </div>
        </div>

      {/* Center - Tools */}
      <div className="flex items-center gap-2">
        {/* Component Toolbar (when docked) */}
        {isToolbarDocked && (
          <>
            <ComponentToolbar docked={true} />
            {/* Separator */}
            <div className="h-6 w-px bg-border" />
          </>
        )}

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => componentStore.undo()}
            disabled={!canUndo}
            className="p-2 hover:bg-accent rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Undo (Cmd+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => componentStore.redo()}
            disabled={!canRedo}
            className="p-2 hover:bg-accent rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Redo (Cmd+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1 bg-card rounded-lg px-1 py-0.5">
          <button
            onClick={() => canvasStore.setZoom(canvasStore.zoom - 0.25)}
            disabled={canvasStore.zoom <= 0.25}
            className="p-1.5 hover:bg-accent rounded-md disabled:opacity-30 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="min-w-[3.5rem] text-center text-xs font-medium px-1">
            {Math.round(canvasStore.zoom * 100)}%
          </span>
          <button
            onClick={() => canvasStore.setZoom(canvasStore.zoom + 0.25)}
            disabled={canvasStore.zoom >= 4}
            className="p-1.5 hover:bg-accent rounded-md disabled:opacity-30 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
        <button
          onClick={() => canvasStore.resetView()}
          className="px-2.5 py-1.5 text-xs hover:bg-accent rounded-lg transition-colors"
          title="Reset View"
        >
          Reset
        </button>

        {/* Grid */}
        <button
          onClick={() => canvasStore.toggleGrid()}
          className={`p-2 hover:bg-accent rounded-lg transition-colors ${
            canvasStore.showGrid ? 'bg-accent' : ''
          }`}
          title="Toggle Grid"
        >
          <Grid3x3 className="w-4 h-4" />
        </button>

        {/* Theme Selector */}
        <div className="flex items-center gap-2 bg-card rounded-lg px-2.5 py-1.5">
          <Palette className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={themeStore.currentTheme}
            onChange={(e) => themeStore.setTheme(e.target.value as any)}
            className="text-xs bg-transparent border-none outline-none cursor-pointer text-foreground"
            title="Color Theme"
          >
            {THEME_NAMES.map((theme) => (
              <option key={theme.value} value={theme.value} className="bg-card">
                {theme.label}
              </option>
            ))}
          </select>
        </div>

        {/* Command Palette */}
        <button
          onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
          title="Command Palette (Ctrl+P)"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => window.dispatchEvent(new Event('command-save'))}
          className="px-3 py-2 text-sm hover:bg-accent rounded-lg flex items-center gap-2 transition-colors"
          title="Save (Cmd+S)"
        >
          <Save className="w-4 h-4" />
          <span className="font-medium">Save</span>
        </button>
        <button
          onClick={() => setExportOpen(true)}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg flex items-center gap-2 font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>
    </div>

      {/* Export Modal */}
      <ExportModal isOpen={exportOpen} onClose={() => setExportOpen(false)} />
    </>
  );
}
