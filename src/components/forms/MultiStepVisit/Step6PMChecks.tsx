import React from 'react';
import { VisitFormData } from '@/types/maintenance.types';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';

interface StepProps {
    data: VisitFormData;
    updateData: (updates: Partial<VisitFormData>) => void;
}

export const Step6PMChecks: React.FC<StepProps> = ({ data, updateData }) => {
    const pm = data.pm_checks || {};

    const updatePM = (field: string, value: any) => {
        updateData({
            pm_checks: { ...pm, [field]: value }
        });
    };

    const statusOptions = [
        { value: 'OK', label: 'OK' },
        { value: 'CHANGED', label: 'Changed' },
        { value: 'BAD', label: 'Bad/Needs Attention' },
        { value: 'N/A', label: 'N/A' },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="text-md font-semibold text-blue-700">Filters & Parts</h3>
                    <Select
                        label="Belt Status"
                        value={pm.belt || 'OK'}
                        onChange={(e) => updatePM('belt', e.target.value)}
                        options={statusOptions}
                        fullWidth
                    />
                    <Select
                        label="Oil Filter"
                        value={pm.oil_filter || 'OK'}
                        onChange={(e) => updatePM('oil_filter', e.target.value)}
                        options={statusOptions}
                        fullWidth
                    />
                    <Select
                        label="Fuel Filter"
                        value={pm.fuel_filter || 'OK'}
                        onChange={(e) => updatePM('fuel_filter', e.target.value)}
                        options={statusOptions}
                        fullWidth
                    />
                    <Select
                        label="Separ Filter"
                        value={pm.separ_filter || 'OK'}
                        onChange={(e) => updatePM('separ_filter', e.target.value)}
                        options={statusOptions}
                        fullWidth
                    />
                    <Select
                        label="Air Filter"
                        value={pm.air_filter || 'OK'}
                        onChange={(e) => updatePM('air_filter', e.target.value)}
                        options={statusOptions}
                        fullWidth
                    />
                </div>

                <div className="space-y-4">
                    <h3 className="text-md font-semibold text-blue-700">Fluids</h3>
                    <Input
                        label="Qty Oil Changed (L)"
                        type="number"
                        value={pm.qty_oil_changed || ''}
                        onChange={(e) => updatePM('qty_oil_changed', parseFloat(e.target.value))}
                        fullWidth
                    />
                    <Input
                        label="Qty Radiator Water Added (L)"
                        type="number"
                        value={pm.qty_radiator_water || ''}
                        onChange={(e) => updatePM('qty_radiator_water', parseFloat(e.target.value))}
                        fullWidth
                    />
                    <Select
                        label="Dirty Oil Handled"
                        value={pm.dirty_oil || 'OK'}
                        onChange={(e) => updatePM('dirty_oil', e.target.value)}
                        options={[
                            { value: 'REMOVED', label: 'Removed from Site' },
                            { value: 'STORED', label: 'Stored on Site' },
                            { value: 'N/A', label: 'N/A' }
                        ]}
                        fullWidth
                    />
                </div>
            </div>
        </div>
    );
};
