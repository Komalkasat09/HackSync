"use client";

import { useState } from 'react';
import { api } from '@/lib/api';
import { Search, Youtube, Github, BookOpen, ExternalLink, Star, Clock, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface Resource {
  title: string;
  url: string;
  source: string;
  type: string;
  duration?: string;
  difficulty?: string;
  topics?: string[];
  recommendation_reason?: string;
  estimated_quality_score?: number;
  validation_score?: number;
  stars?: number;
  social_validation?: {
    community_rating: number;
    pros: string[];
    cons: string[];
    recommendation_confidence: string;
    best_for: string;
  };
}

export default function Home() {
  const [topic, setTopic] = useState('');
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setLoading(true);
    setError('');
    setResources([]);

    try {
      const response = await api.scrape(topic);
      setResources(response.resources_preview || []);
    } catch (e) {
      setError('Failed to fetch resources. Please try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getSourceIcon = (source: string) => {
    if (source.toLowerCase().includes('youtube') || source.toLowerCase().includes('freecodecamp youtube')) {
      return <Youtube className="w-5 h-5 text-red-500" />;
    } else if (source.toLowerCase().includes('github')) {
      return <Github className="w-5 h-5 text-gray-700 dark:text-gray-300" />;
    } else {
      return <BookOpen className="w-5 h-5 text-blue-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'text-green-600 dark:text-green-400';
    if (score >= 7.5) return 'text-blue-600 dark:text-blue-400';
    if (score >= 6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AI Learning Resources
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Discover curated courses from YouTube, GitHub, FreeCodeCamp, and Coursera
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <section className="container mx-auto px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter a skill or topic (e.g., Python, React, SQL, Machine Learning)"
                  className="w-full px-6 py-4 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-indigo-500 dark:focus:border-indigo-400 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Find Resources
                  </>
                )}
              </button>
            </div>
            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                {error}
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* Resources Section */}
      {resources.length > 0 && (
        <section className="container mx-auto px-4 pb-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
                Found {resources.length} Resources
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((resource, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden border border-gray-100 dark:border-gray-700"
                >
                  {/* Card Header */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getSourceIcon(resource.source)}
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {resource.source}
                        </span>
                      </div>
                      {resource.validation_score && (
                        <div className={`flex items-center gap-1 ${getScoreColor(resource.validation_score)}`}>
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-bold">{resource.validation_score.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {resource.title}
                    </h3>

                    {resource.recommendation_reason && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {resource.recommendation_reason}
                      </p>
                    )}

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {resource.difficulty && (
                        <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs rounded-full">
                          {resource.difficulty}
                        </span>
                      )}
                      {resource.type && (
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">
                          {resource.type}
                        </span>
                      )}
                      {resource.duration && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {resource.duration}
                        </span>
                      )}
                    </div>

                    {/* GitHub Stars */}
                    {resource.stars && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{resource.stars.toLocaleString()} stars</span>
                      </div>
                    )}

                    {/* Social Validation */}
                    {resource.social_validation && (
                      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                            Community Rating
                          </span>
                          <span className={`text-xs font-bold ${getScoreColor(resource.social_validation.community_rating)}`}>
                            {resource.social_validation.recommendation_confidence}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Best for:</span> {resource.social_validation.best_for}
                        </div>
                      </div>
                    )}

                    {/* Topics */}
                    {resource.topics && resource.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {resource.topics.slice(0, 3).map((topic, i) => (
                          <span 
                            key={i}
                            className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Action Button */}
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200"
                    >
                      View Resource
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}
    </main>
  );
}
