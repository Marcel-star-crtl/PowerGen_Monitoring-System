import React from 'react';
import { VisitFormData, PowerCabinet } from '@/types/maintenance.types';
import { Input } from '@/components/common/Input';

interface StepProps {
    data: VisitFormData;
    updateData: (updates: Partial<VisitFormData>) => void;
}

export const Step7PowerSystems: React.FC<StepProps> = ({ data, updateData }) => {
    const systems = data.power_systems || { power_cabinets: [{ cabinet_number: 1 }] };
    const cabinets = systems.power_cabinets || [{ cabinet_number: 1 }];

    const updateCabinet = (index: number, updates: Partial<PowerCabinet>) => {
        const newCabinets = [...cabinets];
        newCabinets[index] = { ...newCabinets[index], ...updates };
        updateData({
            power_systems: { ...systems, power_cabinets: newCabinets }
        });
    };

    const addCabinet = () => {
        updateData({
            power_systems: {
                ...systems,
                power_cabinets: [
                    ...cabinets,
                    { cabinet_number: cabinets.length + 1 }
                ]
            }
        });
    };

    return (
        <div className="space-y-8">
            {cabinets.map((cab, index) => (
                <div key={index} className="border rounded-lg p-6 bg-blue-50/30">
                    <h3 className="text-md font-bold text-blue-800 mb-4">Power Cabinet #{cab.cabinet_number}</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                            label="Cabinet Type"
                            value={cab.type || ''}
                            onChange={(e) => updateCabinet(index, { type: e.target.value })}
                            placeholder="e.g. ELTEK, HUAWEI"
                            fullWidth
                        />
                        <Input
                            label="Rectifier Type"
                            value={cab.rectifier_type || ''}
                            onChange={(e) => updateCabinet(index, { rectifier_type: e.target.value })}
                            fullWidth
                        />
                        <Input
                            label="Num Rectifiers"
                            type="number"
                            value={cab.num_rectifiers || ''}
                            onChange={(e) => updateCabinet(index, { num_rectifiers: parseInt(e.target.value) })}
                            fullWidth
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <Input
                            label="Capacity per Rectifier"
                            type="number"
                            value={cab.capacity_per_rectifier || ''}
                            onChange={(e) => updateCabinet(index, { capacity_per_rectifier: parseFloat(e.target.value) })}
                            fullWidth
                        />
                        <Input
                            label="Num Batteries"
                            type="number"
                            value={cab.num_batteries || ''}
                            onChange={(e) => updateCabinet(index, { num_batteries: parseInt(e.target.value) })}
                            fullWidth
                        />
                        <Input
                            label="Battery Capacity"
                            value={cab.battery_capacity || ''}
                            onChange={(e) => updateCabinet(index, { battery_capacity: e.target.value })}
                            placeholder="e.g. 200AH"
                            fullWidth
                        />
                    </div>

                    <div className="mt-4">
                        <Input
                            label="Battery Autonomy (min/hrs)"
                            type="number"
                            value={cab.battery_autonomy || ''}
                            onChange={(e) => updateCabinet(index, { battery_autonomy: parseFloat(e.target.value) })}
                            fullWidth
                        />
                    </div>
                </div>
            ))}

            <button
                type="button"
                onClick={addCabinet}
                className="w-full py-2 border-2 border-dashed border-blue-200 rounded-lg text-blue-400 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
                + Add Another Cabinet
            </button>

            <div className="pt-6 border-t mt-6">
                <Input
                    label="Battery Threshold for DG Start (V)"
                    type="number"
                    step="0.1"
                    value={systems.battery_threshold_dg_start || ''}
                    onChange={(e) => updateData({
                        power_systems: { ...systems, battery_threshold_dg_start: parseFloat(e.target.value) }
                    })}
                    fullWidth
                />
            </div>
        </div>
    );
};
