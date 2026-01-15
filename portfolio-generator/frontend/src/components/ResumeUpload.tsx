import { useState } from 'react';
import { usePortfolioStore } from '@/store/portfolioStore';
import { portfolioApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Upload, FileText } from 'lucide-react';

export default function ResumeUpload() {
  const { currentPortfolio } = usePortfolioStore();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentPortfolio) return;

    setUploading(true);
    try {
      await portfolioApi.uploadResume(currentPortfolio.id, file, 'pdf');
      toast.success('Resume uploaded successfully!');
    } catch (error: any) {
      toast.error('Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Resume Upload</h2>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label htmlFor="resume-upload" className="cursor-pointer">
              <span className="btn btn-primary">
                {uploading ? 'Uploading...' : 'Upload Resume'}
              </span>
              <input
                id="resume-upload"
                type="file"
                className="hidden"
                accept=".pdf,.json"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            PDF or JSON format (Max 10MB)
          </p>
        </div>
      </div>

      {currentPortfolio?.resume_data && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary-600" />
            <div>
              <h4 className="font-semibold">Resume Parsed</h4>
              <p className="text-sm text-gray-600">Your resume data has been extracted</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
