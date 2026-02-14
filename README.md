# TUIStudio

**Visual design tool for building Terminal User Interfaces**

![Status](https://img.shields.io/badge/status-alpha-orange)
![License](https://img.shields.io/badge/license-MIT-blue)

A Figma-like visual editor for designing and building Terminal User Interface applications. Design with drag-and-drop, see live preview, export to multiple TUI frameworks.

<img width="800" alt="TUIStudio - TUI Designer" src="https://via.placeholder.com/800x450/1a1a1a/00ff00?text=TUIStudio+TUI+Designer" />

## ✨ Features (Planned)

- 🎨 **Visual Editor** - Drag-and-drop components onto a terminal canvas
- 👁️ **Live Preview** - See your TUI render in real-time as you design
- 📦 **Component Library** - Reusable components with Figma-style instances and overrides
- 🏗️ **Layer System** - Organize designs with pages, frames, and hierarchical layers
- 💻 **Multi-Framework Export** - Generate code for OpenTUI, Ink, BubbleTea, Blessed, Textual
- 📐 **Layout Engine** - Automatic Flexbox/Grid layout calculations
- 🎯 **Templates** - Pre-built templates for common TUI patterns
- ⌨️ **Keyboard Shortcuts** - Professional workflow with hotkeys

## 🎯 Vision

Enable developers to build beautiful Terminal UIs as easily as designing web UIs in Figma. Bridge the gap between design and implementation for CLI applications.

## 🚀 Quick Start

**Note**: Project is currently in planning phase. Implementation will begin soon.

### Documentation

- **[Overview](./TUI_DESIGNER_OVERVIEW.md)** - Start here for project overview
- **[Implementation Plan](./TUI_DESIGNER_IMPLEMENTATION_PLAN.md)** - Detailed 16-week roadmap
- **[Quick Start Guide](./TUI_DESIGNER_QUICKSTART.md)** - Setup and first steps
- **[Code Examples](./TUI_DESIGNER_CODE_EXAMPLE.md)** - See generated code output
- **[Layers & Components](./TUI_DESIGNER_LAYERS_AND_COMPONENTS.md)** - Figma-style features

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation (Coming Soon)

```bash
# Clone repository
git clone https://github.com/jalonsogo/tui-studio.git
cd tuistudio

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🏗️ Tech Stack

- **React 19** - UI framework
- **TypeScript 5.8+** - Type safety
- **Vite 7** - Build tool
- **Zustand 5** - State management
- **Tailwind CSS 4** - Styling
- **Shadcn/ui** - UI components
- **OpenTUI** - Terminal preview
- **Monaco Editor** - Code editor
- **react-dnd** - Drag and drop

## 📦 Project Structure

```
tuistudio/
├── docs/                          # Documentation
│   ├── TUI_DESIGNER_OVERVIEW.md
│   ├── TUI_DESIGNER_IMPLEMENTATION_PLAN.md
│   └── ...
├── src/
│   ├── components/
│   │   ├── editor/               # Main editor components
│   │   ├── palette/              # Component palette
│   │   ├── properties/           # Property panel
│   │   ├── layers/               # Layer system
│   │   └── preview/              # Live preview
│   ├── stores/                   # Zustand stores
│   ├── types/                    # TypeScript types
│   ├── utils/
│   │   ├── codeGen/             # Code generators
│   │   └── layout/              # Layout engine
│   └── hooks/                   # Custom hooks
├── examples/                     # Example TUI designs
├── templates/                    # Built-in templates
└── package.json
```

## 🎨 Supported TUI Frameworks

Export your designs to:

| Framework | Language | Status |
|-----------|----------|--------|
| [OpenTUI](https://opentui.js.org/) | TypeScript/React | Planned |
| [Ink](https://github.com/vadimdemedes/ink) | TypeScript/React | Planned |
| [BubbleTea](https://github.com/charmbracelet/bubbletea) | Go | Planned |
| [Blessed](https://github.com/chjj/blessed) | JavaScript | Planned |
| [Textual](https://github.com/Textualize/textual) | Python | Planned |
| [Tview](https://github.com/rivo/tview) | Go | Future |

## 📅 Roadmap

### MVP (Weeks 1-12)
- [ ] Core editor with drag-and-drop
- [ ] Property editing
- [ ] Layout engine
- [ ] Live preview
- [ ] Code generation (OpenTUI, Ink, BubbleTea)
- [ ] 5+ templates
- [ ] Project save/load

### V1.1 (Weeks 13-16)
- [ ] Figma-style layer system
- [ ] Reusable component library
- [ ] Component instances with overrides
- [ ] Component variants
- [ ] Library import/export

### V2.0 (Future)
- [ ] Cloud storage
- [ ] Real-time collaboration
- [ ] Component marketplace
- [ ] Plugin system
- [ ] AI layout suggestions

## 🤝 Contributing

Contributions are welcome! This project is in early planning stages.

### Areas We Need Help With
- Component library definitions
- Code generators for additional frameworks
- Templates and examples
- Documentation and tutorials
- Testing
- UI/UX design

### How to Contribute
1. Read the [Implementation Plan](./TUI_DESIGNER_IMPLEMENTATION_PLAN.md)
2. Check open issues
3. Fork the repository
4. Create a feature branch
5. Submit a pull request

## 💡 Inspiration

This project draws inspiration from:
- **Figma** - Visual design and component system
- **ASCII Motion** - ASCII art editor architecture
- **Builder.io** - Visual development platform
- **Framer** - Interactive design tool

## 📜 License

MIT License - see [LICENSE](LICENSE) for details

## 🌟 Star History

If you find this project interesting, give it a star! ⭐

## 📧 Contact

- **Issues**: [GitHub Issues](https://github.com/jalonsogo/tui-studio/issues)
- **Discussions**: [GitHub Discussions](https://github.com/jalonsogo/tui-studio/discussions)
- **Twitter**: [@yourusername](https://twitter.com/yourusername)

---

**Made with ❤️ for the TUI community**
