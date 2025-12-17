import { NextRequest, NextResponse } from "next/server";
import { model } from "@/lib/gemini";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { input } = await req.json();

        if (!input) {
            return NextResponse.json({ error: "Input is required" }, { status: 400 });
        }

        const prompt = `
        Extract transaction details from this text: "${input}".
        Return a JSON object with:
        - amount: number
        - currency: string (default 'INR')
        - category: string (infer from context e.g., Food, Travel, Bills, Shopping. Limit to standard categories).
        - description: string (clean description)
        - date: string (ISO date if mentioned like "yesterday", otherwise null for today)
        - type: 'expense' | 'income' (default 'expense')

        Examples:
        "Taxi 500" -> {"amount": 500, "category": "Transport", "description": "Taxi", "type": "expense"}
        "Salary credited 50000" -> {"amount": 50000, "category": "Salary", "description": "Salary Credited", "type": "income"}
        
        Return ONLY valid JSON.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanedText);

        return NextResponse.json({ data });

    } catch (error) {
        console.error("Parse error:", error);
        return NextResponse.json({ error: "Failed to parse transaction" }, { status: 500 });
    }
}
