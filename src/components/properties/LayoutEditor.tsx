// Layout property editor

import { useComponentStore } from '../../stores';
import type { ComponentNode } from '../../types';
import { canHaveChildren } from '../../constants/components';

interface LayoutEditorProps {
  component: ComponentNode;
}

export function LayoutEditor({ component }: LayoutEditorProps) {
  const updateLayout = useComponentStore(state => state.updateLayout);

  const handleUpdate = (updates: Partial<ComponentNode['layout']>) => {
    updateLayout(component.id, updates);
  };

  const isTabs = component.type === 'Tabs';
  const isLeaf = !canHaveChildren(component.type);

  return (
    <div className="space-y-4">
      {/* Position (X, Y) - Always visible for absolute positioning */}
      <div>
        <label className="text-sm font-medium mb-2 block">Position</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">X (columns)</label>
            <input
              type="number"
              value={component.layout.x || 0}
              onChange={(e) => handleUpdate({ x: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Y (rows)</label>
            <input
              type="number"
              value={component.layout.y || 0}
              onChange={(e) => handleUpdate({ y: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
            />
          </div>
        </div>
      </div>

      {/* Tabs: only show tab alignment */}
      {isTabs && (
        <div>
          <label className="text-sm font-medium mb-2 block">Tab Alignment</label>
          <select
            value={(component.layout as any).justify || 'start'}
            onChange={(e) => handleUpdate({ justify: e.target.value as any })}
            className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
          >
            <option value="start">Left</option>
            <option value="center">Center</option>
            <option value="end">Right</option>
          </select>
        </div>
      )}

      {/* Layout Type - only for non-leaf, non-Tabs containers */}
      {!isLeaf && !isTabs && (
        <>
          <div>
            <label className="text-sm font-medium mb-2 block">Layout Type</label>
            <select
              value={component.layout.type}
              onChange={(e) => handleUpdate({ type: e.target.value as any })}
              className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
            >
              <option value="none">None</option>
              <option value="flexbox">Flexbox</option>
              <option value="grid">Grid</option>
              <option value="absolute">Absolute</option>
            </select>
          </div>

          {/* Flexbox Options */}
          {component.layout.type === 'flexbox' && (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">Direction</label>
                <select
                  value={['List', 'Tree'].includes(component.type) ? 'column' : component.layout.direction}
                  onChange={(e) => handleUpdate({ direction: e.target.value as any })}
                  disabled={['List', 'Tree'].includes(component.type)}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="row">Row (→)</option>
                  <option value="column">Column (↓)</option>
                </select>
                {['List', 'Tree'].includes(component.type) && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {component.type === 'Tree' ? 'Trees are always vertical' : 'Lists are always vertical'}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Justify</label>
                <select
                  value={component.layout.justify}
                  onChange={(e) => handleUpdate({ justify: e.target.value as any })}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
                >
                  <option value="start">Start</option>
                  <option value="center">Center</option>
                  <option value="end">End</option>
                  <option value="space-between">Space Between</option>
                  <option value="space-around">Space Around</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Align</label>
                <select
                  value={component.layout.align}
                  onChange={(e) => handleUpdate({ align: e.target.value as any })}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
                >
                  <option value="start">Start</option>
                  <option value="center">Center</option>
                  <option value="end">End</option>
                  <option value="stretch">Stretch</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Gap</label>
                <input
                  type="number"
                  value={component.layout.gap || 0}
                  onChange={(e) => handleUpdate({ gap: parseInt(e.target.value) || 0 })}
                  min={0}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="wrap"
                  checked={component.layout.wrap || false}
                  onChange={(e) => handleUpdate({ wrap: e.target.checked })}
                />
                <label htmlFor="wrap" className="text-sm">Wrap</label>
              </div>
            </>
          )}

          {/* Grid Options */}
          {component.layout.type === 'grid' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium mb-2 block">Columns</label>
                  <input
                    type="number"
                    value={component.layout.columns || 2}
                    onChange={(e) => handleUpdate({ columns: parseInt(e.target.value) || 2 })}
                    min={1}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Rows</label>
                  <input
                    type="number"
                    value={component.layout.rows || 2}
                    onChange={(e) => handleUpdate({ rows: parseInt(e.target.value) || 2 })}
                    min={1}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium mb-2 block">Column Gap</label>
                  <input
                    type="number"
                    value={component.layout.columnGap || 0}
                    onChange={(e) => handleUpdate({ columnGap: parseInt(e.target.value) || 0 })}
                    min={0}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Row Gap</label>
                  <input
                    type="number"
                    value={component.layout.rowGap || 0}
                    onChange={(e) => handleUpdate({ rowGap: parseInt(e.target.value) || 0 })}
                    min={0}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
                  />
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Padding */}
      {!isTabs && (
        <div>
          <label className="text-sm font-medium mb-2 block">Padding</label>
          <input
            type="number"
            value={typeof component.layout.padding === 'number' ? component.layout.padding : 0}
            onChange={(e) => handleUpdate({ padding: parseInt(e.target.value) || 0 })}
            min={0}
            className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
          />
        </div>
      )}

      {/* Margin */}
      <div>
        <label className="text-sm font-medium mb-2 block">Margin</label>
        <input
          type="number"
          value={typeof component.layout.margin === 'number' ? component.layout.margin : 0}
          onChange={(e) => handleUpdate({ margin: parseInt(e.target.value) || 0 })}
          min={0}
          className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
        />
      </div>
    </div>
  );
}
