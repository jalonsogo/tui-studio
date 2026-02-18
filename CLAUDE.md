# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TUIStudio is a Figma-like visual editor for Terminal User Interfaces (TUIs). It lets developers design terminal UIs visually and export them as code for multiple frameworks (Ink, BubbleTea, Blessed, Textual, OpenTUI, Tview).

## Commands

```bash
npm run dev       # Start Vite dev server with hot reload
npm run build     # TypeScript compile + Vite production build (tsc -b && vite build)
npm run lint      # ESLint
npm run preview   # Preview production build locally
```

No test runner is configured.

## Architecture

### State Management (Zustand stores in `src/stores/`)

- **componentStore.ts** — The core store. Manages the component tree (`ComponentNode[]`), history/undo-redo, and all tree mutations (add, remove, update, move, duplicate).
- **canvasStore.ts** — Viewport state: zoom, pan, grid settings, canvas dimensions.
- **selectionStore.ts** — Multi-selection (selected, hovered, focused component IDs).
- **themeStore.ts** — TUI color theme for rendering.

### Data Flow

1. User actions mutate `componentStore` (the source of truth).
2. `LayoutEngine` (`src/utils/layout/engine.ts`) computes positions/sizes from the component tree + canvas dimensions.
3. `Canvas.tsx` renders the computed layout using the ANSI rendering system.
4. `PropertyPanel.tsx` reads/writes the selected component's props via `componentStore`.

### Layout Engine (`src/utils/layout/`)

- `engine.ts` — Orchestrates layout calculation; dispatches to flexbox, grid, or absolute sub-engines.
- `flexbox.ts` / `grid.ts` / `absolute.ts` — Individual layout algorithm implementations.

### Rendering System (`src/utils/rendering/`)

Converts the component tree into a visual TUI representation using ANSI escape codes and Unicode box-drawing characters. Key files: `canvas.ts`, `components.ts`, `ansi.ts`, `borders.ts`.

### Component Library (`src/constants/components.ts`)

Defines `COMPONENT_LIBRARY`: 20+ TUI component types (Screen, Box, Button, TextInput, List, Table, Tree, Menu, Tabs, Modal, etc.), each with default props, layout config, style, and event handlers.

### Export / Code Generation (`src/utils/export/`)

- `codeExporter.ts` — Multi-framework code generation (Ink, BubbleTea, Blessed, Textual, OpenTUI, Tview).
- `textExporter.ts` — Plain text/ASCII export.

### Key Types (`src/types/`)

- `ComponentNode` — Core tree node with `id`, `type`, `props`, `children`, `layout`, `style`.
- `ComponentType` — Union of all supported TUI component type strings.
- `LayoutProps`, `StyleProps`, `EventHandlers` — Prop category types.

### Tree Utilities (`src/utils/treeUtils.ts`)

`findNodeById`, `findParentNode`, `flattenTree`, `cloneNode` — used throughout for tree traversal and manipulation.

### UI Layout

```
┌─ Toolbar ───────────────────────────────────────────┐
│ LeftSidebar │ Canvas (main editor) │ PropertyPanel  │
│  - Palette  │                      │                │
│  - Layers   │                      │                │
└─────────────┴──────────────────────┴────────────────┘
```

- `Canvas.tsx` (`src/components/editor/`) — Large file (~44KB). Handles rendering, selection, and drag-and-drop.
- `CommandPalette.tsx` — Cmd/Ctrl+P to open; supports component quick-add and commands.
- `App.tsx` — Wires global keyboard shortcuts (component hotkeys, delete, undo/redo, command palette).

## Tech Stack

- React 19, TypeScript 5.8, Vite 7
- Zustand 5 (state), Tailwind CSS 3 (editor UI styling)
- Lucide React (icons), react-router-dom 7
