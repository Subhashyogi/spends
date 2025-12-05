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

        let streak = 0;
        let currentCheck = new Date(today);

        // Check if we have an expense today. If not, check yesterday to start the streak.
        // If we missed today, the streak is technically 0 unless we count "active streak" as "up to yesterday".
        // Usually, a streak is kept alive if you do it today. If you haven't done it today yet, 
        // some apps show the streak from yesterday but say "continue your streak".
        // Let's say: if today has expense -> streak includes today.
        // If today NO expense, but yesterday YES -> streak is from yesterday.
        // If today NO and yesterday NO -> streak broken (0).

        let checkStr = currentCheck.toISOString().split('T')[0];
        if (!expenseDates.has(checkStr)) {
            // Try yesterday
            currentCheck.setDate(currentCheck.getDate() - 1);
            checkStr = currentCheck.toISOString().split('T')[0];
            if (!expenseDates.has(checkStr)) {
                streak = 0;
            } else {
                streak = 1;
                currentCheck.setDate(currentCheck.getDate() - 1); // Move to day before yesterday for loop
            }
        } else {
            streak = 1;
            currentCheck.setDate(currentCheck.getDate() - 1); // Move to yesterday for loop
        }

        if (streak > 0) {
            while (true) {
                const str = currentCheck.toISOString().split('T')[0];
                if (expenseDates.has(str)) {
                    streak++;
                    currentCheck.setDate(currentCheck.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        // Calendar Data for current month
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const calendarDays = [];

        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month, i);
            const dStr = d.toISOString().split('T')[0];
            calendarDays.push({
                day: i,
                hasExpense: expenseDates.has(dStr),
                isToday: dStr === todayStr,
                date: d
            });
        }

        return { streak, calendarDays };
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
                        <Flame className={`h-5 w-5 ${stats.streak > 0 ? "fill-orange-500 text-orange-500" : "text-zinc-400"}`} />
                        Streak
                    </h3>
                    <p className="text-sm text-zinc-500">Daily expense tracking</p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                    <Trophy className="h-3 w-3" />
                    {stats.streak} Day{stats.streak !== 1 ? 's' : ''}
                </div>
            </div>

            <div className="mb-4 flex items-center justify-center py-2">
                <div className="text-center">
                    <div className={`text-4xl font-black ${stats.streak > 0 ? "text-orange-500" : "text-zinc-300 dark:text-zinc-700"}`}>
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
                                ${d.hasExpense ? "bg-orange-500" : "bg-zinc-100 dark:bg-zinc-800"}
                                ${d.isToday ? "ring-1 ring-zinc-400 dark:ring-zinc-500" : ""}
                            `}
                            title={`Day ${d.day}${d.hasExpense ? ": Expense added" : ""}`}
                        />
                    ))}
                </div>
                {stats.streak === 0 && (
                    <p className="mt-3 text-center text-xs text-zinc-500">
                        Add an expense today to start your streak!
                    </p>
                )}
                {stats.streak > 0 && (
                    <p className="mt-3 text-center text-xs text-orange-600 dark:text-orange-400">
                        You're on fire! Keep it up! 🔥
                    </p>
                )}
            </div>
        </motion.div>
    );
}
