// Property panel for editing selected components

import { useSelectionStore, useComponentStore } from '../../stores';

export function PropertyPanel() {
  const selectionStore = useSelectionStore();
  const componentStore = useComponentStore();

  const selectedComponents = selectionStore.getSelectedComponents();
  const selectedComponent = selectedComponents[0];

  if (!selectedComponent) {
    return (
      <div className="p-4">
        <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase">
          Properties
        </h2>
        <div className="text-center text-sm text-muted-foreground py-8">
          Select a component to edit its properties
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-sm font-semibold mb-2 text-muted-foreground uppercase">
          Properties
        </h2>
        <div className="text-xs text-muted-foreground mb-4">
          {selectedComponent.type} • {selectedComponent.id}
        </div>
      </div>

      {/* Component Name */}
      <div>
        <label className="text-sm font-medium mb-2 block">Name</label>
        <input
          type="text"
          value={selectedComponent.name}
          onChange={(e) =>
            componentStore.updateComponent(selectedComponent.id, {
              name: e.target.value,
            })
          }
          className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
        />
      </div>

      {/* Type-specific Props */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Component Props</h3>
        <div className="space-y-3">
          {selectedComponent.type === 'Text' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Content</label>
              <input
                type="text"
                value={(selectedComponent.props.content as string) || ''}
                onChange={(e) =>
                  componentStore.updateProps(selectedComponent.id, {
                    content: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
              />
            </div>
          )}

          {selectedComponent.type === 'Button' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Label</label>
              <input
                type="text"
                value={(selectedComponent.props.label as string) || ''}
                onChange={(e) =>
                  componentStore.updateProps(selectedComponent.id, {
                    label: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
              />
            </div>
          )}

          {selectedComponent.type === 'TextInput' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Placeholder</label>
              <input
                type="text"
                value={(selectedComponent.props.placeholder as string) || ''}
                onChange={(e) =>
                  componentStore.updateProps(selectedComponent.id, {
                    placeholder: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
              />
            </div>
          )}

          {/* Width & Height */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Width</label>
              <input
                type="number"
                value={(selectedComponent.props.width as number) || 'auto'}
                onChange={(e) =>
                  componentStore.updateProps(selectedComponent.id, {
                    width: parseInt(e.target.value) || 'auto',
                  })
                }
                className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Height</label>
              <input
                type="number"
                value={(selectedComponent.props.height as number) || 'auto'}
                onChange={(e) =>
                  componentStore.updateProps(selectedComponent.id, {
                    height: parseInt(e.target.value) || 'auto',
                  })
                }
                className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Style */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Style</h3>
        <div className="space-y-3">
          {/* Border */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="border"
              checked={selectedComponent.style.border || false}
              onChange={(e) =>
                componentStore.updateStyle(selectedComponent.id, {
                  border: e.target.checked,
                })
              }
              className="rounded"
            />
            <label htmlFor="border" className="text-sm">
              Border
            </label>
          </div>

          {selectedComponent.style.border && (
            <div>
              <label className="text-sm font-medium mb-2 block">Border Style</label>
              <select
                value={selectedComponent.style.borderStyle || 'single'}
                onChange={(e) =>
                  componentStore.updateStyle(selectedComponent.id, {
                    borderStyle: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
              >
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="rounded">Rounded</option>
                <option value="bold">Bold</option>
              </select>
            </div>
          )}

          {/* Text Style */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedComponent.style.bold || false}
                onChange={(e) =>
                  componentStore.updateStyle(selectedComponent.id, {
                    bold: e.target.checked,
                  })
                }
              />
              <span className="text-sm">Bold</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedComponent.style.italic || false}
                onChange={(e) =>
                  componentStore.updateStyle(selectedComponent.id, {
                    italic: e.target.checked,
                  })
                }
              />
              <span className="text-sm">Italic</span>
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-border space-y-2">
        <button
          onClick={() => {
            const id = componentStore.duplicateComponent(selectedComponent.id);
            if (id) selectionStore.select(id);
          }}
          className="w-full px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm"
        >
          Duplicate Component
        </button>
        <button
          onClick={() => {
            componentStore.removeComponent(selectedComponent.id);
            selectionStore.clearSelection();
          }}
          className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
        >
          Delete Component
        </button>
      </div>
    </div>
  );
}
