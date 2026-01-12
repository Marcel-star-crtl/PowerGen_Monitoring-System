import React, { useState, useEffect } from 'react';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { FUEL_URGENCY } from '@/utils/constants';
import { useFuel } from '@/hooks/useFuel';

interface FuelRequestFormData {
  site_id: string;
  fuel_requested: number;
  request_reason: string;
  request_urgency: string;
  current_fuel_level?: number;
  tank_capacity?: number;
}

interface FuelRequestFormProps {
  initialData?: Partial<FuelRequestFormData>;
  onSubmit: (data: FuelRequestFormData) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  showSiteSelector?: boolean;
}

export const FuelRequestForm: React.FC<FuelRequestFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  showSiteSelector = true,
}) => {
  const [formData, setFormData] = useState<FuelRequestFormData>({
    site_id: initialData?.site_id || '',
    fuel_requested: initialData?.fuel_requested || 0,
    request_reason: initialData?.request_reason || '',
    request_urgency: initialData?.request_urgency || 'medium',
    current_fuel_level: initialData?.current_fuel_level,
    tank_capacity: initialData?.tank_capacity,
  });

  const [sites, setSites] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { getSites, loading: loadingSites } = useFuel();

  useEffect(() => {
    if (showSiteSelector) {
      loadSites();
    }
  }, [showSiteSelector]);

  const loadSites = async () => {
    try {
      const result = await getSites();
      setSites(result.data || []);
    } catch (error) {
      console.error('Failed to load sites:', error);
    }
  };

  const handleChange = (field: keyof FuelRequestFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSiteChange = (siteId: string) => {
    const selectedSite = sites.find(s => s.IHS_ID_SITE === siteId);
    if (selectedSite) {
      setFormData((prev) => ({
        ...prev,
        site_id: siteId,
        current_fuel_level: selectedSite.current_fuel_level,
        tank_capacity: selectedSite.tank_capacity,
      }));
    } else {
      handleChange('site_id', siteId);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.site_id) newErrors.site_id = 'Site ID is required';
    if (!formData.fuel_requested || formData.fuel_requested <= 0) {
      newErrors.fuel_requested = 'Valid fuel quantity is required';
    }
    if (!formData.request_reason) newErrors.request_reason = 'Reason is required';

    if (formData.tank_capacity && formData.fuel_requested > formData.tank_capacity) {
      newErrors.fuel_requested = 'Requested fuel exceeds tank capacity';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      await onSubmit(formData);
    }
  };

  const fuelPercentage =
    formData.current_fuel_level && formData.tank_capacity
      ? (formData.current_fuel_level / formData.tank_capacity) * 100
      : 0;

  const siteOptions = sites.map(site => ({
    value: site.IHS_ID_SITE,
    label: `${site.Site_Name || site.IHS_ID_SITE} (${site.Region || 'N/A'})`,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {showSiteSelector ? (
        loadingSites ? (
          <div className="flex items-center justify-center p-4">
            <Spinner size="sm" />
            <span className="ml-2 text-sm text-gray-600">Loading sites...</span>
          </div>
        ) : (
          <Select
            label="Select Site"
            value={formData.site_id}
            onChange={(e) => handleSiteChange(e.target.value)}
            options={siteOptions}
            error={errors.site_id}
            required
            fullWidth
          />
        )
      ) : (
        <Input
          label="Site ID"
          value={formData.site_id}
          onChange={(e) => handleChange('site_id', e.target.value)}
          error={errors.site_id}
          required
          fullWidth
          disabled
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Current Fuel Level (L)"
          type="number"
          value={formData.current_fuel_level || ''}
          onChange={(e) => handleChange('current_fuel_level', parseFloat(e.target.value))}
          fullWidth
        />
        <Input
          label="Tank Capacity (L)"
          type="number"
          value={formData.tank_capacity || ''}
          onChange={(e) => handleChange('tank_capacity', parseFloat(e.target.value))}
          fullWidth
        />
      </div>

      {fuelPercentage > 0 && (
        <div>
          <p className="text-sm text-gray-600 mb-2">Current Fuel Level: {fuelPercentage.toFixed(1)}%</p>
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                fuelPercentage < 10
                  ? 'bg-red-500'
                  : fuelPercentage < 25
                  ? 'bg-orange-500'
                  : fuelPercentage < 50
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${fuelPercentage}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Fuel Requested (L)"
          type="number"
          value={formData.fuel_requested}
          onChange={(e) => handleChange('fuel_requested', parseFloat(e.target.value))}
          error={errors.fuel_requested}
          required
          fullWidth
        />
        <Select
          label="Urgency"
          value={formData.request_urgency}
          onChange={(e) => handleChange('request_urgency', e.target.value)}
          options={FUEL_URGENCY}
          required
          fullWidth
        />
      </div>

      <Textarea
        label="Request Reason"
        value={formData.request_reason}
        onChange={(e) => handleChange('request_reason', e.target.value)}
        error={errors.request_reason}
        rows={4}
        placeholder="Explain why fuel is needed..."
        required
        fullWidth
      />

      {formData.tank_capacity && formData.fuel_requested > 0 && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-medium">After refueling:</span>{' '}
            {((((formData.current_fuel_level || 0) + formData.fuel_requested) / formData.tank_capacity) * 100).toFixed(1)}% 
            ({(formData.current_fuel_level || 0) + formData.fuel_requested}L / {formData.tank_capacity}L)
          </p>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <Button type="button" onClick={onCancel} variant="secondary" disabled={loading}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" loading={loading}>
          Submit Fuel Request
        </Button>
      </div>
    </form>
  );
};



