// Compact Figma-style property panel with collapsible sections

import { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, Trash2, Copy } from 'lucide-react';
import { useSelectionStore, useComponentStore } from '../../stores';
import { DimensionInput } from './DimensionInput';
import { LayoutEditor } from './LayoutEditor';
import { StyleEditor } from './StyleEditor';
import { THEME_NAMES } from '../../stores/themeStore';

// Collapsible Section Component
function Section({
  title,
  defaultOpen = true,
  children,
  action
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border/30">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-1">
          {isOpen ? (
            <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-2.5 h-2.5 text-muted-foreground" />
          )}
          <span className="text-[11px] font-semibold">{title}</span>
        </div>
        {action}
      </button>
      {isOpen && <div className="px-3 py-2 space-y-2">{children}</div>}
    </div>
  );
}

export function PropertyPanel() {
  const selectionStore = useSelectionStore();
  const componentStore = useComponentStore();
  const [activeTab, setActiveTab] = useState<'visual' | 'content'>('visual');

  const selectedComponents = selectionStore.getSelectedComponents();
  const selectedComponent = selectedComponents[0];

  if (!selectedComponent) {
    return (
      <div className="p-3">
        <div className="text-center text-xs text-muted-foreground py-8">
          Select a component
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border/30 flex items-center justify-between">
        <div className="text-[11px] font-semibold truncate">{selectedComponent.name}</div>
        <div className="flex gap-0.5">
          <button
            onClick={() => {
              const id = componentStore.duplicateComponent(selectedComponent.id);
              if (id) selectionStore.select(id);
            }}
            className="p-1 hover:bg-accent rounded transition-colors"
            title="Duplicate"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              componentStore.removeComponent(selectedComponent.id);
              selectionStore.clearSelection();
            }}
            className="p-1 hover:bg-destructive/10 text-destructive rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/30">
        <button
          onClick={() => setActiveTab('visual')}
          className={`flex-1 px-3 py-1.5 text-[11px] font-medium transition-colors ${
            activeTab === 'visual'
              ? 'text-foreground border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Visual
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`flex-1 px-3 py-1.5 text-[11px] font-medium transition-colors ${
            activeTab === 'content'
              ? 'text-foreground border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Content
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'visual' ? (
          <VisualProperties component={selectedComponent} />
        ) : (
          <ContentProperties component={selectedComponent} />
        )}
      </div>
    </div>
  );
}

// Visual properties tab (dimensions, layout, appearance)
function VisualProperties({ component }: { component: import('../../types').ComponentNode }) {
  const componentStore = useComponentStore();

  return (
    <>
      {/* Dimensions Section */}
      <Section title="Dimensions" defaultOpen={true}>
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <label className="text-[9px] text-muted-foreground block mb-0.5 uppercase tracking-wide">W</label>
            <input
              type="text"
              value={component.props.width || 'auto'}
              onChange={(e) =>
                componentStore.updateProps(component.id, {
                  width: e.target.value === 'auto' ? 'auto' : Number(e.target.value) || 'auto'
                })
              }
              className="w-full px-1.5 py-0.5 bg-input border border-border/50 rounded text-[11px] focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[9px] text-muted-foreground block mb-0.5 uppercase tracking-wide">H</label>
            <input
              type="text"
              value={component.props.height || 'auto'}
              onChange={(e) =>
                componentStore.updateProps(component.id, {
                  height: e.target.value === 'auto' ? 'auto' : Number(e.target.value) || 'auto'
                })
              }
              className="w-full px-1.5 py-0.5 bg-input border border-border/50 rounded text-[11px] focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </Section>

      {/* Layout Section */}
      <Section title="Layout" defaultOpen={true}>
        <LayoutEditor component={component} />
      </Section>

      {/* Appearance Section */}
      <Section title="Appearance" defaultOpen={true}>
        <StyleEditor component={component} />
      </Section>
    </>
  );
}

// Content properties tab (component-specific content)
function ContentProperties({ component }: { component: import('../../types').ComponentNode }) {
  if (!component) {
    return <div className="p-3 text-muted-foreground">No component selected</div>;
  }

  return (
    <div className="p-3">
      <ComponentProps component={component} />
    </div>
  );
}

// Component-specific properties in compact format
function ComponentProps({ component }: { component: import('../../types').ComponentNode }) {
  const componentStore = useComponentStore();

  console.log('ComponentProps rendering for:', component.type);

  return (
    <div className="space-y-3">
      {/* Text Content */}
      {component.type === 'Text' && (
        <div>
          <label className="text-[9px] text-muted-foreground block mb-0.5 uppercase tracking-wide">Content</label>
          <textarea
            value={(component.props.content as string) || ''}
            onChange={(e) =>
              componentStore.updateProps(component.id, { content: e.target.value })
            }
            rows={3}
            className="w-full px-1.5 py-0.5 bg-input border border-border/50 rounded text-[11px] font-mono resize-none focus:border-primary focus:outline-none"
          />
        </div>
      )}

      {/* Button Properties */}
      {component.type === 'Button' && (
        <>
          <div>
            <label className="text-[9px] text-muted-foreground block mb-0.5 uppercase tracking-wide">Label</label>
            <input
              type="text"
              value={(component.props.label as string) || ''}
              onChange={(e) =>
                componentStore.updateProps(component.id, { label: e.target.value })
              }
              className="w-full px-1.5 py-0.5 bg-input border border-border/50 rounded text-[11px] focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="checkbox"
              id="iconLeftEnabled"
              checked={component.props.iconLeftEnabled as boolean || false}
              onChange={(e) =>
                componentStore.updateProps(component.id, { iconLeftEnabled: e.target.checked })
              }
              className="w-3 h-3"
            />
            <label htmlFor="iconLeftEnabled" className="text-[9px] text-muted-foreground uppercase tracking-wide">Left Icon</label>
            <input
              type="text"
              value={(component.props.iconLeft as string) || ''}
              onChange={(e) =>
                componentStore.updateProps(component.id, { iconLeft: e.target.value })
              }
              disabled={!component.props.iconLeftEnabled}
              className="flex-1 px-1.5 py-0.5 bg-input border border-border/50 rounded text-[11px] focus:border-primary focus:outline-none disabled:opacity-50"
              placeholder="+"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="checkbox"
              id="iconRightEnabled"
              checked={component.props.iconRightEnabled as boolean || false}
              onChange={(e) =>
                componentStore.updateProps(component.id, { iconRightEnabled: e.target.checked })
              }
              className="w-3 h-3"
            />
            <label htmlFor="iconRightEnabled" className="text-[9px] text-muted-foreground uppercase tracking-wide">Right Icon</label>
            <input
              type="text"
              value={(component.props.iconRight as string) || ''}
              onChange={(e) =>
                componentStore.updateProps(component.id, { iconRight: e.target.value })
              }
              disabled={!component.props.iconRightEnabled}
              className="flex-1 px-1.5 py-0.5 bg-input border border-border/50 rounded text-[11px] focus:border-primary focus:outline-none disabled:opacity-50"
              placeholder="→"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="checkbox"
              id="separated"
              checked={component.props.separated as boolean || false}
              onChange={(e) =>
                componentStore.updateProps(component.id, { separated: e.target.checked })
              }
              className="w-3 h-3"
            />
            <label htmlFor="separated" className="text-[9px] text-muted-foreground uppercase tracking-wide flex-1">Separated (│)</label>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="checkbox"
              id="disabled"
              checked={component.props.disabled as boolean || false}
              onChange={(e) =>
                componentStore.updateProps(component.id, { disabled: e.target.checked })
              }
              className="w-3 h-3"
            />
            <label htmlFor="disabled" className="text-[9px] text-muted-foreground uppercase tracking-wide flex-1">Disabled</label>
          </div>
        </>
      )}

      {/* TextInput Placeholder */}
      {component.type === 'TextInput' && (
        <div>
          <label className="text-[9px] text-muted-foreground block mb-0.5 uppercase tracking-wide">Placeholder</label>
          <input
            type="text"
            value={(component.props.placeholder as string) || ''}
            onChange={(e) =>
              componentStore.updateProps(component.id, { placeholder: e.target.value })
            }
            className="w-full px-1.5 py-0.5 bg-input border border-border/50 rounded text-[11px] focus:border-primary focus:outline-none"
          />
        </div>
      )}

      {/* Theme for Screen */}
      {component.type === 'Screen' && (
        <div>
          <label className="text-[9px] text-muted-foreground block mb-0.5 uppercase tracking-wide">Theme</label>
          <select
            value={(component.props.theme as string) || 'dracula'}
            onChange={(e) =>
              componentStore.updateProps(component.id, { theme: e.target.value })
            }
            className="w-full px-1.5 py-0.5 bg-input border border-border/50 rounded text-[11px] focus:border-primary focus:outline-none"
          >
            {THEME_NAMES.map((theme) => (
              <option key={theme.value} value={theme.value}>
                {theme.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Checkbox Properties */}
      {component.type === 'Checkbox' && (
        <>
          <div>
            <label className="text-[9px] text-muted-foreground block mb-0.5 uppercase tracking-wide">Label</label>
            <input
              type="text"
              value={(component.props.label as string) || ''}
              onChange={(e) =>
                componentStore.updateProps(component.id, { label: e.target.value })
              }
              className="w-full px-1.5 py-0.5 bg-input border border-border/50 rounded text-[11px] focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="checkbox"
              id="checked"
              checked={component.props.checked as boolean || false}
              onChange={(e) =>
                componentStore.updateProps(component.id, { checked: e.target.checked })
              }
              className="w-3 h-3"
            />
            <label htmlFor="checked" className="text-[9px] text-muted-foreground uppercase tracking-wide flex-1">Checked</label>
          </div>
        </>
      )}

      {/* Radio Properties */}
      {component.type === 'Radio' && (
        <>
          <div>
            <label className="text-[9px] text-muted-foreground block mb-0.5 uppercase tracking-wide">Label</label>
            <input
              type="text"
              value={(component.props.label as string) || ''}
              onChange={(e) =>
                componentStore.updateProps(component.id, { label: e.target.value })
              }
              className="w-full px-1.5 py-0.5 bg-input border border-border/50 rounded text-[11px] focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="checkbox"
              id="checked"
              checked={component.props.checked as boolean || false}
              onChange={(e) =>
                componentStore.updateProps(component.id, { checked: e.target.checked })
              }
              className="w-3 h-3"
            />
            <label htmlFor="checked" className="text-[9px] text-muted-foreground uppercase tracking-wide flex-1">Selected</label>
          </div>
        </>
      )}

      {/* ProgressBar Properties */}
      {component.type === 'ProgressBar' && (
        <>
          <div>
            <label className="text-[9px] text-muted-foreground block mb-0.5 uppercase tracking-wide">Value</label>
            <input
              type="number"
              value={(component.props.value as number) || 0}
              onChange={(e) =>
                componentStore.updateProps(component.id, { value: Number(e.target.value) })
              }
              className="w-full px-1.5 py-0.5 bg-input border border-border/50 rounded text-[11px] focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[9px] text-muted-foreground block mb-0.5 uppercase tracking-wide">Max</label>
            <input
              type="number"
              value={(component.props.max as number) || 100}
              onChange={(e) =>
                componentStore.updateProps(component.id, { max: Number(e.target.value) })
              }
              className="w-full px-1.5 py-0.5 bg-input border border-border/50 rounded text-[11px] focus:border-primary focus:outline-none"
            />
          </div>
        </>
      )}

      {/* Select Properties */}
      {component.type === 'Select' && (
        <>
          <div>
            <label className="text-[9px] text-muted-foreground block mb-0.5 uppercase tracking-wide">Value</label>
            <input
              type="text"
              value={(component.props.value as string) || ''}
              onChange={(e) =>
                componentStore.updateProps(component.id, { value: e.target.value })
              }
              className="w-full px-1.5 py-0.5 bg-input border border-border/50 rounded text-[11px] focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[9px] text-muted-foreground block mb-0.5 uppercase tracking-wide">Options (one per line)</label>
            <textarea
              value={
                Array.isArray(component.props.options)
                  ? (component.props.options as string[]).join('\n')
                  : ''
              }
              onChange={(e) =>
                componentStore.updateProps(component.id, {
                  options: e.target.value.split('\n').filter((s) => s.trim()),
                })
              }
              rows={5}
              placeholder="Option 1&#10;Option 2&#10;Option 3"
              className="w-full px-2 py-1 bg-input border border-border/50 rounded text-[11px] font-mono resize-none focus:border-primary focus:outline-none"
            />
          </div>
        </>
      )}

      {/* Tabs Properties */}
      {component.type === 'Tabs' && (
        <div className="space-y-3">
          <label className="text-xs font-medium mb-1.5 block">Tabs</label>
          {Array.isArray(component.props.tabs) &&
            (component.props.tabs as any[]).map((tab, index) => {
              const tabData = typeof tab === 'string' ? { label: tab, icon: '', status: false, hotkey: '' } : tab;

              return (
                <div key={index} className="p-2 bg-accent/50 rounded space-y-2">
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={tabData.label || ''}
                      onChange={(e) => {
                        const newTabs = [...(component.props.tabs as any[])];
                        newTabs[index] = { ...tabData, label: e.target.value };
                        componentStore.updateProps(component.id, { tabs: newTabs });
                      }}
                      className="flex-1 px-2 py-1 bg-secondary border border-border rounded text-xs"
                      placeholder="Label"
                    />
                    <button
                      onClick={() => {
                        const newTabs = (component.props.tabs as any[]).filter((_, i) => i !== index);
                        const activeTab = component.props.activeTab as number;
                        const newActiveTab = activeTab >= newTabs.length ? Math.max(0, newTabs.length - 1) : activeTab;
                        componentStore.updateProps(component.id, {
                          tabs: newTabs,
                          activeTab: newActiveTab,
                        });
                      }}
                      className="px-2 py-1 bg-secondary hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors"
                      title="Remove tab"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">Icon</label>
                      <input
                        type="text"
                        value={tabData.icon || ''}
                        onChange={(e) => {
                          const newTabs = [...(component.props.tabs as any[])];
                          newTabs[index] = { ...tabData, icon: e.target.value };
                          componentStore.updateProps(component.id, { tabs: newTabs });
                        }}
                        maxLength={3}
                        className="w-full px-1.5 py-0.5 bg-secondary border border-border rounded text-xs text-center"
                        placeholder="⌂"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">Status</label>
                      <div className="flex items-center justify-center h-6">
                        <input
                          type="checkbox"
                          checked={tabData.status || false}
                          onChange={(e) => {
                            const newTabs = [...(component.props.tabs as any[])];
                            newTabs[index] = { ...tabData, status: e.target.checked };
                            componentStore.updateProps(component.id, { tabs: newTabs });
                          }}
                          className="w-3.5 h-3.5"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">Hotkey</label>
                      <input
                        type="text"
                        value={tabData.hotkey || ''}
                        onChange={(e) => {
                          const newTabs = [...(component.props.tabs as any[])];
                          newTabs[index] = { ...tabData, hotkey: e.target.value };
                          componentStore.updateProps(component.id, { tabs: newTabs });
                        }}
                        className="w-full px-1.5 py-0.5 bg-secondary border border-border rounded text-xs text-center font-mono"
                        placeholder="^1"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          <button
            onClick={() => {
              const currentTabs = (component.props.tabs as any[]) || [];
              const newTabs = [...currentTabs, { label: `Tab ${currentTabs.length + 1}`, icon: '', status: false, hotkey: '' }];
              componentStore.updateProps(component.id, { tabs: newTabs });
            }}
            className="w-full px-2 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-xs"
          >
            + Add Tab
          </button>
          <div>
            <label className="text-xs font-medium mb-1.5 block">Active Tab</label>
            <select
              value={(component.props.activeTab as number) || 0}
              onChange={(e) =>
                componentStore.updateProps(component.id, {
                  activeTab: parseInt(e.target.value),
                })
              }
              className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs"
            >
              {Array.isArray(component.props.tabs) &&
                (component.props.tabs as any[]).map((tab, index) => {
                  const label = typeof tab === 'string' ? tab : tab.label || `Tab ${index + 1}`;
                  return (
                    <option key={index} value={index}>
                      {label}
                    </option>
                  );
                })}
            </select>
          </div>
        </div>
      )}

      {/* Tree Properties */}
      {component.type === 'Tree' && (
        <div className="space-y-3">
          <TreeItemsEditor
            items={(component.props.items as any[]) || []}
            onChange={(newItems) => {
              componentStore.updateProps(component.id, { items: newItems });
            }}
            level={0}
          />
          <button
            onClick={() => {
              const currentItems = (component.props.items as any[]) || [];
              componentStore.updateProps(component.id, {
                items: [...currentItems, { label: 'Item', children: [] }],
              });
            }}
            className="w-full px-2 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-xs"
          >
            + Add Item
          </button>
        </div>
      )}
    </div>
  );
}

// Properties Tab
function PropertiesTab({ component }: { component: import('../../types').ComponentNode }) {
  const componentStore = useComponentStore();

  return (
    <div className="space-y-3">
      {/* Component Name */}
      <div>
        <label className="text-xs font-medium mb-1.5 block">Component Name</label>
        <input
          type="text"
          value={component.name}
          onChange={(e) =>
            componentStore.updateComponent(component.id, {
              name: e.target.value,
            })
          }
          className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs"
        />
      </div>

      {/* Theme Selector - Only for Screen */}
      {component.type === 'Screen' && (
        <div>
          <label className="text-xs font-medium mb-1.5 block">Color Theme</label>
          <select
            value={(component.props.theme as string) || 'dracula'}
            onChange={(e) =>
              componentStore.updateProps(component.id, { theme: e.target.value })
            }
            className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs"
          >
            {THEME_NAMES.map((theme) => (
              <option key={theme.value} value={theme.value}>
                {theme.label}
              </option>
            ))}
          </select>
          <div className="text-[10px] text-muted-foreground mt-1">
            Affects all ANSI colors within this screen
          </div>
        </div>
      )}

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
        <h3 className="text-xs font-semibold mb-2">Component-Specific</h3>
        <div className="space-y-3">
          {component.type === 'Text' && (
            <div>
              <label className="text-xs font-medium mb-1.5 block">Content</label>
              <textarea
                value={(component.props.content as string) || ''}
                onChange={(e) =>
                  componentStore.updateProps(component.id, {
                    content: e.target.value,
                  })
                }
                rows={3}
                className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs resize-none"
              />
            </div>
          )}

          {component.type === 'Button' && (
            <>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Label</label>
                <input
                  type="text"
                  value={(component.props.label as string) || ''}
                  onChange={(e) =>
                    componentStore.updateProps(component.id, {
                      label: e.target.value,
                    })
                  }
                  className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs"
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
                    <label htmlFor="iconLeftEnabled" className="text-xs font-medium">
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
                    className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    {['+', '-', '×', '✓', '⑃', '^A', '^C', '⌘', '🔥', '⭐', '✨', '🚀'].map(icon => (
                      <button
                        key={icon}
                        onClick={() => componentStore.updateProps(component.id, { iconLeft: icon, iconLeftEnabled: true })}
                        className="px-1.5 py-0.5 text-[10px] bg-accent hover:bg-accent/80 rounded font-mono"
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
                    <label htmlFor="iconRightEnabled" className="text-xs font-medium">
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
                    className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="mt-1 flex flex-wrap gap-1">
                    {['▾', '▴', '→', '←', '↓', '↑', '⏎', '✓', '✗', '⚡', '💡'].map(icon => (
                      <button
                        key={icon}
                        onClick={() => componentStore.updateProps(component.id, { iconRight: icon, iconRightEnabled: true })}
                        className="px-1.5 py-0.5 text-[10px] bg-accent hover:bg-accent/80 rounded font-mono"
                        title={`Use ${icon}`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Number (with icon)</label>
                <input
                  type="number"
                  value={(component.props.number as number) || ''}
                  onChange={(e) =>
                    componentStore.updateProps(component.id, {
                      number: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="Optional"
                  className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs"
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
                <label htmlFor="separated" className="text-xs">
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
                <label htmlFor="disabled" className="text-xs">
                  Disabled
                </label>
              </div>
            </>
          )}

          {component.type === 'TextInput' && (
            <>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Placeholder</label>
                <input
                  type="text"
                  value={(component.props.placeholder as string) || ''}
                  onChange={(e) =>
                    componentStore.updateProps(component.id, {
                      placeholder: e.target.value,
                    })
                  }
                  className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Default Value</label>
                <input
                  type="text"
                  value={(component.props.value as string) || ''}
                  onChange={(e) =>
                    componentStore.updateProps(component.id, {
                      value: e.target.value,
                    })
                  }
                  className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs"
                />
              </div>
            </>
          )}

          {component.type === 'Checkbox' && (
            <>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Label</label>
                <input
                  type="text"
                  value={(component.props.label as string) || ''}
                  onChange={(e) =>
                    componentStore.updateProps(component.id, { label: e.target.value })
                  }
                  className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">State</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="checkbox-checked"
                    checked={(component.props.checked as boolean) || false}
                    onChange={(e) =>
                      componentStore.updateProps(component.id, { checked: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <label htmlFor="checkbox-checked" className="text-xs">Checked</label>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Checked Icon</label>
                <select
                  value={(component.props.checkedIcon as string) || '✓'}
                  onChange={(e) =>
                    componentStore.updateProps(component.id, { checkedIcon: e.target.value })
                  }
                  className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs text-center font-mono"
                >
                  <option value="✓">✓ Check</option>
                  <option value="✗">✗ X</option>
                  <option value="×">× Times</option>
                  <option value="●">● Filled</option>
                  <option value="■">■ Square</option>
                  <option value="★">★ Star</option>
                  <option value="+">+ Plus</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Unchecked Icon</label>
                <select
                  value={(component.props.uncheckedIcon as string) || ' '}
                  onChange={(e) =>
                    componentStore.updateProps(component.id, { uncheckedIcon: e.target.value })
                  }
                  className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs text-center font-mono"
                >
                  <option value=" ">  Empty</option>
                  <option value="○">○ Circle</option>
                  <option value="□">□ Square</option>
                  <option value="-">- Dash</option>
                  <option value="·">· Dot</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Checked Color</label>
                <select
                  value={(component.style.checkedColor as string) || 'green'}
                  onChange={(e) =>
                    componentStore.updateStyle(component.id, { checkedColor: e.target.value })
                  }
                  className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs"
                >
                  <option value="black">Black</option>
                  <option value="red">Red</option>
                  <option value="green">Green</option>
                  <option value="yellow">Yellow</option>
                  <option value="blue">Blue</option>
                  <option value="magenta">Magenta</option>
                  <option value="cyan">Cyan</option>
                  <option value="white">White</option>
                  <option value="brightRed">Bright Red</option>
                  <option value="brightGreen">Bright Green</option>
                  <option value="brightYellow">Bright Yellow</option>
                  <option value="brightBlue">Bright Blue</option>
                  <option value="brightMagenta">Bright Magenta</option>
                  <option value="brightCyan">Bright Cyan</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Unchecked Color</label>
                <select
                  value={(component.style.uncheckedColor as string) || 'white'}
                  onChange={(e) =>
                    componentStore.updateStyle(component.id, { uncheckedColor: e.target.value })
                  }
                  className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs"
                >
                  <option value="black">Black</option>
                  <option value="red">Red</option>
                  <option value="green">Green</option>
                  <option value="yellow">Yellow</option>
                  <option value="blue">Blue</option>
                  <option value="magenta">Magenta</option>
                  <option value="cyan">Cyan</option>
                  <option value="white">White</option>
                  <option value="brightRed">Bright Red</option>
                  <option value="brightGreen">Bright Green</option>
                  <option value="brightYellow">Bright Yellow</option>
                  <option value="brightBlue">Bright Blue</option>
                  <option value="brightMagenta">Bright Magenta</option>
                  <option value="brightCyan">Bright Cyan</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Label Color</label>
                <select
                  value={(component.style.labelColor as string) || 'white'}
                  onChange={(e) =>
                    componentStore.updateStyle(component.id, { labelColor: e.target.value })
                  }
                  className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs"
                >
                  <option value="black">Black</option>
                  <option value="red">Red</option>
                  <option value="green">Green</option>
                  <option value="yellow">Yellow</option>
                  <option value="blue">Blue</option>
                  <option value="magenta">Magenta</option>
                  <option value="cyan">Cyan</option>
                  <option value="white">White</option>
                  <option value="brightRed">Bright Red</option>
                  <option value="brightGreen">Bright Green</option>
                  <option value="brightYellow">Bright Yellow</option>
                  <option value="brightBlue">Bright Blue</option>
                  <option value="brightMagenta">Bright Magenta</option>
                  <option value="brightCyan">Bright Cyan</option>
                </select>
              </div>
            </>
          )}

          {component.type === 'Radio' && (
            <>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Label</label>
                <input
                  type="text"
                  value={(component.props.label as string) || ''}
                  onChange={(e) =>
                    componentStore.updateProps(component.id, { label: e.target.value })
                  }
                  className="w-full px-1.5 py-0.5 bg-secondary border border-border rounded text-xs"
                  placeholder="Option"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <input
                    id="radio-checked"
                    type="checkbox"
                    checked={component.props.checked as boolean}
                    onChange={(e) =>
                      componentStore.updateProps(component.id, { checked: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <label htmlFor="radio-checked" className="text-xs">Selected</label>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Selected Icon</label>
                <select
                  value={(component.props.selectedIcon as string) || '●'}
                  onChange={(e) =>
                    componentStore.updateProps(component.id, { selectedIcon: e.target.value })
                  }
                  className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs text-center font-mono"
                >
                  <option value="●">● Filled</option>
                  <option value="◉">◉ Dotted</option>
                  <option value="⦿">⦿ Bullseye</option>
                  <option value="◆">◆ Diamond</option>
                  <option value="■">■ Square</option>
                  <option value="▪">▪ Small Square</option>
                  <option value="✓">✓ Check</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Unselected Icon</label>
                <select
                  value={(component.props.unselectedIcon as string) || '○'}
                  onChange={(e) =>
                    componentStore.updateProps(component.id, { unselectedIcon: e.target.value })
                  }
                  className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs text-center font-mono"
                >
                  <option value="○">○ Circle</option>
                  <option value="◯">◯ White Circle</option>
                  <option value="◇">◇ Diamond</option>
                  <option value="□">□ Square</option>
                  <option value="▫">▫ Small Square</option>
                  <option value=" ">  Empty</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Selected Color</label>
                <select
                  value={(component.style.selectedColor as string) || 'blue'}
                  onChange={(e) =>
                    componentStore.updateStyle(component.id, { selectedColor: e.target.value })
                  }
                  className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs"
                >
                  <option value="black">Black</option>
                  <option value="red">Red</option>
                  <option value="green">Green</option>
                  <option value="yellow">Yellow</option>
                  <option value="blue">Blue</option>
                  <option value="magenta">Magenta</option>
                  <option value="cyan">Cyan</option>
                  <option value="white">White</option>
                  <option value="brightRed">Bright Red</option>
                  <option value="brightGreen">Bright Green</option>
                  <option value="brightYellow">Bright Yellow</option>
                  <option value="brightBlue">Bright Blue</option>
                  <option value="brightMagenta">Bright Magenta</option>
                  <option value="brightCyan">Bright Cyan</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Unselected Color</label>
                <select
                  value={(component.style.unselectedColor as string) || 'white'}
                  onChange={(e) =>
                    componentStore.updateStyle(component.id, { unselectedColor: e.target.value })
                  }
                  className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs"
                >
                  <option value="black">Black</option>
                  <option value="red">Red</option>
                  <option value="green">Green</option>
                  <option value="yellow">Yellow</option>
                  <option value="blue">Blue</option>
                  <option value="magenta">Magenta</option>
                  <option value="cyan">Cyan</option>
                  <option value="white">White</option>
                  <option value="brightRed">Bright Red</option>
                  <option value="brightGreen">Bright Green</option>
                  <option value="brightYellow">Bright Yellow</option>
                  <option value="brightBlue">Bright Blue</option>
                  <option value="brightMagenta">Bright Magenta</option>
                  <option value="brightCyan">Bright Cyan</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Label Color</label>
                <select
                  value={(component.style.labelColor as string) || 'white'}
                  onChange={(e) =>
                    componentStore.updateStyle(component.id, { labelColor: e.target.value })
                  }
                  className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs"
                >
                  <option value="black">Black</option>
                  <option value="red">Red</option>
                  <option value="green">Green</option>
                  <option value="yellow">Yellow</option>
                  <option value="blue">Blue</option>
                  <option value="magenta">Magenta</option>
                  <option value="cyan">Cyan</option>
                  <option value="white">White</option>
                  <option value="brightRed">Bright Red</option>
                  <option value="brightGreen">Bright Green</option>
                  <option value="brightYellow">Bright Yellow</option>
                  <option value="brightBlue">Bright Blue</option>
                  <option value="brightMagenta">Bright Magenta</option>
                  <option value="brightCyan">Bright Cyan</option>
                </select>
              </div>
            </>
          )}

          {component.type === 'Select' && (
            <div>
              <label className="text-xs font-medium mb-1.5 block">
                Options (one per line)
              </label>
              <textarea
                value={
                  Array.isArray(component.props.options)
                    ? (component.props.options as string[]).join('\n')
                    : ''
                }
                onChange={(e) =>
                  componentStore.updateProps(component.id, {
                    options: e.target.value.split('\n').filter((s) => s.trim()),
                  })
                }
                rows={5}
                placeholder="Option 1&#10;Option 2&#10;Option 3"
                className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs font-mono resize-none"
              />
            </div>
          )}

          {component.type === 'Menu' && (
            <div className="space-y-3">
              <label className="text-xs font-medium mb-1.5 block">Menu Items</label>
              {Array.isArray(component.props.items) &&
                (component.props.items as any[]).map((item, index) => {
                  const itemData = typeof item === 'string' ? { label: item, icon: '', hotkey: '' } : item;

                  const iconOptions = [
                    { value: '', label: 'None', display: '—' },
                    { value: '⌂', label: 'Home', display: '⌂' },
                    { value: '•', label: 'Bullet', display: '•' },
                    { value: '○', label: 'Circle', display: '○' },
                    { value: '●', label: 'Filled', display: '●' },
                    { value: '☐', label: 'Unchecked', display: '☐' },
                    { value: '☑', label: 'Checked', display: '☑' },
                    { value: '✓', label: 'Check', display: '✓' },
                    { value: '✗', label: 'X Mark', display: '✗' },
                    { value: '×', label: 'Times', display: '×' },
                    { value: '→', label: 'Arrow', display: '→' },
                    { value: '›', label: 'Chevron', display: '›' },
                    { value: '-', label: 'Dash', display: '-' },
                    { value: '+', label: 'Plus', display: '+' },
                    { value: '★', label: 'Star', display: '★' },
                    { value: 'custom', label: 'Custom...', display: '✏️' },
                  ];

                  const predefinedValues = iconOptions.map(opt => opt.value);
                  const isCustomIcon = itemData.icon && !predefinedValues.includes(itemData.icon);
                  const selectedIconValue = isCustomIcon ? 'custom' : (itemData.icon || '');

                  return (
                    <div key={index} className="p-2 bg-accent/50 rounded space-y-2">
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={itemData.label || ''}
                          onChange={(e) => {
                            const newItems = [...(component.props.items as any[])];
                            newItems[index] = { ...itemData, label: e.target.value };
                            componentStore.updateProps(component.id, { items: newItems });
                          }}
                          className="flex-1 px-2 py-1 bg-secondary border border-border rounded text-xs"
                          placeholder="Label"
                        />
                        <button
                          onClick={() => {
                            const newItems = (component.props.items as any[]).filter((_, i) => i !== index);
                            const selectedIndex = component.props.selectedIndex as number;
                            const newSelectedIndex = selectedIndex >= newItems.length ? Math.max(0, newItems.length - 1) : selectedIndex;
                            componentStore.updateProps(component.id, {
                              items: newItems,
                              selectedIndex: newSelectedIndex,
                            });
                          }}
                          className="px-2 py-1 bg-secondary hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <div>
                          <label className="text-[10px] text-muted-foreground mb-1 block">Icon</label>
                          <select
                            value={selectedIconValue}
                            onChange={(e) => {
                              const newItems = [...(component.props.items as any[])];
                              if (e.target.value === 'custom') {
                                // Keep current custom icon or set empty
                                newItems[index] = { ...itemData };
                              } else {
                                newItems[index] = { ...itemData, icon: e.target.value };
                              }
                              componentStore.updateProps(component.id, { items: newItems });
                            }}
                            className="w-full px-1.5 py-0.5 bg-secondary border border-border rounded text-xs text-center font-mono"
                          >
                            {iconOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.display} {opt.label}
                              </option>
                            ))}
                          </select>
                          {selectedIconValue === 'custom' && (
                            <input
                              type="text"
                              value={itemData.icon || ''}
                              onChange={(e) => {
                                const value = e.target.value.slice(0, 3); // Max 3 chars
                                const newItems = [...(component.props.items as any[])];
                                newItems[index] = { ...itemData, icon: value };
                                componentStore.updateProps(component.id, { items: newItems });
                              }}
                              maxLength={3}
                              className="w-full px-1.5 py-0.5 bg-secondary border border-border rounded text-xs text-center font-mono mt-1"
                              placeholder="Max 3"
                            />
                          )}
                        </div>

                        <div>
                          <label className="text-[10px] text-muted-foreground mb-1 block">Hotkey</label>
                          <input
                            type="text"
                            value={itemData.hotkey || ''}
                            onChange={(e) => {
                              const newItems = [...(component.props.items as any[])];
                              newItems[index] = { ...itemData, hotkey: e.target.value };
                              componentStore.updateProps(component.id, { items: newItems });
                            }}
                            className="w-full px-1.5 py-0.5 bg-secondary border border-border rounded text-xs text-center font-mono"
                            placeholder="^H"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`separator-${index}`}
                            checked={itemData.separator || false}
                            onChange={(e) => {
                              const newItems = [...(component.props.items as any[])];
                              newItems[index] = { ...itemData, separator: e.target.checked };
                              componentStore.updateProps(component.id, { items: newItems });
                            }}
                            className="w-3.5 h-3.5"
                          />
                          <label htmlFor={`separator-${index}`} className="text-[10px] text-muted-foreground">
                            Separator after
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              <button
                onClick={() => {
                  const currentItems = (component.props.items as any[]) || [];
                  const newItems = [...currentItems, { label: `Item ${currentItems.length + 1}`, icon: '⌂', hotkey: '' }];
                  componentStore.updateProps(component.id, { items: newItems });
                }}
                className="w-full px-2 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-xs"
              >
                + Add Menu Item
              </button>
            </div>
          )}

          {component.type === 'List' && (
            <div className="space-y-3">
              <label className="text-xs font-medium mb-1.5 block">List Items</label>
              {Array.isArray(component.props.items) &&
                (component.props.items as any[]).map((item, index) => {
                  const itemData = typeof item === 'string' ? { label: item, icon: '•', hotkey: '' } : item;

                  const iconOptions = [
                    { value: '•', label: 'Bullet', display: '•' },
                    { value: '○', label: 'Circle', display: '○' },
                    { value: '●', label: 'Filled', display: '●' },
                    { value: '☐', label: 'Unchecked', display: '☐' },
                    { value: '☑', label: 'Checked', display: '☑' },
                    { value: '✓', label: 'Check', display: '✓' },
                    { value: '✗', label: 'X Mark', display: '✗' },
                    { value: '×', label: 'Times', display: '×' },
                    { value: '→', label: 'Arrow', display: '→' },
                    { value: '›', label: 'Chevron', display: '›' },
                    { value: '-', label: 'Dash', display: '-' },
                    { value: '+', label: 'Plus', display: '+' },
                    { value: '★', label: 'Star', display: '★' },
                    { value: '', label: 'None', display: '—' },
                  ];

                  return (
                    <div key={index} className="p-2 bg-accent/50 rounded space-y-2">
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={itemData.label || ''}
                          onChange={(e) => {
                            const newItems = [...(component.props.items as any[])];
                            newItems[index] = { ...itemData, label: e.target.value };
                            componentStore.updateProps(component.id, { items: newItems });
                          }}
                          className="flex-1 px-2 py-1 bg-secondary border border-border rounded text-xs"
                          placeholder="Label"
                        />
                        <button
                          onClick={() => {
                            const newItems = (component.props.items as any[]).filter((_, i) => i !== index);
                            const selectedIndex = component.props.selectedIndex as number;
                            const newSelectedIndex = selectedIndex >= newItems.length ? Math.max(0, newItems.length - 1) : selectedIndex;
                            componentStore.updateProps(component.id, {
                              items: newItems,
                              selectedIndex: newSelectedIndex,
                            });
                          }}
                          className="px-2 py-1 bg-secondary hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        <div>
                          <label className="text-[10px] text-muted-foreground mb-1 block">Icon</label>
                          <select
                            value={itemData.icon || '•'}
                            onChange={(e) => {
                              const newItems = [...(component.props.items as any[])];
                              newItems[index] = { ...itemData, icon: e.target.value };
                              componentStore.updateProps(component.id, { items: newItems });
                            }}
                            className="w-full px-1.5 py-0.5 bg-secondary border border-border rounded text-xs text-center font-mono"
                          >
                            {iconOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.display} {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-muted-foreground mb-1 block">Hotkey</label>
                          <input
                            type="text"
                            value={itemData.hotkey || ''}
                            onChange={(e) => {
                              const newItems = [...(component.props.items as any[])];
                              newItems[index] = { ...itemData, hotkey: e.target.value };
                              componentStore.updateProps(component.id, { items: newItems });
                            }}
                            className="w-full px-1.5 py-0.5 bg-secondary border border-border rounded text-xs text-center font-mono"
                            placeholder="1"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              <button
                onClick={() => {
                  const currentItems = (component.props.items as any[]) || [];
                  const newItems = [...currentItems, { label: `Item ${currentItems.length + 1}`, icon: '•', hotkey: '' }];
                  componentStore.updateProps(component.id, { items: newItems });
                }}
                className="w-full px-2 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-xs"
              >
                + Add List Item
              </button>
            </div>
          )}

          {component.type === 'Breadcrumb' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block">Separator</label>
                <input
                  type="text"
                  value={(component.props.separator as string) || ' / '}
                  onChange={(e) =>
                    componentStore.updateProps(component.id, { separator: e.target.value })
                  }
                  className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs text-center font-mono"
                  placeholder=" / "
                />
                <div className="text-[10px] text-muted-foreground mt-1">
                  Examples: / · → » ›
                </div>
              </div>
              <label className="text-xs font-medium mb-1.5 block">Breadcrumb Items</label>
              {Array.isArray(component.props.items) &&
                (component.props.items as any[]).map((item, index) => {
                  const itemData = typeof item === 'string' ? { label: item, icon: '' } : item;

                  return (
                    <div key={index} className="p-2 bg-accent/50 rounded space-y-2">
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={itemData.label || ''}
                          onChange={(e) => {
                            const newItems = [...(component.props.items as any[])];
                            newItems[index] = { ...itemData, label: e.target.value };
                            componentStore.updateProps(component.id, { items: newItems });
                          }}
                          className="flex-1 px-2 py-1 bg-secondary border border-border rounded text-xs"
                          placeholder="Label"
                        />
                        <button
                          onClick={() => {
                            const newItems = (component.props.items as any[]).filter((_, i) => i !== index);
                            componentStore.updateProps(component.id, { items: newItems });
                          }}
                          className="px-2 py-1 bg-secondary hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div>
                        <label className="text-[10px] text-muted-foreground mb-1 block">Icon</label>
                        <input
                          type="text"
                          value={itemData.icon || ''}
                          onChange={(e) => {
                            const newItems = [...(component.props.items as any[])];
                            newItems[index] = { ...itemData, icon: e.target.value };
                            componentStore.updateProps(component.id, { items: newItems });
                          }}
                          maxLength={3}
                          className="w-full px-1.5 py-0.5 bg-secondary border border-border rounded text-xs text-center"
                          placeholder="⌂"
                        />
                      </div>
                    </div>
                  );
                })}
              <button
                onClick={() => {
                  const currentItems = (component.props.items as any[]) || [];
                  const newItems = [...currentItems, { label: `Item ${currentItems.length + 1}`, icon: '' }];
                  componentStore.updateProps(component.id, { items: newItems });
                }}
                className="w-full px-2 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-xs"
              >
                + Add Breadcrumb
              </button>
            </div>
          )}

          {component.type === 'Tree' && (
            <div className="space-y-3">
              <label className="text-xs font-medium mb-1.5 block">Tree Structure</label>
              <TreeItemsEditor
                items={(component.props.items as any[]) || []}
                onChange={(newItems) => {
                  componentStore.updateProps(component.id, { items: newItems });
                }}
                level={0}
              />
              <button
                onClick={() => {
                  const currentItems = (component.props.items as any[]) || [];
                  const newItems = [...currentItems, { label: 'Item', children: [] }];
                  componentStore.updateProps(component.id, { items: newItems });
                }}
                className="w-full px-2 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-xs"
              >
                + Add Item
              </button>
            </div>
          )}

          {component.type === 'Tabs' && (
            <div className="space-y-3">
              <label className="text-xs font-medium mb-1.5 block">Tabs</label>
              {Array.isArray(component.props.tabs) &&
                (component.props.tabs as any[]).map((tab, index) => {
                  const tabData = typeof tab === 'string' ? { label: tab, icon: '', status: false, hotkey: '' } : tab;

                  return (
                    <div key={index} className="p-2 bg-accent/50 rounded space-y-2">
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={tabData.label || ''}
                          onChange={(e) => {
                            const newTabs = [...(component.props.tabs as any[])];
                            newTabs[index] = { ...tabData, label: e.target.value };
                            componentStore.updateProps(component.id, { tabs: newTabs });
                          }}
                          className="flex-1 px-2 py-1 bg-secondary border border-border rounded text-xs"
                          placeholder="Label"
                        />
                        <button
                          onClick={() => {
                            const newTabs = (component.props.tabs as any[]).filter((_, i) => i !== index);
                            const activeTab = component.props.activeTab as number;
                            const newActiveTab = activeTab >= newTabs.length ? Math.max(0, newTabs.length - 1) : activeTab;
                            componentStore.updateProps(component.id, {
                              tabs: newTabs,
                              activeTab: newActiveTab,
                            });
                          }}
                          className="px-2 py-1 bg-secondary hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded transition-colors"
                          title="Remove tab"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        <div>
                          <label className="text-[10px] text-muted-foreground mb-1 block">Icon</label>
                          <input
                            type="text"
                            value={tabData.icon || ''}
                            onChange={(e) => {
                              const newTabs = [...(component.props.tabs as any[])];
                              newTabs[index] = { ...tabData, icon: e.target.value };
                              componentStore.updateProps(component.id, { tabs: newTabs });
                            }}
                            maxLength={3}
                            className="w-full px-1.5 py-0.5 bg-secondary border border-border rounded text-xs text-center"
                            placeholder="⌂"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] text-muted-foreground mb-1 block">Status</label>
                          <div className="flex items-center justify-center h-6">
                            <input
                              type="checkbox"
                              checked={tabData.status || false}
                              onChange={(e) => {
                                const newTabs = [...(component.props.tabs as any[])];
                                newTabs[index] = { ...tabData, status: e.target.checked };
                                componentStore.updateProps(component.id, { tabs: newTabs });
                              }}
                              className="w-3.5 h-3.5"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-muted-foreground mb-1 block">Hotkey</label>
                          <input
                            type="text"
                            value={tabData.hotkey || ''}
                            onChange={(e) => {
                              const newTabs = [...(component.props.tabs as any[])];
                              newTabs[index] = { ...tabData, hotkey: e.target.value };
                              componentStore.updateProps(component.id, { tabs: newTabs });
                            }}
                            className="w-full px-1.5 py-0.5 bg-secondary border border-border rounded text-xs text-center font-mono"
                            placeholder="^1"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              <button
                onClick={() => {
                  const currentTabs = (component.props.tabs as any[]) || [];
                  const newTabs = [...currentTabs, { label: `Tab ${currentTabs.length + 1}`, icon: '', status: false, hotkey: '' }];
                  componentStore.updateProps(component.id, { tabs: newTabs });
                }}
                className="w-full px-2 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-xs"
              >
                + Add Tab
              </button>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Active Tab</label>
                <select
                  value={(component.props.activeTab as number) || 0}
                  onChange={(e) =>
                    componentStore.updateProps(component.id, {
                      activeTab: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs"
                >
                  {Array.isArray(component.props.tabs) &&
                    (component.props.tabs as any[]).map((tab, index) => {
                      const label = typeof tab === 'string' ? tab : tab.label || `Tab ${index + 1}`;
                      return (
                        <option key={index} value={index}>
                          {label}
                        </option>
                      );
                    })}
                </select>
              </div>
            </div>
          )}

          {component.type === 'Table' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Columns</label>
                  <input
                    type="number"
                    value={(component.props.columns as string[])?.length || 2}
                    onChange={(e) => {
                      const newCount = Math.max(1, parseInt(e.target.value) || 2);
                      const currentCols = (component.props.columns as string[]) || ['Column 1', 'Column 2'];
                      const currentRows = (component.props.rows as string[][]) || [['Cell 1', 'Cell 2']];

                      // Adjust columns array
                      const newCols = [...currentCols];
                      while (newCols.length < newCount) {
                        newCols.push(`Column ${newCols.length + 1}`);
                      }
                      while (newCols.length > newCount) {
                        newCols.pop();
                      }

                      // Adjust rows to match column count
                      const newRows = currentRows.map(row => {
                        const newRow = [...row];
                        while (newRow.length < newCount) {
                          newRow.push('');
                        }
                        while (newRow.length > newCount) {
                          newRow.pop();
                        }
                        return newRow;
                      });

                      componentStore.updateProps(component.id, {
                        columns: newCols,
                        rows: newRows,
                      });
                    }}
                    min={1}
                    className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Rows</label>
                  <input
                    type="number"
                    value={(component.props.rows as string[][])?.length || 2}
                    onChange={(e) => {
                      const newCount = Math.max(1, parseInt(e.target.value) || 2);
                      const currentRows = (component.props.rows as string[][]) || [['Cell 1', 'Cell 2']];
                      const colCount = (component.props.columns as string[])?.length || 2;

                      const newRows = [...currentRows];
                      while (newRows.length < newCount) {
                        newRows.push(Array(colCount).fill(''));
                      }
                      while (newRows.length > newCount) {
                        newRows.pop();
                      }

                      componentStore.updateProps(component.id, { rows: newRows });
                    }}
                    min={1}
                    className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Column Headers</label>
                <div className="space-y-1.5">
                  {Array.isArray(component.props.columns) &&
                    (component.props.columns as string[]).map((col, colIndex) => (
                      <input
                        key={colIndex}
                        type="text"
                        value={col}
                        onChange={(e) => {
                          const newCols = [...(component.props.columns as string[])];
                          newCols[colIndex] = e.target.value;
                          componentStore.updateProps(component.id, { columns: newCols });
                        }}
                        className="w-full px-2 py-1 bg-secondary border border-border rounded text-xs"
                        placeholder={`Column ${colIndex + 1}`}
                      />
                    ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Table Data</label>
                <div className="space-y-2">
                  {Array.isArray(component.props.rows) &&
                    (component.props.rows as string[][]).map((row, rowIndex) => (
                      <div key={rowIndex} className="p-2 bg-accent/30 rounded space-y-1.5">
                        <div className="text-[10px] text-muted-foreground font-semibold mb-1">
                          Row {rowIndex + 1}
                        </div>
                        {row.map((cell, colIndex) => (
                          <input
                            key={colIndex}
                            type="text"
                            value={cell}
                            onChange={(e) => {
                              const newRows = [...(component.props.rows as string[][])];
                              newRows[rowIndex][colIndex] = e.target.value;
                              componentStore.updateProps(component.id, { rows: newRows });
                            }}
                            className="w-full px-2 py-1 bg-secondary border border-border rounded text-xs"
                            placeholder={`Cell ${rowIndex + 1},${colIndex + 1}`}
                          />
                        ))}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {component.type === 'ProgressBar' && (
            <>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Value</label>
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
                  className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Max</label>
                <input
                  type="number"
                  value={(component.props.max as number) || 100}
                  onChange={(e) =>
                    componentStore.updateProps(component.id, {
                      max: parseInt(e.target.value) || 100,
                    })
                  }
                  min={1}
                  className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs"
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
        <label className="text-xs font-medium mb-1.5 block">Screen Size</label>
        <select
          value={preset}
          onChange={(e) => handlePresetChange(e.target.value as any)}
          className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs"
        >
          <option value="default">Default (80×25)</option>
          <option value="fullscreen">Full Screen (Fill)</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {preset === 'custom' && (
        <div className="space-y-3 pl-4 border-l-2 border-border">
          <div>
            <label className="text-xs font-medium mb-1.5 block">Columns (Width)</label>
            <input
              type="number"
              value={typeof currentWidth === 'number' ? currentWidth : 80}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 80;
                onChange(val, currentHeight);
              }}
              min={20}
              max={300}
              className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs"
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block">Rows (Height)</label>
            <input
              type="number"
              value={typeof currentHeight === 'number' ? currentHeight : 25}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 25;
                onChange(currentWidth, val);
              }}
              min={10}
              max={100}
              className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs"
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
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground mb-3">
        Define event handler function names. These will be included in the exported code.
      </div>

      {eventTypes.map((event) => (
        <div key={event.key}>
          <label className="text-xs font-medium mb-1.5 block">{event.label}</label>
          <input
            type="text"
            value={(component.events[event.key] as string) || ''}
            onChange={(e) =>
              componentStore.updateEvents(component.id, {
                [event.key]: e.target.value,
              })
            }
            placeholder={`handle${event.label.replace('On ', '')}`}
            className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs font-mono"
          />
        </div>
      ))}
    </div>
  );
}

// Tree Items Editor Component
function TreeItemsEditor({ items, onChange, level }: { items: any[]; onChange: (items: any[]) => void; level: number }) {
  const updateItem = (index: number, updates: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    onChange(newItems);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const addChild = (index: number) => {
    const newItems = [...items];
    const children = newItems[index].children || [];
    newItems[index] = {
      ...newItems[index],
      children: [...children, { label: 'Sub-Item', children: [] }],
    };
    onChange(newItems);
  };

  return (
    <div className="space-y-1">
      {items.map((item, index) => {
        const itemData = typeof item === 'string' ? { label: item, children: [] } : item;
        const hasChildren = itemData.children && itemData.children.length > 0;
        const isLast = index === items.length - 1;

        return (
          <div key={index} style={{ paddingLeft: `${level * 12}px` }}>
            <div className="flex items-center gap-1">
              <span className="font-mono text-[10px] text-muted-foreground select-none w-4 shrink-0">
                {isLast ? '╰╼' : '├╼'}
              </span>
              <input
                type="text"
                value={itemData.label || ''}
                onChange={(e) => updateItem(index, { label: e.target.value })}
                className="flex-1 min-w-0 px-2 py-1 bg-secondary border border-border rounded text-xs"
              />
              <button
                onClick={() => addChild(index)}
                className="px-1.5 py-1 bg-secondary hover:bg-accent text-muted-foreground hover:text-foreground rounded text-[10px] font-mono shrink-0"
                title="Add sub-item"
              >
                +╼
              </button>
              <button
                onClick={() => removeItem(index)}
                className="px-1.5 py-1 bg-secondary hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded shrink-0"
                title="Remove"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {hasChildren && (
              <TreeItemsEditor
                items={itemData.children}
                onChange={(newChildren) => updateItem(index, { children: newChildren })}
                level={level + 1}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
