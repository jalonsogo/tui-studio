// Layout calculation types

export interface LayoutBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ComputedLayout {
  box: LayoutBox;
  children: Map<string, ComputedLayout>;
}

export interface LayoutConstraints {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  canvasWidth: number;  // Terminal columns
  canvasHeight: number; // Terminal rows
}

// Layer system types
export interface Project {
  id: string;
  name: string;
  created: Date;
  modified: Date;
  pages: Page[];
  componentLibrary: ComponentLibrary;
}

export interface Page {
  id: string;
  name: string;
  frames: Frame[];
  order: number;
}

export interface Frame {
  id: string;
  name: string;
  width: number;    // Terminal columns
  height: number;   // Terminal rows
  root: LayerNode;
  backgroundColor?: string;
}

export interface LayerNode {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  opacity: number;

  // Component instance reference
  componentId?: string;

  // Actual component data
  component?: import('./components').ComponentNode;

  // Children
  children: LayerNode[];

  // Metadata
  expanded: boolean;
  order: number;
}

export type LayerType =
  | 'frame'
  | 'group'
  | 'component'
  | 'instance';

// Re-export ComponentLibrary for convenience
export type { ComponentLibrary } from './components';
