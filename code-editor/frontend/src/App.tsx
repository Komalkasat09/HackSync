import TopBar from './components/TopBar';
import FileManager from './components/FileManager';
import CodeEditor from './components/Editor';
import RunnerPanel from './components/RunnerPanel';
import ExecutionPanel from './components/ExecutionPanel';
import { useEffect } from 'react';
import { useEditorStore } from './store/editorStore';

function App() {
  const { files, addFile } = useEditorStore();
  
  useEffect(() => {
    // Create a default file if none exist
    if (files.length === 0) {
      addFile({
        id: Date.now().toString(),
        name: 'hello.py',
        content: 'print("Hello, World!")',
        language: 'python',
        unsaved: false,
      });
    }
  }, []);
  
  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <TopBar />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - File Manager */}
        <div className="w-64 border-r border-gray-700 overflow-hidden">
          <FileManager />
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Runner Panel */}
          <RunnerPanel />
          
          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            <CodeEditor />
          </div>
          
          {/* Output Panel */}
          <div className="h-64 border-t border-gray-700 overflow-hidden">
            <ExecutionPanel />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
