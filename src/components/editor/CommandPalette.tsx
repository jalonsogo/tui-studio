// Command palette for quick access to commands and components

import { useState, useEffect, useRef } from 'react';
import { Search, FileDown, Save, Palette, Package, Settings, Keyboard, Info } from 'lucide-react';
import { useThemeStore } from '../../stores';
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
  shortcut?: string;
}

export function CommandPalette({ isOpen, onClose, onAddComponent }: CommandPaletteProps) {
  const themeStore = useThemeStore();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build command list
  const commands: Command[] = [
    // Components first (search for components)
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

    // Actions (after divider in UI)
    {
      id: 'save',
      label: 'Save',
      description: 'Save design to file',
      icon: Save,
      action: () => {
        window.dispatchEvent(new Event('command-save'));
        onClose();
      },
      category: 'action',
      shortcut: 'Ctrl+S',
    },
    {
      id: 'export',
      label: 'Export',
      description: 'Export design to code',
      icon: FileDown,
      action: () => {
        window.dispatchEvent(new Event('command-export'));
        onClose();
      },
      category: 'action',
      shortcut: 'Ctrl+E',
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Open settings',
      icon: Settings,
      action: () => {
        window.dispatchEvent(new Event('command-settings'));
        onClose();
      },
      category: 'action',
      shortcut: 'Ctrl+K',
    },
    {
      id: 'help',
      label: 'Keyboard Shortcuts',
      description: 'View all keyboard shortcuts',
      icon: Keyboard,
      action: () => {
        window.dispatchEvent(new Event('command-help'));
        onClose();
      },
      category: 'action',
      shortcut: 'Ctrl+?',
    },
    {
      id: 'about',
      label: 'About TUIStudio',
      description: 'Version info and links',
      icon: Info,
      action: () => {
        window.dispatchEvent(new Event('command-about'));
        onClose();
      },
      category: 'action',
    },

    // Themes
    ...THEME_NAMES.map((theme) => ({
      id: `theme-${theme.value}`,
      label: theme.label,
      description: `Switch to ${theme.label} theme`,
      icon: Palette,
      action: () => {
        themeStore.setTheme(theme.value as any);
        onClose();
      },
      category: 'theme' as const,
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
        className="bg-card border border-border rounded-lg w-full max-w-2xl overflow-hidden"
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
            (() => {
              // Group commands by category
              const grouped = filteredCommands.reduce((acc, cmd) => {
                if (!acc[cmd.category]) acc[cmd.category] = [];
                acc[cmd.category].push(cmd);
                return acc;
              }, {} as Record<string, Command[]>);

              const categoryOrder: Array<'component' | 'action' | 'theme'> = ['component', 'action', 'theme'];
              const categoryLabels = {
                component: 'Components',
                action: 'Actions',
                theme: 'Themes',
              };

              let globalIndex = 0;

              return categoryOrder.map((cat) => {
                const cmds = grouped[cat];
                if (!cmds || cmds.length === 0) return null;

                return (
                  <div key={cat}>
                    {/* Section Header */}
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted/30 border-t border-border">
                      {categoryLabels[cat]}
                    </div>
                    {/* Commands in this category */}
                    {cmds.map((cmd) => {
                      const Icon = cmd.icon;
                      const index = globalIndex++;
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => cmd.action()}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors text-left ${
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
                          {cmd.shortcut && (
                            <kbd className="px-2 py-1 text-[10px] font-mono bg-muted border border-border rounded">
                              {cmd.shortcut}
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              });
            })()
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
