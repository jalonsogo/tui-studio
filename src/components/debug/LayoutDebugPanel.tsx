// Layout debug panel for showing warnings and layout info

import { AlertTriangle, Info } from 'lucide-react';
import { useComponentStore, useSelectionStore } from '../../stores';
import { layoutEngine } from '../../utils/layout';

export function LayoutDebugPanel() {
  const componentStore = useComponentStore();
  const selectionStore = useSelectionStore();

  const nodesWithWarnings = layoutEngine.getNodesWithWarnings();
  const selectedComponents = selectionStore.getSelectedComponents();
  const selectedNode = selectedComponents[0];

  if (!componentStore.root) {
    return null;
  }

  return (
    <div className="border-t border-border bg-background">
      {/* Warnings Summary */}
      {nodesWithWarnings.length > 0 && (
        <div className="p-3 border-b border-border bg-yellow-950/20">
          <div className="flex items-center gap-2 text-yellow-500 text-sm mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-semibold">{nodesWithWarnings.length} Layout Warning{nodesWithWarnings.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-1 text-xs">
            {nodesWithWarnings.slice(0, 3).map(nodeId => {
              const node = findNodeById(componentStore.root, nodeId);
              const debugInfo = layoutEngine.getDebugInfo(nodeId);
              if (!node || !debugInfo) return null;

              return (
                <div
                  key={nodeId}
                  className="flex items-start gap-2 cursor-pointer hover:bg-yellow-950/30 p-1 rounded"
                  onClick={() => selectionStore.select(nodeId)}
                >
                  <span className="text-yellow-400 font-semibold">{node.name}:</span>
                  <span className="text-yellow-300">
                    {debugInfo.warnings.map(w => formatWarning(w)).join(', ')}
                  </span>
                </div>
              );
            })}
            {nodesWithWarnings.length > 3 && (
              <div className="text-yellow-400 text-xs">
                ... and {nodesWithWarnings.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Component Layout Info */}
      {selectedNode && (
        <div className="p-3">
          <div className="flex items-center gap-2 text-sm mb-3">
            <Info className="w-4 h-4 text-blue-400" />
            <span className="font-semibold">Layout Info: {selectedNode.name}</span>
          </div>

          <LayoutInfo nodeId={selectedNode.id} />
        </div>
      )}

      {/* No selection or warnings */}
      {!selectedNode && nodesWithWarnings.length === 0 && (
        <div className="p-3 text-center text-sm text-muted-foreground">
          No layout issues detected
        </div>
      )}
    </div>
  );
}

function LayoutInfo({ nodeId }: { nodeId: string }) {
  const layout = layoutEngine.getLayout(nodeId);
  const debugInfo = layoutEngine.getDebugInfo(nodeId);

  if (!layout) {
    return <div className="text-xs text-muted-foreground">No layout data</div>;
  }

  return (
    <div className="space-y-2 text-xs font-mono">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-muted-foreground">Position:</span>{' '}
          <span className="text-foreground">({layout.x}, {layout.y})</span>
        </div>
        <div>
          <span className="text-muted-foreground">Size:</span>{' '}
          <span className="text-foreground">{layout.width}×{layout.height}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-muted-foreground">Content:</span>{' '}
          <span className="text-foreground">
            {layout.contentBox.width}×{layout.contentBox.height}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Margin:</span>{' '}
          <span className="text-foreground">
            {layout.marginBox.width}×{layout.marginBox.height}
          </span>
        </div>
      </div>

      {debugInfo && debugInfo.warnings.length > 0 && (
        <div className="pt-2 border-t border-border">
          <div className="text-yellow-500 font-semibold mb-1">Warnings:</div>
          <ul className="space-y-1">
            {debugInfo.warnings.map((warning, i) => (
              <li key={i} className="text-yellow-400">
                • {formatWarning(warning)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function formatWarning(warning: import('../../utils/layout').LayoutWarning): string {
  switch (warning.type) {
    case 'overflow':
      return `Overflow ${warning.axis}-axis: ${warning.amount} cols/rows`;
    case 'constraint-violation':
      return `Constraint violation: ${warning.constraint}`;
    case 'negative-space':
      return `Negative ${warning.dimension}`;
    case 'circular-dependency':
      return 'Circular dependency detected';
    default:
      return 'Unknown warning';
  }
}

function findNodeById(root: import('../../types').ComponentNode | null, id: string): import('../../types').ComponentNode | null {
  if (!root) return null;
  if (root.id === id) return root;

  for (const child of root.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }

  return null;
}
