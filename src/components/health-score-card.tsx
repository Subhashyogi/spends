"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { safeJson } from "@/lib/http";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Trophy, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from "lucide-react";

type Transaction = {
    _id: string;
    type: "income" | "expense";
    amount: number;
    date: string;
};

type Budget = {
    _id: string;
    amount: number;
    spent?: number;
    effectiveAmount?: number;
};

export default function HealthScoreCard() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [txRes, budgetRes] = await Promise.all([
                    fetch("/api/transactions?limit=1000"),
                    fetch(`/api/budgets?month=${new Date().toISOString().slice(0, 7)}`)
                ]);

                const txJson = await safeJson(txRes);
                const budgetJson = await safeJson(budgetRes);

                if (txJson.ok) setTransactions(txJson.data.data || txJson.data);
                if (budgetJson.ok) setBudgets(budgetJson.data.data || budgetJson.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const scoreData = useMemo(() => {
        if (loading) return null;

        const now = new Date();
        const currentMonth = now.toISOString().slice(0, 7);
        const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonth = prevMonthDate.toISOString().slice(0, 7);

        // 1. Budget Adherence (Max 50)
        let adherenceScore = 50;
        let overBudgetCount = 0;
        budgets.forEach(b => {
            const limit = b.effectiveAmount ?? b.amount;
            const spent = b.spent ?? 0;
            if (spent > limit && limit > 0) {
                overBudgetCount++;
                adherenceScore -= 10;
            }
        });
        adherenceScore = Math.max(0, adherenceScore);

        // 2. Savings Rate (Max 30)
        const currentTx = transactions.filter(t => t.date.startsWith(currentMonth));
        const income = currentTx.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
        const expense = currentTx.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

        let savingsScore = 0;
        let savingsRate = 0;
        if (income > 0) {
            savingsRate = ((income - expense) / income) * 100;
            if (savingsRate >= 20) savingsScore = 30;
            else if (savingsRate > 0) savingsScore = 15;
        }

        // 3. Trend (Max 20)
        const prevTx = transactions.filter(t => t.date.startsWith(prevMonth));
        const prevExpense = prevTx.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

        let trendScore = 0;
        if (prevExpense > 0) {
            if (expense <= prevExpense) trendScore = 20;
            else if (expense <= prevExpense * 1.1) trendScore = 10; // Within 10% increase
        } else if (expense === 0) {
            trendScore = 20; // No spending yet is good? Or neutral. Let's say good.
        }

        const totalScore = adherenceScore + savingsScore + trendScore;

        let level = "Financial Novice";
        let color = "#ef4444"; // red
        if (totalScore >= 80) { level = "Budget Master"; color = "#10b981"; } // emerald
        else if (totalScore >= 60) { level = "Smart Saver"; color = "#8b5cf6"; } // violet
        else if (totalScore >= 40) { level = "On Track"; color = "#f59e0b"; } // amber

        return {
            totalScore,
            level,
            color,
            breakdown: {
                adherence: { score: adherenceScore, max: 50, label: "Budget Adherence", icon: AlertCircle },
                savings: { score: savingsScore, max: 30, label: "Savings Rate", icon: Trophy },
                trend: { score: trendScore, max: 20, label: "Spending Trend", icon: TrendingUp },
            },
            stats: {
                overBudgetCount,
                savingsRate: Math.round(savingsRate),
                expenseTrend: prevExpense > 0 ? Math.round(((expense - prevExpense) / prevExpense) * 100) : 0
            }
        };
    }, [transactions, budgets, loading]);

    if (loading) {
        return <div className="h-64 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />;
    }

    if (!scoreData) return null;

    const gaugeData = [
        { name: "Score", value: scoreData.totalScore, color: scoreData.color },
        { name: "Remaining", value: 100 - scoreData.totalScore, color: "transparent" }, // transparent track handled by background
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Financial Health</h3>
                    <p className="text-sm text-zinc-500">Your monthly financial wellness score</p>
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-medium text-white`} style={{ backgroundColor: scoreData.color }}>
                    {scoreData.level}
                </div>
            </div>

            <div className="mt-6 flex flex-col items-center sm:flex-row sm:gap-8">
                {/* Gauge */}
                <div className="relative h-40 w-40 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={[{ value: 100 }]}
                                dataKey="value"
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={70}
                                fill="#e4e4e7" // zinc-200
                                stroke="none"
                                startAngle={90}
                                endAngle={-270}
                            />
                            <Pie
                                data={gaugeData}
                                dataKey="value"
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={70}
                                startAngle={90}
                                endAngle={-270}
                                cornerRadius={10}
                                stroke="none"
                            >
                                {gaugeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">{scoreData.totalScore}</span>
                        <span className="text-xs font-medium text-zinc-400">/ 100</span>
                    </div>
                </div>

                {/* Breakdown */}
                <div className="mt-6 w-full space-y-4 sm:mt-0">
                    {Object.values(scoreData.breakdown).map((item) => (
                        <div key={item.label} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 ${item.score === item.max ? "text-emerald-500" : "text-zinc-500"
                                    }`}>
                                    <item.icon className="h-4 w-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{item.label}</div>
                                    <div className="text-[10px] text-zinc-400">
                                        {item.label === "Budget Adherence" && (scoreData.stats.overBudgetCount === 0 ? "No budgets exceeded" : `${scoreData.stats.overBudgetCount} budgets exceeded`)}
                                        {item.label === "Savings Rate" && `${scoreData.stats.savingsRate}% savings rate`}
                                        {item.label === "Spending Trend" && (scoreData.stats.expenseTrend <= 0 ? `${Math.abs(scoreData.stats.expenseTrend)}% less than last month` : `${scoreData.stats.expenseTrend}% more than last month`)}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${(item.score / item.max) * 100}%`,
                                            backgroundColor: scoreData.color
                                        }}
                                    />
                                </div>
                                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{item.score}/{item.max}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
