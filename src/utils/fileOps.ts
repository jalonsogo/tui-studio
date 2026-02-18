// Save and open .tui files

import { useComponentStore } from '../stores/componentStore';
import { useThemeStore } from '../stores/themeStore';
import { useSelectionStore } from '../stores/selectionStore';

/** Build the JSON payload + suggested filename from current store state. */
export function buildTuiData(): { json: string; suggestedName: string } | null {
  const root = useComponentStore.getState().root;
  if (!root) return null;
  const theme = useThemeStore.getState().currentTheme;
  const data = {
    version: '1',
    meta: { name: root.name, theme, savedAt: new Date().toISOString() },
    tree: root,
  };
  return {
    json: JSON.stringify(data, null, 2),
    suggestedName: `${root.name.toLowerCase().replace(/\s+/g, '-')}.tui`,
  };
}

/**
 * Save a JSON payload to disk.
 * Must be called directly from a button click so showSaveFilePicker can get
 * the browser's user-activation token. Falls back to a plain download.
 */
export async function saveTuiData(json: string, filename: string): Promise<void> {
  if ('showSaveFilePicker' in window) {
    try {
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        startIn: 'downloads',
        types: [{ description: 'TUI Studio File', accept: { 'application/json': ['.tui'] } }],
      });
      const writable = await fileHandle.createWritable();
      await writable.write(json);
      await writable.close();
      return;
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      // fall through to download on unexpected errors
    }
  }
  // Fallback: trigger browser download
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function openTuiFile(): Promise<void> {
  const load = (text: string) => {
    try {
      const data = JSON.parse(text);
      if (data.version === '1' && data.tree) {
        useComponentStore.getState().setRoot(data.tree);
        if (data.meta?.theme) useThemeStore.getState().setTheme(data.meta.theme);
        useSelectionStore.getState().clearSelection();
      } else {
        alert('Invalid .tui file');
      }
    } catch {
      alert('Invalid .tui file');
    }
  };

  if ('showOpenFilePicker' in window) {
    try {
      const [fileHandle] = await (window as any).showOpenFilePicker({
        types: [{ description: 'TUI Studio File', accept: { 'application/json': ['.tui'] } }],
        multiple: false,
      });
      load(await (await fileHandle.getFile()).text());
    } catch (err) {
      if ((err as Error).name !== 'AbortError') alert('Failed to open file');
    }
  } else {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.tui,application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) load(await file.text());
    };
    input.click();
  }
}
