"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, Calendar } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

import Link from "next/link";

interface RecentTransactionsProps {
    transactions: any[];
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
    const recent = transactions.slice(0, 5);

    return (
        <div className="glass rounded-3xl p-4 sm:p-6">
            <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Recent Activity
                </h3>
                <Link href="/transactions" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                    View All
                </Link>
            </div>

            <div className="space-y-4">
                {recent.length === 0 ? (
                    <p className="text-center text-sm text-zinc-500">No transactions yet.</p>
                ) : (
                    recent.map((tx, i) => (
                        <motion.div
                            key={tx._id || i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-100/50 p-3 transition-colors hover:bg-zinc-50/50 dark:border-zinc-800/50 dark:hover:bg-zinc-800/50"
                        >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <div
                                    className={`hidden sm:flex h-10 w-10 items-center justify-center rounded-full ${tx.type === "income"
                                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"
                                        : "bg-rose-100 text-rose-600 dark:bg-rose-900/30"
                                        }`}
                                >
                                    {tx.type === "income" ? (
                                        <ArrowUpRight className="h-5 w-5" />
                                    ) : (
                                        <ArrowDownLeft className="h-5 w-5" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2 text-sm sm:text-base">
                                        {tx.description || tx.category}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                        <Calendar className="h-3 w-3" />
                                        {(() => {
                                            const date = new Date(tx.date);
                                            if (isToday(date)) return "Today";
                                            if (isYesterday(date)) return "Yesterday";
                                            return format(date, "MMM d, yyyy");
                                        })()}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p
                                    className={`font-semibold ${tx.type === "income"
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-rose-600 dark:text-rose-400"
                                        }`}
                                >
                                    {tx.type === "income" ? "+" : "-"}₹{tx.amount}
                                </p>
                                <p className="text-xs text-zinc-500">{tx.account}</p>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
