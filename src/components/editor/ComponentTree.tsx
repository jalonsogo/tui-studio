// Hierarchical component tree view

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Square,
  Columns,
  Space,
  MousePointerClick,
  Type,
  CheckSquare,
  Circle,
  ChevronDown as SelectIcon,
  ToggleLeft,
  FileText,
  Loader2,
  Activity,
  Table2,
  List,
  GitBranch,
  Menu as MenuIconType,
  FolderTree,
  Navigation,
  PanelTop,
  MessageSquare,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { useComponentStore, useSelectionStore } from '../../stores';
import type { ComponentNode, ComponentType } from '../../types';
import { dragStore } from '../../hooks/useDragAndDrop';
import { COMPONENT_LIBRARY, canHaveChildren } from '../../constants/components';
import { findNodeById } from '../../utils/treeUtils';

// In-memory style clipboard (module-level, shared across all TreeNodes)
let styleClipboard: ComponentNode['style'] | null = null;

// ── Context Menu ──────────────────────────────────────────────────────────────

interface ContextMenuState {
  x: number;
  y: number;
  nodeId: string;
}

interface ContextMenuProps {
  state: ContextMenuState;
  node: ComponentNode;
  onClose: () => void;
}

function ContextMenu({ state, node, onClose }: ContextMenuProps) {
  const componentStore = useComponentStore();
  const selectionStore = useSelectionStore();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  // Clamp position to viewport
  const [pos, setPos] = useState({ x: state.x, y: state.y });
  useEffect(() => {
    if (!menuRef.current) return;
    const { width, height } = menuRef.current.getBoundingClientRect();
    setPos({
      x: Math.min(state.x, window.innerWidth  - width  - 8),
      y: Math.min(state.y, window.innerHeight - height - 8),
    });
  }, [state.x, state.y]);

  const run = (fn: () => void) => { fn(); onClose(); };

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleCopy = () => run(() => {
    // Dispatch the same copy event handled in App.tsx
    selectionStore.select(node.id);
    window.dispatchEvent(new CustomEvent('tree-context-copy', { detail: { id: node.id } }));
  });

  const handleCopyStyle = () => run(() => {
    styleClipboard = { ...node.style };
  });

  const handlePasteStyle = () => run(() => {
    if (!styleClipboard) return;
    componentStore.updateComponent(node.id, { style: { ...node.style, ...styleClipboard } });
  });

  const wrapInBox = () => run(() => {
    const parent = componentStore.getParent(node.id);
    if (!parent) return;
    const index = parent.children.findIndex(c => c.id === node.id);
    const boxDef = COMPONENT_LIBRARY['Box'];
    const newBoxId = componentStore.addComponent(parent.id, {
      type: 'Box',
      name: 'Box',
      props:   { ...boxDef.defaultProps },
      layout:  { ...boxDef.defaultLayout },
      style:   { ...boxDef.defaultStyle },
      events:  { ...boxDef.defaultEvents },
      children: [],
      locked: false,
      hidden: false,
      collapsed: false,
    }, index);
    if (newBoxId) {
      componentStore.moveComponent(node.id, newBoxId);
      selectionStore.select(newBoxId);
    }
  });

  const handleRename = () => run(() => {
    // Signal the TreeNode to start inline editing
    window.dispatchEvent(new CustomEvent('tree-start-rename', { detail: { id: node.id } }));
  });

  const handleToggleVisible = () => run(() => {
    componentStore.updateComponent(node.id, { hidden: !node.hidden });
  });

  const handleToggleLock = () => run(() => {
    componentStore.updateComponent(node.id, { locked: !node.locked });
  });

  const handleDelete = () => run(() => {
    if (node.id === 'root' || node.locked) return;
    componentStore.removeComponent(node.id);
    selectionStore.clearSelection();
  });

  const isRoot = node.id === 'root';

  type Item =
    | { type: 'item'; label: string; action: () => void; disabled?: boolean; destructive?: boolean }
    | { type: 'sep' };

  const items: Item[] = [
    { type: 'item', label: 'Copy',                   action: handleCopy,          disabled: isRoot },
    { type: 'item', label: 'Copy Style Properties',  action: handleCopyStyle },
    { type: 'item', label: 'Paste Style Properties', action: handlePasteStyle,    disabled: !styleClipboard || isRoot },
    { type: 'sep' },
    { type: 'item', label: 'Group into Box',         action: wrapInBox,           disabled: isRoot },
    { type: 'item', label: 'Rename',                 action: handleRename,        disabled: isRoot },
    { type: 'sep' },
    { type: 'item', label: 'Add to Box',             action: wrapInBox,           disabled: isRoot },
    { type: 'sep' },
    { type: 'item', label: node.hidden ? 'Show'  : 'Hide',   action: handleToggleVisible, disabled: isRoot },
    { type: 'item', label: node.locked ? 'Unlock': 'Lock',   action: handleToggleLock },
    { type: 'sep' },
    { type: 'item', label: 'Delete',                 action: handleDelete,        disabled: isRoot || node.locked, destructive: true },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] w-52 bg-popover border border-border rounded-lg shadow-2xl py-1 text-sm"
      style={{ left: pos.x, top: pos.y }}
    >
      {items.map((item, i) => {
        if (item.type === 'sep') {
          return <div key={i} className="my-1 border-t border-border/40" />;
        }
        return (
          <button
            key={i}
            onClick={item.disabled ? undefined : item.action}
            disabled={item.disabled}
            className={`w-full text-left px-3 py-1.5 transition-colors ${
              item.disabled
                ? 'opacity-30 cursor-not-allowed'
                : item.destructive
                  ? 'hover:bg-destructive/20 text-destructive'
                  : 'hover:bg-accent'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

// Map component types to their icons
export function getComponentIcon(type: ComponentType) {
  const iconProps = { className: 'w-3.5 h-3.5 flex-shrink-0' };

  switch (type) {
    // Layout
    case 'Screen':
      return <PanelTop {...iconProps} />;
    case 'Box':
      return <Square {...iconProps} />;
    case 'Grid':
      return <Columns {...iconProps} />;
    case 'Spacer':
      return <Space {...iconProps} />;

    // Input
    case 'Button':
      return <MousePointerClick {...iconProps} />;
    case 'TextInput':
      return <Type {...iconProps} />;
    case 'Checkbox':
      return <CheckSquare {...iconProps} />;
    case 'Radio':
      return <Circle {...iconProps} />;
    case 'Select':
      return <SelectIcon {...iconProps} />;
    case 'Toggle':
      return <ToggleLeft {...iconProps} />;

    // Display
    case 'Text':
      return <FileText {...iconProps} />;
    case 'Spinner':
      return <Loader2 {...iconProps} />;
    case 'ProgressBar':
      return <Activity {...iconProps} />;

    // Data
    case 'Table':
      return <Table2 {...iconProps} />;
    case 'List':
      return <List {...iconProps} />;
    case 'Tree':
      return <GitBranch {...iconProps} />;

    // Navigation
    case 'Menu':
      return <MenuIconType {...iconProps} />;
    case 'Tabs':
      return <FolderTree {...iconProps} />;
    case 'Breadcrumb':
      return <Navigation {...iconProps} />;

    // Overlay
    case 'Modal':
      return <PanelTop {...iconProps} />;
    case 'Popover':
      return <MessageSquare {...iconProps} />;
    case 'Tooltip':
      return <Info {...iconProps} />;

    default:
      return <Square {...iconProps} />;
  }
}

export function ComponentTree({ warningNodeIds = new Set<string>() }: { warningNodeIds?: Set<string> }) {
  const componentStore = useComponentStore();
  const [canvasMenu, setCanvasMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  // Listen for right-click events dispatched from canvas objects
  useEffect(() => {
    const handler = (e: Event) => {
      const { id, x, y } = (e as CustomEvent).detail;
      setCanvasMenu({ id, x, y });
    };
    window.addEventListener('canvas-context-menu', handler);
    return () => window.removeEventListener('canvas-context-menu', handler);
  }, []);

  const canvasMenuNode = canvasMenu && componentStore.root
    ? findNodeById(componentStore.root, canvasMenu.id)
    : null;

  if (!componentStore.root) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No components yet. Add some from the palette!
      </div>
    );
  }

  return (
    <div className="p-2">
      <TreeNode node={componentStore.root} level={0} warningNodeIds={warningNodeIds} />
      {canvasMenu && canvasMenuNode && (
        <ContextMenu
          state={{ x: canvasMenu.x, y: canvasMenu.y, nodeId: canvasMenu.id }}
          node={canvasMenuNode}
          onClose={() => setCanvasMenu(null)}
        />
      )}
    </div>
  );
}

function TreeNode({ node, level, warningNodeIds }: { node: ComponentNode; level: number; warningNodeIds: Set<string> }) {
  const componentStore = useComponentStore();
  const selectionStore = useSelectionStore();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [insertionIndex, setInsertionIndex] = useState<number | null>(null);
  const [insertBefore, setInsertBefore] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.select();
    }
  }, [isEditing]);

  // Listen for rename triggered from context menu
  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail?.id === node.id) {
        setEditName(node.name);
        setIsEditing(true);
      }
    };
    window.addEventListener('tree-start-rename', handler);
    return () => window.removeEventListener('tree-start-rename', handler);
  }, [node.id, node.name]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
    if (node.id !== 'root') selectionStore.select(node.id);
  }, [node.id, selectionStore]);

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditName(node.name);
    setIsEditing(true);
  };

  const commitEdit = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== node.name) {
      componentStore.updateComponent(node.id, { name: trimmed });
    }
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditName(node.name);
  };

  const isSelected = selectionStore.isSelected(node.id);
  const hasChildren = node.children.length > 0;

  const toggleCollapsed = () => {
    componentStore.updateComponent(node.id, {
      collapsed: !node.collapsed,
    });
  };

  const toggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    componentStore.updateComponent(node.id, {
      hidden: !node.hidden,
    });
  };

  const toggleLocked = (e: React.MouseEvent) => {
    e.stopPropagation();
    componentStore.updateComponent(node.id, {
      locked: !node.locked,
    });
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    dragStore.startDrag({
      type: 'existing-component',
      componentId: node.id,
    });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', node.id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    dragStore.endDrag();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Calculate if we should insert before or make child
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const nodeHeight = rect.height;

    // Top 25% = insert before this node (as sibling)
    // Middle 50% = make child of this node (only if container)
    // Bottom 25% = insert after this node (as sibling)

    if (mouseY < nodeHeight * 0.25) {
      setInsertBefore(true);
      setIsDragOver(false);
      setInsertionIndex(null);
    } else if (mouseY > nodeHeight * 0.75) {
      setInsertBefore(false);
      setIsDragOver(false);
      setInsertionIndex(-1); // Special value for "after"
    } else {
      // Middle zone - only show drop indicator if this is a container
      if (canHaveChildren(node.type)) {
        setInsertBefore(false);
        setIsDragOver(true);
        setInsertionIndex(null);
      } else {
        // Not a container - don't show drop indicator
        setInsertBefore(false);
        setIsDragOver(false);
        setInsertionIndex(null);
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragOver(false);
    setInsertBefore(false);
    setInsertionIndex(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setInsertBefore(false);
    setInsertionIndex(null);

    const dragData = dragStore.dragData;
    if (!dragData) return;

    // Get parent and calculate insertion index
    const parent = componentStore.getParent(node.id);

    if (dragData.type === 'existing-component' && dragData.componentId) {
      // Don't drop on self or descendants
      if (dragData.componentId === node.id) return;

      if (insertBefore && parent) {
        // Insert before this node (as sibling)
        const index = parent.children.findIndex(c => c.id === node.id);
        componentStore.moveComponent(dragData.componentId, parent.id, index);
      } else if (insertionIndex === -1 && parent) {
        // Insert after this node (as sibling)
        const index = parent.children.findIndex(c => c.id === node.id);
        componentStore.moveComponent(dragData.componentId, parent.id, index + 1);
      } else if (canHaveChildren(node.type)) {
        // Make child of this node (only if container)
        componentStore.moveComponent(dragData.componentId, node.id);
      }
    } else if (dragData.type === 'new-component' && dragData.componentType) {
      const def = COMPONENT_LIBRARY[dragData.componentType];
      if (!def) return;

      const newComponent: Omit<ComponentNode, 'id'> = {
        type: def.type,
        name: def.name,
        props: { ...def.defaultProps },
        layout: { ...def.defaultLayout },
        style: { ...def.defaultStyle },
        events: { ...def.defaultEvents },
        children: [],
        locked: false,
        hidden: false,
        collapsed: false,
      };

      if (insertBefore && parent) {
        // Insert before this node (as sibling)
        const index = parent.children.findIndex(c => c.id === node.id);
        componentStore.addComponent(parent.id, newComponent, index);
      } else if (insertionIndex === -1 && parent) {
        // Insert after this node (as sibling)
        const index = parent.children.findIndex(c => c.id === node.id);
        componentStore.addComponent(parent.id, newComponent, index + 1);
      } else if (canHaveChildren(node.type)) {
        // Add as child of this node (only if container)
        componentStore.addComponent(node.id, newComponent);
      }
    }

    dragStore.endDrag();
  };

  return (
    <div className="relative">
      {/* Insertion line - before */}
      {insertBefore && (
        <div
          className="absolute left-0 right-0 h-0.5 bg-primary z-10"
          style={{ top: '-1px', left: `${level * 12 + 8}px` }}
        />
      )}

      {/* Insertion line - after */}
      {insertionIndex === -1 && (
        <div
          className="absolute left-0 right-0 h-0.5 bg-primary z-10"
          style={{ bottom: '-1px', left: `${level * 12 + 8}px` }}
        />
      )}

      {/* Node */}
      <div
        draggable={!node.locked}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onContextMenu={handleContextMenu}
        className={`flex items-center gap-1 px-2 py-1 rounded cursor-grab group transition-colors ${
          isSelected ? 'bg-primary/20 border border-primary' : 'hover:bg-accent'
        } ${node.hidden ? 'opacity-50' : ''} ${
          isDragOver ? 'bg-primary/30 border-2 border-dashed border-primary' : ''
        } ${isDragging ? 'opacity-30' : ''}`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => { if (node.id !== 'root') selectionStore.select(node.id); }}
      >
        {/* Expand/Collapse */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapsed();
            }}
            className="flex-shrink-0 hover:bg-secondary rounded p-0.5"
          >
            {node.collapsed ? (
              <ChevronRight className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}

        {/* Icon & Name */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-muted-foreground flex-shrink-0">
            {getComponentIcon(node.type)}
          </span>
          {warningNodeIds.has(node.id) && (
            <AlertTriangle className="w-3 h-3 text-yellow-500 flex-shrink-0" title="Layout warning" />
          )}
          {isEditing ? (
            <input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
                if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 min-w-0 text-xs bg-background border border-primary rounded px-1 py-0 outline-none"
            />
          ) : (
            <span
              className="text-xs truncate"
              onDoubleClick={startEditing}
            >
              {node.name}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {node.id !== 'root' && (
            <button
              onClick={toggleVisibility}
              className="p-1 hover:bg-secondary rounded"
              title={node.hidden ? 'Show' : 'Hide'}
            >
              {node.hidden ? (
                <EyeOff className="w-3 h-3" />
              ) : (
                <Eye className="w-3 h-3" />
              )}
            </button>
          )}
          <button
            onClick={toggleLocked}
            className="p-1 hover:bg-secondary rounded"
            title={node.locked ? 'Unlock' : 'Lock'}
          >
            {node.locked ? (
              <Lock className="w-3 h-3" />
            ) : (
              <Unlock className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && !node.collapsed && (
        <div>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} level={level + 1} warningNodeIds={warningNodeIds} />
          ))}
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          state={{ x: contextMenu.x, y: contextMenu.y, nodeId: node.id }}
          node={node}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
