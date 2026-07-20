import { useState } from 'react';
import { X, Loader2, AlertTriangle } from 'lucide-react';

interface Props {
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteAccountModal({ onClose, onConfirm }: Props) {
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (confirmation !== 'DELETE') return;
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Delete Account</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">
              This action is permanent. All your data will be deleted and cannot be recovered.
            </p>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Type <code className="bg-gray-100 px-1 rounded">DELETE</code> to confirm:
          </p>

          <input
            type="text"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none mb-4"
            placeholder="DELETE"
          />

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={confirmation !== 'DELETE' || loading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete Forever
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
