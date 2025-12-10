"use client";

import { useMemo } from "react";
import { format, eachDayOfInterval, subDays, isSameDay } from "date-fns";
import { motion } from "framer-motion";

interface HeatmapProps {
    data: { date: string; value: number }[];
}

export default function SpendingHeatmap({ data }: HeatmapProps) {
    // Generate last 365 days (or less for mobile)
    const days = useMemo(() => {
        const end = new Date();
        const start = subDays(end, 120); // Last 4 months for cleaner view
        return eachDayOfInterval({ start, end });
    }, []);

    const getColor = (amount: number) => {
        if (amount === 0) return "bg-zinc-100 dark:bg-zinc-800/50";
        if (amount < 500) return "bg-emerald-200 dark:bg-emerald-900/40";
        if (amount < 2000) return "bg-emerald-400 dark:bg-emerald-700/60";
        if (amount < 5000) return "bg-emerald-500 dark:bg-emerald-600";
        return "bg-emerald-600 dark:bg-emerald-500";
    };

    return (
        <div className="rounded-3xl border border-zinc-200/50 bg-white/50 p-6 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/50">
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Spending Intensity (Last 4 Months)
            </h3>

            <div className="flex flex-wrap gap-1">
                {days.map((day, i) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const dayData = data.find(d => d.date === dateStr);
                    const amount = dayData?.value || 0;

                    return (
                        <motion.div
                            key={dateStr}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.005 }}
                            className={`h-3 w-3 rounded-sm ${getColor(amount)} cursor-pointer relative group`}
                        >
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                                <div className="bg-black/80 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                                    {format(day, "MMM dd")}: ₹{amount}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-zinc-500">
                <span>Less</span>
                <div className="flex gap-1">
                    <div className="h-3 w-3 rounded-sm bg-zinc-100 dark:bg-zinc-800/50" />
                    <div className="h-3 w-3 rounded-sm bg-emerald-200 dark:bg-emerald-900/40" />
                    <div className="h-3 w-3 rounded-sm bg-emerald-400 dark:bg-emerald-700/60" />
                    <div className="h-3 w-3 rounded-sm bg-emerald-600 dark:bg-emerald-500" />
                </div>
                <span>More</span>
            </div>
        </div>
    );
}
