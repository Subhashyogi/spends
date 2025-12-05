"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { safeJson } from "@/lib/http";
import Button from "@/components/ui/button";
import { Plus, Trash2, Target, X } from "lucide-react";

type Goal = {
    _id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    color: string;
};

export default function GoalsCard() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [newGoal, setNewGoal] = useState({ name: "", targetAmount: "", currentAmount: "0", color: "#6366f1" });

    async function load() {
        setLoading(true);
        try {
            const res = await fetch("/api/goals");
            const json = await safeJson(res);
            if (json.ok) setGoals(json.data.data || json.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        load();
        setMounted(true);
    }, []);

    async function addGoal(e: React.FormEvent) {
        e.preventDefault();
        try {
            const res = await fetch("/api/goals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newGoal.name,
                    targetAmount: Number(newGoal.targetAmount),
                    currentAmount: Number(newGoal.currentAmount),
                    color: newGoal.color,
                }),
            });
            if (res.ok) {
                setShowAdd(false);
                setNewGoal({ name: "", targetAmount: "", currentAmount: "0", color: "#6366f1" });
                load();
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function deleteGoal(id: string) {
        if (!confirm("Delete this goal?")) return;
        try {
            await fetch(`/api/goals?id=${id}`, { method: "DELETE" });
            load();
        } catch (e) {
            console.error(e);
        }
    }

    async function addFunds(goal: Goal, amount: number) {
        try {
            await fetch("/api/goals", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ _id: goal._id, currentAmount: goal.currentAmount + amount }),
            });
            load();
        } catch (e) {
            console.error(e);
        }
    }

    const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur dark:bg-zinc-900/60"
            >
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                        <Target className="h-4 w-4" /> Savings Goals
                    </h3>
                    <button
                        onClick={() => setShowAdd(true)}
                        className="rounded-full bg-zinc-100 p-1 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>

                {loading && <div className="text-xs text-zinc-500">Loading goals…</div>}

                {!loading && goals.length === 0 && !showAdd && (
                    <div className="text-center text-xs text-zinc-500 py-4">
                        No goals set. Start saving today!
                    </div>
                )}

                <div className="space-y-4">
                    {goals.map((g) => {
                        const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
                        return (
                            <div key={g._id} className="group relative">
                                <div className="mb-1 flex items-center justify-between text-sm">
                                    <span className="font-medium text-zinc-700 dark:text-zinc-200">{g.name}</span>
                                    <span className="text-xs text-zinc-500">
                                        {fmt(g.currentAmount)} / {fmt(g.targetAmount)}
                                    </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                                    <div
                                        className="h-2 transition-all duration-500"
                                        style={{ width: `${pct}%`, backgroundColor: g.color }}
                                    />
                                </div>
                                <div className="mt-1 flex justify-between opacity-0 transition-opacity group-hover:opacity-100">
                                    <button
                                        onClick={() => addFunds(g, 1000)}
                                        className="text-[10px] text-indigo-600 hover:underline dark:text-indigo-400"
                                    >
                                        + {fmt(1000)}
                                    </button>
                                    <button
                                        onClick={() => deleteGoal(g._id)}
                                        className="text-[10px] text-rose-500 hover:underline"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {mounted && showAdd && createPortal(
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">New Goal</h3>
                                <button onClick={() => setShowAdd(false)} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <form onSubmit={addGoal} className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">Goal Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={newGoal.name}
                                        onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                                        className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:text-zinc-200"
                                        placeholder="e.g. New Laptop"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">Target Amount</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={newGoal.targetAmount}
                                        onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                                        className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:text-zinc-200"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">Current Saved</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={newGoal.currentAmount}
                                        onChange={(e) => setNewGoal({ ...newGoal, currentAmount: e.target.value })}
                                        className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:text-zinc-200"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">Color</label>
                                    <div className="flex gap-2">
                                        {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'].map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setNewGoal({ ...newGoal, color: c })}
                                                className={`h-6 w-6 rounded-full border-2 ${newGoal.color === c ? 'border-zinc-900 dark:border-white' : 'border-transparent'}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <Button type="submit" className="w-full">Create Goal</Button>
                            </form>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
