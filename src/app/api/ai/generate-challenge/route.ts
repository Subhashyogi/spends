
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { reasonerModel } from '@/lib/gemini';
import User from '@/models/User';
import connectToDatabase from '@/lib/db';
import { subDays } from 'date-fns';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();
        const user = await User.findOne({ email: session.user.email });

        // Get recent expenses
        const last30Days = subDays(new Date(), 30);
        const recentTransactions = user.transactions.filter((t: any) =>
            t.type === 'expense' && new Date(t.date) > last30Days
        );

        if (recentTransactions.length === 0) {
            return NextResponse.json({ error: "Not enough data for AI challenge." }, { status: 400 });
        }

        // Prepare data for AI
        const summary = recentTransactions.map((t: any) => `${t.date}: ${t.amount} (${t.category}) - ${t.description}`).join('\n');

        const prompt = `
            Analyze these recent expenses for user ${user.name}:
            ${summary}

            Identify one bad spending habit or a category with high spend.
            Create a "Challenge" to help them save money.
            
            Return JSON ONLY:
            {
                "type": "budget_cut", // or 'no_spend', 'savings_sprint'
                "title": "Creative Title (e.g. 'Coffee Detox')",
                "description": "Short explanation of what to do (e.g. 'Limit coffee spend to 500 this week')",
                "targetValue": number, // The limit or target amount
                "startDate": "YYYY-MM-DD" (Today),
                "endDate": "YYYY-MM-DD" (7 days from now),
                "metadata": { "category": "CategoryName" }
            }
        `;

        const result = await reasonerModel.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const challengeData = JSON.parse(text);

        // Don't save yet, just return suggestion to UI
        return NextResponse.json({ challenge: challengeData });

    } catch (error: any) {
        console.error("Challenge gen error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
