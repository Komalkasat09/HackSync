import { usePortfolioStore } from '@/store/portfolioStore';
import type { TemplateType, PortfolioConfig } from '@/types/portfolio';

const templates: { id: TemplateType; name: string; description: string }[] = [
  { id: 'modern', name: 'Modern', description: 'Clean and minimal design' },
  { id: 'creative', name: 'Creative', description: 'Bold and colorful layout' },
  { id: 'professional', name: 'Professional', description: 'Traditional corporate style' },
  { id: 'developer', name: 'Developer', description: 'Tech-focused design' },
];

export default function TemplateSelector() {
  const { currentPortfolio, updateConfig } = usePortfolioStore();

  const handleTemplateChange = (template: TemplateType) => {
    if (!currentPortfolio) return;
    
    const newConfig: PortfolioConfig = {
      ...currentPortfolio.config,
      template,
    };
    updateConfig(newConfig);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Choose Template</h2>

      <div className="grid grid-cols-2 gap-4">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => handleTemplateChange(template.id)}
            className={`p-6 border-2 rounded-lg text-left transition-all ${
              currentPortfolio?.config.template === template.id
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <h3 className="font-semibold text-lg">{template.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
            {currentPortfolio?.config.template === template.id && (
              <div className="mt-3 inline-block px-2 py-1 bg-primary-600 text-white text-xs rounded">
                Selected
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="border-t pt-6">
        <h3 className="font-semibold mb-4">Customization</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
            <input
              type="color"
              value={currentPortfolio?.config.primary_color || '#3B82F6'}
              onChange={(e) => {
                if (!currentPortfolio) return;
                updateConfig({ ...currentPortfolio.config, primary_color: e.target.value });
              }}
              className="w-full h-10 rounded border border-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dark Mode</label>
            <label className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={currentPortfolio?.config.dark_mode || false}
                onChange={(e) => {
                  if (!currentPortfolio) return;
                  updateConfig({ ...currentPortfolio.config, dark_mode: e.target.checked });
                }}
                className="w-4 h-4"
              />
              <span className="text-sm">Enable dark mode</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
