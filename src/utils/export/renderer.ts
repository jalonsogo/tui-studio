// Main renderer for exporting TUI designs

import type { ComponentNode } from '../../types';
import type { ComputedLayout } from '../layout';
import { layoutEngine } from '../layout';
import { CharCanvas } from '../rendering/canvas';
import { renderComponent } from '../rendering/components';

export interface RenderOptions {
  colorMode?: 'ansi16' | 'ansi256' | 'trueColor';
  width: number;
  height: number;
}

/**
 * Render the entire component tree to text output
 */
export function renderTree(
  root: ComponentNode | null,
  options: RenderOptions
): string {
  if (!root) return '';

  // Calculate layouts
  layoutEngine.calculateLayout(root, options.width, options.height);

  // Create main canvas
  const canvas = new CharCanvas(options.width, options.height);

  // Render all visible components
  renderNodeToCanvas(root, canvas, options.colorMode || 'ansi16');

  return canvas.toString();
}

/**
 * Recursively render a node and its children to a canvas
 */
function renderNodeToCanvas(
  node: ComponentNode,
  canvas: CharCanvas,
  colorMode: 'ansi16' | 'ansi256' | 'trueColor'
): void {
  if (node.hidden) return;

  const layout = layoutEngine.getLayout(node.id);
  if (!layout) return;

  // Render this node
  const rendered = renderComponent(node, layout.width, layout.height, colorMode);

  // Write to canvas at computed position
  canvas.writeLines(layout.x, layout.y, rendered);

  // Render children
  for (const child of node.children) {
    renderNodeToCanvas(child, canvas, colorMode);
  }
}

/**
 * Export lines as an array (useful for testing)
 */
export function renderTreeToLines(
  root: ComponentNode | null,
  options: RenderOptions
): string[] {
  if (!root) return [];

  layoutEngine.calculateLayout(root, options.width, options.height);
  const canvas = new CharCanvas(options.width, options.height);
  renderNodeToCanvas(root, canvas, options.colorMode || 'ansi16');

  return canvas.toLines();
}

/**
 * Render a single component preview
 */
export function renderComponentPreview(
  node: ComponentNode,
  width: number,
  height: number,
  colorMode: 'ansi16' | 'ansi256' | 'trueColor' = 'ansi16'
): string {
  const lines = renderComponent(node, width, height, colorMode);
  return lines.join('\n');
}
