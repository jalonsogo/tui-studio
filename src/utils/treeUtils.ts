// Utilities for working with component trees

import type { ComponentNode } from '../types';

/**
 * Find a component node by ID in a tree
 */
export function findNodeById(
  root: ComponentNode | null,
  id: string
): ComponentNode | null {
  if (!root) return null;
  if (root.id === id) return root;

  for (const child of root.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }

  return null;
}

/**
 * Find the parent of a node
 */
export function findParentNode(
  root: ComponentNode | null,
  targetId: string
): ComponentNode | null {
  if (!root) return null;

  for (const child of root.children) {
    if (child.id === targetId) return root;
    const found = findParentNode(child, targetId);
    if (found) return found;
  }

  return null;
}

/**
 * Get all ancestors of a node (from root to parent)
 */
export function getAncestors(
  root: ComponentNode | null,
  targetId: string
): ComponentNode[] {
  const ancestors: ComponentNode[] = [];

  function traverse(node: ComponentNode | null, path: ComponentNode[]): boolean {
    if (!node) return false;
    if (node.id === targetId) {
      ancestors.push(...path);
      return true;
    }

    for (const child of node.children) {
      if (traverse(child, [...path, node])) {
        return true;
      }
    }

    return false;
  }

  traverse(root, []);
  return ancestors;
}

/**
 * Get all descendants of a node
 */
export function getDescendants(node: ComponentNode): ComponentNode[] {
  const descendants: ComponentNode[] = [];

  function traverse(n: ComponentNode) {
    descendants.push(n);
    n.children.forEach(traverse);
  }

  node.children.forEach(traverse);
  return descendants;
}

/**
 * Clone a component node deeply
 */
export function cloneNode(node: ComponentNode): ComponentNode {
  return {
    ...node,
    props: { ...node.props },
    layout: { ...node.layout },
    style: { ...node.style },
    events: { ...node.events },
    children: node.children.map(cloneNode),
  };
}

/**
 * Flatten a tree into a Map for quick lookup
 */
export function flattenTree(root: ComponentNode | null): Map<string, ComponentNode> {
  const map = new Map<string, ComponentNode>();

  function traverse(node: ComponentNode) {
    map.set(node.id, node);
    node.children.forEach(traverse);
  }

  if (root) {
    traverse(root);
  }

  return map;
}

/**
 * Count total nodes in a tree
 */
export function countNodes(root: ComponentNode | null): number {
  if (!root) return 0;
  return 1 + root.children.reduce((sum, child) => sum + countNodes(child), 0);
}

/**
 * Get the depth of a tree
 */
export function getTreeDepth(root: ComponentNode | null): number {
  if (!root || root.children.length === 0) return 0;
  return 1 + Math.max(...root.children.map(getTreeDepth));
}
