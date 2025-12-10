import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Insight from "@/models/Insight";
import Transaction from "@/models/Transaction";
import connectToDatabase from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();
        const insights = await Insight.find({
            userId: session.user.email,
            status: 'pending'
        }).sort({ createdAt: -1 });

        return NextResponse.json(insights);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { insightId, action } = await req.json(); // action: 'approve', 'reject', 'dismiss'

        await connectToDatabase();

        // Action Execution Logic
        if (action === 'approve') {
            const insightDoc = await Insight.findById(insightId);
            if (insightDoc) {
                if (insightDoc.type === 'recurring_transaction') {
                    // Update all matching transactions to be recurring
                    const { description, amount } = insightDoc.data;
                    await Transaction.updateMany(
                        {
                            userId: session.user.email,
                            description: description,
                            amount: amount,
                            type: 'expense'
                        },
                        { $set: { isRecurring: true, frequency: 'monthly' } }
                    );
                } else if (insightDoc.type === 'budget_adjust') {
                    // Update or create budget
                    const { category, newLimit, month } = insightDoc.data;
                    const Budget = (await import("@/models/Budget")).default;
                    await Budget.findOneAndUpdate(
                        { userId: session.user.email, category, month },
                        { amount: newLimit },
                        { upsert: true, new: true }
                    );
                }
            }
        }

        const insight = await Insight.findByIdAndUpdate(
            insightId,
            { status: action === 'approve' ? 'approved' : 'rejected' },
            { new: true }
        );

        return NextResponse.json({ success: true, insight });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
