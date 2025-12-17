"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/ui/button";

export default function GoalPlanner() {
    const [goals, setGoals] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [newGoal, setNewGoal] = useState({ title: '', targetAmount: '', deadline: '' });
    const [loading, setLoading] = useState(true);

    const fetchGoals = () => {
        fetch("/api/goals")
            .then(res => res.json())
            .then(d => {
                setGoals(d);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchGoals();
        window.addEventListener("transactionsUpdated", fetchGoals);
        return () => window.removeEventListener("transactionsUpdated", fetchGoals);
    }, []);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        await fetch("/api/goals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newGoal)
        });
        setShowForm(false);
        setNewGoal({ title: '', targetAmount: '', deadline: '' });
        fetchGoals();
    };

    if (loading) return null;

    return (

        <div className="glass rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span className="p-1 rounded bg-blue-500/20 text-blue-500">🎯</span>
                    Goal Planner
                </h3>
                <Button onClick={() => setShowForm(!showForm)} size="sm">
                    {showForm ? 'Cancel' : '+ New Goal'}
                </Button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.form
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        onSubmit={handleSubmit}
                        className="mb-6 space-y-4 overflow-hidden"
                    >
                        <input
                            placeholder="Goal Title (e.g., Vacation)"
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-zinc-900 dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-zinc-100"
                            value={newGoal.title}
                            onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                            required
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="number"
                                placeholder="Target Amount"
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-zinc-900 dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-zinc-100"
                                value={newGoal.targetAmount}
                                onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                                required
                            />
                            <input
                                type="date"
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-zinc-900 dark:bg-zinc-800/50 dark:border-zinc-700 dark:text-zinc-100"
                                value={newGoal.deadline}
                                onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full">Create Plan</Button>
                    </motion.form>
                )}
            </AnimatePresence>

            <div className="space-y-4">
                {goals.length === 0 && !showForm && (
                    <div className="text-center text-zinc-500 py-8">
                        No goals set yet. Start planning!
                    </div>
                )}

                {goals.map((goal) => (
                    <div key={goal._id} className="rounded-xl p-5 border border-zinc-200 bg-white/50 dark:bg-zinc-800/30 dark:border-zinc-700/50 space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="text-zinc-900 dark:text-zinc-100 font-bold text-lg">{goal.title}</h4>
                                <p className="text-sm text-zinc-500">Target: ₹{goal.targetAmount.toLocaleString()}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${goal.analysis?.onTrack ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                                {goal.analysis?.onTrack ? 'ON TRACK' : 'NEEDS ACTION'}
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500"
                                style={{ width: `${(goal.currentAmount / goal.targetAmount) * 100}%` }}
                            />
                        </div>

                        {/* Analysis Section */}
                        {goal.analysis && (
                            <div className="bg-black/20 rounded-lg p-3 text-sm space-y-2">
                                <div className="flex justify-between text-gray-400 text-xs">
                                    <span>Projected Completion: {goal.analysis.projectedMonths} months</span>
                                    <span>Req. Savings: ₹{Math.round(goal.analysis.requiredMonthly)}/mo</span>
                                </div>
                                {goal.analysis.suggestions.length > 0 && (
                                    <div className="text-gray-300 flex gap-2 items-start">
                                        <span>💡</span>
                                        <p>{goal.analysis.suggestions[0]}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
