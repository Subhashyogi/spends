"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
}

export default function StatCard({ title, value, icon: Icon, trend, trendUp }: StatCardProps) {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            className="group relative overflow-hidden rounded-3xl border border-zinc-200/50 bg-white/80 p-4 sm:p-6 shadow-xl shadow-zinc-200/20 backdrop-blur-xl transition-all hover:shadow-2xl hover:shadow-indigo-500/10 dark:border-zinc-800/50 dark:bg-zinc-900/80 dark:shadow-zinc-900/20"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-white/0 opacity-0 transition-opacity group-hover:opacity-100 dark:from-white/5 dark:to-transparent" />

            <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        {title}
                    </p>
                    <h3 className="mt-2 truncate text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        {value}
                    </h3>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-white p-3 shadow-inner shadow-indigo-500/10 dark:from-indigo-900/20 dark:to-zinc-900">
                    <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
            </div>
            {trend && (
                <div className="relative mt-4 flex items-center gap-2">
                    <span
                        className={`flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${trendUp
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                            }`}
                    >
                        {trend}
                    </span>
                    <span className="text-xs text-zinc-500">vs last month</span>
                </div>
            )}
        </motion.div>
    );
}
