# TUI Designer - Implementation Plan

**Project Name**: TUI Designer (working title)
**Tagline**: "Visual design tool for building Terminal User Interfaces"
**Date**: 2026-02-09
**Status**: Planning Phase
**Inspired By**: ASCII Motion (ascii-motion.app)

---

## 🎯 Vision

Create a visual design tool that enables developers to build Terminal User Interface applications through drag-and-drop component composition, with live preview and multi-framework code generation (OpenTUI, Ink, BubbleTea, Blessed, etc.).

### Key Differentiators from ASCII Motion

| ASCII Motion           | TUI Designer                |
| ---------------------- | --------------------------- |
| Pixel/cell-based art   | Component-based UI design   |
| Animation sequences    | Interactive UI patterns     |
| Frame-by-frame editing | Layout & navigation design  |
| Static playback        | User interaction simulation |
| Character palette      | Component library           |
| Export animations      | Export working TUI apps     |

---

## 🏗️ Technical Architecture

### Core Tech Stack

```json
{
  "framework": "React 19",
  "language": "TypeScript 5.8+",
  "build": "Vite 7",
  "state": "Zustand 5",
  "styling": "Tailwind CSS 4",
  "ui-components": "Shadcn/ui",
  "tui-preview": "@opentui/react 0.1.69",
  "code-editor": "Monaco Editor",
  "dnd": "react-dnd",
  "icons": "Lucide React"
}
```

### Project Structure

```
tui-designer/
├── src/
│   ├── components/
│   │   ├── common/           # Shared UI components
│   │   ├── editor/           # Main editor components
│   │   │   ├── Canvas.tsx
│   │   │   ├── ComponentTree.tsx
│   │   │   ├── PropertyPanel.tsx
│   │   │   └── LivePreview.tsx
│   │   ├── palette/          # Component palette
│   │   │   ├── ComponentPalette.tsx
│   │   │   └── ComponentItem.tsx
│   │   ├── export/           # Export dialogs
│   │   └── ui/               # Shadcn components
│   ├── stores/               # Zustand stores
│   │   ├── componentStore.ts # Component tree state
│   │   ├── canvasStore.ts    # Canvas/viewport state
│   │   ├── selectionStore.ts # Selected component state
│   │   ├── exportStore.ts    # Export settings
│   │   └── themeStore.ts     # Theme/color settings
│   ├── types/
│   │   ├── components.ts     # TUI component types
│   │   ├── layout.ts         # Layout system types
│   │   └── export.ts         # Export format types
│   ├── utils/
│   │   ├── codeGen/          # Code generators
│   │   │   ├── opentuiGen.ts
│   │   │   ├── inkGen.ts
│   │   │   └── bubbleteaGen.ts
│   │   ├── layout/           # Layout engine
│   │   └── validation/       # Component validation
│   ├── hooks/
│   │   ├── useComponentTree.ts
│   │   ├── useKeyboard.ts
│   │   └── useDragDrop.ts
│   └── constants/
│       ├── components.ts     # Component definitions
│       └── themes.ts         # Default themes
├── docs/                     # Documentation
├── examples/                 # Example TUI designs
└── package.json
```

---

## 📐 Data Model

### Component Node Structure

```typescript
// src/types/components.ts

export type ComponentType =
  // Layout
  | 'Box'
  | 'Flexbox'
  | 'Grid'
  | 'Stack'
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
  | 'Label'
  | 'Badge'
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

  // Type-specific props (discriminated union)
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

export interface StyleProps {
  // Border
  border?: boolean;
  borderStyle?: 'single' | 'double' | 'rounded' | 'bold' | 'hidden';
  borderColor?: string;
  borderTop?: boolean;
  borderRight?: boolean;
  borderBottom?: boolean;
  borderLeft?: boolean;

  // Colors
  color?: string; // Text/foreground color
  backgroundColor?: string;

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
  onFocus?: string; // Function name to call
  onBlur?: string;
  onClick?: string;
  onSubmit?: string;
  onChange?: string;
  onKeyPress?: string;
  [key: string]: string | undefined;
}
```

### Layout System

```typescript
// src/types/layout.ts

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
  canvasWidth: number; // Terminal columns
  canvasHeight: number; // Terminal rows
}
```

### Canvas State

```typescript
// src/stores/canvasStore.ts

interface CanvasState {
  // Dimensions
  width: number; // Terminal columns (default 80)
  height: number; // Terminal rows (default 24)

  // View
  zoom: number; // 1.0 = 100%
  panX: number;
  panY: number;

  // Grid
  showGrid: boolean;
  snapToGrid: boolean;

  // Actions
  setCanvasSize: (width: number, height: number) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;
}
```

### Component Tree State

```typescript
// src/stores/componentStore.ts

interface ComponentState {
  // Tree
  root: ComponentNode | null;
  components: Map<string, ComponentNode>; // Flat lookup

  // History
  history: ComponentNode[][];
  historyIndex: number;

  // Actions - Tree manipulation
  addComponent: (parentId: string, component: ComponentNode, index?: number) => void;
  removeComponent: (id: string) => void;
  updateComponent: (id: string, updates: Partial<ComponentNode>) => void;
  moveComponent: (id: string, newParentId: string, index?: number) => void;
  duplicateComponent: (id: string) => void;

  // Actions - Properties
  updateProps: (id: string, props: Partial<ComponentProps>) => void;
  updateLayout: (id: string, layout: Partial<LayoutProps>) => void;
  updateStyle: (id: string, style: Partial<StyleProps>) => void;
  updateEvents: (id: string, events: Partial<EventHandlers>) => void;

  // Actions - History
  undo: () => void;
  redo: () => void;

  // Queries
  getComponent: (id: string) => ComponentNode | undefined;
  getParent: (id: string) => ComponentNode | undefined;
  getChildren: (id: string) => ComponentNode[];
  getAncestors: (id: string) => ComponentNode[];
  getDescendants: (id: string) => ComponentNode[];
}
```

### Selection State

```typescript
// src/stores/selectionStore.ts

interface SelectionState {
  selectedIds: Set<string>;
  hoveredId: string | null;
  focusedId: string | null; // For keyboard navigation

  // Actions
  select: (id: string, addToSelection?: boolean) => void;
  selectMultiple: (ids: string[]) => void;
  deselect: (id: string) => void;
  clearSelection: () => void;
  setHovered: (id: string | null) => void;
  setFocused: (id: string | null) => void;

  // Queries
  isSelected: (id: string) => boolean;
  getSelectedComponents: () => ComponentNode[];
}
```

---

## 🎨 Component Library

### Built-in Components

```typescript
// src/constants/components.ts

export const COMPONENT_LIBRARY = {
  layout: [
    {
      type: 'Box',
      name: 'Box',
      description: 'Container with optional border',
      icon: 'Square',
      defaultProps: {
        width: 'auto',
        height: 'auto',
      },
      defaultLayout: {
        type: 'flexbox',
        direction: 'column',
        padding: 1,
      },
      defaultStyle: {
        border: true,
        borderStyle: 'single',
      },
    },
    {
      type: 'Flexbox',
      name: 'Flexbox',
      description: 'Flexible box layout',
      icon: 'Columns',
      defaultProps: {},
      defaultLayout: {
        type: 'flexbox',
        direction: 'row',
        gap: 1,
      },
      defaultStyle: {},
    },
    // ... more layout components
  ],

  input: [
    {
      type: 'TextInput',
      name: 'Text Input',
      description: 'Single-line text input',
      icon: 'Input',
      defaultProps: {
        placeholder: 'Enter text...',
        value: '',
        width: 20,
      },
      defaultLayout: {
        type: 'none',
      },
      defaultStyle: {
        border: true,
        borderStyle: 'single',
      },
      defaultEvents: {
        onChange: 'handleChange',
      },
    },
    {
      type: 'Button',
      name: 'Button',
      description: 'Clickable button',
      icon: 'RectangleHorizontal',
      defaultProps: {
        label: 'Button',
        disabled: false,
      },
      defaultLayout: {
        type: 'none',
        padding: { top: 0, right: 2, bottom: 0, left: 2 },
      },
      defaultStyle: {
        border: true,
        borderStyle: 'rounded',
        bold: true,
      },
      defaultEvents: {
        onClick: 'handleClick',
      },
    },
    // ... more input components
  ],

  display: [
    {
      type: 'Text',
      name: 'Text',
      description: 'Static text label',
      icon: 'Type',
      defaultProps: {
        content: 'Text',
        wrap: false,
      },
      defaultLayout: {
        type: 'none',
      },
      defaultStyle: {},
    },
    // ... more display components
  ],

  data: [
    {
      type: 'List',
      name: 'List',
      description: 'Selectable list of items',
      icon: 'List',
      defaultProps: {
        items: ['Item 1', 'Item 2', 'Item 3'],
        selectedIndex: 0,
      },
      defaultLayout: {
        type: 'flexbox',
        direction: 'column',
      },
      defaultStyle: {
        border: true,
        borderStyle: 'single',
      },
      defaultEvents: {
        onSelect: 'handleSelect',
      },
    },
    // ... more data components
  ],
};
```

---

## 🚀 Implementation Phases

### Phase 0: Project Setup (Week 1)

**Goal**: Set up development environment and base infrastructure

**Tasks**:

1. ✅ Initialize Vite + React + TypeScript project

   ```bash
   npm create vite@latest tui-designer -- --template react-ts
   cd tui-designer
   npm install
   ```

2. ✅ Install dependencies

   ```bash
   # Core
   npm install zustand react-router-dom

   # UI
   npm install tailwindcss autoprefixer postcss
   npx tailwindcss init -p
   npm install @radix-ui/react-* # Shadcn components
   npm install lucide-react clsx tailwind-merge

   # TUI Preview
   npm install @opentui/core @opentui/react

   # DnD
   npm install react-dnd react-dnd-html5-backend

   # Code Editor
   npm install @monaco-editor/react

   # Dev
   npm install -D @types/node
   ```

3. ✅ Configure Tailwind CSS
4. ✅ Set up Shadcn/ui components
5. ✅ Create base file structure
6. ✅ Set up ESLint + Prettier
7. ✅ Initialize Git repository

**Deliverable**: Working dev server with base UI

---

### Phase 1: Core Data Model & State (Week 2)

**Goal**: Implement the foundation data structures and state management

**Tasks**:

**1.1 Type Definitions** (`src/types/`)

- [ ] Create `components.ts` with all component types
- [ ] Create `layout.ts` with layout system types
- [ ] Create `export.ts` with export format types
- [ ] Create `theme.ts` with color/theme types

**1.2 Zustand Stores** (`src/stores/`)

- [ ] Implement `componentStore.ts`
  - Component tree CRUD operations
  - Undo/redo with history
  - Tree traversal helpers
- [ ] Implement `canvasStore.ts`
  - Canvas dimensions
  - Zoom & pan
  - Grid settings
- [ ] Implement `selectionStore.ts`
  - Multi-select support
  - Hover state
  - Focus management
- [ ] Implement `themeStore.ts`
  - Color palette management
  - ANSI/256/true color modes

**1.3 Component Library** (`src/constants/`)

- [ ] Define all component types with defaults
- [ ] Create component categories (layout, input, display, etc.)
- [ ] Add component icons and descriptions

**1.4 Utilities** (`src/utils/`)

- [ ] `idGenerator.ts` - Unique ID generation
- [ ] `treeUtils.ts` - Tree manipulation helpers
- [ ] `validation.ts` - Component validation rules

**Deliverable**: Working state management with component tree operations

---

### Phase 2: Basic Editor UI (Week 3-4)

**Goal**: Build the main editor interface with drag-and-drop

**Tasks**:

**2.1 Layout Structure** (`src/components/editor/`)

- [ ] Create `EditorLayout.tsx` - Main 3-column layout
  ```tsx
  <EditorLayout>
    <ComponentPalette /> {/* Left sidebar */}
    <Canvas /> {/* Center canvas */}
    <PropertyPanel /> {/* Right sidebar */}
  </EditorLayout>
  ```

**2.2 Component Palette** (`src/components/palette/`)

- [ ] `ComponentPalette.tsx` - Categorized component list
- [ ] `ComponentItem.tsx` - Draggable component item
- [ ] `CategorySection.tsx` - Collapsible categories
- [ ] Implement drag source for components

**2.3 Canvas** (`src/components/editor/`)

- [ ] `Canvas.tsx` - Main canvas container
- [ ] `CanvasGrid.tsx` - Grid background
- [ ] `ComponentRenderer.tsx` - Renders component tree
- [ ] `SelectionOverlay.tsx` - Selection boxes
- [ ] Implement drop target for components
- [ ] Add zoom controls (toolbar)
- [ ] Add pan controls (drag canvas)

**2.4 Component Tree View** (`src/components/editor/`)

- [ ] `ComponentTree.tsx` - Hierarchical tree view
- [ ] `TreeNode.tsx` - Individual tree node
- [ ] Expand/collapse nodes
- [ ] Drag to reorder
- [ ] Context menu (right-click)

**2.5 Toolbar** (`src/components/editor/`)

- [ ] `Toolbar.tsx` - Top toolbar
- [ ] Undo/redo buttons
- [ ] Canvas size selector
- [ ] Zoom controls
- [ ] Preview toggle

**Deliverable**: Working editor with drag-and-drop component placement

---

### Phase 3: Property Panel & Editing (Week 5)

**Goal**: Enable component property editing

**Tasks**:

**3.1 Property Panel** (`src/components/editor/`)

- [ ] `PropertyPanel.tsx` - Main property inspector
- [ ] `PropertiesTab.tsx` - Component properties
- [ ] `LayoutTab.tsx` - Layout settings
- [ ] `StyleTab.tsx` - Style settings
- [ ] `EventsTab.tsx` - Event handlers

**3.2 Property Inputs** (`src/components/properties/`)

- [ ] `TextInput.tsx` - String properties
- [ ] `NumberInput.tsx` - Numeric properties
- [ ] `SelectInput.tsx` - Enum properties
- [ ] `ToggleInput.tsx` - Boolean properties
- [ ] `ColorPicker.tsx` - Color properties
- [ ] `BorderStylePicker.tsx` - Border styles
- [ ] `DimensionInput.tsx` - Width/height with units

**3.3 Layout Editor** (`src/components/properties/`)

- [ ] Flexbox controls (direction, justify, align, gap)
- [ ] Grid controls (columns, rows, gaps)
- [ ] Padding/margin editor with visual representation
- [ ] Position controls for absolute layout

**3.4 Style Editor**

- [ ] Border controls (style, color, sides)
- [ ] Color controls (fg, bg)
- [ ] Text style toggles (bold, italic, underline)
- [ ] Effect controls (opacity, shadow)

**3.5 Real-time Updates**

- [ ] Debounced input updates
- [ ] Instant visual feedback
- [ ] Validation and error messages

**Deliverable**: Full property editing with live preview

---

### Phase 4: Layout Engine (Week 6)

**Goal**: Implement automatic layout calculation

**Tasks**:

**4.1 Layout Calculator** (`src/utils/layout/`)

- [ ] `layoutEngine.ts` - Main layout computation
- [ ] `flexboxLayout.ts` - Flexbox algorithm
- [ ] `gridLayout.ts` - Grid algorithm
- [ ] `absoluteLayout.ts` - Absolute positioning
- [ ] `measureText.ts` - Text measurement for sizing

**4.2 Constraint System**

- [ ] Min/max width constraints
- [ ] Min/max height constraints
- [ ] Content-based sizing ('auto')
- [ ] Fill parent sizing ('fill')
- [ ] Aspect ratio constraints

**4.3 Layout Cache**

- [ ] Memoize layout calculations
- [ ] Invalidate on component changes
- [ ] Performance monitoring

**4.4 Visual Debugging**

- [ ] Layout box overlay (show computed boxes)
- [ ] Spacing visualization (padding/margin)
- [ ] Constraint violations warnings

**Deliverable**: Automatic layout calculation matching TUI behavior

---

### Phase 5: Live TUI Preview (Week 7)

**Goal**: Show actual TUI rendering in a terminal window

**Tasks**:

**5.1 OpenTUI Integration** (`src/components/preview/`)

- [ ] `LivePreview.tsx` - OpenTUI renderer container
- [ ] `TuiRenderer.tsx` - Converts tree to OpenTUI components
- [ ] Map component types to OpenTUI elements
- [ ] Handle theme switching

**5.2 Component Mapping** (`src/utils/preview/`)

- [ ] `componentMapper.ts` - Maps design to OpenTUI JSX
- [ ] Handle all component types
- [ ] Apply styles correctly
- [ ] Support nested components

**5.3 Interaction Simulation**

- [ ] Focus management (Tab navigation)
- [ ] Keyboard input simulation
- [ ] Click simulation (for buttons)
- [ ] Form state management

**5.4 Preview Controls** (`src/components/preview/`)

- [ ] `PreviewToolbar.tsx` - Preview controls
- [ ] Terminal size selector
- [ ] Theme switcher (dark/light)
- [ ] Interaction mode toggle
- [ ] Refresh button

**5.5 Split View**

- [ ] Side-by-side: Design view + Live preview
- [ ] Toggle preview visibility
- [ ] Resizable split pane

**Deliverable**: Live terminal preview with interaction simulation

---

### Phase 6: Code Generation (Week 8-9)

**Goal**: Export working code for multiple TUI frameworks

**Tasks**:

**6.1 Export Store** (`src/stores/exportStore.ts`)

- [ ] Export format selection
- [ ] Format-specific settings
- [ ] File naming
- [ ] Export history

**6.2 OpenTUI Generator** (`src/utils/codeGen/opentuiGen.ts`)

- [ ] Generate component tree as JSX
- [ ] Generate event handlers
- [ ] Generate state management code
- [ ] Generate imports
- [ ] Generate usage example
- [ ] Add comments and documentation

**6.3 Ink Generator** (`src/utils/codeGen/inkGen.ts`)

- [ ] Map components to Ink components
- [ ] Generate Ink-specific JSX
- [ ] Handle Ink-specific props
- [ ] Generate render call

**6.4 BubbleTea Generator** (`src/utils/codeGen/bubbleteaGen.ts`)

- [ ] Generate Go structs
- [ ] Generate Update function
- [ ] Generate View function
- [ ] Generate Init function
- [ ] Handle Elm architecture

**6.5 Export UI** (`src/components/export/`)

- [ ] `ExportDialog.tsx` - Main export dialog
- [ ] `OpenTuiExportDialog.tsx` - OpenTUI settings
- [ ] `InkExportDialog.tsx` - Ink settings
- [ ] `BubbleteaExportDialog.tsx` - BubbleTea settings
- [ ] `CodePreview.tsx` - Preview generated code
- [ ] Copy to clipboard button
- [ ] Download file button

**6.6 Code Formatting**

- [ ] Integrate Prettier for formatting
- [ ] Add syntax highlighting (Monaco)
- [ ] Line numbers
- [ ] Copy individual sections

**Deliverable**: Working code generation for 3+ frameworks

---

### Phase 7: Templates & Examples (Week 10)

**Goal**: Provide ready-made templates and examples

**Tasks**:

**7.1 Template System** (`src/templates/`)

- [ ] Define template structure
- [ ] Create template metadata
- [ ] Template categories

**7.2 Built-in Templates**

- [ ] Login form
- [ ] Dashboard layout
- [ ] Settings screen
- [ ] Data table view
- [ ] Menu/navigation
- [ ] Modal dialog
- [ ] Loading states
- [ ] Error pages

**7.3 Template UI** (`src/components/templates/`)

- [ ] `TemplateGallery.tsx` - Browse templates
- [ ] `TemplatePreview.tsx` - Template preview
- [ ] `NewFromTemplate.tsx` - Create from template
- [ ] Search and filter

**7.4 Example Projects** (`examples/`)

- [ ] Todo list TUI
- [ ] File browser TUI
- [ ] Git client TUI
- [ ] System monitor TUI
- [ ] Chat interface TUI

**Deliverable**: Template library with 8+ ready-made designs

---

### Phase 8: Advanced Features (Week 11-12)

**Goal**: Polish and advanced functionality

**Tasks**:

**8.1 Keyboard Shortcuts**

- [ ] Implement keyboard shortcut system
- [ ] Undo/redo (Cmd+Z / Cmd+Shift+Z)
- [ ] Copy/paste (Cmd+C / Cmd+V)
- [ ] Delete (Delete/Backspace)
- [ ] Select all (Cmd+A)
- [ ] Duplicate (Cmd+D)
- [ ] Save/export (Cmd+S)
- [ ] Customizable shortcuts

**8.2 Component Presets**

- [ ] Save custom component configurations
- [ ] Preset library per component type
- [ ] Import/export presets

**8.3 Theme System**

- [ ] Create custom color themes
- [ ] Theme presets (Dracula, Nord, Solarized, etc.)
- [ ] Theme import/export
- [ ] Apply theme to all components

**8.4 Responsive Design**

- [ ] Breakpoint system (80col, 120col, etc.)
- [ ] Preview different terminal sizes
- [ ] Responsive layout rules

**8.5 Accessibility**

- [ ] Screen reader support
- [ ] Keyboard-only navigation
- [ ] Focus indicators
- [ ] ARIA labels

**8.6 Project Management**

- [ ] Save/load projects (.tui files)
- [ ] Project metadata
- [ ] Recent projects
- [ ] Auto-save
- [ ] Version history

**8.7 Collaboration (Future)**

- [ ] Export project as shareable link
- [ ] Import from link
- [ ] Component library sharing

**Deliverable**: Polished, production-ready tool

---

### Phase 9: Layers System (Week 13-14)

**Goal**: Implement Figma-style layer organization

**See**: `TUI_DESIGNER_LAYERS_AND_COMPONENTS.md` for detailed specifications

**Tasks**:

**9.1 Layer Data Model** (`src/stores/layerStore.ts`)

- [ ] Create Project/Page/Frame/Layer hierarchy
- [ ] Implement layer CRUD operations
- [ ] Add visibility/lock functionality
- [ ] Group/ungroup layers
- [ ] Layer search and filtering

**9.2 Layer Panel UI** (`src/components/layers/`)

- [ ] `LayerPanel.tsx` - Main layer sidebar
- [ ] `LayerTree.tsx` - Hierarchical tree view
- [ ] `LayerItem.tsx` - Individual layer with icons
- [ ] `LayerContextMenu.tsx` - Right-click actions
- [ ] Drag-and-drop reordering
- [ ] Multi-select layers (Cmd+Click)
- [ ] Expand/collapse groups

**9.3 Page Management**

- [ ] `PageTabs.tsx` - Tab bar for switching pages
- [ ] Add/delete/rename pages
- [ ] Page context menu
- [ ] Duplicate pages

**9.4 Frame/Artboard System**

- [ ] Multiple frames per page
- [ ] Frame selector on canvas
- [ ] Frame thumbnails
- [ ] Navigate between frames
- [ ] Frame presets (80x24, 120x40, etc.)

**9.5 Layer Operations**

- [ ] Show/hide layers (eye icon)
- [ ] Lock/unlock layers (lock icon)
- [ ] Rename layers (double-click)
- [ ] Delete layers
- [ ] Duplicate layers
- [ ] Opacity control
- [ ] Blend modes (future)

**Deliverable**: Full layer organization system like Figma

---

### Phase 10: Reusable Components (Week 15-16)

**Goal**: Implement Figma-style component library and instances

**See**: `TUI_DESIGNER_LAYERS_AND_COMPONENTS.md` for detailed specifications

**Tasks**:

**10.1 Component Library Data** (`src/stores/componentLibraryStore.ts`)

- [ ] Create ComponentLibrary data model
- [ ] Master component management
- [ ] Component instance system
- [ ] Override tracking
- [ ] Propagation system

**10.2 Component Panel UI** (`src/components/components/`)

- [ ] `ComponentPanel.tsx` - Component library sidebar
- [ ] `ComponentGrid.tsx` - Grid view of components
- [ ] `ComponentItem.tsx` - Draggable component
- [ ] `ComponentEditor.tsx` - Edit master component
- [ ] `ComponentPreview.tsx` - Preview thumbnail
- [ ] Search and filter components
- [ ] Category organization

**10.3 Component Creation**

- [ ] "Create Component" button/action
- [ ] Component creation dialog
- [ ] Define customizable props
- [ ] Prop type selection (text, number, color, etc.)
- [ ] Default values
- [ ] Add to library

**10.4 Component Instances**

- [ ] Drag component from library to canvas
- [ ] Visual instance indicator (purple outline)
- [ ] "Go to Master Component" button
- [ ] Property override system
- [ ] Override indicators (purple dot)
- [ ] Reset override button
- [ ] Detach instance action

**10.5 Component Variants**

- [ ] Define variant properties
- [ ] Create variant presets (Primary, Secondary, etc.)
- [ ] Variant switcher in property panel
- [ ] Apply variant values
- [ ] Visual variant preview

**10.6 Master Component Editing**

- [ ] Edit mode for master components
- [ ] Update master component
- [ ] Propagate changes to all instances
- [ ] Preserve instance overrides
- [ ] Visual diff of changes

**10.7 Component Library Management**

- [ ] Export library to `.tuicomp` file
- [ ] Import library from file
- [ ] Merge libraries
- [ ] Delete components (with safety check)
- [ ] Component usage count
- [ ] Find all instances

**10.8 Publishing/Sharing**

- [ ] Component library file format (.tuicomp)
- [ ] Library metadata (name, author, version)
- [ ] Library preview/thumbnail
- [ ] Community library marketplace (future)

**Deliverable**: Full Figma-style component system with instances and variants

---

## 🎨 UI/UX Design

### Full Editor Layout (with Layers & Components)

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│  File  Edit  View  Insert  Export  Help              [🔍] TUI Designer          ☀️ │
├─────────┬──────────────────────────────────────────────────────────────────┬────────┤
│         │  [←] [→]  [+] [-]  100%  [▶️ Preview]  [💾 Save]                 │        │
├─────────┼──────────────────────────────────────────────────────────────────┤        │
│         │                                                                   │        │
│ Layers  │                        Canvas (80x24)                            │ Props  │
│ ─────── │                                                                   │ ────── │
│         │    ┌───────────────────────────────────────────────┐             │        │
│ 📄 Login│    │  ┌──────── Login ─────────┐                   │             │ Box    │
│   📦 Box│    │  │                         │                   │             │ ────── │
│     📝 T│    │  │  Username:              │                   │             │        │
│     📦 F│    │  │  [____________________] │                   │             │ Border │
│       🔢│    │  │                         │                   │             │ Style: │
│       🔒│    │  │  Password:              │                   │             │ single │
│     📦 B│    │  │  [____________________] │                   │             │        │
│       🔘│    │  │                         │                   │             │ Color: │
│       🔘│    │  │  [Login]  [Cancel]      │                   │             │ cyan   │
│         │    │  │                         │                   │             │        │
│ 📄 Dashb│    │  └─────────────────────────┘                   │             │ Width: │
│         │    │                                                 │             │ 40     │
│         │    └───────────────────────────────────────────────┘             │        │
│         │                                                                   │ Height:│
├─────────┤                                                                   │ 12     │
│ Compone│                                                                   │        │
│ nts     │                                                                   │ Paddin │
│ ─────── │                                                                   │ g: 1   │
│         │                                                                   │        │
│ 🔍 Sear │                                                                   │        │
│         │                                                                   │        │
│ Controls│                                                                   │        │
│ ┌──────┐│                                                                   │        │
│ │🔘Btn ││                                                                   │        │
│ │☑️Chck││                                                                   │        │
│ │🔽Drop││                                                                   │        │
│ └──────┘│                                                                   │        │
│         │                                                                   │        │
│ Layout  │                                                                   │        │
│ ┌──────┐│                                                                   │        │
│ │📦Card││                                                                   │        │
│ │📋Form││                                                                   │        │
│ └──────┘│                                                                   │        │
└─────────┴───────────────────────────────────────────────────────────────────┴────────┘
```

### Color Palette

```typescript
// Terminal color modes
export const COLOR_MODES = {
  ansi16: {
    name: 'ANSI 16 Colors',
    colors: [
      'black',
      'red',
      'green',
      'yellow',
      'blue',
      'magenta',
      'cyan',
      'white',
      'brightBlack',
      'brightRed',
      'brightGreen',
      'brightYellow',
      'brightBlue',
      'brightMagenta',
      'brightCyan',
      'brightWhite',
    ],
  },
  ansi256: {
    name: 'ANSI 256 Colors',
    colors: [], // 0-255
  },
  trueColor: {
    name: 'True Color (24-bit)',
    colors: [], // #RRGGBB
  },
};
```

### Default Canvas Sizes

```typescript
export const TERMINAL_SIZES = [
  { name: 'Tiny', width: 40, height: 12 },
  { name: 'Small', width: 60, height: 20 },
  { name: 'Default', width: 80, height: 24 },
  { name: 'Medium', width: 100, height: 30 },
  { name: 'Large', width: 120, height: 40 },
  { name: 'Extra Large', width: 160, height: 50 },
  { name: 'Custom', width: 80, height: 24 },
];
```

---

## 🧪 Testing Strategy

### Unit Tests

- Component tree operations
- Layout calculations
- Code generation
- Validation rules

### Integration Tests

- Drag and drop
- Property updates
- Undo/redo
- Export flow

### E2E Tests (Playwright)

- Create new project
- Add components
- Edit properties
- Export code
- Load template

---

## 📦 Export Formats

### Supported Frameworks

```typescript
export const EXPORT_FORMATS = [
  {
    id: 'opentui',
    name: 'OpenTUI (React)',
    language: 'TypeScript',
    extension: '.tsx',
    icon: 'FileCode',
  },
  {
    id: 'ink',
    name: 'Ink (React)',
    language: 'TypeScript',
    extension: '.tsx',
    icon: 'FileCode',
  },
  {
    id: 'bubbletea',
    name: 'BubbleTea (Go)',
    language: 'Go',
    extension: '.go',
    icon: 'FileCode',
  },
  {
    id: 'blessed',
    name: 'Blessed (Node.js)',
    language: 'JavaScript',
    extension: '.js',
    icon: 'FileCode',
  },
  {
    id: 'textual',
    name: 'Textual (Python)',
    language: 'Python',
    extension: '.py',
    icon: 'FileCode',
  },
  {
    id: 'ratatui',
    name: 'Ratatui (Rust)',
    language: 'Rust',
    extension: '.rs',
    icon: 'FileCode',
  },
];
```

---

## 🚀 Launch Plan

### MVP Features (12 weeks - Core Editor)

- ✅ Core editor with drag-and-drop
- ✅ Property editing
- ✅ Layout engine
- ✅ Live preview
- ✅ Code generation (OpenTUI, Ink, BubbleTea)
- ✅ 5+ templates
- ✅ Project save/load

### V1.1 Features (4 weeks - Layers & Components)

- ✅ Figma-style layer organization
- ✅ Pages and frames
- ✅ Reusable component library
- ✅ Component instances with overrides
- ✅ Component variants
- ✅ Library import/export

### Post-V1.1 (3-6 months)

- Component library marketplace
- Cloud storage & collaboration
- Real-time co-editing
- More framework generators (Textual, Tview, Blessed)
- Plugin system
- CLI tool for scaffolding
- AI-powered layout suggestions

### Marketing

- Landing page showcasing examples
- Video tutorials
- Documentation site
- Blog posts on TUI development
- Twitter/social media presence
- Submit to Product Hunt

---

## 📊 Success Metrics

### Adoption

- 1,000 projects created in first month
- 100 GitHub stars in first week
- Featured on Hacker News / Reddit

### Engagement

- Average session duration: 20+ minutes
- Components placed per session: 15+
- Code exports per session: 3+

### Quality

- < 5 bug reports per 100 users
- 4.5+ star rating
- 80%+ positive feedback

---

## 🔗 Resources

### Inspiration

- [ASCII Motion](https://ascii-motion.app) - Animation editor
- [Figma](https://figma.com) - Visual design tool
- [Framer](https://framer.com) - Interactive design
- [Builder.io](https://builder.io) - Visual dev tool

### TUI Frameworks

- [OpenTUI](https://opentui.js.org/) - Modern React TUI
- [Ink](https://github.com/vadimdemedes/ink) - React for CLIs
- [BubbleTea](https://github.com/charmbracelet/bubbletea) - Go TUI framework
- [Blessed](https://github.com/chjj/blessed) - Node.js TUI
- [Textual](https://github.com/Textualize/textual) - Python TUI framework

### Documentation

- React DnD: https://react-dnd.github.io/react-dnd/
- Zustand: https://github.com/pmndrs/zustand
- Monaco Editor: https://microsoft.github.io/monaco-editor/

---

## 🎯 Next Actions

**Immediate (This Week)**:

1. [ ] Set up project repository
2. [ ] Initialize Vite + React + TypeScript
3. [ ] Install dependencies
4. [ ] Create basic file structure
5. [ ] Set up Shadcn/ui

**Week 2**:

1. [ ] Define all TypeScript types
2. [ ] Implement Zustand stores
3. [ ] Create component library definitions
4. [ ] Build basic tree operations

**Week 3**:

1. [ ] Build main editor layout
2. [ ] Implement component palette
3. [ ] Create canvas with grid
4. [ ] Add basic drag-and-drop

---

## 📝 Notes

- Consider using Web Workers for heavy layout calculations
- Implement virtualization for large component trees
- Use React.memo and useMemo extensively for performance
- Consider Monaco Editor alternatives (CodeMirror) if bundle size is concern
- Plan for internationalization from the start
- Design with dark mode as primary (terminal aesthetics)

---

**Document Version**: 1.0
**Last Updated**: 2026-02-09
**Status**: Ready for implementation
