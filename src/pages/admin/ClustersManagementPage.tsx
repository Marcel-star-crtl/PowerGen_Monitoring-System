import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { Table } from '@/components/common/Table';
import { Card } from '@/components/common/Card';
import { SupervisorAutocomplete } from '@/components/common/SupervisorAutocomplete';
import TechnicianPickerModal from './TechnicianPickerModal';
import { FiPlus, FiEdit, FiTrash2, FiUsers, FiEye, FiX } from 'react-icons/fi';
import { useNotification } from '@/contexts/NotificationContext';
import { adminAPI } from '@/api/endpoints/admin';

// ─── Sites list sub-component ─────────────────────────────────────────────────
const SitesList: React.FC<{ cluster: any }> = ({ cluster }) => {
  const [sites, setSites] = React.useState<any[]>(cluster.sites || []);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!sites || sites.length === 0) {
      setLoading(true);
      adminAPI.getAllSites({ cluster: cluster.name, limit: 1000 })
        .then((res: any) => {
          const siteArray = Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data?.sites)
              ? res.data.sites
              : [];
          setSites(siteArray.filter((s: any) => s.GRATO_Cluster === cluster.name));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [cluster]);

  if (loading) return <div className="text-gray-500 text-sm py-4">Loading sites...</div>;
  if (!sites.length) return <div className="text-gray-500 text-sm py-4">No sites found for this cluster.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {sites.map((site: any) => (
        <Card key={site._id || site.IHS_ID_SITE} className="p-3">
          <p className="font-semibold text-gray-900 text-sm">{site.Site_Name || 'Unnamed Site'}</p>
          <p className="text-xs text-gray-500">ID: {site.IHS_ID_SITE || site._id}</p>
          <p className="text-xs text-gray-500">Region: {site.Region || cluster.region || 'N/A'}</p>
          <p className="text-xs text-gray-500">Priority: {site.Sites_Priority || 'N/A'}</p>
        </Card>
      ))}
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const ClustersManagementPage: React.FC = () => {
  const { success, error: showError } = useNotification();

  const [clusters, setClusters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Create / Edit modal
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedCluster, setSelectedCluster] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', region: '', supervisor: '' });

  // Technician picker modal
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [pickerCluster, setPickerCluster] = useState<any>(null);

  // Sites modal
  const [showSitesModal, setShowSitesModal] = useState(false);
  const [sitesModalCluster, setSitesModalCluster] = useState<any>(null);

  // ── Load clusters ──────────────────────────────────────────────────────────
  useEffect(() => { loadClusters(); }, []);

  const loadClusters = async () => {
    setLoading(true);
    try {
      const result = await adminAPI.getAllClusters();
      if (result.success && Array.isArray(result.data)) {
        setClusters(result.data.map((c: any) => ({
          ...c,
          sites_count: c.sites_count ?? c.totalSites ?? c.sites?.length ?? 0,
          sites: Array.isArray(c.sites) ? c.sites : [],
        })));
      }
    } catch {
      showError('Failed to load clusters');
    } finally {
      setLoading(false);
    }
  };

  // Helper: extract assigned tech IDs from a cluster object
  const getAssignedIds = (cluster: any): string[] =>
    (cluster?.assigned_technicians || [])
      .map((t: any) => {
        if (typeof t === 'string') return t;
        return t.technician?._id || t.technician || t._id || '';
      })
      .filter(Boolean);

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    setSaving(true);
    try {
      await adminAPI.createCluster(formData);
      success('Cluster created!');
      setShowModal(false);
      resetForm();
      loadClusters();
    } catch { showError('Failed to create cluster'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!selectedCluster?._id) { showError('Cluster ID missing'); return; }
    setSaving(true);
    try {
      await adminAPI.updateCluster(selectedCluster._id, {
        name: formData.name,
        region: formData.region,
        supervisor: formData.supervisor || null,
      });
      success('Cluster updated!');
      setShowModal(false);
      resetForm();
      loadClusters();
    } catch { showError('Failed to update cluster'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (clusterId: string) => {
    if (!clusterId) { showError('Cluster ID missing'); return; }
    if (!window.confirm('Delete this cluster?')) return;
    try {
      await adminAPI.deleteCluster(clusterId);
      success('Cluster deleted!');
      loadClusters();
    } catch { showError('Failed to delete cluster'); }
  };

  // Remove a tech from the edit modal list
  const handleRemoveTech = async (techId: string) => {
    if (!selectedCluster?._id) return;
    try {
      await adminAPI.removeTechnicianFromCluster(selectedCluster._id, techId);
      success('Technician removed');
      const updated = {
        ...selectedCluster,
        assigned_technicians: selectedCluster.assigned_technicians.filter((t: any) => {
          const id = typeof t === 'string' ? t : t.technician?._id || t.technician || t._id;
          return id !== techId;
        }),
      };
      setSelectedCluster(updated);
      loadClusters();
    } catch { showError('Failed to remove technician'); }
  };

  // Called by TechnicianPickerModal when user clicks Assign
  const handlePickerAssign = async (technicianId: string) => {
    const targetCluster = pickerCluster || selectedCluster;
    if (!targetCluster?._id) { showError('Cluster ID missing'); return; }
    try {
      await adminAPI.assignTechnicianToCluster(targetCluster._id, technicianId);
      success('Technician assigned!');
      // Refresh cluster list and keep picker in sync
      const result = await adminAPI.getAllClusters();
      if (result.success && Array.isArray(result.data)) {
        const updatedList = result.data.map((c: any) => ({
          ...c,
          sites_count: c.sites_count ?? c.totalSites ?? 0,
          sites: Array.isArray(c.sites) ? c.sites : [],
        }));
        setClusters(updatedList);
        const refreshed = updatedList.find((c: any) => c._id === targetCluster._id);
        if (refreshed) {
          if (pickerCluster) setPickerCluster(refreshed);
          if (selectedCluster) setSelectedCluster(refreshed);
        }
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to assign technician';
      showError(msg);
      throw err; // re-throw so the picker can reset its loading state
    }
  };

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setModalType('create');
    setSelectedCluster(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (cluster: any) => {
    setModalType('edit');
    setSelectedCluster(cluster);
    setFormData({
      name: cluster.name || '',
      region: cluster.region || '',
      supervisor: cluster.supervisor?._id || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', region: '', supervisor: '' });
    setSelectedCluster(null);
  };

  // ── Table columns ──────────────────────────────────────────────────────────
  const columns = [
    { key: 'name', header: 'Cluster Name' },
    { key: 'region', header: 'Region' },
    {
      key: 'supervisor',
      header: 'Supervisor',
      render: (cluster: any) =>
        cluster.supervisor?.fullName || <span className="text-gray-400 text-sm">Unassigned</span>,
    },
    {
      key: 'technicians_count',
      header: 'Technicians',
      render: (cluster: any) => (
        <div className="flex items-center gap-2">
          <Badge variant="blue">{cluster.assigned_technicians?.length ?? 0}</Badge>
          <Button
            onClick={() => { setPickerCluster(cluster); setShowPickerModal(true); }}
            variant="ghost"
            size="sm"
            title="Manage Technicians"
          >
            <FiUsers className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
    {
      key: 'sites_count',
      header: 'Sites',
      render: (cluster: any) => (
        <div className="flex items-center gap-2">
          <Badge variant="green">{cluster.sites_count ?? 0}</Badge>
          <Button
            onClick={() => { setSitesModalCluster(cluster); setShowSitesModal(true); }}
            variant="ghost"
            size="sm"
            title="View Sites"
          >
            <FiEye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (cluster: any) => (
        <div className="flex gap-2">
          <Button onClick={() => openEditModal(cluster)} variant="ghost" size="sm">
            <FiEdit className="h-4 w-4" />
          </Button>
          <Button onClick={() => handleDelete(cluster._id)} variant="ghost" size="sm">
            <FiTrash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clusters Management</h1>
        <Button onClick={openCreateModal} variant="primary">
          <FiPlus className="mr-2 h-4 w-4" />
          Add Cluster
        </Button>
      </div>

      <Card padding="none">
        <Table data={clusters} columns={columns} loading={loading} />
      </Card>

      {/* Sites Modal */}
      <Modal
        isOpen={showSitesModal}
        onClose={() => { setShowSitesModal(false); setSitesModalCluster(null); }}
        title={sitesModalCluster ? `Sites in ${sitesModalCluster.name}` : 'Sites'}
        size="lg"
      >
        {sitesModalCluster && <SitesList cluster={sitesModalCluster} />}
      </Modal>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={modalType === 'create' ? 'Create New Cluster' : `Edit — ${selectedCluster?.name}`}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Cluster Name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
          />
          <Input
            label="Region"
            value={formData.region}
            onChange={e => setFormData({ ...formData, region: e.target.value })}
            fullWidth
          />
          <SupervisorAutocomplete
            label="Supervisor"
            value={formData.supervisor}
            onChange={id => setFormData({ ...formData, supervisor: id })}
          />

          {/* Technicians section — edit mode only */}
          {modalType === 'edit' && selectedCluster?._id && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Assigned Technicians ({getAssignedIds(selectedCluster).length})
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowModal(false);
                    setPickerCluster(selectedCluster);
                    setShowPickerModal(true);
                  }}
                >
                  <FiPlus className="h-3.5 w-3.5 mr-1" />
                  Add Technician
                </Button>
              </div>

              {getAssignedIds(selectedCluster).length === 0 ? (
                <p className="text-sm text-gray-400 bg-gray-50 rounded-lg px-3 py-3">
                  No technicians assigned yet. Click "Add Technician" to assign.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {selectedCluster.assigned_technicians.map((t: any) => {
                    const techId = typeof t === 'string' ? t : t.technician?._id || t.technician || t._id;
                    const techName = t.technician?.fullName || t.fullName || techId;
                    const techEmail = t.technician?.email || t.email || '';
                    return (
                      <div key={techId} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {techName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{techName}</p>
                            {techEmail && <p className="text-xs text-gray-400">{techEmail}</p>}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveTech(techId)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded"
                          title="Remove"
                        >
                          <FiX className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button onClick={() => { setShowModal(false); resetForm(); }} variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={modalType === 'create' ? handleCreate : handleUpdate}
              variant="primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : modalType === 'create' ? 'Create' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Technician Picker Modal */}
      <TechnicianPickerModal
        isOpen={showPickerModal}
        onClose={() => {
          setShowPickerModal(false);
          setPickerCluster(null);
          loadClusters();
        }}
        clusterName={pickerCluster?.name || selectedCluster?.name || ''}
        assignedIds={getAssignedIds(pickerCluster || selectedCluster)}
        onAssign={handlePickerAssign}
      />
    </div>
  );
};

export default ClustersManagementPage;










// import { Badge } from '@/components/common/Badge';
// import { Button } from '@/components/common/Button';
// import { Input } from '@/components/common/Input';
// import { Modal } from '@/components/common/Modal';
// import { Table } from '@/components/common/Table';
// import { SupervisorAutocomplete } from '@/components/common/SupervisorAutocomplete';
// import AssignedTechniciansEditor from './AssignedTechniciansEditor';
// import { FiPlus, FiEdit, FiTrash2, FiUsers, FiEye } from 'react-icons/fi';
// import { useNotification } from '@/contexts/NotificationContext';
// import React, { useEffect, useState } from 'react';
// import { adminAPI } from '@/api/endpoints/admin';
// import { Card } from '@/components/common/Card';

// // ─── Sites list sub-component ────────────────────────────────────────────────
// const SitesList: React.FC<{ cluster: any }> = ({ cluster }) => {
//   const [sites, setSites] = React.useState<any[]>(cluster.sites || []);
//   const [loading, setLoading] = React.useState(false);

//   React.useEffect(() => {
//     if (!sites || sites.length === 0) {
//       setLoading(true);
//       adminAPI.getAllSites({ cluster: cluster.name, limit: 1000 })
//         .then((res: any) => {
//           const siteArray = Array.isArray(res.data)
//             ? res.data
//             : Array.isArray(res.data?.sites)
//               ? res.data.sites
//               : [];
//           const filtered = siteArray.filter((s: any) => s.GRATO_Cluster === cluster.name);
//           setSites(filtered);
//         })
//         .catch(() => {})
//         .finally(() => setLoading(false));
//     }
//   }, [cluster]);

//   if (loading) return <div className="text-gray-500">Loading sites...</div>;
//   if (!sites || sites.length === 0) return <div className="text-gray-500">No sites found for this cluster.</div>;

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//       {sites.map((site: any) => (
//         <Card key={site._id || site.IHS_ID_SITE} className="p-4">
//           <h3 className="font-semibold text-gray-900">{site.Site_Name || 'Unnamed Site'}</h3>
//           <p className="text-sm text-gray-500">ID: {site.IHS_ID_SITE || site._id}</p>
//           <p className="text-sm text-gray-500">Region: {site.Region || cluster.region || 'N/A'}</p>
//           <p className="text-sm text-gray-500">Priority: {site.Sites_Priority || 'N/A'}</p>
//         </Card>
//       ))}
//     </div>
//   );
// };

// // ─── Main page ────────────────────────────────────────────────────────────────
// const ClustersManagementPage: React.FC = () => {
//   const { success, error: showError } = useNotification();

//   const [clusters, setClusters] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [allTechnicians, setAllTechnicians] = useState<any[]>([]);

//   // Create / Edit modal
//   const [showModal, setShowModal] = useState(false);
//   const [modalType, setModalType] = useState<'create' | 'edit'>('create');
//   const [selectedCluster, setSelectedCluster] = useState<any>(null);
//   const [formData, setFormData] = useState({ name: '', region: '', supervisor: '' });
//   const [editTechs, setEditTechs] = useState<string[]>([]);
//   const [saving, setSaving] = useState(false);

//   // Sites modal
//   const [showSitesModal, setShowSitesModal] = useState(false);
//   const [sitesModalCluster, setSitesModalCluster] = useState<any | null>(null);

//   // ── Load data ──────────────────────────────────────────────────────────────
//   useEffect(() => {
//     loadClusters();
//     adminAPI.getUsers({ role: 'technician', limit: 100 }).then((result: any) => {
//       if (result.success && result.data) {
//         setAllTechnicians(
//           result.data.users.map((u: any) => ({
//             id: u._id || u.id,
//             fullName: u.fullName || '',
//             email: u.email || '',
//           }))
//         );
//       }
//     });
//   }, []);

//   const loadClusters = async () => {
//     setLoading(true);
//     try {
//       const result = await adminAPI.getAllClusters();
//       if (result.success && Array.isArray(result.data)) {
//         setClusters(
//           result.data.map((c: any) => ({
//             ...c,
//             sites_count: c.sites_count ?? c.totalSites ?? c.sites?.length ?? 0,
//             sites: Array.isArray(c.sites) ? c.sites : [],
//           }))
//         );
//       }
//     } catch {
//       showError('Failed to load clusters');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ── CRUD helpers ───────────────────────────────────────────────────────────
//   const handleCreate = async () => {
//     setSaving(true);
//     try {
//       await adminAPI.createCluster(formData);
//       success('Cluster created successfully!');
//       setShowModal(false);
//       resetForm();
//       loadClusters();
//     } catch {
//       showError('Failed to create cluster');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleUpdate = async () => {
//     // ── FIX: Guard against missing _id early ──
//     const clusterId = selectedCluster?._id;
//     if (!clusterId) {
//       showError('Cluster ID is missing — please close and reopen the modal.');
//       return;
//     }

//     setSaving(true);
//     try {
//       // 1. Update cluster details (name, region, supervisor)
//       await adminAPI.updateCluster(clusterId, {
//         name: formData.name,
//         region: formData.region,
//         supervisor: formData.supervisor || null,
//       });

//       // 2. Sync technician assignments:
//       //    - Add any newly added technicians
//       //    - Remove any that were removed
//       const currentTechIds: string[] = (selectedCluster.assigned_technicians || []).map(
//         (t: any) => (typeof t === 'string' ? t : t.technician?._id || t.technician || t._id || '')
//       );
//       const toAdd = editTechs.filter(id => !currentTechIds.includes(id));
//       const toRemove = currentTechIds.filter((id: string) => id && !editTechs.includes(id));

//       await Promise.all([
//         ...toAdd.map((techId: string) =>
//           adminAPI.assignTechnicianToCluster(clusterId, techId).catch((e: any) =>
//             console.warn('Failed to add tech', techId, e)
//           )
//         ),
//         ...toRemove.map((techId: string) =>
//           adminAPI.removeTechnicianFromCluster(clusterId, techId).catch((e: any) =>
//             console.warn('Failed to remove tech', techId, e)
//           )
//         ),
//       ]);

//       success('Cluster updated successfully!');
//       setShowModal(false);
//       resetForm();
//       loadClusters();
//     } catch {
//       showError('Failed to update cluster');
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleDelete = async (clusterId: string) => {
//     if (!clusterId) { showError('Cluster ID is missing'); return; }
//     if (!window.confirm('Are you sure you want to delete this cluster?')) return;
//     try {
//       await adminAPI.deleteCluster(clusterId);
//       success('Cluster deleted successfully!');
//       loadClusters();
//     } catch {
//       showError('Failed to delete cluster');
//     }
//   };

//   // ── Modal helpers ─────────────────────────────────────────────────────────
//   const openCreateModal = () => {
//     setModalType('create');
//     setSelectedCluster(null);
//     resetForm();
//     setShowModal(true);
//   };

//   const openEditModal = (cluster: any) => {
//     setModalType('edit');
//     setSelectedCluster(cluster);
//     setFormData({
//       name: cluster.name || '',
//       region: cluster.region || '',
//       supervisor: cluster.supervisor?._id || '',
//     });

//     // Normalise assigned technician IDs
//     const techIds: string[] = (cluster.assigned_technicians || []).map((t: any) => {
//       if (typeof t === 'string') return t;
//       return t.technician?._id || t.technician || t._id || '';
//     }).filter(Boolean);

//     setEditTechs(techIds);
//     setShowModal(true);
//   };

//   const resetForm = () => {
//     setFormData({ name: '', region: '', supervisor: '' });
//     setEditTechs([]);
//     setSelectedCluster(null);
//   };

//   // ── Remove a single technician inline ────────────────────────────────────
//   const handleInlineRemoveTech = async (techId: string) => {
//     const clusterId = selectedCluster?._id;
//     if (!clusterId) { showError('Cluster ID is missing'); return; }
//     try {
//       await adminAPI.removeTechnicianFromCluster(clusterId, techId);
//       success('Technician removed');
//       setEditTechs(prev => prev.filter(id => id !== techId));
//       // Refresh cluster data in background
//       loadClusters();
//     } catch {
//       showError('Failed to remove technician');
//     }
//   };

//   // ── Table columns ─────────────────────────────────────────────────────────
//   const columns = [
//     { key: 'name', header: 'Cluster Name' },
//     { key: 'region', header: 'Region' },
//     {
//       key: 'supervisor',
//       header: 'Supervisor',
//       render: (cluster: any) =>
//         cluster.supervisor?.fullName || <span className="text-gray-400">Unassigned</span>,
//     },
//     {
//       key: 'technicians_count',
//       header: 'Technicians',
//       render: (cluster: any) => (
//         <Badge variant="blue">{cluster.assigned_technicians?.length ?? 0}</Badge>
//       ),
//     },
//     {
//       key: 'sites_count',
//       header: 'Sites',
//       render: (cluster: any) => (
//         <div className="flex items-center space-x-2">
//           <Badge variant="green">{cluster.sites_count ?? 0}</Badge>
//           <Button
//             onClick={() => { setSitesModalCluster(cluster); setShowSitesModal(true); }}
//             variant="ghost"
//             size="sm"
//             title="View Sites"
//           >
//             <FiEye className="h-4 w-4" />
//           </Button>
//         </div>
//       ),
//     },
//     {
//       key: 'actions',
//       header: 'Actions',
//       render: (cluster: any) => (
//         <div className="flex space-x-2">
//           <Button onClick={() => openEditModal(cluster)} variant="ghost" size="sm">
//             <FiEdit className="h-4 w-4" />
//           </Button>
//           <Button onClick={() => handleDelete(cluster._id)} variant="ghost" size="sm">
//             <FiTrash2 className="h-4 w-4 text-red-600" />
//           </Button>
//         </div>
//       ),
//     },
//   ];

//   // ── Render ────────────────────────────────────────────────────────────────
//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <h1 className="text-2xl font-bold text-gray-900">Clusters Management</h1>
//         <Button onClick={openCreateModal} variant="primary">
//           <FiPlus className="mr-2" />
//           Add Cluster
//         </Button>
//       </div>

//       <Card padding="none">
//         <Table data={clusters} columns={columns} loading={loading} />
//       </Card>

//       {/* ── Sites Modal ── */}
//       <Modal
//         isOpen={showSitesModal}
//         onClose={() => { setShowSitesModal(false); setSitesModalCluster(null); }}
//         title={sitesModalCluster ? `Sites in ${sitesModalCluster.name}` : 'Sites'}
//         size="lg"
//       >
//         {sitesModalCluster
//           ? <SitesList cluster={sitesModalCluster} />
//           : <div className="text-gray-500">No cluster selected.</div>}
//       </Modal>

//       {/* ── Create / Edit Modal ── */}
//       <Modal
//         isOpen={showModal}
//         onClose={() => { setShowModal(false); resetForm(); }}
//         title={modalType === 'create' ? 'Create New Cluster' : `Edit Cluster${selectedCluster?._id ? '' : ' ⚠️ No ID'}`}
//         size="md"
//       >
//         <div className="space-y-4">
//           {/* Warn if editing but no _id resolved */}
//           {modalType === 'edit' && !selectedCluster?._id && (
//             <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
//               ⚠️ This cluster has no database record yet. Create it first before assigning technicians.
//             </div>
//           )}

//           <Input
//             label="Cluster Name"
//             value={formData.name}
//             onChange={e => setFormData({ ...formData, name: e.target.value })}
//             required
//             fullWidth
//           />
//           <Input
//             label="Region"
//             value={formData.region}
//             onChange={e => setFormData({ ...formData, region: e.target.value })}
//             fullWidth
//           />
//           <SupervisorAutocomplete
//             label="Supervisor"
//             value={formData.supervisor}
//             onChange={id => setFormData({ ...formData, supervisor: id })}
//           />

//           {/* Technicians section — only show for existing clusters */}
//           {modalType === 'edit' && selectedCluster?._id && (
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Assigned Technicians
//               </label>
//               <AssignedTechniciansEditor selected={editTechs} onChange={setEditTechs} />
//               <div className="space-y-2 mt-2">
//                 {editTechs.length === 0 && (
//                   <div className="text-gray-400 text-sm">No technicians assigned.</div>
//                 )}
//                 {editTechs.map(techId => {
//                   const tech = allTechnicians.find(t => t.id === techId);
//                   return (
//                     <div
//                       key={techId}
//                       className="flex items-center justify-between bg-gray-100 rounded px-3 py-1.5"
//                     >
//                       <span className="text-sm">
//                         {tech ? `${tech.fullName} (${tech.email})` : techId}
//                       </span>
//                       <Button
//                         variant="danger"
//                         size="sm"
//                         onClick={() => handleInlineRemoveTech(techId)}
//                       >
//                         Remove
//                       </Button>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           )}

//           <div className="flex justify-end space-x-3 pt-2">
//             <Button onClick={() => { setShowModal(false); resetForm(); }} variant="secondary">
//               Cancel
//             </Button>
//             <Button
//               onClick={modalType === 'create' ? handleCreate : handleUpdate}
//               variant="primary"
//               disabled={saving || (modalType === 'edit' && !selectedCluster?._id)}
//             >
//               {saving ? 'Saving…' : modalType === 'create' ? 'Create' : 'Update'}
//             </Button>
//           </div>
//         </div>
//       </Modal>
//     </div>
//   );
// };

// export default ClustersManagementPage;



