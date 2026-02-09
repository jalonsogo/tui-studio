// Theme state management

import { create } from 'zustand';

type ColorMode = 'ansi16' | 'ansi256' | 'trueColor';

interface ThemeState {
  // Theme
  darkMode: boolean;
  colorMode: ColorMode;

  // ANSI colors
  ansiColors: {
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
  };

  // Actions
  toggleDarkMode: () => void;
  setColorMode: (mode: ColorMode) => void;
  setAnsiColor: (color: keyof ThemeState['ansiColors'], value: string) => void;
  resetColors: () => void;
}

const defaultAnsiColors = {
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
};

export const useThemeStore = create<ThemeState>((set) => ({
  // Initial state
  darkMode: true,
  colorMode: 'ansi16',
  ansiColors: { ...defaultAnsiColors },

  // Toggle dark mode
  toggleDarkMode: () => {
    set((state) => {
      const newDarkMode = !state.darkMode;

      // Update document class
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
    set({ ansiColors: { ...defaultAnsiColors } });
  },
}));

// Initialize dark mode on load
if (typeof window !== 'undefined') {
  document.documentElement.classList.add('dark');
}
