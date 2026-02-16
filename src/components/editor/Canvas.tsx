// Main canvas for displaying the TUI design

import { useEffect, useState, useRef } from 'react';
import { useCanvasStore, useComponentStore, useSelectionStore } from '../../stores';
import { layoutEngine } from '../../utils/layout';
import { dragStore } from '../../hooks/useDragAndDrop';
import { COMPONENT_LIBRARY, canHaveChildren } from '../../constants/components';
import { THEMES } from '../../stores/themeStore';
import type { ComponentNode } from '../../types';
import { ComponentToolbar } from './ComponentToolbar';

// Helper to find the active theme for a component by walking up the tree
function findComponentTheme(node: ComponentNode, componentStore: any): string {
  // Check if this node has a theme
  if (node.props.theme && typeof node.props.theme === 'string') {
    return node.props.theme;
  }

  // Walk up to find parent with theme
  const parent = componentStore.getParent(node.id);
  if (parent) {
    return findComponentTheme(parent, componentStore);
  }

  // Default fallback
  return 'dracula';
}

export function Canvas() {
  console.log('🎨 Canvas component mounted/rendering');

  // Subscribe to ENTIRE store to avoid stale state
  const componentStore = useComponentStore();
  const canvasStore = useCanvasStore();
  const selectionStore = useSelectionStore();

  const { root } = componentStore;
  console.log('📦 Current root:', root ? `ID: ${root.id}, Children: ${root.children.length}` : 'null');

  const [isDragOver, setIsDragOver] = useState(false);
  const [offCanvasWarning, setOffCanvasWarning] = useState<string | null>(null);
  const [isToolbarDocked, setIsToolbarDocked] = useState(() =>
    JSON.parse(localStorage.getItem('toolbar-docked') || 'false')
  );
  const viewportRef = useRef<HTMLDivElement>(null);

  // Listen for toolbar dock state changes
  useEffect(() => {
    const handleDockedChange = () => {
      setIsToolbarDocked(JSON.parse(localStorage.getItem('toolbar-docked') || 'false'));
    };
    window.addEventListener('toolbar-docked-changed', handleDockedChange);
    return () => window.removeEventListener('toolbar-docked-changed', handleDockedChange);
  }, []);

  // Responsive canvas sizing
  useEffect(() => {
    if (canvasStore.sizeMode !== 'responsive') {
      setOffCanvasWarning(null);
      return;
    }

    const updateCanvasSize = () => {
      if (!viewportRef.current) return;

      // Get available space from the viewport container
      // The p-4 class adds 16px padding on each side
      // Also account for the dropdown selector at the bottom (~40px)
      const availableWidth = viewportRef.current.clientWidth - 32; // minus 2*16px padding
      const availableHeight = viewportRef.current.clientHeight - 72; // minus padding + dropdown space

      const cellWidth = 8;
      const cellHeight = 16;

      // Calculate columns and rows that fit
      const cols = Math.floor(availableWidth / (cellWidth * canvasStore.zoom));
      const rows = Math.floor(availableHeight / (cellHeight * canvasStore.zoom));

      // Update canvas size
      canvasStore.setCanvasSize(
        Math.max(10, Math.min(200, cols)),
        Math.max(10, Math.min(100, rows))
      );

      // Check for off-canvas elements
      if (root) {
        layoutEngine.calculateLayout(root, cols, rows);
        const allLayouts = layoutEngine.getAllLayouts();

        let hasOffCanvas = false;
        allLayouts.forEach((layout, nodeId) => {
          if (layout.x + layout.width > cols || layout.y + layout.height > rows) {
            hasOffCanvas = true;
          }
        });

        if (hasOffCanvas) {
          setOffCanvasWarning('Some elements are outside the visible canvas area');
        } else {
          setOffCanvasWarning(null);
        }
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [canvasStore.sizeMode, canvasStore.zoom, root]);

  // Keyboard navigation for selected components
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const selectedIds = Array.from(selectionStore.selectedIds);
      if (selectedIds.length === 0) return;

      // Only handle arrow keys
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;

      // Don't interfere with input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      e.preventDefault();

      // Shift key = move 5 units, otherwise 1 unit
      const step = e.shiftKey ? 5 : 1;

      selectedIds.forEach(id => {
        const component = componentStore.getComponent(id);
        if (!component || component.locked) return;

        const currentX = component.layout.x || 0;
        const currentY = component.layout.y || 0;

        let newX = currentX;
        let newY = currentY;

        switch (e.key) {
          case 'ArrowUp':
            newY = Math.max(0, currentY - step);
            break;
          case 'ArrowDown':
            newY = currentY + step;
            break;
          case 'ArrowLeft':
            newX = Math.max(0, currentX - step);
            break;
          case 'ArrowRight':
            newX = currentX + step;
            break;
        }

        componentStore.updateLayout(id, { x: newX, y: newY });
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [componentStore, selectionStore]);

  const cellWidth = 8; // pixels per character
  const cellHeight = 16; // pixels per line

  const viewportWidth = canvasStore.width * cellWidth * canvasStore.zoom;
  const viewportHeight = canvasStore.height * cellHeight * canvasStore.zoom;

  // Calculate layout SYNCHRONOUSLY during render so ComponentRenderer has layout data
  // This must happen BEFORE ComponentRenderer tries to access layout
  console.log('⚡ Calculating layout for root:', root ? `${root.id} with ${root.children.length} children` : 'null');
  layoutEngine.calculateLayout(root, canvasStore.width, canvasStore.height);
  console.log('✅ Layout calculation complete');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const dragData = dragStore.dragData;
    if (!dragData) return;

    // Handle repositioning existing components
    if (dragData.type === 'existing-component' && dragData.componentId) {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Convert pixel position to character coordinates
      const charX = Math.floor(mouseX / (cellWidth * canvasStore.zoom));
      const charY = Math.floor(mouseY / (cellHeight * canvasStore.zoom));

      console.log('📍 Repositioning component:', {
        componentId: dragData.componentId,
        mouseX,
        mouseY,
        charX,
        charY
      });

      // Update component position
      componentStore.updateLayout(dragData.componentId, { x: charX, y: charY });
      dragStore.endDrag();
      return;
    }

    if (dragData.type === 'new-component' && dragData.componentType) {
      // Add new component to canvas
      let parentId = root?.id;

      if (!parentId) {
        // Create root if it doesn't exist
        const newRoot: import('../../types').ComponentNode = {
          id: 'root',
          type: 'Screen',
          name: 'Main Screen',
          props: { width: 80, height: 24, theme: 'dracula' },
          layout: {
            type: 'absolute',
          },
          style: {
            border: false,
          },
          events: {},
          children: [],
          locked: false,
          hidden: false,
          collapsed: false,
        };
        componentStore.setRoot(newRoot);
        parentId = 'root'; // Now we have a parent to add to
      }

      const def = COMPONENT_LIBRARY[dragData.componentType];
      if (def) {
        // Calculate position with offset so components don't stack on top of each other
        const existingChildren = root?.children.length || 0;
        const offsetX = existingChildren * 2;
        const offsetY = existingChildren * 2;

        const newComponent: Omit<import('../../types').ComponentNode, 'id'> = {
          type: def.type,
          name: def.name,
          props: { ...def.defaultProps },
          layout: {
            ...def.defaultLayout,
            x: offsetX,
            y: offsetY,
          },
          style: { ...def.defaultStyle },
          events: { ...def.defaultEvents },
          children: [],
          locked: false,
          hidden: false,
          collapsed: false,
        };

        const id = componentStore.addComponent(parentId, newComponent);
        if (id) {
          selectionStore.select(id);
        }
      }
    }

    dragStore.endDrag();
  };

  return (
    <div ref={viewportRef} className="flex-1 h-full flex items-center justify-center bg-muted/20 overflow-hidden p-4 relative">
      {/* Figma-style Component Toolbar - Only show if not docked */}
      {!isToolbarDocked && <ComponentToolbar />}

      <div className="relative" style={{ width: viewportWidth, height: viewportHeight }}>
        {/* Canvas Background */}
        <div
          className={`absolute inset-0 bg-background border-2 rounded transition-colors ${
            isDragOver ? 'border-primary border-dashed' : 'border-border'
          }`}
          style={{
            fontFamily: 'monospace',
            fontSize: `${12 * canvasStore.zoom}px`,
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Grid */}
          {canvasStore.showGrid && (
            <svg
              className="absolute inset-0 pointer-events-none opacity-20"
              width="100%"
              height="100%"
            >
              <defs>
                <pattern
                  id="grid"
                  width={cellWidth * canvasStore.zoom}
                  height={cellHeight * canvasStore.zoom}
                  patternUnits="userSpaceOnUse"
                >
                  <rect
                    width={cellWidth * canvasStore.zoom}
                    height={cellHeight * canvasStore.zoom}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          )}

          {/* Empty State */}
          {!root && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm pointer-events-none">
              <div className="text-center">
                <p className="mb-2">{isDragOver ? 'Drop to add component' : 'Drag components here'}</p>
                <p className="text-xs">or click components in the palette</p>
              </div>
            </div>
          )}

          {/* Component Rendering */}
          {root && (
            <div className="absolute inset-0" style={{ fontFamily: 'monospace' }}>
              <ComponentRenderer
                node={root}
                cellWidth={cellWidth}
                cellHeight={cellHeight}
                zoom={canvasStore.zoom}
              />
            </div>
          )}
        </div>

        {/* Canvas Size Selector */}
        <div className="absolute -bottom-8 left-0 flex items-center gap-2">
          <select
            value={canvasStore.sizeMode}
            onChange={(e) => canvasStore.setSizeMode(e.target.value as any)}
            className="px-2 py-0.5 text-[11px] bg-card border border-border/50 rounded focus:border-primary focus:outline-none"
          >
            <option value="default">Default (80×25)</option>
            <option value="responsive">Responsive</option>
          </select>

          <span className="text-[10px] text-muted-foreground/60">
            {canvasStore.width}×{canvasStore.height}
          </span>
        </div>

        {/* Off-canvas Warning */}
        {offCanvasWarning && (
          <div className="absolute -bottom-14 left-0 right-0 flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-500 text-[10px]">
            <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {offCanvasWarning}
          </div>
        )}
      </div>
    </div>
  );
}

// Component renderer with layout engine
interface ComponentRendererProps {
  node: import('../../types').ComponentNode;
  cellWidth: number;
  cellHeight: number;
  zoom: number;
}

function ComponentRenderer({ node, cellWidth, cellHeight, zoom }: ComponentRendererProps) {
  // Subscribe to entire store to avoid stale state
  const selectionStore = useSelectionStore();
  const componentStore = useComponentStore();

  const selectedIds = selectionStore.selectedIds;
  const isSelected = selectedIds.has(node.id);

  // Find the active theme for this component
  const activeThemeName = findComponentTheme(node, componentStore);
  const activeTheme = THEMES[activeThemeName as keyof typeof THEMES] || THEMES.dracula;

  // Helper to convert ANSI color name to hex using component's theme
  const getColor = (color?: string): string | undefined => {
    if (!color) return undefined;
    // If it's already a hex color, return it
    if (color.startsWith('#')) return color;
    // Otherwise, look it up in the component's theme ANSI colors
    return activeTheme[color as keyof typeof activeTheme] || color;
  };

  const layout = layoutEngine.getLayout(node.id);
  const [isDragging, setIsDragging] = useState(false);
  const [insertionIndex, setInsertionIndex] = useState<number | null>(null);

  if (!layout || node.hidden) return null;

  const getBorderChars = (style: string) => {
    switch (style) {
      case 'single':
        return { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' };
      case 'double':
        return { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' };
      case 'rounded':
        return { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' };
      case 'bold':
        return { tl: '┏', tr: '┓', bl: '┗', br: '┛', h: '━', v: '┃' };
      default:
        return { tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|' };
    }
  };

  // Helper to pad text to specified width
  const padText = (text: string, width: number, align: 'left' | 'center' | 'right' = 'center'): string => {
    if (text.length >= width) return text.slice(0, width);
    const padding = width - text.length;
    if (align === 'left') return text + ' '.repeat(padding);
    if (align === 'right') return ' '.repeat(padding) + text;
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
  };

  // Get plain text content for a component (for bordered rendering)
  const getTextContent = (): string => {
    switch (node.type) {
      case 'Text':
        return node.props.content as string || 'Text';
      case 'Button': {
        const label = node.props.label as string || 'Button';
        const iconLeft = (node.props.iconLeftEnabled && node.props.iconLeft) ? node.props.iconLeft as string : '';
        const iconRight = (node.props.iconRightEnabled && node.props.iconRight) ? node.props.iconRight as string : '';
        const number = node.props.number as number | undefined;
        const separated = node.props.separated as boolean;

        if (separated && iconLeft) {
          const leftSection = number !== undefined ? `${iconLeft} ${number}` : iconLeft;
          return `${leftSection} │ ${label}${iconRight ? ` ${iconRight}` : ''}`;
        }

        const left = iconLeft ? `${iconLeft} ` : '';
        const right = iconRight ? ` ${iconRight}` : '';
        // No padding spaces - let the border padding handle it
        return `${left}${label}${right}`;
      }
      case 'TextInput':
        return `[${node.props.placeholder || '___________'}]`;
      case 'Select': {
        const value = (node.props.value as string) || '';
        const options = (node.props.options as string[]) || [];
        const displayText = value || (options.length > 0 ? options[0] : 'Select');
        return `${displayText} ▼`;
      }
      case 'ProgressBar': {
        const value = (node.props.value as number) || 0;
        const max = (node.props.max as number) || 100;
        const percentage = Math.floor((value / max) * 20);
        return `[${'█'.repeat(percentage)}${'░'.repeat(20 - percentage)}] ${value}/${max}`;
      }
      case 'Checkbox': {
        const checkedIcon = (node.props.checkedIcon as string) || '✓';
        const uncheckedIcon = (node.props.uncheckedIcon as string) || ' ';
        const checked = node.props.checked as boolean;
        const label = (node.props.label as string) || 'Checkbox';
        return `[${checked ? checkedIcon : uncheckedIcon}] ${label}`;
      }
      case 'Radio': {
        const selectedIcon = (node.props.selectedIcon as string) || '●';
        const unselectedIcon = (node.props.unselectedIcon as string) || '○';
        const checked = node.props.checked as boolean;
        const label = (node.props.label as string) || 'Option';
        return `(${checked ? selectedIcon : unselectedIcon}) ${label}`;
      }
      case 'Spinner':
        return '⣾ Loading...';
      case 'Tabs': {
        const tabs = (node.props.tabs as any[]) || [];
        const activeTab = (node.props.activeTab as number) || 0;

        // Build tab content strings
        const tabContents = tabs.map((tab, i) => {
          const isActive = i === activeTab;
          const label = typeof tab === 'string' ? tab : tab.label || 'Tab';
          const icon = typeof tab === 'object' && tab.icon ? `${tab.icon} ` : '';
          const status = typeof tab === 'object' && tab.status ? ' ●' : '';
          const hotkey = typeof tab === 'object' && tab.hotkey ? `   ${tab.hotkey}` : '';

          return ` ${icon}${label}${status}${hotkey} `;
        });

        // First row: top borders
        const topRow = tabContents.map((content, i) => {
          return ` ╭${'─'.repeat(content.length - 2)}╮`;
        }).join('');

        // Second row: content
        const contentRow = tabContents.map((content, i) => {
          return ` │${content.slice(1, -1)}│`;
        }).join('');

        // Third row: bottom with connection
        const activeIndex = activeTab;
        let bottomRow = '─';
        tabContents.forEach((content, i) => {
          const barLength = content.length - 2;
          if (i === activeIndex) {
            bottomRow += `┴${'─'.repeat(barLength)}┴╯${' '.repeat(barLength + 1)}`;
          } else {
            bottomRow += `╰${'─'.repeat(barLength)}┴`;
          }
        });
        bottomRow += '──────';

        return `${topRow}\n${contentRow}\n${bottomRow}`;
      }
      case 'Menu': {
        const items = (node.props.items as any[]) || [];
        const selectedIndex = (node.props.selectedIndex as number) || 0;
        const isHorizontal = node.layout.type === 'flexbox' && node.layout.direction === 'row';

        if (isHorizontal) {
          // Horizontal menu - items on one line with vertical separators
          const gap = typeof node.layout.gap === 'number' ? node.layout.gap : 0;
          const gapStr = ' '.repeat(gap);
          const parts: string[] = [];

          items.forEach((item, i) => {
            const itemData = typeof item === 'string' ? { label: item, icon: '', hotkey: '', separator: false } : item;
            const icon = itemData.icon ? `${itemData.icon} ` : '';
            const hotkey = itemData.hotkey ? ` ${itemData.hotkey}` : '';
            parts.push(`${icon}${itemData.label}${hotkey}`);

            if (i < items.length - 1) {
              // Add gap + separator + gap pattern
              if (itemData.separator) {
                parts.push(`${gapStr}│${gapStr}`);
              } else {
                parts.push(gapStr);
              }
            }
          });

          return parts.join('');
        } else {
          // Vertical menu - items stacked with horizontal separators
          const lines: string[] = [];

          items.forEach((item, i) => {
            const itemData = typeof item === 'string' ? { label: item, icon: '', hotkey: '', separator: false } : item;
            const isSelected = i === selectedIndex;
            const prefix = isSelected ? '▶ ' : '  ';
            const icon = itemData.icon ? `${itemData.icon} ` : '';
            const hotkey = itemData.hotkey ? `   ${itemData.hotkey}` : '';

            lines.push(`${prefix}${icon}${itemData.label}${hotkey}`);

            // Add horizontal separator line after this item if enabled
            if (itemData.separator && i < items.length - 1) {
              lines.push('──────────────────');
            }
          });

          return lines.join('\n');
        }
      }
      case 'List': {
        const items = (node.props.items as any[]) || [];
        return items.map((item, i) => {
          const itemData = typeof item === 'string' ? { label: item, icon: '•', hotkey: '' } : item;
          const icon = itemData.icon ? `${itemData.icon} ` : '';
          const hotkey = itemData.hotkey ? `  ${itemData.hotkey}` : '';
          return `${icon}${itemData.label}${hotkey}`;
        }).join('\n');
      }
      case 'Breadcrumb': {
        const items = (node.props.items as any[]) || [];
        const separator = (node.props.separator as string) || ' / ';
        return items.map((item, i) => {
          const itemData = typeof item === 'string' ? { label: item, icon: '' } : item;
          const icon = itemData.icon ? `${itemData.icon} ` : '';
          const sep = i < items.length - 1 ? separator : '';
          return `${icon}${itemData.label}${sep}`;
        }).join('');
      }
      case 'Tree': {
        const items = (node.props.items as any[]) || [];
        const renderTreeItem = (item: any, level: number = 0, isLast: boolean = false, prefix: string = ''): string => {
          const itemData = typeof item === 'string' ? { label: item, icon: '📄', children: [], expanded: false } : item;
          const hasChildren = itemData.children && itemData.children.length > 0;
          const connector = isLast ? '└─' : '├─';
          const expandIcon = hasChildren ? (itemData.expanded ? '▼' : '▶') : ' ';

          let result = `${prefix}${connector} ${expandIcon} ${itemData.icon || ''} ${itemData.label}\n`;

          if (hasChildren && itemData.expanded) {
            const childPrefix = prefix + (isLast ? '   ' : '│  ');
            itemData.children.forEach((child: any, i: number) => {
              result += renderTreeItem(child, level + 1, i === itemData.children.length - 1, childPrefix);
            });
          }

          return result;
        };

        return items.map((item, i) => renderTreeItem(item, 0, i === items.length - 1, '')).join('').trim();
      }
      // Container components (Box, Flexbox, Grid, Stack, Spacer, Screen)
      case 'Box':
      case 'Flexbox':
      case 'Grid':
      case 'Stack':
      case 'Spacer':
      case 'Screen':
        return ''; // Containers should be empty - they hold children
      default:
        return node.type;
    }
  };

  const renderContent = () => {
    const text = getTextContent();

    switch (node.type) {
      case 'Button':
        return <span className="font-bold">{text}</span>;
      case 'Select': {
        const value = (node.props.value as string) || '';
        const options = (node.props.options as string[]) || [];
        const displayText = value || (options.length > 0 ? options[0] : 'Select');
        return (
          <span className="font-mono">
            {displayText} <span className="text-muted-foreground">▼</span>
          </span>
        );
      }
      case 'Menu': {
        const items = (node.props.items as any[]) || [];
        const selectedIndex = (node.props.selectedIndex as number) || 0;
        const isHorizontal = node.layout.type === 'flexbox' && node.layout.direction === 'row';

        if (isHorizontal) {
          // Horizontal menu - items side by side with vertical separators
          const gap = typeof node.layout.gap === 'number' ? node.layout.gap : 0;
          const gapStr = '\u00A0'.repeat(gap); // Non-breaking spaces for HTML rendering

          return (
            <div className="font-mono text-xs flex items-center whitespace-pre">
              {items.map((item, i) => {
                const itemData = typeof item === 'string' ? { label: item, icon: '', hotkey: '', separator: false } : item;
                return (
                  <span key={i}>
                    {itemData.icon && `${itemData.icon} `}
                    {itemData.label}
                    {itemData.hotkey && (
                      <span className="text-muted-foreground">{` ${itemData.hotkey}`}</span>
                    )}
                    {i < items.length - 1 && (
                      itemData.separator ? (
                        <span className="text-muted-foreground">{gapStr}│{gapStr}</span>
                      ) : (
                        <span>{gapStr}</span>
                      )
                    )}
                  </span>
                );
              })}
            </div>
          );
        } else {
          // Vertical menu - items stacked with horizontal separators
          return (
            <div className="font-mono text-xs">
              {items.map((item, i) => {
                const itemData = typeof item === 'string' ? { label: item, icon: '', hotkey: '', separator: false } : item;
                const isSelected = i === selectedIndex;
                return (
                  <div key={i}>
                    <div className={isSelected ? 'font-bold' : ''}>
                      {isSelected ? '▶ ' : '  '}
                      {itemData.icon && `${itemData.icon} `}
                      {itemData.label}
                      {itemData.hotkey && (
                        <span className="ml-auto float-right text-muted-foreground">{itemData.hotkey}</span>
                      )}
                    </div>
                    {itemData.separator && i < items.length - 1 && (
                      <div className="text-muted-foreground">──────────────────</div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        }
      }
      case 'List': {
        const items = (node.props.items as any[]) || [];
        const selectedIndex = (node.props.selectedIndex as number) || 0;
        return (
          <div className="font-mono text-xs">
            {items.map((item, i) => {
              const itemData = typeof item === 'string' ? { label: item, icon: '•', hotkey: '' } : item;
              const isSelected = i === selectedIndex;
              return (
                <div key={i} className={isSelected ? 'bg-accent' : ''}>
                  {itemData.icon && `${itemData.icon} `}
                  {itemData.label}
                  {itemData.hotkey && (
                    <span className="ml-2 text-muted-foreground text-[10px]">{itemData.hotkey}</span>
                  )}
                </div>
              );
            })}
          </div>
        );
      }
      case 'Breadcrumb': {
        const items = (node.props.items as any[]) || [];
        const separator = (node.props.separator as string) || ' / ';
        return (
          <div className="font-mono text-xs flex items-center">
            {items.map((item, i) => {
              const itemData = typeof item === 'string' ? { label: item, icon: '' } : item;
              return (
                <span key={i}>
                  {itemData.icon && `${itemData.icon} `}
                  {itemData.label}
                  {i < items.length - 1 && <span className="text-muted-foreground">{separator}</span>}
                </span>
              );
            })}
          </div>
        );
      }
      case 'Tree': {
        const items = (node.props.items as any[]) || [];
        const renderTreeItem = (item: any, level: number = 0, isLast: boolean = false, prefix: string = ''): string => {
          const itemData = typeof item === 'string' ? { label: item, icon: '📄', children: [], expanded: false } : item;
          const hasChildren = itemData.children && itemData.children.length > 0;
          const connector = isLast ? '└─' : '├─';
          const expandIcon = hasChildren ? (itemData.expanded ? '▼' : '▶') : ' ';

          let result = `${prefix}${connector} ${expandIcon} ${itemData.icon || ''} ${itemData.label}\n`;

          if (hasChildren && itemData.expanded) {
            const childPrefix = prefix + (isLast ? '   ' : '│  ');
            itemData.children.forEach((child: any, i: number) => {
              result += renderTreeItem(child, level + 1, i === itemData.children.length - 1, childPrefix);
            });
          }

          return result;
        };

        const treeText = items.map((item, i) => renderTreeItem(item, 0, i === items.length - 1, '')).join('');

        return (
          <div className="font-mono text-xs whitespace-pre leading-tight">
            {treeText}
          </div>
        );
      }
      case 'Tabs': {
        const tabs = (node.props.tabs as any[]) || [];
        const activeTab = (node.props.activeTab as number) || 0;

        // Build each row as a string
        let topRow = ' ';
        let contentRow = ' ';
        let bottomRow = '─';

        tabs.forEach((tab, i) => {
          const isActive = i === activeTab;
          const label = typeof tab === 'string' ? tab : tab.label || 'Tab';
          const icon = typeof tab === 'object' && tab.icon ? `${tab.icon} ` : '';
          const status = typeof tab === 'object' && tab.status ? ' ●' : '';
          const hotkey = typeof tab === 'object' && tab.hotkey ? `   ${tab.hotkey}` : '';
          const content = ` ${icon}${label}${status}${hotkey} `;
          const barLength = content.length - 2;

          // Top row
          topRow += `╭${'─'.repeat(barLength)}╮`;

          // Content row
          contentRow += `│${content.slice(1, -1)}│`;

          // Bottom row
          if (isActive) {
            bottomRow += `┴${'─'.repeat(barLength)}┴╯${' '.repeat(barLength + 1)}`;
          } else {
            bottomRow += `╰${'─'.repeat(barLength)}┴`;
          }
        });

        bottomRow += '──────';

        return (
          <div className="font-mono leading-none text-xs whitespace-pre">
            <div>{topRow}</div>
            <div className="font-bold">{contentRow}</div>
            <div>{bottomRow}</div>
          </div>
        );
      }
      case 'Checkbox': {
        const checkedIcon = (node.props.checkedIcon as string) || '✓';
        const uncheckedIcon = (node.props.uncheckedIcon as string) || ' ';
        const checked = node.props.checked as boolean;
        const label = (node.props.label as string) || 'Checkbox';

        // Get colors from style
        const checkedColor = (node.style.checkedColor as string) || 'green';
        const uncheckedColor = (node.style.uncheckedColor as string) || 'white';
        const labelColor = (node.style.labelColor as string) || 'white';

        // Map color names to Tailwind classes
        const getColorClass = (color: string) => {
          const colorMap: Record<string, string> = {
            black: 'text-black',
            red: 'text-red-500',
            green: 'text-green-500',
            yellow: 'text-yellow-500',
            blue: 'text-blue-500',
            magenta: 'text-pink-500',
            cyan: 'text-cyan-500',
            white: 'text-white',
            brightRed: 'text-red-400',
            brightGreen: 'text-green-400',
            brightYellow: 'text-yellow-400',
            brightBlue: 'text-blue-400',
            brightMagenta: 'text-pink-400',
            brightCyan: 'text-cyan-400',
          };
          return colorMap[color] || 'text-white';
        };

        const iconColor = checked ? getColorClass(checkedColor) : getColorClass(uncheckedColor);
        const icon = checked ? checkedIcon : uncheckedIcon;

        return (
          <span className="font-mono">
            <span className={iconColor}>[{icon}]</span>
            <span className={getColorClass(labelColor)}> {label}</span>
          </span>
        );
      }
      case 'Radio': {
        const selectedIcon = (node.props.selectedIcon as string) || '●';
        const unselectedIcon = (node.props.unselectedIcon as string) || '○';
        const checked = node.props.checked as boolean;
        const label = (node.props.label as string) || 'Option';

        // Get colors from style
        const selectedColor = (node.style.selectedColor as string) || 'blue';
        const unselectedColor = (node.style.unselectedColor as string) || 'white';
        const labelColor = (node.style.labelColor as string) || 'white';

        // Map color names to Tailwind classes
        const getColorClass = (color: string) => {
          const colorMap: Record<string, string> = {
            black: 'text-black',
            red: 'text-red-500',
            green: 'text-green-500',
            yellow: 'text-yellow-500',
            blue: 'text-blue-500',
            magenta: 'text-pink-500',
            cyan: 'text-cyan-500',
            white: 'text-white',
            brightRed: 'text-red-400',
            brightGreen: 'text-green-400',
            brightYellow: 'text-yellow-400',
            brightBlue: 'text-blue-400',
            brightMagenta: 'text-pink-400',
            brightCyan: 'text-cyan-400',
          };
          return colorMap[color] || 'text-white';
        };

        const iconColor = checked ? getColorClass(selectedColor) : getColorClass(unselectedColor);
        const icon = checked ? selectedIcon : unselectedIcon;

        return (
          <span className="font-mono">
            <span className={iconColor}>({icon})</span>
            <span className={getColorClass(labelColor)}> {label}</span>
          </span>
        );
      }
      default:
        return <span>{text}</span>;
    }
  };

  const hasBorder = node.style.border;
  const borderStyle = node.style.borderStyle || 'single';
  const chars = getBorderChars(borderStyle);

  const x = layout.x * cellWidth * zoom;
  const y = layout.y * cellHeight * zoom;

  // Debug logging
  if (node.type === 'Button') {
    console.log(`[Canvas] Rendering Button:`, {
      name: node.name,
      nodeId: node.id,
      layoutX: layout.x,
      layoutY: layout.y,
      pixelX: x,
      pixelY: y,
      layoutWidth: layout.width,
      layoutHeight: layout.height,
      cellWidth,
      cellHeight,
      zoom,
      hasBorder,
      isSelected,
      hidden: node.hidden,
    });
  }

  // Debug logging for root
  if (node.type === 'Box' && node.id === 'root') {
    console.log(`[Canvas] Rendering Root:`, {
      nodeId: node.id,
      layoutX: layout.x,
      layoutY: layout.y,
      pixelX: x,
      pixelY: y,
      layoutWidth: layout.width,
      layoutHeight: layout.height,
      childrenCount: node.children.length,
    });
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    dragStore.startDrag({
      type: 'existing-component',
      componentId: node.id,
    });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', node.id);

    // Select the component being dragged
    selectionStore.select(node.id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    dragStore.endDrag();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.stopPropagation();

    // Only containers can accept children
    if (!canHaveChildren(node.type)) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }

    e.preventDefault();

    // Calculate insertion position for flexbox/stack containers
    if (node.children.length > 0 && node.layout.type === 'flexbox') {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const isColumn = node.layout.direction === 'column';
      const mousePos = isColumn ? mouseY : mouseX;

      // Find insertion index based on mouse position
      let insertIndex = 0;
      for (let i = 0; i < node.children.length; i++) {
        const childLayout = layoutEngine.getLayout(node.children[i].id);
        if (!childLayout) continue;

        const childPos = isColumn
          ? (childLayout.y - layout.y) * cellHeight * zoom
          : (childLayout.x - layout.x) * cellWidth * zoom;
        const childSize = isColumn
          ? childLayout.height * cellHeight * zoom
          : childLayout.width * cellWidth * zoom;

        if (mousePos < childPos + childSize / 2) {
          insertIndex = i;
          break;
        }
        insertIndex = i + 1;
      }

      setInsertionIndex(insertIndex);
    }
  };

  const handleDragLeave = () => {
    setInsertionIndex(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    // Root Screen should not intercept drops - let canvas handle repositioning
    if (node.id === 'root') {
      return;
    }

    // Only containers can accept children
    if (!canHaveChildren(node.type)) {
      return;
    }

    e.stopPropagation();
    e.preventDefault();

    const dragData = dragStore.dragData;
    if (!dragData) return;

    // Handle new component from palette
    if (dragData.type === 'new-component' && dragData.componentType) {
      const def = COMPONENT_LIBRARY[dragData.componentType];
      if (def) {
        const newComponent: Omit<import('../../types').ComponentNode, 'id'> = {
          type: def.type,
          name: def.name,
          props: { ...def.defaultProps },
          layout: { ...def.defaultLayout, x: 0, y: 0 },
          style: { ...def.defaultStyle },
          events: { ...def.defaultEvents },
          children: [],
          locked: false,
          hidden: false,
          collapsed: false,
        };

        const id = componentStore.addComponent(node.id, newComponent, insertionIndex ?? undefined);
        if (id) {
          selectionStore.select(id);
        }
      }
      setInsertionIndex(null);
      dragStore.endDrag();
      return;
    }

    // Handle existing component reparenting
    if (dragData.type === 'existing-component' && dragData.componentId) {
      // Don't drop on self
      if (dragData.componentId === node.id) return;

      // Move the dragged component to be a child of this component (reparenting)
      componentStore.moveComponent(dragData.componentId, node.id, insertionIndex ?? undefined);
      setInsertionIndex(null);
      dragStore.endDrag();
    }
  };

  return (
    <>
      <div
        draggable={!node.locked && node.id !== 'root'}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`absolute transition-colors ${
          isDragging ? 'opacity-50 cursor-grabbing' : 'cursor-grab'
        } ${
          isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
        }`}
        style={{
          left: `${x}px`,
          top: `${y}px`,
          color: getColor(node.style.color),
          backgroundColor: getColor(node.style.backgroundColor),
          fontWeight: node.style.bold ? 'bold' : 'normal',
          fontStyle: node.style.italic ? 'italic' : 'normal',
          textDecoration: node.style.underline ? 'underline' : 'none',
          opacity: isDragging ? 0.5 : (node.style.opacity ?? 1),
          fontSize: `${12 * zoom}px`,
          pointerEvents: node.locked ? 'none' : 'auto',
        }}
        onClick={(e) => {
          e.stopPropagation();
          selectionStore.select(node.id);
        }}
      >
        {hasBorder ? (
          <div className="font-mono">
            {/* Top border */}
            <div>
              {chars.tl}
              {chars.h.repeat(Math.max(0, layout.width - 2))}
              {chars.tr}
            </div>
            {/* Content - pad with spaces to match border width */}
            <div>
              {chars.v}
              <span className={node.type === 'Button' ? 'font-bold' : ''}>
                {padText(getTextContent(), layout.width - 2, 'center')}
              </span>
              {chars.v}
            </div>
            {/* Bottom border */}
            <div>
              {chars.bl}
              {chars.h.repeat(Math.max(0, layout.width - 2))}
              {chars.br}
            </div>
          </div>
        ) : (
          renderContent()
        )}

        {/* Component label - only when selected, shows name + dimensions + position */}
        {isSelected && node.id !== 'root' && (
          <div
            className="absolute -top-5 left-0 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded whitespace-nowrap"
            style={{ fontSize: '10px' }}
          >
            {node.name} · {layout.width}×{layout.height} @ ({layout.x}, {layout.y})
          </div>
        )}
      </div>

      {/* Insertion line indicator */}
      {insertionIndex !== null && node.layout.type === 'flexbox' && (
        (() => {
          const isColumn = node.layout.direction === 'column';
          const padding = typeof node.layout.padding === 'number' ? node.layout.padding : 0;

          let lineX = x;
          let lineY = y;
          let lineWidth = layout.width * cellWidth * zoom;
          let lineHeight = 2;

          if (insertionIndex === 0) {
            // Insert at beginning (after padding)
            lineX = x + (isColumn ? 0 : padding * cellWidth * zoom);
            lineY = y + (isColumn ? padding * cellHeight * zoom : 0);
            if (!isColumn) {
              lineWidth = 2;
              lineHeight = layout.height * cellHeight * zoom;
            }
          } else if (insertionIndex <= node.children.length) {
            // Insert between/after children
            const prevChild = node.children[insertionIndex - 1];
            const prevLayout = layoutEngine.getLayout(prevChild?.id);
            if (prevLayout) {
              const gap = typeof node.layout.gap === 'number' ? node.layout.gap : 0;
              if (isColumn) {
                lineY = (prevLayout.y + prevLayout.height + gap / 2) * cellHeight * zoom;
              } else {
                lineX = (prevLayout.x + prevLayout.width + gap / 2) * cellWidth * zoom;
                lineWidth = 2;
                lineHeight = layout.height * cellHeight * zoom;
              }
            }
          }

          return (
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${lineX}px`,
                top: `${lineY}px`,
                width: `${lineWidth}px`,
                height: `${lineHeight}px`,
                backgroundColor: '#3b82f6',
                zIndex: 1000,
              }}
            />
          );
        })()
      )}

      {/* Render children */}
      {node.children.map((child) => (
        <ComponentRenderer
          key={child.id}
          node={child}
          cellWidth={cellWidth}
          cellHeight={cellHeight}
          zoom={zoom}
        />
      ))}
    </>
  );
}
