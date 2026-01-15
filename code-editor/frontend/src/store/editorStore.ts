import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EditorFile {
  id: string;
  name: string;
  content: string;
  language: string;
  unsaved: boolean;
}

interface EditorState {
  files: EditorFile[];
  activeFileId: string | null;
  theme: 'vs-dark' | 'light';
  fontSize: number;
  
  addFile: (file: EditorFile) => void;
  updateFile: (id: string, updates: Partial<EditorFile>) => void;
  deleteFile: (id: string) => void;
  setActiveFile: (id: string) => void;
  getActiveFile: () => EditorFile | null;
  setTheme: (theme: 'vs-dark' | 'light') => void;
  setFontSize: (size: number) => void;
  markFileSaved: (id: string) => void;
  markFileUnsaved: (id: string) => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      files: [],
      activeFileId: null,
      theme: 'vs-dark',
      fontSize: 14,
      
      addFile: (file: EditorFile) => set((state) => ({
        files: [...state.files, file],
        activeFileId: file.id,
      })),
      
      updateFile: (id: string, updates: Partial<EditorFile>) => set((state) => ({
        files: state.files.map((f) =>
          f.id === id ? { ...f, ...updates, unsaved: true } : f
        ),
      })),
      
      deleteFile: (id: string) => set((state) => {
        const newFiles = state.files.filter((f) => f.id !== id);
        const newActiveId = state.activeFileId === id 
          ? (newFiles[0]?.id || null)
          : state.activeFileId;
        
        return {
          files: newFiles,
          activeFileId: newActiveId,
        };
      }),
      
      setActiveFile: (id: string) => set({ activeFileId: id }),
      
      getActiveFile: () => {
        const state = get();
        return state.files.find((f) => f.id === state.activeFileId) || null;
      },
      
      setTheme: (theme: 'vs-dark' | 'light') => set({ theme }),
      
      setFontSize: (fontSize: number) => set({ fontSize }),
      
      markFileSaved: (id: string) => set((state) => ({
        files: state.files.map((f) => 
          f.id === id ? { ...f, unsaved: false } : f
        ),
      })),
      
      markFileUnsaved: (id: string) => set((state) => ({
        files: state.files.map((f) =>
          f.id === id ? { ...f, unsaved: true } : f
        ),
      })),
    }),
    {
      name: 'editor-storage',
    }
  )
);
