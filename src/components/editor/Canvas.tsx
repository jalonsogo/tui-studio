// Main canvas for displaying the TUI design

import { useEffect } from 'react';
import { useCanvasStore, useComponentStore, useSelectionStore } from '../../stores';
import { layoutEngine } from '../../utils/layout';

export function Canvas() {
  const canvasStore = useCanvasStore();
  const componentStore = useComponentStore();
  const selectionStore = useSelectionStore();

  const cellWidth = 8; // pixels per character
  const cellHeight = 16; // pixels per line

  const canvasWidth = canvasStore.width * cellWidth * canvasStore.zoom;
  const canvasHeight = canvasStore.height * cellHeight * canvasStore.zoom;

  // Calculate layout whenever components or canvas size changes
  useEffect(() => {
    layoutEngine.calculateLayout(componentStore.root, canvasStore.width, canvasStore.height);
  }, [componentStore.root, canvasStore.width, canvasStore.height]);

  return (
    <div className="flex-1 flex items-center justify-center bg-muted/20 overflow-auto p-8">
      <div className="relative" style={{ width: canvasWidth, height: canvasHeight }}>
        {/* Canvas Background */}
        <div
          className="absolute inset-0 bg-background border-2 border-border rounded"
          style={{
            fontFamily: 'monospace',
            fontSize: `${12 * canvasStore.zoom}px`,
          }}
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
          {!componentStore.root && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              <div className="text-center">
                <p className="mb-2">Drop components here</p>
                <p className="text-xs">or click components in the palette</p>
              </div>
            </div>
          )}

          {/* Component Rendering */}
          {componentStore.root && (
            <div className="absolute inset-0" style={{ fontFamily: 'monospace' }}>
              <ComponentRenderer
                node={componentStore.root}
                cellWidth={cellWidth}
                cellHeight={cellHeight}
                zoom={canvasStore.zoom}
                selectedIds={selectionStore.selectedIds}
              />
            </div>
          )}
        </div>

        {/* Canvas Info */}
        <div className="absolute -bottom-6 left-0 text-xs text-muted-foreground">
          {canvasStore.width}×{canvasStore.height} cols/rows
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
  selectedIds: Set<string>;
}

function ComponentRenderer({ node, cellWidth, cellHeight, zoom, selectedIds }: ComponentRendererProps) {
  const selectionStore = useSelectionStore();
  const layout = layoutEngine.getLayout(node.id);
  const isSelected = selectedIds.has(node.id);

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

  const renderContent = () => {
    switch (node.type) {
      case 'Text':
        return <span>{node.props.content || 'Text'}</span>;
      case 'Button':
        return <span className="font-bold">[{node.props.label || 'Button'}]</span>;
      case 'TextInput':
        return <span>[{node.props.placeholder || '___________'}]</span>;
      case 'ProgressBar':
        const value = (node.props.value as number) || 0;
        const max = (node.props.max as number) || 100;
        const percentage = Math.floor((value / max) * 20);
        return <span>[{'█'.repeat(percentage)}{'░'.repeat(20 - percentage)}] {value}/{max}</span>;
      case 'List':
      case 'Select':
      case 'Menu':
        const items = (node.props.items as string[]) || [];
        return (
          <div>
            {items.slice(0, 5).map((item, i) => (
              <div key={i}>• {item}</div>
            ))}
            {items.length > 5 && <div className="text-muted-foreground">... +{items.length - 5} more</div>}
          </div>
        );
      case 'Checkbox':
        return <span>[{node.props.checked ? '✓' : ' '}] Checkbox</span>;
      case 'Spinner':
        return <span>⣾ Loading...</span>;
      default:
        return <span className="text-muted-foreground text-xs">{node.type}</span>;
    }
  };

  const hasBorder = node.style.border;
  const borderStyle = node.style.borderStyle || 'single';
  const chars = getBorderChars(borderStyle);

  const x = layout.x * cellWidth * zoom;
  const y = layout.y * cellHeight * zoom;

  return (
    <>
      <div
        className={`absolute cursor-pointer transition-colors ${
          isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
        }`}
        style={{
          left: `${x}px`,
          top: `${y}px`,
          color: node.style.color,
          backgroundColor: node.style.backgroundColor,
          fontWeight: node.style.bold ? 'bold' : 'normal',
          fontStyle: node.style.italic ? 'italic' : 'normal',
          textDecoration: node.style.underline ? 'underline' : 'none',
          opacity: node.style.opacity ?? 1,
          fontSize: `${12 * zoom}px`,
          pointerEvents: node.locked ? 'none' : 'auto',
        }}
        onClick={(e) => {
          e.stopPropagation();
          selectionStore.select(node.id);
        }}
      >
        {hasBorder ? (
          <div>
            {/* Top border */}
            <div>
              {chars.tl}
              {chars.h.repeat(Math.max(0, layout.width - 2))}
              {chars.tr}
            </div>
            {/* Content */}
            <div className="px-1">
              {renderContent()}
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

        {/* Layout debug info */}
        {isSelected && (
          <div
            className="absolute -top-6 left-0 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded whitespace-nowrap"
            style={{ fontSize: '10px' }}
          >
            {layout.width}×{layout.height} @ ({layout.x}, {layout.y})
          </div>
        )}
      </div>

      {/* Render children */}
      {node.children.map((child) => (
        <ComponentRenderer
          key={child.id}
          node={child}
          cellWidth={cellWidth}
          cellHeight={cellHeight}
          zoom={zoom}
          selectedIds={selectedIds}
        />
      ))}
    </>
  );
}
