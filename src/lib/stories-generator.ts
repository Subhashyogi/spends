import User from "@/models/User";
import connectToDatabase from "@/lib/db";
import { startOfMonth, subMonths, endOfMonth } from "date-fns";
import { financialScore } from "@/lib/financial-score";
import mongoose from "mongoose";

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
        const userObjectId = new mongoose.Types.ObjectId(userId);

        const currentMonthTxs = await User.aggregate([
            { $match: { _id: userObjectId } },
            { $unwind: "$transactions" },
            { $match: { "transactions.type": 'expense', "transactions.date": { $gte: start } } },
            { $group: { _id: null, total: { $sum: "$transactions.amount" } } }
        ]);

        const lastMonthTxs = await User.aggregate([
            { $match: { _id: userObjectId } },
            { $unwind: "$transactions" },
            { $match: { "transactions.type": 'expense', "transactions.date": { $gte: lastMonthStart, $lte: lastMonthEnd } } },
            { $group: { _id: null, total: { $sum: "$transactions.amount" } } }
        ]);

        const topCategory = await User.aggregate([
            { $match: { _id: userObjectId } },
            { $unwind: "$transactions" },
            { $match: { "transactions.type": 'expense', "transactions.date": { $gte: start } } },
            { $group: { _id: "$transactions.category", total: { $sum: "$transactions.amount" } } },
            { $sort: { total: -1 } },
            { $limit: 1 }
        ]);

        const currentTotal = currentMonthTxs[0]?.total || 0;
        const lastTotal = lastMonthTxs[0]?.total || 0;

        const slides: StorySlide[] = [];

        // 1. Overview Slide
        if (currentTotal > 0 || lastTotal > 0) { // Only show if there is some activity
            slides.push({
                id: 'overview',
                type: 'overview',
                title: 'This Month So Far',
                value: `₹${currentTotal.toLocaleString()}`,
                subtext: 'Total Spent',
                color: 'from-blue-500 to-indigo-600',
                icon: 'calendar'
            });
        }

        // 2. Trend Slide
        if (currentTotal > 0 && lastTotal > 0) {
            let trendText = "Consistent spending";
            let trendColor = 'from-gray-500 to-zinc-600';

            if (currentTotal > lastTotal) {
                trendText = `+${Math.round((currentTotal - lastTotal) / lastTotal * 100)}% vs last month`;
                trendColor = 'from-pink-500 to-rose-500'; // High spending
            } else if (currentTotal < lastTotal) {
                trendText = `${Math.round((lastTotal - currentTotal) / lastTotal * 100)}% less than last month`;
                trendColor = 'from-emerald-500 to-teal-500'; // Savings
            } else {
                trendText = `Same as last month`;
                trendColor = 'from-blue-500 to-cyan-500';
            }

            slides.push({
                id: 'trend',
                type: 'trend',
                title: 'Monthly Trend',
                value: trendText,
                subtext: 'vs Last Month',
                color: trendColor,
                icon: 'trending-up'
            });
        }

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
