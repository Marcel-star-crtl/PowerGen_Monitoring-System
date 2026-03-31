import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { technicianAPI } from '@/api/endpoints/technician';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { FiArrowLeft, FiCalendar, FiMapPin, FiUser, FiClock, FiCheckCircle, FiAlertCircle, FiImage, FiFileText, FiZap, FiThermometer, FiSun, FiHome, FiWind, FiDroplet } from 'react-icons/fi';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const StatusBool: React.FC<{ value?: string | boolean }> = ({ value }) => {
  const isTrue = value === 'true' || value === true;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
      isTrue ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
      {isTrue ? <FiCheckCircle className="w-3 h-3" /> : <FiAlertCircle className="w-3 h-3" />}
      {isTrue ? 'Operational' : 'Issue Detected'}
    </span>
  );
};

const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  const map: Record<string, { label: string; cls: string }> = {
    draft:    { label: 'Draft',    cls: 'bg-gray-100 text-gray-700' },
    pending:  { label: 'Pending',  cls: 'bg-yellow-100 text-yellow-700' },
    approved: { label: 'Approved', cls: 'bg-green-100 text-green-700' },
    rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700' },
  };
  const s = map[status || ''] ?? { label: status || 'Unknown', cls: 'bg-blue-100 text-blue-700' };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>;
};

// ─── Sub-components ─────────────────────────────────────────────────────────

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="flex items-center gap-2 px-5 py-4 bg-gray-50 border-b border-gray-200">
      <span className="text-blue-600">{icon}</span>
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Field: React.FC<{ label: string; value?: React.ReactNode; className?: string }> = ({ label, value, className = '' }) => (
  <div className={className}>
    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
    <p className="text-sm font-medium text-gray-900">{value ?? 'N/A'}</p>
  </div>
);

const PhotoGallery: React.FC<{ photos: any[]; category?: string }> = ({ photos, category }) => {
  const filtered = category ? photos.filter(p => p.category === category) : photos;
  if (!filtered.length) return <p className="text-xs text-gray-400 italic">No photos</p>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
      {filtered.map((photo, i) => (
        <a
          key={i}
          href={photo.url?.startsWith('http') ? photo.url : `${process.env.REACT_APP_UPLOAD_URL || ''}${photo.url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100 hover:border-blue-400 transition-colors"
        >
          <img
            src={photo.url?.startsWith('http') ? photo.url : `${process.env.REACT_APP_UPLOAD_URL || ''}${photo.url}`}
            alt={photo.description || photo.category}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-image.png'; }}
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-white text-xs truncate">{photo.description || photo.category}</p>
          </div>
        </a>
      ))}
    </div>
  );
};

// ─── Section note extractor ──────────────────────────────────────────────────

const SECTION_KEYS: { key: string; label: string; photoCategories: string[]; icon: React.ReactNode }[] = [
  { key: 'generator1',          label: 'Generator',          photoCategories: ['generator1'],           icon: <FiZap className="w-4 h-4" /> },
  { key: 'mains_power_cabinet1',label: 'Mains Power Cabinet',photoCategories: ['mains_power_cabinet1'], icon: <FiZap className="w-4 h-4" /> },
  { key: 'batteries1',          label: 'Batteries',          photoCategories: ['batteries1'],           icon: <FiDroplet className="w-4 h-4" /> },
  { key: 'aircon1',             label: 'Air Conditioning',   photoCategories: ['aircon1'],              icon: <FiThermometer className="w-4 h-4" /> },
  { key: 'solar',               label: 'Solar System',       photoCategories: ['solar'],                icon: <FiSun className="w-4 h-4" /> },
  { key: 'shelter',             label: 'Shelter',            photoCategories: ['shelter'],              icon: <FiHome className="w-4 h-4" /> },
  { key: 'environment',         label: 'Environment',        photoCategories: ['environment'],          icon: <FiWind className="w-4 h-4" /> },
];

// ─── Main Page ───────────────────────────────────────────────────────────────

const TechnicianAuditDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [audit, setAudit] = useState<any>(location.state?.audit || null);
  const [loading, setLoading] = useState(!audit);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!audit && id) {
      setLoading(true);
      technicianAPI.getTechnicianAuditById(id)
        .then((res: any) => setAudit(res.data))
        .catch(() => setError('Failed to load audit details'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const photos: any[] = Array.isArray(audit?.photos) ? audit.photos : [];
  const scores: Record<string, string> = audit?.section_scores || {};

  // ── Loading / Error states ──

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          <p className="text-sm text-gray-500">Loading audit details…</p>
        </div>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <FiAlertCircle className="w-10 h-10 text-red-400 mx-auto" />
          <p className="text-gray-700 font-medium">{error || 'Audit not found'}</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Sticky Header ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {audit.site_id_ihs || 'Audit Detail'}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {audit.name_site && `${audit.name_site} · `}
                {formatDate(audit.date)}
                {audit.topology && ` · ${audit.topology}`}
              </p>
            </div>
          </div>
          <StatusBadge status={audit.status} />
        </div>
      </div>

      {/* ── Section Navigator ── */}
      <div className="bg-white border-b border-gray-100 sticky top-[73px] z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex gap-2 overflow-x-auto">
          {['overview', ...SECTION_KEYS.filter(s => scores[`notes_${s.key}`] || photos.some(p => p.category === s.key[0])).map(s => s.key), 'photos'].map(id => (
            <button
              key={id}
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="px-3 py-1 rounded-full bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-xs font-medium text-gray-600 whitespace-nowrap transition-colors capitalize"
            >
              {id === 'photos' ? 'All Photos' : id.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Overview */}
        <div id="overview">
          <Section title="Site Overview" icon={<FiMapPin className="w-4 h-4" />}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              <Field label="Site ID (IHS)"    value={audit.site_id_ihs} />
              <Field label="Site Name"        value={audit.name_site || '—'} />
              <Field label="Operator ID"      value={audit.id_operator} />
              <Field label="Topology"         value={audit.topology} />
              <Field label="Indoor / Outdoor" value={audit.indoor_outdoor} />
              <Field label="SBC"              value={audit.sbc} />
              <Field label="No. of Generators" value={audit.number_of_gen} />
              <Field label="Visit Date"       value={formatDate(audit.date)} />
              <Field label="Submitted At"     value={formatDateTime(audit.createdAt)} />
              <Field label="Last Updated"     value={formatDateTime(audit.updatedAt)} />
              <div>
                <p className="text-xs text-gray-500 mb-1">Overall Site Status</p>
                <StatusBool value={audit.overall_site_status} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Final Site Status</p>
                <StatusBool value={audit.final_site_status} />
              </div>
              <Field label="Timeline to Close Issues" value={formatDate(audit.timeline_to_close_issues)} className="col-span-2" />
            </div>
          </Section>
        </div>

        {/* SBC Feedback */}
        {audit.sbc_feedback && (
          <Section title="SBC Feedback" icon={<FiUser className="w-4 h-4" />}>
            <p className="text-sm text-gray-800 whitespace-pre-line">{audit.sbc_feedback}</p>
          </Section>
        )}

        {/* Equipment Sections */}
        {SECTION_KEYS.map(({ key, label, photoCategories, icon }) => {
          const noteKey = `notes_${key}`;
          const note = scores[noteKey];
          const sectionPhotos = photos.filter(p => photoCategories.includes(p.category));
          if (!note && !sectionPhotos.length) return null;

          return (
            <div id={key} key={key}>
              <Section title={label} icon={icon}>
                <div className="space-y-4">
                  {note && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Notes</p>
                      <p className="text-sm text-gray-800 whitespace-pre-line">{note}</p>
                    </div>
                  )}
                  {sectionPhotos.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <FiImage className="w-3 h-3" /> Photos ({sectionPhotos.length})
                      </p>
                      <PhotoGallery photos={sectionPhotos} />
                    </div>
                  )}
                </div>
              </Section>
            </div>
          );
        })}

        {/* General Notes & Comments */}
        {(audit.notes || audit.comments) && (
          <Section title="Notes & Comments" icon={<FiFileText className="w-4 h-4" />}>
            <div className="space-y-4">
              {audit.notes && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Notes</p>
                  <p className="text-sm text-gray-800 whitespace-pre-line">{audit.notes}</p>
                </div>
              )}
              {audit.comments && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Comments</p>
                  <p className="text-sm text-gray-800 whitespace-pre-line">{audit.comments}</p>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* All Photos */}
        {photos.length > 0 && (
          <div id="photos">
            <Section title={`All Photos (${photos.length})`} icon={<FiImage className="w-4 h-4" />}>
              {/* Grouped by category */}
              {Array.from(new Set(photos.map(p => p.category))).map(cat => (
                <div key={cat} className="mb-6 last:mb-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 capitalize">
                    {cat.replace(/_/g, ' ')}
                  </p>
                  <PhotoGallery photos={photos} category={cat} />
                </div>
              ))}
            </Section>
          </div>
        )}

        {/* Metadata */}
        <Section title="Record Info" icon={<FiClock className="w-4 h-4" />}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 text-xs">
            <Field label="Record ID"    value={<span className="font-mono text-xs text-gray-600">{audit._id}</span>} />
            <Field label="Created By"   value={<span className="font-mono text-xs text-gray-600">{audit.created_by}</span>} />
            <Field label="Updated By"   value={<span className="font-mono text-xs text-gray-600">{audit.updated_by}</span>} />
            <Field label="Created At"   value={formatDateTime(audit.createdAt)} />
            <Field label="Updated At"   value={formatDateTime(audit.updatedAt)} />
          </div>
        </Section>

      </div>
    </div>
  );
};

export default TechnicianAuditDetailPage;









// import React from 'react';
// import { useParams } from 'react-router-dom';
// import { useEffect, useState } from 'react';
// import { useLocation } from 'react-router';
// import { ReportDetailView } from '@/components/common/ReportDetailView';
// import { technicianAPI } from '@/api/endpoints/technician';

// const TechnicianAuditDetailPage: React.FC = () => {
//   const { id } = useParams<{ id: string }>();
//   const location = useLocation();
//   const [audit, setAudit] = useState<any>(location.state?.audit || null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (!audit && id) {
//       setLoading(true);
//       technicianAPI.getTechnicianAuditById(id)
//         .then((res: any) => {
//           setAudit(res.data);
//         })
//         .catch(() => setError('Failed to load audit details'))
//         .finally(() => setLoading(false));
//     }
//   }, [id, audit]);

//   if (loading) return <div className="p-8 text-center">Loading...</div>;
//   if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
//   if (!audit) return <div className="p-8 text-center">No audit found.</div>;

//   return (
//     <div className="max-w-5xl mx-auto py-8">
//       <h1 className="text-2xl font-bold mb-6">Technician Audit Details</h1>
//       <ReportDetailView report={audit} />
//     </div>
//   );
// };

// export default TechnicianAuditDetailPage;
