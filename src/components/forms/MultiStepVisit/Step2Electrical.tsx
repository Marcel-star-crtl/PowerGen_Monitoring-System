import React from 'react';
import { VisitFormData } from '@/types/maintenance.types';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { ENEO_STATUS, PHASE_TYPES } from '@/utils/constants';

interface StepProps {
    data: VisitFormData;
    updateData: (updates: Partial<VisitFormData>) => void;
}

export const Step2Electrical: React.FC<StepProps> = ({ data, updateData }) => {
    const updateElectrical = (field: string, value: any) => {
        updateData({
            electrical_data: { ...data.electrical_data, [field]: value }
        });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="text-md font-semibold text-blue-700">Grid & ENEO</h3>
                    <Select
                        label="ENEO Working"
                        value={data.electrical_data?.eneo_working || 'yes'}
                        onChange={(e) => updateElectrical('eneo_working', e.target.value)}
                        options={ENEO_STATUS}
                        fullWidth
                    />
                    <Input
                        label="Earthing (OHM)"
                        type="number"
                        step="0.01"
                        value={data.electrical_data?.earthing_ohm || ''}
                        onChange={(e) => updateElectrical('earthing_ohm', parseFloat(e.target.value))}
                        fullWidth
                    />
                    <Select
                        label="Phase Type"
                        value={data.electrical_data?.phase_type || 'three'}
                        onChange={(e) => updateElectrical('phase_type', e.target.value)}
                        options={PHASE_TYPES}
                        fullWidth
                    />
                </div>

                <div className="space-y-4">
                    <h3 className="text-md font-semibold text-blue-700">Meter Readings</h3>
                    <Input
                        label="ENEO Meter Number"
                        value={data.electrical_data?.eneo_meter_number || ''}
                        onChange={(e) => updateElectrical('eneo_meter_number', e.target.value)}
                        fullWidth
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Actual Index"
                            type="number"
                            value={data.electrical_data?.actual_index || ''}
                            onChange={(e) => updateElectrical('actual_index', parseFloat(e.target.value))}
                            fullWidth
                        />
                        <Input
                            label="Previous Index"
                            type="number"
                            value={data.electrical_data?.previous_index || ''}
                            onChange={(e) => updateElectrical('previous_index', parseFloat(e.target.value))}
                            fullWidth
                        />
                    </div>
                    <Input
                        label="Consumed KWA"
                        type="number"
                        value={data.electrical_data?.consumed_kwa || ''}
                        onChange={(e) => updateElectrical('consumed_kwa', parseFloat(e.target.value))}
                        fullWidth
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                    label="N-PH1 Voltage"
                    type="number"
                    value={data.electrical_data?.n_ph1_voltage || ''}
                    onChange={(e) => updateElectrical('n_ph1_voltage', parseFloat(e.target.value))}
                    fullWidth
                />
                <Input
                    label="N-PH2 Voltage"
                    type="number"
                    value={data.electrical_data?.n_ph2_voltage || ''}
                    onChange={(e) => updateElectrical('n_ph2_voltage', parseFloat(e.target.value))}
                    fullWidth
                />
                <Input
                    label="N-PH3 Voltage"
                    type="number"
                    value={data.electrical_data?.n_ph3_voltage || ''}
                    onChange={(e) => updateElectrical('n_ph3_voltage', parseFloat(e.target.value))}
                    fullWidth
                />
            </div>

            <div>
                <Input
                    label="ENEO SQ CHECK"
                    value={data.electrical_data?.eneo_sq_check || ''}
                    onChange={(e) => updateElectrical('eneo_sq_check', e.target.value)}
                    placeholder="e.g. OK, PROB"
                    fullWidth
                />
                <div className="mt-4">
                    <Textarea
                        label="Comments on Grid"
                        value={data.electrical_data?.comments_on_grid || ''}
                        onChange={(e) => updateElectrical('comments_on_grid', e.target.value)}
                        rows={2}
                        fullWidth
                    />
                </div>
            </div>
        </div>
    );
};
