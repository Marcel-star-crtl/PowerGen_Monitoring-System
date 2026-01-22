import React, { useState, useEffect } from 'react';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { SearchableSelect, SearchableSelectOption } from '@/components/common/SearchableSelect';
import { Textarea } from '@/components/common/Textarea';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { VISIT_TYPES, PRIORITY_LEVELS } from '@/utils/constants';
import { supervisorAPI } from '@/api';

interface MaintenanceFormData {
  technician: string | string[];
  site_id: string;
  visit_type: string;
  visit_date: string;
  priority: string;
  notes?: string;
  estimated_duration?: number;
}

interface MaintenanceFormProps {
  initialData?: Partial<MaintenanceFormData>;
  onSubmit: (data: MaintenanceFormData) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export const MaintenanceForm: React.FC<MaintenanceFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState<MaintenanceFormData>({
    technician: initialData?.technician || '',
    site_id: initialData?.site_id || '',
    visit_type: initialData?.visit_type || 'PM',
    visit_date: initialData?.visit_date || new Date().toISOString().split('T')[0],
    priority: initialData?.priority || 'medium',
    notes: initialData?.notes || '',
    estimated_duration: initialData?.estimated_duration,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [technicians, setTechnicians] = useState<SearchableSelectOption[]>([]);
  const [sites, setSites] = useState<SearchableSelectOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Load technicians and sites on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [techResponse, sitesResponse] = await Promise.all([
        supervisorAPI.getTechnicians(),
        supervisorAPI.getSites(),
      ]);

      // Format technicians for dropdown
      const techOptions: SearchableSelectOption[] = techResponse.data.map((tech: any) => ({
        value: tech._id,
        label: tech.fullName,
        subtitle: `${tech.email} • ${tech.pending_tasks || 0} active tasks`,
      }));
      setTechnicians(techOptions);

      // Format sites for dropdown
      const siteOptions: SearchableSelectOption[] = sitesResponse.data.map((site: any) => ({
        value: site.IHS_ID_SITE,
        label: `${site.Site_Name || site.IHS_ID_SITE}`,
        subtitle: `${site.Region || 'N/A'} • Last visit: ${
          site.Actual_Date_Visit
            ? new Date(site.Actual_Date_Visit).toLocaleDateString()
            : 'Never'
        }`,
      }));
      setSites(siteOptions);
    } catch (error) {
      console.error('Failed to load form data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (field: keyof MaintenanceFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.technician || (Array.isArray(formData.technician) && formData.technician.length === 0)) {
      newErrors.technician = 'At least one technician is required';
    }
    if (!formData.site_id) newErrors.site_id = 'Site is required';
    if (!formData.visit_date) newErrors.visit_date = 'Scheduled date is required';
    if (!formData.visit_type) newErrors.visit_type = 'Maintenance type is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      // Convert technician array to single value (backend expects single technician)
      const submitData = {
        ...formData,
        technician: Array.isArray(formData.technician) 
          ? formData.technician[0] 
          : formData.technician,
      };
      await onSubmit(submitData);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SearchableSelect
          label="Site / Tower"
          value={formData.site_id}
          onChange={(value) => handleChange('site_id', value)}
          options={sites}
          placeholder="Select a site..."
          searchPlaceholder="Search by site name or ID..."
          error={errors.site_id}
          required
          fullWidth
        />
        
        <SearchableSelect
          label="Assign Technician(s)"
          value={formData.technician}
          onChange={(value) => handleChange('technician', value)}
          options={technicians}
          placeholder="Select technician(s)..."
          searchPlaceholder="Search by name or email..."
          error={errors.technician}
          required
          multiple
          fullWidth
        />

        <Select
          label="Maintenance Type"
          value={formData.visit_type}
          onChange={(e) => handleChange('visit_type', e.target.value)}
          options={VISIT_TYPES}
          required
          fullWidth
        />

        <Input
          label="Scheduled Date"
          type="date"
          value={formData.visit_date}
          onChange={(e) => handleChange('visit_date', e.target.value)}
          error={errors.visit_date}
          required
          fullWidth
        />
        
        <Select
          label="Priority"
          value={formData.priority}
          onChange={(e) => handleChange('priority', e.target.value)}
          options={PRIORITY_LEVELS}
          fullWidth
        />
        
        <Input
          label="Estimated Duration (hours)"
          type="number"
          value={formData.estimated_duration || ''}
          onChange={(e) => handleChange('estimated_duration', parseFloat(e.target.value))}
          fullWidth
        />
      </div>

      <Textarea
        label="Notes / Work Description"
        value={formData.notes || ''}
        onChange={(e) => handleChange('notes', e.target.value)}
        rows={6}
        placeholder="Describe the maintenance work that needs to be done..."
        fullWidth
      />

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <Button type="button" onClick={onCancel} variant="secondary">
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" loading={loading}>
          Schedule Maintenance
        </Button>
      </div>
    </form>
  );
};
