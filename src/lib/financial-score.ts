import User from "@/models/User";
import connectToDatabase from "@/lib/db";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import mongoose from "mongoose";

export const financialScore = {
    calculate: async (userId: string) => {
        await connectToDatabase();
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        const userObjectId = new mongoose.Types.ObjectId(userId);

        // Common pipeline stages
        const matchUser = { $match: { _id: userObjectId } };

        // 1. Savings Rate (30 pts)
        // Target: Save 20% of income
        const incomeAgg = await User.aggregate([
            matchUser,
            { $unwind: "$transactions" },
            { $match: { "transactions.type": "income", "transactions.date": { $gte: start, $lte: end } } },
            { $group: { _id: null, total: { $sum: "$transactions.amount" } } }
        ]);

        const expenseAgg = await User.aggregate([
            matchUser,
            { $unwind: "$transactions" },
            { $match: { "transactions.type": "expense", "transactions.date": { $gte: start, $lte: end } } },
            { $group: { _id: null, total: { $sum: "$transactions.amount" } } }
        ]);

        const totalIncome = incomeAgg[0]?.total || 0;
        const totalExpense = expenseAgg[0]?.total || 0;

        let savingsScore = 0;
        let savingsRate = 0;
        if (totalIncome > 0) {
            savingsRate = ((totalIncome - totalExpense) / totalIncome) * 100;
            // Max score if > 20%
            if (savingsRate >= 20) savingsScore = 30;
            else if (savingsRate > 0) savingsScore = (savingsRate / 20) * 30;
            else savingsScore = 0;
        }

        // 2. Budget Discipline (25 pts)
        // % of budgets not exceeded
        // We need updates budgets fetch logic too since they are embedded
        const budgetsAgg = await User.aggregate([
            matchUser,
            { $unwind: "$budgets" },
            { $match: { "budgets.month": now.toISOString().slice(0, 7) } },
            { $replaceRoot: { newRoot: "$budgets" } }
        ]);
        const budgets = budgetsAgg || [];

        let budgetScore = 25; // Default to max if no budgets set (benefit of doubt)
        if (budgets.length > 0) {
            let hitCount = 0;
            for (const b of budgets) {
                const catSpentAgg = await User.aggregate([
                    matchUser,
                    { $unwind: "$transactions" },
                    { $match: { "transactions.type": "expense", "transactions.category": b.category, "transactions.date": { $gte: start, $lte: end } } },
                    { $group: { _id: null, total: { $sum: "$transactions.amount" } } }
                ]);
                const spent = catSpentAgg[0]?.total || 0;
                if (spent <= b.amount) hitCount++;
            }
            budgetScore = (hitCount / budgets.length) * 25;
        }

        // 3. Liquidity (15 pts)
        // Positive balance at end of month (simplified: income > expense)
        let liquidityScore = 0;
        if (totalIncome > totalExpense) liquidityScore = 15;
        else if (totalIncome > 0 && totalExpense < totalIncome * 1.05) liquidityScore = 5; // Close call

        // 4. Habits (Needs vs Wants) (15 pts)
        // Simple heuristic: If "Shopping" + "Entertainment" < 30% of expense
        const wants = ["shopping", "entertainment", "dining", "travel"];
        // Create regex for case insensitive match
        const wantsRegex = wants.map(w => new RegExp(w, 'i'));

        const wantsSpentAgg = await User.aggregate([
            matchUser,
            { $unwind: "$transactions" },
            {
                $match: {
                    "transactions.type": "expense",
                    "transactions.category": { $in: wantsRegex },
                    "transactions.date": { $gte: start, $lte: end }
                }
            },
            { $group: { _id: null, total: { $sum: "$transactions.amount" } } }
        ]);

        const totalWants = wantsSpentAgg[0]?.total || 0;
        let habitScore = 15;
        if (totalExpense > 0) {
            const wantsRatio = totalWants / totalExpense;
            if (wantsRatio > 0.5) habitScore = 5; // >50% wants = bad
            else if (wantsRatio > 0.3) habitScore = 10;
        }

        // 5. Stability (15 pts)
        // Standard deviation of last 3 months spending?
        // Simplified: Did you spend within +/- 20% of last month?
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));

        const lastMonthExpenseAgg = await User.aggregate([
            matchUser,
            { $unwind: "$transactions" },
            { $match: { "transactions.type": "expense", "transactions.date": { $gte: lastMonthStart, $lte: lastMonthEnd } } },
            { $group: { _id: null, total: { $sum: "$transactions.amount" } } }
        ]);

        const prevTotal = lastMonthExpenseAgg[0]?.total || 0;

        let stabilityScore = 15;
        if (prevTotal > 0 && totalExpense > 0) {
            const diff = Math.abs(totalExpense - prevTotal);
            const pctDiff = diff / prevTotal;
            if (pctDiff > 0.5) stabilityScore = 5; // Huge swing
            else if (pctDiff > 0.2) stabilityScore = 10;
        } else if (prevTotal === 0 && totalExpense > 0) {
            // First month or previous month empty
            stabilityScore = 15; // Give benefit of doubt for new users
        }

        const totalScore = Math.min(100, Math.round(savingsScore + budgetScore + liquidityScore + habitScore + stabilityScore));

        // Generate Tips
        const tips = [];
        if (savingsScore < 20) tips.push("Try to save at least 20% of your income.");
        if (budgetScore < 15) tips.push("You exceeded several budgets. Review your limits.");
        if (habitScore < 10) tips.push("High spending on 'Wants'. Consider cutting back on dining/shopping.");
        if (liquidityScore === 0 && totalExpense > 0) tips.push("You are spending more than you earn!");
        if (totalScore >= 80) tips.push("Great job! Keep up the good work.");

        return {
            score: totalScore,
            breakdown: {
                savings: savingsScore,
                budget: budgetScore,
                liquidity: liquidityScore,
                habits: habitScore,
                stability: stabilityScore
            },
            tips: tips.slice(0, 2) // Top 2 tips
        };
    }
};
