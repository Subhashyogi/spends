import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function main() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API Key found in .env");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Using a trick: The SDK doesn't always expose listModels directly on the main class in some older docs,
    // but usually we can try to infer or just use a known one. 
    // Actually, newer SDKs might not expose listModels directly via the high-level class easily without checking docs.
    // Let's use the lower level model manager if available, or just try a standard fetch to the API.

    // Simple fetch approach to be dependency-agnostic for listing
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("--- Available Models ---");
            data.models.forEach((m: any) => {
                console.log(`- ${m.name}`);
            });
            console.log("------------------------");
        } else {
            console.error("Could not list models. Response:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

main();
