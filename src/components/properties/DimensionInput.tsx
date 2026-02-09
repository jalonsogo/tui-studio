// Dimension input with auto/fill/number support

interface DimensionInputProps {
  value: number | 'auto' | 'fill' | undefined;
  onChange: (value: number | 'auto' | 'fill') => void;
  label: string;
  min?: number;
  max?: number;
}

export function DimensionInput({ value, onChange, label, min = 0, max = 1000 }: DimensionInputProps) {
  const currentType = typeof value === 'number' ? 'number' : value || 'auto';
  const currentValue = typeof value === 'number' ? value : 0;

  return (
    <div>
      <label className="text-sm font-medium mb-2 block">{label}</label>
      <div className="flex gap-2">
        <select
          value={currentType === 'number' ? 'number' : currentType}
          onChange={(e) => {
            const newType = e.target.value;
            if (newType === 'auto') onChange('auto');
            else if (newType === 'fill') onChange('fill');
            else onChange(currentValue || 10);
          }}
          className="px-2 py-2 bg-secondary border border-border rounded text-sm"
        >
          <option value="number">px</option>
          <option value="auto">auto</option>
          <option value="fill">fill</option>
        </select>
        {currentType === 'number' && (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val)) {
                onChange(Math.max(min, Math.min(max, val)));
              }
            }}
            min={min}
            max={max}
            className="flex-1 px-3 py-2 bg-secondary border border-border rounded text-sm"
          />
        )}
      </div>
    </div>
  );
}
