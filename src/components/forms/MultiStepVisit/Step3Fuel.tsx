import React from 'react';
import { VisitFormData } from '@/types/maintenance.types';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { TANK_TYPES } from '@/utils/constants';

interface StepProps {
    data: VisitFormData;
    updateData: (updates: Partial<VisitFormData>) => void;
}

export const Step3Fuel: React.FC<StepProps> = ({ data, updateData }) => {
    const updateFuel = (field: string, value: any) => {
        updateData({
            fuel_data: { ...data.fuel_data, [field]: value }
        });
    };

    const updateDimensions = (field: string, value: number) => {
        updateData({
            fuel_data: {
                ...data.fuel_data,
                tank_dimensions: { ...data.fuel_data?.tank_dimensions, [field]: value }
            }
        });
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                    <h3 className="text-md font-semibold text-blue-700">Cards & Pricing</h3>
                    <Input
                        label="Fuel Card Number"
                        value={data.fuel_data?.fuel_card_number || ''}
                        onChange={(e) => updateFuel('fuel_card_number', e.target.value)}
                        fullWidth
                    />
                    <Input
                        label="TOM Card Debit (L)"
                        type="number"
                        value={data.fuel_data?.tom_card_debit || ''}
                        onChange={(e) => updateFuel('tom_card_debit', parseFloat(e.target.value))}
                        fullWidth
                    />
                    <Input
                        label="Price per Liter"
                        type="number"
                        value={data.fuel_data?.price_per_liter || ''}
                        onChange={(e) => updateFuel('price_per_liter', parseFloat(e.target.value))}
                        fullWidth
                    />
                </div>

                <div className="space-y-4">
                    <h3 className="text-md font-semibold text-blue-700">Tank Information</h3>
                    <Select
                        label="Type of Tank"
                        value={data.fuel_data?.tank_type || 'EXT'}
                        onChange={(e) => updateFuel('tank_type', e.target.value)}
                        options={TANK_TYPES}
                        fullWidth
                    />
                    <Input
                        label="Tank Capacity 1 (L)"
                        type="number"
                        value={data.fuel_data?.tank_capacity || ''}
                        onChange={(e) => updateFuel('tank_capacity', parseFloat(e.target.value))}
                        fullWidth
                    />
                    <Input
                        label="Fond de cuve"
                        type="number"
                        value={data.fuel_data?.fond_de_cuve || ''}
                        onChange={(e) => updateFuel('fond_de_cuve', parseFloat(e.target.value))}
                        fullWidth
                    />
                </div>

                <div className="space-y-4">
                    <h3 className="text-md font-semibold text-blue-700">Dimensions (cm)</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            label="Long"
                            type="number"
                            value={data.fuel_data?.tank_dimensions?.long || ''}
                            onChange={(e) => updateDimensions('long', parseFloat(e.target.value))}
                            fullWidth
                        />
                        <Input
                            label="Large"
                            type="number"
                            value={data.fuel_data?.tank_dimensions?.large || ''}
                            onChange={(e) => updateDimensions('large', parseFloat(e.target.value))}
                            fullWidth
                        />
                        <Input
                            label="Hauteur"
                            type="number"
                            value={data.fuel_data?.tank_dimensions?.hauteur || ''}
                            onChange={(e) => updateDimensions('hauteur', parseFloat(e.target.value))}
                            fullWidth
                        />
                        <Input
                            label="Coefficient"
                            type="number"
                            step="0.001"
                            value={data.fuel_data?.tank_dimensions?.coeficiant || ''}
                            onChange={(e) => updateDimensions('coeficiant', parseFloat(e.target.value))}
                            fullWidth
                        />
                    </div>
                </div>
            </div>

            <div className="border-t pt-6">
                <h3 className="text-md font-semibold text-blue-700 mb-4">Fuel Levels & Quantities</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input
                        label="QTE Precedente"
                        type="number"
                        value={data.fuel_data?.qte_precedente || ''}
                        onChange={(e) => updateFuel('qte_precedente', parseFloat(e.target.value))}
                        fullWidth
                    />
                    <Input
                        label="Hauteur Gasoil Found (cm)"
                        type="number"
                        value={data.fuel_data?.hauteur_gasoil_trouvee_cm || ''}
                        onChange={(e) => updateFuel('hauteur_gasoil_trouvee_cm', parseFloat(e.target.value))}
                        fullWidth
                    />
                    <Input
                        label="QTE Found (L)"
                        type="number"
                        value={data.fuel_data?.qte_trouvee || ''}
                        onChange={(e) => updateFuel('qte_trouvee', parseFloat(e.target.value))}
                        fullWidth
                    />
                    <Input
                        label="QTE T CMS"
                        type="number"
                        value={data.fuel_data?.qte_t_cms || ''}
                        onChange={(e) => updateFuel('qte_t_cms', parseFloat(e.target.value))}
                        fullWidth
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                    <Input
                        label="QTE Added (L)"
                        type="number"
                        value={data.fuel_data?.qte_ajoutee || ''}
                        onChange={(e) => updateFuel('qte_ajoutee', parseFloat(e.target.value))}
                        fullWidth
                    />
                    <Input
                        label="QTE Left (L)"
                        type="number"
                        value={data.fuel_data?.qte_laissee || ''}
                        onChange={(e) => updateFuel('qte_laissee', parseFloat(e.target.value))}
                        fullWidth
                    />
                    <Input
                        label="QTE L CMS"
                        type="number"
                        value={data.fuel_data?.qte_l_cms || ''}
                        onChange={(e) => updateFuel('qte_l_cms', parseFloat(e.target.value))}
                        fullWidth
                    />
                    <Input
                        label="QTE Consumed"
                        type="number"
                        value={data.fuel_data?.qte_consommee || ''}
                        onChange={(e) => updateFuel('qte_consommee', parseFloat(e.target.value))}
                        fullWidth
                    />
                </div>
                <div className="mt-4">
                    <Input
                        label="FUEL SQ CHECK"
                        value={data.fuel_data?.fuel_sq_check || ''}
                        onChange={(e) => updateFuel('fuel_sq_check', e.target.value)}
                        fullWidth
                    />
                </div>
            </div>
        </div>
    );
};
