import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dataCollectorAPI } from '@/api';
import { useNotification } from '@/contexts/NotificationContext';
import { Button } from '@/components/common/Button';
import { ReportDetailView } from '@/components/common/ReportDetailView';
import { FiArrowLeft } from 'react-icons/fi';

const MaintenanceDetailPage: React.FC = () => {
  const { maintenanceId } = useParams<{ maintenanceId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { error: showError } = useNotification();

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const response = await dataCollectorAPI.getSubmittedMaintenance();
      const data = response.data || response || [];
      const foundReport = data.find((m: any) => m._id === maintenanceId);
      if (foundReport) {
        setReport(foundReport);
      } else {
        showError('Report not found');
        navigate('/data-collector/maintenance');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      showError('Failed to load report');
    } finally {
      setLoading(false);
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
          <Button onClick={() => navigate('/data-collector/maintenance')}>
            Back to Maintenance Records
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
                onClick={() => navigate('/data-collector/maintenance')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Maintenance Report</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {report.site_details?.Site_Name || report.site_name} • {report.visit_type} • {report._id}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Navigator */}
        <div className="bg-gray-50 border-b border-gray-200 sticky top-[72px] z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-3 overflow-x-auto">
              <button onClick={() => scrollToSection('overview')} className="px-3 py-1 rounded-full bg-white text-sm font-medium shadow">Overview</button>
              {report?.equipment_checks?.generator && <button onClick={() => scrollToSection('generator')} className="px-3 py-1 rounded-full bg-white text-sm font-medium shadow">Generator</button>}
              {report?.equipment_checks?.power_cabinet && <button onClick={() => scrollToSection('power-cabinet')} className="px-3 py-1 rounded-full bg-white text-sm font-medium shadow">Power Cabinet</button>}
              {report?.equipment_checks?.grid && <button onClick={() => scrollToSection('grid')} className="px-3 py-1 rounded-full bg-white text-sm font-medium shadow">Grid</button>}
              {report?.equipment_checks?.shelter && <button onClick={() => scrollToSection('shelter')} className="px-3 py-1 rounded-full bg-white text-sm font-medium shadow">Shelter</button>}
              {report?.equipment_checks?.cleaning && <button onClick={() => scrollToSection('cleaning')} className="px-3 py-1 rounded-full bg-white text-sm font-medium shadow">Cleaning</button>}
              {report?.equipment_checks?.fuel_tank && <button onClick={() => scrollToSection('fuel-tank')} className="px-3 py-1 rounded-full bg-white text-sm font-medium shadow">Fuel Tank</button>}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Report Details */}
        <ReportDetailView report={report} />
      </div>
    </div>
  );
};

export default MaintenanceDetailPage;
