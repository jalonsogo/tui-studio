// Flexbox layout calculator

import type { ComponentNode } from '../../types';
import type { LayoutBox, ComputedLayout, FlexItem } from './types';

interface FlexLine {
  items: FlexItem[];
  crossSize: number;
}

export function calculateFlexboxLayout(
  container: ComponentNode,
  availableWidth: number,
  availableHeight: number
): Map<string, ComputedLayout> {
  const layouts = new Map<string, ComputedLayout>();

  const direction = container.layout.direction || 'row';
  const justify = container.layout.justify || 'start';
  const align = container.layout.align || 'start';
  const gap = container.layout.gap || 0;
  const wrap = container.layout.wrap || false;
  const padding = typeof container.layout.padding === 'number' ? container.layout.padding : 0;

  // Calculate content area
  const contentWidth = availableWidth - (padding * 2);
  const contentHeight = availableHeight - (padding * 2);

  const isRow = direction === 'row';
  const mainSize = isRow ? contentWidth : contentHeight;
  const crossSize = isRow ? contentHeight : contentWidth;

  // Convert children to flex items
  const flexItems: FlexItem[] = container.children.map(child => ({
    id: child.id,
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: 'auto',
    width: child.props.width,
    height: child.props.height,
    minWidth: 1,
    minHeight: 1,
  }));

  // Collect items into flex lines
  const lines = wrap ? collectFlexLines(flexItems, mainSize, gap, isRow) : [{ items: flexItems, crossSize: 0 }];

  let crossOffset = padding;

  lines.forEach(line => {
    let mainOffset = padding;

    // Calculate sizes for items in this line
    const sizes = resolveFlexItemSizes(line.items, mainSize, gap, isRow);

    // Calculate cross size for this line
    const lineCrossSize = line.items.reduce((max, item, i) => {
      const size = isRow ? resolveHeight(item) : resolveWidth(item);
      return Math.max(max, size);
    }, 0);

    // Apply justify-content
    const totalMainSize = sizes.reduce((sum, size) => sum + size, 0);
    const totalGap = (line.items.length - 1) * gap;
    const freeSpace = mainSize - totalMainSize - totalGap;

    const { spacing, offset } = calculateJustifySpacing(justify, freeSpace, line.items.length);
    mainOffset += offset;

    // Position each item
    line.items.forEach((item, i) => {
      const itemMainSize = sizes[i];
      const itemCrossSize = isRow ? resolveHeight(item) : resolveWidth(item);

      // Calculate cross-axis alignment
      const crossAlignOffset = calculateAlignOffset(align, lineCrossSize, itemCrossSize);

      const x = isRow ? mainOffset : crossOffset + crossAlignOffset;
      const y = isRow ? crossOffset + crossAlignOffset : mainOffset;
      const width = isRow ? itemMainSize : itemCrossSize;
      const height = isRow ? itemCrossSize : itemMainSize;

      layouts.set(item.id, createComputedLayout(x, y, width, height, 0, 0));

      mainOffset += itemMainSize + gap + spacing;
    });

    crossOffset += lineCrossSize + gap;
  });

  return layouts;
}

function collectFlexLines(items: FlexItem[], maxSize: number, gap: number, isRow: boolean): FlexLine[] {
  const lines: FlexLine[] = [];
  let currentLine: FlexItem[] = [];
  let currentSize = 0;

  items.forEach(item => {
    const itemSize = isRow ? resolveWidth(item) : resolveHeight(item);
    const withGap = currentLine.length > 0 ? gap : 0;

    if (currentSize + itemSize + withGap > maxSize && currentLine.length > 0) {
      lines.push({ items: currentLine, crossSize: 0 });
      currentLine = [item];
      currentSize = itemSize;
    } else {
      currentLine.push(item);
      currentSize += itemSize + withGap;
    }
  });

  if (currentLine.length > 0) {
    lines.push({ items: currentLine, crossSize: 0 });
  }

  return lines;
}

function resolveFlexItemSizes(items: FlexItem[], availableSize: number, gap: number, isRow: boolean): number[] {
  const totalGap = (items.length - 1) * gap;
  let remainingSize = availableSize - totalGap;

  // First pass: resolve fixed and auto sizes
  const sizes = items.map(item => {
    const value = isRow ? item.width : item.height;
    if (typeof value === 'number') {
      remainingSize -= value;
      return value;
    }
    return -1; // unresolved
  });

  // Second pass: distribute remaining space to 'fill' items
  const fillCount = sizes.filter(s => s === -1).length;
  if (fillCount > 0 && remainingSize > 0) {
    const fillSize = Math.max(1, Math.floor(remainingSize / fillCount));
    for (let i = 0; i < sizes.length; i++) {
      if (sizes[i] === -1) {
        sizes[i] = fillSize;
      }
    }
  } else {
    // Fallback for auto items
    for (let i = 0; i < sizes.length; i++) {
      if (sizes[i] === -1) {
        sizes[i] = isRow ? (items[i].minWidth || 10) : (items[i].minHeight || 3);
      }
    }
  }

  return sizes;
}

function resolveWidth(item: FlexItem): number {
  if (typeof item.width === 'number') return item.width;
  return item.minWidth || 10;
}

function resolveHeight(item: FlexItem): number {
  if (typeof item.height === 'number') return item.height;
  return item.minHeight || 3;
}

function calculateJustifySpacing(justify: string, freeSpace: number, itemCount: number): { spacing: number; offset: number } {
  if (freeSpace <= 0) return { spacing: 0, offset: 0 };

  switch (justify) {
    case 'center':
      return { spacing: 0, offset: freeSpace / 2 };
    case 'end':
      return { spacing: 0, offset: freeSpace };
    case 'space-between':
      return itemCount > 1
        ? { spacing: freeSpace / (itemCount - 1), offset: 0 }
        : { spacing: 0, offset: 0 };
    case 'space-around':
      const spacing = freeSpace / itemCount;
      return { spacing, offset: spacing / 2 };
    default: // 'start'
      return { spacing: 0, offset: 0 };
  }
}

function calculateAlignOffset(align: string, containerSize: number, itemSize: number): number {
  switch (align) {
    case 'center':
      return (containerSize - itemSize) / 2;
    case 'end':
      return containerSize - itemSize;
    case 'stretch':
      return 0; // TODO: stretch item size
    default: // 'start'
      return 0;
  }
}

function createComputedLayout(
  x: number,
  y: number,
  width: number,
  height: number,
  padding: number,
  margin: number
): ComputedLayout {
  return {
    x,
    y,
    width,
    height,
    contentBox: {
      x: x + padding,
      y: y + padding,
      width: Math.max(0, width - padding * 2),
      height: Math.max(0, height - padding * 2),
    },
    paddingBox: {
      x,
      y,
      width,
      height,
    },
    marginBox: {
      x: x - margin,
      y: y - margin,
      width: width + margin * 2,
      height: height + margin * 2,
    },
  };
}
