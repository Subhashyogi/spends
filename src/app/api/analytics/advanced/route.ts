import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Transaction from "@/models/Transaction";
import connectToDatabase from "@/lib/db";
import { startOfYear, endOfYear, subMonths } from "date-fns";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();
        const userId = session.user.email;

        // Date Ranges
        const now = new Date();
        const startOfCurrentYear = startOfYear(now);
        const endOfCurrentYear = endOfYear(now);
        const lastMonthStart = subMonths(now, 1);

        // 1. HEATMAP DATA (Daily Spending intensity for current year)
        const heatmapData = await Transaction.aggregate([
            {
                $match: {
                    userId,
                    type: 'expense',
                    date: { $gte: startOfCurrentYear, $lte: endOfCurrentYear }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    count: { $sum: 1 },
                    total: { $sum: "$amount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 2. RADAR DATA (Category Spending vs Last Month?)
        // simplified: Total spending by category for current year
        const radarData = await Transaction.aggregate([
            {
                $match: {
                    userId,
                    type: 'expense',
                    // Filter outliers or specific timeframe if needed, e.g., last 3 months
                    date: { $gte: subMonths(now, 3) }
                }
            },
            {
                $group: {
                    _id: "$category",
                    total: { $sum: "$amount" }
                }
            }
        ]);

        // 3. FUNNEL DATA (Income -> Expense -> Savings) (Last 30 Days)
        const funnelStats = await Transaction.aggregate([
            {
                $match: {
                    userId,
                    date: { $gte: lastMonthStart }
                }
            },
            {
                $group: {
                    _id: "$type",
                    total: { $sum: "$amount" }
                }
            }
        ]);

        const income = funnelStats.find(x => x._id === 'income')?.total || 0;
        const expenses = funnelStats.find(x => x._id === 'expense')?.total || 0;
        const savings = Math.max(0, income - expenses);

        // 4. OVERDRAFT PROBABILITY (Simple Heuristic for now)
        // Check recurring expenses due in next 7 days vs current balance (simulated)
        // Ideally we'd need real balance, here we use monthly surplus as proxy for 'health'
        const recurringDue = await Transaction.aggregate([
            {
                $match: {
                    userId,
                    isRecurring: true,
                    type: 'expense'
                }
            },
            {
                $project: {
                    amount: 1,
                    dayOfMonth: { $dayOfMonth: "$date" } // Simplified: assume date is due date
                }
            }
        ]);

        // Simulating "Risk Score" 0-100
        const riskScore = (expenses > income * 0.9) ? 80 : (expenses > income * 0.7) ? 40 : 10;


        return NextResponse.json({
            heatmap: heatmapData.map(d => ({ date: d._id, count: d.count, value: d.total })),
            radar: radarData.map(d => ({ subject: d._id, A: d.total, fullMark: 100 })), // formatting for Recharts
            funnel: [
                { name: "Income", value: income, fill: "#10b981" },
                { name: "Expenses", value: expenses, fill: "#ef4444" },
                { name: "Savings", value: savings, fill: "#3b82f6" }
            ],
            overdraftRisk: riskScore
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
