"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, Calendar, Activity, BrainCircuit } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { safeJson } from "@/lib/http";

type Txn = {
    _id: string;
    type: "income" | "expense";
    amount: number;
    date: string;
    category?: string;
};

export default function PredictorCard() {
    const [transactions, setTransactions] = useState<Txn[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/transactions?limit=1000"); // Fetch enough history
                const json = await safeJson(res);
                if (json.ok) setTransactions(json.data.data || json.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const stats = useMemo(() => {
        if (!transactions.length) return null;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const today = now.getDate();
        const daysRemaining = daysInMonth - today;

        // Filter expenses
        const expenses = transactions.filter(t => t.type === "expense");

        // Calculate Average Daily Spend (ADS) based on last 30 days
        const last30Days = expenses.filter(t => {
            const d = new Date(t.date);
            const diffTime = Math.abs(now.getTime() - d.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 30;
        });

        // Find the earliest expense date within the last 30 days
        const earliestExpense = last30Days.reduce((min, t) => (new Date(t.date) < new Date(min) ? t.date : min), new Date().toISOString());

        const daysSinceFirst = Math.max(1, Math.ceil(Math.abs(now.getTime() - new Date(earliestExpense).getTime()) / (1000 * 60 * 60 * 24)));
        const divisor = Math.min(daysSinceFirst, 30);

        const totalLast30 = last30Days.reduce((sum, t) => sum + t.amount, 0);
        const ads = totalLast30 / divisor;

        // Predictions
        const tomorrow = ads;
        const nextWeek = ads * 7;
        const nextMonth = ads * 30;

        // Current Month Projection
        const currentMonthExpenses = expenses.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const currentMonthTotal = currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
        const projectedTotal = currentMonthTotal + (ads * daysRemaining);

        // Category Overshoot
        const categoryTotals: Record<string, number> = {};
        currentMonthExpenses.forEach(t => {
            const cat = t.category || "Uncategorized";
            categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
        });

        const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
        const topCategory = sortedCategories[0];
        const overshootCategory = topCategory ? { name: topCategory[0], amount: topCategory[1] } : null;

        // Graph Data
        const graphData = [];
        let cumulative = 0;

        // Fill actual data up to today
        for (let i = 1; i <= today; i++) {
            const dayExpenses = currentMonthExpenses.filter(t => new Date(t.date).getDate() === i);
            const dayTotal = dayExpenses.reduce((sum, t) => sum + t.amount, 0);
            cumulative += dayTotal;
            graphData.push({ day: i, actual: cumulative, predicted: null });
        }

        // Fill predicted data from tomorrow
        let predictedCumulative = cumulative;
        for (let i = today + 1; i <= daysInMonth; i++) {
            predictedCumulative += ads;
            graphData.push({ day: i, actual: null, predicted: predictedCumulative });
        }

        // Connect the lines visually by adding a point at today for predicted
        if (graphData.length > today) {
            // @ts-ignore
            graphData[today - 1].predicted = graphData[today - 1].actual;
        }

        return {
            ads,
            tomorrow,
            nextWeek,
            nextMonth,
            overshootCategory,
            graphData,
            projectedTotal
        };

    }, [transactions]);

    if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />;
    if (!stats) return null;

    const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="col-span-full rounded-3xl border border-zinc-200/50 bg-transparent p-6 dark:border-zinc-800/50"
        >
            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                    <BrainCircuit className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">AI Spend Predictor</h3>
                    <p className="text-xs text-zinc-500">Machine learning powered insights based on your spending habits</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Tomorrow's Prediction */}
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-800">
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-500">
                        <Calendar className="h-3.5 w-3.5" /> Tomorrow
                    </div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        {fmt(stats.tomorrow)}
                    </div>
                    <div className="mt-1 text-[10px] text-zinc-400">
                        Expected daily spend
                    </div>
                </div>

                {/* Next Week Prediction */}
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-800">
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-500">
                        <Activity className="h-3.5 w-3.5" /> Next 7 Days
                    </div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        {fmt(stats.nextWeek)}
                    </div>
                    <div className="mt-1 text-[10px] text-zinc-400">
                        Projected weekly expense
                    </div>
                </div>

                {/* Next Month Prediction */}
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-800">
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-zinc-500">
                        <TrendingUp className="h-3.5 w-3.5" /> Next 30 Days
                    </div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        {fmt(stats.nextMonth)}
                    </div>
                    <div className="mt-1 text-[10px] text-zinc-400">
                        Long term forecast
                    </div>
                </div>

                {/* Category Overshoot */}
                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-100 dark:bg-zinc-900 dark:ring-zinc-800">
                    <div className="mb-2 flex items-center gap-2 text-xs font-medium text-rose-500">
                        <AlertTriangle className="h-3.5 w-3.5" /> High Impact
                    </div>
                    <div className="truncate text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {stats.overshootCategory?.name || "None"}
                    </div>
                    <div className="mt-1 text-[10px] text-zinc-400">
                        Highest spending category ({fmt(stats.overshootCategory?.amount || 0)})
                    </div>
                </div>
            </div>

            {/* Graph */}
            <div className="mt-8 h-[300px] w-full">
                <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Monthly Projection</h4>
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-indigo-500" /> Actual
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-indigo-300/50" /> Predicted
                        </div>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a5b4fc" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#a5b4fc" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" className="dark:stroke-zinc-800" />
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#71717a' }}
                            tickMargin={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#71717a' }}
                            tickFormatter={(value) => `₹${value}`}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [fmt(value), '']}
                            labelFormatter={(label) => `Day ${label}`}
                        />
                        <Area
                            type="monotone"
                            dataKey="actual"
                            stroke="#6366f1"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorActual)"
                        />
                        <Area
                            type="monotone"
                            dataKey="predicted"
                            stroke="#a5b4fc"
                            strokeWidth={3}
                            strokeDasharray="5 5"
                            fillOpacity={1}
                            fill="url(#colorPredicted)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
