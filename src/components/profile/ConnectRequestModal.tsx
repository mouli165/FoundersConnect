import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Loader2, Send } from 'lucide-react';

interface Props {
  senderId: string;
  recipientId: string;
  recipientName: string;
  onClose: () => void;
  onSent: (request: { id: string; sender_id: string; recipient_id: string; note: string; status: string }) => void;
}

export default function ConnectRequestModal({ senderId, recipientId, recipientName, onClose, onSent }: Props) {
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (note.trim().length < 10) {
      setError('Please write at least 10 characters');
      return;
    }

    setLoading(true);

    const { data, error: insertError } = await supabase
      .from('connect_requests')
      .insert({
        sender_id: senderId,
        recipient_id: recipientId,
        note: note.trim(),
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    onSent(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Connect with {recipientName}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add a note <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Tell {recipientName} why you want to connect. What project or opportunity do you have in mind?
            </p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="I'm working on a SaaS project and looking for a skilled frontend developer..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
              rows={4}
              maxLength={500}
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">{note.length}/500</span>
              {note.length > 0 && note.length < 10 && (
                <span className="text-xs text-amber-600">Min 10 characters required</span>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || note.trim().length < 10}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
