"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { safeJson } from "@/lib/http";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from "recharts";
import { TrendingUp, CalendarDays } from "lucide-react";

type Transaction = {
    _id: string;
    type: "income" | "expense";
    amount: number;
    date: string;
    isRecurring?: boolean;
    frequency?: "daily" | "weekly" | "monthly" | "yearly";
};

export default function CashflowProjectionChart() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/transactions?limit=1000");
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

        const now = new Date();
        const daysToProject = 90;

        // 1. Calculate Current Balance
        const totalIncome = transactions
            .filter(t => t.type === "income")
            .reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = transactions
            .filter(t => t.type === "expense")
            .reduce((sum, t) => sum + t.amount, 0);
        let currentBalance = totalIncome - totalExpense;

        // 2. Identify Recurring Income
        const recurringIncomes = transactions.filter(t => t.type === "income" && t.isRecurring);

        // 3. Calculate Average Daily Spend (ADS) from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentExpenses = transactions.filter(t =>
            t.type === "expense" &&
            new Date(t.date) >= thirtyDaysAgo
        );

        const recentSpendTotal = recentExpenses.reduce((sum, t) => sum + t.amount, 0);

        // Calculate actual days passed in the window to avoid diluting spend for new users
        // If first transaction in window was 5 days ago, divide by 5, not 30.
        let daysDivisor = 30;
        if (recentExpenses.length > 0) {
            const earliestDate = new Date(Math.min(...recentExpenses.map(t => new Date(t.date).getTime())));
            const diffTime = Math.abs(now.getTime() - earliestDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            daysDivisor = Math.max(1, Math.min(30, diffDays));
        } else {
            // No expenses in last 30 days, check if user is new (joined < 30 days ago)? 
            // For now, if no expenses, ADS is 0.
            daysDivisor = 1;
        }

        const ads = recentSpendTotal > 0 ? recentSpendTotal / daysDivisor : 0;

        // 4. Project Future
        const data = [];
        let projectedBalance = currentBalance;

        for (let i = 0; i < daysToProject; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().slice(0, 10);

            // Subtract ADS
            projectedBalance -= ads;

            // Add Recurring Income
            recurringIncomes.forEach(inc => {
                const incDate = new Date(inc.date);
                let matches = false;

                if (inc.frequency === 'monthly') {
                    // Simple check: same day of month
                    if (date.getDate() === incDate.getDate()) matches = true;
                } else if (inc.frequency === 'weekly') {
                    if (date.getDay() === incDate.getDay()) matches = true;
                } else if (inc.frequency === 'daily') {
                    matches = true;
                } else if (inc.frequency === 'yearly') {
                    if (date.getMonth() === incDate.getMonth() && date.getDate() === incDate.getDate()) matches = true;
                }

                if (matches) {
                    projectedBalance += inc.amount;
                }
            });

            data.push({
                date: dateStr,
                balance: Math.round(projectedBalance),
                formattedDate: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
            });
        }

        const minBalance = Math.min(...data.map(d => d.balance));
        const maxBalance = Math.max(...data.map(d => d.balance));

        return {
            data,
            currentBalance,
            ads,
            minBalance,
            maxBalance
        };
    }, [transactions, loading]);

    if (loading) {
        return <div className="h-64 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />;
    }

    if (!stats) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-zinc-200/50 bg-transparent p-6 dark:border-zinc-800/50"
        >
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        <TrendingUp className="h-5 w-5 text-indigo-500" />
                        Cashflow Projection
                    </h3>
                    <p className="text-sm text-zinc-500">90-day forecast based on recurring income & spending</p>
                </div>
                <div className="text-right">
                    <div className="text-xs font-medium text-zinc-500">Projected Daily Spend</div>
                    <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats.ads)}
                    </div>
                </div>
            </div>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.data}>
                        <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                        <XAxis
                            dataKey="formattedDate"
                            stroke="#a1a1aa"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={30}
                        />
                        <YAxis
                            stroke="#a1a1aa"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => `₹${val / 1000}k`}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                            formatter={(val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val)}
                            labelFormatter={(label) => `Date: ${label}`}
                        />
                        <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
                        <Area
                            type="monotone"
                            dataKey="balance"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorBalance)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl bg-indigo-50 p-3 text-xs text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
                <CalendarDays className="h-4 w-4" />
                <span>
                    Projection assumes you continue spending <strong>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats.ads)}/day</strong> and receive recurring income.
                </span>
            </div>
        </motion.div>
    );
}
