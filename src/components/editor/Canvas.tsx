// Main canvas for displaying the TUI design

import { useEffect, useState, useRef, memo, type CSSProperties } from 'react';
import { useCanvasStore, useComponentStore, useSelectionStore, useThemeStore } from '../../stores';
import { layoutEngine } from '../../utils/layout';
import { dragStore } from '../../hooks/useDragAndDrop';
import { COMPONENT_LIBRARY, canHaveChildren } from '../../constants/components';
import { THEMES } from '../../stores/themeStore';
import type { ComponentNode } from '../../types';
import { interpolateGradientColor } from '../../utils/rendering/ansi';
import { ComponentToolbar } from './ComponentToolbar';


export function Canvas() {
  // Subscribe to ENTIRE store to avoid stale state
  const componentStore = useComponentStore();
  const canvasStore = useCanvasStore();
  const selectionStore = useSelectionStore();
  const themeStore = useThemeStore();

  const { root } = componentStore;

  const [isDragOver, setIsDragOver] = useState(false);
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
  layoutEngine.calculateLayout(root, canvasStore.width, canvasStore.height, canvasStore.sizeMode === 'responsive');

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
          className={`absolute inset-0 border-2 rounded transition-colors ${
            isDragOver ? 'border-primary border-dashed' : 'border-border'
          }`}
          style={{
            backgroundColor: (THEMES[themeStore.currentTheme as keyof typeof THEMES] || THEMES.dracula).black,
            fontFamily: 'monospace',
            fontSize: `${12 * canvasStore.zoom}px`,
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => selectionStore.clearSelection()}
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
                canvasWidth={canvasStore.width}
                canvasHeight={canvasStore.height}
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
  /** Canvas dimensions — changing these busts the memo so layout positions stay fresh on resize */
  canvasWidth: number;
  canvasHeight: number;
}

const ComponentRenderer = memo(function ComponentRenderer({ node, cellWidth, cellHeight, zoom, canvasWidth, canvasHeight }: ComponentRendererProps) {
  // Subscribe to entire store to avoid stale state
  const selectionStore = useSelectionStore();
  const componentStore = useComponentStore();
  const themeStore = useThemeStore();

  const selectedIds = selectionStore.selectedIds;
  const isSelected = selectedIds.has(node.id);

  // Use the global toolbar theme for ANSI color resolution
  const activeTheme = THEMES[themeStore.currentTheme as keyof typeof THEMES] || THEMES.dracula;

  // Helper to convert ANSI color name to hex using component's theme
  const getColor = (color?: string): string | undefined => {
    if (!color) return undefined;
    // If it's already a hex color, return it
    if (color.startsWith('#')) return color;
    // Otherwise, look it up in the component's theme ANSI colors
    return activeTheme[color as keyof typeof activeTheme] || color;
  };

  const layout = layoutEngine.getLayout(node.id);

  // Build a stepped CSS gradient that matches terminal rendering:
  // one hard-stop band per character column (horizontal) or row (vertical).
  const buildCliGradientCss = (): string | undefined => {
    const g = node.style.backgroundGradient;
    if (!g || g.stops.length < 2 || !layout) return undefined;
    const angle = ((g.angle % 360) + 360) % 360;
    const horizontal = (angle >= 45 && angle < 135) || (angle >= 225 && angle < 315);
    const count = horizontal ? layout.width : layout.height;
    if (count < 1) return undefined;
    const cssAngle = horizontal
      ? (angle >= 225 && angle < 315 ? 270 : 90)
      : (angle >= 180 && angle < 360 ? 0 : 180);
    const hardStops: string[] = [];
    for (let i = 0; i < count; i++) {
      const t = i / Math.max(1, count - 1);
      const [r, gv, b] = interpolateGradientColor(g, t);
      const color = `rgb(${r},${gv},${b})`;
      const s = ((i / count) * 100).toFixed(3);
      const e = (((i + 1) / count) * 100).toFixed(3);
      hardStops.push(`${color} ${s}%`, `${color} ${e}%`);
    }
    return `linear-gradient(${cssAngle}deg, ${hardStops.join(', ')})`;
  };

  const [isDragging, setIsDragging] = useState(false);
  const [insertionIndex, setInsertionIndex] = useState<number | null>(null);
  const [resizing, setResizing] = useState<{
    direction: 'e' | 's' | 'se';
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  if (!layout) return null;

  const hasOverflow = layoutEngine.getDebugInfo(node.id)?.overflow === true;

  // Render component content as JSX
  const renderComponent = (): React.ReactNode => {
    const colorMap: Record<string, string> = {
      black: 'text-black', red: 'text-red-500', green: 'text-green-500',
      yellow: 'text-yellow-500', blue: 'text-blue-500', magenta: 'text-pink-500',
      cyan: 'text-cyan-500', white: 'text-white', brightRed: 'text-red-400',
      brightGreen: 'text-green-400', brightYellow: 'text-yellow-400',
      brightBlue: 'text-blue-400', brightMagenta: 'text-pink-400', brightCyan: 'text-cyan-400',
    };
    const getColorClass = (color: string) => colorMap[color] || 'text-foreground';

    switch (node.type) {
      case 'Text': {
        const align = (node.props.align as string) || 'left';
        return (
          <span
            className="font-mono whitespace-pre-wrap w-full"
            style={{ textAlign: align as 'left' | 'center' | 'right' }}
          >
            {(node.props.content as string) || 'Text'}
          </span>
        );
      }
      case 'Button': {
        const label = node.props.label as string || 'Button';
        const iconLeft = (node.props.iconLeftEnabled && node.props.iconLeft) ? node.props.iconLeft as string : '';
        const iconRight = (node.props.iconRightEnabled && node.props.iconRight) ? node.props.iconRight as string : '';
        const number = node.props.number as number | undefined;
        const separated = node.props.separated as boolean;
        let text: string;
        if (separated && iconLeft) {
          const leftSection = number !== undefined ? `${iconLeft} ${number}` : iconLeft;
          text = `${leftSection} │ ${label}${iconRight ? ` ${iconRight}` : ''}`;
        } else {
          const left = iconLeft ? `${iconLeft} ` : '';
          const right = iconRight ? ` ${iconRight}` : '';
          text = `${left}${label}${right}`;
        }
        return <span className="font-mono font-bold">{text}</span>;
      }
      case 'TextInput':
        return <span className="font-mono">[{node.props.placeholder as string || '___________'}]</span>;
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
      case 'ProgressBar': {
        const value = (node.props.value as number) || 0;
        const max = (node.props.max as number) || 100;
        const percentage = Math.floor((value / max) * 20);
        return (
          <span className="font-mono">
            [{'█'.repeat(percentage)}{'░'.repeat(20 - percentage)}] {value}/{max}
          </span>
        );
      }
      case 'Checkbox': {
        const checkedIcon = (node.props.checkedIcon as string) || '✓';
        const uncheckedIcon = (node.props.uncheckedIcon as string) || ' ';
        const showBrackets = node.props.showBrackets !== false;
        const checked = node.props.checked as boolean;
        const label = (node.props.label as string) || 'Checkbox';
        const iconColor = checked
          ? getColorClass((node.style.checkedColor as string) || 'green')
          : getColorClass((node.style.uncheckedColor as string) || 'white');
        const icon = checked ? checkedIcon : uncheckedIcon;
        return (
          <span className="font-mono">
            <span className={iconColor}>
              {showBrackets ? `[${icon}]` : icon}
            </span>
            <span className={getColorClass((node.style.labelColor as string) || 'white')}> {label}</span>
          </span>
        );
      }
      case 'Radio': {
        const selectedIcon = (node.props.selectedIcon as string) || '●';
        const unselectedIcon = (node.props.unselectedIcon as string) || '○';
        const showBrackets = node.props.showBrackets !== false;
        const checked = node.props.checked as boolean;
        const label = (node.props.label as string) || 'Option';
        const iconColor = checked
          ? getColorClass((node.style.selectedColor as string) || 'green')
          : getColorClass((node.style.unselectedColor as string) || 'white');
        const icon = checked ? selectedIcon : unselectedIcon;
        return (
          <span className="font-mono">
            <span className={iconColor}>
              {showBrackets ? `(${icon})` : icon}
            </span>
            <span className={getColorClass((node.style.labelColor as string) || 'white')}> {label}</span>
          </span>
        );
      }
      case 'Table': {
        const columns = (node.props.columns as string[]) || ['Col 1', 'Col 2'];
        const rows = (node.props.rows as string[][]) || [];
        const numCols = columns.length;
        // Distribute width evenly across columns, accounting for separators
        const totalSepWidth = numCols + 1; // | borders
        const availWidth = Math.max(numCols, layout.width - totalSepWidth);
        const colW = Math.max(3, Math.floor(availWidth / numCols));
        const fit = (s: string) => {
          const str = String(s ?? '');
          return str.length > colW ? str.slice(0, colW - 1) + '…' : str.padEnd(colW);
        };
        const divider = columns.map(() => '─'.repeat(colW)).join('┼');
        return (
          <div className="font-mono text-xs whitespace-pre leading-none w-full">
            <div className="text-muted-foreground">{columns.map(c => fit(c)).join(' ')}</div>
            <div className="text-border">{divider}</div>
            {rows.map((row, ri) => (
              <div key={ri}>{columns.map((_, ci) => fit(row[ci] ?? '')).join(' ')}</div>
            ))}
          </div>
        );
      }
      case 'Spinner':
        return <span className="font-mono">⣾ Loading...</span>;
      case 'Tabs': {
        const tabs = (node.props.tabs as any[]) || [];
        const activeTab = (node.props.activeTab as number) || 0;
        const tabStrings = tabs.map((tab: any) => {
          const label = typeof tab === 'string' ? tab : tab.label || 'Tab';
          const icon = typeof tab === 'object' && tab.icon ? `${tab.icon} ` : '';
          const status = typeof tab === 'object' && tab.status ? ' ●' : '';
          const hotkey = typeof tab === 'object' && tab.hotkey ? ` ${tab.hotkey}` : '';
          return `${icon}${label}${status}${hotkey}`;
        });
        const tabsGroupWidth = tabStrings.reduce((sum: number, t: string) => sum + t.length + 4, 0);
        const componentWidth = layout.width;
        const justify = (node.layout as any).justify || 'start';
        let leftOffset: number;
        if (justify === 'center') {
          leftOffset = Math.max(1, Math.floor((componentWidth - tabsGroupWidth) / 2));
        } else if (justify === 'end') {
          leftOffset = Math.max(1, componentWidth - tabsGroupWidth);
        } else {
          leftOffset = 1;
        }
        const rightOffset = Math.max(0, componentWidth - leftOffset - tabsGroupWidth);
        let topRow = ' '.repeat(leftOffset);
        let midRow = ' '.repeat(leftOffset);
        let botRow = '─'.repeat(leftOffset);
        tabStrings.forEach((text: string, i: number) => {
          const innerWidth = text.length + 2;
          topRow += `╭${'─'.repeat(innerWidth)}╮`;
          midRow += `│ ${text} │`;
          botRow += i === activeTab
            ? `╯${' '.repeat(innerWidth)}╰`
            : `┴${'─'.repeat(innerWidth)}┴`;
        });
        botRow += '─'.repeat(rightOffset);
        return (
          <div className="font-mono leading-none text-xs whitespace-pre">
            <div>{topRow}</div>
            <div>{midRow}</div>
            <div>{botRow}</div>
          </div>
        );
      }
      case 'Menu': {
        const items = (node.props.items as any[]) || [];
        const selectedIndex = (node.props.selectedIndex as number) || 0;
        const isHorizontal = node.layout.type === 'flexbox' && node.layout.direction === 'row';
        if (isHorizontal) {
          const gap = typeof node.layout.gap === 'number' ? node.layout.gap : 0;
          const gapStr = '\u00A0'.repeat(gap);
          const justifyMap: Record<string, string> = {
            start: 'flex-start', center: 'center', end: 'flex-end',
            'space-between': 'space-between', between: 'space-between',
            'space-around': 'space-around', around: 'space-around',
            'space-evenly': 'space-evenly', evenly: 'space-evenly',
          };
          const alignMap: Record<string, string> = {
            start: 'flex-start', center: 'center', end: 'flex-end',
          };
          const justify = (node.layout as any).justify as string | undefined;
          const align = (node.layout as any).align as string | undefined;
          return (
            <div
              className="font-mono text-xs flex whitespace-pre w-full h-full"
              style={{
                justifyContent: justifyMap[justify || ''] || 'flex-start',
                alignItems: alignMap[align || ''] || 'center',
              }}
            >
              {items.map((item, i) => {
                const itemData = typeof item === 'string' ? { label: item, icon: '', hotkey: '', separator: false } : item;
                return (
                  <span key={i} className="flex-shrink-0">
                    {itemData.icon && `${itemData.icon} `}
                    {itemData.label}
                    {itemData.hotkey && <span className="text-muted-foreground">{` ${itemData.hotkey}`}</span>}
                    {i < items.length - 1 && (
                      itemData.separator
                        ? <span className="text-muted-foreground">{gapStr}│{gapStr}</span>
                        : <span>{gapStr}</span>
                    )}
                  </span>
                );
              })}
            </div>
          );
        } else {
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
                      {itemData.hotkey && <span className="ml-auto float-right text-muted-foreground">{itemData.hotkey}</span>}
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
        const justifyMap: Record<string, string> = {
          start: 'flex-start', center: 'center', end: 'flex-end',
          'space-between': 'space-between', between: 'space-between',
          'space-around': 'space-around', around: 'space-around',
          'space-evenly': 'space-evenly', evenly: 'space-evenly',
        };
        const alignMap: Record<string, string> = {
          start: 'flex-start', center: 'center', end: 'flex-end',
        };
        const justify = (node.layout as any).justify as string | undefined;
        const align = (node.layout as any).align as string | undefined;
        return (
          <div
            className="font-mono text-xs flex flex-col w-full h-full"
            style={{
              justifyContent: justifyMap[justify || ''] || 'flex-start',
              alignItems: alignMap[align || ''] || 'flex-start',
            }}
          >
            {items.map((item, i) => {
              const itemData = typeof item === 'string' ? { label: item, icon: '•', hotkey: '' } : item;
              const isSelected = i === selectedIndex;
              return (
                <div key={i} className={isSelected ? 'bg-accent' : ''}>
                  {itemData.icon && `${itemData.icon} `}
                  {itemData.label}
                  {itemData.hotkey && <span className="ml-2 text-muted-foreground text-[10px]">{itemData.hotkey}</span>}
                </div>
              );
            })}
          </div>
        );
      }
      case 'Breadcrumb': {
        const items = (node.props.items as any[]) || [];
        const separator = (node.props.separator as string) || '/';
        const availWidth = layout.width;
        // Build full text to check if it fits
        const parts = items.map((item: any) => {
          const d = typeof item === 'string' ? { label: item, icon: '' } : item;
          return d.icon ? `${d.icon} ${d.label}` : d.label;
        });
        const fullText = parts.join(` ${separator} `);
        const needsTruncation = fullText.length > availWidth;
        return (
          <div className="font-mono text-xs flex items-center overflow-hidden whitespace-nowrap">
            {items.map((item: any, i: number) => {
              const d = typeof item === 'string' ? { label: item, icon: '' } : item;
              const isLast = i === items.length - 1;
              // Truncate middle items when space is tight (keep first and last)
              let label = d.label as string;
              if (needsTruncation && !isLast && i > 0) label = '…';
              return (
                <span key={i} className="flex items-center">
                  {d.icon && <span className="mr-0.5">{d.icon}</span>}
                  <span>{label}</span>
                  {!isLast && <span className="text-muted-foreground mx-0.5">{separator}</span>}
                </span>
              );
            })}
          </div>
        );
      }
      case 'Tree': {
        const items = (node.props.items as any[]) || [];
        const renderTreeItem = (item: any, prefix: string, isLast: boolean): string => {
          const itemData = typeof item === 'string' ? { label: item, children: [] } : item;
          const connector = isLast ? '╰╼' : '├╼';
          let result = `${prefix}${connector} ${itemData.label}\n`;
          const children = itemData.children || [];
          if (children.length > 0) {
            const childPrefix = prefix + (isLast ? '   ' : '│  ');
            children.forEach((child: any, ci: number) => {
              result += renderTreeItem(child, childPrefix, ci === children.length - 1);
            });
          }
          return result;
        };
        let treeText = '┬\n';
        items.forEach((item: any, i: number) => {
          treeText += renderTreeItem(item, '', i === items.length - 1);
        });
        return (
          <div className="font-mono text-xs whitespace-pre leading-tight">
            {treeText.trimEnd()}
          </div>
        );
      }
      case 'Box':
      case 'Grid':
      case 'Spacer':
      case 'Screen':
        return null;
      default:
        return <span className="font-mono">{node.type}</span>;
    }
  };

  // Which resize handles to show based on component type
  const getResizeHandles = (): Array<'e' | 's' | 'se'> => {
    if (node.id === 'root') return [];
    // These types have a fixed height — only allow width resize
    const widthOnlyTypes = ['Tabs', 'Button', 'TextInput', 'Select', 'ProgressBar', 'Spinner', 'Checkbox', 'Radio', 'Toggle'];
    if (widthOnlyTypes.includes(node.type)) return ['e'];
    return ['e', 's', 'se'];
  };

  const handleResizeStart = (e: React.MouseEvent, direction: 'e' | 's' | 'se') => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({
      direction,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: layout.width,
      startHeight: layout.height,
    });
  };

  // Global mouse handlers while a resize drag is active
  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaCharW = Math.round((e.clientX - resizing.startX) / (cellWidth * zoom));
      const deltaCharH = Math.round((e.clientY - resizing.startY) / (cellHeight * zoom));
      const updates: Record<string, number> = {};
      if (resizing.direction !== 's') {
        updates.width = Math.max(4, resizing.startWidth + deltaCharW);
      }
      if (resizing.direction !== 'e') {
        updates.height = Math.max(1, resizing.startHeight + deltaCharH);
      }
      componentStore.updateProps(node.id, updates);
    };

    const handleMouseUp = () => setResizing(null);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, cellWidth, cellHeight, zoom, node.id, componentStore]);

  const hasBorder = node.style.border;
  const borderColor = hasBorder ? (getColor(node.style.borderColor) || 'hsl(var(--foreground))') : null;
  const showBorderTop    = node.style.borderTop    !== false;
  const showBorderRight  = node.style.borderRight  !== false;
  const showBorderBottom = node.style.borderBottom !== false;
  const showBorderLeft   = node.style.borderLeft   !== false;
  const hasCorners       = node.style.borderCorners !== false;

  // Map TUI border styles to CSS border width + style
  const cssBorderStyle = (() => {
    switch (node.style.borderStyle) {
      case 'double':  return { width: '3px', style: 'double' };
      case 'bold':    return { width: '2px', style: 'solid' };
      case 'rounded': return { width: '1px', style: 'solid' };
      default:        return { width: '1px', style: 'solid' };
    }
  })();
  const borderDecl = `${cssBorderStyle.width} ${cssBorderStyle.style} ${borderColor}`;
  const isRoundedBorder = node.style.borderStyle === 'rounded';

  let borderStyleProps: CSSProperties = { border: 'none' };
  if (hasBorder && borderColor) {
    if (hasCorners) {
      borderStyleProps = {
        borderTop:    showBorderTop    ? borderDecl : 'none',
        borderRight:  showBorderRight  ? borderDecl : 'none',
        borderBottom: showBorderBottom ? borderDecl : 'none',
        borderLeft:   showBorderLeft   ? borderDecl : 'none',
        boxSizing: 'border-box',
        ...(isRoundedBorder ? { borderRadius: `${Math.round(cellHeight * zoom * 0.4)}px` } : {}),
      };
    } else {
      const cw = cellWidth * zoom;
      const ch = cellHeight * zoom;
      const lw = cssBorderStyle.width; // line width for gradient thickness
      const images: string[] = [];
      const sizes: string[] = [];
      const positions: string[] = [];
      if (showBorderTop)    { images.push(`linear-gradient(${borderColor},${borderColor})`); sizes.push(`calc(100% - ${2*cw}px) ${lw}`); positions.push(`${cw}px 0`); }
      if (showBorderBottom) { images.push(`linear-gradient(${borderColor},${borderColor})`); sizes.push(`calc(100% - ${2*cw}px) ${lw}`); positions.push(`${cw}px 100%`); }
      if (showBorderLeft)   { images.push(`linear-gradient(${borderColor},${borderColor})`); sizes.push(`${lw} calc(100% - ${2*ch}px)`); positions.push(`0 ${ch}px`); }
      if (showBorderRight)  { images.push(`linear-gradient(${borderColor},${borderColor})`); sizes.push(`${lw} calc(100% - ${2*ch}px)`); positions.push(`100% ${ch}px`); }
      borderStyleProps = {
        backgroundImage: images.join(', '),
        backgroundSize: sizes.join(', '),
        backgroundPosition: positions.join(', '),
        backgroundRepeat: 'no-repeat',
      };
    }
  }

  const x = layout.x * cellWidth * zoom;
  const y = layout.y * cellHeight * zoom;

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
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
          isSelected && node.id !== 'root'
            ? 'ring-2 ring-primary ring-offset-2'
            : hasOverflow
              ? 'ring-1 ring-red-500'
              : ''
        }`}
        style={{
          left: `${x}px`,
          top: `${y}px`,
          width: `${layout.width * cellWidth * zoom}px`,
          height: `${layout.height * cellHeight * zoom}px`,
          color: getColor(node.style.color) || 'inherit',
          background: buildCliGradientCss() ?? getColor(node.style.backgroundColor),
          fontWeight: node.style.bold ? 'bold' : 'normal',
          fontStyle: node.style.italic ? 'italic' : 'normal',
          textDecoration: node.style.underline ? 'underline' : 'none',
          opacity: isDragging ? 0.5 : (node.style.opacity ?? 1),
          fontSize: `${12 * zoom}px`,
          pointerEvents: node.locked ? 'none' : 'auto',
          ...borderStyleProps,
          display: node.hidden ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: node.type === 'Text'
            ? ((node.props.align === 'right') ? 'flex-end' : (node.props.align === 'center') ? 'center' : 'flex-start')
            : ['Checkbox', 'Radio', 'Menu'].includes(node.type) ? 'flex-start' : 'center',
          padding: node.layout.padding !== undefined
            ? `${node.layout.padding * cellHeight * zoom}px ${node.layout.padding * cellWidth * zoom}px`
            : undefined,
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (node.id !== 'root') {
            selectionStore.select(node.id);
          } else {
            selectionStore.clearSelection();
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (node.id !== 'root') {
            selectionStore.select(node.id);
            window.dispatchEvent(new CustomEvent('canvas-context-menu', {
              detail: { id: node.id, x: e.clientX, y: e.clientY },
            }));
          }
        }}
      >
        {/* Render content - border is handled by CSS */}
        {renderComponent()}


        {/* Resize handles - shown when selected, constrained by component type */}
        {isSelected && node.id !== 'root' && !isDragging && getResizeHandles().map(dir => {
          const handlePositions: Record<string, React.CSSProperties> = {
            e:  { right: '-4px', top: '50%', transform: 'translateY(-50%)', cursor: 'ew-resize' },
            s:  { bottom: '-4px', left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
            se: { right: '-4px', bottom: '-4px', cursor: 'nwse-resize' },
          };
          return (
            <div
              key={dir}
              style={{
                position: 'absolute',
                width: '8px',
                height: '8px',
                backgroundColor: 'hsl(var(--primary))',
                border: '2px solid white',
                borderRadius: '2px',
                zIndex: 50,
                ...handlePositions[dir],
              }}
              onMouseDown={e => handleResizeStart(e, dir as 'e' | 's' | 'se')}
            />
          );
        })}
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
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
        />
      ))}
    </>
  );
}, (prev, next) =>
  prev.node === next.node &&
  prev.cellWidth === next.cellWidth &&
  prev.cellHeight === next.cellHeight &&
  prev.zoom === next.zoom &&
  prev.canvasWidth === next.canvasWidth &&
  prev.canvasHeight === next.canvasHeight
);
