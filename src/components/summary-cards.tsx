"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, PiggyBank, BarChart3, ListOrdered } from "lucide-react";
import { safeJson } from "@/lib/http";

type Summary = {
  incomeTotal: number;
  expenseTotal: number;
  balance: number;
};

export default function SummaryCards({ transactions = [] }: { transactions: any[] }) {
  const [currency, setCurrency] = useState<string>("INR");

  // Calculate stats from transactions prop
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let allIncome = 0;
    let allExpense = 0;
    let monthIncome = 0;
    let monthExpense = 0;
    let txCount = 0;
    const catMap = new Map<string, number>();

    transactions.forEach(t => {
      const d = new Date(t.date);
      // All time
      if (t.type === 'income') allIncome += t.amount;
      if (t.type === 'expense') allExpense += t.amount;

      // Monthly
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        txCount++;
        if (t.type === 'income') monthIncome += t.amount;
        if (t.type === 'expense') {
          monthExpense += t.amount;
          const cat = t.category || 'Uncategorized';
          catMap.set(cat, (catMap.get(cat) || 0) + t.amount);
        }
      }
    });

    // Find biggest category
    let biggestCat: { category: string; total: number } | null = null;
    let maxVal = 0;
    catMap.forEach((val, key) => {
      if (val > maxVal) {
        maxVal = val;
        biggestCat = { category: key, total: val };
      }
    });

    return {
      allIncome,
      allExpense,
      balance: allIncome - allExpense,
      monthIncome,
      monthExpense,
      txCount,
      biggestCat
    } as {
      allIncome: number;
      allExpense: number;
      balance: number;
      monthIncome: number;
      monthExpense: number;
      txCount: number;
      biggestCat: { category: string; total: number } | null;
    };
  }, [transactions]);

  useEffect(() => {
    // Fetch currency setting only
    fetch("/api/user/settings").then(safeJson).then(res => {
      if (res.ok && res.data?.currency) setCurrency(res.data.currency);
    });
  }, []);

  const cards = [
    {
      title: "Income",
      value: stats.allIncome,
      icon: <TrendingUp className="h-5 w-5" />,
      color: "from-green-500/20 to-emerald-500/20 border-green-500/30",
      text: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Expenses",
      value: stats.allExpense,
      icon: <TrendingDown className="h-5 w-5" />,
      color: "from-rose-500/20 to-red-500/20 border-rose-500/30",
      text: "text-rose-600 dark:text-rose-400",
    },
    {
      title: "Balance",
      value: stats.balance,
      icon: <PiggyBank className="h-5 w-5" />,
      color: "from-indigo-500/20 to-violet-500/20 border-indigo-500/30",
      text: "text-indigo-600 dark:text-indigo-400",
    },
  ];

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-4">
        {/* This Month Income */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.02 }}
          className="rounded-2xl border bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-5 shadow-sm backdrop-blur-sm border-green-500/30"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">This Month Income</span>
            <div className="rounded-full p-2 text-emerald-600 dark:text-emerald-400"><TrendingUp className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(stats.monthIncome)}
          </div>
        </motion.div>

        {/* This Month Expense */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.06 }}
          className="rounded-2xl border bg-gradient-to-br from-rose-500/20 to-red-500/20 p-5 shadow-sm backdrop-blur-sm border-rose-500/30"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">This Month Expense</span>
            <div className="rounded-full p-2 text-rose-600 dark:text-rose-400"><TrendingDown className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(stats.monthExpense)}
          </div>
        </motion.div>

        {/* Biggest Category This Month */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.10 }}
          className="rounded-2xl border bg-gradient-to-br from-indigo-500/20 to-violet-500/20 p-5 shadow-sm backdrop-blur-sm border-indigo-500/30"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Biggest Category This Month</span>
            <div className="rounded-full p-2 text-indigo-600 dark:text-indigo-400"><BarChart3 className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {stats.biggestCat ? (
              `${stats.biggestCat.category || "(uncategorized)"} – ${new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(stats.biggestCat.total)}`
            ) : (
              "—"
            )}
          </div>
        </motion.div>

        {/* No. of Transactions This Month */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.14 }}
          className="rounded-2xl border bg-gradient-to-br from-zinc-500/20 to-zinc-500/10 p-5 shadow-sm backdrop-blur-sm border-zinc-500/30"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">No. of Transactions This Month</span>
            <div className="rounded-full p-2 text-zinc-700 dark:text-zinc-200"><ListOrdered className="h-5 w-5" /></div>
          </div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {new Intl.NumberFormat().format(stats.txCount)}
          </div>
        </motion.div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mt-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className={
              "rounded-2xl border bg-gradient-to-br " +
              c.color +
              " p-5 backdrop-blur-sm shadow-sm"
            }
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                {c.title}
              </span>
              <div className={"rounded-full p-2 " + c.text}>{c.icon}</div>
            </div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {new Intl.NumberFormat(undefined, {
                style: "currency",
                currency,
                maximumFractionDigits: 0,
              }).format(c.value)}
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
}
