"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { safeJson } from "@/lib/http";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from "recharts";
import { Hexagon, Sparkles } from "lucide-react";

type Transaction = {
    _id: string;
    type: "income" | "expense";
    amount: number;
    category?: string;
};

export default function CategoryRadarChart() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [txRes, catRes] = await Promise.all([
                    fetch("/api/transactions?limit=1000"),
                    fetch("/api/categories")
                ]);

                const txData = await safeJson(txRes);
                const catData = await safeJson(catRes);

                if (txData.ok) setTransactions(txData.data.data || txData.data);
                if (catData.ok) {
                    const cats = (catData.data.data || catData.data)
                        .filter((c: any) => c.type === 'expense')
                        .map((c: any) => c.name);
                    setCategories(cats);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const stats = useMemo(() => {
        if (loading) return null;

        // If no categories yet, maybe derive from transactions or wait
        const activeCategories = categories.length > 0
            ? categories
            : Array.from(new Set(transactions.filter(t => t.type === 'expense').map(t => t.category))).filter(Boolean) as string[];

        if (activeCategories.length === 0) return null;

        const categoryMap = new Map<string, number>();
        activeCategories.forEach(c => categoryMap.set(c.toLowerCase(), 0));

        transactions.forEach(t => {
            if (t.type === "expense" && t.category) {
                const catLower = t.category.toLowerCase();
                if (categoryMap.has(catLower)) {
                    categoryMap.set(catLower, (categoryMap.get(catLower) || 0) + t.amount);
                }
            }
        });

        // Take top 6 categories if too many, to keep radar readable
        const sortedCats = activeCategories.sort((a, b) => {
            const valA = categoryMap.get(a.toLowerCase()) || 0;
            const valB = categoryMap.get(b.toLowerCase()) || 0;
            return valB - valA;
        }).slice(0, 6);

        const data = sortedCats.map(cat => ({
            subject: cat,
            A: categoryMap.get(cat.toLowerCase()) || 0,
            fullMark: 100,
        }));

        let maxVal = 0;
        let dominantCat = "";
        data.forEach(d => {
            if (d.A > maxVal) {
                maxVal = d.A;
                dominantCat = d.subject;
            }
        });

        return { data, dominantCat, totalTracked: maxVal > 0 };
    }, [transactions, categories, loading]);

    if (loading) {
        return <div className="h-64 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />;
    }

    if (!stats || stats.data.length === 0) {
        return (
            <div className="flex h-64 items-center justify-center rounded-3xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                Not enough data for personality chart
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-zinc-200/50 bg-transparent p-6 dark:border-zinc-800/50"
        >
            <div className="mb-2 flex items-center justify-between">
                <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        <Hexagon className="h-5 w-5 text-indigo-500" />
                        Spending Personality
                    </h3>
                    <p className="text-sm text-zinc-500">Your financial footprint</p>
                </div>
                {stats.dominantCat && (
                    <div className="flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
                        <Sparkles className="h-3 w-3" />
                        {stats.dominantCat} Enthusiast
                    </div>
                )}
            </div>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={stats.data}>
                        <PolarGrid stroke="#e4e4e7" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                        <Radar
                            name="Spending"
                            dataKey="A"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            fill="#8b5cf6"
                            fillOpacity={0.3}
                        />
                        <Tooltip
                            formatter={(val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val)}
                            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
