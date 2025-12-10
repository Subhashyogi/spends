import Transaction from "@/models/Transaction";
import Challenge from "@/models/Challenge";
import { startOfDay, endOfDay, addDays, subDays, startOfMonth, endOfMonth } from "date-fns";

export const gamificationEngine = {
    // 1. Join a Challenge
    joinChallenge: async (userId: string, type: 'no_spend' | 'budget_cut' | 'savings_sprint') => {
        // Prevent duplicates
        const existing = await Challenge.findOne({ userId, type, status: 'active' });
        if (existing) throw new Error("Challenge already active!");

        let title = "";
        let description = "";
        let targetValue = 0;
        let days = 7;
        let metadata = {};

        if (type === 'no_spend') {
            title = "No-Spend Week";
            description = "Spend ₹0 on non-essentials for 7 days.";
            targetValue = 7; // Target days
            days = 7;
        }
        else if (type === 'budget_cut') {
            title = "Food Budget Cut";
            description = "Cut your dining expenses by 20%.";
            // Calculate avg food spend
            const lastMonthStart = startOfMonth(subDays(new Date(), 30));
            const txs = await Transaction.aggregate([
                { $match: { userId, type: 'expense', category: { $regex: /food|dining|swiggy|zomato/i }, date: { $gte: lastMonthStart } } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);
            const lastMonthSpend = txs[0]?.total || 5000; // Default fallback
            targetValue = Math.round(lastMonthSpend * 0.8); // 20% cut
            metadata = { originalSpend: lastMonthSpend };
            days = 30; // Monthly challenge
        }
        else if (type === 'savings_sprint') {
            title = "7-Day Savings Sprint";
            description = "Save an extra ₹2,000 this week.";
            targetValue = 2000;
            days = 7;
        }

        const newChallenge = await Challenge.create({
            userId,
            type,
            title,
            description,
            startDate: new Date(),
            endDate: addDays(new Date(), days),
            targetValue,
            currentValue: 0,
            status: 'active',
            metadata
        });

        return newChallenge;
    },

    // 2. Update Progress (Run this when viewing dashboard or adding tx)
    updateProgress: async (userId: string) => {
        const activeChallenges = await Challenge.find({ userId, status: 'active' });

        for (const challenge of activeChallenges) {
            const now = new Date();

            // Check if expired
            if (now > challenge.endDate) {
                // Final Check
                if (challenge.type === 'no_spend') {
                    if (challenge.currentValue >= challenge.targetValue) challenge.status = 'completed';
                    else challenge.status = 'failed';
                } else if (challenge.type === 'budget_cut') {
                    // For budget cut, currentValue is SPEND. So if Spend <= Target, Success.
                    if (challenge.currentValue <= challenge.targetValue) challenge.status = 'completed';
                    else challenge.status = 'failed';
                }
                await challenge.save();
                continue;
            }

            // Update Logic
            if (challenge.type === 'no_spend') {
                // Calculate "Clean Days" since start
                // This is expensive to calc every time, simplified:
                // Check if TODAY writes any bad transaction?
                // Better: Just count distinct days with 0 discretionary spend

                // For simplicity in MVP: Just count total spent since start. 
                // Wait, "No Spend" means 0 spend. 
                // Let's change target: Target = 0. Current = Total Spend.
                // Status = Failed if Current > 0.
                // But user wants "Streak".
                // Let's stick to "Days without spend".
                // We'll calculate it fresh (it's robust).

                const txs = await Transaction.find({
                    userId,
                    type: 'expense',
                    date: { $gte: challenge.startDate, $lte: now },
                    // Exclude bills/rent? Maybe just > 100 rs to ignore tiny fees
                    amount: { $gt: 10 }
                });

                // Get distinct days with transactions
                const badDays = new Set(txs.map((t: any) => new Date(t.date).toDateString()));

                // Total days passed
                const daysPassed = Math.floor((now.getTime() - new Date(challenge.startDate).getTime()) / (1000 * 60 * 60 * 24));
                const cleanDays = Math.max(0, daysPassed - badDays.size);

                challenge.currentValue = cleanDays;

            } else if (challenge.type === 'budget_cut') {
                const txs = await Transaction.aggregate([
                    {
                        $match: {
                            userId,
                            type: 'expense',
                            category: { $regex: /food|dining|swiggy|zomato/i },
                            date: { $gte: challenge.startDate, $lte: challenge.endDate }
                        }
                    },
                    { $group: { _id: null, total: { $sum: "$amount" } } }
                ]);
                challenge.currentValue = txs[0]?.total || 0;
            }

            await challenge.save();
        }
    }
};
