
import React from 'react';

interface ProgressBarProps {
    progress: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
    const progressPercentage = Math.min(Math.max(progress, 0), 100).toFixed(2);

    return (
        <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden border border-slate-600">
            <div
                className="bg-gradient-to-r from-sky-500 to-cyan-500 h-full rounded-full transition-all duration-300 ease-out flex items-center justify-end"
                style={{ width: `${progressPercentage}%` }}
            >
                <span className="text-xs font-bold text-cyan-900 pr-2">{progressPercentage}%</span>
            </div>
        </div>
    );
};
