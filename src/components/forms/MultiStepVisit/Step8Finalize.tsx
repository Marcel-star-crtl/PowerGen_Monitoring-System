import React, { useState } from 'react';
import { VisitFormData, FileWithPreview } from '@/types/maintenance.types';
import { Textarea } from '@/components/common/Textarea';
import { Input } from '@/components/common/Input';
import { FileUpload } from '@/components/common/FileUpload';
import { Button } from '@/components/common/Button';
import { FiZap } from 'react-icons/fi';
import { intelligenceAPI } from '@/api/endpoints/intelligence';

interface StepProps {
    data: VisitFormData;
    updateData: (updates: Partial<VisitFormData>) => void;
    photos: FileWithPreview[];
    setPhotos: (photos: FileWithPreview[]) => void;
}

export const Step8Finalize: React.FC<StepProps> = ({ data, updateData, photos, setPhotos }) => {
    const [enhancing, setEnhancing] = useState(false);
    const issues = data.issues_found || {};

    const updateIssues = (field: string, value: any) => {
        updateData({
            issues_found: { ...issues, [field]: value }
        });
    };

    const handleEnhanceNotes = async () => {
        if (!data.Visit_Comments?.trim()) return;

        setEnhancing(true);
        try {
            const response = await intelligenceAPI.enhanceReport(data.Visit_Comments);
            const enhancedText = typeof response.data === 'string' ? response.data : response.data?.data;
            if (enhancedText) {
                updateData({ Visit_Comments: enhancedText });
            }
        } catch (error) {
            console.error('Enhancement failed:', error);
        } finally {
            setEnhancing(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-md font-semibold text-blue-700 mb-4">Issues Found & Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Textarea
                        label="DG Issues"
                        value={issues.DG_Issues || ''}
                        onChange={(e) => updateIssues('DG_Issues', e.target.value)}
                        fullWidth
                    />
                    <Textarea
                        label="Solar Issues"
                        value={issues.Issue_of_Solar || ''}
                        onChange={(e) => updateIssues('Issue_of_Solar', e.target.value)}
                        fullWidth
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <Textarea
                        label="Parts Replaced"
                        value={issues.Parts_Replaced || ''}
                        onChange={(e) => updateIssues('Parts_Replaced', e.target.value)}
                        fullWidth
                    />
                    <Input
                        label="Corrective Action Date"
                        type="date"
                        value={issues.Issues_Corrective_Date ? new Date(issues.Issues_Corrective_Date).toISOString().split('T')[0] : ''}
                        onChange={(e) => updateIssues('Issues_Corrective_Date', e.target.value)}
                        fullWidth
                    />
                </div>
            </div>

            <div className="relative border-t pt-6">
                <div className="flex justify-between items-end mb-2">
                    <label className="text-sm font-medium text-gray-700">General Visit Comments</label>
                    <Button
                        type="button"
                        onClick={handleEnhanceNotes}
                        variant="ghost"
                        size="sm"
                        disabled={enhancing || !data.Visit_Comments}
                        className="text-blue-600 hover:text-blue-700"
                    >
                        <FiZap className={`mr-1 ${enhancing ? 'animate-pulse' : ''}`} />
                        {enhancing ? 'Enhancing...' : 'Enhance with AI'}
                    </Button>
                </div>
                <Textarea
                    value={data.Visit_Comments || ''}
                    onChange={(e) => updateData({ Visit_Comments: e.target.value })}
                    rows={4}
                    placeholder="Describe the overall work performed, any general observations, etc."
                    fullWidth
                />
            </div>

            <div className="border-t pt-6">
                <h3 className="text-md font-semibold text-blue-700 mb-4">Photos</h3>
                <FileUpload
                    label="Upload Site Photos"
                    files={photos}
                    onFilesChange={setPhotos}
                    maxFiles={15}
                    maxSizeMB={5}
                    multiple
                />
                <p className="text-xs text-gray-500 mt-2">
                    Tip: Upload photos of the generator (G1/G2), fuel tank, meter, and any issues found.
                </p>
            </div>
        </div>
    );
};
