import React from 'react';
import { VisitFormData, GeneratorDetail } from '@/types/maintenance.types';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { GEN_BRANDS } from '@/utils/constants';

interface StepProps {
    data: VisitFormData;
    updateData: (updates: Partial<VisitFormData>) => void;
}

export const Step4Generators: React.FC<StepProps> = ({ data, updateData }) => {
    const generators = data.generators_checked || [
        { generator_number: 1, brand: '', serial_number: '', ch_actuel: 0 }
    ];

    const updateGenerator = (index: number, updates: Partial<GeneratorDetail>) => {
        const newGenerators = [...generators];
        newGenerators[index] = { ...newGenerators[index], ...updates };
        updateData({ generators_checked: newGenerators });
    };

    const addGenerator = () => {
        updateData({
            generators_checked: [
                ...generators,
                { generator_number: generators.length + 1, brand: '', serial_number: '', ch_actuel: 0 }
            ]
        });
    };

    const removeGenerator = (index: number) => {
        if (generators.length <= 1) return;
        const newGenerators = generators.filter((_, i) => i !== index);
        updateData({ generators_checked: newGenerators });
    };

    return (
        <div className="space-y-8">
            {generators.map((gen, index) => (
                <div key={index} className="border rounded-lg p-6 bg-gray-50 relative">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-blue-800">Generator #{gen.generator_number}</h3>
                        {generators.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeGenerator(index)}
                                className="text-red-500 hover:text-red-700 text-sm font-medium"
                            >
                                Remove
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select
                            label="Brand"
                            value={gen.brand}
                            onChange={(e) => updateGenerator(index, { brand: e.target.value })}
                            options={GEN_BRANDS}
                            fullWidth
                        />
                        <Input
                            label="Engine Brand"
                            value={gen.engine_brand || ''}
                            onChange={(e) => updateGenerator(index, { engine_brand: e.target.value })}
                            fullWidth
                        />
                        <Input
                            label="Serial Number"
                            value={gen.serial_number}
                            onChange={(e) => updateGenerator(index, { serial_number: e.target.value })}
                            fullWidth
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <Input
                            label="KVA"
                            type="number"
                            value={gen.kva || ''}
                            onChange={(e) => updateGenerator(index, { kva: parseFloat(e.target.value) })}
                            fullWidth
                        />
                        <Input
                            label="Maintenance Cycle"
                            value={gen.maintenance_cycle || ''}
                            onChange={(e) => updateGenerator(index, { maintenance_cycle: e.target.value })}
                            placeholder="e.g. 250"
                            fullWidth
                        />
                        <Input
                            label="DG Age"
                            value={gen.dg_age || ''}
                            onChange={(e) => updateGenerator(index, { dg_age: e.target.value })}
                            fullWidth
                        />
                    </div>

                    <div className="mt-6 border-t pt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Running Hours</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Input
                                label="CH Actuel"
                                type="number"
                                value={gen.ch_actuel || ''}
                                onChange={(e) => updateGenerator(index, { ch_actuel: parseFloat(e.target.value) })}
                                fullWidth
                            />
                            <Input
                                label="CH Ancien"
                                type="number"
                                value={gen.ch_ancien || ''}
                                onChange={(e) => updateGenerator(index, { ch_ancien: parseFloat(e.target.value) })}
                                fullWidth
                            />
                            <Input
                                label="Run Hours"
                                type="number"
                                value={gen.run_hours || ''}
                                onChange={(e) => updateGenerator(index, { run_hours: parseFloat(e.target.value) })}
                                fullWidth
                            />
                            <Input
                                label="CPH"
                                type="number"
                                step="0.001"
                                value={gen.cph || ''}
                                onChange={(e) => updateGenerator(index, { cph: parseFloat(e.target.value) })}
                                fullWidth
                            />
                        </div>
                    </div>

                    <div className="mt-6 border-t pt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Loads</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Input
                                label="Load 1PH"
                                type="number"
                                value={gen.load_1ph || ''}
                                onChange={(e) => updateGenerator(index, { load_1ph: parseFloat(e.target.value) })}
                                fullWidth
                            />
                            <Input
                                label="Load 2PH"
                                type="number"
                                value={gen.load_2ph || ''}
                                onChange={(e) => updateGenerator(index, { load_2ph: parseFloat(e.target.value) })}
                                fullWidth
                            />
                            <Input
                                label="Load 3PH"
                                type="number"
                                value={gen.load_3ph || ''}
                                onChange={(e) => updateGenerator(index, { load_3ph: parseFloat(e.target.value) })}
                                fullWidth
                            />
                            <Input
                                label="DC Load"
                                type="number"
                                value={gen.dc_load || ''}
                                onChange={(e) => updateGenerator(index, { dc_load: parseFloat(e.target.value) })}
                                fullWidth
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <Textarea
                            label="CPH Comments"
                            value={gen.comments_cph || ''}
                            onChange={(e) => updateGenerator(index, { comments_cph: e.target.value })}
                            rows={2}
                            fullWidth
                        />
                    </div>
                </div>
            ))}

            {generators.length < 3 && (
                <button
                    type="button"
                    onClick={addGenerator}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
                >
                    + Add Another Generator
                </button>
            )}
        </div>
    );
};
