import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { BuilderProfile, Message } from '../../types';
import { User, Send, Loader2, ArrowLeft, Flag, AlertCircle } from 'lucide-react';
import ReportBlockModal from '../modals/ReportBlockModal';

export default function ChatPage() {
  const { targetUserId } = useParams();
  const navigate = useNavigate();
  const [otherProfile, setOtherProfile] = useState<BuilderProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !targetUserId) return;

    setCurrentUserId(user.id);

    const { data: profile } = await supabase
      .from('builder_profiles')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle();

    setOtherProfile(profile);

    const { data: matchData } = await supabase
      .from('matches')
      .select(`
        id,
        conversations (id)
      `)
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .or(`user_a_id.eq.${targetUserId},user_b_id.eq.${targetUserId}`)
      .single();

    if (!matchData) {
      setError('You need to be matched to send messages');
      setLoading(false);
      return;
    }

    const convId = (matchData.conversations as { id: string }[])?.[0]?.id;
    if (!convId) {
      setError('Conversation not found');
      setLoading(false);
      return;
    }

    setConversationId(convId);

    const { data: messagesData } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('sent_at', { ascending: true });

    setMessages(messagesData || []);

    setLoading(false);
  }, [targetUserId]);

  useEffect(() => {
    fetchMessages();
    scrollToBottom();
  }, [fetchMessages]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (conversationId) {
        fetchMessages();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [conversationId, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !conversationId) return;

    setSending(true);

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        body: message.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) => [...prev, data]);
      setMessage('');
    }

    setSending(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!otherProfile) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile not found</h2>
        <button onClick={() => navigate('/matches')} className="text-emerald-600 hover:text-emerald-700">
          Back to matches
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Cannot send messages</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={() => navigate('/matches')} className="text-emerald-600 hover:text-emerald-700">
          Back to matches
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <Link to={`/profile/${otherProfile.user_id}`} className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
            {otherProfile.photo_url ? (
              <img src={otherProfile.photo_url} alt={otherProfile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-700">
                <User className="h-5 w-5" />
              </div>
            )}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{otherProfile.name}</h2>
            <p className="text-sm text-gray-600">{otherProfile.primary_role}</p>
          </div>
        </Link>
        <button onClick={() => setShowReportModal(true)} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <Flag className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No messages yet. Say hello to {otherProfile.name}!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2 rounded-lg ${
                  msg.sender_id === currentUserId
                    ? 'bg-emerald-600 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-900 rounded-bl-none'
                }`}
              >
                <p className="text-sm">{msg.body}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.sender_id === currentUserId ? 'text-emerald-100' : 'text-gray-500'
                  }`}
                >
                  {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        />
        <button
          type="submit"
          disabled={!message.trim() || sending}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>

      {showReportModal && currentUserId && otherProfile && (
        <ReportBlockModal
          reporterId={currentUserId}
          reportedId={otherProfile.user_id}
          reportedName={otherProfile.name}
          isBlocked={false}
          onClose={() => setShowReportModal(false)}
          onBlock={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
