// Validation utilities for component properties

import type { ComponentNode, ComponentType } from '../types';

/**
 * Validate if a component name is valid
 */
export function isValidComponentName(name: string): boolean {
  return name.length > 0 && name.length <= 50;
}

/**
 * Validate if a dimension value is valid
 */
export function isValidDimension(value: number | 'fill' | 'auto'): boolean {
  if (value === 'fill' || value === 'auto') return true;
  return typeof value === 'number' && value >= 0 && value <= 1000;
}

/**
 * Validate if a color string is valid
 */
export function isValidColor(color: string): boolean {
  // Allow ANSI color names
  const ansiColors = [
    'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
    'brightBlack', 'brightRed', 'brightGreen', 'brightYellow',
    'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite',
  ];

  if (ansiColors.includes(color)) return true;

  // Allow hex colors
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) return true;

  // Allow rgb/rgba
  if (/^rgba?\(\d+,\s*\d+,\s*\d+(,\s*[\d.]+)?\)$/.test(color)) return true;

  return false;
}

/**
 * Validate if a component node is valid
 */
export function validateComponentNode(node: ComponentNode): string[] {
  const errors: string[] = [];

  // Validate name
  if (!isValidComponentName(node.name)) {
    errors.push('Component name must be 1-50 characters');
  }

  // Validate dimensions
  if (node.props.width && !isValidDimension(node.props.width)) {
    errors.push('Invalid width value');
  }
  if (node.props.height && !isValidDimension(node.props.height)) {
    errors.push('Invalid height value');
  }

  // Validate colors
  if (node.style.color && !isValidColor(node.style.color)) {
    errors.push('Invalid foreground color');
  }
  if (node.style.backgroundColor && !isValidColor(node.style.backgroundColor)) {
    errors.push('Invalid background color');
  }
  if (node.style.borderColor && !isValidColor(node.style.borderColor)) {
    errors.push('Invalid border color');
  }

  // Validate opacity
  if (node.style.opacity !== undefined) {
    if (typeof node.style.opacity !== 'number' || node.style.opacity < 0 || node.style.opacity > 1) {
      errors.push('Opacity must be between 0 and 1');
    }
  }

  // Validate layout gap
  if (node.layout.gap !== undefined) {
    if (typeof node.layout.gap !== 'number' || node.layout.gap < 0) {
      errors.push('Gap must be a non-negative number');
    }
  }

  return errors;
}

/**
 * Check if a component type supports children
 */
export function canHaveChildren(type: ComponentType): boolean {
  const noChildrenTypes: ComponentType[] = [
    'TextInput',
    'Button',
    'Checkbox',
    'Radio',
    'Toggle',
    'Text',
    'Label',
    'Badge',
    'Spinner',
    'ProgressBar',
    'Spacer',
  ];

  return !noChildrenTypes.includes(type);
}

/**
 * Validate if a component can be a child of another
 */
export function canBeChild(parentType: ComponentType, childType: ComponentType): boolean {
  // Check if parent can have children
  if (!canHaveChildren(parentType)) {
    return false;
  }

  // Modal can only have certain children
  if (parentType === 'Modal') {
    return ['Box', 'Flexbox', 'Grid', 'Text'].includes(childType);
  }

  // Tabs must have direct children of specific types
  if (parentType === 'Tabs') {
    return childType === 'Box' || childType === 'Flexbox';
  }

  return true;
}
