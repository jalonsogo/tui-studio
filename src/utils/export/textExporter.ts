// Plain text and ANSI export

import type { ComponentNode } from '../../types';
import { renderTree, renderTreeToLines } from './renderer';
import { stripAnsi } from '../rendering';

export interface TextExportOptions {
  format: 'text' | 'ansi' | 'ansi256' | 'trueColor';
  width: number;
  height: number;
  includeMetadata?: boolean;
}

/**
 * Export design to plain text or ANSI format
 */
export function exportToText(
  root: ComponentNode | null,
  options: TextExportOptions
): string {
  if (!root) return '';

  const colorMode = options.format === 'text' ? 'ansi16' :
                    options.format === 'ansi256' ? 'ansi256' :
                    options.format === 'trueColor' ? 'trueColor' : 'ansi16';

  let output = renderTree(root, {
    width: options.width,
    height: options.height,
    colorMode,
  });

  // Strip ANSI codes for plain text
  if (options.format === 'text') {
    output = stripAnsi(output);
  }

  // Add metadata if requested
  if (options.includeMetadata) {
    const metadata = [
      `# TUI Designer Export`,
      `# Format: ${options.format}`,
      `# Dimensions: ${options.width}x${options.height}`,
      `# Generated: ${new Date().toISOString()}`,
      '',
    ].join('\n');

    output = metadata + output;
  }

  return output;
}

/**
 * Export to file-ready format with proper line endings
 */
export function exportToFile(
  root: ComponentNode | null,
  options: TextExportOptions
): string {
  return exportToText(root, options);
}

/**
 * Convert ANSI escape sequences to HTML spans for browser rendering
 */
export function ansiToHtml(text: string): string {
  const ansi16 = [
    '#1c1c1c', '#cc3333', '#33cc33', '#cccc33',
    '#3333cc', '#cc33cc', '#33cccc', '#cccccc',
    '#666666', '#ff5555', '#55ff55', '#ffff55',
    '#5555ff', '#ff55ff', '#55ffff', '#ffffff',
  ];

  let result = '';
  let pos = 0;
  let fg: string | null = null;
  let bg: string | null = null;
  let bold = false;
  let italic = false;
  let underline = false;
  let strikethrough = false;
  let inverse = false;
  let spanOpen = false;

  const closeSpan = () => {
    if (spanOpen) { result += '</span>'; spanOpen = false; }
  };

  const openSpan = () => {
    const styles: string[] = [];
    const actualFg = inverse ? (bg || '#1c1c1c') : fg;
    const actualBg = inverse ? (fg || '#cccccc') : bg;
    if (actualFg) styles.push(`color:${actualFg}`);
    if (actualBg) styles.push(`background-color:${actualBg}`);
    if (bold) styles.push('font-weight:bold');
    if (italic) styles.push('font-style:italic');
    const deco: string[] = [];
    if (underline) deco.push('underline');
    if (strikethrough) deco.push('line-through');
    if (deco.length) styles.push(`text-decoration:${deco.join(' ')}`);
    if (styles.length) { result += `<span style="${styles.join(';')}">`;  spanOpen = true; }
  };

  while (pos < text.length) {
    if (text[pos] === '\x1b' && text[pos + 1] === '[') {
      let end = pos + 2;
      while (end < text.length && !/[A-Za-z]/.test(text[end])) end++;
      if (text[end] === 'm') {
        const seqStr = text.slice(pos + 2, end);
        const codes = seqStr === '' ? [0] : seqStr.split(';').map(Number);
        closeSpan();
        let i = 0;
        while (i < codes.length) {
          const code = codes[i];
          if (code === 0) { fg = null; bg = null; bold = false; italic = false; underline = false; strikethrough = false; inverse = false; }
          else if (code === 1) bold = true;
          else if (code === 3) italic = true;
          else if (code === 4) underline = true;
          else if (code === 7) inverse = true;
          else if (code === 9) strikethrough = true;
          else if (code === 22) bold = false;
          else if (code === 23) italic = false;
          else if (code === 24) underline = false;
          else if (code === 27) inverse = false;
          else if (code === 29) strikethrough = false;
          else if (code >= 30 && code <= 37) fg = ansi16[code - 30];
          else if (code === 39) fg = null;
          else if (code >= 40 && code <= 47) bg = ansi16[code - 40];
          else if (code === 49) bg = null;
          else if (code >= 90 && code <= 97) fg = ansi16[code - 90 + 8];
          else if (code >= 100 && code <= 107) bg = ansi16[code - 100 + 8];
          else if (code === 38 && codes[i + 1] === 5) { fg = ansi256ToHex(codes[i + 2]); i += 2; }
          else if (code === 48 && codes[i + 1] === 5) { bg = ansi256ToHex(codes[i + 2]); i += 2; }
          else if (code === 38 && codes[i + 1] === 2) { fg = `rgb(${codes[i + 2]},${codes[i + 3]},${codes[i + 4]})`; i += 4; }
          else if (code === 48 && codes[i + 1] === 2) { bg = `rgb(${codes[i + 2]},${codes[i + 3]},${codes[i + 4]})`; i += 4; }
          i++;
        }
        openSpan();
      }
      pos = end + 1;
    } else {
      const ch = text[pos];
      if (ch === '&') result += '&amp;';
      else if (ch === '<') result += '&lt;';
      else if (ch === '>') result += '&gt;';
      else result += ch;
      pos++;
    }
  }
  closeSpan();
  return result;
}

function ansi256ToHex(n: number): string {
  const ansi16 = [
    '#1c1c1c', '#cc3333', '#33cc33', '#cccc33',
    '#3333cc', '#cc33cc', '#33cccc', '#cccccc',
    '#666666', '#ff5555', '#55ff55', '#ffff55',
    '#5555ff', '#ff55ff', '#55ffff', '#ffffff',
  ];
  if (n < 16) return ansi16[n] || '#ffffff';
  if (n >= 232) { const v = 8 + (n - 232) * 10; return `rgb(${v},${v},${v})`; }
  const idx = n - 16;
  const r = Math.floor(idx / 36);
  const g = Math.floor((idx % 36) / 6);
  const b = idx % 6;
  const c = (x: number) => x === 0 ? 0 : 55 + x * 40;
  return `rgb(${c(r)},${c(g)},${c(b)})`;
}

/**
 * Export to a standalone HTML file that renders the design visually in a browser
 */
export function exportToHtmlFile(
  root: ComponentNode | null,
  width: number,
  height: number
): string {
  if (!root) return '';
  const ansiOutput = renderTree(root, { width, height, colorMode: 'trueColor' });
  const htmlContent = ansiToHtml(ansiOutput);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TUIStudio Export</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #141414;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: 'Courier New', 'Consolas', 'Monaco', monospace;
    }
    .terminal {
      background-color: #1a1a1a;
      color: #cccccc;
      padding: 20px;
      line-height: 1.4;
      white-space: pre;
      font-size: 14px;
      border-radius: 8px;
      border: 1px solid #333;
    }
  </style>
</head>
<body>
  <div class="terminal">${htmlContent}</div>
</body>
</html>`;
}

/**
 * Generate a preview thumbnail (smaller version)
 */
export function generatePreview(
  root: ComponentNode | null,
  maxWidth: number = 40,
  maxHeight: number = 20
): string {
  if (!root) return '';

  const lines = renderTreeToLines(root, {
    width: maxWidth,
    height: maxHeight,
    colorMode: 'ansi16',
  });

  return lines.join('\n');
}
