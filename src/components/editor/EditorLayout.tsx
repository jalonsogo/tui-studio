// Main editor layout with three columns

import { ReactNode } from 'react';

interface EditorLayoutProps {
  toolbar: ReactNode;
  leftSidebar: ReactNode;
  canvas: ReactNode;
  rightSidebar: ReactNode;
}

export function EditorLayout({ toolbar, leftSidebar, canvas, rightSidebar }: EditorLayoutProps) {
  return (
    <div className="flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex-shrink-0 border-b border-border">
        {toolbar}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Component Palette & Layers */}
        <div className="w-64 flex-shrink-0 border-r border-border bg-card overflow-y-auto">
          {leftSidebar}
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {canvas}
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-80 flex-shrink-0 border-l border-border bg-card overflow-y-auto">
          {rightSidebar}
        </div>
      </div>
    </div>
  );
}
