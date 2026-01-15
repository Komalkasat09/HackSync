import { useState } from 'react';
import { usePortfolioStore } from '@/store/portfolioStore';
import { portfolioApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Github, Star, GitFork } from 'lucide-react';

export default function GitHubSection() {
  const { currentPortfolio, updateGitHubProfile } = usePortfolioStore();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchGitHub = async () => {
    if (!username || !currentPortfolio) return;

    setLoading(true);
    try {
      const response = await portfolioApi.fetchGitHub(currentPortfolio.id, {
        username,
        include_repos: true,
        max_repos: 10,
      });
      updateGitHubProfile(response.data);
      toast.success('GitHub profile fetched successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to fetch GitHub profile');
    } finally {
      setLoading(false);
    }
  };

  const githubProfile = currentPortfolio?.github_profile;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">GitHub Integration</h2>

      <div className="flex gap-3">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter GitHub username"
          className="input flex-1"
        />
        <button
          onClick={fetchGitHub}
          disabled={loading || !username}
          className="btn btn-primary flex items-center gap-2"
        >
          <Github className="w-4 h-4" />
          {loading ? 'Fetching...' : 'Fetch Profile'}
        </button>
      </div>

      {githubProfile && (
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex items-start gap-4">
            <img
              src={githubProfile.avatar_url}
              alt={githubProfile.username}
              className="w-20 h-20 rounded-full"
            />
            <div>
              <h3 className="text-lg font-semibold">{githubProfile.name || githubProfile.username}</h3>
              <p className="text-gray-600">@{githubProfile.username}</p>
              {githubProfile.bio && <p className="text-sm text-gray-600 mt-2">{githubProfile.bio}</p>}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="card">
              <div className="text-2xl font-bold text-primary-600">{githubProfile.public_repos}</div>
              <div className="text-sm text-gray-600">Repositories</div>
            </div>
            <div className="card">
              <div className="text-2xl font-bold text-primary-600">{githubProfile.followers}</div>
              <div className="text-sm text-gray-600">Followers</div>
            </div>
            <div className="card">
              <div className="text-2xl font-bold text-primary-600">{githubProfile.following}</div>
              <div className="text-sm text-gray-600">Following</div>
            </div>
            <div className="card">
              <div className="text-2xl font-bold text-primary-600">{githubProfile.total_stars}</div>
              <div className="text-sm text-gray-600">Total Stars</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Top Repositories</h4>
            <div className="space-y-3">
              {githubProfile.repositories.slice(0, 5).map((repo) => (
                <div key={repo.name} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-semibold text-primary-600">{repo.name}</h5>
                      <p className="text-sm text-gray-600 mt-1">{repo.description}</p>
                    </div>
                    <div className="flex gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        {repo.stars}
                      </span>
                      <span className="flex items-center gap-1">
                        <GitFork className="w-4 h-4" />
                        {repo.forks}
                      </span>
                    </div>
                  </div>
                  {repo.language && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 rounded">
                      {repo.language}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
