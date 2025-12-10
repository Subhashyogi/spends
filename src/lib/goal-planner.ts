import Transaction from "@/models/Transaction";
import Goal from "@/models/Goal";
import connectToDatabase from "@/lib/db";
import { startOfMonth, subMonths, endOfMonth, differenceInMonths, addMonths } from "date-fns";

export const goalPlanner = {
    // Forecast and suggestion logic
    analyzeGoal: async (userId: string, goalId: string) => {
        await connectToDatabase();

        const goal = await Goal.findById(goalId);
        if (!goal) return null;

        // 1. Calculate Average Monthly Surplus (Last 3 Months)
        const now = new Date();
        const start = startOfMonth(subMonths(now, 3));

        const income = await Transaction.aggregate([
            { $match: { userId, type: 'income', date: { $gte: start } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const expense = await Transaction.aggregate([
            { $match: { userId, type: 'expense', date: { $gte: start } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const totalIncome = income[0]?.total || 0;
        const totalExpense = expense[0]?.total || 0;
        const months = 3;
        const monthlySurplus = (totalIncome - totalExpense) / months; // Can be negative

        // 2. Project Completion
        const remaining = goal.targetAmount - goal.currentAmount;
        let projectedMonths = 0;
        if (monthlySurplus > 0) {
            projectedMonths = Math.ceil(remaining / monthlySurplus);
        } else {
            projectedMonths = 999; // Infinite
        }

        // 3. Deadline Analysis
        let onTrack = true;
        let requiredMonthly = 0;
        if (goal.deadline) {
            const monthsToDeadline = differenceInMonths(new Date(goal.deadline), now);
            if (monthsToDeadline > 0) {
                requiredMonthly = remaining / monthsToDeadline;
                if (monthlySurplus < requiredMonthly) onTrack = false;
            }
        }

        // 4. Generate Suggestions (if off track)
        const suggestions = [];
        if (!onTrack && requiredMonthly > 0) {
            const deficit = requiredMonthly - Math.max(0, monthlySurplus);

            // Find "Wants" to cut
            const wants = await Transaction.aggregate([
                { $match: { userId, type: 'expense', category: { $in: ['dining', 'shopping', 'entertainment', 'subscriptions'] }, date: { $gte: start } } },
                { $group: { _id: "$category", total: { $sum: "$amount" } } }
            ]);

            for (const want of wants) {
                const avgSpend = want.total / months;
                if (avgSpend > deficit * 0.5) {
                    suggestions.push(`Cut ${want._id} by ₹${Math.round(deficit)}/mo to reach your goal on time.`);
                }
            }

            if (suggestions.length === 0) {
                suggestions.push(`You need to save an extra ₹${Math.round(deficit)}/mo. Try increasing income or reducing general expenses.`);
            }
        } else if (monthlySurplus > requiredMonthly * 1.5 && requiredMonthly > 0) {
            const earlyMonths = Math.ceil(remaining / monthlySurplus);
            suggestions.push(`Great job! At this rate, you'll finish in ${earlyMonths} months instead of ${differenceInMonths(new Date(goal.deadline), now)}.`);
        }

        return {
            monthlySurplus,
            projectedMonths,
            onTrack,
            requiredMonthly,
            suggestions
        };
    }
};
