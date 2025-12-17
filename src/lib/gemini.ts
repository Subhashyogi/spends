import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("Missing GEMINI_API_KEY environment variable. AI features will be disabled.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

// Use a lightweight model for fast responses (stories, parsing)
export const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Use a more capable model for complex reasoning (advisor) if needed
export const reasonerModel = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
