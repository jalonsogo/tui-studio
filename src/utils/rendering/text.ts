// Text wrapping and alignment utilities

import { stripAnsi, visibleLength } from './ansi';

export type TextAlign = 'left' | 'center' | 'right';
export type VerticalAlign = 'top' | 'middle' | 'bottom';

/**
 * Wrap text to fit within a given width
 */
export function wrapText(text: string, width: number): string[] {
  if (width <= 0) return [];

  const lines: string[] = [];
  const paragraphs = text.split('\n');

  for (const paragraph of paragraphs) {
    if (paragraph.length === 0) {
      lines.push('');
      continue;
    }

    const words = paragraph.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testLength = visibleLength(testLine);

      if (testLength <= width) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Word is longer than width, truncate it
          lines.push(truncateText(word, width));
          currentLine = '';
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * Truncate text to fit within width, adding ellipsis if needed
 */
export function truncateText(text: string, width: number, ellipsis: string = '…'): string {
  const length = visibleLength(text);
  if (length <= width) return text;

  const stripped = stripAnsi(text);
  if (width <= ellipsis.length) {
    return ellipsis.slice(0, width);
  }

  return stripped.slice(0, width - ellipsis.length) + ellipsis;
}

/**
 * Pad text to a specific width with alignment
 */
export function padText(text: string, width: number, align: TextAlign = 'left', fillChar: string = ' '): string {
  const length = visibleLength(text);
  if (length >= width) return text;

  const padding = width - length;

  switch (align) {
    case 'center': {
      const leftPad = Math.floor(padding / 2);
      const rightPad = padding - leftPad;
      return fillChar.repeat(leftPad) + text + fillChar.repeat(rightPad);
    }
    case 'right':
      return fillChar.repeat(padding) + text;
    default: // 'left'
      return text + fillChar.repeat(padding);
  }
}

/**
 * Align lines of text horizontally within a width
 */
export function alignText(lines: string[], width: number, align: TextAlign = 'left'): string[] {
  return lines.map(line => padText(line, width, align));
}

/**
 * Align lines of text vertically within a height
 */
export function alignVertical(lines: string[], height: number, valign: VerticalAlign = 'top'): string[] {
  if (lines.length >= height) return lines.slice(0, height);

  const emptyLines = height - lines.length;

  switch (valign) {
    case 'middle': {
      const topPad = Math.floor(emptyLines / 2);
      const bottomPad = emptyLines - topPad;
      return [
        ...Array(topPad).fill(''),
        ...lines,
        ...Array(bottomPad).fill(''),
      ];
    }
    case 'bottom':
      return [
        ...Array(emptyLines).fill(''),
        ...lines,
      ];
    default: // 'top'
      return [
        ...lines,
        ...Array(emptyLines).fill(''),
      ];
  }
}

/**
 * Create a box of empty lines
 */
export function createEmptyBox(width: number, height: number, fillChar: string = ' '): string[] {
  return Array(height).fill(fillChar.repeat(width));
}

/**
 * Measure text dimensions
 */
export function measureText(text: string): { width: number; height: number } {
  const lines = text.split('\n');
  const width = Math.max(...lines.map(line => visibleLength(line)), 0);
  const height = lines.length;
  return { width, height };
}
