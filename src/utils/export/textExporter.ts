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
