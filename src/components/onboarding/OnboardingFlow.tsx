import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { BuilderProfile, Availability, CommitmentType } from '../../types';
import { ROLES, SKILLS, PROJECT_INTERESTS, PROJECT_TYPES, AVAILABILITY_LABELS, COMMITMENT_LABELS } from '../../lib/constants';
import { ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react';
import PastProjectInput from './PastProjectInput';

type Step = 'identity' | 'skills' | 'availability' | 'about';

const STEPS: Step[] = ['identity', 'skills', 'availability', 'about'];

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState<Step>('identity');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [existingProfile, setExistingProfile] = useState<BuilderProfile | null>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    photo_url: '',
    location: '',
    primary_role: '',
    secondary_roles: [] as string[],
    skills: [] as string[],
    project_interests: [] as string[],
    availability: '' as Availability | '',
    commitment_type: '' as CommitmentType | '',
    looking_for_roles: [] as string[],
    looking_for_project_type: '',
    about_me: '',
    github_url: '',
    linkedin_url: '',
    portfolio_url: '',
    past_projects: [] as { title: string; description: string; link: string; shipped: boolean }[],
  });

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from('builder_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        setExistingProfile(profile);
        setFormData({
          name: profile.name || '',
          photo_url: profile.photo_url || '',
          location: profile.location || '',
          primary_role: profile.primary_role || '',
          secondary_roles: profile.secondary_roles || [],
          skills: profile.skills || [],
          project_interests: profile.project_interests || [],
          availability: profile.availability || '',
          commitment_type: profile.commitment_type || '',
          looking_for_roles: profile.looking_for_roles || [],
          looking_for_project_type: profile.looking_for_project_type || '',
          about_me: profile.about_me || '',
          github_url: profile.github_url || '',
          linkedin_url: profile.linkedin_url || '',
          portfolio_url: profile.portfolio_url || '',
          past_projects: [],
        });
      }
    };
    init();
  }, [navigate]);

  const currentStepIndex = STEPS.indexOf(currentStep);

  const canProceed = () => {
    switch (currentStep) {
      case 'identity':
        return formData.name.trim() && formData.primary_role;
      case 'skills':
        return formData.skills.length > 0;
      case 'availability':
        return formData.availability && formData.commitment_type;
      case 'about':
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (!canProceed()) return;

    if (currentStep === 'about') {
      await saveAndComplete();
      return;
    }

    const nextIndex = currentStepIndex + 1;
    setCurrentStep(STEPS[nextIndex]);
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1]);
    }
  };

  const saveAndComplete = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      const profileData = {
        user_id: userId,
        name: formData.name,
        photo_url: formData.photo_url || null,
        location: formData.location || null,
        primary_role: formData.primary_role,
        secondary_roles: formData.secondary_roles,
        skills: formData.skills,
        project_interests: formData.project_interests,
        availability: formData.availability || null,
        commitment_type: formData.commitment_type || null,
        looking_for_roles: formData.looking_for_roles,
        looking_for_project_type: formData.looking_for_project_type || null,
        about_me: formData.about_me || null,
        github_url: formData.github_url || null,
        linkedin_url: formData.linkedin_url || null,
        portfolio_url: formData.portfolio_url || null,
        onboarding_completed: true,
      };

      let profileId: string;
      if (existingProfile) {
        const { error } = await supabase
          .from('builder_profiles')
          .update(profileData)
          .eq('id', existingProfile.id);
        if (error) throw error;
        profileId = existingProfile.id;
      } else {
        const { data, error } = await supabase
          .from('builder_profiles')
          .insert(profileData)
          .select('id')
          .single();
        if (error) throw error;
        profileId = data.id;
      }

      if (formData.past_projects.length > 0) {
        const projectInserts = formData.past_projects.map(p => ({
          profile_id: profileId,
          title: p.title,
          description: p.description || null,
          link: p.link || null,
          shipped: p.shipped,
        }));
        await supabase.from('past_projects').insert(projectInserts);
      }

      navigate('/feed');
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const skipOnboarding = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const profileData = {
        user_id: userId,
        name: formData.name || 'Anonymous',
        primary_role: formData.primary_role || 'Builder',
        skills: formData.skills.length > 0 ? formData.skills : ['Generalist'],
        onboarding_completed: true,
      };

      if (existingProfile) {
        await supabase
          .from('builder_profiles')
          .update(profileData)
          .eq('id', existingProfile.id);
      } else {
        await supabase.from('builder_profiles').insert(profileData);
      }
      navigate('/feed');
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleArrayItem = (field: 'secondary_roles' | 'skills' | 'project_interests' | 'looking_for_roles', value: string) => {
    setFormData(prev => {
      const arr = prev[field];
      return {
        ...prev,
        [field]: arr.includes(value)
          ? arr.filter(v => v !== value)
          : [...arr, value],
      };
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Complete your profile</h1>
          <p className="text-gray-600 mt-1">Help others find you as a teammate</p>
        </div>

        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index < currentStepIndex
                    ? 'bg-emerald-600 text-white'
                    : index === currentStepIndex
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index < currentStepIndex ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`w-12 h-1 ${index < currentStepIndex ? 'bg-emerald-600' : 'bg-gray-200'}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {currentStep === 'identity' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Photo URL
                </label>
                <input
                  type="url"
                  value={formData.photo_url}
                  onChange={e => setFormData(prev => ({ ...prev, photo_url: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder="https://example.com/your-photo.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder="City, Country"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.primary_role}
                  onChange={e => setFormData(prev => ({ ...prev, primary_role: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  <option value="">Select your primary role</option>
                  {ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Roles
                </label>
                <div className="flex flex-wrap gap-2">
                  {ROLES.filter(r => r !== formData.primary_role).map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleArrayItem('secondary_roles', role)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                        formData.secondary_roles.includes(role)
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 'skills' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-500 mb-3">Select skills you bring to a project</p>
                <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                  {SKILLS.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleArrayItem('skills', skill)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                        formData.skills.includes(skill)
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Interests
                </label>
                <p className="text-sm text-gray-500 mb-3">What type of projects interest you?</p>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_INTERESTS.map(interest => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleArrayItem('project_interests', interest)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                        formData.project_interests.includes(interest)
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 'availability' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Availability <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.entries(AVAILABILITY_LABELS).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, availability: value as Availability }))}
                      className={`px-4 py-3 rounded-lg border text-left transition ${
                        formData.availability === value
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commitment Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(COMMITMENT_LABELS).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, commitment_type: value as CommitmentType }))}
                      className={`px-4 py-3 rounded-lg border text-left transition ${
                        formData.commitment_type === value
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Roles You're Looking For
                </label>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleArrayItem('looking_for_roles', role)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                        formData.looking_for_roles.includes(role)
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Type Looking For
                </label>
                <select
                  value={formData.looking_for_project_type}
                  onChange={e => setFormData(prev => ({ ...prev, looking_for_project_type: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  <option value="">Select project type</option>
                  {PROJECT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {currentStep === 'about' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  About Me
                </label>
                <p className="text-sm text-gray-500 mb-2">Keep it concise — max 500 characters</p>
                <textarea
                  value={formData.about_me}
                  onChange={e => setFormData(prev => ({ ...prev, about_me: e.target.value.slice(0, 500) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                  rows={4}
                  placeholder="Tell others what you bring to a project..."
                />
                <p className="text-xs text-gray-400 mt-1">{formData.about_me.length}/500</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GitHub Profile
                  </label>
                  <input
                    type="url"
                    value={formData.github_url}
                    onChange={e => setFormData(prev => ({ ...prev, github_url: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    placeholder="https://github.com/username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn Profile
                  </label>
                  <input
                    type="url"
                    value={formData.linkedin_url}
                    onChange={e => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Portfolio Website
                  </label>
                  <input
                    type="url"
                    value={formData.portfolio_url}
                    onChange={e => setFormData(prev => ({ ...prev, portfolio_url: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    placeholder="https://yourportfolio.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Past Projects
                  <span className="font-normal text-gray-500 ml-2">(optional)</span>
                </label>
                <PastProjectInput
                  value={formData.past_projects}
                  onChange={projects => setFormData(prev => ({ ...prev, past_projects: projects }))}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-1 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            <div className="flex items-center gap-3">
              {currentStep === 'about' && (
                <button
                  type="button"
                  onClick={skipOnboarding}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition"
                >
                  Skip for now
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed() || loading}
                className="flex items-center gap-1 px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : currentStep === 'about' ? (
                  <>
                    Complete
                    <Check className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
