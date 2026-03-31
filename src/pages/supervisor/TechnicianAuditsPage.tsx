import React, { useEffect, useState } from 'react';
import { technicianAPI } from '@/api';
import { useNavigate } from 'react-router-dom';

interface TechnicianAudit {
  _id: string;
  site_id_ihs: string;
  name_site?: string;
  date?: string;
  photos?: { uri?: string; url?: string; name?: string }[];
  comments?: string;
  created_by?: any;
  [key: string]: any;
}

const TechnicianAuditsPage: React.FC = () => {
  const [audits, setAudits] = useState<TechnicianAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAudits = async () => {
      setLoading(true);
      try {
        const res = await technicianAPI.listAudits();
        setAudits(res.data || []);
      } catch (err) {
        setAudits([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAudits();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Technician Site Audits</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {audits.map((audit) => (
            <div
              key={audit._id}
              className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => navigate(`/supervisor/technician-audits/${audit._id}`, { state: { audit } })}
            >
              <div className="font-semibold">{audit.name_site || audit.site_id_ihs}</div>
              <div className="text-sm text-gray-500">{audit.date}</div>
              <div className="text-xs text-gray-400">{audit._id}</div>
            </div>
          ))}
        </div>
      )}
      {/* Detail modal removed; navigation now handled by route */}
    </div>
  );
};

export default TechnicianAuditsPage;
