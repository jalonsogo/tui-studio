import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '../public');

const browser = await chromium.launch();

/** Add a set of components to the canvas via keyboard shortcuts */
async function addComponents(page) {
  await page.click('body');
  await page.waitForTimeout(100);
  // r=Box, b=Button, i=TextInput, y=Text, l=List, t=Tabs, p=ProgressBar, n=Spinner
  for (const key of ['r', 'b', 'i', 'y', 'l', 't', 'p', 'n']) {
    await page.keyboard.press(key);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(400);
}

/** Switch the TUI canvas theme via the toolbar select */
async function setTheme(page, theme) {
  await page.selectOption('select.text-xs', theme);
  await page.waitForTimeout(300);
}

/** Toggle editor dark/light mode via Settings (Cmd+K) */
async function toggleEditorMode(page) {
  await page.keyboard.press('Meta+k');
  await page.waitForSelector('button[role="switch"]', { timeout: 3000 });
  await page.click('button[role="switch"]');
  await page.waitForTimeout(200);
  // Close modal — press Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}

const SLIDES = [
  { theme: 'dracula',        label: 'dracula',     darkMode: true  },
  { theme: 'nord',           label: 'nord',        darkMode: true  },
  { theme: 'tokyo-night',    label: 'tokyo-night', darkMode: true  },
  { theme: 'monokai',        label: 'monokai',     darkMode: true  },
  { theme: 'solarized-light',label: 'light-mode',  darkMode: false },
];

let page = null;

for (const slide of SLIDES) {
  page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  // Always start fresh — set dark mode in localStorage before load
  await page.addInitScript((dark) => {
    localStorage.setItem('settings-dark-mode', String(dark));
  }, slide.darkMode);

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Force light mode by removing the dark class (App.tsx always adds it on mount)
  if (!slide.darkMode) {
    await page.evaluate(() => document.documentElement.classList.remove('dark'));
    await page.waitForTimeout(200);
  }

  await addComponents(page);
  await setTheme(page, slide.theme);

  const filename = `screenshot-${slide.label}.png`;
  await page.screenshot({ path: path.join(publicDir, filename) });
  console.log(`✓ ${filename}`);
  await page.close();
}

// Landing page preview
page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto('http://localhost:5173/landing.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.screenshot({ path: path.join(publicDir, 'screenshot-landing.png') });
console.log('✓ screenshot-landing.png');
await page.close();

await browser.close();
