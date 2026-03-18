import type { ComponentNode } from '../../../types';

export function exportToRatatui(root: ComponentNode): string {
  return `use std::io;
use ratatui::{
    crossterm::event::{self, Event, KeyCode, KeyEventKind},
    layout::{Alignment, Constraint, Direction, Layout, Rect},
    style::{Color, Modifier, Style},
    text::Line,
    widgets::{Block, BorderType, Borders, Gauge, List, ListItem, Paragraph, Row, Table, Tabs, Wrap},
    Frame,
};

fn main() -> io::Result<()> {
    let mut terminal = ratatui::init();
    loop {
        terminal.draw(ui)?;
        if let Event::Key(key) = event::read()? {
            if key.kind == KeyEventKind::Press {
                match key.code {
                    KeyCode::Char('q') | KeyCode::Esc => break,
                    _ => {}
                }
            }
        }
    }
    ratatui::restore();
    Ok(())
}

fn ui(frame: &mut Frame) {
    let area = frame.area();
${generateRatatuiNode(root, 1, 'area')}
}
`;
}

function generateRatatuiNode(node: ComponentNode, indent: number, areaVar: string): string {
  if (node.hidden) return '';
  const sp = '    '.repeat(indent);

  if (node.type === 'Screen' || node.type === 'Box' || node.type === 'Grid' || node.type === 'Modal') {
    let out = '';
    let targetArea = areaVar;

    if (node.type === 'Modal') {
      const modalW = typeof node.props.width === 'number' ? node.props.width : 40;
      const modalH = typeof node.props.height === 'number' ? node.props.height : 12;
      targetArea = `modal_${areaVar.replace(/[^a-zA-Z0-9_]/g, '_')}`;
      out += `${sp}let ${targetArea} = Rect::new(\n`;
      out += `${sp}    ${areaVar}.x + (${areaVar}.width.saturating_sub(${modalW})) / 2,\n`;
      out += `${sp}    ${areaVar}.y + (${areaVar}.height.saturating_sub(${modalH})) / 2,\n`;
      out += `${sp}    ${modalW},\n`;
      out += `${sp}    ${modalH},\n`;
      out += `${sp});\n`;
    }
    if (node.type !== 'Screen' && node.style.border) {
      out += `${sp}let block = ${ratatuiBlock(node)};\n`;
      out += `${sp}let inner = block.inner(${targetArea});\n`;
      out += `${sp}frame.render_widget(block, ${targetArea});\n`;
      targetArea = 'inner';
    }

    if (node.children.length === 0) return out;

    if (node.layout.type === 'absolute') {
      for (const child of node.children) {
        const x = typeof child.layout.x === 'number' ? child.layout.x : 0;
        const y = typeof child.layout.y === 'number' ? child.layout.y : 0;
        const w = typeof child.props.width === 'number' ? child.props.width : 20;
        const h = typeof child.props.height === 'number' ? child.props.height : 3;
        const childArea = `area_${child.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
        out += `${sp}let ${childArea} = Rect::new(${targetArea}.x + ${x}, ${targetArea}.y + ${y}, ${w}, ${h});\n`;
        out += generateRatatuiNode(child, indent, childArea);
      }
      return out;
    }

    if (node.type === 'Grid') {
      const columns = Math.max(1, Number(node.layout.columns ?? 2));
      const rows = Math.max(1, Number(node.layout.rows ?? Math.ceil(node.children.length / columns)));
      const rowChunks = `grid_rows_${targetArea.replace(/[^a-zA-Z0-9_]/g, '_')}`;
      out += `${sp}let ${rowChunks} = Layout::default()\n`;
      out += `${sp}    .direction(Direction::Vertical)\n`;
      out += `${sp}    .constraints([${Array.from({ length: rows }, () => 'Constraint::Fill(1)').join(', ')}])\n`;
      out += `${sp}    .split(${targetArea});\n`;
      for (let row = 0; row < rows; row++) {
        const rowArea = `${rowChunks}[${row}]`;
        const colChunks = `grid_cols_${targetArea.replace(/[^a-zA-Z0-9_]/g, '_')}_${row}`;
        out += `${sp}let ${colChunks} = Layout::default()\n`;
        out += `${sp}    .direction(Direction::Horizontal)\n`;
        out += `${sp}    .constraints([${Array.from({ length: columns }, () => 'Constraint::Fill(1)').join(', ')}])\n`;
        out += `${sp}    .split(${rowArea});\n`;
        for (let col = 0; col < columns; col++) {
          const childIndex = row * columns + col;
          const child = node.children[childIndex];
          if (child) out += generateRatatuiNode(child, indent, `${colChunks}[${col}]`);
        }
      }
      return out;
    }

    const dir = node.layout.direction === 'row' ? 'Horizontal' : 'Vertical';
    const axis: 'width' | 'height' = node.layout.direction === 'row' ? 'width' : 'height';
    const chunks = `chunks_${targetArea.replace(/[^a-zA-Z0-9_]/g, '_')}`;
    const constraints = node.children.map(child => ratatuiConstraint(child, axis)).join(', ');
    out += `${sp}let ${chunks} = Layout::default()\n`;
    out += `${sp}    .direction(Direction::${dir})\n`;
    out += `${sp}    .constraints([${constraints}])\n`;
    out += `${sp}    .split(${targetArea});\n`;
    node.children.forEach((child, i) => {
      out += generateRatatuiNode(child, indent, `${chunks}[${i}]`);
    });
    return out;
  }

  if (node.type === 'Spacer') return `${sp}// Spacer consumes layout space via constraints only\n`;

  if (node.type === 'Text') {
    const content = (node.props.content as string) || 'Text';
    let widget = content.includes('\n')
      ? `Paragraph::new(vec![${content.split('\n').map(line => `Line::from(${escRust(line)})`).join(', ')}])`
      : `Paragraph::new(${escRust(content)})`;
    widget += `.style(${ratatuiStyle(node)})`;
    if (node.style.border) widget += `.block(${ratatuiBlock(node)})`;
    if (node.props.wrap) widget += `.wrap(Wrap { trim: false })`;
    return `${sp}frame.render_widget(${widget}, ${areaVar});\n`;
  }

  if (node.type === 'Button') {
    let widget = `Paragraph::new(${escRust((node.props.label as string) || 'Button')})`;
    widget += `.alignment(Alignment::Center).style(${ratatuiStyle(node)})`;
    widget += `.block(${ratatuiBlock(node)})`;
    return `${sp}frame.render_widget(${widget}, ${areaVar});\n`;
  }

  if (node.type === 'TextInput') {
    const value = ((node.props.value as string) || (node.props.placeholder as string) || '') + '_';
    let widget = `Paragraph::new(${escRust(value)}).style(${ratatuiStyle(node)})`;
    if (node.style.border) widget += `.block(${ratatuiBlock(node)})`;
    return `${sp}frame.render_widget(${widget}, ${areaVar});\n`;
  }

  if (node.type === 'Checkbox' || node.type === 'Radio' || node.type === 'Toggle' || node.type === 'Select' || node.type === 'Spinner' || node.type === 'Breadcrumb') {
    const text = ratatuiInlineText(node);
    let widget = `Paragraph::new(${escRust(text)}).style(${ratatuiStyle(node)})`;
    if (node.style.border) widget += `.block(${ratatuiBlock(node)})`;
    return `${sp}frame.render_widget(${widget}, ${areaVar});\n`;
  }

  if (node.type === 'ProgressBar') {
    const value = Number(node.props.value ?? 0);
    const max = Number(node.props.max ?? 100) || 100;
    let widget = `Gauge::default().ratio(${Math.max(0, Math.min(1, value / max)).toFixed(3)}).style(${ratatuiStyle(node)})`;
    if (node.style.border) widget += `.block(${ratatuiBlock(node)})`;
    return `${sp}frame.render_widget(${widget}, ${areaVar});\n`;
  }

  if (node.type === 'List' || node.type === 'Menu' || node.type === 'Tree') {
    const items = ratatuiListItems(node);
    let widget = `List::new(vec![${items}]).style(${ratatuiStyle(node)})`;
    if (node.style.border) widget += `.block(${ratatuiBlock(node)})`;
    return `${sp}frame.render_widget(${widget}, ${areaVar});\n`;
  }

  if (node.type === 'Tabs') {
    const tabs = ((node.props.tabs as any[]) || []).map((tab: any) => typeof tab === 'string' ? tab : (tab.label || 'Tab'));
    let widget = `Tabs::new(vec![${tabs.map(t => escRust(t)).join(', ')}]).select(${Number(node.props.activeTab ?? 0)}).style(${ratatuiStyle(node)}).highlight_style(Style::default().add_modifier(Modifier::BOLD))`;
    if (node.style.border) widget += `.block(${ratatuiBlock(node)})`;
    return `${sp}frame.render_widget(${widget}, ${areaVar});\n`;
  }

  if (node.type === 'Table') {
    const cols = ((node.props.columns as string[]) || ['Column 1', 'Column 2']).map(c => escRust(c)).join(', ');
    const rows = ((node.props.rows as string[][]) || [])
      .map(row => `Row::new(vec![${row.map(cell => escRust(String(cell))).join(', ')}])`)
      .join(', ');
    const widths = ((node.props.columns as string[]) || ['a', 'b']).map(() => 'Constraint::Fill(1)').join(', ');
    let widget = `Table::new(vec![${rows}], [${widths}]).header(Row::new(vec![${cols}]).style(Style::default().add_modifier(Modifier::BOLD))).style(${ratatuiStyle(node)})`;
    if (node.style.border) widget += `.block(${ratatuiBlock(node)})`;
    return `${sp}frame.render_widget(${widget}, ${areaVar});\n`;
  }

  return `${sp}frame.render_widget(Paragraph::new(${escRust(node.type)}), ${areaVar});\n`;
}

function ratatuiConstraint(node: ComponentNode, axis: 'width' | 'height'): string {
  if (node.type === 'Spacer') return 'Constraint::Fill(1)';
  const value = node.props[axis];
  if (typeof value === 'number') return `Constraint::Length(${value})`;
  if (value === 'fill') return 'Constraint::Fill(1)';
  if (value === 'auto') return 'Constraint::Min(0)';
  return 'Constraint::Min(0)';
}

function ratatuiBlock(node: ComponentNode): string {
  let block = 'Block::default().borders(Borders::ALL)';
  block += `.border_type(${ratatuiBorderType(node.style.borderStyle as string | undefined)})`;
  if (node.name && node.name !== node.type) block += `.title(${escRust(node.name)})`;
  if (node.style.borderColor) block += `.border_style(Style::default().fg(${ratatuiColor(node.style.borderColor)}))`;
  return block;
}

function ratatuiBorderType(style: string | undefined): string {
  switch (style) {
    case 'double': return 'BorderType::Double';
    case 'rounded': return 'BorderType::Rounded';
    case 'bold': return 'BorderType::Thick';
    default: return 'BorderType::Plain';
  }
}

function ratatuiColor(value: string | undefined): string {
  if (!value) return 'Color::Reset';
  const named: Record<string, string> = {
    black: 'Color::Black', white: 'Color::White', red: 'Color::Red', green: 'Color::Green',
    yellow: 'Color::Yellow', blue: 'Color::Blue', magenta: 'Color::Magenta', cyan: 'Color::Cyan',
    gray: 'Color::Gray', grey: 'Color::Gray', darkgray: 'Color::DarkGray',
    lightred: 'Color::LightRed', lightgreen: 'Color::LightGreen', lightyellow: 'Color::LightYellow',
    lightblue: 'Color::LightBlue', lightmagenta: 'Color::LightMagenta', lightcyan: 'Color::LightCyan',
  };
  const lower = value.toLowerCase().replace(/[^a-z0-9#]/g, '');
  if (named[lower]) return named[lower];
  if (/^#[0-9a-f]{6}$/i.test(lower)) {
    const r = parseInt(lower.slice(1, 3), 16);
    const g = parseInt(lower.slice(3, 5), 16);
    const b = parseInt(lower.slice(5, 7), 16);
    return `Color::Rgb(${r}, ${g}, ${b})`;
  }
  return 'Color::Reset';
}

function ratatuiStyle(node: ComponentNode): string {
  let style = 'Style::default()';
  if (node.style.color) style += `.fg(${ratatuiColor(node.style.color)})`;
  if (node.style.backgroundColor) style += `.bg(${ratatuiColor(node.style.backgroundColor)})`;
  const mods: string[] = [];
  if (node.style.bold) mods.push('Modifier::BOLD');
  if (node.style.italic) mods.push('Modifier::ITALIC');
  if (node.style.underline) mods.push('Modifier::UNDERLINED');
  if (node.style.strikethrough) mods.push('Modifier::CROSSED_OUT');
  if (mods.length) style += `.add_modifier(${mods.join(' | ')})`;
  return style;
}

function ratatuiInlineText(node: ComponentNode): string {
  switch (node.type) {
    case 'Checkbox': {
      const checked = !!node.props.checked;
      const icon = checked ? ((node.props.checkedIcon as string) || '✓') : ((node.props.uncheckedIcon as string) || ' ');
      return `[${icon}] ${(node.props.label as string) || 'Checkbox'}`;
    }
    case 'Radio': {
      const selected = !!node.props.checked;
      const icon = selected ? ((node.props.selectedIcon as string) || '●') : ((node.props.unselectedIcon as string) || '○');
      return `(${icon}) ${(node.props.label as string) || 'Radio'}`;
    }
    case 'Toggle':
      return `${node.props.checked ? '[ON ]' : '[OFF]'} ${(node.props.label as string) || 'Toggle'}`;
    case 'Select': {
      const options = (node.props.options as string[]) || ['Option 1'];
      const idx = Number(node.props.selectedIndex ?? 0);
      return `${options[idx] || options[0] || 'Select'} ▼`;
    }
    case 'Spinner':
      return '⠋ Loading...';
    case 'Breadcrumb': {
      const items = ((node.props.items as any[]) || []).map((i: any) => typeof i === 'string' ? i : (i.label || ''));
      return items.join((node.props.separator as string) || ' / ');
    }
    default:
      return node.type;
    }
}

function ratatuiListItems(node: ComponentNode): string {
  if (node.type === 'Tree') {
    const flat: string[] = [];
    const walk = (item: any, depth: number) => {
      const d = typeof item === 'string' ? { label: item, children: [] } : item;
      const prefix = `${'  '.repeat(depth)}${depth > 0 ? '├─ ' : ''}`;
      flat.push(`ListItem::new(${escRust(prefix + (d.label || 'Item'))})`);
      (d.children || []).forEach((child: any) => walk(child, depth + 1));
    };
    (((node.props.items as any[]) || [])).forEach((item: any) => walk(item, 0));
    return flat.join(', ');
  }
  const items = ((node.props.items as any[]) || []).map((item: any) => {
    const d = typeof item === 'string' ? { label: item, icon: node.type === 'List' ? '•' : '' } : item;
    const prefix = d.icon ? `${d.icon} ` : '';
    const hotkey = d.hotkey ? `  ${d.hotkey}` : '';
    return `ListItem::new(${escRust(prefix + (d.label || 'Item') + hotkey)})`;
  });
  return items.join(', ');
}

function escRust(s: string): string {
  return `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
}
