import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';

interface FuelScheduleFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
  initialData?: any;
  technicians?: any[];
  sites?: any[];
}

const priorities = [
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
];

export const FuelScheduleForm: React.FC<FuelScheduleFormProps> = ({
  onSubmit,
  onCancel,
  loading,
  initialData = {},
  technicians = [],
  sites = [],
}) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      site_id: '',
      technician: '',
      scheduled_datetime: '', // Use combined datetime
      priority: '',
      estimated_duration: '',
      notes: '',
      ...initialData,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Site */}
        <Controller
          name="site_id"
          control={control}
          rules={{ required: 'Site is required' }}
          render={({ field }) => (
            <Select
              label="Site"
              {...field}
              options={[
                { value: '', label: 'Select Site' },
                ...sites.map((s: any) => ({
                  value: s._id || s.site_id,
                  label: s.Site_Name || s.site_name || s._id,
                })),
              ]}
              error={errors.site_id?.message as string}
              fullWidth
            />
          )}
        />

        {/* Technician */}
        <Controller
          name="technician"
          control={control}
          rules={{ required: 'Technician is required' }}
          render={({ field }) => (
            <Select
              label="Technician"
              {...field}
              options={[
                { value: '', label: 'Select Technician' },
                ...technicians.map((t: any) => ({
                  value: t._id,
                  label: t.fullName || t.name,
                })),
              ]}
              error={errors.technician?.message as string}
              fullWidth
            />
          )}
        />

        {/* Maintenance Type (static, no registration needed) */}
        <Select
          label="Maintenance Type"
          value="RF"
          options={[{ value: 'RF', label: 'Refueling' }]}
          disabled
          fullWidth
        />

        {/* Scheduled Date */}
        <Controller
          name="scheduled_datetime"
          control={control}
          rules={{ required: 'Date & time required' }}
          render={({ field }) => (
            <Input
              label="Scheduled Date & Time"
              type="datetime-local"
              {...field}
              error={errors.scheduled_datetime?.message as string}
              fullWidth
            />
          )}
        />

        {/* Priority */}
        <Controller
          name="priority"
          control={control}
          rules={{ required: 'Priority is required' }}
          render={({ field }) => (
            <Select
              label="Priority"
              {...field}
              options={[{ value: '', label: 'Select Priority' }, ...priorities]}
              error={errors.priority?.message as string}
              fullWidth
            />
          )}
        />

        {/* Estimated Duration */}
        <Input
          label="Estimated Duration (hours)"
          type="number"
          {...register('estimated_duration')}
          fullWidth
        />
      </div>

      {/* Notes */}
      <Input
        label="Notes"
        {...register('notes')}
        fullWidth
      />

      <div className="flex justify-end space-x-3">
        <Button onClick={onCancel} variant="secondary" type="button">
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading}>
          Schedule Refueling
        </Button>
      </div>
    </form>
  );
};