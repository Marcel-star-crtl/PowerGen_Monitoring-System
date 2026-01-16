import React from 'react';
import { FiCheck } from 'react-icons/fi';

interface ProgressStepperProps {
    steps: string[];
    currentStep: number;
    onStepClick: (step: number) => void;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({ steps, currentStep, onStepClick }) => {
    return (
        <div className="w-full py-4">
            <div className="flex items-center justify-between">
                {steps.map((label, index) => {
                    const stepNumber = index + 1;
                    const isCompleted = currentStep > stepNumber;
                    const isActive = currentStep === stepNumber;

                    return (
                        <React.Fragment key={label}>
                            <div
                                className="flex flex-col items-center relative cursor-pointer group"
                                onClick={() => onStepClick(stepNumber)}
                            >
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 
                    ${isCompleted ? 'bg-blue-600 border-blue-600 text-white' :
                                            isActive ? 'bg-white border-blue-600 text-blue-600 ring-4 ring-blue-50' :
                                                'bg-white border-gray-300 text-gray-400 group-hover:border-gray-400'}`}
                                >
                                    {isCompleted ? <FiCheck className="w-6 h-6" /> : <span>{stepNumber}</span>}
                                </div>
                                <span
                                    className={`mt-2 text-xs font-medium text-center absolute -bottom-8 w-24 
                    ${isActive ? 'text-blue-600 font-bold' : 'text-gray-500'}`}
                                >
                                    {label}
                                </span>
                            </div>

                            {index < steps.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-2 transition-colors duration-500 ${isCompleted ? 'bg-blue-600' : 'bg-gray-200'}`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
            <div className="h-8" /> {/* Spacer for labels */}
        </div>
    );
};
