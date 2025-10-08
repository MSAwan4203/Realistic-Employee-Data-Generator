
import React from 'react';
import { LogoIcon } from './Icons';

export const Header: React.FC = () => {
    return (
        <header className="text-center">
            <div className="inline-flex items-center justify-center bg-cyan-900/50 border border-cyan-700 rounded-full p-3 mb-4">
                <LogoIcon />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-sky-300 text-transparent bg-clip-text">
                Realistic Employee Data Generator
            </h1>
            <p className="mt-4 text-lg text-slate-300">
                Generate and download massive, realistic datasets with AI.
            </p>
        </header>
    );
};
