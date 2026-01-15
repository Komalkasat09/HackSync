import { useState } from 'react';
import { portfolioApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Download, FileText, Archive } from 'lucide-react';

interface Props {
  portfolioId: string;
}

export default function ExportPanel({ portfolioId }: Props) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: 'html' | 'zip') => {
    setExporting(true);
    try {
      const response = format === 'html' 
        ? await portfolioApi.exportHtml(portfolioId)
        : await portfolioApi.exportZip(portfolioId);
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error: any) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="card">
      <h3 className="font-semibold mb-3">Export Portfolio</h3>
      <div className="space-y-2">
        <button
          onClick={() => handleExport('html')}
          disabled={exporting}
          className="w-full btn bg-green-50 text-green-700 hover:bg-green-100 flex items-center justify-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Export HTML
        </button>
        <button
          onClick={() => handleExport('zip')}
          disabled={exporting}
          className="w-full btn bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center justify-center gap-2"
        >
          <Archive className="w-4 h-4" />
          Export ZIP
        </button>
      </div>
    </div>
  );
}
