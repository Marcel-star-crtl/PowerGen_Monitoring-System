import React from 'react';
import { VisitFormData } from '@/types/maintenance.types';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { VISIT_TYPES, PRIORITY_LEVELS, TOPOLOGY_OPTIONS, OUTDOOR_INDOOR_OPTIONS } from '@/utils/constants';

interface StepProps {
    data: VisitFormData;
    updateData: (updates: Partial<VisitFormData>) => void;
}

export const Step1Overview: React.FC<StepProps> = ({ data, updateData }) => {
    const updateSiteMeta = (field: string, value: string) => {
        updateData({
            site_metadata: { ...data.site_metadata, [field]: value }
        });
    };

    const updateProcess = (field: string, value: string) => {
        updateData({
            process_tracking: { ...data.process_tracking, [field]: value }
        });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <h3 className="text-md font-semibold text-blue-700">Visit Info</h3>
                <Input
                    label="Actual Visit Date"
                    type="date"
                    value={data.Actual_Date_Visit}
                    onChange={(e) => updateData({ Actual_Date_Visit: e.target.value })}
                    required
                    fullWidth
                />
                <Select
                    label="Type of Visit"
                    value={data.Type_of_Visit}
                    onChange={(e) => updateData({ Type_of_Visit: e.target.value as any })}
                    options={VISIT_TYPES}
                    required
                    fullWidth
                />
                <Select
                    label="Priority"
                    value={data.priority || 'medium'}
                    onChange={(e) => updateData({ priority: e.target.value as any })}
                    options={PRIORITY_LEVELS}
                    fullWidth
                />
                <Input
                    label="SBC"
                    value={data.sbc || ''}
                    onChange={(e) => updateData({ sbc: e.target.value })}
                    placeholder="e.g. GRATO"
                    fullWidth
                />
            </div>

            <div className="space-y-4">
                <h3 className="text-md font-semibold text-blue-700">Site Metadata</h3>
                <Select
                    label="Power Topology"
                    value={data.site_metadata?.power_topology || ''}
                    onChange={(e) => updateSiteMeta('power_topology', e.target.value)}
                    options={TOPOLOGY_OPTIONS}
                    fullWidth
                />
                <Select
                    label="Outdoor / Indoor"
                    value={data.site_metadata?.outdoor_indoor || 'Outdoor'}
                    onChange={(e) => updateSiteMeta('outdoor_indoor', e.target.value)}
                    options={OUTDOOR_INDOOR_OPTIONS}
                    fullWidth
                />
                <Input
                    label="Site Priority"
                    value={data.site_metadata?.site_priority || ''}
                    onChange={(e) => updateSiteMeta('site_priority', e.target.value)}
                    placeholder="e.g. P1, P2"
                    fullWidth
                />
            </div>

            <div className="col-span-1 md:col-span-2 mt-4">
                <h3 className="text-md font-semibold text-blue-700 mb-4">Process Tracking</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                        label="Process Ongoing #"
                        value={data.process_tracking?.ongoing_process_num || ''}
                        onChange={(e) => updateProcess('ongoing_process_num', e.target.value)}
                        fullWidth
                    />
                    <Input
                        label="Process PM/END #"
                        value={data.process_tracking?.pm_end_process_num || ''}
                        onChange={(e) => updateProcess('pm_end_process_num', e.target.value)}
                        fullWidth
                    />
                    <Input
                        label="Process RF #"
                        value={data.process_tracking?.rf_process_num || ''}
                        onChange={(e) => updateProcess('rf_process_num', e.target.value)}
                        fullWidth
                    />
                </div>
            </div>
        </div>
    );
};
