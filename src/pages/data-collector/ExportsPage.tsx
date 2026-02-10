import React, { useState } from 'react';
import { dataCollectorAPI } from '@/api';
import { useNotification } from '@/contexts/NotificationContext';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { FiDownload, FiFileText } from 'react-icons/fi';
import { Input } from '@/components/common/Input';

const ExportsPage: React.FC = () => {
  const [exporting, setExporting] = useState(false);
  const [dataType, setDataType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { success, error: showError } = useNotification();

  const handleExport = async () => {
    setExporting(true);
    try {
      await dataCollectorAPI.exportAllData(dataType as any, startDate, endDate);
      success('Export downloaded successfully!');
    } catch (err) {
      showError('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const exportOptions = [
    {
      value: 'all',
      label: 'All Data',
      description: 'Export all sites, technicians, and maintenance records',
      icon: <FiFileText className="h-8 w-8 text-blue-500" />,
    },
    {
      value: 'sites',
      label: 'Sites Only',
      description: 'Export site information with details',
      icon: <FiFileText className="h-8 w-8 text-green-500" />,
    },
    {
      value: 'technicians',
      label: 'Technicians Only',
      description: 'Export technician profiles and assignments',
      icon: <FiFileText className="h-8 w-8 text-purple-500" />,
    },
    {
      value: 'maintenance',
      label: 'Maintenance Records',
      description: 'Export maintenance history and status',
      icon: <FiFileText className="h-8 w-8 text-orange-500" />,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Data Exports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exportOptions.map((option) => (
            <div
            key={option.value}
            onClick={() => setDataType(option.value)}
            className="cursor-pointer"
            >
            <Card
                className={`transition-all ${
                dataType === option.value
                    ? 'ring-2 ring-primary-500 bg-primary-50'
                    : 'hover:shadow-lg'
                }`}
            >
                <div className="flex items-start space-x-4">
                <div>{option.icon}</div>
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{option.label}</h3>
                    <p className="text-sm text-gray-600">{option.description}</p>
                </div>
                {dataType === option.value && (
                    <div className="flex-shrink-0">
                    <div className="h-6 w-6 bg-primary-500 rounded-full flex items-center justify-center">
                        <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                        />
                        </svg>
                    </div>
                    </div>
                )}
                </div>
            </Card>
            </div>
        ))}
      </div>

      <Card>
        <div className="flex flex-col md:flex-row items-end justify-between gap-4">
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Start Date (Optional)</label>
                 <Input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                 />
            </div>
            <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
                 <Input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                 />
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <h3 className="font-semibold text-gray-900 mb-2 sr-only">Export Action</h3>
            <Button
                onClick={handleExport}
                loading={exporting}
                variant="primary"
                size="lg"
                className="whitespace-nowrap"
            >
                <FiDownload className="mr-2" />
                {exporting ? 'Exporting...' : 'Export to Excel'}
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-4">
            Data will be exported as an Excel (.xlsx) file with multiple sheets. Date range applies to Maintenance and Visit records.
        </p>
      </Card>

      <Card>
        <h3 className="font-semibold text-gray-900 mb-4">Export Information</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5 text-blue-500 mt-0.5">•</div>
            <p className="ml-2">
              <strong>All Data:</strong> Includes sites, technicians, and maintenance records in separate sheets
            </p>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5 text-blue-500 mt-0.5">•</div>
            <p className="ml-2">
              <strong>Sites:</strong> Site ID, name, region, cluster, coordinates, and assignments
            </p>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5 text-blue-500 mt-0.5">•</div>
            <p className="ml-2">
              <strong>Technicians:</strong> Full profiles, contact info, and site assignments
            </p>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5 text-blue-500 mt-0.5">•</div>
            <p className="ml-2">
              <strong>Maintenance:</strong> Complete maintenance history with status and details
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ExportsPage;