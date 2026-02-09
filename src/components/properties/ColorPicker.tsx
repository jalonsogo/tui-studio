// Color picker with ANSI and hex support

import { useState } from 'react';
import { useThemeStore } from '../../stores';

const ANSI_COLORS = [
  { name: 'black', value: 'black' },
  { name: 'red', value: 'red' },
  { name: 'green', value: 'green' },
  { name: 'yellow', value: 'yellow' },
  { name: 'blue', value: 'blue' },
  { name: 'magenta', value: 'magenta' },
  { name: 'cyan', value: 'cyan' },
  { name: 'white', value: 'white' },
  { name: 'bright black', value: 'brightBlack' },
  { name: 'bright red', value: 'brightRed' },
  { name: 'bright green', value: 'brightGreen' },
  { name: 'bright yellow', value: 'brightYellow' },
  { name: 'bright blue', value: 'brightBlue' },
  { name: 'bright magenta', value: 'brightMagenta' },
  { name: 'bright cyan', value: 'brightCyan' },
  { name: 'bright white', value: 'brightWhite' },
];

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  label: string;
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const themeStore = useThemeStore();
  const [mode, setMode] = useState<'ansi' | 'hex'>(
    value?.startsWith('#') ? 'hex' : 'ansi'
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium">{label}</label>
        <div className="flex gap-1 text-xs">
          <button
            onClick={() => setMode('ansi')}
            className={`px-2 py-0.5 rounded ${
              mode === 'ansi' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
            }`}
          >
            ANSI
          </button>
          <button
            onClick={() => setMode('hex')}
            className={`px-2 py-0.5 rounded ${
              mode === 'hex' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
            }`}
          >
            Hex
          </button>
        </div>
      </div>

      {mode === 'ansi' ? (
        <div className="grid grid-cols-4 gap-1">
          {ANSI_COLORS.map((color) => {
            const hexColor = themeStore.ansiColors[color.value as keyof typeof themeStore.ansiColors];
            return (
              <button
                key={color.value}
                onClick={() => onChange(color.value)}
                className={`h-8 rounded border-2 ${
                  value === color.value ? 'border-primary' : 'border-border'
                }`}
                style={{ backgroundColor: hexColor }}
                title={color.name}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="color"
            value={value?.startsWith('#') ? value : '#ffffff'}
            onChange={(e) => onChange(e.target.value)}
            className="w-12 h-9 rounded border border-border cursor-pointer"
          />
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#ffffff"
            className="flex-1 px-3 py-2 bg-secondary border border-border rounded text-sm font-mono"
          />
        </div>
      )}
    </div>
  );
}
