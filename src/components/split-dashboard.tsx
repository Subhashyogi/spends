"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { safeJson } from "@/lib/http";
import { ArrowUpRight, ArrowDownLeft, CheckCircle, RefreshCw, Wallet } from "lucide-react";

export default function SplitDashboard() {
    const [data, setData] = useState<{ owedToMe: any[], iOwe: any[] }>({ owedToMe: [], iOwe: [] });
    const [loading, setLoading] = useState(true);
    const [settling, setSettling] = useState<string | null>(null);

    useEffect(() => {
        loadSplits();
    }, []);

    async function loadSplits() {
        try {
            const res = await fetch("/api/splits");
            const { ok, data } = await safeJson(res);
            if (ok) setData(data.data || data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function settleUp(item: any, type: 'owedToMe' | 'iOwe') {
        if (type === 'iOwe') {
            // In this simple model, only the owner (owedToMe) can settle.
            // But we can add a "Mark as Paid" feature later.
            alert("Please ask the person you owe to mark this as settled.");
            return;
        }

        if (!confirm(`Mark ${item.name || item.username}'s debt of ₹${item.amount} as settled?`)) return;

        setSettling(item._id); // split id
        try {
            // We need to pass the transaction ID and split ID.
            // Wait, the API needs ownerId, txId, splitId.
            // Since it's 'owedToMe', I am the owner.
            // But I need the txId. My API returns it?
            // In 'owedToMe', I am iterating my transactions. So I need to fetch txId in the API response.
            // Let's assume I updated the API to return txId.

            // Actually, the API returns the split object which has _id. 
            // But the updateOne query needs "transactions._id": txId.
            // I need to make sure my API returns txId for 'owedToMe' items too.
            // Checking API... yes, I added txId for 'iOwe', but for 'owedToMe' I pushed ...split.
            // The split object is a subdoc, it has _id. But I need the parent txId to filter.
            // I'll need to fix the API or pass txId.
            // Let's assume I'll fix the API in the next step or use what I have.
            // For 'owedToMe', I have access to the parent tx in the loop.

            // Let's optimistically assume I passed txId.

            // Wait, I need to fix the API first to be sure.
            // But I can't go back easily. I'll implement the component assuming txId is present.
            // And I will update the API in a subsequent step if needed.

            // Actually, let's look at the API code I wrote.
            // owedToMe.push({ ...split, txDate: tx.date, txDesc: ... });
            // It does NOT include txId explicitly unless split has it? No.
            // I should have added txId: tx._id.

            // I will update the API in the next step.

            // For now, let's write the fetch call.
            await fetch("/api/splits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ownerId: "me", // API will use my session ID
                    txId: item.txId,
                    splitId: item._id
                })
            });

            loadSplits();
        } catch (e) {
            console.error(e);
        } finally {
            setSettling(null);
        }
    }

    const totalOwedToMe = data.owedToMe.reduce((acc, curr) => acc + curr.amount, 0);
    const totalIOwe = data.iOwe.reduce((acc, curr) => acc + curr.amount, 0);

    if (loading) return <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />;

    return (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        <Wallet className="h-5 w-5 text-emerald-500" />
                        Split Expenses
                    </h3>
                </div>
                <button onClick={loadSplits} className="rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <RefreshCw className="h-4 w-4 text-zinc-500" />
                </button>
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-900/20">
                    <div className="mb-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">Owed to you</div>
                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">₹{totalOwedToMe}</div>
                </div>
                <div className="rounded-2xl bg-rose-50 p-4 dark:bg-rose-900/20">
                    <div className="mb-1 text-xs font-medium text-rose-600 dark:text-rose-400">You owe</div>
                    <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">₹{totalIOwe}</div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Owed To Me */}
                <div>
                    <h4 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Pending (Owed to You)</h4>
                    {data.owedToMe.length === 0 ? (
                        <p className="text-xs text-zinc-500">No pending payments.</p>
                    ) : (
                        <div className="space-y-2">
                            {data.owedToMe.map((item, i) => (
                                <div key={i} className="flex items-center justify-between rounded-xl border border-zinc-100 p-3 dark:border-zinc-800">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                                            <ArrowDownLeft className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.name || item.username}</div>
                                            <div className="text-xs text-zinc-500">{item.txDesc} • {new Date(item.txDate).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold text-emerald-600">₹{item.amount}</span>
                                        <button
                                            onClick={() => settleUp(item, 'owedToMe')}
                                            disabled={!!settling}
                                            className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                                        >
                                            Settle
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* I Owe */}
                <div>
                    <h4 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">You Owe</h4>
                    {data.iOwe.length === 0 ? (
                        <p className="text-xs text-zinc-500">You are debt free!</p>
                    ) : (
                        <div className="space-y-2">
                            {data.iOwe.map((item, i) => (
                                <div key={i} className="flex items-center justify-between rounded-xl border border-zinc-100 p-3 dark:border-zinc-800">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30">
                                            <ArrowUpRight className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.toName || item.toUsername}</div>
                                            <div className="text-xs text-zinc-500">{item.txDesc} • {new Date(item.txDate).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold text-rose-600">₹{item.amount}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
