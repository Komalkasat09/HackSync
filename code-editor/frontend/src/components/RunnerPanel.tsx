import { useExecution } from '../hooks/useExecution';
import { useEditorStore } from '../store/editorStore';
import { useExecutionStore } from '../store/executionStore';

export default function RunnerPanel() {
  const { getActiveFile } = useEditorStore();
  const { execute, stdin, setStdin } = useExecution();
  const { isExecuting } = useExecutionStore();
  const activeFile = getActiveFile();
  
  const handleRun = () => {
    if (!activeFile) {
      alert('No file is currently open');
      return;
    }
    
    execute(activeFile.language, activeFile.content);
  };
  
  return (
    <div className="bg-gray-800 p-3 border-b border-gray-700">
      <div className="flex items-center gap-3">
        <button
          onClick={handleRun}
          disabled={!activeFile || isExecuting}
          className={`px-6 py-2 rounded font-semibold ${
            !activeFile || isExecuting
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isExecuting ? 'Running...' : '▶ Run Code'}
        </button>
        
        {activeFile && (
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Language:</span>
            <span className="text-white text-sm font-semibold">{activeFile.language}</span>
          </div>
        )}
        
        <div className="flex-1"></div>
        
        <div className="flex items-center gap-2">
          <label className="text-gray-400 text-sm">stdin:</label>
          <input
            type="text"
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Optional input"
            className="px-3 py-1 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ width: '200px' }}
          />
        </div>
      </div>
    </div>
  );
}
