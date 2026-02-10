// Main layout engine

import type { ComponentNode } from '../../types';
import type { ComputedLayout, LayoutDebugInfo } from './types';
import { calculateFlexboxLayout } from './flexbox';
import { calculateGridLayout } from './grid';
import { calculateAbsoluteLayout } from './absolute';

export class LayoutEngine {
  private layouts: Map<string, ComputedLayout> = new Map();
  private debugInfo: Map<string, LayoutDebugInfo> = new Map();

  /**
   * Calculate layout for the entire component tree
   */
  calculateLayout(root: ComponentNode | null, canvasWidth: number, canvasHeight: number): void {
    this.layouts.clear();
    this.debugInfo.clear();

    if (!root) return;

    this.calculateNodeLayout(root, 0, 0, canvasWidth, canvasHeight, null);
  }

  /**
   * Get computed layout for a specific node
   */
  getLayout(nodeId: string): ComputedLayout | undefined {
    return this.layouts.get(nodeId);
  }

  /**
   * Get all computed layouts
   */
  getAllLayouts(): Map<string, ComputedLayout> {
    return new Map(this.layouts);
  }

  /**
   * Get debug information for a node
   */
  getDebugInfo(nodeId: string): LayoutDebugInfo | undefined {
    return this.debugInfo.get(nodeId);
  }

  /**
   * Get all nodes with layout warnings
   */
  getNodesWithWarnings(): string[] {
    return Array.from(this.debugInfo.entries())
      .filter(([_, info]) => info.warnings.length > 0)
      .map(([id]) => id);
  }

  private calculateNodeLayout(
    node: ComponentNode,
    x: number,
    y: number,
    availableWidth: number,
    availableHeight: number,
    parentLayout: ComputedLayout | null
  ): void {
    // Resolve node dimensions
    let width = availableWidth;
    let height = availableHeight;

    if (typeof node.props.width === 'number') {
      width = node.props.width;
    } else if (node.props.width === 'auto') {
      width = this.calculateAutoWidth(node);
      console.log(`[Layout] Auto width for ${node.type} "${node.name}":`, width, 'props.width:', node.props.width);
    }

    if (typeof node.props.height === 'number') {
      height = node.props.height;
    } else if (node.props.height === 'auto') {
      height = this.calculateAutoHeight(node);
    }

    // Apply margin
    const margin = typeof node.layout.margin === 'number' ? node.layout.margin : 0;
    const contentX = x + margin;
    const contentY = y + margin;

    // Store this node's layout
    const nodeLayout: ComputedLayout = {
      x: contentX,
      y: contentY,
      width,
      height,
      contentBox: { x: contentX, y: contentY, width, height },
      paddingBox: { x: contentX, y: contentY, width, height },
      marginBox: { x, y, width: width + margin * 2, height: height + margin * 2 },
    };

    this.layouts.set(node.id, nodeLayout);

    // Check for layout issues
    this.checkLayoutIssues(node, nodeLayout, parentLayout);

    // Calculate child layouts based on layout type
    if (node.children.length > 0) {
      this.calculateChildLayouts(node, width, height);
    }
  }

  private calculateChildLayouts(container: ComponentNode, containerWidth: number, containerHeight: number): void {
    let childLayouts: Map<string, ComputedLayout>;

    switch (container.layout.type) {
      case 'flexbox':
        childLayouts = calculateFlexboxLayout(container, containerWidth, containerHeight);
        break;
      case 'grid':
        childLayouts = calculateGridLayout(container, containerWidth, containerHeight);
        break;
      case 'absolute':
        childLayouts = calculateAbsoluteLayout(container, containerWidth, containerHeight);
        break;
      default:
        // Stack children vertically for 'none' layout
        childLayouts = this.calculateStackLayout(container, containerWidth, containerHeight);
        break;
    }

    // Store child layouts and recurse
    const containerLayout = this.layouts.get(container.id);
    childLayouts.forEach((layout, childId) => {
      const child = container.children.find(c => c.id === childId);
      if (child) {
        this.layouts.set(childId, layout);

        // ALWAYS recurse to calculate proper dimensions (including auto-width)
        // even if the child has no children
        this.calculateNodeLayout(
          child,
          layout.x,
          layout.y,
          layout.width,
          layout.height,
          containerLayout || null
        );
      }
    });
  }

  private calculateStackLayout(
    container: ComponentNode,
    containerWidth: number,
    containerHeight: number
  ): Map<string, ComputedLayout> {
    const layouts = new Map<string, ComputedLayout>();
    const padding = typeof container.layout.padding === 'number' ? container.layout.padding : 0;

    let currentY = padding;

    container.children.forEach(child => {
      let width = containerWidth - padding * 2;
      let height = 3; // default height

      if (typeof child.props.width === 'number') {
        width = Math.min(child.props.width, width);
      }

      if (typeof child.props.height === 'number') {
        height = child.props.height;
      }

      const x = padding;
      const y = currentY;

      layouts.set(child.id, {
        x,
        y,
        width,
        height,
        contentBox: { x, y, width, height },
        paddingBox: { x, y, width, height },
        marginBox: { x, y, width, height },
      });

      currentY += height + 1; // 1 line gap
    });

    return layouts;
  }

  private calculateAutoWidth(node: ComponentNode): number {
    // Simple auto width calculation
    // In a real implementation, this would measure content
    switch (node.type) {
      case 'Button': {
        const label = (node.props.label as string) || 'Button';
        const iconLeft = (node.props.iconLeftEnabled && node.props.iconLeft) ? (node.props.iconLeft as string) : '';
        const iconRight = (node.props.iconRightEnabled && node.props.iconRight) ? (node.props.iconRight as string) : '';
        const number = node.props.number as number | undefined;
        const separated = node.props.separated as boolean;

        let contentWidth = label.length + 2; // +2 for side padding

        // Add left icon/key
        if (iconLeft) {
          if (separated) {
            // Separated layout: " icon │ label " or " icon N │ label "
            const leftSection = number !== undefined ? iconLeft.length + String(number).length + 1 : iconLeft.length;
            contentWidth += leftSection + 5; // +5 for " │ " and spaces
          } else {
            // Inline: " icon label "
            contentWidth += iconLeft.length + 1; // +1 for space after icon
          }
        }

        // Add right icon
        if (iconRight) {
          contentWidth += iconRight.length + 1; // +1 for space before icon
        }

        // Add border width if border is enabled
        return node.style.border ? contentWidth + 2 : contentWidth;
      }
      case 'Text':
        const content = (node.props.content as string) || '';
        const lines = content.split('\n');
        const maxLineLength = Math.max(...lines.map(l => l.length), 10);
        return node.style.border ? maxLineLength + 2 : maxLineLength;
      default:
        return 20;
    }
  }

  private calculateAutoHeight(node: ComponentNode): number {
    // Simple auto height calculation
    switch (node.type) {
      case 'Button':
      case 'TextInput':
        // 1 line of text + border (top + bottom) if enabled
        return node.style.border ? 3 : 1;
      case 'Text':
        const content = (node.props.content as string) || '';
        const contentHeight = content.split('\n').length;
        return node.style.border ? contentHeight + 2 : contentHeight;
      default:
        return 3;
    }
  }

  private checkLayoutIssues(
    node: ComponentNode,
    layout: ComputedLayout,
    parentLayout: ComputedLayout | null
  ): void {
    const warnings: LayoutDebugInfo['warnings'] = [];

    // Check for overflow
    if (parentLayout) {
      const overflowX = (layout.x + layout.width) - (parentLayout.x + parentLayout.width);
      const overflowY = (layout.y + layout.height) - (parentLayout.y + parentLayout.height);

      if (overflowX > 0) {
        warnings.push({ type: 'overflow', axis: 'x', amount: overflowX });
      }
      if (overflowY > 0) {
        warnings.push({ type: 'overflow', axis: 'y', amount: overflowY });
      }
    }

    // Check for negative dimensions
    if (layout.width < 0) {
      warnings.push({ type: 'negative-space', dimension: 'width' });
    }
    if (layout.height < 0) {
      warnings.push({ type: 'negative-space', dimension: 'height' });
    }

    if (warnings.length > 0) {
      this.debugInfo.set(node.id, {
        nodeId: node.id,
        warnings,
        overflow: warnings.some(w => w.type === 'overflow'),
      });
    }
  }
}

// Singleton instance
export const layoutEngine = new LayoutEngine();
