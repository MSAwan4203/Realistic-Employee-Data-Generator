
import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Employee, DataSchema } from './types';
import { getEmployeeDataSchema } from './services/geminiService';
import { Header } from './components/Header';
import { Button } from './components/Button';
import { ProgressBar } from './components/ProgressBar';
import { DownloadIcon, SparklesIcon } from './components/Icons';

declare const XLSX: any;

const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [statusMessage, setStatusMessage] = useState<string>('Ready to generate data.');
    const [generatedData, setGeneratedData] = useState<Employee[] | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const workerRef = useRef<Worker | null>(null);

    const handleGenerateData = useCallback(async () => {
        setIsLoading(true);
        // Keep previous data for a moment so download button doesn't disappear
        // setGeneratedData(null); 
        setErrorMessage(null);
        setProgress(0);
        setStatusMessage('Asking AI to design a realistic data schema...');

        try {
            const schema = await getEmployeeDataSchema();
            setStatusMessage('AI schema received. Starting data generation...');

            const workerScript = `
                // Polyfill for crypto.randomUUID in non-secure contexts (workers)
                self.crypto.randomUUID = self.crypto.randomUUID || function() {
                    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
                        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
                    );
                };

                const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
                
                const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

                const generateRandomDate = (start, end) => {
                    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
                };
                
                self.onmessage = (event) => {
                    const { schema, totalRecords } = event.data;
                    const employees = [];
                    const managerIds = [];

                    for (let i = 1; i <= totalRecords; i++) {
                        const departmentInfo = pickRandom(schema.departments);
                        const department = departmentInfo.name;
                        const jobTitle = pickRandom(departmentInfo.jobTitles);
                        const location = pickRandom(schema.officeLocations);
                        const gender = pickRandom(['Male', 'Female', 'Non-binary', 'Prefer not to say']);
                        const ethnicity = pickRandom(schema.ethnicities);

                        const firstName = gender === 'Male' ? pickRandom(schema.maleNames) : pickRandom(schema.femaleNames);
                        const lastName = pickRandom(schema.lastNames);

                        const hireDate = generateRandomDate(new Date(2000, 0, 1), new Date());
                        const birthDate = generateRandomDate(new Date(1960, 0, 1), new Date(hireDate.getFullYear() - 18, 11, 31));

                        const baseSalary = getRandomInt(departmentInfo.salaryRange[0], departmentInfo.salaryRange[1]);
                        const bonus = Math.round(baseSalary * getRandomInt(5, 20) / 100);

                        const employee = {
                            employeeId: self.crypto.randomUUID(),
                            firstName,
                            lastName,
                            email: \`\${firstName.toLowerCase()}.\${lastName.toLowerCase()}\${i}@examplecorp.com\`,
                            phoneNumber: \`\${getRandomInt(200, 999)}-\${getRandomInt(100, 999)}-\${getRandomInt(1000, 9999)}\`,
                            hireDate: hireDate.toISOString().split('T')[0],
                            jobTitle,
                            department,
                            managerId: null, // To be filled later
                            officeLocation: location.city,
                            salary: baseSalary,
                            bonus,
                            performanceRating: getRandomInt(1, 5),
                            lastReviewDate: generateRandomDate(new Date(hireDate.getTime() + 30 * 24 * 60 * 60 * 1000), new Date()).toISOString().split('T')[0],
                            emergencyContactName: \`\${pickRandom(schema.maleNames)} \${lastName}\`,
                            emergencyContactPhone: \`\${getRandomInt(200, 999)}-\${getRandomInt(100, 999)}-\${getRandomInt(1000, 9999)}\`,
                            address: \`\${getRandomInt(100, 9999)} \${pickRandom(schema.streetNames)} St\`,
                            city: location.city,
                            state: location.state,
                            zipCode: location.zipCode,
                            country: 'USA',
                            dateOfBirth: birthDate.toISOString().split('T')[0],
                            gender,
                            ethnicity,
                        };
                        employees.push(employee);
                        managerIds.push(employee.employeeId);
                        
                        if (i % 1000 === 0) {
                            self.postMessage({ type: 'progress', progress: (i / totalRecords) * 100, message: \`Generated \${i} records...\` });
                        }
                    }

                    // Assign managers
                    employees.forEach(emp => {
                        const potentialManagers = managerIds.filter(id => id !== emp.employeeId);
                        emp.managerId = pickRandom(potentialManagers);
                    });

                    self.postMessage({ type: 'done', data: employees, message: 'Data generation complete.' });
                };
            `;
            const blob = new Blob([workerScript], { type: 'application/javascript' });
            workerRef.current = new Worker(URL.createObjectURL(blob));

            workerRef.current.onmessage = (event) => {
                const { type, progress, data, message } = event.data;
                if (type === 'progress') {
                    setProgress(progress);
                    setStatusMessage(message);
                } else if (type === 'done') {
                    setGeneratedData(data);
                    setStatusMessage(message);
                    setProgress(100);
                    setIsLoading(false);
                    if(workerRef.current) {
                        workerRef.current.terminate();
                        workerRef.current = null;
                    }
                }
            };
            
            workerRef.current.onerror = (error) => {
                console.error('Worker error:', error);
                setErrorMessage('An error occurred during data generation.');
                setIsLoading(false);
                 if(workerRef.current) {
                    workerRef.current.terminate();
                    workerRef.current = null;
                }
            };

            workerRef.current.postMessage({ schema, totalRecords: 100000 });

        } catch (error) {
            console.error(error);
            setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred.');
            setIsLoading(false);
        }
    }, []);
    
    useEffect(() => {
        // Cleanup worker on component unmount
        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
            }
        };
    }, []);

    const handleDownloadExcel = () => {
        if (!generatedData) return;

        setStatusMessage('Preparing Excel file for download...');
        setTimeout(() => {
            try {
                const worksheet = XLSX.utils.json_to_sheet(generatedData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
                XLSX.writeFile(workbook, 'employee_data.xlsx');
                setStatusMessage('Download complete.');
            } catch (error) {
                console.error('Excel generation error:', error);
                setErrorMessage('Failed to generate Excel file.');
            }
        }, 100); // Small timeout to allow UI to update
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-4xl mx-auto">
                <Header />
                <main className="mt-8 p-6 sm:p-8 bg-slate-800 rounded-2xl shadow-2xl shadow-cyan-500/10 border border-slate-700">
                    <div className="text-center">
                        <p className="text-slate-400 max-w-2xl mx-auto">
                            Click the button below to use Gemini AI to create a realistic data structure for a large company.
                            Our system will then generate 100,000 unique employee records based on this structure.
                        </p>
                    </div>

                    <div className="mt-8 flex flex-col items-center space-y-6">
                        <div className="w-full max-w-lg">
                            {isLoading && <ProgressBar progress={progress} />}
                        </div>

                        <div className="h-6 text-center text-cyan-400 font-mono text-sm">
                            {statusMessage}
                        </div>

                        {errorMessage && (
                            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">
                                <p><strong>Error:</strong> {errorMessage}</p>
                            </div>
                        )}

                        <div className="flex space-x-4">
                            <Button onClick={handleGenerateData} disabled={isLoading}>
                                <SparklesIcon />
                                {isLoading
                                    ? 'Generating...'
                                    : generatedData
                                    ? 'Generate Again'
                                    : 'Generate Employee Data'}
                            </Button>
                            <Button
                                onClick={handleDownloadExcel}
                                variant="secondary"
                                disabled={!generatedData || isLoading}
                            >
                                <DownloadIcon />
                                Download Excel
                            </Button>
                        </div>
                    </div>
                </main>

                <footer className="text-center mt-8 text-slate-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} Realistic Employee Data Generator. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
};

export default App;
