import { useForm } from 'react-hook-form';
import { usePortfolioStore } from '@/store/portfolioStore';
import type { PersonalInfo } from '@/types/portfolio';

export default function PersonalInfoForm() {
  const { currentPortfolio, updatePersonalInfo } = usePortfolioStore();
  const { register, handleSubmit } = useForm({
    defaultValues: currentPortfolio?.personal_info || {},
  });

  const onSubmit = (data: any) => {
    const personalInfo: PersonalInfo = {
      full_name: data.full_name,
      title: data.title,
      bio: data.bio,
      email: data.email,
      phone: data.phone,
      location: data.location,
      profile_image: data.profile_image,
      social_links: {
        github: data.github,
        linkedin: data.linkedin,
        twitter: data.twitter,
        website: data.website,
        email: data.email,
      },
    };
    updatePersonalInfo(personalInfo);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input {...register('full_name')} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Professional Title</label>
          <input {...register('title')} className="input" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
        <textarea {...register('bio')} className="input" rows={4} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" {...register('email')} className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input {...register('phone')} className="input" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <input {...register('location')} className="input" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
          <input {...register('github')} className="input" placeholder="username" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
          <input {...register('linkedin')} className="input" placeholder="linkedin.com/in/..." />
        </div>
      </div>

      <button type="submit" className="btn btn-primary">
        Update Personal Info
      </button>
    </form>
  );
}
