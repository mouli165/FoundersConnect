import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Loader2, Flag, Ban } from 'lucide-react';

interface Props {
  reporterId: string;
  reportedId: string;
  reportedName: string;
  isBlocked: boolean;
  onClose: () => void;
  onBlock: () => void;
}

export default function ReportBlockModal({ reporterId, reportedId, reportedName, isBlocked, onClose, onBlock }: Props) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [reporting, setReporting] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setReporting(true);

    const { error: reportError } = await supabase
      .from('reported_users')
      .insert({
        reporter_id: reporterId,
        reported_id: reportedId,
        reason: reason.trim(),
        details: details.trim() || null,
      });

    setReporting(false);

    if (reportError) {
      setError(reportError.message);
    } else {
      setSuccess('Report submitted successfully');
    }
  };

  const handleBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBlocking(true);

    const { error: blockError } = await supabase
      .from('blocked_users')
      .insert({
        blocker_id: reporterId,
        blocked_id: reportedId,
      });

    setBlocking(false);

    if (blockError) {
      setError(blockError.message);
    } else {
      onBlock();
      setSuccess(`${reportedName} has been blocked`);
    }
  };

  const handleUnblock = async () => {
    setError(null);

    const { error: unblockError } = await supabase
      .from('blocked_users')
      .delete()
      .eq('blocker_id', reporterId)
      .eq('blocked_id', reportedId);

    if (unblockError) {
      setError(unblockError.message);
    } else {
      onBlock();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Report or Block {reportedName}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {success && (
            <div className="mb-4 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Block {reportedName}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {isBlocked
                ? `${reportedName} is currently blocked. You won't see their profile.`
                : `Blocking prevents ${reportedName} from seeing your profile and you won't see theirs.`}
            </p>
            {isBlocked ? (
              <button
                onClick={handleUnblock}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Unblock
              </button>
            ) : (
              <button
                onClick={handleBlock}
                disabled={blocking}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition disabled:opacity-50"
              >
                {blocking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Ban className="h-4 w-4" />
                )}
                Block {reportedName}
              </button>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-medium text-gray-900 mb-3">Report {reportedName}</h3>
            <p className="text-sm text-gray-600 mb-4">
              Let us know why you're reporting this user. We take reports seriously.
            </p>

            <form onSubmit={handleReport}>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason <span className="text-red-500">*</span>
                </label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  required
                >
                  <option value="">Select reason</option>
                  <option value="spam">Spam or misleading</option>
                  <option value="harassment">Harassment</option>
                  <option value="inappropriate">Inappropriate content</option>
                  <option value="fake">Fake profile</option>
                  <option value="scam">Scam or fraud</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional details
                </label>
                <textarea
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder="Provide any additional context..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                disabled={reporting || !reason}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Flag className="h-4 w-4" />
                )}
                Submit Report
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
