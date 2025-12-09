// @ts-nocheck
import Transaction from "@/models/Transaction";
import connectToDatabase from "@/lib/db";
import { startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, subWeeks, startOfYear, endOfYear, subYears } from "date-fns";

// Helper to parse date ranges
const getDateRange = (range: string) => {
    const now = new Date();
    switch (range) {
        case "this_month":
            return { start: startOfMonth(now), end: endOfMonth(now) };
        case "last_month":
            return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
        case "this_week":
            return { start: startOfWeek(now), end: endOfWeek(now) };
        case "last_week":
            return { start: startOfWeek(subWeeks(now, 1)), end: endOfWeek(subWeeks(now, 1)) };
        case "this_year":
            return { start: startOfYear(now), end: endOfYear(now) };
        case "last_year":
            return { start: startOfYear(subYears(now, 1)), end: endOfYear(subYears(now, 1)) };
        case "last_3_months":
            return { start: subMonths(now, 3), end: now };
        case "last_6_months":
            return { start: subMonths(now, 6), end: now };
        default:
            return { start: startOfMonth(now), end: endOfMonth(now) }; // Default to this month
    }
};

export const aiTools = {
    getTotalSpent: async (userId: string, { category, dateRange, type = "expense" }: any) => {
        await connectToDatabase();
        const { start, end } = getDateRange(dateRange);

        const query: any = {
            userId,
            type,
            date: { $gte: start, $lte: end }
        };

        if (category && category !== "all") {
            query.category = { $regex: category, $options: "i" };
        }

        const result = await Transaction.aggregate([
            { $match: query },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        return {
            total: result[0]?.total || 0,
            period: dateRange,
            category: category || "all",
            currency: "INR"
        };
    },

    getTransactions: async (userId: string, { limit = 5, category, dateRange }: any) => {
        await connectToDatabase();
        const { start, end } = getDateRange(dateRange);

        const query: any = {
            userId,
            date: { $gte: start, $lte: end }
        };

        if (category) {
            query.category = { $regex: category, $options: "i" };
        }

        const txs = await Transaction.find(query)
            .sort({ date: -1 })
            .limit(limit)
            .select("amount category description date type");

        return txs;
    },

    getBiggestCategory: async (userId: string, { dateRange }: any) => {
        await connectToDatabase();
        const { start, end } = getDateRange(dateRange);

        const result = await Transaction.aggregate([
            { $match: { userId, type: "expense", date: { $gte: start, $lte: end } } },
            { $group: { _id: "$category", total: { $sum: "$amount" } } },
            { $sort: { total: -1 } },
            { $limit: 1 }
        ]);

        return result[0] ? { category: result[0]._id, amount: result[0].total } : null;
    },

    getChartData: async (userId: string, { category, dateRange }: any) => {
        await connectToDatabase();
        const { start, end } = getDateRange(dateRange);

        const query: any = {
            userId,
            type: "expense",
            date: { $gte: start, $lte: end }
        };

        if (category) {
            query.category = { $regex: category, $options: "i" };
        }

        // Group by day
        const result = await Transaction.aggregate([
            { $match: query },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    total: { $sum: "$amount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return {
            type: "bar",
            title: `${category || "Total"} Expenses (${dateRange})`,
            data: result.map(r => ({ name: r._id, value: r.total }))
        };
    },

    predictNextMonthExpenses: async (userId: string) => {
        await connectToDatabase();
        const start = startOfMonth(subMonths(new Date(), 3)); // Last 3 months data

        const result = await Transaction.aggregate([
            { $match: { userId, type: "expense", date: { $gte: start } } },
            { $group: { _id: { $month: "$date" }, total: { $sum: "$amount" } } }
        ]);

        if (result.length === 0) return { prediction: 0, confidence: "low" };

        const avg = result.reduce((acc, curr) => acc + curr.total, 0) / result.length;
        return { prediction: Math.round(avg), confidence: "medium", basedOn: "3 month average" };
    },

    generateAdvice: async (userId: string) => {
        // Simple rule-based advice for now, can be enhanced with LLM analysis of stats
        await connectToDatabase();
        const now = new Date();
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));

        const expenses = await Transaction.find({
            userId,
            type: "expense",
            date: { $gte: lastMonthStart, $lte: lastMonthEnd }
        });

        const total = expenses.reduce((sum, t) => sum + t.amount, 0);

        if (total === 0) return "Start tracking your expenses to get personalized advice!";
        if (total > 50000) return "Your spending is high. Try setting a budget for discretionary categories.";
        return "You are doing well! Keep tracking your expenses.";
    }
};
