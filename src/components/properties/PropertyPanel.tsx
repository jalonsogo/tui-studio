// Enhanced property panel with tabs

import { useState } from 'react';
import { Settings, Layout, Palette, Zap } from 'lucide-react';
import { useSelectionStore, useComponentStore } from '../../stores';
import { DimensionInput } from './DimensionInput';
import { LayoutEditor } from './LayoutEditor';
import { StyleEditor } from './StyleEditor';

type Tab = 'properties' | 'layout' | 'style' | 'events';

export function PropertyPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('properties');
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-1">
          Properties
        </h2>
        <div className="text-xs text-muted-foreground">
          {selectedComponent.type}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border text-xs">
        <button
          onClick={() => setActiveTab('properties')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 transition-colors ${
            activeTab === 'properties'
              ? 'bg-background border-b-2 border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Props
        </button>
        <button
          onClick={() => setActiveTab('layout')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 transition-colors ${
            activeTab === 'layout'
              ? 'bg-background border-b-2 border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          Layout
        </button>
        <button
          onClick={() => setActiveTab('style')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 transition-colors ${
            activeTab === 'style'
              ? 'bg-background border-b-2 border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          Style
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 transition-colors ${
            activeTab === 'events'
              ? 'bg-background border-b-2 border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Events
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'properties' && <PropertiesTab component={selectedComponent} />}
        {activeTab === 'layout' && <LayoutEditor component={selectedComponent} />}
        {activeTab === 'style' && <StyleEditor component={selectedComponent} />}
        {activeTab === 'events' && <EventsTab component={selectedComponent} />}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <button
          onClick={() => {
            const id = componentStore.duplicateComponent(selectedComponent.id);
            if (id) selectionStore.select(id);
          }}
          className="w-full px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm font-medium"
        >
          Duplicate Component
        </button>
        <button
          onClick={() => {
            componentStore.removeComponent(selectedComponent.id);
            selectionStore.clearSelection();
          }}
          className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium"
        >
          Delete Component
        </button>
      </div>
    </div>
  );
}

// Properties Tab
function PropertiesTab({ component }: { component: import('../../types').ComponentNode }) {
  const componentStore = useComponentStore();

  return (
    <div className="space-y-4">
      {/* Component Name */}
      <div>
        <label className="text-sm font-medium mb-2 block">Component Name</label>
        <input
          type="text"
          value={component.name}
          onChange={(e) =>
            componentStore.updateComponent(component.id, {
              name: e.target.value,
            })
          }
          className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
        />
      </div>

      {/* Dimensions - Special handling for Screen */}
      {component.type === 'Screen' ? (
        <ScreenSizeInput
          component={component}
          onChange={(width, height) =>
            componentStore.updateProps(component.id, { width, height })
          }
        />
      ) : (
        <>
          <DimensionInput
            label="Width"
            value={component.props.width}
            onChange={(value) =>
              componentStore.updateProps(component.id, { width: value })
            }
          />

          <DimensionInput
            label="Height"
            value={component.props.height}
            onChange={(value) =>
              componentStore.updateProps(component.id, { height: value })
            }
          />
        </>
      )}

      {/* Type-specific Props */}
      <div className="pt-4 border-t border-border">
        <h3 className="text-sm font-semibold mb-3">Component-Specific</h3>
        <div className="space-y-3">
          {component.type === 'Text' && (
            <div>
              <label className="text-sm font-medium mb-2 block">Content</label>
              <textarea
                value={(component.props.content as string) || ''}
                onChange={(e) =>
                  componentStore.updateProps(component.id, {
                    content: e.target.value,
                  })
                }
                rows={3}
                className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm resize-none"
              />
            </div>
          )}

          {component.type === 'Button' && (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">Label</label>
                <input
                  type="text"
                  value={(component.props.label as string) || ''}
                  onChange={(e) =>
                    componentStore.updateProps(component.id, {
                      label: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
                />
              </div>

              <div className="space-y-3">
                {/* Left Icon */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="iconLeftEnabled"
                      checked={(component.props.iconLeftEnabled as boolean) || false}
                      onChange={(e) =>
                        componentStore.updateProps(component.id, {
                          iconLeftEnabled: e.target.checked,
                        })
                      }
                    />
                    <label htmlFor="iconLeftEnabled" className="text-sm font-medium">
                      Icon Left
                    </label>
                  </div>
                  <input
                    type="text"
                    value={(component.props.iconLeft as string) || ''}
                    onChange={(e) =>
                      componentStore.updateProps(component.id, {
                        iconLeft: e.target.value,
                        iconLeftEnabled: true, // Auto-enable when typing
                      })
                    }
                    placeholder="+ or ^A or 🔥"
                    disabled={!(component.props.iconLeftEnabled as boolean)}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    {['+', '-', '×', '✓', '⑃', '^A', '^C', '⌘', '🔥', '⭐', '✨', '🚀'].map(icon => (
                      <button
                        key={icon}
                        onClick={() => componentStore.updateProps(component.id, { iconLeft: icon, iconLeftEnabled: true })}
                        className="px-2 py-0.5 text-xs bg-accent hover:bg-accent/80 rounded font-mono"
                        title={`Use ${icon}`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Icon */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="iconRightEnabled"
                      checked={(component.props.iconRightEnabled as boolean) || false}
                      onChange={(e) =>
                        componentStore.updateProps(component.id, {
                          iconRightEnabled: e.target.checked,
                        })
                      }
                    />
                    <label htmlFor="iconRightEnabled" className="text-sm font-medium">
                      Icon Right
                    </label>
                  </div>
                  <input
                    type="text"
                    value={(component.props.iconRight as string) || ''}
                    onChange={(e) =>
                      componentStore.updateProps(component.id, {
                        iconRight: e.target.value,
                        iconRightEnabled: true, // Auto-enable when typing
                      })
                    }
                    placeholder="▾ or ✓"
                    disabled={!(component.props.iconRightEnabled as boolean)}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    {['▾', '▴', '→', '←', '↓', '↑', '⏎', '✓', '✗', '⚡', '💡'].map(icon => (
                      <button
                        key={icon}
                        onClick={() => componentStore.updateProps(component.id, { iconRight: icon, iconRightEnabled: true })}
                        className="px-2 py-0.5 text-xs bg-accent hover:bg-accent/80 rounded font-mono"
                        title={`Use ${icon}`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Number (with icon)</label>
                <input
                  type="number"
                  value={(component.props.number as number) || ''}
                  onChange={(e) =>
                    componentStore.updateProps(component.id, {
                      number: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="Optional"
                  className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="separated"
                  checked={(component.props.separated as boolean) || false}
                  onChange={(e) =>
                    componentStore.updateProps(component.id, {
                      separated: e.target.checked,
                    })
                  }
                />
                <label htmlFor="separated" className="text-sm">
                  Separated Layout (with divider)
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="disabled"
                  checked={(component.props.disabled as boolean) || false}
                  onChange={(e) =>
                    componentStore.updateProps(component.id, {
                      disabled: e.target.checked,
                    })
                  }
                />
                <label htmlFor="disabled" className="text-sm">
                  Disabled
                </label>
              </div>
            </>
          )}

          {component.type === 'TextInput' && (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">Placeholder</label>
                <input
                  type="text"
                  value={(component.props.placeholder as string) || ''}
                  onChange={(e) =>
                    componentStore.updateProps(component.id, {
                      placeholder: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Default Value</label>
                <input
                  type="text"
                  value={(component.props.value as string) || ''}
                  onChange={(e) =>
                    componentStore.updateProps(component.id, {
                      value: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
                />
              </div>
            </>
          )}

          {(component.type === 'List' || component.type === 'Select' || component.type === 'Menu') && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Items (one per line)
              </label>
              <textarea
                value={
                  Array.isArray(component.props.items)
                    ? (component.props.items as string[]).join('\n')
                    : ''
                }
                onChange={(e) =>
                  componentStore.updateProps(component.id, {
                    items: e.target.value.split('\n').filter((s) => s.trim()),
                  })
                }
                rows={5}
                placeholder="Item 1&#10;Item 2&#10;Item 3"
                className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm font-mono resize-none"
              />
            </div>
          )}

          {component.type === 'ProgressBar' && (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">Value</label>
                <input
                  type="number"
                  value={(component.props.value as number) || 0}
                  onChange={(e) =>
                    componentStore.updateProps(component.id, {
                      value: parseInt(e.target.value) || 0,
                    })
                  }
                  min={0}
                  max={(component.props.max as number) || 100}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Max</label>
                <input
                  type="number"
                  value={(component.props.max as number) || 100}
                  onChange={(e) =>
                    componentStore.updateProps(component.id, {
                      max: parseInt(e.target.value) || 100,
                    })
                  }
                  min={1}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Screen Size Input with presets
function ScreenSizeInput({
  component,
  onChange,
}: {
  component: import('../../types').ComponentNode;
  onChange: (width: number | 'fill', height: number | 'fill') => void;
}) {
  const [preset, setPreset] = useState<'default' | 'fullscreen' | 'custom'>('default');

  const currentWidth = component.props.width as number | 'fill';
  const currentHeight = component.props.height as number | 'fill';

  const handlePresetChange = (newPreset: 'default' | 'fullscreen' | 'custom') => {
    setPreset(newPreset);

    if (newPreset === 'default') {
      onChange(80, 25);
    } else if (newPreset === 'fullscreen') {
      onChange('fill', 'fill');
    }
    // For 'custom', keep current values
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium mb-2 block">Screen Size</label>
        <select
          value={preset}
          onChange={(e) => handlePresetChange(e.target.value as any)}
          className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
        >
          <option value="default">Default (80×25)</option>
          <option value="fullscreen">Full Screen (Fill)</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {preset === 'custom' && (
        <div className="space-y-3 pl-4 border-l-2 border-border">
          <div>
            <label className="text-sm font-medium mb-2 block">Columns (Width)</label>
            <input
              type="number"
              value={typeof currentWidth === 'number' ? currentWidth : 80}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 80;
                onChange(val, currentHeight);
              }}
              min={20}
              max={300}
              className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Rows (Height)</label>
            <input
              type="number"
              value={typeof currentHeight === 'number' ? currentHeight : 25}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 25;
                onChange(currentWidth, val);
              }}
              min={10}
              max={100}
              className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Events Tab
function EventsTab({ component }: { component: import('../../types').ComponentNode }) {
  const componentStore = useComponentStore();

  const eventTypes = [
    { key: 'onClick', label: 'On Click' },
    { key: 'onChange', label: 'On Change' },
    { key: 'onFocus', label: 'On Focus' },
    { key: 'onBlur', label: 'On Blur' },
    { key: 'onSubmit', label: 'On Submit' },
    { key: 'onKeyPress', label: 'On Key Press' },
  ];

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        Define event handler function names. These will be included in the exported code.
      </div>

      {eventTypes.map((event) => (
        <div key={event.key}>
          <label className="text-sm font-medium mb-2 block">{event.label}</label>
          <input
            type="text"
            value={(component.events[event.key] as string) || ''}
            onChange={(e) =>
              componentStore.updateEvents(component.id, {
                [event.key]: e.target.value,
              })
            }
            placeholder={`handle${event.label.replace('On ', '')}`}
            className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm font-mono"
          />
        </div>
      ))}
    </div>
  );
}
