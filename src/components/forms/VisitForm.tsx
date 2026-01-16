import React, { useState } from 'react';
import { intelligenceAPI } from '@/api/endpoints/intelligence';
import { FiZap } from 'react-icons/fi';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { Button } from '@/components/common/Button';
import { FileUpload } from '@/components/common/FileUpload';
import { validateVisitForm } from '@/utils/validators';
import { VISIT_TYPES, PRIORITY_LEVELS, ENEO_STATUS, PHASE_TYPES } from '@/utils/constants';
import { VisitFormData } from '@/types/maintenance.types';

interface FileWithPreview extends File {
  preview?: string;
  category?: string;
  description?: string;
}

interface VisitFormProps {
  initialData?: Partial<VisitFormData>;
  onSubmit: (data: VisitFormData, photos: FileWithPreview[], submitNow: boolean) => Promise<void>;
  loading?: boolean;
}

export const VisitForm: React.FC<VisitFormProps> = ({ initialData, onSubmit, loading = false }) => {
  const [formData, setFormData] = useState<VisitFormData>({
    Actual_Date_Visit: initialData?.Actual_Date_Visit || new Date().toISOString().split('T')[0],
    Type_of_Visit: initialData?.Type_of_Visit || 'PM',
    technician_id: initialData?.technician_id || '',
    technician_name: initialData?.technician_name || '',
    priority: initialData?.priority || 'medium',
    electrical_data: {
      earthing_ohm: initialData?.electrical_data?.earthing_ohm,
      eneo_working: initialData?.electrical_data?.eneo_working,
      phase_type: initialData?.electrical_data?.phase_type,
      n_ph1_voltage: initialData?.electrical_data?.n_ph1_voltage,
      n_ph2_voltage: initialData?.electrical_data?.n_ph2_voltage,
      n_ph3_voltage: initialData?.electrical_data?.n_ph3_voltage,
      eneo_meter_number: initialData?.electrical_data?.eneo_meter_number,
      actual_index: initialData?.electrical_data?.actual_index,
      previous_index: initialData?.electrical_data?.previous_index,
      consumed_kwa: initialData?.electrical_data?.consumed_kwa,
    },
    fuel_data: {
      qte_trouvee: initialData?.fuel_data?.qte_trouvee,
      qte_ajoutee: initialData?.fuel_data?.qte_ajoutee,
      tank_capacity: initialData?.fuel_data?.tank_capacity,
    },
    Visit_Comments: initialData?.Visit_Comments || '',
  });

  const [photos, setPhotos] = useState<FileWithPreview[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [enhancing, setEnhancing] = useState(false);

  const handleChange = (field: keyof VisitFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleNestedChange = (category: keyof VisitFormData, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [field]: value,
      },
    }));
  };

  const handleEnhanceNotes = async () => {
    if (!formData.Visit_Comments?.trim()) return;

    setEnhancing(true);
    try {
      const response = await intelligenceAPI.enhanceReport(formData.Visit_Comments);
      const enhancedText = typeof response.data === 'string' ? response.data : response.data?.data;
      if (enhancedText) {
        handleChange('Visit_Comments', enhancedText);
      }
    } catch (error) {
      console.error('Enhancement failed:', error);
    } finally {
      setEnhancing(false);
    }
  };

  const handleSubmit = async (submitNow: boolean) => {
    const validation = validateVisitForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    await onSubmit(formData, photos, submitNow);
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Visit Date"
            type="date"
            value={formData.Actual_Date_Visit}
            onChange={(e) => handleChange('Actual_Date_Visit', e.target.value)}
            error={errors.Actual_Date_Visit}
            required
            fullWidth
          />
          <Select
            label="Visit Type"
            value={formData.Type_of_Visit}
            onChange={(e) => handleChange('Type_of_Visit', (e.target.value as any))}
            options={VISIT_TYPES}
            required
            fullWidth
          />
          <Select
            label="Priority"
            value={formData.priority || 'medium'}
            onChange={(e) => handleChange('priority', (e.target.value as any))}
            options={PRIORITY_LEVELS}
            fullWidth
          />
        </div>
      </div>

      {/* Electrical Data */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Electrical Data</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Earthing (Ohms)"
            type="number"
            step="0.1"
            value={formData.electrical_data?.earthing_ohm || ''}
            onChange={(e) => handleNestedChange('electrical_data', 'earthing_ohm', parseFloat(e.target.value))}
            error={errors.Earthing_OHM}
            fullWidth
          />
          <Select
            label="ENEO Working"
            value={formData.electrical_data?.eneo_working || 'yes'}
            onChange={(e) => handleNestedChange('electrical_data', 'eneo_working', e.target.value)}
            options={ENEO_STATUS}
            fullWidth
          />
          <Select
            label="Phase Type"
            value={formData.electrical_data?.phase_type || 'three'}
            onChange={(e) => handleNestedChange('electrical_data', 'phase_type', e.target.value)}
            options={PHASE_TYPES}
            fullWidth
          />
          <Input
            label="ENEO Meter Number"
            type="text"
            value={formData.electrical_data?.eneo_meter_number || ''}
            onChange={(e) => handleNestedChange('electrical_data', 'eneo_meter_number', e.target.value)}
            fullWidth
          />
          <Input
            label="N-PH1 Voltage"
            type="number"
            value={formData.electrical_data?.n_ph1_voltage || ''}
            onChange={(e) => handleNestedChange('electrical_data', 'n_ph1_voltage', parseFloat(e.target.value))}
            fullWidth
          />
          <Input
            label="N-PH2 Voltage"
            type="number"
            value={formData.electrical_data?.n_ph2_voltage || ''}
            onChange={(e) => handleNestedChange('electrical_data', 'n_ph2_voltage', parseFloat(e.target.value))}
            fullWidth
          />
        </div>
      </div>

      {/* Fuel Data */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Fuel Data</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Fuel Found (L)"
            type="number"
            value={formData.fuel_data?.qte_trouvee || ''}
            onChange={(e) => handleNestedChange('fuel_data', 'qte_trouvee', parseFloat(e.target.value))}
            error={errors.Fuel_Quantity_Found}
            fullWidth
          />
          <Input
            label="Fuel Added (L)"
            type="number"
            value={formData.fuel_data?.qte_ajoutee || ''}
            onChange={(e) => handleNestedChange('fuel_data', 'qte_ajoutee', parseFloat(e.target.value))}
            fullWidth
          />
          <Input
            label="Tank Capacity (L)"
            type="number"
            value={formData.fuel_data?.tank_capacity || ''}
            onChange={(e) => handleNestedChange('fuel_data', 'tank_capacity', parseFloat(e.target.value))}
            fullWidth
          />
        </div>
      </div>

      {/* Comments */}
      <div className="relative">
        <div className="flex justify-between items-end mb-2">
          <label className="text-sm font-medium text-gray-700">Visit Comments</label>
          <Button
            type="button"
            onClick={handleEnhanceNotes}
            variant="ghost"
            size="sm"
            disabled={enhancing || !formData.Visit_Comments}
            className="text-blue-600 hover:text-blue-700"
          >
            <FiZap className={`mr-1 ${enhancing ? 'animate-pulse' : ''}`} />
            {enhancing ? 'Enhancing...' : 'Enhance with AI'}
          </Button>
        </div>
        <Textarea
          value={formData.Visit_Comments || ''}
          onChange={(e) => handleChange('Visit_Comments', e.target.value)}
          rows={4}
          placeholder="Describe the work performed, any issues found, etc."
          fullWidth
        />

        {/* Photos */}
        <FileUpload
          label="Upload Photos"
          files={photos}
          onFilesChange={setPhotos}
          maxFiles={10}
          maxSizeMB={5}
          multiple
        />

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button onClick={() => handleSubmit(false)} variant="secondary" loading={loading}>
            Save as Draft
          </Button>
          <Button onClick={() => handleSubmit(true)} variant="primary" loading={loading}>
            Submit for Approval
          </Button>
        </div>
      </div>
    </div>
  );
};