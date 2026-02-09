// Grid layout calculator

import type { ComponentNode } from '../../types';
import type { ComputedLayout } from './types';

export function calculateGridLayout(
  container: ComponentNode,
  availableWidth: number,
  availableHeight: number
): Map<string, ComputedLayout> {
  const layouts = new Map<string, ComputedLayout>();

  const columns = container.layout.columns || 2;
  const rows = container.layout.rows || 2;
  const columnGap = container.layout.columnGap || 0;
  const rowGap = container.layout.rowGap || 0;
  const padding = typeof container.layout.padding === 'number' ? container.layout.padding : 0;

  // Calculate content area
  const contentWidth = availableWidth - (padding * 2);
  const contentHeight = availableHeight - (padding * 2);

  // Calculate column and row sizes
  const totalColumnGap = (columns - 1) * columnGap;
  const totalRowGap = (rows - 1) * rowGap;

  const columnWidth = Math.floor((contentWidth - totalColumnGap) / columns);
  const rowHeight = Math.floor((contentHeight - totalRowGap) / rows);

  // Place children in grid cells
  container.children.forEach((child, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);

    if (row >= rows) return; // Skip if exceeds grid

    const x = padding + (column * (columnWidth + columnGap));
    const y = padding + (row * (rowHeight + rowGap));

    // Determine cell dimensions
    let cellWidth = columnWidth;
    let cellHeight = rowHeight;

    // Resolve child dimensions
    let width = cellWidth;
    let height = cellHeight;

    if (typeof child.props.width === 'number') {
      width = Math.min(child.props.width, cellWidth);
    } else if (child.props.width === 'fill') {
      width = cellWidth;
    } else if (child.props.width === 'auto') {
      width = Math.min(20, cellWidth); // Default auto width
    }

    if (typeof child.props.height === 'number') {
      height = Math.min(child.props.height, cellHeight);
    } else if (child.props.height === 'fill') {
      height = cellHeight;
    } else if (child.props.height === 'auto') {
      height = Math.min(3, cellHeight); // Default auto height
    }

    layouts.set(child.id, {
      x,
      y,
      width,
      height,
      contentBox: { x, y, width, height },
      paddingBox: { x, y, width, height },
      marginBox: { x, y, width, height },
    });
  });

  return layouts;
}
