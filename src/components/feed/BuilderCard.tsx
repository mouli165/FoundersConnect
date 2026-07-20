import { Link } from 'react-router-dom';
import { BuilderProfile } from '../../types';
import { AVAILABILITY_LABELS, COMMITMENT_LABELS } from '../../lib/constants';
import { MapPin, User } from 'lucide-react';

interface Props {
  builder: BuilderProfile;
}

export default function BuilderCard({ builder }: Props) {
  const availabilityLabel = builder.availability
    ? AVAILABILITY_LABELS[builder.availability]
    : null;

  const commitmentLabel = builder.commitment_type
    ? COMMITMENT_LABELS[builder.commitment_type]
    : null;

  return (
    <Link
      to={`/profile/${builder.user_id}`}
      className="block bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition group"
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
          {builder.photo_url ? (
            <img
              src={builder.photo_url}
              alt={builder.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-700">
              <User className="h-6 w-6" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-emerald-600 transition">
            {builder.name}
          </h3>
          <p className="text-sm text-gray-600">{builder.primary_role}</p>
          {builder.location && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" />
              {builder.location}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {availabilityLabel && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
            {availabilityLabel}
          </span>
        )}
        {commitmentLabel && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
            {commitmentLabel}
          </span>
        )}
      </div>

      {builder.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {builder.skills.slice(0, 4).map(skill => (
            <span
              key={skill}
              className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
            >
              {skill}
            </span>
          ))}
          {builder.skills.length > 4 && (
            <span className="px-2 py-0.5 rounded text-xs text-gray-500">
              +{builder.skills.length - 4} more
            </span>
          )}
        </div>
      )}

      {builder.looking_for_roles.length > 0 && (
        <p className="mt-3 text-sm text-gray-600">
          <span className="text-gray-500">Looking for:</span>{' '}
          {builder.looking_for_roles.slice(0, 3).join(', ')}
          {builder.looking_for_roles.length > 3 && '...'}
        </p>
      )}
    </Link>
  );
}
