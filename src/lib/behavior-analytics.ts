import Transaction from "@/models/Transaction";
import connectToDatabase from "@/lib/db";
import { startOfMonth, subMonths, endOfMonth, getDay, getHours } from "date-fns";

export const behaviorAnalytics = {
    analyze: async (userId: string) => {
        await connectToDatabase();
        const now = new Date();
        const start = startOfMonth(subMonths(now, 3)); // Analyze last 3 months for better patterns

        const txs = await Transaction.find({
            userId,
            type: 'expense',
            date: { $gte: start }
        });

        if (txs.length === 0) return null;

        // 1. Time of Day Analysis
        const timeBuckets = {
            morning: 0,   // 6 - 12
            afternoon: 0, // 12 - 18
            evening: 0,   // 18 - 23
            night: 0      // 23 - 6 (Late Night)
        };

        // 2. Weekday vs Weekend
        let weekendTotal = 0;
        let weekdayTotal = 0;
        let weekendCount = 0;
        let weekdayCount = 0;

        // 3. Impulse Candidates (High value > 500, Late Night or "Wants")
        const impulseCandidates: any[] = [];

        txs.forEach((t: any) => {
            const date = new Date(t.date);
            const hour = getHours(date);
            const day = getDay(date); // 0 = Sun, 6 = Sat

            // Time Buckets
            if (hour >= 6 && hour < 12) timeBuckets.morning += t.amount;
            else if (hour >= 12 && hour < 18) timeBuckets.afternoon += t.amount;
            else if (hour >= 18 && hour < 23) timeBuckets.evening += t.amount;
            else timeBuckets.night += t.amount;

            // Weekday/Weekend
            if (day === 0 || day === 6) {
                weekendTotal += t.amount;
                weekendCount++;
            } else {
                weekdayTotal += t.amount;
                weekdayCount++;
            }

            // Impulse Detection (Simple Heuristic)
            // Late night (23-5) AND amount > 500
            // OR Category in [shopping, entertainment] AND amount > 2000
            if ((hour >= 23 || hour < 5) && t.amount > 500) {
                impulseCandidates.push(t);
            } else if (['shopping', 'entertainment'].some(cat => t.category?.toLowerCase().includes(cat)) && t.amount > 2000) {
                impulseCandidates.push(t);
            }
        });

        // Insights Generation
        const insights = [];

        // Time Insight
        const entries = Object.entries(timeBuckets);
        const maxTime = entries.reduce((a, b) => a[1] > b[1] ? a : b);
        if (maxTime[1] > 0) {
            insights.push({
                type: 'time',
                title: 'Peak Spending Time',
                message: `You spend most during the ${maxTime[0]} (${Math.round((maxTime[1] / (weekdayTotal + weekendTotal)) * 100)}% of total).`,
                data: timeBuckets
            });
        }

        // Weekend Insight
        const avgWeekend = weekendCount ? weekendTotal / weekendCount : 0;
        const avgWeekday = weekdayCount ? weekdayTotal / weekdayCount : 0;
        if (avgWeekend > avgWeekday * 1.5) {
            insights.push({
                type: 'weekend',
                title: 'Weekend Spender',
                message: `You spend ${Math.round(avgWeekend / avgWeekday)}x more on weekends than weekdays.`,
                data: { weekend: weekendTotal, weekday: weekdayTotal }
            });
        }

        // Impulse Insight
        if (impulseCandidates.length > 2) {
            insights.push({
                type: 'impulse',
                title: 'Impulse Patterns',
                message: `Detected ${impulseCandidates.length} potential impulse buys, mostly late at night.`,
                data: { count: impulseCandidates.length, total: impulseCandidates.reduce((sum, t) => sum + t.amount, 0) }
            });
        }

        return {
            timeBuckets,
            weekendTotal,
            weekdayTotal,
            impulseCount: impulseCandidates.length,
            insights
        };
    }
};
