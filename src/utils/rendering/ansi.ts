// ANSI escape code utilities

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
