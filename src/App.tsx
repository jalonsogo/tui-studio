import { useEffect, useState } from 'react';
import './App.css';
import { EditorLayout } from './components/editor/EditorLayout';
import { Toolbar } from './components/editor/Toolbar';
import { LeftSidebar } from './components/editor/LeftSidebar';
import { Canvas } from './components/editor/Canvas';
import { PropertyPanel } from './components/properties/PropertyPanel';
import { LayoutDebugPanel } from './components/debug/LayoutDebugPanel';
import { CommandPalette } from './components/editor/CommandPalette';
import { useComponentStore, useSelectionStore } from './stores';
import { COMPONENT_LIBRARY } from './constants/components';
import type { ComponentType } from './types';

function App() {
  const componentStore = useComponentStore();
  const selectionStore = useSelectionStore();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Enable dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Command palette keyboard shortcut (Ctrl/Cmd+P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle adding component from command palette
  const handleAddComponent = (type: ComponentType) => {
    const root = componentStore.root;
    let parentId = root?.id;

    // Create root if it doesn't exist
    if (!parentId) {
      const newRoot: import('./types').ComponentNode = {
        id: 'root',
        type: 'Screen',
        name: 'Main Screen',
        props: { width: 80, height: 24, theme: 'dracula' },
        layout: {
          type: 'absolute',
        },
        style: {
          border: false,
        },
        events: {},
        children: [],
        locked: false,
        hidden: false,
        collapsed: false,
      };
      componentStore.setRoot(newRoot);
      parentId = 'root';
    }

    const def = COMPONENT_LIBRARY[type];
    if (def) {
      // Calculate position with offset so components don't stack
      const existingChildren = root?.children.length || 0;
      const offsetX = existingChildren * 2;
      const offsetY = existingChildren * 2;

      const newComponent: Omit<import('./types').ComponentNode, 'id'> = {
        type: def.type,
        name: def.name,
        props: { ...def.defaultProps },
        layout: {
          ...def.defaultLayout,
          x: offsetX,
          y: offsetY,
        },
        style: { ...def.defaultStyle },
        events: { ...def.defaultEvents },
        children: [],
        locked: false,
        hidden: false,
        collapsed: false,
      };

      const id = componentStore.addComponent(parentId, newComponent);
      if (id) {
        selectionStore.select(id);
      }
    }
  };

  return (
    <>
      <EditorLayout
        toolbar={<Toolbar />}
        leftSidebar={<LeftSidebar />}
        canvas={<Canvas />}
        rightSidebar={<PropertyPanel />}
        debugPanel={<LayoutDebugPanel />}
      />
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onAddComponent={handleAddComponent}
      />
    </>
  );
}

export default App;
