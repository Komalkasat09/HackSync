import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { portfolioApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import CreatePortfolioModal from '@/components/CreatePortfolioModal';

export default function Gallery() {
  const navigate = useNavigate();
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadPortfolios();
  }, []);

  const loadPortfolios = async () => {
    setLoading(true);
    try {
      const response = await portfolioApi.list();
      setPortfolios(response.data);
    } catch (error: any) {
      toast.error('Failed to load portfolios');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this portfolio?')) return;

    try {
      await portfolioApi.delete(id);
      toast.success('Portfolio deleted');
      loadPortfolios();
    } catch (error: any) {
      toast.error('Failed to delete portfolio');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Portfolio Generator</h1>
              <p className="mt-1 text-sm text-gray-500">
                Create professional portfolios from your resume, GitHub, and LinkedIn
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Portfolio
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading portfolios...</p>
          </div>
        ) : portfolios.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-24 w-24"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No portfolios yet</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first portfolio</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              Create Your First Portfolio
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios.map((portfolio) => (
              <div key={portfolio.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {portfolio.name}
                    </h3>
                    <p className="text-sm text-gray-600">{portfolio.title}</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                    {portfolio.template}
                  </span>
                </div>
                
                <div className="text-sm text-gray-500 mb-4">
                  Updated {new Date(portfolio.updated_at).toLocaleDateString()}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/preview/${portfolio.id}`)}
                    className="flex-1 btn bg-green-50 text-green-700 hover:bg-green-100 flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  <button
                    onClick={() => navigate(`/builder/${portfolio.id}`)}
                    className="flex-1 btn btn-secondary flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(portfolio.id)}
                    className="btn bg-red-50 text-red-700 hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreatePortfolioModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(id) => {
            setShowCreateModal(false);
            navigate(`/builder/${id}`);
          }}
        />
      )}
    </div>
  );
}
