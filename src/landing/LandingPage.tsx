import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MonitorPlay,
  LayoutGrid,
  Layers,
  Palette,
  FileCode,
  FolderOpen,
  ArrowRight,
  Github,
  Terminal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────

const SLIDES = [
  {
    src: '/screenshot-dracula.png',
    label: 'Dracula',
    desc: 'Dark editor · Dracula theme',
    dot: '#bd93f9',
  },
  {
    src: '/screenshot-nord.png',
    label: 'Nord',
    desc: 'Dark editor · Nord theme',
    dot: '#81a1c1',
  },
  {
    src: '/screenshot-tokyo-night.png',
    label: 'Tokyo Night',
    desc: 'Dark editor · Tokyo Night theme',
    dot: '#7aa2f7',
  },
  {
    src: '/screenshot-monokai.png',
    label: 'Monokai',
    desc: 'Dark editor · Monokai theme',
    dot: '#a6e22e',
  },
  {
    src: '/screenshot-light-mode.png',
    label: 'Light Mode',
    desc: 'Light editor · Solarized Light theme',
    dot: '#fdf6e3',
  },
];

const FEATURES = [
  {
    icon: MonitorPlay,
    title: 'Visual Canvas',
    desc: 'Drag-and-drop components onto a live canvas with real-time ANSI preview at configurable zoom levels.',
  },
  {
    icon: LayoutGrid,
    title: '20+ TUI Components',
    desc: 'Screen, Box, Button, TextInput, Table, List, Tree, Tabs, Modal, Spinner, ProgressBar, and more.',
  },
  {
    icon: Layers,
    title: 'Layout Engine',
    desc: 'Absolute, Flexbox, and Grid layout modes with full property control — just like CSS in the browser.',
  },
  {
    icon: Palette,
    title: '8 Color Themes',
    desc: 'Dracula, Nord, Solarized, Monokai, Gruvbox, Tokyo Night, Nightfox, Sonokai — updating the canvas live.',
  },
  {
    icon: FileCode,
    title: 'Multi-Framework Export',
    desc: 'Generate production-ready code for Ink, BubbleTea, Blessed, Textual, OpenTUI, and Tview.',
  },
  {
    icon: FolderOpen,
    title: 'Save / Load',
    desc: 'Projects saved as portable .tui JSON files. Open from anywhere, share with your team.',
  },
];

const FRAMEWORKS = [
  { name: 'Ink', lang: 'TypeScript', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  { name: 'BubbleTea', lang: 'Go', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
  { name: 'Blessed', lang: 'JavaScript', color: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' },
  { name: 'Textual', lang: 'Python', color: 'bg-green-500/15 text-green-300 border-green-500/30' },
  { name: 'OpenTUI', lang: 'TypeScript', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  { name: 'Tview', lang: 'Go', color: 'bg-teal-500/15 text-teal-300 border-teal-500/30' },
];

const COMPONENTS = [
  'Screen', 'Box', 'Button', 'TextInput', 'Checkbox', 'Radio',
  'Select', 'Toggle', 'Text', 'Spinner', 'ProgressBar', 'Table',
  'List', 'Tree', 'Menu', 'Tabs', 'Breadcrumb', 'Modal',
  'Popover', 'Tooltip', 'Spacer',
];

const INTERVAL_MS = 4000;

// ── Carousel ──────────────────────────────────────────────────────────────────

function Carousel() {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const paused = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = useCallback((next: number) => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrent((next + SLIDES.length) % SLIDES.length);
      setTransitioning(false);
    }, 220);
  }, [transitioning]);

  const prev = () => { paused.current = true; go(current - 1); };
  const next = useCallback(() => go(current + 1), [current, go]);

  // Auto-advance
  useEffect(() => {
    const tick = () => {
      if (!paused.current) next();
      timerRef.current = setTimeout(tick, INTERVAL_MS);
    };
    timerRef.current = setTimeout(tick, INTERVAL_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [next]);

  const slide = SLIDES[current];

  return (
    <section className="max-w-5xl mx-auto px-6 pb-24">
      <div
        className="rounded-xl border border-[#2a2a2a] overflow-hidden shadow-2xl shadow-black/60"
        onMouseEnter={() => { paused.current = true; }}
        onMouseLeave={() => { paused.current = false; }}
      >
        {/* Terminal chrome bar */}
        <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] px-4 py-2.5 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
          <span className="ml-3 text-xs font-mono text-[#555] flex-1">TUIStudio — editor</span>
          {/* Theme label */}
          <span
            className="text-xs font-mono px-2 py-0.5 rounded border"
            style={{ color: slide.dot, borderColor: `${slide.dot}40`, background: `${slide.dot}12` }}
          >
            {slide.label}
          </span>
        </div>

        {/* Image with crossfade */}
        <div className="relative bg-[#0d0d0d]">
          <img
            key={current}
            src={slide.src}
            alt={slide.desc}
            className="w-full block"
            style={{
              opacity: transitioning ? 0 : 1,
              transition: 'opacity 220ms ease',
            }}
          />

          {/* Prev / Next arrows */}
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => { paused.current = true; next(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            aria-label="Next"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Dot indicators + caption */}
        <div className="bg-[#111] border-t border-[#2a2a2a] px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-[#555] font-mono">{slide.desc}</span>
          <div className="flex items-center gap-1.5">
            {SLIDES.map((s, i) => (
              <button
                key={i}
                onClick={() => { paused.current = true; go(i); }}
                className="w-2 h-2 rounded-full transition-all duration-200"
                style={{
                  background: i === current ? s.dot : '#333',
                  transform: i === current ? 'scale(1.25)' : 'scale(1)',
                }}
                aria-label={s.label}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white font-sans">

      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav className="border-b border-[#2a2a2a] sticky top-0 z-50 bg-[#0d0d0d]/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <img src="/tui-studio_dark.svg" alt="TUIStudio" className="h-6" />
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/javieralonso/tui-designer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#888] hover:text-white transition-colors"
            >
              <Github size={18} />
            </a>
            <a
              href="/index.html"
              className="flex items-center gap-1.5 bg-[#50fa7b] text-[#0d0d0d] font-semibold text-sm px-4 py-1.5 rounded-md hover:bg-[#69ff8f] transition-colors"
            >
              Open Editor <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="flex justify-center mb-8">
          <div className="relative inline-block">
            <img src="/cube.png" alt="" className="w-40 h-40 object-contain drop-shadow-[0_0_40px_rgba(80,250,123,0.35)]" />
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 bg-[#50fa7b]/10 border border-[#50fa7b]/25 text-[#50fa7b] text-xs font-mono px-3 py-1 rounded-full whitespace-nowrap backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#50fa7b] animate-pulse" />
              Alpha — work in progress
            </div>
          </div>
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-5 leading-tight">
          Design Terminal UIs.
          <br />
          <span className="text-[#50fa7b]">Visually.</span>
        </h1>

        <p className="text-[#aaa] text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          A Figma-like visual editor for TUI applications. Drag-and-drop
          components, edit properties in real-time, and export to{' '}
          <span className="text-white">6 frameworks</span> with one click.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="/index.html"
            className="flex items-center gap-2 bg-[#50fa7b] text-[#0d0d0d] font-semibold px-6 py-3 rounded-lg hover:bg-[#69ff8f] transition-colors text-base"
          >
            <Terminal size={16} />
            Open Editor
          </a>
          <a
            href="https://github.com/javieralonso/tui-designer"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 border border-[#2a2a2a] text-[#aaa] hover:text-white hover:border-[#444] px-6 py-3 rounded-lg transition-colors text-base"
          >
            <Github size={16} />
            View on GitHub
          </a>
        </div>
      </section>

      {/* ── Carousel ─────────────────────────────────────────── */}
      <Carousel />

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-bold text-center mb-3">Everything you need</h2>
        <p className="text-[#888] text-center mb-12">to design TUIs like a pro</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6 hover:border-[#3a3a3a] transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-[#50fa7b]/10 flex items-center justify-center mb-4">
                <Icon size={18} className="text-[#50fa7b]" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-[#888] text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Frameworks ───────────────────────────────────────── */}
      <section className="border-y border-[#2a2a2a] bg-[#0f0f0f]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-center mb-3">Export to 6 frameworks</h2>
          <p className="text-[#888] text-center mb-12">
            Design once, generate production-ready code for your framework of choice
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {FRAMEWORKS.map(({ name, lang, color }) => (
              <div
                key={name}
                className={`border rounded-lg px-5 py-3.5 text-center min-w-[130px] ${color}`}
              >
                <div className="font-semibold text-sm">{name}</div>
                <div className="text-xs opacity-70 font-mono mt-0.5">{lang}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Components ───────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center mb-3">21 built-in components</h2>
        <p className="text-[#888] text-center mb-12">
          All the building blocks for a full terminal application
        </p>
        <div className="flex flex-wrap justify-center gap-2.5">
          {COMPONENTS.map((name) => (
            <span
              key={name}
              className="font-mono text-sm bg-[#141414] border border-[#2a2a2a] text-[#ccc] px-3 py-1.5 rounded-md"
            >
              {name}
            </span>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────── */}
      <section className="bg-[#50fa7b]/5 border-y border-[#50fa7b]/15">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to build your TUI?</h2>
          <p className="text-[#aaa] mb-8 max-w-lg mx-auto">
            Open the editor in your browser — no install required. Start designing immediately.
          </p>
          <a
            href="/index.html"
            className="inline-flex items-center gap-2 bg-[#50fa7b] text-[#0d0d0d] font-semibold px-8 py-3.5 rounded-lg hover:bg-[#69ff8f] transition-colors text-base"
          >
            Start designing <ArrowRight size={16} />
          </a>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-[#2a2a2a]">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <img src="/tui-studio_dark.svg" alt="TUIStudio" className="h-5 opacity-60" />
          <div className="flex items-center gap-6 text-sm text-[#555]">
            <span>MIT License</span>
            <a
              href="https://github.com/javieralonso/tui-designer"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#aaa] transition-colors flex items-center gap-1.5"
            >
              <Github size={14} /> GitHub
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
