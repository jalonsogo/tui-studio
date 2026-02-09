// Test component to demonstrate stores working

import { useEffect } from 'react';
import { useComponentStore, useCanvasStore, useSelectionStore, useThemeStore } from '../../stores';
import { COMPONENT_LIBRARY } from '../../constants/components';
import type { ComponentNode } from '../../types';

export function StoreTest() {
  const componentStore = useComponentStore();
  const canvasStore = useCanvasStore();
  const selectionStore = useSelectionStore();
  const themeStore = useThemeStore();

  // Initialize with a sample component tree
  useEffect(() => {
    if (!componentStore.root) {
      const sampleRoot: ComponentNode = {
        id: 'root',
        type: 'Box',
        name: 'Root Container',
        props: { width: 80, height: 24 },
        layout: {
          type: 'flexbox',
          direction: 'column',
          gap: 2,
          padding: 2,
        },
        style: {
          border: true,
          borderStyle: 'double',
          borderColor: 'cyan',
        },
        events: {},
        children: [],
        locked: false,
        hidden: false,
        collapsed: false,
      };

      componentStore.setRoot(sampleRoot);
    }
  }, [componentStore]);

  const addTestComponent = (type: 'Box' | 'Button' | 'Text' | 'TextInput') => {
    const def = COMPONENT_LIBRARY[type];
    const parentId = componentStore.root?.id;

    if (!parentId) return;

    const newComponent: Omit<ComponentNode, 'id'> = {
      type: def.type,
      name: `${def.name} ${Date.now() % 1000}`,
      props: { ...def.defaultProps },
      layout: { ...def.defaultLayout },
      style: { ...def.defaultStyle },
      events: { ...def.defaultEvents },
      children: [],
      locked: false,
      hidden: false,
      collapsed: false,
    };

    const id = componentStore.addComponent(parentId, newComponent);
    selectionStore.select(id);
  };

  const selectedComponents = selectionStore.getSelectedComponents();
  const selectedComponent = selectedComponents[0];

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">TUI Designer - Store Test</h1>
          <p className="text-muted-foreground">Phase 1: Data Model Complete ✓</p>
        </div>

        {/* Theme Controls */}
        <div className="border border-border rounded-lg p-6 bg-card">
          <h2 className="text-2xl font-semibold mb-4">Theme Store</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => themeStore.toggleDarkMode()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded"
              >
                Toggle Dark Mode (Currently: {themeStore.darkMode ? 'Dark' : 'Light'})
              </button>
            </div>
            <div className="flex items-center gap-4">
              <label>Color Mode:</label>
              <select
                value={themeStore.colorMode}
                onChange={(e) => themeStore.setColorMode(e.target.value as any)}
                className="px-3 py-1 bg-secondary rounded"
              >
                <option value="ansi16">ANSI 16</option>
                <option value="ansi256">ANSI 256</option>
                <option value="trueColor">True Color</option>
              </select>
            </div>
          </div>
        </div>

        {/* Canvas Controls */}
        <div className="border border-border rounded-lg p-6 bg-card">
          <h2 className="text-2xl font-semibold mb-4">Canvas Store</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">Canvas Size:</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={canvasStore.width}
                  onChange={(e) => canvasStore.setCanvasSize(parseInt(e.target.value), canvasStore.height)}
                  className="px-3 py-1 bg-secondary rounded w-20"
                />
                <span>×</span>
                <input
                  type="number"
                  value={canvasStore.height}
                  onChange={(e) => canvasStore.setCanvasSize(canvasStore.width, parseInt(e.target.value))}
                  className="px-3 py-1 bg-secondary rounded w-20"
                />
              </div>
            </div>
            <div>
              <label className="block mb-2">Zoom: {(canvasStore.zoom * 100).toFixed(0)}%</label>
              <input
                type="range"
                min="0.25"
                max="4"
                step="0.25"
                value={canvasStore.zoom}
                onChange={(e) => canvasStore.setZoom(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={canvasStore.showGrid}
                onChange={() => canvasStore.toggleGrid()}
                id="show-grid"
              />
              <label htmlFor="show-grid">Show Grid</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={canvasStore.snapToGrid}
                onChange={() => canvasStore.toggleSnapToGrid()}
                id="snap-grid"
              />
              <label htmlFor="snap-grid">Snap to Grid</label>
            </div>
          </div>
        </div>

        {/* Component Tree */}
        <div className="border border-border rounded-lg p-6 bg-card">
          <h2 className="text-2xl font-semibold mb-4">Component Store</h2>

          {/* Add Component Buttons */}
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => addTestComponent('Box')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Box
            </button>
            <button
              onClick={() => addTestComponent('Button')}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Add Button
            </button>
            <button
              onClick={() => addTestComponent('Text')}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Add Text
            </button>
            <button
              onClick={() => addTestComponent('TextInput')}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Add Input
            </button>
          </div>

          {/* History Controls */}
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => componentStore.undo()}
              disabled={componentStore.historyIndex <= 0}
              className="px-4 py-2 bg-secondary rounded disabled:opacity-50"
            >
              ↶ Undo
            </button>
            <button
              onClick={() => componentStore.redo()}
              disabled={componentStore.historyIndex >= componentStore.history.length - 1}
              className="px-4 py-2 bg-secondary rounded disabled:opacity-50"
            >
              ↷ Redo
            </button>
            <span className="px-4 py-2 text-muted-foreground">
              History: {componentStore.historyIndex + 1} / {componentStore.history.length}
            </span>
          </div>

          {/* Component Tree Display */}
          <div className="bg-secondary/50 rounded p-4 font-mono text-sm max-h-96 overflow-auto">
            {componentStore.root ? (
              <ComponentTreeDisplay node={componentStore.root} level={0} />
            ) : (
              <p className="text-muted-foreground">No components yet</p>
            )}
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="bg-secondary/30 rounded p-3">
              <div className="text-2xl font-bold">{componentStore.components.size}</div>
              <div className="text-sm text-muted-foreground">Total Components</div>
            </div>
            <div className="bg-secondary/30 rounded p-3">
              <div className="text-2xl font-bold">{selectionStore.selectedIds.size}</div>
              <div className="text-sm text-muted-foreground">Selected</div>
            </div>
            <div className="bg-secondary/30 rounded p-3">
              <div className="text-2xl font-bold">{componentStore.root?.children.length || 0}</div>
              <div className="text-sm text-muted-foreground">Root Children</div>
            </div>
          </div>
        </div>

        {/* Selected Component */}
        {selectedComponent && (
          <div className="border border-border rounded-lg p-6 bg-card">
            <h2 className="text-2xl font-semibold mb-4">Selected Component</h2>
            <div className="space-y-2 font-mono text-sm">
              <div><span className="text-muted-foreground">ID:</span> {selectedComponent.id}</div>
              <div><span className="text-muted-foreground">Type:</span> {selectedComponent.type}</div>
              <div><span className="text-muted-foreground">Name:</span> {selectedComponent.name}</div>
              <div className="mt-4">
                <button
                  onClick={() => {
                    const id = componentStore.duplicateComponent(selectedComponent.id);
                    if (id) selectionStore.select(id);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded mr-2"
                >
                  Duplicate
                </button>
                <button
                  onClick={() => {
                    componentStore.removeComponent(selectedComponent.id);
                    selectionStore.clearSelection();
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component to display tree
function ComponentTreeDisplay({ node, level }: { node: ComponentNode; level: number }) {
  const selectionStore = useSelectionStore();
  const isSelected = selectionStore.isSelected(node.id);

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer ${
          isSelected ? 'bg-primary/20' : 'hover:bg-secondary/50'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => selectionStore.select(node.id)}
      >
        <span className="text-muted-foreground">
          {node.children.length > 0 ? '▼' : '·'}
        </span>
        <span className="font-semibold text-cyan-400">{node.type}</span>
        <span className="text-muted-foreground">-</span>
        <span>{node.name}</span>
        {isSelected && <span className="text-xs text-primary ml-auto">◀ selected</span>}
      </div>
      {node.children.map((child) => (
        <ComponentTreeDisplay key={child.id} node={child} level={level + 1} />
      ))}
    </div>
  );
}
