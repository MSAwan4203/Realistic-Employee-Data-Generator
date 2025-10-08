
import { GoogleGenAI, Type } from "@google/genai";
import type { DataSchema } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const schema = {
    type: Type.OBJECT,
    properties: {
        departments: {
            type: Type.ARRAY,
            description: "A list of company departments.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Department name" },
                    jobTitles: {
                        type: Type.ARRAY,
                        description: "List of job titles within this department.",
                        items: { type: Type.STRING }
                    },
                    salaryRange: {
                        type: Type.ARRAY,
                        description: "A tuple representing the min and max base salary for this department.",
                        items: { type: Type.NUMBER }
                    }
                },
                required: ["name", "jobTitles", "salaryRange"]
            }
        },
        officeLocations: {
            type: Type.ARRAY,
            description: "A list of office locations.",
            items: {
                type: Type.OBJECT,
                properties: {
                    city: { type: Type.STRING },
                    state: { type: Type.STRING },
                    zipCode: { type: Type.STRING }
                },
                required: ["city", "state", "zipCode"]
            }
        },
        maleNames: { type: Type.ARRAY, items: { type: Type.STRING } },
        femaleNames: { type: Type.ARRAY, items: { type: Type.STRING } },
        lastNames: { type: Type.ARRAY, items: { type: Type.STRING } },
        streetNames: { type: Type.ARRAY, items: { type: Type.STRING } },
        ethnicities: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["departments", "officeLocations", "maleNames", "femaleNames", "lastNames", "streetNames", "ethnicities"]
};

export const getEmployeeDataSchema = async (): Promise<DataSchema> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `
                Generate a realistic data schema for a large, fictional US-based tech company named 'ExampleCorp'. 
                The schema should be used to programmatically generate 100,000 employee records.
                
                Provide the following details in your response:
                - Departments: 8-12 realistic departments (e.g., Engineering, Marketing, HR). For each, provide 5-10 job titles and a realistic annual salary range [min, max].
                - Office Locations: 5-7 US office locations with city, state, and a valid zipcode.
                - Names: 50 common male first names, 50 common female first names, and 50 common last names.
                - Street Names: 20 common street names.
                - Ethnicities: A list of 8-10 common ethnicities found in the US.
                
                Ensure the data is diverse and appears authentic for a large corporation. The salary ranges should be appropriate for the department (e.g., Engineering salaries higher than Customer Support).
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const jsonText = response.text.trim();
        const parsedSchema = JSON.parse(jsonText);

        // Basic validation
        if (!parsedSchema.departments || !parsedSchema.officeLocations || !parsedSchema.maleNames) {
            throw new Error("AI response is missing required schema fields.");
        }

        return parsedSchema as DataSchema;

    } catch (error) {
        console.error("Error fetching data schema from Gemini:", error);
        throw new Error("Failed to get a valid data schema from the AI. Please check your API key and try again.");
    }
};
