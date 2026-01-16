import React, { useEffect } from 'react';
import { VisitFormData } from '@/types/maintenance.types';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';

interface StepProps {
    data: VisitFormData;
    updateData: (updates: Partial<VisitFormData>) => void;
}

export const Step5CombinedStats: React.FC<StepProps> = ({ data, updateData }) => {
    const stats = data.combined_stats || {};

    const updateStats = (field: string, value: any) => {
        updateData({
            combined_stats: { ...stats, [field]: value }
        });
    };

    // Auto-calculate Total Run Hour if possible
    useEffect(() => {
        if (data.generators_checked) {
            const total = data.generators_checked.reduce((sum, gen) => sum + (gen.run_hours || 0), 0);
            if (total !== stats.total_run_hour) {
                updateStats('total_run_hour', total);
            }
        }
    }, [data.generators_checked]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="text-md font-semibold text-blue-700">Production Metrics</h3>
                    <Input
                        label="Total Run Hour"
                        type="number"
                        value={stats.total_run_hour || ''}
                        onChange={(e) => updateStats('total_run_hour', parseFloat(e.target.value))}
                        fullWidth
                        helperText="Auto-summed from generators"
                    />
                    <Input
                        label="CCPH"
                        type="number"
                        step="0.001"
                        value={stats.ccph || ''}
                        onChange={(e) => updateStats('ccph', parseFloat(e.target.value))}
                        fullWidth
                    />
                    <Input
                        label="CL"
                        type="number"
                        value={stats.cl || ''}
                        onChange={(e) => updateStats('cl', parseFloat(e.target.value))}
                        fullWidth
                    />
                    <Input
                        label="Pertes"
                        type="number"
                        value={stats.pertes || ''}
                        onChange={(e) => updateStats('pertes', parseFloat(e.target.value))}
                        fullWidth
                    />
                </div>

                <div className="space-y-4">
                    <h3 className="text-md font-semibold text-blue-700">Grid vs Gen</h3>
                    <Input
                        label="Grid Gen %"
                        type="number"
                        value={stats.grid_gen_percent || ''}
                        onChange={(e) => updateStats('grid_gen_percent', parseFloat(e.target.value))}
                        fullWidth
                    />
                    <Textarea
                        label="Reason for Grid Gen %"
                        value={stats.reason_grid_gen_percent || ''}
                        onChange={(e) => updateStats('reason_grid_gen_percent', e.target.value)}
                        rows={2}
                        fullWidth
                    />
                    <Input
                        label="DG vs Hours Status"
                        value={stats.dg_vs_hours || ''}
                        onChange={(e) => updateStats('dg_vs_hours', e.target.value)}
                        fullWidth
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <Input
                    label="Automatization Status"
                    value={stats.automatization_status || ''}
                    onChange={(e) => updateStats('automatization_status', e.target.value)}
                    placeholder="e.g. ATS Working"
                    fullWidth
                />
                <Input
                    label="CH Next Vidange"
                    type="number"
                    value={stats.ch_next_vidange || ''}
                    onChange={(e) => updateStats('ch_next_vidange', parseFloat(e.target.value))}
                    fullWidth
                />
            </div>
        </div>
    );
};
