
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { image } = body; // Base64 string

        if (!image) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        // Clean base64 string
        const base64Data = image.split(',')[1] || image;

        const prompt = `
            Analyze this receipt image. Extract transaction details into JSON.
            Return ONLY the raw JSON object, no markdown.
            Format:
            {
                "amount": number,
                "date": "YYYY-MM-DD" (or null if not found),
                "description": "Merchant name or brief items summary",
                "category": "Suggested Category (e.g. Food, Transport, Bills, Shopping, Health)",
                "type": "expense"
            }
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg" // Assuming JPEG/PNG, Gemini is flexible
                }
            }
        ]);

        const response = await result.response;
        let text = response.text();

        // Clean markdown
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(text);

        return NextResponse.json({ data });

    } catch (error: any) {
        console.error("Receipt parse error:", error);
        return NextResponse.json({ error: error.message || "Failed to parse receipt" }, { status: 500 });
    }
}
