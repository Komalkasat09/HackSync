/**
 * Learning Path API Client
 * Handles all API calls to the learning path backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface LearningModule {
  week_number: number;
  skill_name: string;
  resources: Resource[];
  estimated_hours: number;
  explanation: string;
}

export interface Resource {
  title: string;
  url: string;
  type: string;
  verified: boolean;
  source: string;
  duration_minutes?: number;
}

export interface LearningPath {
  user_id: string;
  target_role: string;
  total_estimated_hours: number;
  total_weeks: number;
  modules: LearningModule[];
}

export interface SkillGap {
  skill_name: string;
  gap_type: string;
  current_proficiency: string;
  required_proficiency: string;
  priority: string;
}

export const learningPathAPI = {
  /**
   * Parse resume text to extract skills
   */
  parseResume: async (resumeText: string): Promise<string[]> => {
    const response = await fetch(`${API_BASE_URL}/api/learning-path/parse-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: resumeText }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to parse resume');
    }

    const data = await response.json();
    return data.skills;
  },

  /**
   * Analyze skill gaps between current and target role
   */
  analyzeGaps: async (
    userId: string,
    currentSkills: Record<string, string>,
    targetRole: string,
    hoursPerWeek: number = 10
  ): Promise<SkillGap[]> => {
    const response = await fetch(`${API_BASE_URL}/api/learning-path/analyze-gaps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        current_skills: currentSkills,
        target_role: targetRole,
        hours_per_week: hoursPerWeek,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to analyze gaps');
    }

    return response.json();
  },

  /**
   * Generate complete personalized learning path
   */
  generatePath: async (
    userId: string,
    currentSkills: Record<string, string>,
    targetRole: string,
    hoursPerWeek: number = 10,
    targetSkills?: string[]
  ): Promise<LearningPath> => {
    const response = await fetch(`${API_BASE_URL}/api/learning-path/generate-path`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        current_skills: currentSkills,
        target_role: targetRole,
        hours_per_week: hoursPerWeek,
        target_skills: targetSkills,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to generate path');
    }

    return response.json();
  },

  /**
   * Get AI recommendations for specific topic
   */
  recommend: async (query: string, topK: number = 5): Promise<Resource[]> => {
    const response = await fetch(
      `${API_BASE_URL}/api/learning-path/recommend?query=${encodeURIComponent(query)}&top_k=${topK}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get recommendations');
    }

    return response.json();
  },

  /**
   * Trigger scraper for new topic
   */
  scrape: async (topic: string): Promise<{ status: string; resources_scraped: number }> => {
    const response = await fetch(`${API_BASE_URL}/api/learning-path/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to scrape resources');
    }

    return response.json();
  },

  /**
   * Health check for learning path module
   */
  healthCheck: async (): Promise<{ status: string; module: string; models_loaded: boolean }> => {
    const response = await fetch(`${API_BASE_URL}/api/learning-path/health`);

    if (!response.ok) {
      throw new Error('Learning path module is not available');
    }

    return response.json();
  },
};
