// Component-specific renderers

import type { ComponentNode } from '../../types';
import { CharCanvas } from './canvas';
import { renderBox, getContentArea, BORDER_STYLES } from './borders';
import { wrapText, alignText, padText, truncateText } from './text';
import { wrapWithAnsi, generateAnsiCodes, ANSI_RESET } from './ansi';

/**
 * Render a component to a character canvas
 */
export function renderComponent(node: ComponentNode, width: number, height: number, colorMode: 'ansi16' | 'ansi256' | 'trueColor' = 'ansi16'): string[] {
  const canvas = new CharCanvas(width, height);

  // Generate style code
  const style = generateAnsiCodes({
    color: node.style.color,
    backgroundColor: node.style.backgroundColor,
    bold: node.style.bold,
    italic: node.style.italic,
    underline: node.style.underline,
    strikethrough: node.style.strikethrough,
  }, colorMode);

  // Render based on component type
  let content: string[] = [];

  switch (node.type) {
    case 'Text':
      content = renderText(node, width, height);
      break;
    case 'Button':
      content = renderButton(node, width, height);
      break;
    case 'TextInput':
      content = renderTextInput(node, width, height);
      break;
    case 'Checkbox':
      content = renderCheckbox(node, width, height);
      break;
    case 'Radio':
      content = renderRadio(node, width, height);
      break;
    case 'Select':
      content = renderSelect(node, width, height);
      break;
    case 'ProgressBar':
      content = renderProgressBar(node, width, height);
      break;
    case 'Spinner':
      content = renderSpinner(node, width, height);
      break;
    case 'List':
      content = renderList(node, width, height);
      break;
    case 'Table':
      content = renderTable(node, width, height);
      break;
    case 'Badge':
      content = renderBadge(node, width, height);
      break;
    case 'Label':
      content = renderLabel(node, width, height);
      break;
    default:
      // Container or unknown type
      content = renderContainer(node, width, height);
      break;
  }

  // Apply border if needed
  if (node.style.border) {
    const borderConfig = {
      style: node.style.borderStyle || 'single',
      top: node.style.borderTop !== false,
      bottom: node.style.borderBottom !== false,
      left: node.style.borderLeft !== false,
      right: node.style.borderRight !== false,
    };
    content = renderBox(content, width, height, borderConfig);
  }

  // Write content to canvas with style
  canvas.writeLines(0, 0, content, style);

  return canvas.toLines();
}

function renderText(node: ComponentNode, width: number, height: number): string[] {
  const text = (node.props.content as string) || '';
  const contentArea = node.style.border ? getContentArea(width, height, { style: 'single' }) : { width, height };

  const lines = wrapText(text, contentArea.width);
  const aligned = alignText(lines.slice(0, contentArea.height), contentArea.width, 'left');

  // Pad to height
  while (aligned.length < contentArea.height) {
    aligned.push(' '.repeat(contentArea.width));
  }

  return aligned;
}

function renderButton(node: ComponentNode, width: number, height: number): string[] {
  const label = (node.props.label as string) || 'Button';
  const disabled = node.props.disabled as boolean;
  const contentArea = node.style.border ? getContentArea(width, height, { style: 'single' }) : { width, height };

  const buttonText = disabled ? `[ ${label} ]` : `[ ${label} ]`;
  const truncated = truncateText(buttonText, contentArea.width);
  const padded = padText(truncated, contentArea.width, 'center');

  const lines = [padded];
  while (lines.length < contentArea.height) {
    lines.push(' '.repeat(contentArea.width));
  }

  return lines;
}

function renderTextInput(node: ComponentNode, width: number, height: number): string[] {
  const placeholder = (node.props.placeholder as string) || '';
  const value = (node.props.value as string) || '';
  const contentArea = node.style.border ? getContentArea(width, height, { style: 'single' }) : { width, height };

  const displayText = value || placeholder;
  const truncated = truncateText(displayText, contentArea.width - 2);
  const padded = ' ' + truncated.padEnd(contentArea.width - 2, '_') + ' ';

  const lines = [padded.slice(0, contentArea.width)];
  while (lines.length < contentArea.height) {
    lines.push(' '.repeat(contentArea.width));
  }

  return lines;
}

function renderCheckbox(node: ComponentNode, width: number, height: number): string[] {
  const checked = node.props.checked as boolean;
  const label = (node.props.label as string) || 'Checkbox';
  const contentArea = node.style.border ? getContentArea(width, height, { style: 'single' }) : { width, height };

  const checkbox = checked ? '[✓]' : '[ ]';
  const text = `${checkbox} ${label}`;
  const truncated = truncateText(text, contentArea.width);

  const lines = [truncated.padEnd(contentArea.width)];
  while (lines.length < contentArea.height) {
    lines.push(' '.repeat(contentArea.width));
  }

  return lines;
}

function renderRadio(node: ComponentNode, width: number, height: number): string[] {
  const selected = node.props.selected as boolean;
  const label = (node.props.label as string) || 'Radio';
  const contentArea = node.style.border ? getContentArea(width, height, { style: 'single' }) : { width, height };

  const radio = selected ? '(•)' : '( )';
  const text = `${radio} ${label}`;
  const truncated = truncateText(text, contentArea.width);

  const lines = [truncated.padEnd(contentArea.width)];
  while (lines.length < contentArea.height) {
    lines.push(' '.repeat(contentArea.width));
  }

  return lines;
}

function renderSelect(node: ComponentNode, width: number, height: number): string[] {
  const items = (node.props.items as string[]) || [];
  const selected = (node.props.selectedIndex as number) || 0;
  const contentArea = node.style.border ? getContentArea(width, height, { style: 'single' }) : { width, height };

  const selectedItem = items[selected] || 'Select...';
  const text = `${truncateText(selectedItem, contentArea.width - 3)} ▼`;

  const lines = [text.padEnd(contentArea.width)];
  while (lines.length < contentArea.height) {
    lines.push(' '.repeat(contentArea.width));
  }

  return lines;
}

function renderProgressBar(node: ComponentNode, width: number, height: number): string[] {
  const value = (node.props.value as number) || 0;
  const max = (node.props.max as number) || 100;
  const contentArea = node.style.border ? getContentArea(width, height, { style: 'single' }) : { width, height };

  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const barWidth = contentArea.width - 8; // Leave space for percentage
  const filledWidth = Math.floor((barWidth * percentage) / 100);

  const filled = '█'.repeat(filledWidth);
  const empty = '░'.repeat(barWidth - filledWidth);
  const text = `${filled}${empty} ${percentage.toFixed(0)}%`;

  const lines = [text.slice(0, contentArea.width).padEnd(contentArea.width)];
  while (lines.length < contentArea.height) {
    lines.push(' '.repeat(contentArea.width));
  }

  return lines;
}

function renderSpinner(node: ComponentNode, width: number, height: number): string[] {
  const contentArea = node.style.border ? getContentArea(width, height, { style: 'single' }) : { width, height };
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  const frame = frames[0]; // Static frame for export

  const text = `${frame} Loading...`;
  const truncated = truncateText(text, contentArea.width);

  const lines = [truncated.padEnd(contentArea.width)];
  while (lines.length < contentArea.height) {
    lines.push(' '.repeat(contentArea.width));
  }

  return lines;
}

function renderList(node: ComponentNode, width: number, height: number): string[] {
  const items = (node.props.items as string[]) || [];
  const contentArea = node.style.border ? getContentArea(width, height, { style: 'single' }) : { width, height };

  const lines: string[] = [];
  for (let i = 0; i < Math.min(items.length, contentArea.height); i++) {
    const text = `• ${truncateText(items[i], contentArea.width - 2)}`;
    lines.push(text.padEnd(contentArea.width));
  }

  while (lines.length < contentArea.height) {
    lines.push(' '.repeat(contentArea.width));
  }

  return lines;
}

function renderTable(node: ComponentNode, width: number, height: number): string[] {
  const headers = (node.props.headers as string[]) || ['Column 1', 'Column 2'];
  const rows = (node.props.rows as string[][]) || [];
  const contentArea = node.style.border ? getContentArea(width, height, { style: 'single' }) : { width, height };

  const colWidth = Math.floor(contentArea.width / headers.length);
  const lines: string[] = [];

  // Header
  const headerLine = headers.map(h => padText(truncateText(h, colWidth), colWidth, 'left')).join('');
  lines.push(headerLine.slice(0, contentArea.width).padEnd(contentArea.width));
  lines.push('─'.repeat(contentArea.width));

  // Rows
  for (let i = 0; i < Math.min(rows.length, contentArea.height - 2); i++) {
    const row = rows[i] || [];
    const rowLine = row.map(cell => padText(truncateText(String(cell), colWidth), colWidth, 'left')).join('');
    lines.push(rowLine.slice(0, contentArea.width).padEnd(contentArea.width));
  }

  while (lines.length < contentArea.height) {
    lines.push(' '.repeat(contentArea.width));
  }

  return lines;
}

function renderBadge(node: ComponentNode, width: number, height: number): string[] {
  const text = (node.props.text as string) || 'Badge';
  const contentArea = node.style.border ? getContentArea(width, height, { style: 'single' }) : { width, height };

  const badgeText = ` ${text} `;
  const truncated = truncateText(badgeText, contentArea.width);
  const padded = padText(truncated, contentArea.width, 'center');

  const lines = [padded];
  while (lines.length < contentArea.height) {
    lines.push(' '.repeat(contentArea.width));
  }

  return lines;
}

function renderLabel(node: ComponentNode, width: number, height: number): string[] {
  const text = (node.props.text as string) || 'Label:';
  const contentArea = node.style.border ? getContentArea(width, height, { style: 'single' }) : { width, height };

  const truncated = truncateText(text, contentArea.width);

  const lines = [truncated.padEnd(contentArea.width)];
  while (lines.length < contentArea.height) {
    lines.push(' '.repeat(contentArea.width));
  }

  return lines;
}

function renderContainer(node: ComponentNode, width: number, height: number): string[] {
  const contentArea = node.style.border ? getContentArea(width, height, { style: 'single' }) : { width, height };

  const lines: string[] = [];
  for (let i = 0; i < contentArea.height; i++) {
    lines.push(' '.repeat(contentArea.width));
  }

  return lines;
}
