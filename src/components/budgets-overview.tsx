"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { safeJson } from "@/lib/http";
import Link from "next/link";

type Budget = {
  _id: string;
  month: string;
  amount: number;
  category?: string | null;
  spent?: number;
  usedPct?: number; // 0-100
  status?: "ok" | "warning" | "over";
  rollover?: number;
  effectiveAmount?: number;
};

function currentMonth(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default function BudgetsOverview() {
  const [items, setItems] = useState<Budget[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const month = useMemo(() => currentMonth(), []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/budgets?month=${encodeURIComponent(month)}`, { cache: "no-store" });
      const { ok, data, status } = await safeJson(res);
      if (!ok) throw new Error(data?.message || data?.error || `HTTP ${status}`);
      setItems(data.data || data);
    } catch (e: any) {
      setError(e?.message || "Failed to load budgets");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const onUpdate = () => load();
    window.addEventListener("transactionsUpdated", onUpdate as any);
    return () => window.removeEventListener("transactionsUpdated", onUpdate as any);
  }, [month]);

  const totalBudget = useMemo(() => items.find((b) => !b.category), [items]);
  const totalExpense = useMemo(() => totalBudget?.spent ?? 0, [totalBudget]);
  const totalAmount = useMemo(() => totalBudget?.amount ?? 0, [totalBudget]);
  const totalEffective = useMemo(() => totalBudget?.effectiveAmount ?? totalAmount, [totalBudget, totalAmount]);
  const totalRollover = useMemo(() => totalBudget?.rollover ?? 0, [totalBudget]);

  const totalPct = useMemo(() => (totalEffective > 0 ? Math.min(100, Math.round((totalExpense / totalEffective) * 100)) : 0), [totalEffective, totalExpense]);

  const totalStatus: "ok" | "warning" | "over" = useMemo(() => {
    if (totalEffective <= 0) return "ok";
    if (totalExpense >= totalEffective) return "over";
    if (totalPct >= 90) return "warning";
    return "ok";
  }, [totalEffective, totalExpense, totalPct]);

  const categoryBudgets = useMemo(() => items.filter((b) => !!b.category), [items]);

  function barColor(status: "ok" | "warning" | "over") {
    return status === "over" ? "bg-rose-500" : status === "warning" ? "bg-amber-500" : "bg-emerald-500";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur dark:bg-zinc-900/60"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Budgets Overview ({month})</h3>
        <Link href="/budgets" className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">Manage</Link>
      </div>

      {error && <div className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-sm text-rose-600 dark:text-rose-400">{error}</div>}

      {/* Total Budget */}
      <div className="mb-4 rounded-xl border p-4 dark:border-zinc-800">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Total Expense
            {totalRollover !== 0 && (
              <span className={`ml-2 text-xs ${totalRollover > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                {totalRollover > 0 ? "+" : ""}{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalRollover)} rollover
              </span>
            )}
          </div>
          {totalBudget ? (
            <div className="text-xs text-zinc-500">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalExpense)}
              {" / "}
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalEffective)}
              {` (${totalPct}%)`}
            </div>
          ) : (
            <div className="text-xs text-zinc-500">No total budget set</div>
          )}
        </div>
        <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div className={`h-3 ${barColor(totalStatus)}`} style={{ width: `${totalPct}%` }} />
        </div>
        {totalStatus !== "ok" && (
          <div className={`mt-1 text-xs ${totalStatus === "over" ? "text-rose-600" : "text-amber-600"}`}>
            {totalStatus === "over" ? "Budget exceeded" : "Approaching budget"} ⚠
          </div>
        )}
      </div>

      {/* Category Budgets */}
      <div className="space-y-2">
        {loading && <div className="text-xs text-zinc-500">Loading budgets…</div>}
        {!loading && categoryBudgets.length === 0 && (
          <div className="text-xs text-zinc-500">No category budgets configured.</div>
        )}
        {categoryBudgets.map((b) => {
          const spent = b.spent ?? 0;
          const effective = b.effectiveAmount ?? b.amount;
          const rollover = b.rollover ?? 0;
          const usedPct = b.usedPct ?? (effective > 0 ? Math.min(100, Math.round((spent / effective) * 100)) : 0);
          const status = b.status ?? (spent >= effective ? "over" : usedPct >= 90 ? "warning" : "ok");

          return (
            <div key={b._id} className="rounded-xl border p-3 dark:border-zinc-800">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-sm text-zinc-700 dark:text-zinc-200">{b.category || "All"}</div>
                  {rollover !== 0 && (
                    <span className={`text-[10px] ${rollover > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                      {rollover > 0 ? "+" : ""}{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(rollover)}
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-500">
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(spent)}
                  {" / "}
                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(effective)}
                  {` (${usedPct}%)`}
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div className={`h-2 ${barColor(status)}`} style={{ width: `${usedPct}%` }} />
              </div>
              {status !== "ok" && (
                <div className={`mt-1 text-xs ${status === "over" ? "text-rose-600" : "text-amber-600"}`}>
                  {status === "over" ? "Over 100%" : "Over 90%"} ⚠
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
