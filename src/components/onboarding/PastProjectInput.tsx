import { Plus, X, ExternalLink, Check } from 'lucide-react';

interface PastProject {
  title: string;
  description: string;
  link: string;
  shipped: boolean;
}

interface Props {
  value: PastProject[];
  onChange: (projects: PastProject[]) => void;
}

export default function PastProjectInput({ value, onChange }: Props) {
  const addProject = () => {
    onChange([...value, { title: '', description: '', link: '', shipped: false }]);
  };

  const updateProject = (index: number, field: keyof PastProject, fieldValue: string | boolean) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [field]: fieldValue };
    onChange(updated);
  };

  const removeProject = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {value.map((project, index) => (
        <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-start justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Project {index + 1}</span>
            <button
              type="button"
              onClick={() => removeProject(index)}
              className="text-gray-400 hover:text-red-500 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={project.title}
              onChange={e => updateProject(index, 'title', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
              placeholder="Project name"
            />

            <div className="flex items-center gap-2">
              <input
                type="url"
                value={project.link}
                onChange={e => updateProject(index, 'link', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                placeholder="Link (optional)"
              />
            </div>
          </div>

          <textarea
            value={project.description}
            onChange={e => updateProject(index, 'description', e.target.value)}
            className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm resize-none"
            rows={2}
            placeholder="Brief description"
          />

          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={project.shipped}
              onChange={e => updateProject(index, 'shipped', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-600">Shipped/Live</span>
          </label>
        </div>
      ))}

      {value.length < 5 && (
        <button
          type="button"
          onClick={addProject}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
        >
          <Plus className="h-4 w-4" />
          Add Project
        </button>
      )}
    </div>
  );
}
