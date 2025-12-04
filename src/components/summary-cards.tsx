"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, PiggyBank, BarChart3, ListOrdered } from "lucide-react";
import { safeJson } from "@/lib/http";

type Summary = {
  incomeTotal: number;
  expenseTotal: number;
  balance: number;
};

export default function SummaryCards() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthIncome, setMonthIncome] = useState<number>(0);
  const [monthExpense, setMonthExpense] = useState<number>(0);
  const [biggestCat, setBiggestCat] = useState<{ category: string; total: number } | null>(null);
  const [txCount, setTxCount] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("INR");

  async function load() {
    try {
      const res = await fetch("/api/summary", { cache: "no-store" });
      const { ok, data, status } = await safeJson(res);
      if (!ok) throw new Error(data?.message || data?.error || `HTTP ${status}`);
      setSummary(data as Summary);
      try {
        const sres = await fetch("/api/user/settings", { cache: "no-store" });
        const sj = await safeJson(sres);
        if (sj.ok && sj.data?.currency) setCurrency(sj.data.currency);
      } catch {}
    } catch (e: any) {
      setError(e?.message || "Failed to load summary");
    } finally {
      setLoading(false);
    }
  }

  function currentMonthRange() {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { from: from.toISOString(), to: to.toISOString() };
  }

  async function loadMonthly() {
    const { from, to } = currentMonthRange();
    try {
      const [s, c, t] = await Promise.all([
        fetch(`/api/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { cache: "no-store" }),
        fetch(`/api/analytics/by-category?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { cache: "no-store" }),
        fetch(`/api/transactions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { cache: "no-store" }),
      ]);
      const js = await safeJson(s);
      const jc = await safeJson(c);
      const jt = await safeJson(t);
      if (js.ok) {
        setMonthIncome(js.data?.incomeTotal ?? 0);
        setMonthExpense(js.data?.expenseTotal ?? 0);
      }
      if (jc.ok) {
        const list = (jc.data?.data || jc.data) as Array<{ category: string; total: number }>;
        setBiggestCat(list && list.length ? list[0] : null);
      }
      if (jt.ok) {
        const arr = (jt.data?.data || jt.data) as any[];
        setTxCount(Array.isArray(arr) ? arr.length : 0);
      }
    } catch {
      // ignore monthly errors to avoid blocking main summary
    }
  }

  useEffect(() => {
    setLoading(true);
    load();
    loadMonthly();
    const onUpdate = () => {
      load();
      loadMonthly();
    };
    window.addEventListener("transactionsUpdated", onUpdate as any);
    return () => window.removeEventListener("transactionsUpdated", onUpdate as any);
  }, []);

  const cards = [
    {
      title: "Income",
      value: summary?.incomeTotal ?? 0,
      icon: <TrendingUp className="h-5 w-5" />,
      color: "from-green-500/20 to-emerald-500/20 border-green-500/30",
      text: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Expenses",
      value: summary?.expenseTotal ?? 0,
      icon: <TrendingDown className="h-5 w-5" />,
      color: "from-rose-500/20 to-red-500/20 border-rose-500/30",
      text: "text-rose-600 dark:text-rose-400",
    },
    {
      title: "Balance",
      value: summary?.balance ?? 0,
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
            {loading ? (
              <span className="inline-block h-7 w-24 animate-pulse rounded bg-zinc-300/50 dark:bg-zinc-700/50" />
            ) : (
              new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(monthIncome)
            )}
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
            {loading ? (
              <span className="inline-block h-7 w-24 animate-pulse rounded bg-zinc-300/50 dark:bg-zinc-700/50" />
            ) : (
              new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(monthExpense)
            )}
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
            {loading ? (
              <span className="inline-block h-4 w-32 animate-pulse rounded bg-zinc-300/50 dark:bg-zinc-700/50" />
            ) : biggestCat ? (
              `${biggestCat.category || "(uncategorized)"} – ${new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(biggestCat.total)}`
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
            {loading ? (
              <span className="inline-block h-7 w-16 animate-pulse rounded bg-zinc-300/50 dark:bg-zinc-700/50" />
            ) : (
              new Intl.NumberFormat().format(txCount)
            )}
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
              {loading ? (
                <span className="inline-block h-7 w-24 animate-pulse rounded bg-zinc-300/50 dark:bg-zinc-700/50" />
              ) : error ? (
                <span className="text-rose-500">--</span>
              ) : (
                new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency,
                  maximumFractionDigits: 0,
                }).format(c.value)
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
}
