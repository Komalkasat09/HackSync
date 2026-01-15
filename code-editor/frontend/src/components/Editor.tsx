import Editor from '@monaco-editor/react';
import { useEditorStore } from '../store/editorStore';
import { getMonacoLanguageId } from '../config/runtimes';
import { useEffect, useRef } from 'react';

export default function CodeEditor() {
  const { getActiveFile, updateFile, theme, fontSize } = useEditorStore();
  const activeFile = getActiveFile();
  const editorRef = useRef<any>(null);
  
  useEffect(() => {
    // Auto-save every 2 seconds
    if (!activeFile) return;
    
    const timer = setTimeout(() => {
      if (activeFile.unsaved && editorRef.current) {
        // File is auto-saved via updateFile
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [activeFile?.content]);
  
  const handleEditorChange = (value: string | undefined) => {
    if (activeFile && value !== undefined) {
      updateFile(activeFile.id, { content: value });
    }
  };
  
  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Save file
      if (activeFile) {
        // Mark as saved or trigger save to backend
        console.log('Save file:', activeFile.name);
      }
    });
  };
  
  if (!activeFile) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400">
        <div className="text-center">
          <p className="text-xl mb-2">No file open</p>
          <p className="text-sm">Create a new file or open an existing one to start coding</p>
        </div>
      </div>
    );
  }
  
  const monacoLanguage = getMonacoLanguageId(activeFile.language);
  
  return (
    <div className="h-full">
      <Editor
        height="100%"
        language={monacoLanguage}
        value={activeFile.content}
        onChange={handleEditorChange}
        onMount={handleEditorMount}
        theme={theme}
        options={{
          fontSize,
          minimap: { enabled: true },
          automaticLayout: true,
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          lineNumbers: 'on',
          renderWhitespace: 'selection',
          tabSize: 2,
          insertSpaces: true,
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
          acceptSuggestionOnCommitCharacter: false,
          acceptSuggestionOnEnter: 'off',
          wordBasedSuggestions: 'off',
        }}
      />
    </div>
  );
}
