// Layout calculation types

export interface LayoutBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ComputedLayout extends LayoutBox {
  contentBox: LayoutBox;
  paddingBox: LayoutBox;
  marginBox: LayoutBox;
}

export interface LayoutConstraints {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

export interface FlexItem {
  id: string;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: number | 'auto';
  minWidth?: number;
  minHeight?: number;
  width?: number | 'auto' | 'fill';
  height?: number | 'auto' | 'fill';
}

export interface GridCell {
  id: string;
  row: number;
  column: number;
  rowSpan?: number;
  columnSpan?: number;
}

export interface LayoutDebugInfo {
  nodeId: string;
  warnings: LayoutWarning[];
  overflow?: boolean;
  clipped?: boolean;
}

export type LayoutWarning =
  | { type: 'overflow'; axis: 'x' | 'y'; amount: number }
  | { type: 'constraint-violation'; constraint: string }
  | { type: 'negative-space'; dimension: 'width' | 'height' }
  | { type: 'circular-dependency' };
