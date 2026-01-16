import React, { useState } from 'react';
import { VisitFormData, FileWithPreview } from '@/types/maintenance.types';
import { ProgressStepper } from './ProgressStepper';
import { Step1Overview } from './Step1Overview';
import { Step2Electrical } from './Step2Electrical';
import { Step3Fuel } from './Step3Fuel';
import { Step4Generators } from './Step4Generators';
import { Step5CombinedStats } from './Step5CombinedStats';
import { Step6PMChecks } from './Step6PMChecks';
import { Step7PowerSystems } from './Step7PowerSystems';
import { Step8Finalize } from './Step8Finalize';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { FiArrowLeft, FiArrowRight, FiSave, FiCheckCircle } from 'react-icons/fi';
import { useNotification } from '@/contexts/NotificationContext';

interface MultiStepVisitFormProps {
    initialData: Partial<VisitFormData>;
    siteDetails: any;
    onSubmit: (data: VisitFormData, photos: FileWithPreview[], submitNow: boolean) => Promise<void>;
    loading?: boolean;
}

export const MultiStepVisitForm: React.FC<MultiStepVisitFormProps> = ({
    initialData,
    siteDetails,
    onSubmit,
    loading = false
}) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<VisitFormData>({
        ...initialData,
        Actual_Date_Visit: initialData.Actual_Date_Visit || new Date().toISOString().split('T')[0],
        Type_of_Visit: initialData.Type_of_Visit || 'PM',
        priority: initialData.priority || 'medium',
        generators_checked: initialData.generators_checked || [
            { generator_number: 1, brand: '', serial_number: '', ch_actuel: 0 },
        ],
        electrical_data: initialData.electrical_data || {},
        fuel_data: initialData.fuel_data || { tank_dimensions: { long: 0, large: 0, hauteur: 0, coeficiant: 0 } },
        pm_checks: initialData.pm_checks || {},
        power_systems: initialData.power_systems || { power_cabinets: [{ cabinet_number: 1 }] },
        combined_stats: initialData.combined_stats || {},
        site_metadata: initialData.site_metadata || {
            cluster: siteDetails?.GRATO_Cluster || '',
            site_priority: siteDetails?.Priority || '',
            state: siteDetails?.Region || '',
            operator: siteDetails?.Operator || '',
            power_topology: siteDetails?.Power_Topology || '',
            outdoor_indoor: siteDetails?.Outdoor_Indoor || 'Outdoor'
        }
    } as VisitFormData);

    const [photos, setPhotos] = useState<FileWithPreview[]>([]);
    const { success } = useNotification();

    const handleUpdateFormData = (updates: Partial<VisitFormData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 8));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleSaveDraft = async () => {
        await onSubmit(formData, photos, false);
        success('Draft saved successfully!');
    };

    const handleSubmit = async () => {
        await onSubmit(formData, photos, true);
    };

    const steps = [
        'Overview',
        'Electrical',
        'Fuel',
        'Generators',
        'Analytics',
        'PM Checks',
        'Systems',
        'Finalize'
    ];

    const renderStep = () => {
        switch (currentStep) {
            case 1: return <Step1Overview data={formData} updateData={handleUpdateFormData} />;
            case 2: return <Step2Electrical data={formData} updateData={handleUpdateFormData} />;
            case 3: return <Step3Fuel data={formData} updateData={handleUpdateFormData} />;
            case 4: return <Step4Generators data={formData} updateData={handleUpdateFormData} />;
            case 5: return <Step5CombinedStats data={formData} updateData={handleUpdateFormData} />;
            case 6: return <Step6PMChecks data={formData} updateData={handleUpdateFormData} />;
            case 7: return <Step7PowerSystems data={formData} updateData={handleUpdateFormData} />;
            case 8: return <Step8Finalize data={formData} updateData={handleUpdateFormData} photos={photos} setPhotos={setPhotos} />;
            default: return null;
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <ProgressStepper steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />

            <Card className="mt-8 p-6">
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">
                        Step {currentStep}: {steps[currentStep - 1]}
                    </h2>
                    {renderStep()}
                </div>

                <div className="flex justify-between items-center pt-6 border-t">
                    <div>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleSaveDraft}
                            disabled={loading}
                            className="text-gray-600 hover:text-blue-600"
                        >
                            <FiSave className="mr-2" />
                            Save Draft
                        </Button>
                    </div>

                    <div className="flex space-x-4">
                        {currentStep > 1 && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={prevStep}
                                disabled={loading}
                            >
                                <FiArrowLeft className="mr-2" />
                                Previous
                            </Button>
                        )}

                        {currentStep < 8 ? (
                            <Button
                                type="button"
                                variant="primary"
                                onClick={nextStep}
                                disabled={loading}
                            >
                                Next Step
                                <FiArrowRight className="ml-2" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="primary"
                                onClick={handleSubmit}
                                loading={loading}
                                className="bg-green-600 hover:bg-green-700 border-green-600"
                            >
                                <FiCheckCircle className="mr-2" />
                                Submit Visit Report
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};
