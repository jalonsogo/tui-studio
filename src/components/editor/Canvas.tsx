// Main canvas for displaying the TUI design

import { useCanvasStore, useComponentStore } from '../../stores';

export function Canvas() {
  const canvasStore = useCanvasStore();
  const componentStore = useComponentStore();

  const cellWidth = 8; // pixels per character
  const cellHeight = 16; // pixels per line

  const canvasWidth = canvasStore.width * cellWidth * canvasStore.zoom;
  const canvasHeight = canvasStore.height * cellHeight * canvasStore.zoom;

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
            <div className="absolute inset-0 p-2">
              <ComponentRenderer node={componentStore.root} />
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

// Simple component renderer
function ComponentRenderer({ node }: { node: import('../../types').ComponentNode }) {
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
      default:
        return <span className="text-muted-foreground text-xs">{node.type}</span>;
    }
  };

  const hasBorder = node.style.border;
  const borderStyle = node.style.borderStyle || 'single';
  const chars = getBorderChars(borderStyle);

  return (
    <div
      className="inline-block"
      style={{
        color: node.style.color,
        backgroundColor: node.style.backgroundColor,
        fontWeight: node.style.bold ? 'bold' : 'normal',
        fontStyle: node.style.italic ? 'italic' : 'normal',
        textDecoration: node.style.underline ? 'underline' : 'none',
        opacity: node.style.opacity ?? 1,
      }}
    >
      {hasBorder ? (
        <div className="font-mono">
          {/* Top border */}
          <div>
            {chars.tl}
            {chars.h.repeat(Math.max(0, (node.props.width as number) || 10))}
            {chars.tr}
          </div>
          {/* Content */}
          <div>
            {chars.v} {renderContent()} {chars.v}
          </div>
          {/* Bottom border */}
          <div>
            {chars.bl}
            {chars.h.repeat(Math.max(0, (node.props.width as number) || 10))}
            {chars.br}
          </div>
        </div>
      ) : (
        renderContent()
      )}

      {/* Children */}
      {node.children.length > 0 && (
        <div className="ml-2 space-y-1">
          {node.children.map((child) => (
            <ComponentRenderer key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}
