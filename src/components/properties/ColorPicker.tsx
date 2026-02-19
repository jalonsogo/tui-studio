// Color picker with ANSI, RGB, and Gradient support

import { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Minus, Plus, Trash2 } from 'lucide-react';
import { useThemeStore } from '../../stores';
import { THEMES } from '../../stores/themeStore';
import type { GradientConfig, GradientStop } from '../../types';

const ANSI_COLORS = [
  { name: 'Black',          value: 'black' },
  { name: 'Red',            value: 'red' },
  { name: 'Green',          value: 'green' },
  { name: 'Yellow',         value: 'yellow' },
  { name: 'Blue',           value: 'blue' },
  { name: 'Magenta',        value: 'magenta' },
  { name: 'Cyan',           value: 'cyan' },
  { name: 'White',          value: 'white' },
  { name: 'Bright Black',   value: 'brightBlack' },
  { name: 'Bright Red',     value: 'brightRed' },
  { name: 'Bright Green',   value: 'brightGreen' },
  { name: 'Bright Yellow',  value: 'brightYellow' },
  { name: 'Bright Blue',    value: 'brightBlue' },
  { name: 'Bright Magenta', value: 'brightMagenta' },
  { name: 'Bright Cyan',    value: 'brightCyan' },
  { name: 'Bright White',   value: 'brightWhite' },
];

type ColorTab = 'ansi' | 'rgb' | 'gradient';

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  label: string;
  /** Present only when gradient support is desired (e.g. Background field) */
  gradient?: GradientConfig;
  onGradientChange?: (gradient: GradientConfig | undefined) => void;
}

function buildCssGradient(g: GradientConfig): string {
  const sorted = [...g.stops].sort((a, b) => a.position - b.position);
  const stops = sorted.map(s => `${s.color} ${s.position}%`).join(', ');
  return `linear-gradient(${g.angle}deg, ${stops})`;
}

const DEFAULT_GRADIENT: GradientConfig = {
  type: 'linear',
  angle: 90,
  stops: [
    { color: '#4facfe', position: 0 },
    { color: '#a855f7', position: 50 },
    { color: '#00f2fe', position: 100 },
  ],
};

export function ColorPicker({ value, onChange, label, gradient, onGradientChange }: ColorPickerProps) {
  const themeStore = useThemeStore();
  const supportsGradient = !!onGradientChange;

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ColorTab>(() =>
    gradient ? 'gradient' : 'ansi'
  );
  const [hexFocused, setHexFocused] = useState(false);
  const [hexText, setHexText] = useState('');
  const [searchKey, setSearchKey] = useState('');
  const [searchIndex, setSearchIndex] = useState(0);
  const savedColorRef = useRef<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const activeTheme = THEMES[themeStore.currentTheme as keyof typeof THEMES] || THEMES.dracula;

  // Sync tab when gradient prop changes (e.g. switching selected node)
  useEffect(() => {
    if (gradient) setActiveTab('gradient');
    else if (activeTab === 'gradient') setActiveTab('ansi');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradient]);

  // Resolve any color value → hex string
  const resolveHex = (v: string | undefined): string => {
    if (!v) return '';
    if (v.startsWith('#')) return v.slice(1).toUpperCase();
    const resolved = activeTheme[v as keyof typeof activeTheme];
    return resolved ? resolved.replace('#', '').toUpperCase() : '';
  };

  const derivedHex = resolveHex(value);
  const swatchHex = value
    ? (value.startsWith('#') ? value : (activeTheme[value as keyof typeof activeTheme] || null))
    : null;
  const swatchColor = swatchHex || 'hsl(var(--foreground))';

  const hexDisplay = hexFocused ? hexText : derivedHex;

  const handleHexFocus = () => { setHexText(derivedHex); setHexFocused(true); };
  const handleHexBlur = () => setHexFocused(false);
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 6);
    setHexText(v);
    if (v.length === 6) onChange('#' + v);
  };

  const handleEyeToggle = () => {
    if (value) { savedColorRef.current = value; onChange(''); }
    else onChange(savedColorRef.current || '');
  };

  const handlePopupKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation(); setIsOpen(false); return;
    }
    if (activeTab !== 'ansi') return;
    const key = e.key.toLowerCase();
    if (!/^[a-z]$/.test(key)) return;
    e.preventDefault(); e.stopPropagation();

    const matches = ANSI_COLORS.filter(c => c.name.toLowerCase().startsWith(key));
    if (matches.length === 0) return;

    let idx = 0;
    if (key === searchKey) idx = (searchIndex + 1) % matches.length;
    setSearchKey(key); setSearchIndex(idx);

    const chosen = matches[idx];
    onChange(chosen.value);
    const el = listRef.current?.querySelector(`[data-color="${chosen.value}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  };

  // When switching away from gradient tab, clear the gradient
  const handleTabChange = (tab: ColorTab) => {
    setActiveTab(tab);
    if (tab !== 'gradient' && gradient && onGradientChange) {
      onGradientChange(undefined);
    }
    if (tab === 'gradient' && onGradientChange) {
      onGradientChange(gradient ?? DEFAULT_GRADIENT);
    }
  };

  useEffect(() => {
    if (!isOpen) { setSearchKey(''); setSearchIndex(0); }
    else setTimeout(() => (dropdownRef.current?.querySelector('[tabindex="-1"]') as HTMLElement)?.focus(), 0);
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isGradientActive = supportsGradient && !!gradient;

  return (
    <div ref={dropdownRef} className="relative">
      <span className="text-[9px] text-muted-foreground block mb-0.5 uppercase tracking-wide">
        {label}
      </span>

      <div className="flex items-center gap-1 h-6">
        {/* Swatch */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title="Choose color"
          className="w-5 h-5 rounded-sm border border-border/50 flex-shrink-0 overflow-hidden relative"
        >
          <div
            className="absolute inset-0"
            style={isGradientActive
              ? { background: buildCssGradient(gradient!) }
              : { backgroundColor: swatchColor, opacity: swatchHex ? 1 : 0.45 }
            }
          />
        </button>

        {/* Hex input / gradient label */}
        {isGradientActive ? (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex-1 min-w-0 px-1.5 py-0.5 bg-input border border-border/50 rounded text-[11px] font-mono text-muted-foreground text-left truncate focus:border-primary focus:outline-none"
          >
            gradient {gradient!.angle}°
          </button>
        ) : (
          <input
            type="text"
            value={hexDisplay}
            placeholder="default"
            maxLength={6}
            onFocus={handleHexFocus}
            onBlur={handleHexBlur}
            onChange={handleHexChange}
            className="flex-1 min-w-0 px-1.5 py-0.5 bg-input border border-border/50 rounded text-[11px] font-mono focus:border-primary focus:outline-none"
          />
        )}

        {!isGradientActive && (
          <>
            <span className="text-[11px] font-mono text-foreground/70 flex-shrink-0 w-6 text-right">100</span>
            <span className="text-[10px] text-muted-foreground flex-shrink-0">%</span>
          </>
        )}

        {/* Eye toggle (only for solid) */}
        {!isGradientActive && (
          <button type="button" onClick={handleEyeToggle} title={value ? 'Hide color' : 'Restore color'}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors">
            {value ? <Eye size={11} /> : <EyeOff size={11} />}
          </button>
        )}

        {/* Clear */}
        <button type="button"
          onClick={() => { onChange(''); if (isGradientActive && onGradientChange) onGradientChange(undefined); }}
          title="Remove color"
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors">
          <Minus size={11} />
        </button>
      </div>

      {/* Popup */}
      {isOpen && (
        <div
          className="absolute z-50 left-0 mt-1 bg-popover border border-border rounded-md flex flex-col"
          style={{ top: '100%', width: activeTab === 'gradient' ? '280px' : '192px' }}
          tabIndex={-1}
          onKeyDown={handlePopupKeyDown}
        >
          {/* Tabs */}
          <div className="flex border-b border-border bg-secondary/50">
            {(['ansi', 'rgb', ...(supportsGradient ? ['gradient'] : [])] as ColorTab[]).map((tab) => (
              <button key={tab} type="button" onClick={() => handleTabChange(tab)}
                className={`flex-1 px-2 py-1.5 text-[10px] font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-background border-b-2 border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}>
                {tab === 'ansi' ? 'ANSI' : tab === 'rgb' ? 'RGB' : 'Gradient'}
              </button>
            ))}
          </div>

          <div ref={listRef} className={activeTab === 'gradient' ? '' : 'overflow-y-auto max-h-72'}>
            {/* None option (solid tabs only) */}
            {activeTab !== 'gradient' && (
              <button type="button" onClick={() => { onChange(''); setIsOpen(false); }}
                className="w-full px-2 py-1.5 text-xs flex items-center gap-2 hover:bg-accent transition-colors text-left border-b border-border">
                <div className="w-4 h-4 rounded-sm border border-border flex-shrink-0"
                  style={{ background: 'repeating-conic-gradient(#555 0% 25%, #333 0% 50%) 0 0 / 4px 4px' }} />
                <span>None</span>
              </button>
            )}

            {/* ANSI tab */}
            {activeTab === 'ansi' && ANSI_COLORS.map((color) => {
              const hex = activeTheme[color.value as keyof typeof activeTheme];
              const isActive = value === color.value;
              return (
                <button key={color.value} data-color={color.value} type="button"
                  onClick={() => { onChange(color.value); setIsOpen(false); }}
                  className={`w-full px-2 py-1.5 text-xs flex items-center gap-2 hover:bg-accent transition-colors text-left ${isActive ? 'bg-accent ring-1 ring-inset ring-primary' : ''}`}>
                  <div className="w-4 h-4 rounded-sm border border-border flex-shrink-0" style={{ backgroundColor: hex }} />
                  <span>{color.name}</span>
                  {isActive && (
                    <span className="ml-auto text-[9px] text-primary font-mono uppercase">
                      {searchKey && color.name.toLowerCase().startsWith(searchKey)
                        ? `${ANSI_COLORS.filter(c => c.name.toLowerCase().startsWith(searchKey)).findIndex(c => c.value === color.value) + 1}/${ANSI_COLORS.filter(c => c.name.toLowerCase().startsWith(searchKey)).length}`
                        : ''}
                    </span>
                  )}
                </button>
              );
            })}

            {/* RGB tab */}
            {activeTab === 'rgb' && (
              <div className="p-3 space-y-3">
                <div className="flex gap-2 items-center">
                  <input type="color"
                    value={value?.startsWith('#') ? value : '#ffffff'}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-10 h-8 rounded border border-border cursor-pointer" />
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground mb-1 block">Hex</label>
                    <input type="text"
                      value={value?.startsWith('#') ? value : ''}
                      onChange={(e) => { if (e.target.value.startsWith('#') || e.target.value === '') onChange(e.target.value); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') setIsOpen(false); }}
                      placeholder="#ffffff"
                      className="w-full px-1.5 py-0.5 bg-input border border-border/50 rounded text-[10px] font-mono focus:border-primary focus:outline-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <RGBSlider label="R" color="red"   value={value} onChange={onChange} />
                  <RGBSlider label="G" color="green" value={value} onChange={onChange} />
                  <RGBSlider label="B" color="blue"  value={value} onChange={onChange} />
                </div>
                <button type="button" onClick={() => setIsOpen(false)}
                  className="w-full px-2 py-1 bg-primary text-primary-foreground rounded text-xs">
                  Done
                </button>
              </div>
            )}

            {/* Gradient tab */}
            {activeTab === 'gradient' && onGradientChange && (
              <GradientEditor
                gradient={gradient ?? DEFAULT_GRADIENT}
                onChange={onGradientChange}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Gradient Editor ──────────────────────────────────────────────────────────

function GradientEditor({
  gradient,
  onChange,
}: {
  gradient: GradientConfig;
  onChange: (g: GradientConfig) => void;
}) {
  const sorted = [...gradient.stops].sort((a, b) => a.position - b.position);

  const updateStop = (index: number, partial: Partial<GradientStop>) => {
    const stops = gradient.stops.map((s, i) => i === index ? { ...s, ...partial } : s);
    onChange({ ...gradient, stops });
  };

  const addStop = () => {
    // Insert a new stop at the midpoint between the last two stops
    const s = [...gradient.stops].sort((a, b) => a.position - b.position);
    const last = s[s.length - 1];
    const prev = s[s.length - 2] ?? { position: 0 };
    const pos = Math.round((last.position + prev.position) / 2);
    const newStop: GradientStop = { color: '#ffffff', position: pos };
    onChange({ ...gradient, stops: [...gradient.stops, newStop] });
  };

  const removeStop = (index: number) => {
    if (gradient.stops.length <= 2) return; // minimum 2 stops
    onChange({ ...gradient, stops: gradient.stops.filter((_, i) => i !== index) });
  };

  const cssGradient = buildCssGradient(gradient);

  return (
    <div className="p-3 space-y-3">
      {/* Preview */}
      <div className="w-full h-6 rounded border border-border" style={{ background: cssGradient }} />

      {/* Angle */}
      <div>
        <label className="text-[10px] text-muted-foreground mb-1 block">Angle — {gradient.angle}°</label>
        <div className="flex items-center gap-2">
          <input type="range" min="0" max="360" value={gradient.angle}
            onChange={(e) => onChange({ ...gradient, angle: parseInt(e.target.value) })}
            className="flex-1 h-1 accent-primary" />
          <input type="number" min="0" max="360" value={gradient.angle}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              if (!isNaN(v)) onChange({ ...gradient, angle: ((v % 360) + 360) % 360 });
            }}
            className="w-12 px-1 py-0.5 bg-input border border-border/50 rounded text-[10px] text-center focus:border-primary focus:outline-none" />
        </div>
      </div>

      {/* Color stops */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] text-muted-foreground">Stops ({gradient.stops.length})</label>
          <button type="button" onClick={addStop}
            className="flex items-center gap-0.5 text-[10px] text-primary hover:text-primary/80 transition-colors">
            <Plus size={10} /> Add
          </button>
        </div>

        <div className="space-y-1.5">
          {sorted.map((stop, sortedIdx) => {
            // Find original index for updates/deletes
            const origIdx = gradient.stops.findIndex(s => s === stop);
            return (
              <div key={sortedIdx} className="flex items-center gap-1.5">
                {/* Color input */}
                <input type="color" value={stop.color}
                  onChange={(e) => updateStop(origIdx, { color: e.target.value })}
                  className="w-7 h-6 rounded border border-border cursor-pointer flex-shrink-0 p-0.5 bg-input" />

                {/* Hex display */}
                <span className="text-[10px] font-mono text-muted-foreground w-14 flex-shrink-0">
                  {stop.color.toUpperCase()}
                </span>

                {/* Position */}
                <input type="range" min="0" max="100" value={stop.position}
                  onChange={(e) => updateStop(origIdx, { position: parseInt(e.target.value) })}
                  className="flex-1 h-1 accent-primary" />

                <input type="number" min="0" max="100" value={stop.position}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v) && v >= 0 && v <= 100) updateStop(origIdx, { position: v });
                  }}
                  className="w-9 px-1 py-0.5 bg-input border border-border/50 rounded text-[10px] text-center focus:border-primary focus:outline-none flex-shrink-0" />

                <span className="text-[9px] text-muted-foreground flex-shrink-0">%</span>

                {/* Delete */}
                <button type="button" onClick={() => removeStop(origIdx)}
                  disabled={gradient.stops.length <= 2}
                  title="Remove stop"
                  className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  <Trash2 size={10} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── RGB Slider ───────────────────────────────────────────────────────────────

function RGBSlider({
  label, color, value, onChange,
}: {
  label: string;
  color: 'red' | 'green' | 'blue';
  value?: string;
  onChange: (color: string) => void;
}) {
  const getRGB = () => {
    if (!value?.startsWith('#')) return { r: 255, g: 255, b: 255 };
    const hex = value.slice(1);
    return {
      r: parseInt(hex.slice(0, 2), 16) || 0,
      g: parseInt(hex.slice(2, 4), 16) || 0,
      b: parseInt(hex.slice(4, 6), 16) || 0,
    };
  };

  const rgb = getRGB();
  const current = color === 'red' ? rgb.r : color === 'green' ? rgb.g : rgb.b;

  const handleChange = (v: number) => {
    const n = { ...rgb };
    if (color === 'red') n.r = v;
    if (color === 'green') n.g = v;
    if (color === 'blue') n.b = v;
    onChange(`#${n.r.toString(16).padStart(2, '0')}${n.g.toString(16).padStart(2, '0')}${n.b.toString(16).padStart(2, '0')}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-[10px] font-medium w-3">{label}</label>
      <input type="range" min="0" max="255" value={current}
        onChange={(e) => handleChange(parseInt(e.target.value))}
        className="flex-1 h-1" />
      <input type="number" min="0" max="255" value={current}
        onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 0 && v <= 255) handleChange(v); }}
        className="w-10 px-1 py-0.5 bg-input border border-border/50 rounded text-[10px] text-center focus:border-primary focus:outline-none" />
    </div>
  );
}
