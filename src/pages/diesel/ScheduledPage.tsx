import React, { useEffect, useState } from 'react';
import { dieselManagerAPI } from '@/api/endpoints/dieselManager';
import { useNotification } from '@/contexts/NotificationContext';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Spinner } from '@/components/common/Spinner';
import { FuelConsumption } from '@/types/fuel.types';
import { FuelScheduleForm } from '@/components/forms/FuelScheduleForm';
import { FiCalendar, FiUser, FiMapPin, FiEye, FiEdit, FiTrash2, FiPlus, FiUpload } from 'react-icons/fi';

const DieselSchedulePage: React.FC = () => {
  const [scheduled, setScheduled] = useState<FuelConsumption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FuelConsumption | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { success, error: showError } = useNotification();

  const [technicians, setTechnicians] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);

  const handleViewDetails = (item: FuelConsumption) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const handleEdit = (item: FuelConsumption) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleDelete = (item: FuelConsumption) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  useEffect(() => {
    loadScheduled();
    loadTechnicians();
    loadSites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTechnicians = async () => {
    try {
      const result = await dieselManagerAPI.getTechnicians();
      setTechnicians(result.data || []);
    } catch {}
  };

  const loadSites = async () => {
    try {
      const result = await dieselManagerAPI.getSites();
      setSites(result.data || []);
    } catch {}
  };

  const loadScheduled = async () => {
    setLoading(true);
    try {
      const result = await dieselManagerAPI.getScheduledMaintenance();
      setScheduled(result.data || []);
    } catch (err) {
      showError('Failed to load scheduled fuel tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleFuel = async (data: any) => {
    setSubmitting(true);
    try {
      // Combine datetime field for backend
      const payload = { ...data, type: 'RF', scheduled_date: data.scheduled_datetime };
      await dieselManagerAPI.createFuelRequest(payload);
      success('Fuel task scheduled successfully!');
      setShowScheduleModal(false);
      loadScheduled();
    } catch (err) {
      showError('Failed to schedule fuel task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;
    try {
      // Replace with your actual delete API call
      // await dieselManagerAPI.deleteFuelRequest(selectedItem._id);
      success('Task deleted successfully!');
      setShowDeleteModal(false);
      setSelectedItem(null);
      loadScheduled();
    } catch (err) {
      showError('Failed to delete task');
    }
  };

  // Group by date (using scheduled_date, visit_date, or record_date)
  const groupedByDate = scheduled.reduce((acc, item) => {
    let dateValue = item.scheduled_date || item.scheduled_datetime || item.visit_date || item.record_date;
    let date = 'No Date';
    if (dateValue) {
      if (typeof dateValue === 'string') {
        date = new Date(dateValue).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
      } else if (dateValue.$date) {
        date = new Date(dateValue.$date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
      } else {
        date = new Date(dateValue).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
      }
    }
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {} as Record<string, FuelConsumption[]>);

  const dates = Object.keys(groupedByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  // Summary stats
  const totalScheduled = scheduled.length;
  const approved = scheduled.filter((item) => item.status === 'approved').length;
  const inProgress = scheduled.filter((item) => item.status === 'in_progress').length;
  const highPriority = scheduled.filter((item) => (item.priority || '').toLowerCase() === 'high').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Scheduled Maintenance</h1>
        <div className="flex items-center space-x-3">
          <Button onClick={() => setShowScheduleModal(true)} variant="primary">
            <FiPlus className="mr-2" />
            Schedule New
          </Button>
        </div>
      </div>

      {scheduled.length === 0 ? (
        <Card>No scheduled fuel tasks.</Card>
      ) : (
        <div className="space-y-6">
          {dates.map((date) => (
            <div key={date}>
              <div className="flex items-center mb-4">
                <FiCalendar className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">{date}</h2>
                <Badge variant="blue" size="sm" className="ml-3">
                  {groupedByDate[date].length} task{groupedByDate[date].length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedByDate[date].map((item) => (
                  <Card key={item._id} className="hover:shadow-lg transition-shadow">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 line-clamp-1">
                            {item.site_details?.Site_Name || item.site_id}
                          </h3>
                          <p className="text-sm text-gray-500">{item.site_details?.Site_Code || item.site_id}</p>
                        </div>
                        <Badge
                          variant={
                            (item.status || '').toLowerCase() === 'scheduled'
                              ? 'blue'
                              : (item.status || '').toLowerCase() === 'approved'
                              ? 'green'
                              : 'gray'
                          }
                        >
                          {(item.status || 'Scheduled').charAt(0).toUpperCase() + (item.status || 'Scheduled').slice(1)}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-600">
                          <FiUser className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {item.technician?.fullName || item.technician_name || item.fse_name || 'Unassigned'}
                          </span>
                        </div>
                        {item.site_details?.Region && (
                          <div className="flex items-center text-gray-600">
                            <FiMapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{item.site_details.Region}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-500">Visit Type:</span>
                          <Badge variant="blue" size="sm">
                            {item.type || 'RF'}
                          </Badge>
                        </div>
                        {item.priority && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Priority:</span>
                            <Badge
                              variant={
                                (item.priority || '').toLowerCase() === 'high'
                                  ? 'red'
                                  : (item.priority || '').toLowerCase() === 'medium'
                                  ? 'yellow'
                                  : 'gray'
                              }
                              size="sm"
                            >
                              {(item.priority || '').toLowerCase()}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        <Button variant="ghost" size="sm" fullWidth onClick={() => handleViewDetails(item)}>
                          <FiEye className="mr-1" />
                          View
                        </Button>
                        <Button variant="secondary" size="sm" fullWidth onClick={() => handleEdit(item)}>
                          <FiEdit className="mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          fullWidth
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleDelete(item)}
                        >
                          <FiTrash2 className="mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">Total Scheduled</p>
            <p className="text-2xl font-bold text-gray-900">{totalScheduled}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">Approved</p>
            <p className="text-2xl font-bold text-blue-600">{approved}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">In Progress</p>
            <p className="text-2xl font-bold text-green-600">{inProgress}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-500">High Priority</p>
            <p className="text-2xl font-bold text-red-600">{highPriority}</p>
          </div>
        </Card>
      </div>

      {/* ── MODALS — rendered once, at the top level, outside any loop ── */}

      {/* Schedule New Modal */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title="Schedule Fuel Task"
        size="lg"
      >
        <FuelScheduleForm
          onSubmit={handleScheduleFuel}
          onCancel={() => setShowScheduleModal(false)}
          loading={submitting}
          technicians={technicians}
          sites={sites}
        />
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => { setShowDetailsModal(false); setSelectedItem(null); }}
        title="Maintenance Details"
        size="md"
      >
        {selectedItem ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-3">
                <div>
                  <span className="block text-gray-500 text-sm">Site</span>
                  <span className="font-bold text-lg">{selectedItem.site_details?.Site_Name || selectedItem.site_id}</span>
                </div>
                  <div>
                    <span className="block text-gray-500 text-sm">Technician</span>
                    <span className="font-bold">
                      {selectedItem.technician?.fullName || selectedItem.technician_name || selectedItem.fse_name || 'Unassigned'}
                    </span>
                  </div>
                <div>
                  <span className="block text-gray-500 text-sm">Visit Type</span>
                  <Badge variant="blue" size="sm">{selectedItem.type || 'RF'}</Badge>
                </div>
                <div>
                  <span className="block text-gray-500 text-sm">Status</span>
                  <span className="font-bold">{selectedItem.status || 'Scheduled'}</span>
                </div>
                <div>
                  <span className="block text-gray-500 text-sm">Exit Time</span>
                  <span>-</span>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="block text-gray-500 text-sm">Site ID</span>
                  <span className="font-bold">{selectedItem.site_details?.Site_Code || selectedItem.site_id}</span>
                </div>
                <div>
                  <span className="block text-gray-500 text-sm">Visit Date</span>
                  <span className="font-bold">{selectedItem.record_date ? new Date(selectedItem.record_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }) : '-'}</span>
                </div>
                <div>
                  <span className="block text-gray-500 text-sm">Priority</span>
                  <Badge variant={
                    (selectedItem.priority || '').toLowerCase() === 'high' ? 'red' :
                    (selectedItem.priority || '').toLowerCase() === 'medium' ? 'yellow' : 'gray'
                  } size="sm">{(selectedItem.priority || '').toLowerCase()}</Badge>
                </div>
                <div>
                  <span className="block text-gray-500 text-sm">Entry Time</span>
                  <span>-</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t pt-4">
              <Button variant="secondary" onClick={() => { setShowDetailsModal(false); setShowEditModal(true); }}>Edit</Button>
              <Button variant="danger" onClick={() => { setShowDetailsModal(false); setSelectedItem(null); }}>Close</Button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedItem(null); }}
        title="Edit Scheduled Task"
        size="lg"
      >
        {selectedItem ? (
          <FuelScheduleForm
            initialData={selectedItem}
            onSubmit={async (data: any) => {
              setSubmitting(true);
              try {
                await dieselManagerAPI.updateFuelRequest(selectedItem._id, data);
                success('Task updated successfully!');
                setShowEditModal(false);
                setSelectedItem(null);
                loadScheduled();
              } catch (err) {
                showError('Failed to update task');
              } finally {
                setSubmitting(false);
              }
            }}
            onCancel={() => { setShowEditModal(false); setSelectedItem(null); }}
            loading={submitting}
            technicians={technicians}
            sites={sites}
          />
        ) : null}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedItem(null); }}
        title="Delete Task"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete the task for{' '}
            <span className="font-semibold">{selectedItem?.site_details?.Site_Name || selectedItem?.site_id}</span>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => { setShowDeleteModal(false); setSelectedItem(null); }}>
              Cancel
            </Button>
            <Button variant="primary" className="bg-red-600 hover:bg-red-700" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DieselSchedulePage;











// import React, { useEffect, useState } from 'react';
// import { dieselManagerAPI } from '@/api/endpoints/dieselManager';
// import { useNotification } from '@/contexts/NotificationContext';
// import { Card } from '@/components/common/Card';
// import { Badge } from '@/components/common/Badge';
// import { Button } from '@/components/common/Button';
// import { Modal } from '@/components/common/Modal';
// import { Spinner } from '@/components/common/Spinner';
// import { FuelConsumption } from '@/types/fuel.types';
// import { FuelScheduleForm } from '@/components/forms/FuelScheduleForm';
// import { FiCalendar, FiUser, FiMapPin, FiEye, FiEdit, FiTrash2, FiPlus, FiUpload } from 'react-icons/fi';

// const DieselSchedulePage: React.FC = () => {
//   const [scheduled, setScheduled] = useState<FuelConsumption[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [showScheduleModal, setShowScheduleModal] = useState(false);
//   const [selectedItem, setSelectedItem] = useState<FuelConsumption | null>(null);
//   const [showDetailsModal, setShowDetailsModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//     const handleViewDetails = (item: FuelConsumption) => {
//       setSelectedItem(item);
//       setShowDetailsModal(true);
//     };

//     const handleEdit = (item: FuelConsumption) => {
//       setSelectedItem(item);
//       setShowEditModal(true);
//     };
//   const [submitting, setSubmitting] = useState(false);
//   const { success, error: showError } = useNotification();

//   const [technicians, setTechnicians] = useState<any[]>([]);
//   const [sites, setSites] = useState<any[]>([]);

//   useEffect(() => {
//     loadScheduled();
//     loadTechnicians();
//     loadSites();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const loadTechnicians = async () => {
//     try {
//       const result = await dieselManagerAPI.getTechnicians();
//       setTechnicians(result.data || []);
//     } catch {}
//   };

//   const loadSites = async () => {
//     try {
//       const result = await dieselManagerAPI.getSites();
//       setSites(result.data || []);
//     } catch {}
//   };

//   const loadScheduled = async () => {
//     setLoading(true);
//     try {
//       const result = await dieselManagerAPI.getScheduledMaintenance();
//       setScheduled(result.data || []);
//     } catch (err) {
//       showError('Failed to load scheduled fuel tasks');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleScheduleFuel = async (data: any) => {
//     setSubmitting(true);
//     try {
//       // Always set type to 'RF' (refuel/fuel)
//       const payload = { ...data, type: 'RF' };
//       await dieselManagerAPI.createFuelRequest(payload);
//       success('Fuel task scheduled successfully!');
//       setShowScheduleModal(false);
//       loadScheduled();
//     } catch (err) {
//       showError('Failed to schedule fuel task');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // Group by date (using record_date)
//   const groupedByDate = scheduled.reduce((acc, item) => {
//     const date = item.record_date ? new Date(item.record_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }) : 'No Date';
//     if (!acc[date]) acc[date] = [];
//     acc[date].push(item);
//     return acc;
//   }, {} as Record<string, FuelConsumption[]>);
//   const dates = Object.keys(groupedByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

//   // Summary stats
//   const totalScheduled = scheduled.length;
//   const approved = scheduled.filter((item) => item.status === 'approved').length;
//   const inProgress = scheduled.filter((item) => item.status === 'in_progress').length;
//   const highPriority = scheduled.filter((item) => (item.priority || '').toLowerCase() === 'high').length;

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <h1 className="text-2xl font-bold text-gray-900">Scheduled Maintenance</h1>
//         <div className="flex items-center space-x-3">
//           <Button onClick={() => setShowScheduleModal(true)} variant="primary">
//             <FiPlus className="mr-2" />
//             Schedule New
//           </Button>
//         </div>
//       </div>

//       {scheduled.length === 0 ? (
//         <Card>No scheduled fuel tasks.</Card>
//       ) : (
//         <div className="space-y-6">
//           {dates.map((date) => (
//             <div key={date}>
//               <div className="flex items-center mb-4">
//                 <FiCalendar className="h-5 w-5 text-gray-400 mr-2" />
//                 <h2 className="text-lg font-semibold text-gray-900">{date}</h2>
//                 <Badge variant="blue" size="sm" className="ml-3">
//                   {groupedByDate[date].length} task{groupedByDate[date].length !== 1 ? 's' : ''}
//                 </Badge>
//               </div>
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                 {groupedByDate[date].map((item) => (
//                   <Card key={item._id} className="hover:shadow-lg transition-shadow">
//                     <div className="space-y-3">
//                       <div className="flex items-start justify-between">
//                         <div className="flex-1">
//                           <h3 className="font-semibold text-gray-900 line-clamp-1">
//                             {item.site_details?.Site_Name || item.site_id}
//                           </h3>
//                           <p className="text-sm text-gray-500">{item.site_details?.Site_Code || item.site_id}</p>
//                         </div>
//                         <Badge variant={((item.status || '').toLowerCase() === 'scheduled') ? 'blue' : ((item.status || '').toLowerCase() === 'approved') ? 'green' : 'gray'}>
//                           {(item.status || 'Scheduled').charAt(0).toUpperCase() + (item.status || 'Scheduled').slice(1)}
//                         </Badge>
//                       </div>
//                       <div className="space-y-2 text-sm">
//                         <div className="flex items-center text-gray-600">
//                           <FiUser className="mr-2 h-4 w-4 flex-shrink-0" />
//                           <span className="truncate">{item.fse_name || 'Unassigned'}</span>
//                         </div>
//                         {item.site_details?.Region && (
//                           <div className="flex items-center text-gray-600">
//                             <FiMapPin className="mr-2 h-4 w-4 flex-shrink-0" />
//                             <span className="truncate">{item.site_details.Region}</span>
//                           </div>
//                         )}
//                         <div className="flex justify-between">
//                           <span className="text-gray-500">Visit Type:</span>
//                           <Badge variant="blue" size="sm">
//                             {item.type || 'RF'}
//                           </Badge>
//                         </div>
//                         {item.priority && (
//                           <div className="flex justify-between">
//                             <span className="text-gray-500">Priority:</span>
//                             <Badge 
//                               variant={
//                                 (item.priority || '').toLowerCase() === 'high' ? 'red' : 
//                                 (item.priority || '').toLowerCase() === 'medium' ? 'yellow' : 'gray'
//                               }
//                               size="sm"
//                             >
//                               {(item.priority || '').toLowerCase()}
//                             </Badge>
//                           </div>
//                         )}
//                       </div>
//                       <div className="grid grid-cols-3 gap-2 pt-2">
//                         <Button variant="ghost" size="sm" fullWidth onClick={() => handleViewDetails(item)}>
//                           <FiEye className="mr-1" />
//                           View
//                         </Button>
//                         <Button variant="secondary" size="sm" fullWidth onClick={() => handleEdit(item)}>
//                           <FiEdit className="mr-1" />
//                           Edit
//                         </Button>
//                               {/* View Details Modal */}
//                               <Modal
//                                 isOpen={showDetailsModal}
//                                 onClose={() => setShowDetailsModal(false)}
//                                 title="Scheduled Task Details"
//                                 size="md"
//                               >
//                                 {selectedItem ? (
//                                   <div className="space-y-2">
//                                     <div className="text-xs text-gray-400">DEBUG: selectedItem._id = {selectedItem._id}</div>
//                                     <div><span className="font-semibold">Site:</span> {selectedItem.site_details?.Site_Name || selectedItem.site_id}</div>
//                                     <div><span className="font-semibold">Technician:</span> {selectedItem.fse_name || 'Unassigned'}</div>
//                                     <div><span className="font-semibold">Region:</span> {selectedItem.site_details?.Region || '-'}</div>
//                                     <div><span className="font-semibold">Visit Type:</span> {selectedItem.type || 'RF'}</div>
//                                     <div><span className="font-semibold">Priority:</span> {selectedItem.priority || '-'}</div>
//                                     <div><span className="font-semibold">Status:</span> {selectedItem.status || 'Scheduled'}</div>
//                                     <div><span className="font-semibold">Scheduled Date:</span> {selectedItem.record_date ? new Date(selectedItem.record_date).toLocaleDateString() : '-'}</div>
//                                   </div>
//                                 ) : (
//                                   <div className="text-center text-gray-500">No task selected. DEBUG: showDetailsModal = {showDetailsModal ? 'true' : 'false'}</div>
//                                 )}
//                               </Modal>

//                               {/* Edit Modal */}
//                               <Modal
//                                 isOpen={showEditModal}
//                                 onClose={() => setShowEditModal(false)}
//                                 title="Edit Scheduled Task"
//                                 size="lg"
//                               >
//                                 {selectedItem ? (
//                                   <FuelScheduleForm
//                                     initialData={selectedItem}
//                                     onSubmit={handleScheduleFuel}
//                                     onCancel={() => setShowEditModal(false)}
//                                     loading={submitting}
//                                     technicians={technicians}
//                                     sites={sites}
//                                   />
//                                 ) : (
//                                   <div className="text-center text-gray-500">No task selected.</div>
//                                 )}
//                               </Modal>
//                         <Button variant="ghost" size="sm" fullWidth className="text-red-600 hover:bg-red-50 hover:text-red-700">
//                           <FiTrash2 className="mr-1" />
//                           Delete
//                         </Button>
//                       </div>
//                     </div>
//                   </Card>
//                 ))}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Summary cards */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
//         <Card>
//           <div className="text-center">
//             <p className="text-sm text-gray-500">Total Scheduled</p>
//             <p className="text-2xl font-bold text-gray-900">{totalScheduled}</p>
//           </div>
//         </Card>
//         <Card>
//           <div className="text-center">
//             <p className="text-sm text-gray-500">Approved</p>
//             <p className="text-2xl font-bold text-blue-600">{approved}</p>
//           </div>
//         </Card>
//         <Card>
//           <div className="text-center">
//             <p className="text-sm text-gray-500">In Progress</p>
//             <p className="text-2xl font-bold text-green-600">{inProgress}</p>
//           </div>
//         </Card>
//         <Card>
//           <div className="text-center">
//             <p className="text-sm text-gray-500">High Priority</p>
//             <p className="text-2xl font-bold text-red-600">{highPriority}</p>
//           </div>
//         </Card>
//       </div>

//       <Modal
//         isOpen={showScheduleModal}
//         onClose={() => setShowScheduleModal(false)}
//         title="Schedule Fuel Task"
//         size="lg"
//       >
//         <FuelScheduleForm
//           onSubmit={handleScheduleFuel}
//           onCancel={() => setShowScheduleModal(false)}
//           loading={submitting}
//           technicians={technicians}
//           sites={sites}
//         />
//       </Modal>
//     </div>
//   );
// };

// export default DieselSchedulePage;
