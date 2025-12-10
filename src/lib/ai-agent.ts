import Transaction from "@/models/Transaction";
import Budget from "@/models/Budget";
import Insight from "@/models/Insight";
import connectToDatabase from "@/lib/db";
import { startOfMonth, subMonths, endOfMonth } from "date-fns";

export const aiAgent = {
    // 1. Detect Overspending
    detectOverspending: async (userId: string) => {
        await connectToDatabase();
        const now = new Date();
        const start = startOfMonth(now);

        // Get all budgets
        const budgets = await Budget.find({ userId, month: now.toISOString().slice(0, 7) }); // YYYY-MM

        for (const budget of budgets) {
            // Calculate actual spend for this category
            const spent = await Transaction.aggregate([
                {
                    $match: {
                        userId,
                        type: 'expense',
                        category: budget.category,
                        date: { $gte: start }
                    }
                },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);

            const totalSpent = spent[0]?.total || 0;
            const threshold = budget.amount * 0.9; // 90% warning

            if (totalSpent >= threshold) {
                // Check if alert already exists to avoid spam
                const existing = await Insight.findOne({
                    userId,
                    type: 'alert',
                    'data.category': budget.category,
                    status: 'pending'
                });

                if (!existing) {
                    await Insight.create({
                        userId,
                        type: 'alert',
                        title: `Approaching Budget Limit: ${budget.category}`,
                        message: `You have spent ${Math.round((totalSpent / budget.amount) * 100)}% of your ${budget.category} budget.`,
                        data: { category: budget.category, limit: budget.amount, current: totalSpent },
                        confidence: 'high'
                    });
                }
            }
        }
    },

    // 2. Detect Recurring Transactions & Propose Rules
    detectRecurring: async (userId: string) => {
        await connectToDatabase();
        const threeMonthsAgo = subMonths(new Date(), 3);

        // Find frequent identical transactions manually (aggregations can be complex for strings)
        // We'll group by description + amount (roughly)

        const txs = await Transaction.find({
            userId,
            type: 'expense',
            date: { $gte: threeMonthsAgo },
            isRecurring: false
        });

        const groups: any = {};

        txs.forEach((t: any) => {
            const key = `${t.description?.toLowerCase().trim()}-${t.amount}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(t);
        });

        for (const key in groups) {
            const occurrences = groups[key];
            if (occurrences.length >= 3) {
                // Check if we already suggested this
                const sample = occurrences[0];
                const existing = await Insight.findOne({
                    userId,
                    type: 'recurring_transaction',
                    'data.description': sample.description,
                    status: { $in: ['pending', 'approved'] } // Don't suggest if already pending or approved
                });

                if (!existing) {
                    await Insight.create({
                        userId,
                        type: 'recurring_transaction',
                        title: `Recurring Expense Detected: ${sample.description}`,
                        message: `You've spent ₹${sample.amount} on "${sample.description}" ${occurrences.length} times recently. Should I mark this as recurring?`,
                        data: {
                            description: sample.description,
                            amount: sample.amount,
                            category: sample.category,
                            frequency: 'monthly' // Default guess
                        },
                        confidence: 'high'
                    });
                }
            }
        }
    },

    // 3. Smart Budget Adjuster (The "Zomato" Logic)
    detectBudgetAdjustments: async (userId: string) => {
        await connectToDatabase();
        const now = new Date();
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));
        const currentMonthStr = now.toISOString().slice(0, 7);

        // Analyze specific merchants/descriptions for high frequency
        const txs = await Transaction.aggregate([
            { $match: { userId, type: 'expense', date: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
            { $group: { _id: "$description", count: { $sum: 1 }, total: { $sum: "$amount" }, category: { $first: "$category" } } },
            { $match: { count: { $gte: 4 } } } // At least 4 times a month to be "habitual"
        ]);

        for (const t of txs) {
            // Check if there is an existing budget for this category Next Month
            // If not, or if the spending is consistently high, propose a budget rule/adjustment

            // Simplified logic: If they spent a lot on this, suggest a budget for next month that restricts it slightly
            // "You bought food from Zomato 14 times. I'll lower your budget..."

            const proposedLimit = Math.round(t.total * 0.9); // Suggest 10% cut

            // Check existence
            const existing = await Insight.findOne({
                userId,
                type: 'budget_adjust',
                'data.category': t.category,
                status: 'pending'
            });

            if (!existing && t.category) {
                await Insight.create({
                    userId,
                    type: 'budget_adjust',
                    title: `spending Habit Detected: ${t._id}`,
                    message: `You spent ₹${t.total} on ${t._id} (${t.count} times) last month. I can set a ${t.category} budget of ₹${proposedLimit} for this month to help you save. Approve?`,
                    data: {
                        category: t.category,
                        newLimit: proposedLimit,
                        month: currentMonthStr,
                        merchant: t._id
                    },
                    confidence: 'medium'
                });
            }
        }
    },

    // Master Orchestrator
    runAgent: async (userId: string) => {
        console.log(`[Agent] Running for user: ${userId}`);
        await aiAgent.detectOverspending(userId);
        await aiAgent.detectRecurring(userId);
        await aiAgent.detectBudgetAdjustments(userId);
        console.log(`[Agent] Finished run for ${userId}`);
        return { success: true };
    }
};
