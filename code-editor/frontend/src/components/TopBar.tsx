import { useEditorStore } from '../store/editorStore';
import { getSupportedLanguages } from '../config/runtimes';

export default function TopBar() {
  const { theme, setTheme, fontSize, setFontSize } = useEditorStore();
  const supportedLanguages = getSupportedLanguages();
  
  return (
    <div className="bg-gray-900 border-b border-gray-700 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-white text-xl font-bold">Code Editor</h1>
          <span className="text-gray-500 text-sm">
            {supportedLanguages.length}+ Languages Supported
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-gray-400 text-sm">Font Size:</label>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="px-2 py-1 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="12">12px</option>
              <option value="14">14px</option>
              <option value="16">16px</option>
              <option value="18">18px</option>
              <option value="20">20px</option>
            </select>
          </div>
          
          <button
            onClick={() => setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark')}
            className="px-4 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm"
          >
            {theme === 'vs-dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </div>
    </div>
  );
}
