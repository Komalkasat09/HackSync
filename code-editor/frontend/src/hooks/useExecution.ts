import { useState } from 'react';
import { executeCode as apiExecuteCode } from '../lib/api';
import { getPistonConfig } from '../config/runtimes';
import { useExecutionStore } from '../store/executionStore';

export const useExecution = () => {
  const [stdin, setStdin] = useState('');
  const { setExecuting, setOutput, setError, addToHistory } = useExecutionStore();
  
  const execute = async (language: string, source: string, customStdin?: string) => {
    const config = getPistonConfig(language);
    if (!config) {
      setError(`Unsupported language: ${language}`);
      return;
    }
    
    setExecuting(true);
    setError(null);
    
    try {
      const result = await apiExecuteCode({
        language: config.language,
        version: config.version,
        source,
        stdin: customStdin !== undefined ? customStdin : stdin,
        args: [],
      });
      
      setOutput(result);
      addToHistory(result, language);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Execution failed';
      setError(errorMessage);
    } finally {
      setExecuting(false);
    }
  };
  
  return {
    execute,
    stdin,
    setStdin,
  };
};
