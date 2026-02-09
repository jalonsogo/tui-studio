// Left sidebar with tabs for Components and Layers

import { useState } from 'react';
import { Package, Layers } from 'lucide-react';
import { ComponentPalette } from '../palette/ComponentPalette';
import { ComponentTree } from './ComponentTree';

type Tab = 'components' | 'layers';

export function LeftSidebar() {
  const [activeTab, setActiveTab] = useState<Tab>('components');

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('components')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'components'
              ? 'bg-background border-b-2 border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          <Package className="w-4 h-4" />
          Components
        </button>
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'layers'
              ? 'bg-background border-b-2 border-primary text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          <Layers className="w-4 h-4" />
          Layers
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'components' && <ComponentPalette />}
        {activeTab === 'layers' && <ComponentTree />}
      </div>
    </div>
  );
}
