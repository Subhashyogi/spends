import Transaction from "@/models/Transaction";
import Budget from "@/models/Budget";
import connectToDatabase from "@/lib/db";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export const financialScore = {
    calculate: async (userId: string) => {
        await connectToDatabase();
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        // 1. Savings Rate (30 pts)
        // Target: Save 20% of income
        const income = await Transaction.aggregate([
            { $match: { userId, type: 'income', date: { $gte: start, $lte: end } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const expense = await Transaction.aggregate([
            { $match: { userId, type: 'expense', date: { $gte: start, $lte: end } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const totalIncome = income[0]?.total || 0;
        const totalExpense = expense[0]?.total || 0;

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
        const budgets = await Budget.find({ userId, month: now.toISOString().slice(0, 7) });
        let budgetScore = 25; // Default to max if no budgets set (benefit of doubt)
        if (budgets.length > 0) {
            let hitCount = 0;
            for (const b of budgets) {
                const catSpent = await Transaction.aggregate([
                    { $match: { userId, type: 'expense', category: b.category, date: { $gte: start, $lte: end } } },
                    { $group: { _id: null, total: { $sum: "$amount" } } }
                ]);
                const spent = catSpent[0]?.total || 0;
                if (spent <= b.amount) hitCount++;
            }
            budgetScore = (hitCount / budgets.length) * 25;
        }

        // 3. Liquidity (15 pts)
        // Positive balance at end of month (simplified: income > expense)
        // Actually this is similar to savings but binary
        let liquidityScore = 0;
        if (totalIncome > totalExpense) liquidityScore = 15;
        else if (totalIncome > 0 && totalExpense < totalIncome * 1.05) liquidityScore = 5; // Close call

        // 4. Habits (Needs vs Wants) (15 pts)
        // Simple heuristic: If "Shopping" + "Entertainment" < 30% of expense
        // In a real app, users would tag categories as Needs/Wants. Here we hardcode common ones.
        const wants = ["shopping", "entertainment", "dining", "travel"];
        const wantsSpent = await Transaction.aggregate([
            { $match: { userId, type: 'expense', category: { $in: wants.map(w => new RegExp(w, 'i')) }, date: { $gte: start, $lte: end } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalWants = wantsSpent[0]?.total || 0;
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
        const lastMonthExpense = await Transaction.aggregate([
            { $match: { userId, type: 'expense', date: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const prevTotal = lastMonthExpense[0]?.total || 0;

        let stabilityScore = 15;
        if (prevTotal > 0 && totalExpense > 0) {
            const diff = Math.abs(totalExpense - prevTotal);
            const pctDiff = diff / prevTotal;
            if (pctDiff > 0.5) stabilityScore = 5; // Huge swing
            else if (pctDiff > 0.2) stabilityScore = 10;
        }

        const totalScore = Math.min(100, Math.round(savingsScore + budgetScore + liquidityScore + habitScore + stabilityScore));

        // Generate Tips
        const tips = [];
        if (savingsScore < 20) tips.push("Try to save at least 20% of your income.");
        if (budgetScore < 15) tips.push("You exceeded several budgets. Review your limits.");
        if (habitScore < 10) tips.push("High spending on 'Wants'. Consider cutting back on dining/shopping.");
        if (liquidityScore === 0) tips.push("You are spending more than you earn!");

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
