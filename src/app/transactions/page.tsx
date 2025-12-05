"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight, ArrowDownLeft, Calendar, Search, Filter, ArrowLeft } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchTransactions();
    }, []);

    async function fetchTransactions() {
        try {
            const res = await fetch("/api/transactions?limit=100");
            const data = await res.json();
            if (data.data) {
                setTransactions(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch transactions", error);
        } finally {
            setLoading(false);
        }
    }

    const filteredTransactions = transactions.filter((tx) => {
        const matchesFilter = filter === "all" || tx.type === filter;
        const matchesSearch =
            tx.description?.toLowerCase().includes(search.toLowerCase()) ||
            tx.category?.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    // Group by date
    const groupedTransactions = filteredTransactions.reduce((groups, tx) => {
        const date = new Date(tx.date);
        let key = format(date, "yyyy-MM-dd");
        if (isToday(date)) key = "Today";
        else if (isYesterday(date)) key = "Yesterday";
        else key = format(date, "MMMM d, yyyy");

        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(tx);
        return groups;
    }, {} as Record<string, any[]>);

    return (
        <div className="min-h-screen bg-zinc-50 pb-20 dark:bg-black">
            <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-center gap-4">
                    <Link
                        href="/"
                        className="rounded-full bg-white p-2 shadow-sm transition hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                    >
                        <ArrowLeft className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                    </Link>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        All Transactions
                    </h1>
                </div>

                {/* Filters */}
                <div className="mb-6 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-10 pr-4 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {["all", "income", "expense"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${filter === f
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                    : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-20 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupedTransactions).map(([date, txs]) => (
                            <div key={date}>
                                <h3 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                    {date}
                                </h3>
                                <div className="space-y-3">
                                    {(txs as any[]).map((tx: any, i: number) => (
                                        <motion.div
                                            key={tx._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className={`flex h-10 w-10 items-center justify-center rounded-full ${tx.type === "income"
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
                                                <div>
                                                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                                        {tx.description || tx.category}
                                                    </p>
                                                    <p className="text-xs text-zinc-500">{tx.category} • {tx.account}</p>
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
                                                <p className="text-xs text-zinc-500">
                                                    {format(new Date(tx.date), "h:mm a")}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {filteredTransactions.length === 0 && (
                            <div className="py-10 text-center text-zinc-500">
                                No transactions found.
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
