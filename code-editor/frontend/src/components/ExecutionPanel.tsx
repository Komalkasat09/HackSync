import { useExecutionStore } from '../store/executionStore';

export default function ExecutionPanel() {
  const { output, error, isExecuting, clearOutput } = useExecutionStore();
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };
  
  if (isExecuting) {
    return (
      <div className="h-full bg-gray-900 p-4 flex items-center justify-center">
        <div className="text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p>Executing code...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="h-full bg-gray-900 p-4 overflow-auto">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-red-500 font-semibold">Error</h3>
          <button
            onClick={clearOutput}
            className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm"
          >
            Clear
          </button>
        </div>
        <pre className="text-red-400 font-mono text-sm whitespace-pre-wrap">{error}</pre>
      </div>
    );
  }
  
  if (!output) {
    return (
      <div className="h-full bg-gray-900 p-4 flex items-center justify-center">
        <p className="text-gray-500">Run your code to see output here</p>
      </div>
    );
  }
  
  return (
    <div className="h-full bg-gray-900 p-4 overflow-auto">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-4">
          <h3 className="text-green-500 font-semibold">Output</h3>
          <span className="text-gray-500 text-sm">
            Exit code: <span className={output.code === 0 ? 'text-green-500' : 'text-red-500'}>
              {output.code}
            </span>
          </span>
          {output.execution_time && (
            <span className="text-gray-500 text-sm">
              Time: {output.execution_time.toFixed(3)}s
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => copyToClipboard(output.output)}
            className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm"
          >
            Copy
          </button>
          <button
            onClick={clearOutput}
            className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm"
          >
            Clear
          </button>
        </div>
      </div>
      
      {output.stdout && (
        <div className="mb-4">
          <h4 className="text-gray-400 text-sm mb-1">stdout:</h4>
          <pre className="text-gray-200 font-mono text-sm whitespace-pre-wrap bg-gray-800 p-2 rounded">
            {output.stdout}
          </pre>
        </div>
      )}
      
      {output.stderr && (
        <div className="mb-4">
          <h4 className="text-red-400 text-sm mb-1">stderr:</h4>
          <pre className="text-red-300 font-mono text-sm whitespace-pre-wrap bg-gray-800 p-2 rounded">
            {output.stderr}
          </pre>
        </div>
      )}
      
      {!output.stdout && !output.stderr && (
        <p className="text-gray-500 text-sm">No output</p>
      )}
    </div>
  );
}
