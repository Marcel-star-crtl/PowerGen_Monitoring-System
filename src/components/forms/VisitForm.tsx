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
    Earthing_OHM: initialData?.Earthing_OHM,
    ENEO_Working: initialData?.ENEO_Working,
    Phase_Type: initialData?.Phase_Type,
    N_PH1_Voltage: initialData?.N_PH1_Voltage,
    N_PH2_Voltage: initialData?.N_PH2_Voltage,
    N_PH3_Voltage: initialData?.N_PH3_Voltage,
    ENEO_Meter_Number: initialData?.ENEO_Meter_Number,
    Actual_Index: initialData?.Actual_Index,
    Previous_Index: initialData?.Previous_Index,
    Consumed_KWA: initialData?.Consumed_KWA,
    Previous_Fuel_Quantity: initialData?.Previous_Fuel_Quantity,
    Fuel_Quantity_Found: initialData?.Fuel_Quantity_Found,
    Fuel_Quantity_Added: initialData?.Fuel_Quantity_Added,
    Tank_Capacity_1: initialData?.Tank_Capacity_1,
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
            onChange={(e) => handleChange('Type_of_Visit', e.target.value)}
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
            value={formData.Earthing_OHM || ''}
            onChange={(e) => handleChange('Earthing_OHM', parseFloat(e.target.value))}
            error={errors.Earthing_OHM}
            fullWidth
          />
          <Select
            label="ENEO Working"
            value={formData.ENEO_Working || 'yes'}
            onChange={(e) => handleChange('ENEO_Working', e.target.value)}
            options={ENEO_STATUS}
            fullWidth
          />
          <Select
            label="Phase Type"
            value={formData.Phase_Type || 'three'}
            onChange={(e) => handleChange('Phase_Type', e.target.value)}
            options={PHASE_TYPES}
            fullWidth
          />
          <Input
            label="ENEO Meter Number"
            type="text"
            value={formData.ENEO_Meter_Number || ''}
            onChange={(e) => handleChange('ENEO_Meter_Number', e.target.value)}
            fullWidth
          />
          <Input
            label="N-PH1 Voltage"
            type="number"
            value={formData.N_PH1_Voltage || ''}
            onChange={(e) => handleChange('N_PH1_Voltage', parseFloat(e.target.value))}
            fullWidth
          />
          <Input
            label="N-PH2 Voltage"
            type="number"
            value={formData.N_PH2_Voltage || ''}
            onChange={(e) => handleChange('N_PH2_Voltage', parseFloat(e.target.value))}
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
            value={formData.Fuel_Quantity_Found || ''}
            onChange={(e) => handleChange('Fuel_Quantity_Found', parseFloat(e.target.value))}
            error={errors.Fuel_Quantity_Found}
            fullWidth
          />
          <Input
            label="Fuel Added (L)"
            type="number"
            value={formData.Fuel_Quantity_Added || ''}
            onChange={(e) => handleChange('Fuel_Quantity_Added', parseFloat(e.target.value))}
            fullWidth
          />
          <Input
            label="Tank Capacity (L)"
            type="number"
            value={formData.Tank_Capacity_1 || ''}
            onChange={(e) => handleChange('Tank_Capacity_1', parseFloat(e.target.value))}
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