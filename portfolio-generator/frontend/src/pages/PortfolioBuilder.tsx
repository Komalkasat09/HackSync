import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { portfolioApi } from '@/lib/api';
import { usePortfolioStore } from '@/store/portfolioStore';
import toast from 'react-hot-toast';
import PersonalInfoForm from '@/components/PersonalInfoForm';
import GitHubSection from '@/components/GitHubSection';
import LinkedInSection from '@/components/LinkedInSection';
import ResumeUpload from '@/components/ResumeUpload';
import TemplateSelector from '@/components/TemplateSelector';
import ProjectsSection from '@/components/ProjectsSection';
import SkillsSection from '@/components/SkillsSection';
import ExportPanel from '@/components/ExportPanel';
import { FileText, Github, Linkedin, Palette, Briefcase, Code } from 'lucide-react';

type TabType = 'personal' | 'github' | 'linkedin' | 'resume' | 'projects' | 'skills' | 'template';

const tabs: { id: TabType; name: string; icon: any }[] = [
  { id: 'personal', name: 'Personal Info', icon: FileText },
  { id: 'github', name: 'GitHub', icon: Github },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin },
  { id: 'resume', name: 'Resume', icon: FileText },
  { id: 'projects', name: 'Projects', icon: Briefcase },
  { id: 'skills', name: 'Skills', icon: Code },
  { id: 'template', name: 'Template', icon: Palette },
];

export default function PortfolioBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentPortfolio, setCurrentPortfolio, setLoading } = usePortfolioStore();
  const [activeTab, setActiveTab] = useState<TabType>('personal');

  useEffect(() => {
    if (id) {
      loadPortfolio(id);
    }
  }, [id]);

  const loadPortfolio = async (portfolioId: string) => {
    setLoading(true);
    try {
      const response = await portfolioApi.get(portfolioId);
      setCurrentPortfolio(response.data);
      toast.success('Portfolio loaded');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentPortfolio) return;

    setLoading(true);
    try {
      await portfolioApi.update(currentPortfolio.id, currentPortfolio);
      toast.success('Portfolio saved successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save portfolio');
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return <PersonalInfoForm />;
      case 'github':
        return <GitHubSection />;
      case 'linkedin':
        return <LinkedInSection />;
      case 'resume':
        return <ResumeUpload />;
      case 'projects':
        return <ProjectsSection />;
      case 'skills':
        return <SkillsSection />;
      case 'template':
        return <TemplateSelector />;
      default:
        return <PersonalInfoForm />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Portfolio Builder</h1>
              <p className="text-sm text-gray-500">
                {currentPortfolio?.personal_info?.full_name || 'New Portfolio'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/')}
                className="btn btn-secondary"
              >
                Back
              </button>
              {currentPortfolio && (
                <>
                  <button
                    onClick={() => navigate(`/preview/${currentPortfolio.id}`)}
                    className="btn bg-green-600 text-white hover:bg-green-700"
                  >
                    Preview
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn btn-primary"
                  >
                    Save
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-3">
            <div className="card space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </div>

            {currentPortfolio && (
              <div className="mt-6">
                <ExportPanel portfolioId={currentPortfolio.id} />
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            <div className="card">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
