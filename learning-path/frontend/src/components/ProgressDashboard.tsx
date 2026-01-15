"use client";

import React, { useEffect, useState } from 'react';
import { api, UserProgress, Badge, LearningActivity } from '@/lib/api';
import { Trophy, Clock, Target, TrendingUp, Star, Award, BookOpen, Zap } from 'lucide-react';

interface ProgressDashboardProps {
  userId: string;
  className?: string;
}

export default function ProgressDashboard({ userId, className }: ProgressDashboardProps) {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [activities, setActivities] = useState<LearningActivity[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, [userId]);

  const loadProgressData = async () => {
    try {
      const data = await api.getUserProgress(userId);
      setProgress(data.progress);
      setActivities(data.activities);
      setBadges(data.badges);
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-gray-200 rounded-lg"></div>
          <div className="h-24 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Progress Data Yet</h3>
        <p className="text-gray-500">Start learning to see your progress!</p>
      </div>
    );
  }

  const getXpForNextLevel = (level: number) => level * 500;
  const currentLevelXp = (progress.level - 1) * 500;
  const nextLevelXp = getXpForNextLevel(progress.level);
  const progressToNextLevel = ((progress.total_xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;

  const getBadgeIcon = (category: string) => {
    switch (category) {
      case 'Progress': return <TrendingUp size={16} />;
      case 'Consistency': return <Target size={16} />;
      case 'Special': return <Star size={16} />;
      default: return <Award size={16} />;
    }
  };

  const getBadgeColor = (category: string) => {
    switch (category) {
      case 'Progress': return 'bg-blue-100 text-blue-800';
      case 'Consistency': return 'bg-green-100 text-green-800';
      case 'Special': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Level & XP Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Level {progress.level}</h2>
            <p className="text-purple-100">Learning Champion</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">{progress.total_xp.toLocaleString()} XP</p>
            <p className="text-sm text-purple-100">{(nextLevelXp - progress.total_xp)} XP to next level</p>
          </div>
        </div>
        
        {/* XP Progress Bar */}
        <div className="w-full bg-white/20 rounded-full h-3 mb-2">
          <div 
            className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressToNextLevel}%` }}
          ></div>
        </div>
        <p className="text-sm text-purple-100">
          {Math.round(progressToNextLevel)}% progress to Level {progress.level + 1}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <Clock className="mx-auto text-blue-600 mb-2" size={24} />
          <p className="text-2xl font-bold text-gray-800">{progress.total_hours_learned}</p>
          <p className="text-sm text-gray-600">Hours Learned</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <BookOpen className="mx-auto text-green-600 mb-2" size={24} />
          <p className="text-2xl font-bold text-gray-800">{progress.activities_completed}</p>
          <p className="text-sm text-gray-600">Activities Done</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <Zap className="mx-auto text-orange-600 mb-2" size={24} />
          <p className="text-2xl font-bold text-gray-800">{progress.current_streak}</p>
          <p className="text-sm text-gray-600">Day Streak</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <Trophy className="mx-auto text-yellow-600 mb-2" size={24} />
          <p className="text-2xl font-bold text-gray-800">{progress.badges_earned}</p>
          <p className="text-sm text-gray-600">Badges</p>
        </div>
      </div>

      {/* Weekly Progress */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Target size={20} className="text-blue-600" />
          Weekly Goal Progress
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {progress.weekly_progress.completed_hours} / {progress.weekly_progress.goal_hours} hours
            </span>
            <span className="font-semibold text-gray-800">
              {progress.weekly_progress.progress_percentage}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className={`h-4 rounded-full transition-all duration-500 ${
                progress.weekly_progress.progress_percentage >= 100 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500'
              }`}
              style={{ width: `${Math.min(100, progress.weekly_progress.progress_percentage)}%` }}
            ></div>
          </div>
          
          {progress.weekly_progress.progress_percentage >= 100 && (
            <p className="text-green-600 text-sm font-medium">🎉 Weekly goal achieved!</p>
          )}
        </div>
      </div>

      {/* Recent Badges */}
      {badges.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Award size={20} className="text-yellow-600" />
            Recent Badges
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {badges.slice(0, 4).map((badge, index) => (
              <div key={index} className={`p-3 rounded-lg flex items-center gap-3 ${getBadgeColor(badge.category)}`}>
                <div className="flex-shrink-0">
                  {getBadgeIcon(badge.category)}
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{badge.name}</h4>
                  <p className="text-xs opacity-75">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activities */}
      {activities.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BookOpen size={20} className="text-green-600" />
            Recent Learning
          </h3>
          
          <div className="space-y-3">
            {activities.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-800">{activity.title}</h4>
                  <p className="text-sm text-gray-600">{activity.type}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-gray-800 font-medium">{activity.time_spent}min</p>
                  <p className="text-gray-500">{new Date(activity.completed).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}