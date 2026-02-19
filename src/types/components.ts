// Core component types for TUI Designer

export type ComponentType =
  // Layout
  | 'Screen'
  | 'Box'
  | 'Grid'
  | 'Spacer'
  // Input
  | 'TextInput'
  | 'Button'
  | 'Checkbox'
  | 'Radio'
  | 'Select'
  | 'Toggle'
  // Display
  | 'Text'
  | 'Spinner'
  | 'ProgressBar'
  // Data
  | 'Table'
  | 'List'
  | 'Tree'
  // Navigation
  | 'Menu'
  | 'Tabs'
  | 'Breadcrumb'
  // Overlay
  | 'Modal'
  | 'Popover'
  | 'Tooltip';

export interface ComponentNode {
  id: string;
  type: ComponentType;
  name: string;
  props: ComponentProps;
  layout: LayoutProps;
  style: StyleProps;
  events: EventHandlers;
  children: ComponentNode[];

  // Metadata
  locked: boolean;
  hidden: boolean;
  collapsed: boolean; // In tree view
}

export interface ComponentProps {
  // Common
  width?: number | 'fill' | 'auto';
  height?: number | 'fill' | 'auto';
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;

  // Theme (for Screen and container components)
  theme?: string; // Theme name like 'dracula', 'nord', etc.

  // Type-specific props
  [key: string]: unknown;
}

export interface LayoutProps {
  type: 'flexbox' | 'grid' | 'absolute' | 'none';

  // Flexbox
  direction?: 'row' | 'column';
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around';
  align?: 'start' | 'center' | 'end' | 'stretch';
  gap?: number;
  wrap?: boolean;

  // Grid
  columns?: number;
  rows?: number;
  columnGap?: number;
  rowGap?: number;

  // Absolute
  x?: number;
  y?: number;

  // Common
  padding?: number | { top: number; right: number; bottom: number; left: number };
  margin?: number | { top: number; right: number; bottom: number; left: number };
}

export interface GradientStop {
  color: string;    // hex color, e.g. "#ff0000"
  position: number; // 0–100 percentage
}

export interface GradientConfig {
  type: 'linear';
  angle: number;  // degrees: 0=top→bottom, 90=left→right, 180=bottom→top, 270=right→left
  stops: GradientStop[];
}

export interface StyleProps {
  // Border
  border?: boolean;
  borderStyle?: 'single' | 'double' | 'rounded' | 'bold' | 'hidden';
  borderColor?: string;
  borderTop?: boolean;
  borderRight?: boolean;
  borderBottom?: boolean;
  borderLeft?: boolean;
  borderTopStyle?: 'single' | 'double' | 'rounded' | 'bold' | 'hidden';
  borderRightStyle?: 'single' | 'double' | 'rounded' | 'bold' | 'hidden';
  borderBottomStyle?: 'single' | 'double' | 'rounded' | 'bold' | 'hidden';
  borderLeftStyle?: 'single' | 'double' | 'rounded' | 'bold' | 'hidden';
  borderCorners?: boolean; // false = replace corners with line characters

  // Colors
  color?: string;        // Text/foreground color
  backgroundColor?: string;
  backgroundGradient?: GradientConfig;

  // Checkbox colors
  checkedColor?: string;
  uncheckedColor?: string;

  // Radio colors
  selectedColor?: string;
  unselectedColor?: string;

  // Component label color
  labelColor?: string;

  // Text
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;

  // Effects
  opacity?: number;
  shadow?: boolean;
}

export interface EventHandlers {
  onFocus?: string;      // Function name to call
  onBlur?: string;
  onClick?: string;
  onSubmit?: string;
  onChange?: string;
  onKeyPress?: string;
  [key: string]: string | undefined;
}

// Component library types
export interface ComponentLibrary {
  components: Map<string, MasterComponent>;
  categories: ComponentCategory[];
}

export interface ComponentCategory {
  id: string;
  name: string;
  icon: string;
  components: string[]; // Component IDs
}

export interface MasterComponent {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;

  // The actual component tree
  root: ComponentNode;

  // Customizable properties
  props: ComponentProp[];

  // Variants
  variants?: ComponentVariant[];

  // Metadata
  created: Date;
  modified: Date;
  author?: string;
  tags: string[];
}

export interface ComponentProp {
  key: string;
  label: string;
  type: 'text' | 'number' | 'color' | 'boolean' | 'select';
  defaultValue: unknown;
  options?: string[];
  description?: string;
}

export interface ComponentVariant {
  id: string;
  name: string;
  props: Record<string, unknown>;
}

export interface ComponentInstance {
  id: string;
  componentId: string; // Reference to master

  // Property overrides
  overrides: Record<string, unknown>;

  // Child component overrides
  childOverrides: Map<string, Record<string, unknown>>;

  // Break the link to master
  detached: boolean;
}
