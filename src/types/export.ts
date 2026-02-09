// Export format types

export type ExportFormatId =
  | 'opentui-react'
  | 'ink-react'
  | 'bubbletea-go'
  | 'blessed-js'
  | 'textual-python'
  | 'tview-go';

export interface ExportFormat {
  id: ExportFormatId;
  name: string;
  language: string;
  extension: string;
  icon: string;
  description?: string;
}

export interface ExportSettings {
  format: ExportFormatId;
  fileName: string;
  includeComments: boolean;
  includeUsageExample: boolean;
  colorMode: 'ansi' | 'hex' | 'rgb';
  indentSize: number;
  useSpaces: boolean;
}

// Framework-specific settings
export interface OpenTuiExportSettings extends ExportSettings {
  includeTypes: boolean;
  useJSX: boolean;
}

export interface InkExportSettings extends ExportSettings {
  includeTypes: boolean;
  useJSX: boolean;
}

export interface BubbleteaExportSettings extends ExportSettings {
  packageName: string;
  usePointers: boolean;
}

export interface BlessedExportSettings extends ExportSettings {
  useESModules: boolean;
}

export interface TextualExportSettings extends ExportSettings {
  useAsyncIO: boolean;
  includeCSS: boolean;
}

// Project export
export interface ProjectExportData {
  version: string;
  project: import('./layout').Project;
  exportSettings: ExportSettings;
  timestamp: Date;
}
