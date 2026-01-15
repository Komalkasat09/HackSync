import { create } from 'zustand';
import { ExecutionResult } from '../lib/api';

interface ExecutionState {
  isExecuting: boolean;
  output: ExecutionResult | null;
  error: string | null;
  history: Array<ExecutionResult & { timestamp: Date; language: string }>;
  
  setExecuting: (isExecuting: boolean) => void;
  setOutput: (output: ExecutionResult | null) => void;
  setError: (error: string | null) => void;
  addToHistory: (result: ExecutionResult, language: string) => void;
  clearOutput: () => void;
  clearHistory: () => void;
}

export const useExecutionStore = create<ExecutionState>()((set) => ({
  isExecuting: false,
  output: null,
  error: null,
  history: [],
  
  setExecuting: (isExecuting: boolean) => set({ isExecuting }),
  
  setOutput: (output: ExecutionResult | null) => set({ output, error: null }),
  
  setError: (error: string | null) => set({ error, output: null }),
  
  addToHistory: (result: ExecutionResult, language: string) => set((state) => ({
    history: [
      { ...result, timestamp: new Date(), language },
      ...state.history.slice(0, 49), // Keep last 50
    ],
  })),
  
  clearOutput: () => set({ output: null, error: null }),
  
  clearHistory: () => set({ history: [] }),
}));
