// Component tree state management

import { create } from 'zustand';
import type { ComponentNode } from '../types';
import { findNodeById, findParentNode, flattenTree, cloneNode } from '../utils/treeUtils';
import { generateComponentId } from '../utils/idGenerator';

interface ComponentState {
  // Tree
  root: ComponentNode | null;
  components: Map<string, ComponentNode>; // Flat lookup

  // History
  history: ComponentNode[][];
  historyIndex: number;
  maxHistorySize: number;

  // Actions - Tree manipulation
  setRoot: (root: ComponentNode | null) => void;
  addComponent: (parentId: string, component: Omit<ComponentNode, 'id'>, index?: number) => string;
  removeComponent: (id: string) => void;
  updateComponent: (id: string, updates: Partial<ComponentNode>) => void;
  moveComponent: (id: string, newParentId: string, index?: number) => void;
  duplicateComponent: (id: string) => string | null;
  groupComponents: (ids: string[], boxData: Omit<ComponentNode, 'id' | 'children'>) => string | null;
  ungroupComponents: (ids: string[]) => string[];

  // Actions - Properties
  updateProps: (id: string, props: Partial<ComponentNode['props']>) => void;
  updateLayout: (id: string, layout: Partial<ComponentNode['layout']>) => void;
  updateStyle: (id: string, style: Partial<ComponentNode['style']>) => void;
  updateEvents: (id: string, events: Partial<ComponentNode['events']>) => void;

  // Actions - History
  undo: () => void;
  redo: () => void;
  saveHistory: () => void;

  // Queries
  getComponent: (id: string) => ComponentNode | undefined;
  getParent: (id: string) => ComponentNode | undefined;
  getChildren: (id: string) => ComponentNode[];
}

export const useComponentStore = create<ComponentState>((set, get) => ({
  // Initial state
  root: null,
  components: new Map(),
  history: [],
  historyIndex: -1,
  maxHistorySize: 50,

  // Set root
  setRoot: (root) => {
    set({
      root,
      components: flattenTree(root),
    });
    get().saveHistory();
  },

  // Add component
  addComponent: (parentId, componentData, index) => {
    const { root } = get();
    if (!root) {
      return '';
    }

    // Clone tree FIRST to create new references
    const newRoot = cloneNode(root);

    // Find parent in the NEW tree
    const parent = findNodeById(newRoot, parentId);
    if (!parent) {
      return '';
    }

    const id = generateComponentId();
    const newComponent: ComponentNode = {
      ...componentData,
      id,
      children: [],
    };

    // If parent is a container and has explicit height/width, change to auto so it fits children
    if (['Box', 'Grid'].includes(parent.type)) {
      if (typeof parent.props.height === 'number') {
        parent.props.height = 'auto';
      }
      if (typeof parent.props.width === 'number' && parent.layout.direction !== 'column') {
        parent.props.width = 'auto';
      }
    }

    // Insert at index or append in the NEW tree
    if (index !== undefined) {
      parent.children.splice(index, 0, newComponent);
    } else {
      parent.children.push(newComponent);
    }

    set({
      root: newRoot,
      components: flattenTree(newRoot),
    });

    get().saveHistory();
    return id;
  },

  // Remove component
  removeComponent: (id) => {
    const { root } = get();
    if (!root || root.id === id) return;

    // Clone tree FIRST
    const newRoot = cloneNode(root);

    // Find parent in the NEW tree
    const parent = findParentNode(newRoot, id);
    if (!parent) return;

    parent.children = parent.children.filter((child) => child.id !== id);

    set({
      root: newRoot,
      components: flattenTree(newRoot),
    });

    get().saveHistory();
  },

  // Update component
  updateComponent: (id, updates) => {
    const { root } = get();
    if (!root) return;

    // Clone tree FIRST
    const newRoot = cloneNode(root);

    // Find component in the NEW tree
    const component = findNodeById(newRoot, id);
    if (!component) return;

    Object.assign(component, updates);

    set({
      root: newRoot,
      components: flattenTree(newRoot),
    });

    get().saveHistory();
  },

  // Move component
  moveComponent: (id, newParentId, index) => {
    const { root } = get();
    if (!root || id === newParentId) return;

    // Clone tree FIRST
    const newRoot = cloneNode(root);

    // Find component and remove from old parent in the NEW tree
    const oldParent = findParentNode(newRoot, id);
    if (!oldParent) return;

    const componentIndex = oldParent.children.findIndex((c) => c.id === id);
    if (componentIndex === -1) return;

    const [component] = oldParent.children.splice(componentIndex, 1);

    // Add to new parent in the NEW tree
    const newParent = findNodeById(newRoot, newParentId);
    if (!newParent) {
      // Restore if new parent not found
      oldParent.children.splice(componentIndex, 0, component);
      return;
    }

    if (index !== undefined) {
      newParent.children.splice(index, 0, component);
    } else {
      newParent.children.push(component);
    }

    set({
      root: newRoot,
      components: flattenTree(newRoot),
    });

    get().saveHistory();
  },

  // Duplicate component
  duplicateComponent: (id) => {
    const { root } = get();
    if (!root) return null;

    // Clone tree FIRST
    const newRoot = cloneNode(root);

    // Find component and parent in the NEW tree
    const component = findNodeById(newRoot, id);
    const parent = findParentNode(newRoot, id);
    if (!component || !parent) return null;

    const cloned = cloneNode(component);
    cloned.id = generateComponentId();
    cloned.name = `${cloned.name} Copy`;

    // Assign new IDs to all descendants
    function reassignIds(node: ComponentNode) {
      node.id = generateComponentId();
      node.children.forEach(reassignIds);
    }
    cloned.children.forEach(reassignIds);

    // Insert after original
    const index = parent.children.findIndex((c) => c.id === id);
    parent.children.splice(index + 1, 0, cloned);

    set({
      root: newRoot,
      components: flattenTree(newRoot),
    });

    get().saveHistory();
    return cloned.id;
  },

  // Group multiple components into a new Box
  groupComponents: (ids, boxData) => {
    const { root } = get();
    if (!root || ids.length === 0) return null;

    const newRoot = cloneNode(root);

    // All ids must share the same parent
    const parents = ids.map(id => findParentNode(newRoot, id));
    const parentId = parents[0]?.id;
    if (!parentId || parents.some(p => p?.id !== parentId)) return null;

    const parent = findNodeById(newRoot, parentId)!;

    // Insert Box at the earliest position of the selected nodes
    const indices = ids.map(id => parent.children.findIndex(c => c.id === id));
    const insertIndex = Math.min(...indices);

    // Extract selected nodes in document order
    const ordered = parent.children.filter(c => ids.includes(c.id));
    parent.children = parent.children.filter(c => !ids.includes(c.id));

    const newBox: ComponentNode = { ...boxData, id: generateComponentId(), children: ordered };
    parent.children.splice(insertIndex, 0, newBox);

    set({ root: newRoot, components: flattenTree(newRoot) });
    get().saveHistory();
    return newBox.id;
  },

  // Ungroup containers: promote children to parent, remove containers
  ungroupComponents: (ids) => {
    const { root } = get();
    if (!root || ids.length === 0) return [];

    const newRoot = cloneNode(root);
    const allChildIds: string[] = [];

    for (const id of ids) {
      const node = findNodeById(newRoot, id);
      const parent = findParentNode(newRoot, id);
      if (!node || !parent) continue;

      const index = parent.children.findIndex(c => c.id === id);
      allChildIds.push(...node.children.map(c => c.id));
      parent.children.splice(index, 1, ...node.children);
    }

    set({ root: newRoot, components: flattenTree(newRoot) });
    get().saveHistory();
    return allChildIds;
  },

  // Update props
  updateProps: (id, props) => {
    const { root } = get();
    if (!root) return;

    // Clone tree FIRST to create new references
    const newRoot = cloneNode(root);

    // Find component in the NEW tree
    const component = findNodeById(newRoot, id);
    if (!component) return;

    // Mutate the NEW tree's component
    component.props = { ...component.props, ...props };

    set({
      root: newRoot,
      components: flattenTree(newRoot),
    });

    get().saveHistory();
  },

  // Update layout
  updateLayout: (id, layout) => {
    const { root } = get();
    if (!root) return;

    // Clone tree FIRST to create new references
    const newRoot = cloneNode(root);

    // Find component in the NEW tree
    const component = findNodeById(newRoot, id);
    if (!component) return;

    // Mutate the NEW tree's component
    component.layout = { ...component.layout, ...layout };

    set({
      root: newRoot,
      components: flattenTree(newRoot),
    });

    get().saveHistory();
  },

  // Update style
  updateStyle: (id, style) => {
    const { root } = get();
    if (!root) return;

    // Clone tree FIRST to create new references
    const newRoot = cloneNode(root);

    // Find component in the NEW tree
    const component = findNodeById(newRoot, id);
    if (!component) return;

    // Mutate the NEW tree's component
    component.style = { ...component.style, ...style };

    set({
      root: newRoot,
      components: flattenTree(newRoot),
    });

    get().saveHistory();
  },

  // Update events
  updateEvents: (id, events) => {
    const { root } = get();
    if (!root) return;

    // Clone tree FIRST to create new references
    const newRoot = cloneNode(root);

    // Find component in the NEW tree
    const component = findNodeById(newRoot, id);
    if (!component) return;

    // Mutate the NEW tree's component
    component.events = { ...component.events, ...events };

    set({
      root: newRoot,
      components: flattenTree(newRoot),
    });

    get().saveHistory();
  },

  // Save history
  saveHistory: () => {
    const { root, history, historyIndex, maxHistorySize } = get();
    if (!root) return;

    // Clone root for history
    const snapshot = cloneNode(root);

    // Remove future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);

    // Add new snapshot
    newHistory.push([snapshot]);

    // Limit history size
    if (newHistory.length > maxHistorySize) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  // Undo
  undo: () => {
    const { history, historyIndex } = get();

    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const snapshot = history[newIndex][0];

      set({
        root: cloneNode(snapshot),
        components: flattenTree(snapshot),
        historyIndex: newIndex,
      });
    }
  },

  // Redo
  redo: () => {
    const { history, historyIndex } = get();

    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const snapshot = history[newIndex][0];

      set({
        root: cloneNode(snapshot),
        components: flattenTree(snapshot),
        historyIndex: newIndex,
      });
    }
  },

  // Get component
  getComponent: (id) => {
    return get().components.get(id);
  },

  // Get parent
  getParent: (id) => {
    const { root } = get();
    if (!root) return undefined;
    const parent = findParentNode(root, id);
    return parent || undefined;
  },

  // Get children
  getChildren: (id) => {
    const component = get().getComponent(id);
    return component?.children || [];
  },
}));
