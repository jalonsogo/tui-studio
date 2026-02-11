// Color picker with ANSI, RGB, and Theme support

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useComponentStore, useSelectionStore } from '../../stores';
import { THEME_NAMES, THEMES } from '../../stores/themeStore';
import type { ComponentNode } from '../../types';

// Helper to find the active theme for a component
function findComponentTheme(node: ComponentNode | null, componentStore: any): string {
  if (!node) return 'dracula';

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

const ANSI_COLORS = [
  { name: 'Black', value: 'black' },
  { name: 'Red', value: 'red' },
  { name: 'Green', value: 'green' },
  { name: 'Yellow', value: 'yellow' },
  { name: 'Blue', value: 'blue' },
  { name: 'Magenta', value: 'magenta' },
  { name: 'Cyan', value: 'cyan' },
  { name: 'White', value: 'white' },
  { name: 'Bright Black', value: 'brightBlack' },
  { name: 'Bright Red', value: 'brightRed' },
  { name: 'Bright Green', value: 'brightGreen' },
  { name: 'Bright Yellow', value: 'brightYellow' },
  { name: 'Bright Blue', value: 'brightBlue' },
  { name: 'Bright Magenta', value: 'brightMagenta' },
  { name: 'Bright Cyan', value: 'brightCyan' },
  { name: 'Bright White', value: 'brightWhite' },
];

type ColorTab = 'ansi' | 'rgb' | 'themes';

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  label: string;
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const componentStore = useComponentStore();
  const selectionStore = useSelectionStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ColorTab>('ansi');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get the selected component and its theme
  const selectedComponents = selectionStore.getSelectedComponents();
  const selectedComponent = selectedComponents[0];
  const activeThemeName = findComponentTheme(selectedComponent, componentStore);
  const activeTheme = THEMES[activeThemeName as keyof typeof THEMES] || THEMES.dracula;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get display info for current color
  const getCurrentColor = () => {
    if (!value) return { name: 'None', hex: 'transparent' };

    if (value.startsWith('#')) {
      return { name: value, hex: value };
    }

    const ansiColor = ANSI_COLORS.find(c => c.value === value);
    if (ansiColor) {
      const hex = activeTheme[value as keyof typeof activeTheme];
      return { name: ansiColor.name, hex };
    }

    return { name: value, hex: 'transparent' };
  };

  const currentColor = getCurrentColor();

  return (
    <div ref={dropdownRef} className="relative">
      <label className="text-xs font-medium mb-1.5 block">{label}</label>

      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs flex items-center justify-between hover:bg-secondary/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded border border-border flex-shrink-0"
            style={{ backgroundColor: currentColor.hex }}
          />
          <span className="truncate">{currentColor.name}</span>
        </div>
        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-80 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-border bg-secondary/50">
            <button
              type="button"
              onClick={() => setActiveTab('ansi')}
              className={`flex-1 px-3 py-1.5 text-[10px] font-medium transition-colors ${
                activeTab === 'ansi'
                  ? 'bg-background border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              ANSI
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rgb')}
              className={`flex-1 px-3 py-1.5 text-[10px] font-medium transition-colors ${
                activeTab === 'rgb'
                  ? 'bg-background border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              RGB
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('themes')}
              className={`flex-1 px-3 py-1.5 text-[10px] font-medium transition-colors ${
                activeTab === 'themes'
                  ? 'bg-background border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Themes
            </button>
          </div>

          {/* Tab Content */}
          <div className="overflow-y-auto max-h-64">
            {/* None option - always available */}
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="w-full px-2 py-1.5 text-xs flex items-center gap-2 hover:bg-accent transition-colors text-left border-b border-border"
            >
              <div className="w-4 h-4 rounded border border-border flex-shrink-0 bg-transparent" />
              <span>None</span>
            </button>

            {/* ANSI Colors Tab */}
            {activeTab === 'ansi' && (
              <div>
                {ANSI_COLORS.map((color) => {
                  const hexColor = activeTheme[color.value as keyof typeof activeTheme];
                  const isSelected = value === color.value;

                  return (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => {
                        onChange(color.value);
                        setIsOpen(false);
                      }}
                      className={`w-full px-2 py-1.5 text-xs flex items-center gap-2 hover:bg-accent transition-colors text-left ${
                        isSelected ? 'bg-accent' : ''
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded border border-border flex-shrink-0"
                        style={{ backgroundColor: hexColor }}
                      />
                      <span>{color.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* RGB Tab */}
            {activeTab === 'rgb' && (
              <div className="p-3 space-y-3">
                <div className="text-[10px] text-muted-foreground mb-2">Custom RGB/Hex Color</div>

                {/* Color Picker */}
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={value?.startsWith('#') ? value : '#ffffff'}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-12 h-10 rounded border border-border cursor-pointer"
                  />
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground mb-1 block">Hex</label>
                    <input
                      type="text"
                      value={value?.startsWith('#') ? value : ''}
                      onChange={(e) => {
                        if (e.target.value.startsWith('#') || e.target.value === '') {
                          onChange(e.target.value);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setIsOpen(false);
                        }
                      }}
                      placeholder="#ffffff"
                      className="w-full px-2 py-1 bg-secondary border border-border rounded text-[10px] font-mono"
                    />
                  </div>
                </div>

                {/* RGB Sliders */}
                <div className="space-y-2">
                  <RGBSlider
                    label="R"
                    color="red"
                    value={value}
                    onChange={onChange}
                  />
                  <RGBSlider
                    label="G"
                    color="green"
                    value={value}
                    onChange={onChange}
                  />
                  <RGBSlider
                    label="B"
                    color="blue"
                    value={value}
                    onChange={onChange}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full px-2 py-1.5 bg-primary text-primary-foreground rounded text-xs"
                >
                  Done
                </button>
              </div>
            )}

            {/* Themes Tab */}
            {activeTab === 'themes' && (
              <div className="p-2">
                <div className="text-[10px] text-muted-foreground mb-2 px-1">
                  Set theme for nearest Screen
                </div>
                {THEME_NAMES.map((theme) => {
                  // Find the nearest Screen component to apply theme
                  const findScreen = (node: ComponentNode | null): ComponentNode | null => {
                    if (!node) return null;
                    if (node.type === 'Screen') return node;
                    const parent = componentStore.getParent(node.id);
                    return findScreen(parent);
                  };

                  const screenComponent = findScreen(selectedComponent);

                  return (
                    <button
                      key={theme.value}
                      type="button"
                      onClick={() => {
                        if (screenComponent) {
                          componentStore.updateProps(screenComponent.id, { theme: theme.value });
                          setIsOpen(false);
                        }
                      }}
                      disabled={!screenComponent}
                      className={`w-full px-2 py-2 text-xs text-left hover:bg-accent transition-colors rounded flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed ${
                        activeThemeName === theme.value ? 'bg-accent' : ''
                      }`}
                    >
                      <span>{theme.label}</span>
                      {activeThemeName === theme.value && (
                        <span className="text-[10px] text-primary">Active</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// RGB Slider Component
function RGBSlider({
  label,
  color,
  value,
  onChange,
}: {
  label: string;
  color: 'red' | 'green' | 'blue';
  value?: string;
  onChange: (color: string) => void;
}) {
  // Parse current RGB values from hex
  const getRGB = () => {
    if (!value?.startsWith('#')) return { r: 255, g: 255, b: 255 };
    const hex = value.slice(1);
    const r = parseInt(hex.slice(0, 2), 16) || 0;
    const g = parseInt(hex.slice(2, 4), 16) || 0;
    const b = parseInt(hex.slice(4, 6), 16) || 0;
    return { r, g, b };
  };

  const rgb = getRGB();
  const currentValue = color === 'red' ? rgb.r : color === 'green' ? rgb.g : rgb.b;

  const handleChange = (newValue: number) => {
    const newRgb = { ...rgb };
    if (color === 'red') newRgb.r = newValue;
    if (color === 'green') newRgb.g = newValue;
    if (color === 'blue') newRgb.b = newValue;

    const hex = `#${newRgb.r.toString(16).padStart(2, '0')}${newRgb.g.toString(16).padStart(2, '0')}${newRgb.b.toString(16).padStart(2, '0')}`;
    onChange(hex);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-[10px] font-medium w-3">{label}</label>
      <input
        type="range"
        min="0"
        max="255"
        value={currentValue}
        onChange={(e) => handleChange(parseInt(e.target.value))}
        className="flex-1 h-1"
      />
      <input
        type="number"
        min="0"
        max="255"
        value={currentValue}
        onChange={(e) => {
          const val = parseInt(e.target.value);
          if (!isNaN(val) && val >= 0 && val <= 255) {
            handleChange(val);
          }
        }}
        className="w-12 px-1.5 py-0.5 bg-secondary border border-border rounded text-[10px] text-center"
      />
    </div>
  );
}
