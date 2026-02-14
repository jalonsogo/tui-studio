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

    // Force List components to always use column direction
    if (container.type === 'List' && container.layout.type === 'flexbox' && container.layout.direction !== 'column') {
      container = {
        ...container,
        layout: {
          ...container.layout,
          direction: 'column',
        },
      };
    }

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
    if (!containerLayout) return;

    childLayouts.forEach((layout, childId) => {
      const child = container.children.find(c => c.id === childId);
      if (child) {
        // CRITICAL FIX: Child layout positions are relative to container
        // Convert to absolute positions by adding container's position
        const absoluteX = containerLayout.x + layout.x;
        const absoluteY = containerLayout.y + layout.y;

        // Store the layout with absolute coordinates
        const absoluteLayout = {
          ...layout,
          x: absoluteX,
          y: absoluteY,
        };
        this.layouts.set(childId, absoluteLayout);

        // ALWAYS recurse to calculate proper dimensions (including auto-width)
        // even if the child has no children
        this.calculateNodeLayout(
          child,
          absoluteX,
          absoluteY,
          layout.width,
          layout.height,
          containerLayout
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
    // Special case for Menu and List components (items in props, not children)
    if (node.type === 'Menu' || node.type === 'List') {
      const items = (node.props.items as any[]) || [];
      const padding = typeof node.layout.padding === 'number' ? node.layout.padding : 0;
      const gap = typeof node.layout.gap === 'number' ? node.layout.gap : 0;
      const border = node.style.border ? 2 : 0;

      // List is always vertical (column direction)
      const effectiveDirection = node.type === 'List' ? 'column' : node.layout.direction;

      if (node.layout.type === 'flexbox' && effectiveDirection === 'row') {
        // Horizontal menu - sum item widths
        let totalWidth = padding * 2;

        items.forEach((item, index) => {
          const itemData = typeof item === 'string' ? { label: item, icon: '', hotkey: '', separator: false } : item;
          const icon = itemData.icon ? `${itemData.icon} ` : '';
          const hotkey = itemData.hotkey ? ` ${itemData.hotkey}` : '';
          const itemWidth = icon.length + itemData.label.length + hotkey.length;

          totalWidth += itemWidth;

          if (index < items.length - 1) {
            if (itemData.separator) {
              // gap + │ + gap
              totalWidth += (gap * 2) + 1;
            } else {
              // just gap
              totalWidth += gap;
            }
          }
        });

        return totalWidth + border;
      } else {
        // Vertical menu/list - use widest item
        let maxWidth = 0;

        items.forEach(item => {
          const itemData = typeof item === 'string' ? { label: item, icon: '', hotkey: '' } : item;
          const icon = itemData.icon ? `${itemData.icon} ` : '';
          const hotkey = itemData.hotkey ? `   ${itemData.hotkey}` : '';

          // For Menu, add selection indicator; for List, just use the icon
          let itemWidth: number;
          if (node.type === 'Menu') {
            const prefix = '▶ '; // Menu has selection indicator
            itemWidth = prefix.length + icon.length + itemData.label.length + hotkey.length;
          } else {
            // List items: icon + label + hotkey (with spacing)
            itemWidth = icon.length + itemData.label.length + (hotkey ? hotkey.length : 0);
          }

          maxWidth = Math.max(maxWidth, itemWidth);
        });

        return maxWidth + (padding * 2) + border;
      }
    }

    // For containers (Stack, Box, Screen, etc.), calculate based on children
    if (node.children.length > 0 && ['flexbox', 'grid', 'absolute'].includes(node.layout.type)) {
      const padding = typeof node.layout.padding === 'number' ? node.layout.padding : 0;
      const gap = typeof node.layout.gap === 'number' ? node.layout.gap : 0;
      const border = node.style.border ? 2 : 0; // +2 for left and right border

      // For horizontal layouts (row direction), sum children widths + gaps
      if (node.layout.type === 'flexbox' && node.layout.direction === 'row') {
        let totalWidth = padding * 2; // left + right padding

        node.children.forEach((child, index) => {
          // Get child width (recursive for auto-sized children)
          const childWidth = typeof child.props.width === 'number'
            ? child.props.width
            : this.calculateAutoWidth(child);

          totalWidth += childWidth;

          // Add gap between children (not after last child)
          if (index < node.children.length - 1) {
            totalWidth += gap;
          }
        });

        return totalWidth + border;
      }

      // For column direction, use the widest child
      if (node.layout.type === 'flexbox' && node.layout.direction === 'column') {
        let maxWidth = 0;

        node.children.forEach(child => {
          const childWidth = typeof child.props.width === 'number'
            ? child.props.width
            : this.calculateAutoWidth(child);

          maxWidth = Math.max(maxWidth, childWidth);
        });

        return maxWidth + (padding * 2) + border;
      }

      // For other layouts, use a reasonable default
      return 20 + border;
    }

    // Simple auto width calculation for leaf components
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
    // Special case for Menu and List components (items in props, not children)
    if (node.type === 'Menu' || node.type === 'List') {
      const items = (node.props.items as any[]) || [];
      const padding = typeof node.layout.padding === 'number' ? node.layout.padding : 0;
      const gap = typeof node.layout.gap === 'number' ? node.layout.gap : 0;
      const border = node.style.border ? 2 : 0;

      // List is always vertical (column direction)
      const effectiveDirection = node.type === 'List' ? 'column' : node.layout.direction;

      if (node.layout.type === 'flexbox' && effectiveDirection === 'column') {
        // Vertical menu/list - sum item heights (1 line per item)
        let totalHeight = padding * 2;
        const itemCount = items.length;

        totalHeight += itemCount; // 1 line per item

        if (itemCount > 1) {
          totalHeight += gap * (itemCount - 1); // gaps between items
        }

        // Add height for separators (Menu only)
        if (node.type === 'Menu') {
          const separatorCount = items.filter((item: any) => {
            const itemData = typeof item === 'string' ? { separator: false } : item;
            return itemData.separator;
          }).length;
          totalHeight += separatorCount; // 1 extra line per separator
        }

        return totalHeight + border;
      } else {
        // Horizontal menu - height is 1 line
        return 1 + (padding * 2) + border;
      }
    }

    // For containers (Stack, Box, Screen, etc.), calculate based on children
    if (node.children.length > 0 && ['flexbox', 'grid', 'absolute'].includes(node.layout.type)) {
      const padding = typeof node.layout.padding === 'number' ? node.layout.padding : 0;
      const gap = typeof node.layout.gap === 'number' ? node.layout.gap : 0;
      const border = node.style.border ? 2 : 0; // +2 for top and bottom border

      // For vertical layouts (column direction), sum children heights + gaps
      if (node.layout.type === 'flexbox' && node.layout.direction === 'column') {
        let totalHeight = padding * 2; // top + bottom padding

        node.children.forEach((child, index) => {
          // Get child height (recursive for auto-sized children)
          const childHeight = typeof child.props.height === 'number'
            ? child.props.height
            : this.calculateAutoHeight(child);

          totalHeight += childHeight;

          // Add gap between children (not after last child)
          if (index < node.children.length - 1) {
            totalHeight += gap;
          }
        });

        return totalHeight + border;
      }

      // For other layouts, use a reasonable default
      return 10 + border;
    }

    // Simple auto height calculation for leaf components
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
