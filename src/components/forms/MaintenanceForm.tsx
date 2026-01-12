import React, { useState } from 'react';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { Button } from '@/components/common/Button';
import { VISIT_TYPES, PRIORITY_LEVELS } from '@/utils/constants';

interface MaintenanceFormData {
  site_id: string;
  visit_type: string;
  visit_date: string;
  priority: string;
  work_performed: string;
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
    site_id: initialData?.site_id || '',
    visit_type: initialData?.visit_type || 'PM',
    visit_date: initialData?.visit_date || new Date().toISOString().split('T')[0],
    priority: initialData?.priority || 'medium',
    work_performed: initialData?.work_performed || '',
    estimated_duration: initialData?.estimated_duration,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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

    if (!formData.site_id) newErrors.site_id = 'Site ID is required';
    if (!formData.visit_date) newErrors.visit_date = 'Visit date is required';
    if (!formData.work_performed) newErrors.work_performed = 'Work description is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      await onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Site ID"
          value={formData.site_id}
          onChange={(e) => handleChange('site_id', e.target.value)}
          error={errors.site_id}
          required
          fullWidth
        />
        <Input
          label="Visit Date"
          type="date"
          value={formData.visit_date}
          onChange={(e) => handleChange('visit_date', e.target.value)}
          error={errors.visit_date}
          required
          fullWidth
        />
        <Select
          label="Visit Type"
          value={formData.visit_type}
          onChange={(e) => handleChange('visit_type', e.target.value)}
          options={VISIT_TYPES}
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
        label="Work to be Performed"
        value={formData.work_performed}
        onChange={(e) => handleChange('work_performed', e.target.value)}
        error={errors.work_performed}
        rows={6}
        placeholder="Describe the maintenance work that needs to be done..."
        required
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
