import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  error?: string;
}

const FileUpload = ({ file, onFileChange, error }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      if (droppedFile.size <= 10 * 1024 * 1024) {
        onFileChange(droppedFile);
      }
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      if (selectedFile.size <= 10 * 1024 * 1024) {
        onFileChange(selectedFile);
      }
    }
  };

  const handleRemoveFile = () => {
    onFileChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-black dark:text-white">
        📄 Upload Resume (PDF, Optional)
      </label>
      
      <div className="border-2 border-black/30 dark:border-white/30 border-dashed rounded-lg p-6 bg-black/5 dark:bg-white/5 backdrop-blur-sm">
        {!file ? (
          <label className="flex flex-col items-center justify-center gap-3 py-4 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-all">
            <Upload className="w-12 h-12 text-blue-500" />
            <div className="text-center">
              <p className="text-black dark:text-white font-medium mb-1">Upload resume (PDF)</p>
              <p className="text-sm text-black/60 dark:text-white/60">or proceed without a resume</p>
              <p className="text-xs text-black/50 dark:text-white/50 mt-1">Max 10MB</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-blue-100 dark:bg-blue-900/30 backdrop-blur-sm border border-blue-300 dark:border-blue-700 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              <p className="text-black dark:text-white font-medium truncate">{file.name}</p>
              <p className="text-sm text-black/60 dark:text-white/60">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/10 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default FileUpload;
