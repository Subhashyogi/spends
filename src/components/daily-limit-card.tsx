"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { safeJson } from "@/lib/http";
import { Calculator, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";

type Budget = {
    _id: string;
    month: string;
    amount: number;
    category?: string | null;
    spent?: number;
    effectiveAmount?: number;
};

export default function DailyLimitCard() {
    const [budget, setBudget] = useState<Budget | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const d = new Date();
                const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                const res = await fetch(`/api/budgets?month=${encodeURIComponent(month)}`);
                const { ok, data } = await safeJson(res);

                if (ok) {
                    const budgets: Budget[] = data.data || data;
                    // Find the total budget (where category is null/undefined)
                    const total = budgets.find(b => !b.category);
                    setBudget(total || null);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const stats = useMemo(() => {
        if (!budget) return null;

        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysPassed = now.getDate(); // Including today as passed for calculation simplicity or remaining?
        // Usually "remaining days" includes today if we haven't spent yet, but let's say remaining days = daysInMonth - daysPassed + 1 (if we count today)
        // Let's be strict: Remaining days = Total days - Current Day Number + 1 (to include today)
        const daysLeft = Math.max(1, daysInMonth - daysPassed + 1);

        const effectiveTotal = budget.effectiveAmount ?? budget.amount;
        const spent = budget.spent ?? 0;
        const remaining = effectiveTotal - spent;

        const dailyLimit = remaining > 0 ? remaining / daysLeft : 0;

        let status: "good" | "tight" | "danger" = "good";
        if (remaining <= 0) status = "danger";
        else if (dailyLimit < (effectiveTotal / daysInMonth) * 0.5) status = "tight"; // If limit is < 50% of average daily budget

        return {
            dailyLimit,
            daysLeft,
            remaining,
            effectiveTotal,
            spent,
            status
        };
    }, [budget]);

    if (loading) {
        return <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />;
    }

    if (!budget) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex h-48 flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center dark:border-zinc-700 dark:bg-zinc-900/50"
            >
                <Calculator className="mb-2 h-8 w-8 text-zinc-400" />
                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">No Monthly Budget</h3>
                <p className="mb-4 text-xs text-zinc-500">Set a budget to see your daily limit.</p>
                <Link href="/budgets" className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
                    Set Budget
                </Link>
            </motion.div>
        );
    }

    if (!stats) return null;

    const statusColor = {
        good: "text-emerald-600 dark:text-emerald-400",
        tight: "text-amber-600 dark:text-amber-400",
        danger: "text-rose-600 dark:text-rose-400"
    };

    const statusBg = {
        good: "bg-emerald-50 dark:bg-emerald-900/20",
        tight: "bg-amber-50 dark:bg-amber-900/20",
        danger: "bg-rose-50 dark:bg-rose-900/20"
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col justify-between rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        <Calculator className="h-5 w-5 text-indigo-500" />
                        Daily Limit
                    </h3>
                    <p className="text-sm text-zinc-500">Safe spending cap</p>
                </div>
                <div className={`rounded-full p-2 ${statusBg[stats.status]}`}>
                    {stats.status === "good" && <CheckCircle2 className={`h-5 w-5 ${statusColor.good}`} />}
                    {stats.status === "tight" && <AlertTriangle className={`h-5 w-5 ${statusColor.tight}`} />}
                    {stats.status === "danger" && <AlertCircle className={`h-5 w-5 ${statusColor.danger}`} />}
                </div>
            </div>

            <div className="mt-6">
                <div className={`text-3xl font-bold ${statusColor[stats.status]}`}>
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats.dailyLimit)}
                    <span className="text-lg font-normal text-zinc-500">/day</span>
                </div>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    You have <span className="font-medium text-zinc-900 dark:text-zinc-100">{stats.daysLeft} days</span> left to spend <span className="font-medium text-zinc-900 dark:text-zinc-100">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats.remaining)}</span>.
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
                    <div>
                        <span className="block text-[10px] uppercase tracking-wider">Budget</span>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats.effectiveTotal)}
                        </span>
                    </div>
                    <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
                    <div>
                        <span className="block text-[10px] uppercase tracking-wider">Spent</span>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats.spent)}
                        </span>
                    </div>
                </div>
            </div>

            {stats.status === "danger" && (
                <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
                    You have exceeded your budget or have very little left. Stop spending!
                </div>
            )}

            {stats.status === "tight" && (
                <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                    Budget is getting tight. Try to spend less than the limit.
                </div>
            )}
        </motion.div>
    );
}
