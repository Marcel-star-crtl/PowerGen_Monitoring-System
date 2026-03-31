import React, { useState, useEffect } from 'react';
import { Input } from '@/components/common/Input';
import { adminAPI } from '@/api/endpoints/admin';

interface Technician {
  id: string;
  fullName: string;
  email: string;
}

interface AssignedTechniciansEditorProps {
  selected: string[];
  onChange: (ids: string[]) => void;
}

const AssignedTechniciansEditor: React.FC<AssignedTechniciansEditorProps> = ({ selected, onChange }) => {
  const [techs, setTechs] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    adminAPI.getUsers({ role: 'technician', limit: 100 }).then((result: any) => {
      if (result.success && result.data) {
        setTechs(result.data.users.map((u: any) => ({
          id: u._id || u.id,
          fullName: u.fullName || '',
          email: u.email || ''
        })));
      }
    }).finally(() => setLoading(false));
  }, []);

  const filtered = techs.filter((t: Technician) => t.fullName.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <Input placeholder="Search technicians..." value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} fullWidth />
      <div className="border rounded-md max-h-40 overflow-y-auto mt-2">
        {loading ? <div className="p-4 text-center">Loading...</div> :
          filtered.length === 0 ? <div className="p-4 text-center text-gray-500">No technicians found.</div> :
            filtered.map((tech: Technician) => {
              const isSelected = selected.includes(tech.id);
              return (
                <div key={tech.id} className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
                  onClick={() => onChange(isSelected ? selected.filter((id) => id !== tech.id) : [...selected, tech.id])}>
                  <div>
                    <div className="font-medium text-gray-900">{tech.fullName}</div>
                    <div className="text-xs text-gray-500">{tech.email}</div>
                  </div>
                  {isSelected && <span className="text-blue-600">✔ Assigned</span>}
                  {!isSelected && <span className="text-gray-400">Add</span>}
                </div>
              );
            })
        }
      </div>
      <div className="text-xs text-gray-500 mt-1">{selected.length} assigned</div>
    </div>
  );
};

export default AssignedTechniciansEditor;
