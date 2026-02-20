# Changelog

All notable changes to TUIStudio are documented here.

## [0.3.0] - 2026-02-20

### Added
- **Multi-select** — Shift-click components in the Layers panel or on the Canvas to build a multi-selection for batch operations.
- **Group into Box (multi-select)** — Shift-select sibling components, then right-click → "Group into Box" to wrap all selected items into a single Box container.
- **Ungroup** — Right-click any Box with children → "Ungroup" promotes all children to the parent level and removes the container. Works on multiple selected groups at once.
- **Escape to deselect** — Press Esc to clear the current selection.

### Removed
- **"Add to Box"** context menu item (was a duplicate of "Group into Box").

## [0.2.0] - 2026-02-19

### Added
- **Gradient backgrounds** — Background color picker now includes a Gradient tab with angle control (0–360°) and N color stops (add, remove, reposition). Gradients are rendered as discrete character-cell bands in the editor, matching exact terminal ANSI output.
- **ANSI gradient export** — Exported ANSI output uses per-column true-color (`\x1b[48;2;r;g;b]`) background codes so the gradient renders correctly in any true-color terminal.

## [0.1.0] - 2026-02-11

### Added
- **Visual Canvas** — Drag-and-drop components with live ANSI preview at configurable zoom levels.
- **20+ TUI Components** — Screen, Box, Button, TextInput, Checkbox, Radio, Select, Toggle, Text, Spinner, ProgressBar, Table, List, Tree, Menu, Tabs, Breadcrumb, Modal, Popover, Tooltip, Spacer.
- **Layout Engine** — Absolute, Flexbox, and Grid layout modes with full property control.
- **Color Themes** — Dracula, Nord, Solarized Dark/Light, Monokai, Gruvbox, Tokyo Night, Nightfox, Sonokai — all updating the canvas in real-time.
- **Dark / Light Mode** — Toggle between dark and light editor UI; persists across sessions.
- **Layers Panel** — Hierarchical component tree with drag-to-reorder, visibility toggle, lock, and inline rename.
- **Property Panel** — Edit layout, style, and component-specific props for the selected component.
- **Undo / Redo** — Full history for all tree mutations.
- **Save / Load** — `.tui` JSON format via native OS file picker (Chrome/Edge) or browser download (Firefox/Safari).
- **Multi-Framework Export** — Generate code for Ink, BubbleTea, Blessed, Textual, OpenTUI, Tview.
- **Command Palette** — `Cmd/Ctrl+P` for quick component creation, theme switching, and dark/light mode toggle.
- **Settings** — Accent color presets, dark/light mode toggle, and default download folder.
- **Landing Page** — Marketing page with feature carousel.
