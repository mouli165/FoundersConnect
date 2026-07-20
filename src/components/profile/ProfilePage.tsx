import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { BuilderProfile, PastProject, ConnectRequest } from '../../types';
import { AVAILABILITY_LABELS, COMMITMENT_LABELS } from '../../lib/constants';
import { MapPin, Github, Linkedin, Globe, User, ExternalLink, Flag, Ban, Loader2 } from 'lucide-react';
import ConnectRequestModal from './ConnectRequestModal';
import ReportBlockModal from '../modals/ReportBlockModal';

export default function ProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<BuilderProfile | null>(null);
  const [projects, setProjects] = useState<PastProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [existingRequest, setExistingRequest] = useState<ConnectRequest | null>(null);
  const [isMatched, setIsMatched] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !userId) {
        setLoading(false);
        return;
      }
      setCurrentUserId(user.id);

      const { data: profileData } = await supabase
        .from('builder_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      setProfile(profileData);

      if (profileData && userId !== user.id) {
        const { data: projectsData } = await supabase
          .from('past_projects')
          .select('*')
          .eq('profile_id', profileData.id)
          .order('created_at', { ascending: false });
        setProjects(projectsData || []);

        const { data: requestData } = await supabase
          .from('connect_requests')
          .select('*')
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
          .maybeSingle();
        setExistingRequest(requestData);

        const { data: matchData } = await supabase
          .from('matches')
          .select('*')
          .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
          .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
          .maybeSingle();
        setIsMatched(!!matchData);

        const { data: blockData } = await supabase
          .from('blocked_users')
          .select('*')
          .eq('blocker_id', user.id)
          .eq('blocked_id', userId)
          .maybeSingle();
        setIsBlocked(!!blockData);
      }

      setLoading(false);
    };

    init();
  }, [userId]);

  const handleRequestSent = (request: ConnectRequest) => {
    setExistingRequest(request);
    setShowConnectModal(false);
  };

  const handleBlock = async () => {
    setIsBlocked(true);
    setShowReportModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile not found</h2>
        <button
          onClick={() => navigate('/feed')}
          className="text-emerald-600 hover:text-emerald-700"
        >
          Back to feed
        </button>
      </div>
    );
  }

  const isOwnProfile = currentUserId === userId;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="w-28 h-28 rounded-full bg-gray-200 overflow-hidden mx-auto sm:mx-0">
                {profile.photo_url ? (
                  <img
                    src={profile.photo_url}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-700">
                    <User className="h-10 w-10" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
              <p className="text-lg text-gray-600">{profile.primary_role}</p>

              {profile.location && (
                <p className="text-gray-500 flex items-center gap-1 mt-1 justify-center sm:justify-start">
                  <MapPin className="h-4 w-4" />
                  {profile.location}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                {profile.availability && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    {AVAILABILITY_LABELS[profile.availability]}
                  </span>
                )}
                {profile.commitment_type && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-amber-50 text-amber-700 border border-amber-100">
                    {COMMITMENT_LABELS[profile.commitment_type]}
                  </span>
                )}
              </div>
            </div>
          </div>

          {(profile.github_url || profile.linkedin_url || profile.portfolio_url) && (
            <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap gap-4 justify-center sm:justify-start">
              {profile.github_url && (
                <a
                  href={profile.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  <Github className="h-5 w-5" />
                  GitHub
                </a>
              )}
              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  <Linkedin className="h-5 w-5" />
                  LinkedIn
                </a>
              )}
              {profile.portfolio_url && (
                <a
                  href={profile.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  <Globe className="h-5 w-5" />
                  Portfolio
                </a>
              )}
            </div>
          )}

          {!isOwnProfile && !isBlocked && (
            <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap gap-3 justify-center sm:justify-start">
              {isMatched ? (
                <button
                  onClick={() => navigate(`/chat/${userId}`)}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition"
                >
                  Send a message
                </button>
              ) : existingRequest ? (
                existingRequest.status === 'pending' && (
                  <span className="text-gray-600 text-sm">
                    {existingRequest.sender_id === currentUserId
                      ? 'Connection request sent'
                      : 'This person sent you a request'}
                  </span>
                )
              ) : (
                <button
                  onClick={() => setShowConnectModal(true)}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition"
                >
                  Connect
                </button>
              )}
              <button
                onClick={() => setShowReportModal(true)}
                className="px-4 py-2.5 text-gray-600 hover:text-gray-900 transition flex items-center gap-2"
              >
                <Flag className="h-4 w-4" />
                Report/Block
              </button>
            </div>
          )}

          {isBlocked && !isOwnProfile && (
            <div className="mt-6 pt-6 border-t border-gray-100 text-center sm:text-left">
              <span className="text-gray-500 text-sm">You have blocked this user</span>
              <button
                onClick={() => setShowReportModal(true)}
                className="ml-4 text-sm text-emerald-600 hover:text-emerald-700"
              >
                Manage
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map(skill => (
              <span
                key={skill}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {profile.secondary_roles.length > 0 && (
          <div className="border-t border-gray-200 p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Secondary Roles</h2>
            <div className="flex flex-wrap gap-2">
              {profile.secondary_roles.map(role => (
                <span
                  key={role}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.project_interests.length > 0 && (
          <div className="border-t border-gray-200 p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Interests</h2>
            <div className="flex flex-wrap gap-2">
              {profile.project_interests.map(interest => (
                <span
                  key={interest}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {(profile.looking_for_roles.length > 0 || profile.looking_for_project_type) && (
          <div className="border-t border-gray-200 p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Looking For</h2>
            {profile.looking_for_project_type && (
              <p className="text-gray-700 mb-3">{profile.looking_for_project_type}</p>
            )}
            {profile.looking_for_roles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.looking_for_roles.map(role => (
                  <span
                    key={role}
                    className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm border border-emerald-100"
                  >
                    {role}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {profile.about_me && (
          <div className="border-t border-gray-200 p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{profile.about_me}</p>
          </div>
        )}

        {projects.length > 0 && (
          <div className="border-t border-gray-200 p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Past Projects</h2>
            <div className="space-y-4">
              {projects.map(project => (
                <div key={project.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-gray-900">{project.title}</h3>
                    {project.shipped && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                        Shipped
                      </span>
                    )}
                  </div>
                  {project.description && (
                    <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                  )}
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-2"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View project
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showConnectModal && currentUserId && profile && (
        <ConnectRequestModal
          senderId={currentUserId}
          recipientId={profile.user_id}
          recipientName={profile.name}
          onClose={() => setShowConnectModal(false)}
          onSent={handleRequestSent}
        />
      )}

      {showReportModal && currentUserId && profile && (
        <ReportBlockModal
          reporterId={currentUserId}
          reportedId={profile.user_id}
          reportedName={profile.name}
          isBlocked={isBlocked}
          onClose={() => setShowReportModal(false)}
          onBlock={handleBlock}
        />
      )}
    </div>
  );
}
