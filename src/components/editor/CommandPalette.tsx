// Command palette for quick access to commands and components

import { useState, useEffect, useRef } from 'react';
import { Search, FileDown, Save, Palette, Package } from 'lucide-react';
import { useComponentStore, useSelectionStore, useThemeStore } from '../../stores';
import { COMPONENT_LIBRARY } from '../../constants/components';
import { THEME_NAMES } from '../../stores/themeStore';
import type { ComponentType } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onAddComponent: (type: ComponentType) => void;
}

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  action: () => void;
  category: 'action' | 'component' | 'theme';
}

export function CommandPalette({ isOpen, onClose, onAddComponent }: CommandPaletteProps) {
  const themeStore = useThemeStore();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build command list
  const commands: Command[] = [
    // Actions
    {
      id: 'export',
      label: 'Export',
      description: 'Export design to code',
      icon: FileDown,
      action: () => {
        // TODO: Open export modal
        console.log('Export');
        onClose();
      },
      category: 'action',
    },
    {
      id: 'save',
      label: 'Save',
      description: 'Save design to file',
      icon: Save,
      action: () => {
        // TODO: Implement save
        console.log('Save');
        onClose();
      },
      category: 'action',
    },

    // Themes
    ...THEME_NAMES.map((themeName) => ({
      id: `theme-${themeName}`,
      label: `Theme: ${themeName}`,
      description: `Switch to ${themeName} theme`,
      icon: Palette,
      action: () => {
        themeStore.setTheme(themeName as any);
        onClose();
      },
      category: 'theme' as const,
    })),

    // Components
    ...Object.entries(COMPONENT_LIBRARY).map(([type, def]) => ({
      id: `component-${type}`,
      label: def.name,
      description: `Add ${def.name} component`,
      icon: Package,
      action: () => {
        onAddComponent(type as ComponentType);
        onClose();
      },
      category: 'component' as const,
    })),
  ];

  // Filter commands based on search
  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(search.toLowerCase()) ||
      cmd.description?.toLowerCase().includes(search.toLowerCase())
  );

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-start justify-center pt-32 z-[9999]"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={20} className="text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or component name..."
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
          />
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results found
            </div>
          ) : (
            filteredCommands.map((cmd, index) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={() => cmd.action()}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left ${
                    index === selectedIndex ? 'bg-accent' : ''
                  }`}
                >
                  <Icon size={18} className="text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{cmd.label}</div>
                    {cmd.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {cmd.description}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {cmd.category}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px]">
                ↑↓
              </kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px]">
                Enter
              </kbd>{' '}
              Select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px]">
                Esc
              </kbd>{' '}
              Close
            </span>
          </div>
          <span>{filteredCommands.length} results</span>
        </div>
      </div>
    </div>
  );
}
