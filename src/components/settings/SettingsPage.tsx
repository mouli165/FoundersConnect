import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { BuilderProfile, PastProject } from '../../types';
import { ROLES, SKILLS, PROJECT_INTERESTS, PROJECT_TYPES, AVAILABILITY_LABELS, COMMITMENT_LABELS } from '../../lib/constants';
import { Loader2, Save, Trash2, User, Plus, X, ExternalLink, Check } from 'lucide-react';
import PastProjectInput from '../onboarding/PastProjectInput';
import DeleteAccountModal from './DeleteAccountModal';

export default function SettingsPage() {
  const [profile, setProfile] = useState<BuilderProfile | null>(null);
  const [projects, setProjects] = useState<PastProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    photo_url: '',
    location: '',
    primary_role: '',
    secondary_roles: [] as string[],
    skills: [] as string[],
    project_interests: [] as string[],
    availability: '' as string,
    commitment_type: '' as string,
    looking_for_roles: [] as string[],
    looking_for_project_type: '',
    about_me: '',
    github_url: '',
    linkedin_url: '',
    portfolio_url: '',
    past_projects: [] as { title: string; description: string; link: string; shipped: boolean }[],
  });

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/signin');
      return;
    }
    setUserId(user.id);

    const { data: profileData } = await supabase
      .from('builder_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profileData) {
      navigate('/onboarding');
      return;
    }
    setProfile(profileData);

    const { data: projectsData } = await supabase
      .from('past_projects')
      .select('*')
      .eq('profile_id', profileData.id)
      .order('created_at', { ascending: false });
    setProjects(projectsData || []);

    setFormData({
      name: profileData.name || '',
      photo_url: profileData.photo_url || '',
      location: profileData.location || '',
      primary_role: profileData.primary_role || '',
      secondary_roles: profileData.secondary_roles || [],
      skills: profileData.skills || [],
      project_interests: profileData.project_interests || [],
      availability: profileData.availability || '',
      commitment_type: profileData.commitment_type || '',
      looking_for_roles: profileData.looking_for_roles || [],
      looking_for_project_type: profileData.looking_for_project_type || '',
      about_me: profileData.about_me || '',
      github_url: profileData.github_url || '',
      linkedin_url: profileData.linkedin_url || '',
      portfolio_url: profileData.portfolio_url || '',
      past_projects: (projectsData || []).map((p) => ({
        title: p.title,
        description: p.description || '',
        link: p.link || '',
        shipped: p.shipped,
      })),
    });

    setLoading(false);
  };

  const toggleArrayItem = (field: 'secondary_roles' | 'skills' | 'project_interests' | 'looking_for_roles', value: string) => {
    setFormData((prev) => {
      const arr = prev[field];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  const handleSave = async () => {
    if (!profile || !userId) return;
    setSaving(true);

    try {
      await supabase
        .from('builder_profiles')
        .update({
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
        })
        .eq('id', profile.id);

      await supabase.from('past_projects').delete().eq('profile_id', profile.id);

      if (formData.past_projects.length > 0) {
        await supabase.from('past_projects').insert(
          formData.past_projects.map((p) => ({
            profile_id: profile.id,
            title: p.title,
            description: p.description || null,
            link: p.link || null,
            shipped: p.shipped,
          }))
        );
      }

      alert('Profile updated successfully');
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProfile = async () => {
    await supabase.from('builder_profiles').delete().eq('id', profile?.id);
    await supabase.auth.signOut();
    navigate('/signin');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </button>
      </div>

      <div className="space-y-6">
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
              <input
                type="url"
                value={formData.photo_url}
                onChange={(e) => setFormData((prev) => ({ ...prev, photo_url: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Role</label>
              <select
                value={formData.primary_role}
                onChange={(e) => setFormData((prev) => ({ ...prev, primary_role: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <option value="">Select role</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Secondary Roles</h2>
          <div className="flex flex-wrap gap-2">
            {ROLES.filter((r) => r !== formData.primary_role).map((role) => (
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
        </section>

        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
            {SKILLS.map((skill) => (
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
        </section>

        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Interests</h2>
          <div className="flex flex-wrap gap-2">
            {PROJECT_INTERESTS.map((interest) => (
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
        </section>

        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Availability</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {Object.entries(AVAILABILITY_LABELS).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, availability: value }))}
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

          <h3 className="text-md font-semibold text-gray-900 mb-3">Commitment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(COMMITMENT_LABELS).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, commitment_type: value }))}
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
        </section>

        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Looking For</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
            <select
              value={formData.looking_for_project_type}
              onChange={(e) => setFormData((prev) => ({ ...prev, looking_for_project_type: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option value="">Select project type</option>
              {PROJECT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((role) => (
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
        </section>

        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">About Me</h2>
          <textarea
            value={formData.about_me}
            onChange={(e) => setFormData((prev) => ({ ...prev, about_me: e.target.value.slice(0, 500) }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
            rows={4}
            placeholder="Tell others what you bring to a project..."
          />
          <p className="text-xs text-gray-400 mt-1">{formData.about_me.length}/500</p>
        </section>

        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
              <input
                type="url"
                value={formData.github_url}
                onChange={(e) => setFormData((prev) => ({ ...prev, github_url: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="https://github.com/username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
              <input
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData((prev) => ({ ...prev, linkedin_url: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio</label>
              <input
                type="url"
                value={formData.portfolio_url}
                onChange={(e) => setFormData((prev) => ({ ...prev, portfolio_url: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                placeholder="https://yourportfolio.com"
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Past Projects</h2>
          <PastProjectInput
            value={formData.past_projects}
            onChange={(projects) => setFormData((prev) => ({ ...prev, past_projects: projects }))}
          />
        </section>

        <section className="bg-white rounded-lg border border-red-200 p-6">
          <h2 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h2>
          <p className="text-gray-600 mb-4">
            Once you delete your profile, there is no going back. Please be certain.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
          >
            <Trash2 className="h-4 w-4" />
            Delete Account
          </button>
        </section>
      </div>

      {showDeleteModal && (
        <DeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteProfile}
        />
      )}
    </div>
  );
}
