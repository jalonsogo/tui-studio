import './App.css';
import { EditorLayout } from './components/editor/EditorLayout';
import { Toolbar } from './components/editor/Toolbar';
import { LeftSidebar } from './components/editor/LeftSidebar';
import { Canvas } from './components/editor/Canvas';
import { PropertyPanel } from './components/properties/PropertyPanel';
import { LayoutDebugPanel } from './components/debug/LayoutDebugPanel';

function App() {
  return (
    <EditorLayout
      toolbar={<Toolbar />}
      leftSidebar={<LeftSidebar />}
      canvas={<Canvas />}
      rightSidebar={<PropertyPanel />}
      debugPanel={<LayoutDebugPanel />}
    />
  );
}

export default App;
