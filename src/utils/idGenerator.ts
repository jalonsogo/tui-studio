// Generate unique IDs for components, layers, etc.

let counter = 0;

export function generateId(prefix: string = 'node'): string {
  counter++;
  return `${prefix}-${Date.now()}-${counter}`;
}

export function generateComponentId(): string {
  return generateId('comp');
}

export function generateLayerId(): string {
  return generateId('layer');
}

export function generateFrameId(): string {
  return generateId('frame');
}

export function generatePageId(): string {
  return generateId('page');
}

export function resetCounter(): void {
  counter = 0;
}
