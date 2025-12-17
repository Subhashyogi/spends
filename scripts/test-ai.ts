import "dotenv/config";
import connectToDatabase from "../src/lib/db";
import User from "../src/models/User";
import { storiesGenerator } from "../src/lib/stories-generator";
import { aiAgent } from "../src/lib/ai-agent";
import mongoose from "mongoose";

async function main() {
    console.log("1. Connecting to DB...");
    await connectToDatabase();

    console.log("2. Fetching a test user...");
    const user = await User.findOne({});
    if (!user) {
        console.error("No users found in database. Please register a user first.");
        process.exit(1);
    }
    console.log(`Found User: ${user.name} (${user._id})`);

    // TEST 1: Stories
    console.log("\n--- TEST 1: Generating AI Stories ---");
    try {
        const stories = await storiesGenerator.generate(user._id.toString());
        console.log("Success! Generated slides:");
        stories.forEach(s => {
            console.log(`- [${s.type}] ${s.title}: ${s.value} ("${s.subtext}")`);
        });
    } catch (e) {
        console.error("Story Generation Failed:", e);
    }

    // TEST 2: Transaction Parsing Mock
    console.log("\n--- TEST 2: Testing Transaction Parser Logic (Direct Call) ---");
    // We'll simulate what the API does by calling Gemini directly here or simple fetch if api running
    // For simplicity, let's just use the gemini model directly here to prove key works
    try {
        const { model } = await import("../src/lib/gemini");
        const prompt = `Parse this: "Coffee 250 with friends". Return JSON with amount, category, desc.`;
        const res = await model.generateContent(prompt);
        console.log("AI Response for 'Coffee 250':", res.response.text());
    } catch (e) {
        console.error("Gemini Direct Test Failed:", e);
    }

    // TEST 3: Monthly Report
    console.log("\n--- TEST 3: Generating Monthly Report ---");
    try {
        await aiAgent.generateMonthlyReport(user._id.toString());
        console.log("Check complete. If successful, a new 'monthly_report' Insight document was created in MongoDB.");
    } catch (e) {
        console.error("Report Generation Failed:", e);
    }

    process.exit(0);
}

main();
