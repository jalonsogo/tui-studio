// Export panel for previewing and exporting TUI designs

import { useState } from 'react';
import { Download, Copy, Eye } from 'lucide-react';
import { useComponentStore, useCanvasStore } from '../../stores';
import { exportToText, exportToCode, exportToHtmlFile, ansiToHtml } from '../../utils/export';
// ExportFormat is typed as an interface but used as a string in the codebase
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CodeFormat = any;

type ExportMode = 'preview' | 'text' | 'code';

export function ExportPanel() {
  const componentStore = useComponentStore();
  const canvasStore = useCanvasStore();

  const [mode, setMode] = useState<ExportMode>('preview');
  const [textFormat, setTextFormat] = useState<'text' | 'ansi' | 'ansi256' | 'trueColor'>('ansi');
  const [codeFormat, setCodeFormat] = useState('opentui');
  const [copied, setCopied] = useState(false);

  const getOutput = () => {
    if (mode === 'code') {
      if (codeFormat === 'html') {
        return exportToHtmlFile(componentStore.root, canvasStore.width, canvasStore.height);
      }
      return exportToCode(componentStore.root, codeFormat as CodeFormat);
    }
    return exportToText(componentStore.root, {
      format: textFormat,
      width: canvasStore.width,
      height: canvasStore.height,
    });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getOutput());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const output = mode === 'code'
      ? (codeFormat === 'html'
          ? exportToHtmlFile(componentStore.root, canvasStore.width, canvasStore.height)
          : exportToCode(componentStore.root, codeFormat as CodeFormat))
      : exportToText(componentStore.root, {
          format: textFormat,
          width: canvasStore.width,
          height: canvasStore.height,
          includeMetadata: true,
        });

    const extension = mode === 'code' ? getCodeExtension(codeFormat) : '.txt';
    const filename = `tui-design${extension}`;
    const mimeType = codeFormat === 'html' && mode === 'code' ? 'text/html' : 'text/plain';

    const blob = new Blob([output], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
          Export
        </h2>

        {/* Mode Selection */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('preview')}
            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
              mode === 'preview'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary hover:bg-secondary/80'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-1" />
            Preview
          </button>
          <button
            onClick={() => setMode('text')}
            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
              mode === 'text'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary hover:bg-secondary/80'
            }`}
          >
            Text/ANSI
          </button>
          <button
            onClick={() => setMode('code')}
            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
              mode === 'code'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary hover:bg-secondary/80'
            }`}
          >
            Code
          </button>
        </div>

        {/* Format Options */}
        {mode === 'text' && (
          <div>
            <label className="text-sm font-medium mb-2 block">Text Format</label>
            <select
              value={textFormat}
              onChange={(e) => setTextFormat(e.target.value as 'text' | 'ansi' | 'ansi256' | 'trueColor')}
              className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
            >
              <option value="text">Plain Text</option>
              <option value="ansi">ANSI 16 Colors</option>
              <option value="ansi256">ANSI 256 Colors</option>
              <option value="trueColor">True Color (24-bit)</option>
            </select>
          </div>
        )}

        {mode === 'code' && (
          <div>
            <label className="text-sm font-medium mb-2 block">Framework</label>
            <select
              value={codeFormat}
              onChange={(e) => setCodeFormat(e.target.value)}
              className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm"
            >
              <option value="opentui">OpenTUI (React)</option>
              <option value="ink">Ink (React)</option>
              <option value="bubbletea">Bubble Tea (Go)</option>
              <option value="blessed">Blessed (Node.js)</option>
              <option value="textual">Textual (Python)</option>
              <option value="html">HTML + CSS</option>
            </select>
          </div>
        )}
      </div>

      {/* Preview/Output */}
      <div className="flex-1 overflow-auto p-4">
        {mode === 'preview' && <PreviewOutput />}
        {mode === 'text' && (
          <TextOutput format={textFormat} width={canvasStore.width} height={canvasStore.height} />
        )}
        {mode === 'code' && <CodeOutput format={codeFormat} />}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <button
          onClick={handleCopy}
          className="w-full px-3 py-2 bg-secondary hover:bg-secondary/80 rounded text-sm font-medium flex items-center justify-center gap-2"
        >
          <Copy className="w-4 h-4" />
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
        <button
          onClick={handleDownload}
          className="w-full px-3 py-2 bg-primary hover:bg-primary/80 text-primary-foreground rounded text-sm font-medium flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download File
        </button>
      </div>
    </div>
  );
}

function PreviewOutput() {
  const componentStore = useComponentStore();
  const canvasStore = useCanvasStore();

  const ansiOutput = exportToText(componentStore.root, {
    format: 'ansi',
    width: canvasStore.width,
    height: canvasStore.height,
  });

  const html = ansiToHtml(ansiOutput);

  return (
    <div
      className="text-xs font-mono bg-black text-[#cccccc] p-4 rounded overflow-auto leading-[1.4] border border-border"
      style={{ fontFamily: "'Courier New', Consolas, Monaco, monospace", whiteSpace: 'pre' }}
      dangerouslySetInnerHTML={{ __html: html || 'No components to preview' }}
    />
  );
}

function TextOutput({ format, width, height }: { format: string; width: number; height: number }) {
  const componentStore = useComponentStore();

  if (format === 'text') {
    const output = exportToText(componentStore.root, { format: 'text', width, height });
    return (
      <pre className="text-xs font-mono bg-secondary p-4 rounded overflow-auto whitespace-pre border border-border">
        {output || 'No components to export'}
      </pre>
    );
  }

  // For ANSI formats, show a visual (HTML) representation
  const ansiOutput = exportToText(componentStore.root, {
    format: format as 'ansi' | 'ansi256' | 'trueColor',
    width,
    height,
  });
  const html = ansiToHtml(ansiOutput);

  return (
    <div
      className="text-xs font-mono bg-black text-[#cccccc] p-4 rounded overflow-auto leading-[1.4] border border-border"
      style={{ fontFamily: "'Courier New', Consolas, Monaco, monospace", whiteSpace: 'pre' }}
      dangerouslySetInnerHTML={{ __html: html || 'No components to export' }}
    />
  );
}

function CodeOutput({ format }: { format: string }) {
  const componentStore = useComponentStore();
  const canvasStore = useCanvasStore();

  const output = format === 'html'
    ? exportToHtmlFile(componentStore.root, canvasStore.width, canvasStore.height)
    : exportToCode(componentStore.root, format as CodeFormat);

  return (
    <pre className="text-xs font-mono bg-secondary p-4 rounded overflow-auto border border-border">
      {output}
    </pre>
  );
}

function getCodeExtension(format: string): string {
  switch (format) {
    case 'opentui':
    case 'ink':
      return '.tsx';
    case 'bubbletea':
      return '.go';
    case 'blessed':
      return '.js';
    case 'textual':
      return '.py';
    case 'html':
      return '.html';
    default:
      return '.txt';
  }
}
