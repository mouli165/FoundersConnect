import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { BuilderProfile, FeedFilters } from '../../types';
import { SKILLS, AVAILABILITY_LABELS, COMMITMENT_LABELS } from '../../lib/constants';
import BuilderCard from './BuilderCard';
import FeedFiltersComponent from './FeedFilters';
import { Loader2, Search, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function BuilderFeed() {
  const [builders, setBuilders] = useState<BuilderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<FeedFilters>({
    skills: [],
    availability: [],
    commitment: [],
  });
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 12;
  const { user } = useAuth();

  const fetchBuilders = useCallback(async (pageNum: number, reset = false) => {
    if (!user) return;

    if (pageNum === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    let query = supabase
      .from('builder_profiles')
      .select('*')
      .neq('user_id', user.id)
      .eq('onboarding_completed', true)
      .order('updated_at', { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

    if (filters.skills.length > 0) {
      query = query.overlaps('skills', filters.skills);
    }

    if (filters.availability.length > 0) {
      query = query.in('availability', filters.availability);
    }

    if (filters.commitment.length > 0) {
      query = query.in('commitment_type', filters.commitment);
    }

    const { data } = await query;

    if (data) {
      if (reset) {
        setBuilders(data);
      } else {
        setBuilders(prev => [...prev, ...data]);
      }
      setHasMore(data.length === PAGE_SIZE);
    }

    setLoading(false);
    setLoadingMore(false);
  }, [filters, user]);

  useEffect(() => {
    setPage(0);
    fetchBuilders(0, true);
  }, [filters, fetchBuilders]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchBuilders(nextPage);
    }
  };

  const handleFilterChange = (newFilters: FeedFilters) => {
    setFilters(newFilters);
    setPage(0);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Find Teammates</h1>
        <p className="text-gray-600">Discover builders ready to collaborate</p>
      </div>

      <FeedFiltersComponent filters={filters} onChange={handleFilterChange} />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-24" />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <div className="h-6 bg-gray-200 rounded-full w-16" />
                <div className="h-6 bg-gray-200 rounded-full w-20" />
              </div>
              <div className="mt-4 flex gap-1.5 flex-wrap">
                <div className="h-6 bg-gray-200 rounded w-12" />
                <div className="h-6 bg-gray-200 rounded w-16" />
                <div className="h-6 bg-gray-200 rounded w-14" />
              </div>
            </div>
          ))}
        </div>
      ) : builders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No builders match these filters</h3>
          <p className="text-gray-600 mb-4">
            Try widening your search by removing some filters
          </p>
          <button
            onClick={() => setFilters({ skills: [], availability: [], commitment: [] })}
            className="text-emerald-600 font-medium hover:text-emerald-700"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {builders.map(builder => (
              <BuilderCard key={builder.id} builder={builder} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
              >
                {loadingMore ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  'Load more'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
