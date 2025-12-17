"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Lightbulb, Sparkles, TrendingDown, PiggyBank, ArrowRight } from "lucide-react";
import { safeJson } from "@/lib/http";

type Txn = {
    _id: string;
    type: "income" | "expense";
    amount: number;
    date: string;
    category?: string;
};

// Simple heuristic for "Needs" vs "Wants"
const NEEDS = ["rent", "bills", "groceries", "utilities", "health", "education", "transport", "fare", "fuel"];
const WANTS = ["entertainment", "shopping", "dining", "travel", "subscriptions", "hobbies", "snacks", "food"];

export default function SavingsAdvisorCard() {
    const [transactions, setTransactions] = useState<Txn[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/transactions?limit=1000");
                const json = await safeJson(res);
                if (json.ok) setTransactions(json.data.data || json.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const advice = useMemo(() => {
        if (!transactions.length) return null;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Filter for current month
        const currentMonthTxns = transactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const income = currentMonthTxns.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
        const expenses = currentMonthTxns.filter(t => t.type === "expense");
        const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

        // Analyze Categories
        const categoryTotals: Record<string, number> = {};
        expenses.forEach(t => {
            const cat = (t.category || "uncategorized").toLowerCase();
            categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
        });

        // Identify "Wants"
        let wantsTotal = 0;
        let biggestWant = { name: "", amount: 0 };

        Object.entries(categoryTotals).forEach(([cat, amount]) => {
            // Check if it's a known want or not a known need (assuming unknown = want for safety in saving)
            const isNeed = NEEDS.some(n => cat.includes(n));
            if (!isNeed) {
                wantsTotal += amount;
                if (amount > biggestWant.amount) {
                    biggestWant = { name: cat, amount };
                }
            }
        });

        // Recommendations
        const potentialSavings = wantsTotal * 0.20; // Suggest cutting 20% of wants
        const weeklySavingsTarget = (income * 0.20) / 4; // Target saving 20% of income

        // Optimal Pattern (50/30/20 Rule Check)
        const needsTotal = totalExpense - wantsTotal;
        const needsPct = income ? Math.round((needsTotal / income) * 100) : 0;
        const wantsPct = income ? Math.round((wantsTotal / income) * 100) : 0;
        const savingsPct = income ? Math.round(((income - totalExpense) / income) * 100) : 0;

        return {
            weeklySavingsTarget,
            potentialSavings,
            biggestWant,
            needsPct,
            wantsPct,
            savingsPct,
            totalExpense
        };
    }, [transactions]);

    if (loading) return <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />;
    if (!advice) return null;

    const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass rounded-3xl p-6 border-emerald-500/10"
        >
            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                    <Sparkles className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">AI Savings Advisor</h3>
                    <p className="text-xs text-zinc-500">Smart recommendations to optimize your budget</p>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                {/* Weekly Target */}
                <div className="glass rounded-2xl p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-emerald-600">
                        <PiggyBank className="h-3.5 w-3.5" /> Recommended Weekly Save
                    </div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        {fmt(advice.weeklySavingsTarget || 500)}
                    </div>
                    <div className="mt-1 text-[10px] text-zinc-400">
                        Based on 20% of your income
                    </div>
                </div>

                {/* Expense Cut Tip */}
                <div className="glass rounded-2xl p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-rose-500">
                        <TrendingDown className="h-3.5 w-3.5" /> Potential Cut
                    </div>
                    <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Reduce <span className="font-bold text-zinc-900 dark:text-zinc-100">{advice.biggestWant.name || "Expenses"}</span>
                    </div>
                    <div className="mt-1 text-[10px] text-zinc-400">
                        Save ~{fmt(advice.potentialSavings || 100)} by cutting 20% here
                    </div>
                </div>
            </div>

            {/* Optimal Pattern Analysis */}
            <div className="glass mt-6 rounded-2xl p-4">
                <h4 className="mb-3 flex items-center gap-2 text-xs font-medium text-zinc-500">
                    <Lightbulb className="h-3.5 w-3.5" /> Spending Pattern Analysis
                </h4>
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-600 dark:text-zinc-400">Needs (Target 50%)</span>
                        <span className={`font-medium ${advice.needsPct > 60 ? 'text-rose-500' : 'text-zinc-900 dark:text-zinc-100'}`}>{advice.needsPct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div className="h-full bg-indigo-500 transition-all" style={{ width: `${Math.min(100, advice.needsPct)}%` }} />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-600 dark:text-zinc-400">Wants (Target 30%)</span>
                        <span className={`font-medium ${advice.wantsPct > 40 ? 'text-rose-500' : 'text-zinc-900 dark:text-zinc-100'}`}>{advice.wantsPct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div className="h-full bg-rose-400 transition-all" style={{ width: `${Math.min(100, advice.wantsPct)}%` }} />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-600 dark:text-zinc-400">Savings (Target 20%)</span>
                        <span className={`font-medium ${advice.savingsPct < 10 ? 'text-rose-500' : 'text-emerald-500'}`}>{advice.savingsPct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, advice.savingsPct)}%` }} />
                    </div>
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-indigo-50 p-3 text-[11px] text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <p>
                        {advice.savingsPct < 20
                            ? "You're saving less than recommended. Try cutting down on discretionary spending like " + (advice.biggestWant.name || "shopping") + "."
                            : "Great job! You're hitting a healthy savings rate. Consider investing the surplus."}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
