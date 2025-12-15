import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import connectToDatabase from "@/lib/db";
import { financialScore } from "@/lib/financial-score";
import { BADGES } from "@/lib/badges";
// Helper to calculate no-spend streak
const calculateStreak = (transactions: any[]) => {
    if (!transactions) return 0;
    const expenses = transactions.filter((t: any) => t.type === 'expense');
    let streak = 0;
    const today = new Date();

    // Check up to 30 days back for efficiency
    for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const start = new Date(d.setHours(0, 0, 0, 0));
        const end = new Date(d.setHours(23, 59, 59, 999));

        const hasExpense = expenses.some((t: any) => {
            const tDate = new Date(t.date);
            return tDate >= start && tDate <= end;
        });

        if (hasExpense) {
            if (i === 0) return 0; // Spent today, streak reset
            break;
        }
        streak++;
    }
    return streak;
};

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();
        const user = await User.findOne({ email: session.user.email }).lean();
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const shareables = [];

        // 1. Financial Health Score
        const score = await financialScore.calculate(user._id.toString());
        if (score) {
            let color = 'from-yellow-500 to-orange-500';
            let subtext = 'Needs Work';
            if (score.score >= 80) { color = 'from-emerald-500 to-teal-600'; subtext = 'Excellent'; }
            else if (score.score >= 50) { color = 'from-blue-500 to-cyan-500'; subtext = 'Good'; }

            shareables.push({
                type: 'health',
                title: 'Financial Health',
                value: String(Math.round(score.score)),
                subtext,
                color,
                icon: 'heart'
            });
        }

        // 2. Badges (Unlocked)
        if (user.badges && user.badges.length > 0) {
            const unlockedIds = new Set(user.badges.map((b: any) => b.id));
            const unlockedBadges = BADGES.filter(b => unlockedIds.has(b.id));

            unlockedBadges.forEach(badge => {
                shareables.push({
                    type: 'badge',
                    title: 'Badge Unlocked',
                    value: badge.name,
                    subtext: badge.description,
                    color: 'from-purple-500 to-pink-600', // You generally want specific badge colors? Or uniform?
                    icon: badge.icon
                });
            });
        }

        // 3. No Spend Streak (Simplified Logic)
        // We'll skip complex logic for now and just check basic streak if we can, 
        // OR rely on client to pass it? No, API should provide it.
        // Let's implement a basic check.
        // Actually, let's focus on Badges and Health first as requested.

        return NextResponse.json({ shareables });

    } catch (error: any) {
        console.error("Shareables error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
