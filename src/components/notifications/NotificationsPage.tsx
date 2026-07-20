import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Notification } from '../../types';
import { Bell, User, MessageCircle, UserPlus, Check, Loader2 } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<(Notification & { sender_profile?: { name: string; user_id: string } })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data && data.length > 0) {
      const withProfiles = await Promise.all(
        data.map(async (n) => {
          const senderId = n.payload?.sender_id || n.payload?.recipient_id;
          if (!senderId) return n;

          const { data: profile } = await supabase
            .from('builder_profiles')
            .select('name, user_id')
            .eq('user_id', senderId)
            .maybeSingle();

          return { ...n, sender_profile: profile };
        })
      );
      setNotifications(withProfiles);
    }

    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'connect_request_received':
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case 'connect_request_accepted':
        return <Check className="h-5 w-5 text-emerald-500" />;
      case 'new_message':
        return <MessageCircle className="h-5 w-5 text-amber-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getContent = (n: Notification) => {
    const name = n.sender_profile?.name || 'Someone';
    switch (n.type) {
      case 'connect_request_received':
        return (
          <span>
            <strong className="font-medium">{name}</strong> wants to connect with you
          </span>
        );
      case 'connect_request_accepted':
        return (
          <span>
            <strong className="font-medium">{name}</strong> accepted your connection request
          </span>
        );
      case 'new_message':
        return (
          <span>
            New message from <strong className="font-medium">{name}</strong>
          </span>
        );
      default:
        return 'New notification';
    }
  };

  const getLink = (n: Notification) => {
    const senderId = n.payload?.sender_id;
    const recipientId = n.payload?.recipient_id;

    switch (n.type) {
      case 'connect_request_received':
        return '/requests';
      case 'connect_request_accepted':
        return recipientId ? `/chat/${recipientId}` : '/matches';
      case 'new_message':
        return senderId ? `/chat/${senderId}` : '/matches';
      default:
        return '#';
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-gray-600">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-emerald-600 font-medium hover:text-emerald-700"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
          <p className="text-gray-600">
            We'll notify you when someone wants to connect or sends you a message.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Link
              key={n.id}
              to={getLink(n)}
              onClick={() => markAsRead(n.id)}
              className={`flex items-start gap-4 p-4 rounded-lg border transition ${
                n.read
                  ? 'bg-white border-gray-200'
                  : 'bg-emerald-50 border-emerald-200'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">{getIcon(n.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900">{getContent(n)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(n.created_at).toLocaleDateString()} at{' '}
                  {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {!n.read && (
                <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-2" />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
