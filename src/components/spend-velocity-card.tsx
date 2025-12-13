"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { safeJson } from "@/lib/http";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from "recharts";
import { Zap, AlertTriangle, Clock } from "lucide-react";

type Transaction = {
    _id: string;
    type: "income" | "expense";
    amount: number;
    date: string;
};

export default function SpendVelocityCard() {
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
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const daysPassed = Math.max(1, now.getDate());

        // Filter for this month
        const thisMonthTx = transactions.filter(t => new Date(t.date) >= startOfMonth);

        const totalIncome = thisMonthTx
            .filter(t => t.type === "income")
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = thisMonthTx
            .filter(t => t.type === "expense")
            .reduce((sum, t) => sum + t.amount, 0);

        const currentBalance = Math.max(0, totalIncome - totalExpense); // Simplified balance for this month context

        // Velocity: Average daily spend
        const velocity = totalExpense / daysPassed;

        // Runway: Days until balance hits 0 at current velocity
        const runway = velocity > 0 ? currentBalance / velocity : Infinity;

        // Projection Data
        const data = [];
        let cumulativeSpend = 0;

        // Past days
        for (let i = 1; i <= daysPassed; i++) {
            const dayStr = new Date(now.getFullYear(), now.getMonth(), i).toISOString().slice(0, 10);
            const daySpend = thisMonthTx
                .filter(t => t.type === "expense" && t.date.startsWith(dayStr))
                .reduce((sum, t) => sum + t.amount, 0);
            cumulativeSpend += daySpend;
            data.push({ day: i, actual: cumulativeSpend, projected: null, limit: totalIncome });
        }

        // Future days (next 7 days or until end of month)
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        let projectedSpend = cumulativeSpend;

        for (let i = daysPassed + 1; i <= daysInMonth; i++) {
            projectedSpend += velocity;
            data.push({ day: i, actual: null, projected: projectedSpend, limit: totalIncome });
        }

        return {
            velocity,
            runway,
            currentBalance,
            data,
            isDangerous: runway < 7 && runway !== Infinity // Less than a week left
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
                        <Zap className="h-5 w-5 text-amber-500" />
                        Spend Velocity
                    </h3>
                    <p className="text-sm text-zinc-500">Tracking your burn rate</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats.velocity)}
                        <span className="text-sm font-normal text-zinc-500">/day</span>
                    </div>
                </div>
            </div>

            {stats.isDangerous && (
                <div className="mb-6 flex items-center gap-3 rounded-xl bg-rose-50 p-4 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <div className="text-sm font-medium">
                        Warning: At this rate, you might run out of funds in <span className="font-bold">{Math.floor(stats.runway)} days</span>.
                    </div>
                </div>
            )}

            {!stats.isDangerous && stats.runway !== Infinity && (
                <div className="mb-6 flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                    <Clock className="h-5 w-5 flex-shrink-0" />
                    <div className="text-sm font-medium">
                        Safe Runway: Funds will last <span className="font-bold">{Math.floor(stats.runway)} days</span> at current pace.
                    </div>
                </div>
            )}

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                        <XAxis
                            dataKey="day"
                            stroke="#a1a1aa"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
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
                        />
                        <ReferenceLine y={stats.data[0]?.limit} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Income Limit", fill: "#ef4444", fontSize: 10 }} />
                        <Line
                            type="monotone"
                            dataKey="actual"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            dot={false}
                            name="Actual Spend"
                        />
                        <Line
                            type="monotone"
                            dataKey="projected"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                            name="Projected"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
