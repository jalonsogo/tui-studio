// ASCII border rendering utilities

export interface BorderStyle {
  top: string;
  bottom: string;
  left: string;
  right: string;
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
}

export const BORDER_STYLES: Record<string, BorderStyle> = {
  single: {
    top: '─',
    bottom: '─',
    left: '│',
    right: '│',
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
  },
  double: {
    top: '═',
    bottom: '═',
    left: '║',
    right: '║',
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
  },
  rounded: {
    top: '─',
    bottom: '─',
    left: '│',
    right: '│',
    topLeft: '╭',
    topRight: '╮',
    bottomLeft: '╰',
    bottomRight: '╯',
  },
  bold: {
    top: '━',
    bottom: '━',
    left: '┃',
    right: '┃',
    topLeft: '┏',
    topRight: '┓',
    bottomLeft: '┗',
    bottomRight: '┛',
  },
  ascii: {
    top: '-',
    bottom: '-',
    left: '|',
    right: '|',
    topLeft: '+',
    topRight: '+',
    bottomLeft: '+',
    bottomRight: '+',
  },
  hidden: {
    top: ' ',
    bottom: ' ',
    left: ' ',
    right: ' ',
    topLeft: ' ',
    topRight: ' ',
    bottomLeft: ' ',
    bottomRight: ' ',
  },
};

export interface BorderConfig {
  style: string;
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
}

/**
 * Render a box with borders around content
 */
export function renderBox(
  content: string[],
  width: number,
  height: number,
  config: BorderConfig = { style: 'single' }
): string[] {
  const style = BORDER_STYLES[config.style] || BORDER_STYLES.single;
  const lines: string[] = [];

  const showTop = config.top !== false;
  const showBottom = config.bottom !== false;
  const showLeft = config.left !== false;
  const showRight = config.right !== false;

  const innerWidth = width - (showLeft ? 1 : 0) - (showRight ? 1 : 0);
  const contentHeight = height - (showTop ? 1 : 0) - (showBottom ? 1 : 0);

  // Top border
  if (showTop) {
    const topLeft = showLeft ? style.topLeft : '';
    const topRight = showRight ? style.topRight : '';
    const topLine = style.top.repeat(innerWidth);
    lines.push(topLeft + topLine + topRight);
  }

  // Content with side borders
  for (let i = 0; i < contentHeight; i++) {
    const contentLine = content[i] || '';
    const paddedContent = contentLine.padEnd(innerWidth, ' ').slice(0, innerWidth);
    const left = showLeft ? style.left : '';
    const right = showRight ? style.right : '';
    lines.push(left + paddedContent + right);
  }

  // Bottom border
  if (showBottom) {
    const bottomLeft = showLeft ? style.bottomLeft : '';
    const bottomRight = showRight ? style.bottomRight : '';
    const bottomLine = style.bottom.repeat(innerWidth);
    lines.push(bottomLeft + bottomLine + bottomRight);
  }

  return lines;
}

/**
 * Render horizontal divider
 */
export function renderDivider(width: number, style: string = 'single', char?: string): string {
  const borderStyle = BORDER_STYLES[style] || BORDER_STYLES.single;
  const dividerChar = char || borderStyle.top;
  return dividerChar.repeat(width);
}

/**
 * Calculate content area dimensions accounting for borders
 */
export function getContentArea(
  width: number,
  height: number,
  config: BorderConfig
): { width: number; height: number } {
  const showTop = config.top !== false;
  const showBottom = config.bottom !== false;
  const showLeft = config.left !== false;
  const showRight = config.right !== false;

  return {
    width: width - (showLeft ? 1 : 0) - (showRight ? 1 : 0),
    height: height - (showTop ? 1 : 0) - (showBottom ? 1 : 0),
  };
}
