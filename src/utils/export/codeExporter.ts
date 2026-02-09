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

function exportToInk(node: ComponentNode): string {
  return `import React from 'react';
import { render, Box, Text } from 'ink';

function App() {
  return (
${generateInkComponent(node, 1)}
  );
}

render(<App />);
`;
}

function generateInkComponent(node: ComponentNode, indent: number): string {
  const spaces = '  '.repeat(indent);
  const componentName = mapToInkComponent(node.type);

  const props = generatePropsString(node);

  let result = `${spaces}<${componentName}${props}`;

  if (node.children.length > 0) {
    result += '>\n';
    for (const child of node.children) {
      result += generateInkComponent(child, indent + 1);
    }
    result += `${spaces}</${componentName}>\n`;
  } else if (node.type === 'Text') {
    result += `>${node.props.content || ''}</${componentName}>\n`;
  } else {
    result += ' />\n';
  }

  return result;
}

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

  // Simple text-based representation for BubbleTea
  if (node.type === 'Text') {
    return `${spaces}return "${node.props.content || 'Text'}"\n`;
  }

  return `${spaces}return "Component: ${node.type}"\n`;
}

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
  if (node.props.width) options.push(`width: ${JSON.stringify(node.props.width)}`);
  if (node.props.height) options.push(`height: ${JSON.stringify(node.props.height)}`);
  if (node.style.border) options.push(`border: { type: 'line' }`);
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

function exportToTextual(node: ComponentNode): string {
  return `from textual.app import App, ComposeResult
from textual.widgets import Static, Button, Input

class MyApp(App):
    def compose(self) -> ComposeResult:
${generateTextualComponents(node, 2)}

    def on_button_pressed(self, event: Button.Pressed) -> None:
        # Handle button press
        pass

if __name__ == "__main__":
    app = MyApp()
    app.run()
`;
}

function generateTextualComponents(node: ComponentNode, indent: number): string {
  const spaces = '  '.repeat(indent);
  const componentName = mapToTextualComponent(node.type);

  if (node.type === 'Text') {
    return `${spaces}yield Static("${node.props.content || 'Text'}")\n`;
  } else if (node.type === 'Button') {
    return `${spaces}yield Button("${node.props.label || 'Button'}")\n`;
  } else if (node.type === 'TextInput') {
    return `${spaces}yield Input(placeholder="${node.props.placeholder || ''}")\n`;
  }

  let result = '';
  for (const child of node.children) {
    result += generateTextualComponents(child, indent);
  }

  return result || `${spaces}yield Static("${node.type}")\n`;
}

// Component name mappers
function mapToOpenTUIComponent(type: string): string {
  const map: Record<string, string> = {
    'Box': 'Box',
    'Flexbox': 'Flex',
    'Text': 'Text',
    'Button': 'Button',
    'TextInput': 'Input',
  };
  return map[type] || 'Box';
}

function mapToInkComponent(type: string): string {
  const map: Record<string, string> = {
    'Box': 'Box',
    'Text': 'Text',
    'TextInput': 'TextInput',
  };
  return map[type] || 'Box';
}

function mapToTextualComponent(type: string): string {
  const map: Record<string, string> = {
    'Text': 'Static',
    'Button': 'Button',
    'TextInput': 'Input',
  };
  return map[type] || 'Static';
}

// Props and style generators
function generatePropsString(node: ComponentNode): string {
  const props: string[] = [];

  if (node.props.width && typeof node.props.width === 'number') {
    props.push(`width={${node.props.width}}`);
  }
  if (node.props.height && typeof node.props.height === 'number') {
    props.push(`height={${node.props.height}}`);
  }

  return props.length > 0 ? ' ' + props.join(' ') : '';
}

function generateStyleString(node: ComponentNode): string {
  const styles: string[] = [];

  if (node.style.color) styles.push(`color="${node.style.color}"`);
  if (node.style.backgroundColor) styles.push(`backgroundColor="${node.style.backgroundColor}"`);
  if (node.style.border) styles.push(`border={true}`);
  if (node.style.bold) styles.push(`bold={true}`);

  return styles.length > 0 ? ' ' + styles.join(' ') : '';
}
