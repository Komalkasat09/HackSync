import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { portfolioApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Download } from 'lucide-react';

export default function Preview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadPreview();
    }
  }, [id]);

  const loadPreview = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const response = await portfolioApi.preview(id);
      setHtml(response.data.html);
    } catch (error: any) {
      toast.error('Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'html' | 'zip') => {
    if (!id) return;

    try {
      const response = format === 'html' 
        ? await portfolioApi.exportHtml(id)
        : await portfolioApi.exportZip(id);
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Portfolio exported as ${format.toUpperCase()}`);
    } catch (error: any) {
      toast.error('Failed to export portfolio');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="btn btn-secondary flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => handleExport('html')}
                className="btn btn-primary flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export HTML
              </button>
              <button
                onClick={() => handleExport('zip')}
                className="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export ZIP
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <iframe
            srcDoc={html}
            className="w-full"
            style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}
            title="Portfolio Preview"
          />
        </div>
      </div>
    </div>
  );
}
