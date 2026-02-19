// Top toolbar with controls

import { useState, useEffect, useRef } from 'react';
import { Undo2, Redo2, ZoomIn, ZoomOut, Grid3x3, Save, Palette, Search, ChevronDown, ChevronRight, Github, FolderOpen, Check, Sun, Moon } from 'lucide-react';
import { useComponentStore, useCanvasStore, useThemeStore } from '../../stores';
import { ExportModal } from '../export/ExportModal';
import { THEME_NAMES, THEMES } from '../../stores/themeStore';
import { ComponentToolbar } from './ComponentToolbar';
import { buildTuiData, saveTuiData, openTuiFile } from '../../utils/fileOps';
import { selectDownloadFolder, getDownloadFolderName, isDirectoryPickerSupported } from '../../utils/downloadManager';
import { ColorPicker } from '../properties/ColorPicker';

// ── Accent color presets ──────────────────────────────────────────────────────

const ACCENT_PRESETS = [
  { name: 'TUIGreen', value: 'tuigreen', hex: '#3fcf8e', primary: '153 60% 53%', fg: '0 0% 5%' },
  { name: 'Blue',     value: 'blue',     hex: '#3b82f6', primary: '221 83% 53%', fg: '0 0% 100%' },
  { name: 'Red',      value: 'red',      hex: '#ef4444', primary: '0 84% 60%',   fg: '0 0% 100%' },
  { name: 'Lime',     value: 'lime',     hex: '#84cc16', primary: '85 60% 45%',  fg: '0 0% 5%' },
  { name: 'Orange',   value: 'orange',   hex: '#f97316', primary: '25 95% 53%',  fg: '0 0% 5%' },
  { name: 'Rose',     value: 'rose',     hex: '#f43f5e', primary: '347 77% 50%', fg: '0 0% 100%' },
  { name: 'Violet',   value: 'violet',   hex: '#8b5cf6', primary: '263 70% 58%', fg: '0 0% 100%' },
  { name: 'Yellow',   value: 'yellow',   hex: '#eab308', primary: '48 96% 48%',  fg: '0 0% 5%' },
] as const;

type AccentPreset = typeof ACCENT_PRESETS[number]['value'] | 'custom';

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function isLightHex(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

function resolveColorToHex(color: string, theme: typeof THEMES[keyof typeof THEMES]): string {
  if (!color) return '#ffffff';
  if (color.startsWith('#')) return color;
  return theme[color as keyof typeof theme] || '#ffffff';
}

function applyAccentColor(preset: AccentPreset, customHex?: string) {
  let primary: string;
  let fg: string;
  if (preset === 'custom' && customHex) {
    const hex = customHex.startsWith('#') ? customHex : '#ffffff';
    primary = hexToHsl(hex);
    fg = isLightHex(hex) ? '0 0% 5%' : '0 0% 100%';
  } else {
    const found = ACCENT_PRESETS.find(p => p.value === preset) || ACCENT_PRESETS[0];
    primary = found.primary;
    fg = found.fg;
  }
  document.documentElement.style.setProperty('--primary', primary);
  document.documentElement.style.setProperty('--primary-foreground', fg);
  document.documentElement.style.setProperty('--ring', primary);
  localStorage.setItem('settings-accent-preset', preset);
  if (preset === 'custom' && customHex) {
    localStorage.setItem('settings-accent-custom', customHex);
  }
}

// ── Save dialog ───────────────────────────────────────────────────────────────

function useEscapeKey(onClose: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);
}

function SaveDialog({ onClose }: { onClose: () => void }) {
  useEscapeKey(onClose);
  const initial = buildTuiData();
  const [filename, setFilename] = useState(initial?.suggestedName ?? 'untitled.tui');
  const json = initial?.json ?? '';

  const handleSave = async () => {
    const name = filename.trim() || 'untitled.tui';
    await saveTuiData(json, name.endsWith('.tui') ? name : name + '.tui');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-2xl p-6 w-96"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-sm font-semibold mb-4">Save File</h2>
        <label className="block text-xs text-muted-foreground mb-1">File name</label>
        <input
          autoFocus
          value={filename}
          onChange={e => setFilename(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose(); }}
          className="w-full px-3 py-1.5 bg-input border border-border rounded-lg text-sm focus:border-primary focus:outline-none mb-4"
        />
        {'showSaveFilePicker' in window
          ? <p className="text-[11px] text-muted-foreground mb-4">A folder picker will open next.</p>
          : <p className="text-[11px] text-muted-foreground mb-4">The file will be saved to your Downloads folder.</p>
        }
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm hover:bg-accent rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Help / Keyboard shortcuts modal ──────────────────────────────────────────

const isMacHelp = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
const modHelp = isMacHelp ? '⌘' : 'Ctrl+';

const SHORTCUT_GROUPS = [
  {
    title: 'General',
    shortcuts: [
      { key: `${modHelp}P`, label: 'Command Palette' },
      { key: `${modHelp}Z`, label: 'Undo' },
      { key: `${modHelp}⇧Z`, label: 'Redo' },
      { key: `${modHelp}S`, label: 'Save' },
      { key: `${modHelp}O`, label: 'Open' },
      { key: `${modHelp}E`, label: 'Export' },
      { key: `${modHelp}C`, label: 'Copy' },
      { key: `${modHelp}V`, label: 'Paste' },
      { key: 'Del / ⌫', label: 'Delete selected' },
    ],
  },
  {
    title: 'Add Component',
    shortcuts: [
      { key: 'B', label: 'Button' },
      { key: 'R', label: 'Box' },
      { key: 'Y', label: 'Text' },
      { key: 'I', label: 'TextInput' },
      { key: 'K', label: 'Checkbox' },
      { key: 'A', label: 'Radio' },
      { key: 'S', label: 'Select' },
      { key: 'O', label: 'Toggle' },
      { key: 'P', label: 'ProgressBar' },
      { key: 'N', label: 'Spinner' },
      { key: 'T', label: 'Tabs' },
      { key: 'L', label: 'List' },
      { key: 'E', label: 'Tree' },
      { key: 'M', label: 'Menu' },
      { key: 'J', label: 'Spacer' },
    ],
  },
];

function HelpModal({ onClose }: { onClose: () => void }) {
  useEscapeKey(onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-2xl p-6 w-[520px] max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-sm font-semibold mb-4">Keyboard Shortcuts</h2>

        <div className="grid grid-cols-2 gap-6">
          {SHORTCUT_GROUPS.map(group => (
            <div key={group.title}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">{group.title}</p>
              <div className="space-y-1">
                {group.shortcuts.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <kbd className="text-[10px] font-mono bg-muted border border-border rounded px-1.5 py-0.5 whitespace-nowrap">{key}</kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm hover:bg-accent rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── About modal ───────────────────────────────────────────────────────────────

function AboutModal({ onClose }: { onClose: () => void }) {
  useEscapeKey(onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-2xl p-8 w-96 flex flex-col items-center gap-4 text-center"
        onClick={e => e.stopPropagation()}
      >
        <img src="/favicon_white.svg" alt="TUIStudio" className="w-16 h-16" />
        <div>
          <h2 className="text-base font-semibold">TUIStudio</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">Terminal UI Design Tool</p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          A Figma-like visual editor for designing Terminal User Interface applications.
          Drag-and-drop components, edit properties visually, and export to multiple TUI frameworks.
        </p>
        <div className="text-xs text-muted-foreground">
          Made by <span className="text-foreground font-medium">Javier Alonso</span>
        </div>
        <a
          href="https://github.com/jalonsogo/tui-studio"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 rounded-lg text-sm font-medium transition-colors"
        >
          <Github className="w-4 h-4" />
          jalonsogo/tui-studio
        </a>
        <button
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ── Settings modal ────────────────────────────────────────────────────────────

function SettingsModal({ onClose }: { onClose: () => void }) {
  useEscapeKey(onClose);
  const themeStore = useThemeStore();

  const [accentPreset, setAccentPresetState] = useState<AccentPreset>(
    (localStorage.getItem('settings-accent-preset') as AccentPreset) || 'tuigreen'
  );
  const [customColor, setCustomColor] = useState(
    localStorage.getItem('settings-accent-custom') || '#4ade80'
  );
  const [folderName, setFolderName] = useState(getDownloadFolderName);

  const handlePresetClick = (preset: AccentPreset, hex?: string) => {
    setAccentPresetState(preset);
    applyAccentColor(preset, hex);
    if (preset !== 'custom') setCustomColor(hex || customColor);
  };

  const handleCustomColorChange = (color: string) => {
    const hex = resolveColorToHex(color, THEMES[themeStore.currentTheme as keyof typeof THEMES] || THEMES.dracula);
    setCustomColor(hex);
    setAccentPresetState('custom');
    applyAccentColor('custom', hex);
  };

  const handleSelectFolder = async () => {
    const name = await selectDownloadFolder();
    if (name) setFolderName(name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-2xl p-6 w-[480px] max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-sm font-semibold mb-5">Settings</h2>

        {/* Appearance */}
        <div className="mb-6">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            Appearance
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { if (themeStore.darkMode) themeStore.toggleDarkMode(); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                !themeStore.darkMode
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-input border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <Sun className="w-4 h-4" />
              Light
            </button>
            <button
              onClick={() => { if (!themeStore.darkMode) themeStore.toggleDarkMode(); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                themeStore.darkMode
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-input border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <Moon className="w-4 h-4" />
              Dark
            </button>
          </div>
        </div>

        {/* Download Folder */}
        <div className="mb-6">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            Default Download Folder
          </p>
          {isDirectoryPickerSupported() ? (
            <>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-1.5 bg-input border border-border/50 rounded text-sm text-muted-foreground truncate min-w-0">
                  {folderName || 'System default (Downloads)'}
                </div>
                <button
                  onClick={handleSelectFolder}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-accent border border-border/50 rounded text-sm transition-colors whitespace-nowrap"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  Browse…
                </button>
              </div>
              {folderName && (
                <button
                  onClick={() => {
                    localStorage.removeItem('settings-download-folder');
                    setFolderName('');
                  }}
                  className="mt-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Reset to default
                </button>
              )}
            </>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Folder selection requires Chrome or Edge. Files will save to your browser's Downloads folder.
            </p>
          )}
        </div>

        {/* Accent Color */}
        <div className="mb-6">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">
            Editor Accent Color
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {ACCENT_PRESETS.map(preset => (
              <button
                key={preset.value}
                onClick={() => handlePresetClick(preset.value, preset.hex)}
                title={preset.name}
                className="relative w-8 h-8 rounded-full border-2 transition-all"
                style={{
                  backgroundColor: preset.hex,
                  borderColor: accentPreset === preset.value ? 'white' : 'transparent',
                  outline: accentPreset === preset.value ? `2px solid ${preset.hex}` : 'none',
                  outlineOffset: '2px',
                }}
              >
                {accentPreset === preset.value && (
                  <Check className="w-3.5 h-3.5 absolute inset-0 m-auto" style={{ color: preset.fg === '0 0% 5%' ? '#000' : '#fff' }} />
                )}
              </button>
            ))}

            {/* Custom option */}
            <button
              onClick={() => {
                setAccentPresetState('custom');
                applyAccentColor('custom', customColor);
              }}
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-all ${
                accentPreset === 'custom'
                  ? 'border-white outline outline-2 outline-offset-2'
                  : 'border-border hover:border-border/80'
              }`}
              style={{
                background: accentPreset === 'custom' ? customColor : 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
                outlineColor: accentPreset === 'custom' ? customColor : 'transparent',
              }}
              title="Custom color"
            />
          </div>

          {/* Custom color picker */}
          {accentPreset === 'custom' && (
            <div className="pl-1">
              <ColorPicker
                value={customColor.startsWith('#') ? customColor : undefined}
                onChange={handleCustomColorChange}
                label="Custom accent color"
              />
            </div>
          )}

          {/* Preset name label */}
          <p className="text-[11px] text-muted-foreground mt-2">
            {accentPreset === 'custom'
              ? 'Custom'
              : ACCENT_PRESETS.find(p => p.value === accentPreset)?.name || ''
            }
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ── App menu (chevron dropdown next to logo) ─────────────────────────────────

const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
const mod = isMac ? '⌘' : 'Ctrl+';

function AppMenu() {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setHovered(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const close = () => { setOpen(false); setHovered(null); };

  const dispatch = (event: string) => { close(); window.dispatchEvent(new Event(event)); };

  const groups: Array<Array<{
    label: string;
    shortcut?: string;
    action?: () => void;
    submenu?: Array<{ label: string; shortcut?: string; action: () => void }>;
  }>> = [
    [
      { label: 'Command Palette', shortcut: `${mod}P`, action: () => dispatch('open-command-palette') },
    ],
    [
      {
        label: 'File',
        submenu: [
          { label: 'Open',   shortcut: `${mod}O`, action: () => { close(); openTuiFile(); } },
          { label: 'Save',   shortcut: `${mod}S`, action: () => { close(); window.dispatchEvent(new Event('open-save-dialog')); } },
          { label: 'Export', shortcut: `${mod}E`, action: () => dispatch('command-export') },
        ],
      },
      {
        label: 'Edit',
        submenu: [
          { label: 'Copy',  shortcut: `${mod}C`, action: () => dispatch('command-copy') },
          { label: 'Paste', shortcut: `${mod}V`, action: () => dispatch('command-paste') },
        ],
      },
    ],
    [
      { label: 'Settings', shortcut: `${mod}K`, action: () => dispatch('command-settings') },
    ],
    [
      {
        label: 'Help',
        submenu: [
          { label: 'Keyboard Shortcuts', shortcut: `${mod}?`, action: () => dispatch('command-help') },
          { label: 'About', action: () => dispatch('command-about') },
        ],
      },
    ],
  ];

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger */}
      <button
        onClick={() => { setOpen(o => !o); setHovered(null); }}
        className={`flex items-center p-1 rounded transition-colors ${open ? 'bg-accent' : 'hover:bg-accent'}`}
        title="Menu"
      >
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-popover border border-border rounded-lg shadow-2xl py-1 z-50 text-sm">
          {groups.map((group, gi) => (
            <div key={gi}>
              {gi > 0 && <div className="my-1 border-t border-border/40" />}
              {group.map((item) =>
                item.submenu ? (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => setHovered(item.label)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <div className={`flex items-center justify-between px-3 py-1.5 cursor-default transition-colors ${hovered === item.label ? 'bg-accent' : 'hover:bg-accent'}`}>
                      <span>{item.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    {hovered === item.label && (
                      <div className="absolute left-full top-0 w-48 bg-popover border border-border rounded-lg shadow-2xl py-1 z-50">
                        {item.submenu.map((sub) => (
                          <button
                            key={sub.label}
                            onClick={sub.action}
                            className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-accent transition-colors text-left"
                          >
                            <span>{sub.label}</span>
                            {sub.shortcut && <span className="text-xs text-muted-foreground">{sub.shortcut}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-accent transition-colors text-left"
                  >
                    <span>{item.label}</span>
                    {item.shortcut && <span className="text-xs text-muted-foreground">{item.shortcut}</span>}
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Toolbar() {
  const componentStore = useComponentStore();
  const canvasStore = useCanvasStore();
  const themeStore = useThemeStore();
  const [exportOpen, setExportOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isToolbarDocked, setIsToolbarDocked] = useState(() =>
    JSON.parse(localStorage.getItem('toolbar-docked') || 'false')
  );

  // Apply saved accent color on mount
  useEffect(() => {
    const preset = (localStorage.getItem('settings-accent-preset') as AccentPreset) || 'tuigreen';
    const custom = localStorage.getItem('settings-accent-custom') || '#4ade80';
    applyAccentColor(preset, custom);
  }, []);

  const canUndo = componentStore.historyIndex > 0;
  const canRedo = componentStore.historyIndex < componentStore.history.length - 1;

  // Listen for toolbar dock state changes
  useEffect(() => {
    const handleDockedChange = () => {
      setIsToolbarDocked(JSON.parse(localStorage.getItem('toolbar-docked') || 'false'));
    };
    window.addEventListener('toolbar-docked-changed', handleDockedChange);
    return () => window.removeEventListener('toolbar-docked-changed', handleDockedChange);
  }, []);

  // Listen for save dialog trigger (e.g. from Cmd+S keyboard shortcut)
  useEffect(() => {
    const handler = () => setSaveDialogOpen(true);
    window.addEventListener('open-save-dialog', handler);
    return () => window.removeEventListener('open-save-dialog', handler);
  }, []);

  // Listen for export trigger (e.g. from Cmd+E or app menu)
  useEffect(() => {
    const handler = () => setExportOpen(true);
    window.addEventListener('command-export', handler);
    return () => window.removeEventListener('command-export', handler);
  }, []);

  // Listen for about trigger from app menu
  useEffect(() => {
    const handler = () => setAboutOpen(true);
    window.addEventListener('command-about', handler);
    return () => window.removeEventListener('command-about', handler);
  }, []);

  // Listen for help trigger from app menu
  useEffect(() => {
    const handler = () => setHelpOpen(true);
    window.addEventListener('command-help', handler);
    return () => window.removeEventListener('command-help', handler);
  }, []);

  // Listen for settings trigger
  useEffect(() => {
    const handler = () => setSettingsOpen(true);
    window.addEventListener('command-settings', handler);
    return () => window.removeEventListener('command-settings', handler);
  }, []);

  return (
    <>
      <div className="h-14 px-4 flex items-center justify-between bg-background border-b border-border">
        {/* Left - Logo/Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5">
            <img src="/tui-studio.svg" alt="TUIStudio" className="w-7 h-7" />
            <AppMenu />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-none">TUIStudio</h1>
            <div className="text-[10px] text-muted-foreground mt-0.5">Terminal UI Design Tool</div>
          </div>
        </div>

      {/* Center - Tools */}
      <div className="flex items-center gap-2">
        {/* Component Toolbar (when docked) */}
        {isToolbarDocked && (
          <>
            <ComponentToolbar docked={true} />
            {/* Separator */}
            <div className="h-6 w-px bg-border" />
          </>
        )}

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => componentStore.undo()}
            disabled={!canUndo}
            className="p-2 hover:bg-accent rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Undo (Cmd+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => componentStore.redo()}
            disabled={!canRedo}
            className="p-2 hover:bg-accent rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Redo (Cmd+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1 bg-card rounded-lg px-1 py-0.5">
          <button
            onClick={() => canvasStore.setZoom(canvasStore.zoom - 0.25)}
            disabled={canvasStore.zoom <= 0.25}
            className="p-1.5 hover:bg-accent rounded-md disabled:opacity-30 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="min-w-[3.5rem] text-center text-xs font-medium px-1">
            {Math.round(canvasStore.zoom * 100)}%
          </span>
          <button
            onClick={() => canvasStore.setZoom(canvasStore.zoom + 0.25)}
            disabled={canvasStore.zoom >= 4}
            className="p-1.5 hover:bg-accent rounded-md disabled:opacity-30 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
        <button
          onClick={() => canvasStore.resetView()}
          className="px-2.5 py-1.5 text-xs hover:bg-accent rounded-lg transition-colors"
          title="Reset View"
        >
          Reset
        </button>

        {/* Grid */}
        <button
          onClick={() => canvasStore.toggleGrid()}
          className={`p-2 hover:bg-accent rounded-lg transition-colors ${
            canvasStore.showGrid ? 'bg-accent' : ''
          }`}
          title="Toggle Grid"
        >
          <Grid3x3 className="w-4 h-4" />
        </button>

        {/* Theme Selector */}
        <div className="flex items-center gap-2 bg-card rounded-lg px-2.5 py-1.5">
          <Palette className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={themeStore.currentTheme}
            onChange={(e) => themeStore.setTheme(e.target.value as any)}
            className="text-xs bg-transparent border-none outline-none cursor-pointer text-foreground"
            title="Color Theme"
          >
            {THEME_NAMES.map((theme) => (
              <option key={theme.value} value={theme.value} className="bg-card">
                {theme.label}
              </option>
            ))}
          </select>
        </div>

        {/* Command Palette */}
        <button
          onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
          title="Command Palette (Ctrl+P)"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSaveDialogOpen(true)}
          className="px-3 py-2 text-sm hover:bg-accent rounded-lg flex items-center gap-2 transition-colors"
          title="Save (Cmd+S)"
        >
          <Save className="w-4 h-4" />
          <span className="font-medium">Save</span>
        </button>
      </div>
    </div>

      {/* Export Modal */}
      <ExportModal isOpen={exportOpen} onClose={() => setExportOpen(false)} />

      {/* Save Dialog */}
      {saveDialogOpen && <SaveDialog onClose={() => setSaveDialogOpen(false)} />}

      {/* About Modal */}
      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}

      {/* Help Modal */}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}

      {/* Settings Modal */}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </>
  );
}
