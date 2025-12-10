import Transaction from "@/models/Transaction";
import connectToDatabase from "@/lib/db";
import { startOfMonth, subMonths, endOfMonth } from "date-fns";
import { financialScore } from "@/lib/financial-score";

export interface StorySlide {
    id: string;
    type: 'overview' | 'top_category' | 'trend' | 'health';
    title: string;
    value: string;
    subtext: string;
    color: string; // Gradient class
    icon?: string;
}

export const storiesGenerator = {
    generate: async (userId: string): Promise<StorySlide[]> => {
        await connectToDatabase();
        const now = new Date();
        const start = startOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));

        const currentMonthTxs = await Transaction.aggregate([
            { $match: { userId, type: 'expense', date: { $gte: start } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const lastMonthTxs = await Transaction.aggregate([
            { $match: { userId, type: 'expense', date: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const topCategory = await Transaction.aggregate([
            { $match: { userId, type: 'expense', date: { $gte: start } } },
            { $group: { _id: "$category", total: { $sum: "$amount" } } },
            { $sort: { total: -1 } },
            { $limit: 1 }
        ]);

        const currentTotal = currentMonthTxs[0]?.total || 0;
        const lastTotal = lastMonthTxs[0]?.total || 0;

        const slides: StorySlide[] = [];

        // 1. Overview Slide
        slides.push({
            id: 'overview',
            type: 'overview',
            title: 'This Month So Far',
            value: `₹${currentTotal.toLocaleString()}`,
            subtext: 'Total Spent',
            color: 'from-blue-500 to-indigo-600',
            icon: 'calendar'
        });

        // 2. Trend Slide
        let trendText = "Consistent spending";
        let trendColor = 'from-gray-500 to-zinc-600';
        if (lastTotal > 0) {
            const diff = currentTotal - lastTotal; // This isn't fair comparison (full prev month vs current partial). 
            // Better: Trend vs Average? Or just show the raw difference?
            // Let's assume user wants to know pace.
            // Simplified: "Last month you spent X total"
            trendText = `vs ₹${lastTotal.toLocaleString()} last month`;
            trendColor = 'from-purple-500 to-pink-600';
        }
        slides.push({
            id: 'trend',
            type: 'trend',
            title: 'Monthly Trend',
            value: trendText,
            subtext: 'Keep it up!',
            color: trendColor,
            icon: 'trending-up'
        });

        // 3. Top Category Slide
        if (topCategory.length > 0) {
            const top = topCategory[0];
            slides.push({
                id: 'top_cat',
                type: 'top_category',
                title: 'Biggest Splurge',
                value: String(top._id),
                subtext: `₹${top.total.toLocaleString()}`,
                color: 'from-orange-500 to-red-600',
                icon: 'shopping-bag'
            });
        }

        // 4. Health Score Slide
        const score = await financialScore.calculate(userId);
        if (score) {
            let scoreColor = 'from-yellow-500 to-orange-500';
            if (score.score >= 80) scoreColor = 'from-emerald-500 to-teal-600';
            if (score.score < 50) scoreColor = 'from-red-500 to-rose-600';

            slides.push({
                id: 'health',
                type: 'health',
                title: 'Financial Health',
                value: String(Math.round(score.score)),
                subtext: score.score >= 80 ? 'Excellent' : score.score >= 50 ? 'Good' : 'Needs Work',
                color: scoreColor,
                icon: 'heart'
            });
        }

        return slides;
    }
};
