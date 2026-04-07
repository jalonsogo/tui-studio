<img src="public/logo-tui-studio_light.svg" alt="TUIStudio" width="64" />

# TUIStudio

**Visual design tool for building Terminal User Interfaces**

![Status](https://img.shields.io/badge/status-alpha-orange)

A Figma-like visual editor for designing Terminal UI applications. Drag-and-drop components onto a live canvas, edit properties visually, and export to multiple TUI frameworks.
<img width="400" height="400" alt="Computer" src="https://github.com/user-attachments/assets/89fc6a4f-7034-49e3-9729-5355c276842f" />


## Features

- **Visual Canvas** — Drag-and-drop components with live ANSI preview at configurable zoom levels
- **20+ TUI Components** — Screen, Box, Button, TextInput, Checkbox, Radio, Select, Toggle, Text, Spinner, ProgressBar, Table, List, Tree, Menu, Tabs, Breadcrumb, Modal, Popover, Tooltip, Spacer
- **Layout Engine** — Absolute, Flexbox, and Grid layout modes with full property control
- **Color Themes** — Dracula, Nord, Solarized Dark/Light, Monokai, Gruvbox, Tokyo Night, Nightfox, Sonokai — all updating the canvas in real-time
- **Dark / Light Mode** — Toggle between dark and light editor UI; persists across sessions
- **Layers Panel** — Hierarchical component tree with drag-to-reorder, visibility toggle, lock, and inline rename
- **Property Panel** — Edit layout, style, and component-specific props for the selected component
- **Undo / Redo** — Full history for all tree mutations
- **Save / Load** — `.tui` JSON format via native OS file picker (Chrome/Edge) or browser download (Firefox/Safari)
- **Multi-Framework Export** — Generate code for Ink, BubbleTea, Blessed, Textual, OpenTUI, Tview
- **Command Palette** — `Cmd/Ctrl+P` for quick component creation, theme switching, and dark/light mode toggle
- **Gradient Backgrounds** — Add linear gradients to any element background with angle control and N color stops; rendered as discrete character-cell bands matching real ANSI terminal output
- **Settings** — Accent color presets, dark/light mode toggle, and default download folder


## Star History

<a href="https://www.star-history.com/?repos=jalonsogo%2Ftui-studio&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=jalonsogo/tui-studio&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=jalonsogo/tui-studio&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=jalonsogo/tui-studio&type=date&legend=top-left" />
 </picture>
</a>

## Quick Start

```bash
git clone https://github.com/jalonsogo/tui-studio.git
cd tui-studio
npm install
npm run dev
```

Open `http://localhost:5173`.

## Keyboard Shortcuts

| Action          | Shortcut                          |
| --------------- | --------------------------------- |
| Command Palette | `Cmd/Ctrl+P`                      |
| Save            | `Cmd/Ctrl+S`                      |
| Open            | `Cmd/Ctrl+O`                      |
| Export          | `Cmd/Ctrl+E`                      |
| Copy            | `Cmd/Ctrl+C`                      |
| Paste           | `Cmd/Ctrl+V`                      |
| Delete          | `Backspace` / `Delete`            |
| Undo            | `Cmd/Ctrl+Z`                      |
| Redo            | `Cmd/Ctrl+Shift+Z` / `Cmd/Ctrl+Y` |

**Component hotkeys** (when not typing):

| Key | Component | Key | Component   |
| --- | --------- | --- | ----------- |
| `b` | Button    | `t` | Tabs        |
| `r` | Box       | `l` | List        |
| `k` | Checkbox  | `e` | Tree        |
| `a` | Radio     | `m` | Menu        |
| `s` | Select    | `i` | TextInput   |
| `o` | Toggle    | `p` | ProgressBar |
| `n` | Spinner   | `y` | Text        |
| `j` | Spacer    |     |             |

## File Format

Projects are saved as `.tui` files (JSON):

```json
{
  "version": "1",
  "meta": { "name": "My Screen", "theme": "dracula", "savedAt": "..." },
  "tree": { ... }
}
```

## Export Frameworks

| Framework                                               | Language           |
| ------------------------------------------------------- | ------------------ |
| [Ink](https://github.com/vadimdemedes/ink)              | TypeScript / React |
| [BubbleTea](https://github.com/charmbracelet/bubbletea) | Go                 |
| [Blessed](https://github.com/chjj/blessed)              | JavaScript         |
| [Textual](https://github.com/Textualize/textual)        | Python             |
| [OpenTUI](https://opentui.js.org/)                      | TypeScript         |
| [Tview](https://github.com/rivo/tview)                  | Go                 |

## Tech Stack

- **React 19**, TypeScript 5.8, Vite 7
- **Zustand 5** — state management
- **Tailwind CSS** — editor UI styling
- **Lucide React** — icons

## Commands

```bash
npm run dev      # Start dev server
npm run build    # TypeScript compile + production build
npm run lint     # ESLint
npm run preview  # Preview production build
```

---

**Issues**: [GitHub Issues](https://github.com/jalonsogo/tui-studio/issues)

## LOLcense

For {root} sake I'm a designer. Mostly all the code has been written by Claude and ad latere.
