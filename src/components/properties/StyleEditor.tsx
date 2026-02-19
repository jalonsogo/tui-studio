// Style property editor

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useComponentStore } from '../../stores';
import type { ComponentNode } from '../../types';
import { ColorPicker } from './ColorPicker';

interface StyleEditorProps {
  component: ComponentNode;
}

const sectionLabel = 'text-[9px] text-muted-foreground uppercase tracking-wide';
const fieldLabel   = 'text-[9px] text-muted-foreground block mb-0.5 uppercase tracking-wide';
const inputCls     = 'w-full px-1.5 py-0.5 bg-input border border-border/50 rounded text-[11px] focus:border-primary focus:outline-none';
const selectCls    = 'w-full px-1.5 py-0.5 bg-input border border-border/50 rounded text-[11px] focus:border-primary focus:outline-none';

function Checkbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
        checked ? 'bg-primary border-primary' : 'bg-input border-border/50 hover:border-primary/50'
      }`}
    >
      {checked && <div className="w-2 h-2 bg-primary-foreground rounded-sm" />}
    </button>
  );
}

// ─── Collapsible section ──────────────────────────────────────────────────────

function Section({
  id, label, open, onToggle, children,
}: {
  id: string;
  label: string;
  open: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex items-center gap-1 w-full py-1.5 group"
      >
        <ChevronDown
          size={10}
          className={`text-muted-foreground transition-transform flex-shrink-0 ${open ? '' : '-rotate-90'}`}
        />
        <span className={`${sectionLabel} group-hover:text-foreground transition-colors`}>
          {label}
        </span>
        <div className="flex-1 ml-2 h-px bg-border/40" />
      </button>

      {open && <div className="space-y-2 pb-2">{children}</div>}
    </div>
  );
}

// ─── Border sides grid ────────────────────────────────────────────────────────

type BorderStyleValue = 'single' | 'double' | 'rounded' | 'bold';

const BORDER_SIDES = [
  { key: 'borderTop'    as const, styleKey: 'borderTopStyle'    as const, icon: '↑', chars: { single:'─', double:'═', bold:'━', rounded:'─' } },
  { key: 'borderRight'  as const, styleKey: 'borderRightStyle'  as const, icon: '→', chars: { single:'│', double:'║', bold:'┃', rounded:'│' } },
  { key: 'borderBottom' as const, styleKey: 'borderBottomStyle' as const, icon: '↓', chars: { single:'─', double:'═', bold:'━', rounded:'─' } },
  { key: 'borderLeft'   as const, styleKey: 'borderLeftStyle'   as const, icon: '←', chars: { single:'│', double:'║', bold:'┃', rounded:'│' } },
];

function BorderSidesGrid({
  component,
  updateStyle,
}: {
  component: ComponentNode;
  updateStyle: (u: Partial<ComponentNode['style']>) => void;
}) {
  const globalStyle = (component.style.borderStyle || 'single') as BorderStyleValue;

  return (
    <div className="grid grid-cols-2 gap-1">
      {BORDER_SIDES.map(({ key, styleKey, icon, chars }) => {
        const isActive   = component.style[key] !== false;
        const sideStyle  = (component.style[styleKey] ?? globalStyle) as BorderStyleValue;
        const activeChar = chars[sideStyle] ?? chars.single;

        return (
          <div key={key} className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground font-mono w-4 text-center flex-shrink-0">
              {icon}
            </span>
            <div className={`flex-1 py-0.5 px-1.5 rounded border flex items-center gap-1 transition-colors ${
              isActive ? 'bg-input border-border/50' : 'bg-input/40 border-border/20'
            }`}>
              <Checkbox
                checked={isActive}
                onChange={(v) => updateStyle({ [key]: v })}
              />
              <select
                value={sideStyle}
                disabled={!isActive}
                onChange={(e) => updateStyle({ [styleKey]: e.target.value as BorderStyleValue })}
                className="flex-1 min-w-0 bg-transparent text-[11px] font-mono text-muted-foreground focus:outline-none disabled:opacity-30 cursor-pointer"
              >
                <option value="single">─ single</option>
                <option value="double">{icon === '↑' || icon === '↓' ? '═' : '║'} double</option>
                <option value="bold">{icon === '↑' || icon === '↓' ? '━' : '┃'} bold</option>
                <option value="rounded">╌ rounded</option>
              </select>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main editor ──────────────────────────────────────────────────────────────

export function StyleEditor({ component }: StyleEditorProps) {
  const componentStore = useComponentStore();
  const [open, setOpen] = useState<Set<string>>(new Set(['border', 'colors']));

  const toggle = (id: string) =>
    setOpen(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const updateStyle = (updates: Partial<ComponentNode['style']>) =>
    componentStore.updateStyle(component.id, updates);

  return (
    <div>
      {/* ── Border ── */}
      <Section id="border" label="Border" open={open.has('border')} onToggle={toggle}>
        {/* On/off + style row */}
        <div className="flex items-center gap-2">
          <Checkbox
            checked={component.style.border || false}
            onChange={(v) => updateStyle({ border: v })}
          />
          <select
            value={component.style.borderStyle || 'single'}
            onChange={(e) => updateStyle({ borderStyle: e.target.value as any })}
            disabled={!component.style.border}
            className={selectCls + ' disabled:opacity-40'}
          >
            <option value="single">Single  ─ │</option>
            <option value="double">Double  ═ ║</option>
            <option value="rounded">Rounded ╭ ╮</option>
            <option value="bold">Bold    ━ ┃</option>
          </select>
        </div>

        {/* Color */}
        <ColorPicker
          label="Color"
          value={component.style.borderColor}
          onChange={(color) => updateStyle({ borderColor: color })}
        />

        {/* Sides */}
        <div>
          <span className={fieldLabel}>Sides</span>
          <BorderSidesGrid component={component} updateStyle={updateStyle} />
        </div>

        {/* Corners */}
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={component.style.borderCorners !== false}
            onChange={(v) => updateStyle({ borderCorners: v })}
          />
          <span className="text-[11px]">Corners</span>
          <span className="text-muted-foreground font-mono text-[10px] ml-auto">
            {component.style.borderCorners !== false ? '┌ ┐' : '──'}
          </span>
        </label>
      </Section>

      {/* ── Colors ── */}
      <Section id="colors" label="Colors" open={open.has('colors')} onToggle={toggle}>
        <ColorPicker
          label="Text"
          value={component.style.color}
          onChange={(color) => updateStyle({ color })}
        />

        <ColorPicker
          label="Background"
          value={component.style.backgroundColor}
          onChange={(color) => updateStyle({ backgroundColor: color, backgroundGradient: undefined })}
          gradient={component.style.backgroundGradient}
          onGradientChange={(g) => updateStyle({ backgroundGradient: g, backgroundColor: g ? undefined : component.style.backgroundColor })}
        />

        {/* Text style buttons */}
        <div className="flex items-center gap-1">
          {([
            { key: 'bold',          label: 'B', title: 'Bold',          cls: 'font-bold' },
            { key: 'italic',        label: 'I', title: 'Italic',        cls: 'italic' },
            { key: 'underline',     label: 'U', title: 'Underline',     cls: 'underline' },
            { key: 'strikethrough', label: 'S', title: 'Strikethrough', cls: 'line-through' },
          ] as const).map(({ key, label, title, cls }) => (
            <button
              key={key}
              type="button"
              onClick={() => updateStyle({ [key]: !component.style[key] })}
              title={title}
              className={`w-7 h-7 flex items-center justify-center rounded text-xs border transition-colors ${
                component.style[key]
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-input border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <span className={cls}>{label}</span>
            </button>
          ))}
        </div>

        {/* Opacity */}
        <div>
          <span className={fieldLabel}>
            Opacity — {((component.style.opacity ?? 1) * 100).toFixed(0)}%
          </span>
          <input
            type="range"
            min="0" max="1" step="0.1"
            value={component.style.opacity ?? 1}
            onChange={(e) => updateStyle({ opacity: parseFloat(e.target.value) })}
            className="w-full h-1 accent-primary"
          />
        </div>

        {/* Shadow */}
        <label className="flex items-center gap-2 text-[11px] cursor-pointer">
          <Checkbox
            checked={component.style.shadow || false}
            onChange={(v) => updateStyle({ shadow: v })}
          />
          Drop Shadow
        </label>
      </Section>
    </div>
  );
}
