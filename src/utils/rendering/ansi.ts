// ANSI escape code utilities

import type { GradientConfig } from '../../types';

export interface AnsiStyle {
  color?: string;
  backgroundColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  dim?: boolean;
  inverse?: boolean;
}

const ANSI_COLORS: Record<string, number> = {
  black: 30,
  red: 31,
  green: 32,
  yellow: 33,
  blue: 34,
  magenta: 35,
  cyan: 36,
  white: 37,
  brightBlack: 90,
  brightRed: 91,
  brightGreen: 92,
  brightYellow: 93,
  brightBlue: 94,
  brightMagenta: 95,
  brightCyan: 96,
  brightWhite: 97,
};

const ANSI_BG_COLORS: Record<string, number> = {
  black: 40,
  red: 41,
  green: 42,
  yellow: 43,
  blue: 44,
  magenta: 45,
  cyan: 46,
  white: 47,
  brightBlack: 100,
  brightRed: 101,
  brightGreen: 102,
  brightYellow: 103,
  brightBlue: 104,
  brightMagenta: 105,
  brightCyan: 106,
  brightWhite: 107,
};

/**
 * Convert hex color to ANSI 256 color code
 */
export function hexToAnsi256(hex: string): number {
  if (!hex.startsWith('#')) return 15; // white fallback

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Use 216-color cube (16-231) for better color matching
  const rIndex = Math.round((r / 255) * 5);
  const gIndex = Math.round((g / 255) * 5);
  const bIndex = Math.round((b / 255) * 5);

  return 16 + (rIndex * 36) + (gIndex * 6) + bIndex;
}

/**
 * Convert hex color to ANSI RGB (true color)
 */
export function hexToAnsiRgb(hex: string): string {
  if (!hex.startsWith('#')) return '255;255;255'; // white fallback

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `${r};${g};${b}`;
}

/**
 * Generate ANSI escape codes for styling
 */
export function generateAnsiCodes(style: AnsiStyle, colorMode: 'ansi16' | 'ansi256' | 'trueColor' = 'ansi16'): string {
  const codes: string[] = [];

  // Text decoration
  if (style.bold) codes.push('1');
  if (style.dim) codes.push('2');
  if (style.italic) codes.push('3');
  if (style.underline) codes.push('4');
  if (style.inverse) codes.push('7');
  if (style.strikethrough) codes.push('9');

  // Foreground color
  if (style.color) {
    if (style.color.startsWith('#')) {
      // Hex color
      if (colorMode === 'trueColor') {
        codes.push(`38;2;${hexToAnsiRgb(style.color)}`);
      } else if (colorMode === 'ansi256') {
        codes.push(`38;5;${hexToAnsi256(style.color)}`);
      }
    } else if (ANSI_COLORS[style.color]) {
      // Named ANSI color
      codes.push(ANSI_COLORS[style.color].toString());
    }
  }

  // Background color
  if (style.backgroundColor) {
    if (style.backgroundColor.startsWith('#')) {
      // Hex color
      if (colorMode === 'trueColor') {
        codes.push(`48;2;${hexToAnsiRgb(style.backgroundColor)}`);
      } else if (colorMode === 'ansi256') {
        codes.push(`48;5;${hexToAnsi256(style.backgroundColor)}`);
      }
    } else if (ANSI_BG_COLORS[style.backgroundColor]) {
      // Named ANSI color
      codes.push(ANSI_BG_COLORS[style.backgroundColor].toString());
    }
  }

  return codes.length > 0 ? `\x1b[${codes.join(';')}m` : '';
}

/**
 * Reset all ANSI styling
 */
export const ANSI_RESET = '\x1b[0m';

/**
 * Parse a hex color to [r, g, b] components (0–255 each)
 */
export function hexToRgb(hex: string): [number, number, number] {
  if (!hex.startsWith('#')) return [255, 255, 255];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

/**
 * Linearly interpolate between two RGB values
 */
function lerpRgb(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

/**
 * Interpolate a gradient at position t (0–1), returns [r, g, b].
 * Sorts stops by position and lerps between the two surrounding stops.
 */
export function interpolateGradientColor(gradient: GradientConfig, t: number): [number, number, number] {
  const stops = [...gradient.stops].sort((a, b) => a.position - b.position);
  if (stops.length === 0) return [0, 0, 0];
  if (stops.length === 1) return hexToRgb(stops[0].color);

  const pct = t * 100;

  if (pct <= stops[0].position) return hexToRgb(stops[0].color);
  if (pct >= stops[stops.length - 1].position) return hexToRgb(stops[stops.length - 1].color);

  for (let i = 0; i < stops.length - 1; i++) {
    const s0 = stops[i];
    const s1 = stops[i + 1];
    if (pct >= s0.position && pct <= s1.position) {
      const localT = (pct - s0.position) / (s1.position - s0.position);
      return lerpRgb(hexToRgb(s0.color), hexToRgb(s1.color), localT);
    }
  }

  return hexToRgb(stops[stops.length - 1].color);
}

/**
 * Build the ANSI true-color background escape code for an interpolated gradient color
 */
export function gradientBgCode(gradient: GradientConfig, t: number): string {
  const [r, g, b] = interpolateGradientColor(gradient, t);
  return `\x1b[48;2;${r};${g};${b}m`;
}

/**
 * Wrap text with ANSI codes
 */
export function wrapWithAnsi(text: string, style: AnsiStyle, colorMode?: 'ansi16' | 'ansi256' | 'trueColor'): string {
  const codes = generateAnsiCodes(style, colorMode);
  return codes ? `${codes}${text}${ANSI_RESET}` : text;
}

/**
 * Strip ANSI codes from text
 */
export function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Get visible length of text (excluding ANSI codes)
 */
export function visibleLength(text: string): number {
  return stripAnsi(text).length;
}
