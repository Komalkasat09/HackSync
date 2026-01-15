import { useEditorStore } from '../store/editorStore';
import { detectLanguageFromExtension } from '../config/runtimes';
import { useState } from 'react';

export default function FileManager() {
  const { files, activeFileId, addFile, deleteFile, setActiveFile } = useEditorStore();
  const [newFileName, setNewFileName] = useState('');
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  
  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    
    const language = detectLanguageFromExtension(newFileName);
    const id = Date.now().toString();
    
    addFile({
      id,
      name: newFileName,
      content: '',
      language,
      unsaved: false,
    });
    
    setNewFileName('');
    setShowNewFileInput(false);
  };
  
  const handleDeleteFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this file?')) {
      deleteFile(id);
    }
  };
  
  return (
    <div className="h-full bg-gray-800 flex flex-col">
      <div className="p-3 border-b border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-white font-semibold">Files</h2>
          <button
            onClick={() => setShowNewFileInput(true)}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            + New
          </button>
        </div>
        
        {showNewFileInput && (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFile()}
              placeholder="filename.ext"
              className="flex-1 px-2 py-1 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleCreateFile}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              ✓
            </button>
            <button
              onClick={() => {
                setShowNewFileInput(false);
                setNewFileName('');
              }}
              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 text-sm"
            >
              ✕
            </button>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {files.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No files yet. Create a new file to get started.
          </div>
        ) : (
          <div className="p-2">
            {files.map((file) => (
              <div
                key={file.id}
                onClick={() => setActiveFile(file.id)}
                className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer mb-1 ${
                  activeFileId === file.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 overflow-hidden">
                  <span className="text-sm truncate">{file.name}</span>
                  {file.unsaved && (
                    <span className="w-2 h-2 bg-yellow-500 rounded-full" title="Unsaved changes"></span>
                  )}
                </div>
                <button
                  onClick={(e) => handleDeleteFile(file.id, e)}
                  className="text-red-400 hover:text-red-300 ml-2"
                  title="Delete file"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
