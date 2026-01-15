import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { portfolioApi } from '@/lib/api';
import toast from 'react-hot-toast';
import type { PersonalInfo, PortfolioConfig } from '@/types/portfolio';

interface Props {
  onClose: () => void;
  onCreate: (id: string) => void;
}

export default function CreatePortfolioModal({ onClose, onCreate }: Props) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const personalInfo: PersonalInfo = {
        full_name: data.full_name,
        title: data.title,
        bio: data.bio || '',
        email: data.email,
        phone: data.phone,
        location: data.location,
        social_links: {
          github: data.github,
          linkedin: data.linkedin,
          twitter: data.twitter,
          website: data.website,
          email: data.email,
        },
      };

      const config: PortfolioConfig = {
        template: 'modern',
        primary_color: '#3B82F6',
        secondary_color: '#1E40AF',
        font_family: 'Inter',
        dark_mode: false,
        show_github: true,
        show_experience: true,
        show_education: true,
        show_projects: true,
        show_skills: true,
        show_certifications: true,
      };

      const response = await portfolioApi.create({
        personal_info: personalInfo,
        config,
      });

      toast.success('Portfolio created successfully!');
      onCreate(response.data.id);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create portfolio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Create New Portfolio</h2>
          <p className="mt-1 text-sm text-gray-500">
            Start by entering your basic information
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              {...register('full_name', { required: 'Full name is required' })}
              className="input"
              placeholder="John Doe"
            />
            {errors.full_name && (
              <p className="text-red-500 text-sm mt-1">{errors.full_name.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Professional Title *
            </label>
            <input
              {...register('title', { required: 'Title is required' })}
              className="input"
              placeholder="Full Stack Developer"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              className="input"
              placeholder="john@example.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              {...register('phone')}
              className="input"
              placeholder="+1 234 567 8900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              {...register('location')}
              className="input"
              placeholder="San Francisco, CA"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Short Bio
            </label>
            <textarea
              {...register('bio')}
              className="input"
              rows={3}
              placeholder="A brief description about yourself..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GitHub Username
              </label>
              <input
                {...register('github')}
                className="input"
                placeholder="johndoe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn URL
              </label>
              <input
                {...register('linkedin')}
                className="input"
                placeholder="linkedin.com/in/johndoe"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Portfolio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
