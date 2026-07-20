import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Match, BuilderProfile, Conversation } from '../../types';
import { User, MessageCircle, Loader2 } from 'lucide-react';

export default function MatchesPage() {
  const [matches, setMatches] = useState<(Match & { other_profile: BuilderProfile; conversation?: Conversation })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);

    const { data: matchesData } = await supabase
      .from('matches')
      .select('*')
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (matchesData && matchesData.length > 0) {
      const matchesWithProfiles = await Promise.all(
        matchesData.map(async (match) => {
          const otherUserId = match.user_a_id === user.id ? match.user_b_id : match.user_a_id;

          const { data: profile } = await supabase
            .from('builder_profiles')
            .select('*')
            .eq('user_id', otherUserId)
            .maybeSingle();

          const { data: conversation } = await supabase
            .from('conversations')
            .select('*')
            .eq('match_id', match.id)
            .maybeSingle();

          return {
            ...match,
            other_profile: profile,
            conversation,
          };
        })
      );

      const filtered = matchesWithProfiles.filter((m) => m.other_profile);
      setMatches(filtered);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
        <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No matches yet</h2>
        <p className="text-gray-600 mb-4">
          When you accept a connect request, you'll be able to chat here.
        </p>
        <Link to="/feed" className="text-emerald-600 font-medium hover:text-emerald-700">
          Find teammates
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Matches</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matches.map((match) => (
          <Link
            key={match.id}
            to={`/chat/${match.other_profile.user_id}`}
            className="flex items-center gap-4 bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition"
          >
            <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {match.other_profile.photo_url ? (
                <img
                  src={match.other_profile.photo_url}
                  alt={match.other_profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-700">
                  <User className="h-6 w-6" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900">{match.other_profile.name}</h3>
              <p className="text-sm text-gray-600">{match.other_profile.primary_role}</p>
              <p className="text-xs text-gray-500 mt-1">
                Matched {new Date(match.created_at).toLocaleDateString()}
              </p>
            </div>
            <MessageCircle className="h-5 w-5 text-emerald-600" />
          </Link>
        ))}
      </div>
    </div>
  );
}
