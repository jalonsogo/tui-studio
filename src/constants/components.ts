// Built-in component library definitions

import type { ComponentType } from '../types';

export interface ComponentDefinition {
  type: ComponentType;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  category: 'layout' | 'input' | 'display' | 'data' | 'navigation' | 'overlay';
  defaultProps: Record<string, unknown>;
  defaultLayout: {
    type: 'flexbox' | 'grid' | 'absolute' | 'none';
    [key: string]: unknown;
  };
  defaultStyle: Record<string, unknown>;
  defaultEvents?: Record<string, string>;
}

export const COMPONENT_LIBRARY: Record<ComponentType, ComponentDefinition> = {
  // Layout Components
  Box: {
    type: 'Box',
    name: 'Box',
    description: 'Container with optional border',
    icon: 'Square',
    category: 'layout',
    defaultProps: {
      width: 'auto',
      height: 'auto',
    },
    defaultLayout: {
      type: 'flexbox',
      direction: 'column',
      padding: 1,
    },
    defaultStyle: {
      border: true,
      borderStyle: 'single',
      borderColor: 'white',
    },
  },

  Flexbox: {
    type: 'Flexbox',
    name: 'Flexbox',
    description: 'Flexible box layout',
    icon: 'Columns',
    category: 'layout',
    defaultProps: {},
    defaultLayout: {
      type: 'flexbox',
      direction: 'row',
      gap: 1,
    },
    defaultStyle: {},
  },

  Grid: {
    type: 'Grid',
    name: 'Grid',
    description: 'CSS Grid layout',
    icon: 'Grid3x3',
    category: 'layout',
    defaultProps: {},
    defaultLayout: {
      type: 'grid',
      columns: 2,
      rows: 2,
      columnGap: 1,
      rowGap: 1,
    },
    defaultStyle: {},
  },

  Stack: {
    type: 'Stack',
    name: 'Stack',
    description: 'Vertical or horizontal stack',
    icon: 'Layers',
    category: 'layout',
    defaultProps: {},
    defaultLayout: {
      type: 'flexbox',
      direction: 'column',
      gap: 0,
    },
    defaultStyle: {},
  },

  Spacer: {
    type: 'Spacer',
    name: 'Spacer',
    description: 'Empty space',
    icon: 'Space',
    category: 'layout',
    defaultProps: {
      width: 1,
      height: 1,
    },
    defaultLayout: {
      type: 'none',
    },
    defaultStyle: {},
  },

  // Input Components
  TextInput: {
    type: 'TextInput',
    name: 'Text Input',
    description: 'Single-line text input',
    icon: 'Input',
    category: 'input',
    defaultProps: {
      placeholder: 'Enter text...',
      value: '',
      width: 20,
    },
    defaultLayout: {
      type: 'none',
    },
    defaultStyle: {
      border: true,
      borderStyle: 'single',
    },
    defaultEvents: {
      onChange: 'handleChange',
    },
  },

  Button: {
    type: 'Button',
    name: 'Button',
    description: 'Clickable button',
    icon: 'RectangleHorizontal',
    category: 'input',
    defaultProps: {
      label: 'Button',
      disabled: false,
    },
    defaultLayout: {
      type: 'none',
      padding: { top: 0, right: 2, bottom: 0, left: 2 },
    },
    defaultStyle: {
      border: true,
      borderStyle: 'rounded',
      bold: true,
    },
    defaultEvents: {
      onClick: 'handleClick',
    },
  },

  Checkbox: {
    type: 'Checkbox',
    name: 'Checkbox',
    description: 'Checkbox input',
    icon: 'CheckSquare',
    category: 'input',
    defaultProps: {
      label: 'Option',
      checked: false,
    },
    defaultLayout: {
      type: 'none',
    },
    defaultStyle: {},
    defaultEvents: {
      onChange: 'handleChange',
    },
  },

  Radio: {
    type: 'Radio',
    name: 'Radio',
    description: 'Radio button input',
    icon: 'Circle',
    category: 'input',
    defaultProps: {
      label: 'Option',
      checked: false,
    },
    defaultLayout: {
      type: 'none',
    },
    defaultStyle: {},
    defaultEvents: {
      onChange: 'handleChange',
    },
  },

  Select: {
    type: 'Select',
    name: 'Select',
    description: 'Dropdown select',
    icon: 'ChevronDown',
    category: 'input',
    defaultProps: {
      options: ['Option 1', 'Option 2', 'Option 3'],
      value: '',
    },
    defaultLayout: {
      type: 'none',
    },
    defaultStyle: {
      border: true,
      borderStyle: 'single',
    },
    defaultEvents: {
      onChange: 'handleChange',
    },
  },

  Toggle: {
    type: 'Toggle',
    name: 'Toggle',
    description: 'Toggle switch',
    icon: 'ToggleLeft',
    category: 'input',
    defaultProps: {
      label: 'Toggle',
      checked: false,
    },
    defaultLayout: {
      type: 'none',
    },
    defaultStyle: {},
    defaultEvents: {
      onChange: 'handleChange',
    },
  },

  // Display Components
  Text: {
    type: 'Text',
    name: 'Text',
    description: 'Static text label',
    icon: 'Type',
    category: 'display',
    defaultProps: {
      content: 'Text',
      wrap: false,
    },
    defaultLayout: {
      type: 'none',
    },
    defaultStyle: {},
  },

  Label: {
    type: 'Label',
    name: 'Label',
    description: 'Form label',
    icon: 'Tag',
    category: 'display',
    defaultProps: {
      content: 'Label:',
    },
    defaultLayout: {
      type: 'none',
    },
    defaultStyle: {
      bold: true,
    },
  },

  Badge: {
    type: 'Badge',
    name: 'Badge',
    description: 'Status badge',
    icon: 'Badge',
    category: 'display',
    defaultProps: {
      content: 'Badge',
    },
    defaultLayout: {
      type: 'none',
      padding: { top: 0, right: 1, bottom: 0, left: 1 },
    },
    defaultStyle: {
      backgroundColor: 'blue',
      color: 'white',
    },
  },

  Spinner: {
    type: 'Spinner',
    name: 'Spinner',
    description: 'Loading spinner',
    icon: 'Loader2',
    category: 'display',
    defaultProps: {},
    defaultLayout: {
      type: 'none',
    },
    defaultStyle: {},
  },

  ProgressBar: {
    type: 'ProgressBar',
    name: 'Progress Bar',
    description: 'Progress indicator',
    icon: 'Activity',
    category: 'display',
    defaultProps: {
      value: 0,
      max: 100,
      width: 20,
    },
    defaultLayout: {
      type: 'none',
    },
    defaultStyle: {
      border: true,
      borderStyle: 'single',
    },
  },

  // Data Components
  Table: {
    type: 'Table',
    name: 'Table',
    description: 'Data table',
    icon: 'Table',
    category: 'data',
    defaultProps: {
      columns: ['Column 1', 'Column 2'],
      rows: [
        ['Cell 1', 'Cell 2'],
        ['Cell 3', 'Cell 4'],
      ],
    },
    defaultLayout: {
      type: 'none',
    },
    defaultStyle: {
      border: true,
      borderStyle: 'single',
    },
  },

  List: {
    type: 'List',
    name: 'List',
    description: 'Selectable list',
    icon: 'List',
    category: 'data',
    defaultProps: {
      items: ['Item 1', 'Item 2', 'Item 3'],
      selectedIndex: 0,
    },
    defaultLayout: {
      type: 'flexbox',
      direction: 'column',
    },
    defaultStyle: {
      border: true,
      borderStyle: 'single',
    },
    defaultEvents: {
      onSelect: 'handleSelect',
    },
  },

  Tree: {
    type: 'Tree',
    name: 'Tree',
    description: 'Hierarchical tree',
    icon: 'Network',
    category: 'data',
    defaultProps: {
      items: [],
    },
    defaultLayout: {
      type: 'flexbox',
      direction: 'column',
    },
    defaultStyle: {},
  },

  // Navigation Components
  Menu: {
    type: 'Menu',
    name: 'Menu',
    description: 'Navigation menu',
    icon: 'Menu',
    category: 'navigation',
    defaultProps: {
      items: ['Home', 'Settings', 'Exit'],
    },
    defaultLayout: {
      type: 'flexbox',
      direction: 'column',
    },
    defaultStyle: {
      border: true,
      borderStyle: 'single',
    },
  },

  Tabs: {
    type: 'Tabs',
    name: 'Tabs',
    description: 'Tab navigation',
    icon: 'Tabs',
    category: 'navigation',
    defaultProps: {
      tabs: ['Tab 1', 'Tab 2', 'Tab 3'],
      activeTab: 0,
    },
    defaultLayout: {
      type: 'flexbox',
      direction: 'column',
    },
    defaultStyle: {},
  },

  Breadcrumb: {
    type: 'Breadcrumb',
    name: 'Breadcrumb',
    description: 'Breadcrumb navigation',
    icon: 'ChevronRight',
    category: 'navigation',
    defaultProps: {
      items: ['Home', 'Documents', 'File'],
    },
    defaultLayout: {
      type: 'flexbox',
      direction: 'row',
      gap: 1,
    },
    defaultStyle: {},
  },

  // Overlay Components
  Modal: {
    type: 'Modal',
    name: 'Modal',
    description: 'Modal dialog',
    icon: 'SquareDashedBottomCode',
    category: 'overlay',
    defaultProps: {
      title: 'Modal',
      width: 40,
      height: 12,
    },
    defaultLayout: {
      type: 'flexbox',
      direction: 'column',
      padding: 2,
    },
    defaultStyle: {
      border: true,
      borderStyle: 'double',
      backgroundColor: 'black',
    },
  },

  Popover: {
    type: 'Popover',
    name: 'Popover',
    description: 'Popover overlay',
    icon: 'MessageSquare',
    category: 'overlay',
    defaultProps: {},
    defaultLayout: {
      type: 'flexbox',
      direction: 'column',
      padding: 1,
    },
    defaultStyle: {
      border: true,
      borderStyle: 'rounded',
    },
  },

  Tooltip: {
    type: 'Tooltip',
    name: 'Tooltip',
    description: 'Tooltip',
    icon: 'Info',
    category: 'overlay',
    defaultProps: {
      content: 'Tooltip text',
    },
    defaultLayout: {
      type: 'none',
      padding: { top: 0, right: 1, bottom: 0, left: 1 },
    },
    defaultStyle: {
      backgroundColor: 'brightBlack',
      color: 'white',
    },
  },
};

// Get components by category
export function getComponentsByCategory(
  category: ComponentDefinition['category']
): ComponentDefinition[] {
  return Object.values(COMPONENT_LIBRARY).filter((c) => c.category === category);
}

// Get all categories
export const CATEGORIES: Array<{ id: ComponentDefinition['category']; name: string }> = [
  { id: 'layout', name: 'Layout' },
  { id: 'input', name: 'Input' },
  { id: 'display', name: 'Display' },
  { id: 'data', name: 'Data' },
  { id: 'navigation', name: 'Navigation' },
  { id: 'overlay', name: 'Overlay' },
];
