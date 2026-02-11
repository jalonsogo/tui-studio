// Style property editor

import { useComponentStore } from '../../stores';
import type { ComponentNode } from '../../types';
import { ColorPicker } from './ColorPicker';

interface StyleEditorProps {
  component: ComponentNode;
}

export function StyleEditor({ component }: StyleEditorProps) {
  const componentStore = useComponentStore();

  const updateStyle = (updates: Partial<ComponentNode['style']>) => {
    componentStore.updateStyle(component.id, updates);
  };

  return (
    <div className="space-y-3">
      {/* Border */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="border"
            checked={component.style.border || false}
            onChange={(e) => updateStyle({ border: e.target.checked })}
          />
          <label htmlFor="border" className="text-xs font-medium">
            Border
          </label>
        </div>

        {component.style.border && (
          <div className="space-y-3 ml-6">
            <div>
              <label className="text-xs font-medium mb-1.5 block">Style</label>
              <select
                value={component.style.borderStyle || 'single'}
                onChange={(e) => updateStyle({ borderStyle: e.target.value as any })}
                className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs"
              >
                <option value="single">Single (─ │)</option>
                <option value="double">Double (═ ║)</option>
                <option value="rounded">Rounded (╭ ╮)</option>
                <option value="bold">Bold (━ ┃)</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <ColorPicker
              label="Border Color"
              value={component.style.borderColor}
              onChange={(color) => updateStyle({ borderColor: color })}
            />

            {/* Individual Borders */}
            <div className="space-y-2">
              <label className="text-sm font-medium block">Sides</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={component.style.borderTop !== false}
                    onChange={(e) => updateStyle({ borderTop: e.target.checked })}
                  />
                  Top
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={component.style.borderRight !== false}
                    onChange={(e) => updateStyle({ borderRight: e.target.checked })}
                  />
                  Right
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={component.style.borderBottom !== false}
                    onChange={(e) => updateStyle({ borderBottom: e.target.checked })}
                  />
                  Bottom
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={component.style.borderLeft !== false}
                    onChange={(e) => updateStyle({ borderLeft: e.target.checked })}
                  />
                  Left
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Colors */}
      <ColorPicker
        label="Text Color"
        value={component.style.color}
        onChange={(color) => updateStyle({ color })}
      />

      <ColorPicker
        label="Background Color"
        value={component.style.backgroundColor}
        onChange={(color) => updateStyle({ backgroundColor: color })}
      />

      {/* Text Style */}
      <div>
        <label className="text-sm font-medium mb-2 block">Text Style</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={component.style.bold || false}
              onChange={(e) => updateStyle({ bold: e.target.checked })}
            />
            <span className="text-xs font-bold">Bold</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={component.style.italic || false}
              onChange={(e) => updateStyle({ italic: e.target.checked })}
            />
            <span className="text-xs italic">Italic</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={component.style.underline || false}
              onChange={(e) => updateStyle({ underline: e.target.checked })}
            />
            <span className="text-xs underline">Underline</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={component.style.strikethrough || false}
              onChange={(e) => updateStyle({ strikethrough: e.target.checked })}
            />
            <span className="text-xs line-through">Strikethrough</span>
          </label>
        </div>
      </div>

      {/* Opacity */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          Opacity: {((component.style.opacity ?? 1) * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={component.style.opacity ?? 1}
          onChange={(e) => updateStyle({ opacity: parseFloat(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Shadow */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="shadow"
          checked={component.style.shadow || false}
          onChange={(e) => updateStyle({ shadow: e.target.checked })}
        />
        <label htmlFor="shadow" className="text-xs">
          Drop Shadow
        </label>
      </div>
    </div>
  );
}
