import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">TUI Designer</h1>
          <p className="text-muted-foreground mb-8">
            Visual design tool for building Terminal User Interfaces
          </p>
          <div className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg">
            Phase 0: Project Setup Complete ✓
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
