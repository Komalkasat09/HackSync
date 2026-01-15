import { useState, ChangeEvent, FormEvent } from 'react';

const API_URL = '/api/generate'; // Change if backend runs on a different port

interface PortfolioResult {
  portfolio_url?: string;
  skill_graph?: any;
  metadata?: {
    domain?: string;
    skills?: string[];
    projects_count?: number;
    clusters_count?: number;
  };
  error?: string;
}

export default function PortfolioGenerator() {
  const [resume, setResume] = useState<File | null>(null);
  const [repos, setRepos] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PortfolioResult | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setResume(e.target.files[0]);
    }
  };

  const handleReposChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setRepos(e.target.value);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    if (!resume) {
      setError('Please upload a resume file.');
      setLoading(false);
      return;
    }
    const formData = new FormData();
    formData.append('resume', resume);
    if (repos.trim()) {
      try {
        // Validate that repos is a valid JSON array
        const parsed = JSON.parse(repos);
        if (!Array.isArray(parsed)) {
          setError('GitHub repositories must be a JSON array.');
          setLoading(false);
          return;
        }
        formData.append('request', JSON.stringify({ github_repos: parsed }));
      } catch (err) {
        setError('Invalid JSON for GitHub repositories.');
        setLoading(false);
        return;
      }
    }
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Failed to generate portfolio.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto mt-12 bg-white p-8 rounded-lg shadow">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">Portfolio Generator</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-semibold mb-2">Upload Resume (TXT or PDF):</label>
          <input type="file" accept=".txt,.pdf" onChange={handleFileChange} required className="border p-2 rounded w-full" />
        </div>
        <div>
          <label className="block font-semibold mb-2">GitHub Repositories (JSON array):</label>
          <textarea value={repos} onChange={handleReposChange} rows={4} className="border p-2 rounded w-full" placeholder='[{"name": "repo1", "url": "..."}]'></textarea>
        </div>
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded font-bold w-full">
          {loading ? 'Generating...' : 'Generate Portfolio'}
        </button>
      </form>
      {error && <div className="mt-6 text-red-600 font-semibold">{error}</div>}
      {result && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-green-600 mb-2">Portfolio Generated!</h2>
          <div className="mb-2">
            {result.portfolio_url && (
              <a href={result.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Portfolio Website</a>
            )}
          </div>
          <div className="bg-gray-100 p-4 rounded">
            <strong>Domain:</strong> {result.metadata?.domain}<br />
            <strong>Skills:</strong> {result.metadata?.skills?.join(', ')}<br />
            <strong>Projects:</strong> {result.metadata?.projects_count}<br />
            <strong>Clusters:</strong> {result.metadata?.clusters_count}<br />
          </div>
          <div className="mt-4">
            <h3 className="font-bold">Skill Graph (JSON):</h3>
            <pre className="bg-gray-200 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(result.skill_graph, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
