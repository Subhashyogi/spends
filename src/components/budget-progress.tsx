"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface BudgetProgressProps {
    budgets: any[];
    transactions: any[];
    categories: any[];
}

export default function BudgetProgress({ budgets, transactions, categories }: BudgetProgressProps) {
    const budgetStatus = useMemo(() => {
        if (!budgets || !transactions) return [];

        return budgets.map((budget) => {
            const category = categories.find((c) => c._id === budget.categoryId || c.name === budget.category);
            const categoryName = category ? category.name : budget.category;

            // Filter transactions for this budget's category and month
            const spent = transactions
                .filter((t) => {
                    const txDate = new Date(t.date);
                    const currentMonth = new Date().getMonth();
                    const currentYear = new Date().getFullYear();

                    // Match category (loose match for name or ID)
                    const catMatch = t.category === categoryName || t.categoryId === budget.categoryId;

                    return (
                        t.type === "expense" &&
                        catMatch &&
                        txDate.getMonth() === currentMonth &&
                        txDate.getFullYear() === currentYear
                    );
                })
                .reduce((acc, curr) => acc + curr.amount, 0);

            const percentage = Math.min((spent / budget.amount) * 100, 100);

            return {
                ...budget,
                categoryName,
                spent,
                percentage,
                isOverBudget: spent > budget.amount,
            };
        });
    }, [budgets, transactions, categories]);

    if (budgetStatus.length === 0) {
        return (
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Monthly Budgets</h3>
                <p className="text-sm text-zinc-500">No budgets set for this month.</p>
            </div>
        );
    }

    return (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Monthly Budgets</h3>
            <div className="space-y-6">
                {budgetStatus.map((item) => (
                    <div key={item._id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">{item.categoryName}</span>
                            <div className="flex items-center gap-2">
                                <span className={`font-medium ${item.isOverBudget ? "text-rose-600" : "text-zinc-600 dark:text-zinc-400"}`}>
                                    ₹{item.spent} <span className="text-zinc-400">/ ₹{item.amount}</span>
                                </span>
                                {item.isOverBudget && <AlertTriangle className="h-4 w-4 text-rose-500" />}
                            </div>
                        </div>

                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.percentage}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={`h-full rounded-full ${item.isOverBudget
                                    ? "bg-rose-500"
                                    : item.percentage > 80
                                        ? "bg-amber-500"
                                        : "bg-emerald-500"
                                    }`}
                            />
                        </div>

                        {item.isOverBudget && (
                            <p className="text-xs text-rose-500">You've exceeded your budget by ₹{item.spent - item.amount}</p>
                        )}
                    </div>
                ))}

                {/* Subscription Summary */}
                <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                            </span>
                            <span className="font-medium text-zinc-700 dark:text-zinc-300">Subscriptions</span>
                        </div>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            ₹{transactions.filter(t => t.isSubscription && new Date(t.date).getMonth() === new Date().getMonth()).reduce((acc, curr) => acc + curr.amount, 0)}
                            <span className="text-xs text-zinc-500 font-normal ml-1">this month</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
