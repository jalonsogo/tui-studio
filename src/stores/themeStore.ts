// Theme state management

import { create } from 'zustand';

type ColorMode = 'ansi16' | 'ansi256' | 'trueColor';
type ThemeName = 'default' | 'solarized-dark' | 'solarized-light' | 'dracula' | 'nord' | 'monokai' | 'gruvbox' | 'tokyo-night' | 'nightfox' | 'sonokai';

interface AnsiColors {
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

interface ThemeState {
  // Theme
  darkMode: boolean;
  colorMode: ColorMode;
  currentTheme: ThemeName;

  // ANSI colors
  ansiColors: AnsiColors;

  // Actions
  toggleDarkMode: () => void;
  setColorMode: (mode: ColorMode) => void;
  setTheme: (theme: ThemeName) => void;
  setAnsiColor: (color: keyof AnsiColors, value: string) => void;
  resetColors: () => void;
}

// Terminal color themes
export const THEMES: Record<ThemeName, AnsiColors> = {
  default: {
    black: '#000000',
    red: '#ff0000',
    green: '#00ff00',
    yellow: '#ffff00',
    blue: '#0000ff',
    magenta: '#ff00ff',
    cyan: '#00ffff',
    white: '#ffffff',
    brightBlack: '#808080',
    brightRed: '#ff8080',
    brightGreen: '#80ff80',
    brightYellow: '#ffff80',
    brightBlue: '#8080ff',
    brightMagenta: '#ff80ff',
    brightCyan: '#80ffff',
    brightWhite: '#ffffff',
  },
  'solarized-dark': {
    black: '#073642',
    red: '#dc322f',
    green: '#859900',
    yellow: '#b58900',
    blue: '#268bd2',
    magenta: '#d33682',
    cyan: '#2aa198',
    white: '#eee8d5',
    brightBlack: '#002b36',
    brightRed: '#cb4b16',
    brightGreen: '#586e75',
    brightYellow: '#657b83',
    brightBlue: '#839496',
    brightMagenta: '#6c71c4',
    brightCyan: '#93a1a1',
    brightWhite: '#fdf6e3',
  },
  'solarized-light': {
    black: '#eee8d5',
    red: '#dc322f',
    green: '#859900',
    yellow: '#b58900',
    blue: '#268bd2',
    magenta: '#d33682',
    cyan: '#2aa198',
    white: '#073642',
    brightBlack: '#fdf6e3',
    brightRed: '#cb4b16',
    brightGreen: '#93a1a1',
    brightYellow: '#839496',
    brightBlue: '#657b83',
    brightMagenta: '#6c71c4',
    brightCyan: '#586e75',
    brightWhite: '#002b36',
  },
  dracula: {
    black: '#21222c',
    red: '#ff5555',
    green: '#50fa7b',
    yellow: '#f1fa8c',
    blue: '#bd93f9',
    magenta: '#ff79c6',
    cyan: '#8be9fd',
    white: '#f8f8f2',
    brightBlack: '#6272a4',
    brightRed: '#ff6e6e',
    brightGreen: '#69ff94',
    brightYellow: '#ffffa5',
    brightBlue: '#d6acff',
    brightMagenta: '#ff92df',
    brightCyan: '#a4ffff',
    brightWhite: '#ffffff',
  },
  nord: {
    black: '#3b4252',
    red: '#bf616a',
    green: '#a3be8c',
    yellow: '#ebcb8b',
    blue: '#81a1c1',
    magenta: '#b48ead',
    cyan: '#88c0d0',
    white: '#e5e9f0',
    brightBlack: '#4c566a',
    brightRed: '#bf616a',
    brightGreen: '#a3be8c',
    brightYellow: '#ebcb8b',
    brightBlue: '#81a1c1',
    brightMagenta: '#b48ead',
    brightCyan: '#8fbcbb',
    brightWhite: '#eceff4',
  },
  monokai: {
    black: '#272822',
    red: '#f92672',
    green: '#a6e22e',
    yellow: '#f4bf75',
    blue: '#66d9ef',
    magenta: '#ae81ff',
    cyan: '#a1efe4',
    white: '#f8f8f2',
    brightBlack: '#75715e',
    brightRed: '#f92672',
    brightGreen: '#a6e22e',
    brightYellow: '#f4bf75',
    brightBlue: '#66d9ef',
    brightMagenta: '#ae81ff',
    brightCyan: '#a1efe4',
    brightWhite: '#f9f8f5',
  },
  gruvbox: {
    black: '#282828',
    red: '#cc241d',
    green: '#98971a',
    yellow: '#d79921',
    blue: '#458588',
    magenta: '#b16286',
    cyan: '#689d6a',
    white: '#a89984',
    brightBlack: '#928374',
    brightRed: '#fb4934',
    brightGreen: '#b8bb26',
    brightYellow: '#fabd2f',
    brightBlue: '#83a598',
    brightMagenta: '#d3869b',
    brightCyan: '#8ec07c',
    brightWhite: '#ebdbb2',
  },
  'tokyo-night': {
    black: '#15161e',
    red: '#f7768e',
    green: '#9ece6a',
    yellow: '#e0af68',
    blue: '#7aa2f7',
    magenta: '#bb9af7',
    cyan: '#7dcfff',
    white: '#a9b1d6',
    brightBlack: '#414868',
    brightRed: '#f7768e',
    brightGreen: '#9ece6a',
    brightYellow: '#e0af68',
    brightBlue: '#7aa2f7',
    brightMagenta: '#bb9af7',
    brightCyan: '#7dcfff',
    brightWhite: '#c0caf5',
  },
  nightfox: {
    black: '#393b44',
    red: '#c94f6d',
    green: '#81b29a',
    yellow: '#dbc074',
    blue: '#719cd6',
    magenta: '#9d79d6',
    cyan: '#63cdcf',
    white: '#dfdfe0',
    brightBlack: '#575860',
    brightRed: '#d16983',
    brightGreen: '#8ebaa4',
    brightYellow: '#e0c989',
    brightBlue: '#86abdc',
    brightMagenta: '#baa1e2',
    brightCyan: '#7ad5d6',
    brightWhite: '#e4e4e5',
  },
  sonokai: {
    black: '#181819',
    red: '#fc5d7c',
    green: '#9ed072',
    yellow: '#e7c664',
    blue: '#76cce0',
    magenta: '#b39df3',
    cyan: '#f39660',
    white: '#e2e2e3',
    brightBlack: '#7f8490',
    brightRed: '#fc5d7c',
    brightGreen: '#9ed072',
    brightYellow: '#e7c664',
    brightBlue: '#76cce0',
    brightMagenta: '#b39df3',
    brightCyan: '#f39660',
    brightWhite: '#e2e2e3',
  },
};

export const THEME_NAMES: { value: ThemeName; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'solarized-dark', label: 'Solarized Dark' },
  { value: 'solarized-light', label: 'Solarized Light' },
  { value: 'dracula', label: 'Dracula' },
  { value: 'nord', label: 'Nord' },
  { value: 'monokai', label: 'Monokai' },
  { value: 'gruvbox', label: 'Gruvbox' },
  { value: 'tokyo-night', label: 'Tokyo Night' },
  { value: 'nightfox', label: 'Nightfox' },
  { value: 'sonokai', label: 'Sonokai' },
];

const defaultAnsiColors = THEMES.default;

const savedDarkMode = typeof window !== 'undefined'
  ? localStorage.getItem('settings-dark-mode') !== 'false'
  : true;

export const useThemeStore = create<ThemeState>((set) => ({
  // Initial state
  darkMode: savedDarkMode,
  colorMode: 'ansi16',
  currentTheme: 'dracula',
  ansiColors: { ...THEMES.dracula },

  // Toggle dark mode
  toggleDarkMode: () => {
    set((state) => {
      const newDarkMode = !state.darkMode;
      localStorage.setItem('settings-dark-mode', String(newDarkMode));

      if (newDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      return { darkMode: newDarkMode };
    });
  },

  // Set color mode
  setColorMode: (mode) => {
    set({ colorMode: mode });
  },

  // Set theme
  setTheme: (theme) => {
    set({ currentTheme: theme, ansiColors: { ...THEMES[theme] } });
  },

  // Set ANSI color
  setAnsiColor: (color, value) => {
    set((state) => ({
      ansiColors: {
        ...state.ansiColors,
        [color]: value,
      },
    }));
  },

  // Reset colors
  resetColors: () => {
    set((state) => ({ ansiColors: { ...THEMES[state.currentTheme] } }));
  },
}));

// Apply saved dark/light mode on load
if (typeof window !== 'undefined') {
  if (savedDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}
