// Figma-style component toolbar with grouped components and hotkeys

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  LayoutGrid,
  TextCursorInput,
  Eye,
  Table2,
  Menu as MenuIcon,
  Layers,
  ChevronDown,
  Settings,
  GripVertical
} from 'lucide-react';
import { ComponentType } from '../../types';
import { dragStore } from '../../hooks/useDragAndDrop';
import { useComponentStore, useSelectionStore } from '../../stores';
import { COMPONENT_LIBRARY } from '../../constants/components';

type ToolbarPosition = 'TL' | 'T' | 'TR' | 'BL' | 'B' | 'BR' | 'custom';

interface ToolbarCoordinates {
  x: number;
  y: number;
}

const POSITION_PRESETS: Record<Exclude<ToolbarPosition, 'custom'>, ToolbarCoordinates> = {
  TL: { x: 32, y: 32 },
  T: { x: 50, y: 32 }, // percentage for center
  TR: { x: -32, y: 32 }, // negative for right offset
  BL: { x: 32, y: -32 }, // negative for bottom offset
  B: { x: 50, y: -32 },
  BR: { x: -32, y: -32 },
};

const POSITION_LABELS: Record<Exclude<ToolbarPosition, 'custom'>, string> = {
  TL: 'Top Left',
  T: 'Top Center',
  TR: 'Top Right',
  BL: 'Bottom Left',
  B: 'Bottom Center',
  BR: 'Bottom Right',
};

interface ComponentGroup {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  items: ComponentItem[];
}

interface ComponentItem {
  type: ComponentType;
  label: string;
  hotkey?: string;
}

const COMPONENT_GROUPS: ComponentGroup[] = [
  {
    id: 'layout',
    name: 'Layout',
    icon: LayoutGrid,
    items: [
      { type: 'Flexbox', label: 'Flexbox', hotkey: 'F' },
      { type: 'Box', label: 'Box', hotkey: 'X' },
      { type: 'Grid', label: 'Grid', hotkey: 'G' },
      { type: 'Stack', label: 'Stack', hotkey: 'S' },
      { type: 'Spacer', label: 'Spacer', hotkey: 'J' },
    ],
  },
  {
    id: 'input',
    name: 'Input',
    icon: TextCursorInput,
    items: [
      { type: 'Button', label: 'Button', hotkey: 'B' },
      { type: 'TextInput', label: 'Text Input', hotkey: 'I' },
      { type: 'Checkbox', label: 'Checkbox', hotkey: 'K' },
      { type: 'Radio', label: 'Radio', hotkey: 'R' },
      { type: 'Select', label: 'Select', hotkey: 'D' },
      { type: 'Toggle', label: 'Toggle', hotkey: 'E' },
    ],
  },
  {
    id: 'display',
    name: 'Display',
    icon: Eye,
    items: [
      { type: 'Text', label: 'Text', hotkey: 'Y' },
      { type: 'Label', label: 'Label', hotkey: 'L' },
      { type: 'Badge', label: 'Badge', hotkey: 'W' },
      { type: 'Spinner', label: 'Spinner', hotkey: 'N' },
      { type: 'ProgressBar', label: 'Progress Bar', hotkey: 'P' },
    ],
  },
  {
    id: 'data',
    name: 'Data',
    icon: Table2,
    items: [
      { type: 'Table', label: 'Table', hotkey: 'A' },
      { type: 'List', label: 'List', hotkey: 'U' },
      { type: 'Tree', label: 'Tree', hotkey: 'Z' },
    ],
  },
  {
    id: 'navigation',
    name: 'Navigation',
    icon: MenuIcon,
    items: [
      { type: 'Menu', label: 'Menu', hotkey: 'M' },
      { type: 'Tabs', label: 'Tabs', hotkey: 'T' },
      { type: 'Breadcrumb', label: 'Breadcrumb', hotkey: 'C' },
    ],
  },
  {
    id: 'overlay',
    name: 'Overlay',
    icon: Layers,
    items: [
      { type: 'Modal', label: 'Modal', hotkey: 'O' },
      { type: 'Popover', label: 'Popover', hotkey: 'V' },
      { type: 'Tooltip', label: 'Tooltip', hotkey: 'H' },
    ],
  },
];

interface ComponentToolbarProps {
  docked?: boolean;
}

export function ComponentToolbar({ docked = false }: ComponentToolbarProps) {
  const componentStore = useComponentStore();
  const selectionStore = useSelectionStore();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [position, setPosition] = useState<ToolbarPosition>('B');
  const [showSettings, setShowSettings] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [customPosition, setCustomPosition] = useState<ToolbarCoordinates | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'below' | 'above'>('below');
  const [isDockedState, setIsDockedState] = useState(() => {
    const saved = localStorage.getItem('toolbar-docked');
    return saved ? JSON.parse(saved) : docked;
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const dragStartPos = useRef<{ x: number; y: number; toolbarX: number; toolbarY: number } | null>(null);

  // Save docked state to localStorage and notify other components
  useEffect(() => {
    localStorage.setItem('toolbar-docked', JSON.stringify(isDockedState));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('toolbar-docked-changed', { detail: isDockedState }));
  }, [isDockedState]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add component directly (for keyboard shortcuts)
  const addComponentDirectly = useCallback((type: ComponentType, groupId: string) => {
    setActiveGroup(groupId);

    const root = componentStore.root;
    let parentId = root?.id;

    // Create root if it doesn't exist
    if (!parentId) {
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
      parentId = 'root';
    }

    const def = COMPONENT_LIBRARY[type];
    if (def) {
      // Calculate position with offset so components don't stack
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

    // Show visual feedback
    setTimeout(() => setActiveGroup(null), 500);
  }, [componentStore, selectionStore]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Find matching component by hotkey
      for (const group of COMPONENT_GROUPS) {
        for (const item of group.items) {
          if (item.hotkey === e.key.toUpperCase() || item.hotkey?.toLowerCase() === e.key) {
            e.preventDefault();
            // Add component directly via keyboard shortcut
            addComponentDirectly(item.type, group.id);
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addComponentDirectly]);

  // Handle drag to reposition
  const handleDragStart = (e: React.MouseEvent) => {
    if (!toolbarRef.current) return;

    const rect = toolbarRef.current.getBoundingClientRect();
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      toolbarX: rect.left,
      toolbarY: rect.top,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleDragMove = (e: MouseEvent) => {
      if (!dragStartPos.current || !toolbarRef.current) return;

      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;

      let newX = dragStartPos.current.toolbarX + deltaX;
      let newY = dragStartPos.current.toolbarY + deltaY;

      // Get canvas bounds (parent container)
      const parent = toolbarRef.current.parentElement;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        const toolbarRect = toolbarRef.current.getBoundingClientRect();

        // Constrain to canvas boundaries with margin
        const margin = 16;
        const minX = margin;
        const minY = margin;
        const maxX = parentRect.width - toolbarRect.width - margin;
        const maxY = parentRect.height - toolbarRect.height - margin;

        newX = Math.max(minX, Math.min(maxX, newX));
        newY = Math.max(minY, Math.min(maxY, newY));
      }

      setCustomPosition({ x: newX, y: newY });
      setPosition('custom');
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      dragStartPos.current = null;
    };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);

    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging]);

  const handleComponentClick = (type: ComponentType, groupId: string) => {
    setActiveGroup(groupId);
    setOpenDropdown(null);

    // Start drag operation
    dragStore.startDrag({
      type: 'new-component',
      componentType: type,
    });

    // Show visual feedback that component is selected
    setTimeout(() => setActiveGroup(null), 500);
  };

  const handleGroupClick = (groupId: string) => {
    if (openDropdown === groupId) {
      setOpenDropdown(null);
    } else {
      // Calculate dropdown position based on available space
      const buttonElement = buttonRefs.current[groupId];
      const position = getDropdownPosition(buttonElement);
      setDropdownPosition(position === 'top' ? 'above' : 'below');
      setOpenDropdown(groupId);
    }
  };

  // Determine if dropdown should open upward or downward
  const getDropdownPosition = (buttonRef: HTMLElement | null): 'top' | 'bottom' => {
    if (!buttonRef) return 'bottom';

    const rect = buttonRef.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    const minSpaceNeeded = 200; // Minimum space needed for dropdown

    // If not enough space below but enough space above, open upward
    if (spaceBelow < minSpaceNeeded && spaceAbove >= minSpaceNeeded) {
      return 'top';
    }

    // If not enough space above but enough space below, open downward
    if (spaceAbove < minSpaceNeeded && spaceBelow >= minSpaceNeeded) {
      return 'bottom';
    }

    // If both have enough space, prefer below (default)
    if (spaceBelow >= minSpaceNeeded) {
      return 'bottom';
    }

    // If neither has enough space, use the one with more space
    return spaceAbove > spaceBelow ? 'top' : 'bottom';
  };

  const handlePresetPosition = (pos: Exclude<ToolbarPosition, 'custom'>) => {
    setPosition(pos);
    setCustomPosition(null);
    setShowSettings(false);
  };

  // Calculate toolbar position style
  const getPositionStyle = (): React.CSSProperties => {
    if (position === 'custom' && customPosition) {
      return {
        left: `${customPosition.x}px`,
        top: `${customPosition.y}px`,
      };
    }

    const preset = POSITION_PRESETS[position as Exclude<ToolbarPosition, 'custom'>];
    if (!preset) return {};

    const style: React.CSSProperties = {};

    // Handle horizontal positioning
    if (preset.x === 50) {
      style.left = '50%';
      style.transform = 'translateX(-50%)';
    } else if (preset.x < 0) {
      style.right = `${Math.abs(preset.x)}px`;
    } else {
      style.left = `${preset.x}px`;
    }

    // Handle vertical positioning
    if (preset.y < 0) {
      style.bottom = `${Math.abs(preset.y)}px`;
    } else {
      style.top = `${preset.y}px`;
    }

    return style;
  };

  // If docked, render simplified toolbar
  if (isDockedState) {
    return (
      <div className="flex items-center gap-2">
        {COMPONENT_GROUPS.map((group) => {
          const Icon = group.icon;
          const isOpen = openDropdown === group.id;
          const isActive = activeGroup === group.id;

          return (
            <div
              key={group.id}
              className="relative"
              ref={(el) => {
                if (isOpen) {
                  (dropdownRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                }
                buttonRefs.current[group.id] = el;
              }}
            >
              {/* Dropdown Menu */}
              {isOpen && (
                <div className={`absolute left-0 min-w-[180px] bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50 max-h-[400px] overflow-y-auto ${
                  dropdownPosition === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'
                }`}>
                  <div className="py-1">
                    {group.items.map((item) => (
                      <button
                        key={item.type}
                        onClick={() => addComponentDirectly(item.type, group.id)}
                        draggable
                        onDragStart={() => {
                          dragStore.startDrag({
                            type: 'new-component',
                            componentType: item.type,
                          });
                        }}
                        className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-accent transition-colors text-left group"
                      >
                        <span className="text-xs">{item.label}</span>
                        {item.hotkey && (
                          <span className="text-[10px] text-muted-foreground group-hover:text-foreground ml-4">
                            {item.hotkey}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Toolbar Button */}
              <button
                onClick={() => handleGroupClick(group.id)}
                className={`flex items-center gap-1 px-2 py-1.5 rounded transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isOpen
                    ? 'bg-accent'
                    : 'hover:bg-accent'
                }`}
                title={group.name}
              >
                <Icon size={18} className={isActive ? 'text-primary-foreground' : ''} />
                <ChevronDown
                  size={10}
                  className={`transition-transform ${isOpen ? 'rotate-180' : ''} ${
                    isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`}
                />
              </button>
            </div>
          );
        })}

        {/* Settings for docked mode */}
        <div className="relative ml-1 pl-2 border-l border-border" ref={settingsRef}>
          {showSettings && (
            <div className={`absolute left-0 min-w-[160px] bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50 max-h-[400px] overflow-y-auto ${
              dropdownPosition === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}>
              <div className="py-1">
                <button
                  onClick={() => {
                    setIsDockedState(false);
                    setShowSettings(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-accent transition-colors text-left"
                >
                  <span className="text-xs">Undock from Top Bar</span>
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              // Calculate position when opening settings
              const position = getDropdownPosition(settingsRef.current);
              setDropdownPosition(position === 'top' ? 'above' : 'below');
              setShowSettings(!showSettings);
            }}
            className={`flex items-center gap-1 px-2 py-1.5 rounded transition-colors ${
              showSettings ? 'bg-accent' : 'hover:bg-accent'
            }`}
            title="Toolbar Settings"
          >
            <Settings size={16} className="text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  }

  // Floating toolbar
  return (
    <div
      ref={toolbarRef}
      className={`absolute z-50 ${isDragging ? 'cursor-grabbing' : ''}`}
      style={getPositionStyle()}
    >
      <div className="flex items-center gap-2 bg-card border border-border rounded-lg shadow-2xl p-1">
        {/* Drag Handle */}
        <button
          onMouseDown={handleDragStart}
          className="flex items-center px-1 py-2 cursor-grab hover:bg-accent rounded transition-colors"
          title="Drag to reposition"
        >
          <GripVertical size={16} className="text-muted-foreground/50" />
        </button>
        {COMPONENT_GROUPS.map((group) => {
          const Icon = group.icon;
          const isOpen = openDropdown === group.id;
          const isActive = activeGroup === group.id;

          return (
            <div key={group.id} className="relative" ref={isOpen ? dropdownRef : null}>
              {/* Dropdown Menu */}
              {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 min-w-[180px] bg-card border border-border rounded-lg shadow-xl overflow-hidden">
                  <div className="py-1">
                    {group.items.map((item) => (
                      <button
                        key={item.type}
                        onClick={() => addComponentDirectly(item.type, group.id)}
                        draggable
                        onDragStart={() => {
                          dragStore.startDrag({
                            type: 'new-component',
                            componentType: item.type,
                          });
                        }}
                        className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-accent transition-colors text-left group"
                      >
                        <span className="text-xs">{item.label}</span>
                        {item.hotkey && (
                          <span className="text-[10px] text-muted-foreground group-hover:text-foreground ml-4">
                            {item.hotkey}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Toolbar Button */}
              <button
                onClick={() => handleGroupClick(group.id)}
                className={`flex items-center gap-1 px-2 py-2 rounded transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isOpen
                    ? 'bg-accent'
                    : 'hover:bg-accent'
                }`}
                title={group.name}
              >
                <Icon size={24} className={isActive ? 'text-primary-foreground' : ''} />
                <ChevronDown
                  size={10}
                  className={`transition-transform ${isOpen ? 'rotate-180' : ''} ${
                    isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`}
                />
              </button>
            </div>
          );
        })}

        {/* Settings Button */}
        <div className="relative ml-1 pl-2 border-l border-border" ref={settingsRef}>
          {/* Position Dropdown */}
          {showSettings && (
            <div className="absolute bottom-full left-0 mb-2 min-w-[160px] bg-card border border-border rounded-lg shadow-xl overflow-hidden">
              <div className="py-1">
                <button
                  onClick={() => {
                    setIsDockedState(true);
                    setShowSettings(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-accent transition-colors text-left border-b border-border"
                >
                  <span className="text-xs font-semibold">Dock to Top Bar</span>
                </button>
                <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground">
                  Toolbar Position
                </div>
                {(Object.keys(POSITION_LABELS) as Array<Exclude<ToolbarPosition, 'custom'>>).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => handlePresetPosition(pos)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 hover:bg-accent transition-colors text-left ${
                      position === pos ? 'bg-accent' : ''
                    }`}
                  >
                    <span className="text-xs">{POSITION_LABELS[pos]}</span>
                    {position === pos && !customPosition && (
                      <span className="text-primary text-xs">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-1 px-2 py-2 rounded transition-colors ${
              showSettings ? 'bg-accent' : 'hover:bg-accent'
            }`}
            title="Toolbar Settings"
          >
            <Settings size={18} className="text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
