"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
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

  async function load() {
    try {
      const res = await fetch("/api/summary", { cache: "no-store" });
      const { ok, data, status } = await safeJson(res);
      if (!ok) throw new Error(data?.message || data?.error || `HTTP ${status}`);
      setSummary(data as Summary);
    } catch (e: any) {
      setError(e?.message || "Failed to load summary");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    load();
    const onUpdate = () => load();
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
    <div className="grid gap-4 sm:grid-cols-3">
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
                currency: "USD",
                maximumFractionDigits: 0,
              }).format(c.value)
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
