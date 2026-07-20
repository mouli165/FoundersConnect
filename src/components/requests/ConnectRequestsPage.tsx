import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ConnectRequest, BuilderProfile } from '../../types';
import { User, Check, X, MessageCircle, Loader2, ArrowRightLeft } from 'lucide-react';

export default function ConnectRequestsPage() {
  const [requests, setRequests] = useState<
    (ConnectRequest & { sender_profile?: BuilderProfile; recipient_profile?: BuilderProfile })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);

    const { data } = await supabase
      .from('connect_requests')
      .select(`
        *,
        sender:sender_id (user_id),
        recipient:recipient_id (user_id)
      `)
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .neq('status', 'withdrawn')
      .order('created_at', { ascending: false });

    if (data) {
      const profilePromises = data.map(async (req) => {
        const profiles = await supabase
          .from('builder_profiles')
          .select('*')
          .in('user_id', [req.sender_id, req.recipient_id]);

        return {
          ...req,
          sender_profile: profiles.data?.find((p) => p.user_id === req.sender_id),
          recipient_profile: profiles.data?.find((p) => p.user_id === req.recipient_id),
        };
      });

      const requestsProfiles = await Promise.all(profilePromises);
      setRequests(requestsProfiles);
    }

    setLoading(false);
  };

  const handleAccept = async (requestId: string) => {
    const { error } = await supabase
      .from('connect_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (!error) {
      fetchRequests();
    }
  };

  const handleDecline = async (requestId: string) => {
    const { error } = await supabase
      .from('connect_requests')
      .update({ status: 'declined' })
      .eq('id', requestId);

    if (!error) {
      fetchRequests();
    }
  };

  const handleWithdraw = async (requestId: string) => {
    const { error } = await supabase
      .from('connect_requests')
      .update({ status: 'withdrawn' })
      .eq('id', requestId);

    if (!error) {
      fetchRequests();
    }
  };

  const { data: { user } } = { data: { user: null } } as any;
  const receivedRequests = requests.filter((r) => r.recipient_id === user?.id && r.status === 'pending');
  const sentRequests = requests.filter((r) => r.sender_id === user?.id && r.status === 'pending');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Connect Requests</h1>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('received')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
            activeTab === 'received'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Received ({receivedRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
            activeTab === 'sent'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Sent ({sentRequests.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {activeTab === 'received' && (
            <>
              {receivedRequests.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <ArrowRightLeft className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
                  <p className="text-gray-600">
                    When someone wants to connect with you, you'll see their request here.
                  </p>
                </div>
              ) : (
                receivedRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    type="received"
                    onAccept={() => handleAccept(request.id)}
                    onDecline={() => handleDecline(request.id)}
                  />
                ))
              )}
            </>
          )}

          {activeTab === 'sent' && (
            <>
              {sentRequests.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No sent requests</h3>
                  <p className="text-gray-600">
                    Browse builders and send connect requests to potential teammates.
                  </p>
                  <Link
                    to="/feed"
                    className="inline-block mt-4 text-emerald-600 font-medium hover:text-emerald-700"
                  >
                    Find teammates
                  </Link>
                </div>
              ) : (
                sentRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    type="sent"
                    onWithdraw={() => handleWithdraw(request.id)}
                  />
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface RequestCardProps {
  request: ConnectRequest & { sender_profile?: BuilderProfile; recipient_profile?: BuilderProfile };
  type: 'received' | 'sent';
  onAccept?: () => void;
  onDecline?: () => void;
  onWithdraw?: () => void;
}

function RequestCard({ request, type, onAccept, onDecline, onWithdraw }: RequestCardProps) {
  const profile = type === 'received' ? request.sender_profile : request.recipient_profile;
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: () => void) => {
    setLoading(true);
    action();
  };

  if (!profile) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start gap-4">
        <Link to={`/profile/${profile.user_id}`} className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
            {profile.photo_url ? (
              <img src={profile.photo_url} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-700">
                <User className="h-6 w-6" />
              </div>
            )}
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <Link to={`/profile/${profile.user_id}`} className="font-semibold text-gray-900 hover:text-emerald-600">
            {profile.name}
          </Link>
          <p className="text-sm text-gray-600">{profile.primary_role}</p>
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">{request.note}</p>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {new Date(request.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {type === 'received' && request.status === 'pending' && (
        <div className="flex gap-2 mt-4 justify-end">
          <button
            onClick={() => handleAction(onDecline!)}
            disabled={loading}
            className="flex items-center gap-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            Decline
          </button>
          <button
            onClick={() => handleAction(onAccept!)}
            disabled={loading}
            className="flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            Accept
          </button>
        </div>
      )}

      {type === 'sent' && request.status === 'pending' && (
        <div className="flex justify-end mt-4">
          <button
            onClick={() => handleAction(onWithdraw!)}
            disabled={loading}
            className="text-sm text-gray-500 hover:text-red-600 transition disabled:opacity-50"
          >
            Withdraw request
          </button>
        </div>
      )}
    </div>
  );
}
