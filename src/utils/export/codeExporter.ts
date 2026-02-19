// Code generation for different TUI frameworks

import type { ComponentNode, ExportFormat } from '../../types';

/**
 * Export design to framework-specific code
 */
export function exportToCode(
  root: ComponentNode | null,
  format: ExportFormat
): string {
  if (!root) return '';

  switch (format) {
    case 'opentui':
      return exportToOpenTUI(root);
    case 'ink':
      return exportToInk(root);
    case 'bubbletea':
      return exportToBubbleTea(root);
    case 'blessed':
      return exportToBlessed(root);
    case 'textual':
      return exportToTextual(root);
    default:
      return `// Unsupported export format: ${format}`;
  }
}

// ── Ink ───────────────────────────────────────────────────────────────────────

function exportToInk(root: ComponentNode): string {
  const extras = new Set<string>();
  collectInkImports(root, extras);

  let importLines = `import React from 'react';\nimport { render, Box, Text } from 'ink';`;
  if (extras.has('TextInput'))  importLines += `\nimport TextInput from 'ink-text-input';`;
  if (extras.has('SelectInput')) importLines += `\nimport SelectInput from 'ink-select-input';`;
  if (extras.has('Spinner'))    importLines += `\nimport Spinner from 'ink-spinner';`;

  const packageNote = buildPackageNote(extras);

  return `${importLines}

function App() {
  return (
${generateInkNode(root, 2)}  );
}

render(<App />);
${packageNote}`;
}

function buildPackageNote(extras: Set<string>): string {
  const pkgMap: Record<string, string> = {
    TextInput: 'ink-text-input',
    SelectInput: 'ink-select-input',
    Spinner: 'ink-spinner',
  };
  const needed = Array.from(extras).map(k => pkgMap[k]).filter(Boolean);
  if (!needed.length) return '';
  return `\n// Install extra packages:\n// npm install ${needed.join(' ')}\n`;
}

function collectInkImports(node: ComponentNode, imports: Set<string>): void {
  if (node.type === 'TextInput')  imports.add('TextInput');
  if (node.type === 'Select')     imports.add('SelectInput');
  if (node.type === 'Spinner')    imports.add('Spinner');
  for (const child of node.children) collectInkImports(child, imports);
}

function generateInkNode(node: ComponentNode, indent: number): string {
  if (node.hidden) return '';
  const sp = '  '.repeat(indent);

  switch (node.type) {
    case 'Screen':
    case 'Box':
    case 'Grid':
    case 'Modal':
    case 'Popover':
    case 'Tooltip': {
      const props = inkBoxProps(node);
      const children = node.children.map(c => generateInkNode(c, indent + 1)).join('');
      return children
        ? `${sp}<Box${props}>\n${children}${sp}</Box>\n`
        : `${sp}<Box${props} />\n`;
    }

    case 'Spacer':
      return `${sp}<Box flexGrow={1} />\n`;

    case 'Text': {
      const content = (node.props.content as string) || '';
      return `${sp}<Text${inkTextProps(node)}>${escJsx(content)}</Text>\n`;
    }

    case 'Button': {
      const label = (node.props.label as string) || 'Button';
      return `${sp}<Text${inkTextProps(node)} bold inverse>  ${escJsx(label)}  </Text>\n`;
    }

    case 'TextInput': {
      const placeholder = JSON.stringify((node.props.placeholder as string) || '');
      const value = JSON.stringify((node.props.value as string) || '');
      return `${sp}<TextInput value={${value}} placeholder={${placeholder}} onChange={() => {}} />\n`;
    }

    case 'Checkbox': {
      const label   = (node.props.label as string) || '';
      const checked = !!node.props.checked;
      const icon    = checked
        ? ((node.props.checkedIcon as string)   || '✓')
        : ((node.props.uncheckedIcon as string) || '○');
      return `${sp}<Text${inkTextProps(node)}>{/* checked={${checked}} */} ${escJsx(icon)} ${escJsx(label)}</Text>\n`;
    }

    case 'Radio': {
      const label    = (node.props.label as string) || '';
      const selected = !!node.props.checked;
      const icon     = selected
        ? ((node.props.selectedIcon as string)   || '◉')
        : ((node.props.unselectedIcon as string) || '○');
      return `${sp}<Text${inkTextProps(node)}>{/* selected={${selected}} */} ${escJsx(icon)} ${escJsx(label)}</Text>\n`;
    }

    case 'Toggle': {
      const label = (node.props.label as string) || '';
      const on    = !!node.props.value;
      return `${sp}<Text${inkTextProps(node)}>{/* on={${on}} */} {${on} ? '[ON ]' : '[OFF]'} ${escJsx(label)}</Text>\n`;
    }

    case 'Select': {
      const options = (node.props.options as string[]) || ['Option 1', 'Option 2'];
      const items   = options.map((o: string) =>
        `{ label: ${JSON.stringify(o)}, value: ${JSON.stringify(o.toLowerCase().replace(/\s+/g, '_'))} }`
      ).join(', ');
      return `${sp}<SelectInput items={[${items}]} onSelect={() => {}} />\n`;
    }

    case 'Spinner':
      return `${sp}<Text${inkTextProps(node)}><Spinner type="dots" /></Text>\n`;

    case 'ProgressBar': {
      const value = (node.props.value as number) ?? 0;
      const max   = (node.props.max   as number) ?? 100;
      const width = (node.props.width as number) ?? 20;
      return `${sp}<Text${inkTextProps(node)}>\n` +
        `${sp}  {'█'.repeat(Math.round(${value} / ${max} * ${width}))}` +
        `{'░'.repeat(${width} - Math.round(${value} / ${max} * ${width}))} ${value}%\n` +
        `${sp}</Text>\n`;
    }

    case 'List': {
      const items  = (node.props.items as any[]) || [];
      const rows   = items.map((item: any) => {
        const d = typeof item === 'string' ? { label: item, icon: '•' } : item;
        return `${sp}  <Text key={${JSON.stringify(d.label)}}>${escJsx(d.icon || '•')} ${escJsx(d.label)}</Text>`;
      }).join('\n');
      return `${sp}<Box${inkBoxProps(node)} flexDirection="column">\n${rows}\n${sp}</Box>\n`;
    }

    case 'Menu': {
      const items  = (node.props.items as any[]) || [];
      const isRow  = (node.layout as any).direction === 'row';
      const rows   = items.map((item: any) => {
        const d = typeof item === 'string' ? { label: item, icon: '' } : item;
        const prefix = d.icon ? `${escJsx(d.icon)} ` : '';
        return `${sp}  <Text key={${JSON.stringify(d.label)}}>${prefix}${escJsx(d.label)}</Text>`;
      }).join('\n');
      return `${sp}<Box${inkBoxProps(node)} flexDirection="${isRow ? 'row' : 'column'}" gap={1}>\n${rows}\n${sp}</Box>\n`;
    }

    case 'Tabs': {
      const tabs = (node.props.tabs as any[]) || [];
      const rows = tabs.map((tab: any) => {
        const label = typeof tab === 'string' ? tab : tab.label || 'Tab';
        return `${sp}  <Text key={${JSON.stringify(label)}} underline> ${escJsx(label)} </Text>`;
      }).join('\n');
      return `${sp}<Box${inkBoxProps(node)} flexDirection="row">\n${rows}\n${sp}</Box>\n`;
    }

    case 'Table': {
      const columns = (node.props.columns as string[]) || ['Column 1', 'Column 2'];
      const rows    = (node.props.rows as string[][]) || [];
      const colW    = 14;
      const header  = columns.map((c: string) => c.slice(0, colW).padEnd(colW)).join(' │ ');
      const divider = columns.map(() => '─'.repeat(colW)).join('─┼─');
      const dataRows = rows.map((row: string[]) =>
        columns.map((_: string, ci: number) => (row[ci] || '').slice(0, colW).padEnd(colW)).join(' │ ')
      );
      const lines = [header, divider, ...dataRows].map((l, i) =>
        `${sp}  <Text key={${i}}>{${JSON.stringify(l)}}</Text>`
      ).join('\n');
      return `${sp}<Box${inkBoxProps(node)} flexDirection="column">\n${lines}\n${sp}</Box>\n`;
    }

    case 'Tree': {
      const items = (node.props.items as any[]) || [];
      const flatLines: string[] = [];
      const walk = (item: any, depth: number) => {
        const d   = typeof item === 'string' ? { label: item, children: [] } : item;
        const pad = '  '.repeat(depth) + (depth > 0 ? '├─ ' : '');
        flatLines.push(`${sp}  <Text key={${JSON.stringify(pad + d.label)}}>{${JSON.stringify(pad + d.label)}}</Text>`);
        (d.children || []).forEach((child: any) => walk(child, depth + 1));
      };
      items.forEach((item: any) => walk(item, 0));
      return `${sp}<Box${inkBoxProps(node)} flexDirection="column">\n${flatLines.join('\n')}\n${sp}</Box>\n`;
    }

    case 'Breadcrumb': {
      const items     = (node.props.items as any[]) || [];
      const separator = (node.props.separator as string) || '/';
      const text      = items.map((i: any) => typeof i === 'string' ? i : i.label || '').join(` ${separator} `);
      return `${sp}<Text${inkTextProps(node)}>{${JSON.stringify(text)}}</Text>\n`;
    }

    default:
      return `${sp}{/* ${node.type}: ${escJsx(node.name)} */}\n`;
  }
}

/** Box-level props: flexbox layout + border from node.layout + node.style */
function inkBoxProps(node: ComponentNode): string {
  const props: string[] = [];
  const layout = node.layout as any;

  if (layout.direction === 'row') props.push('flexDirection="row"');
  if (layout.gap   > 0) props.push(`gap={${layout.gap}}`);
  if (layout.padding > 0) props.push(`padding={${layout.padding}}`);

  const jMap: Record<string, string> = {
    center: 'center', end: 'flex-end',
    'space-between': 'space-between', between: 'space-between',
    'space-around': 'space-around',   around: 'space-around',
    'space-evenly': 'space-evenly',   evenly: 'space-evenly',
  };
  if (layout.justify && jMap[layout.justify]) props.push(`justifyContent="${jMap[layout.justify]}"`);

  const aMap: Record<string, string> = { center: 'center', end: 'flex-end' };
  if (layout.align && aMap[layout.align]) props.push(`alignItems="${aMap[layout.align]}"`);

  if (typeof layout.width === 'number'  && layout.width  > 0) props.push(`width={${layout.width}}`);
  else if (layout.width  === 'fill' || layout.width  === 'fill_container') props.push('flexGrow={1}');
  if (typeof layout.height === 'number' && layout.height > 0) props.push(`height={${layout.height}}`);

  if (node.style.border) {
    const bsMap: Record<string, string> = {
      single: 'single', double: 'double', round: 'round',
      bold: 'bold', classic: 'classic',
    };
    const bs = bsMap[(node.style.borderStyle as string) || 'single'] || 'single';
    props.push(`borderStyle="${bs}"`);
    if (node.style.color) props.push(`borderColor="${node.style.color}"`);
  }

  return props.length ? ' ' + props.join(' ') : '';
}

/** Text-level props: color, bold, italic, underline from node.style */
function inkTextProps(node: ComponentNode): string {
  const props: string[] = [];
  if (node.style.color)           props.push(`color="${node.style.color}"`);
  if (node.style.backgroundColor) props.push(`backgroundColor="${node.style.backgroundColor}"`);
  if (node.style.bold)            props.push('bold');
  if (node.style.italic)          props.push('italic');
  if (node.style.underline)       props.push('underline');
  if ((node.style as any).strikethrough) props.push('strikethrough');
  return props.length ? ' ' + props.join(' ') : '';
}

/** Escape characters that are special in JSX text content */
function escJsx(s: string): string {
  return s.replace(/[{}<>&]/g, c =>
    ({ '{': '&#123;', '}': '&#125;', '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] || c)
  );
}

// ── OpenTUI ───────────────────────────────────────────────────────────────────

function exportToOpenTUI(node: ComponentNode): string {
  const imports = new Set<string>();
  const code = generateOpenTUIComponent(node, imports, 0);

  return `import { ${Array.from(imports).join(', ')} } from '@opentui/core';

function App() {
  return (
${code}
  );
}

export default App;
`;
}

function generateOpenTUIComponent(node: ComponentNode, imports: Set<string>, indent: number): string {
  const spaces = '  '.repeat(indent + 1);
  const componentName = mapToOpenTUIComponent(node.type);
  imports.add(componentName);

  const props = generatePropsString(node);
  const style = generateStyleString(node);

  let result = `${spaces}<${componentName}${props}${style}`;

  if (node.children.length > 0) {
    result += '>\n';
    for (const child of node.children) {
      result += generateOpenTUIComponent(child, imports, indent + 1);
    }
    result += `${spaces}</${componentName}>\n`;
  } else {
    result += ' />\n';
  }

  return result;
}

// ── BubbleTea ─────────────────────────────────────────────────────────────────

function exportToBubbleTea(node: ComponentNode): string {
  return `package main

import (
    "fmt"
    tea "github.com/charmbracelet/bubbletea"
)

type model struct {
    // Add your state here
}

func (m model) Init() tea.Cmd {
    return nil
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
    switch msg := msg.(type) {
    case tea.KeyMsg:
        if msg.String() == "ctrl+c" || msg.String() == "q" {
            return m, tea.Quit
        }
    }
    return m, nil
}

func (m model) View() string {
    // Generated view
${generateBubbleTeaView(node, 1)}
}

func main() {
    p := tea.NewProgram(model{})
    if _, err := p.Run(); err != nil {
        fmt.Println("Error:", err)
    }
}
`;
}

function generateBubbleTeaView(node: ComponentNode, indent: number): string {
  const spaces = '  '.repeat(indent);
  if (node.type === 'Text') return `${spaces}return "${node.props.content || 'Text'}"\n`;
  return `${spaces}return "Component: ${node.type}"\n`;
}

// ── Blessed ───────────────────────────────────────────────────────────────────

function exportToBlessed(node: ComponentNode): string {
  return `const blessed = require('blessed');

const screen = blessed.screen({
  smartCSR: true
});

${generateBlessedComponents(node, 0)}

screen.key(['escape', 'q', 'C-c'], function() {
  return process.exit(0);
});

screen.render();
`;
}

function generateBlessedComponents(node: ComponentNode, indent: number): string {
  const spaces = '  '.repeat(indent);
  const varName = node.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

  const options: string[] = [];
  if (node.props.width)   options.push(`width: ${JSON.stringify(node.props.width)}`);
  if (node.props.height)  options.push(`height: ${JSON.stringify(node.props.height)}`);
  if (node.style.border)  options.push(`border: { type: 'line' }`);
  if (node.props.content) options.push(`content: ${JSON.stringify(node.props.content)}`);

  let result = `${spaces}const ${varName} = blessed.box({\n`;
  result += options.map(opt => `${spaces}  ${opt}`).join(',\n') + '\n';
  result += `${spaces}});\n`;
  result += `${spaces}screen.append(${varName});\n\n`;

  for (const child of node.children) {
    result += generateBlessedComponents(child, indent);
  }
  return result;
}

// ── Textual ───────────────────────────────────────────────────────────────────

function exportToTextual(node: ComponentNode): string {
  return `from textual.app import App, ComposeResult
from textual.widgets import Static, Button, Input

class MyApp(App):
    def compose(self) -> ComposeResult:
${generateTextualComponents(node, 2)}

    def on_button_pressed(self, event: Button.Pressed) -> None:
        pass

if __name__ == "__main__":
    app = MyApp()
    app.run()
`;
}

function generateTextualComponents(node: ComponentNode, indent: number): string {
  const spaces = '  '.repeat(indent);
  if (node.type === 'Text')      return `${spaces}yield Static("${node.props.content || 'Text'}")\n`;
  if (node.type === 'Button')    return `${spaces}yield Button("${node.props.label || 'Button'}")\n`;
  if (node.type === 'TextInput') return `${spaces}yield Input(placeholder="${node.props.placeholder || ''}")\n`;

  let result = '';
  for (const child of node.children) result += generateTextualComponents(child, indent);
  return result || `${spaces}yield Static("${node.type}")\n`;
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function mapToOpenTUIComponent(type: string): string {
  const map: Record<string, string> = { Box: 'Box', Text: 'Text', Button: 'Button', TextInput: 'Input' };
  return map[type] || 'Box';
}

function generatePropsString(node: ComponentNode): string {
  const props: string[] = [];
  if (node.props.width  && typeof node.props.width  === 'number') props.push(`width={${node.props.width}}`);
  if (node.props.height && typeof node.props.height === 'number') props.push(`height={${node.props.height}}`);
  return props.length ? ' ' + props.join(' ') : '';
}

function generateStyleString(node: ComponentNode): string {
  const styles: string[] = [];
  if (node.style.color)           styles.push(`color="${node.style.color}"`);
  if (node.style.backgroundColor) styles.push(`backgroundColor="${node.style.backgroundColor}"`);
  if (node.style.border)          styles.push(`border={true}`);
  if (node.style.bold)            styles.push(`bold={true}`);
  return styles.length ? ' ' + styles.join(' ') : '';
}
