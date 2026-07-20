import { useState, useRef, useEffect } from 'react';
import { FeedFilters, Availability, CommitmentType } from '../../types';
import { SKILLS, AVAILABILITY_LABELS, COMMITMENT_LABELS } from '../../lib/constants';
import { Filter, X, ChevronDown, Check } from 'lucide-react';

interface Props {
  filters: FeedFilters;
  onChange: (filters: FeedFilters) => void;
}

export default function FeedFiltersComponent({ filters, onChange }: Props) {
  const [openDropdown, setOpenDropdown] = useState<'skills' | 'availability' | 'commitment' | null>(null);
  const [skillSearch, setSkillSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSkills = SKILLS.filter(skill =>
    skill.toLowerCase().includes(skillSearch.toLowerCase())
  ).filter(skill => !filters.skills.includes(skill));

  const toggleSkill = (skill: string) => {
    const newSkills = filters.skills.includes(skill)
      ? filters.skills.filter(s => s !== skill)
      : [...filters.skills, skill];
    onChange({ ...filters, skills: newSkills });
  };

  const toggleAvailability = (a: Availability) => {
    const newAvailability = filters.availability.includes(a)
      ? filters.availability.filter(x => x !== a)
      : [...filters.availability, a];
    onChange({ ...filters, availability: newAvailability });
  };

  const toggleCommitment = (c: CommitmentType) => {
    const newCommitment = filters.commitment.includes(c)
      ? filters.commitment.filter(x => x !== c)
      : [...filters.commitment, c];
    onChange({ ...filters, commitment: newCommitment });
  };

  const clearFilter = (type: 'skills' | 'availability' | 'commitment') => {
    onChange({ ...filters, [type]: [] });
  };

  const totalFilters = filters.skills.length + filters.availability.length + filters.commitment.length;

  return (
    <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <Filter className="h-4 w-4" />
          Filters
          {totalFilters > 0 && (
            <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full">
              {totalFilters}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2" ref={dropdownRef}>
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'skills' ? null : 'skills')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                filters.skills.length > 0
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Skills
              {filters.skills.length > 0 && (
                <span className="text-xs bg-emerald-600 text-white px-1.5 rounded">
                  {filters.skills.length}
                </span>
              )}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {openDropdown === 'skills' && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                <div className="p-2">
                  <input
                    type="text"
                    value={skillSearch}
                    onChange={e => setSkillSearch(e.target.value)}
                    placeholder="Search skills..."
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {filters.skills.length > 0 && (
                    <div className="px-2 pb-2">
                      <p className="text-xs text-gray-500 font-medium mb-1">Selected</p>
                      <div className="flex flex-wrap gap-1">
                        {filters.skills.map(skill => (
                          <button
                            key={skill}
                            onClick={() => toggleSkill(skill)}
                            className="flex items-center gap-1 px-2 py-0.5 text-xs bg-emerald-100 text-emerald-800 rounded-full hover:bg-emerald-200"
                          >
                            {skill}
                            <X className="h-3 w-3" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {filteredSkills.length > 0 ? (
                    filteredSkills.map(skill => (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        {skill}
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-2 text-sm text-gray-500">No skills found</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'availability' ? null : 'availability')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                filters.availability.length > 0
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Availability
              {filters.availability.length > 0 && (
                <span className="text-xs bg-emerald-600 text-white px-1.5 rounded">
                  {filters.availability.length}
                </span>
              )}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {openDropdown === 'availability' && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                <div className="py-1">
                  {Object.entries(AVAILABILITY_LABELS).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => toggleAvailability(value as Availability)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      {label}
                      {filters.availability.includes(value as Availability) && (
                        <Check className="h-4 w-4 text-emerald-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'commitment' ? null : 'commitment')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                filters.commitment.length > 0
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Commitment
              {filters.commitment.length > 0 && (
                <span className="text-xs bg-emerald-600 text-white px-1.5 rounded">
                  {filters.commitment.length}
                </span>
              )}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {openDropdown === 'commitment' && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                <div className="py-1">
                  {Object.entries(COMMITMENT_LABELS).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => toggleCommitment(value as CommitmentType)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      {label}
                      {filters.commitment.includes(value as CommitmentType) && (
                        <Check className="h-4 w-4 text-emerald-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {totalFilters > 0 && (
            <button
              onClick={() => onChange({ skills: [], availability: [], commitment: [] })}
              className="text-sm text-gray-500 hover:text-gray-700 transition"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {filters.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {filters.skills.map(skill => (
            <button
              key={skill}
              onClick={() => toggleSkill(skill)}
              className="flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
            >
              {skill}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
