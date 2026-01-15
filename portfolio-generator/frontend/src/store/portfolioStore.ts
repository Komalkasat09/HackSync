import { create } from 'zustand';
import type { Portfolio, PersonalInfo, GitHubProfile, LinkedInProfile, Project, Skill, PortfolioConfig } from '@/types/portfolio';

interface PortfolioStore {
  currentPortfolio: Portfolio | null;
  portfolios: any[];
  loading: boolean;
  error: string | null;
  
  // Actions
  setCurrentPortfolio: (portfolio: Portfolio | null) => void;
  setPortfolios: (portfolios: any[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  updatePersonalInfo: (info: PersonalInfo) => void;
  updateGitHubProfile: (profile: GitHubProfile) => void;
  updateLinkedInProfile: (profile: LinkedInProfile) => void;
  updateProjects: (projects: Project[]) => void;
  updateSkills: (skills: Skill[]) => void;
  updateConfig: (config: PortfolioConfig) => void;
  
  reset: () => void;
}

export const usePortfolioStore = create<PortfolioStore>((set) => ({
  currentPortfolio: null,
  portfolios: [],
  loading: false,
  error: null,
  
  setCurrentPortfolio: (portfolio: Portfolio | null) => set({ currentPortfolio: portfolio }),
  setPortfolios: (portfolios: any[]) => set({ portfolios }),
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  
  updatePersonalInfo: (info: PersonalInfo) => set((state) => {
    if (!state.currentPortfolio) return state;
    return {
      currentPortfolio: {
        ...state.currentPortfolio,
        personal_info: info,
      },
    };
  }),
  
  updateGitHubProfile: (profile: GitHubProfile) => set((state) => {
    if (!state.currentPortfolio) return state;
    return {
      currentPortfolio: {
        ...state.currentPortfolio,
        github_profile: profile,
      },
    };
  }),
  
  updateLinkedInProfile: (profile: LinkedInProfile) => set((state) => {
    if (!state.currentPortfolio) return state;
    return {
      currentPortfolio: {
        ...state.currentPortfolio,
        linkedin_profile: profile,
      },
    };
  }),
  
  updateProjects: (projects: Project[]) => set((state) => {
    if (!state.currentPortfolio) return state;
    return {
      currentPortfolio: {
        ...state.currentPortfolio,
        projects,
      },
    };
  }),
  
  updateSkills: (skills: Skill[]) => set((state) => {
    if (!state.currentPortfolio) return state;
    return {
      currentPortfolio: {
        ...state.currentPortfolio,
        skills,
      },
    };
  }),
  
  updateConfig: (config: PortfolioConfig) => set((state) => {
    if (!state.currentPortfolio) return state;
    return {
      currentPortfolio: {
        ...state.currentPortfolio,
        config,
      },
    };
  }),
  
  reset: () => set({
    currentPortfolio: null,
    portfolios: [],
    loading: false,
    error: null,
  }),
}));
