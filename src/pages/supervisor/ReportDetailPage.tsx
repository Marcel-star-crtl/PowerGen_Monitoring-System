import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supervisorAPI } from '@/api/endpoints/supervisor';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/common/Textarea';
import { ReportDetailView } from '@/components/common/ReportDetailView';
import { FiArrowLeft, FiCheck, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const ReportDetailPage: React.FC = () => {
  const { maintenanceId } = useParams<{ maintenanceId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchReport();
  }, [maintenanceId]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await supervisorAPI.getPendingMaintenance();
      const foundReport = response.data.find((m: any) => m._id === maintenanceId);
      if (foundReport) {
        setReport(foundReport);
      } else {
        toast.error('Report not found');
        navigate('/supervisor/approvals');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!report) return;
    
    try {
      setActionLoading(true);
      await supervisorAPI.approveMaintenance(report._id, comments);
      toast.success('Report approved successfully');
      navigate('/supervisor/approvals');
    } catch (error) {
      console.error('Error approving report:', error);
      toast.error('Failed to approve report');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!report) return;
    

    try {
      setActionLoading(true);
      await supervisorAPI.rejectMaintenance(report._id, rejectionReason);
      toast.success('Report rejected');
      navigate('/supervisor/approvals');
    } catch (error) {
      console.error('Error rejecting report:', error);
      toast.error('Failed to reject report');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Not Found</h2>
          <Button onClick={() => navigate('/supervisor/approvals')}>
            Back to Approvals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/supervisor/approvals')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Maintenance Report</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {report.site_details?.Site_Name || report.site_name} • {report.visit_type} • {report.maintenance_id}

        {/* Section Navigator */}
        <div className="bg-gray-50 border-b border-gray-200 sticky top-[72px] z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-3 overflow-x-auto">
              <button onClick={() => scrollToSection('overview')} className="px-3 py-1 rounded-full bg-white text-sm font-medium shadow">Overview</button>
              {report?.equipment_checks?.generator_checks && <button onClick={() => scrollToSection('generator')} className="px-3 py-1 rounded-full bg-white text-sm font-medium shadow">Generator</button>}
              {report?.equipment_checks?.power_cabinet_checks && <button onClick={() => scrollToSection('power-cabinet')} className="px-3 py-1 rounded-full bg-white text-sm font-medium shadow">Power Cabinet</button>}
              {report?.equipment_checks?.grid_checks && <button onClick={() => scrollToSection('grid')} className="px-3 py-1 rounded-full bg-white text-sm font-medium shadow">Grid</button>}
              {report?.equipment_checks?.shelter_checks && <button onClick={() => scrollToSection('shelter')} className="px-3 py-1 rounded-full bg-white text-sm font-medium shadow">Shelter</button>}
              {report?.equipment_checks?.cleaning_checks && <button onClick={() => scrollToSection('cleaning')} className="px-3 py-1 rounded-full bg-white text-sm font-medium shadow">Cleaning</button>}
              {report?.equipment_checks?.fuel_tank_checks && <button onClick={() => scrollToSection('fuel-tank')} className="px-3 py-1 rounded-full bg-white text-sm font-medium shadow">Fuel Tank</button>}
            </div>
          </div>
        </div>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            {!showApproveForm && !showRejectForm && (
              <div className="flex space-x-3">
                <Button
                  variant="danger"
                  onClick={() => setShowRejectForm(true)}
                >
                  <FiX className="mr-2" />
                  Reject
                </Button>
                <Button
                  variant="success"
                  onClick={() => setShowApproveForm(true)}
                >
                  <FiCheck className="mr-2" />
                  Approve
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Approval Form */}
        {showApproveForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Approve Report</h3>
            <Textarea
              label="Comments (optional)"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add approval comments..."
              rows={4}
              fullWidth
            />
            <div className="flex justify-end space-x-3 mt-4">
              <Button
                variant="secondary"
                onClick={() => setShowApproveForm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                onClick={handleApprove}
                loading={actionLoading}
              >
                <FiCheck className="mr-2" />
                Confirm Approval
              </Button>
            </div>
          </div>
        )}

        {/* Rejection Form */}
        {showRejectForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Report</h3>
            <Textarea
              label="Rejection Reason (optional)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this report is being rejected (optional)..."
              rows={4}
              fullWidth
            />
            <div className="flex justify-end space-x-3 mt-4">
              <Button
                variant="secondary"
                onClick={() => setShowRejectForm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                loading={actionLoading}
              >
                <FiX className="mr-2" />
                Confirm Rejection
              </Button>
            </div>
          </div>
        )}

        {/* Report Details */}
        <ReportDetailView report={report} />
      </div>
    </div>
  );
};

export default ReportDetailPage;
