
export interface Employee {
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    hireDate: string;
    jobTitle: string;
    department: string;
    managerId: string | null;
    officeLocation: string;
    salary: number;
    bonus: number;
    performanceRating: number;
    lastReviewDate: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    dateOfBirth: string;
    gender: string;
    ethnicity: string;
}

export interface Department {
    name: string;
    jobTitles: string[];
    salaryRange: [number, number];
}

export interface OfficeLocation {
    city: string;
    state: string;
    zipCode: string;
}

export interface DataSchema {
    departments: Department[];
    officeLocations: OfficeLocation[];
    maleNames: string[];
    femaleNames: string[];
    lastNames: string[];
    streetNames: string[];
    ethnicities: string[];
}
