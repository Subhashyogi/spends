"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { safeJson } from "@/lib/http";
import { Flame, Calendar, Trophy } from "lucide-react";

type Transaction = {
    _id: string;
    type: "income" | "expense";
    date: string;
};

export default function StreakCard() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/transactions?limit=1000&type=expense");
                const { ok, data } = await safeJson(res);
                if (ok) setTransactions(data.data || data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const stats = useMemo(() => {
        if (loading) return null;

        const expenseDates = new Set(
            transactions
                .filter(t => t.type === "expense")
                .map(t => new Date(t.date).toISOString().split('T')[0])
        );

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // --- Current No-Spend Streak ---
        let streak = 0;
        let currentCheck = new Date(today);
        let checkStr = currentCheck.toISOString().split('T')[0];

        // If today has NO expense, streak starts today.
        // If today HAS expense, streak is 0. 
        // Wait, usually users want to see the streak from yesterday if today is not over?
        // Actually for "No Spend", if I haven't spent TODAY, it counts!
        // But if I spent today, streak resets to 0 immediately.

        if (expenseDates.has(checkStr)) {
            streak = 0;
        } else {
            // Today is clean
            streak = 1;
            currentCheck.setDate(currentCheck.getDate() - 1); // Check yesterday

            while (true) {
                const str = currentCheck.toISOString().split('T')[0];
                if (!expenseDates.has(str)) {
                    streak++;
                    currentCheck.setDate(currentCheck.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        // --- Highest No-Spend Streak ---
        // We need to look at gaps between expenses.
        // First, get all dates with expenses, sort them.
        const sortedExpenseDates = Array.from(expenseDates).sort();

        // If no expenses ever, the streak is from start usage? 
        // Let's assume start derived from first transaction or account creation.
        // For simplicity, if no expenses, highest streak is same as current streak (or undefined big number).
        // Let's rely on transactions. If empty, streak is length of usage? 
        // Let's assume: if transactions exist, we measure gaps.

        let maxStreak = streak; // At least current streak

        if (sortedExpenseDates.length > 0) {
            // Gap before first expense? Maybe too complex to guess start date.
            // Let's only measure gaps BETWEEN expenses and AFTER last expense.

            for (let i = 0; i < sortedExpenseDates.length - 1; i++) {
                const d1 = new Date(sortedExpenseDates[i]);
                const d2 = new Date(sortedExpenseDates[i + 1]);

                const diffTime = Math.abs(d2.getTime() - d1.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1; // -1 because gap is days BETWEEN

                if (diffDays > 0) {
                    maxStreak = Math.max(maxStreak, diffDays);
                }
            }

            // Also check gap from last expense to today
            const lastExpenseDate = new Date(sortedExpenseDates[sortedExpenseDates.length - 1]);
            const diffToToday = Math.abs(today.getTime() - lastExpenseDate.getTime());
            // if last expense was yesterday (diff 1 day), gap is 0. 
            const daysSinceLast = Math.floor(diffToToday / (1000 * 60 * 60 * 24)); // Days since

            // If I spent today, daysSinceLast is 0.
            // If I spent yesterday, daysSinceLast is 1. No spend streak is 0? Or 1?
            // If I spent yesterday (e.g. 1st), today is 2nd. Gap is 0 days between? 
            // Wait, streak logic above handles the "tail". We just need to make sure maxStreak captures it.
            // Since `streak` (current streak) is calculated correctly from today backwards, 
            // `maxStreak = Math.max(maxStreak, streak)` covers the "gap after last expense" case.
            maxStreak = Math.max(maxStreak, streak);
        } else {
            // No expenses at all.
            // Fallback: 0 or maybe just show current streak which might be huge?
            // Let's stick to current.
            maxStreak = streak;
        }

        // Calendar Data
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const calendarDays = [];

        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month, i);
            const dStr = d.toISOString().split('T')[0];
            const isNoSpend = !expenseDates.has(dStr) && d <= today; // Only count past/today as no-spend
            calendarDays.push({
                day: i,
                isNoSpend,
                hasExpense: expenseDates.has(dStr),
                isToday: dStr === todayStr,
                date: d
            });
        }

        return { streak, highestStreak: maxStreak, calendarDays };
    }, [transactions, loading]);

    if (loading) {
        return <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />;
    }

    if (!stats) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        <Flame className={`h-5 w-5 ${stats.streak > 0 ? "fill-emerald-500 text-emerald-500" : "text-zinc-400"}`} />
                        No Spend Streak
                    </h3>
                    <p className="text-sm text-zinc-500">Days saved</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                        <Trophy className="h-3 w-3" />
                        Best: {stats.highestStreak}
                    </div>
                </div>
            </div>

            <div className="mb-4 flex items-center justify-center py-2">
                <div className="text-center">
                    <div className={`text-4xl font-black ${stats.streak > 0 ? "text-emerald-500" : "text-zinc-300 dark:text-zinc-700"}`}>
                        {stats.streak}
                    </div>
                    <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-1">
                        Current Streak
                    </div>
                </div>
            </div>

            <div className="mt-auto">
                <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
                    <Calendar className="h-3 w-3" />
                    <span>This Month</span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {stats.calendarDays.map((d) => (
                        <div
                            key={d.day}
                            className={`
                                h-2 w-full rounded-full transition-all
                                ${d.hasExpense
                                    ? "bg-rose-500 opacity-80"  // Spent
                                    : d.date <= new Date()
                                        ? "bg-emerald-500"      // No Spend
                                        : "bg-zinc-100 dark:bg-zinc-800" // Future
                                }
                                ${d.isToday ? "ring-1 ring-zinc-400 dark:ring-zinc-500" : ""}
                            `}
                            title={`Day ${d.day}${d.hasExpense ? ": Spent money" : ": No spend!"}`}
                        />
                    ))}
                </div>
                {stats.streak === 0 && (
                    <p className="mt-3 text-center text-xs text-zinc-500">
                        You spent money today! Streak reset.
                    </p>
                )}
                {stats.streak > 0 && (
                    <p className="mt-3 text-center text-xs text-emerald-600 dark:text-emerald-400">
                        {stats.streak} days free! Keep saving! 💰
                    </p>
                )}
            </div>
        </motion.div>
    );
}
