"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { safeJson } from "@/lib/http";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RTooltip,
} from "recharts";

export default function ExpenseByCategory() {
  const [items, setItems] = useState<Array<{ category: string; total: number }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  function currentMonthRange() {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { from: from.toISOString(), to: to.toISOString() };
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { from, to } = currentMonthRange();
      const res = await fetch(`/api/analytics/by-category?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      const { ok, data, status } = await safeJson(res);
      if (!ok) throw new Error(data?.message || data?.error || `HTTP ${status}`);
      const arr = (data.data || data) as Array<{ category: string; total: number }>;
      setItems(Array.isArray(arr) ? arr : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const onUpdate = () => load();
    window.addEventListener("transactionsUpdated", onUpdate as any);
    return () => window.removeEventListener("transactionsUpdated", onUpdate as any);
  }, []);

  const total = useMemo(() => items.reduce((s, x) => s + (x.total || 0), 0), [items]);
  const top3 = useMemo(() => items.slice(0, 3), [items]);

  const colors = [
    "#ef4444",
    "#3b82f6",
    "#10b981",
    "#a855f7",
    "#f59e0b",
    "#22c55e",
    "#06b6d4",
    "#f97316",
    "#64748b",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur dark:bg-zinc-900/60"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Expense by Category (This Month)</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-64 w-full">
          {error ? (
            <div className="flex h-full items-center justify-center text-sm text-rose-500">{error}</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={items} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={90} label>
                  {items.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <RTooltip formatter={(v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v as number)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="text-xs text-zinc-500">Loading…</div>
          ) : top3.length === 0 ? (
            <div className="text-xs text-zinc-500">No expense this month.</div>
          ) : (
            top3.map((x, i) => {
              const pct = total > 0 ? Math.round((x.total / total) * 100) : 0;
              return (
                <div key={i} className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors[i % colors.length] }} />
                    <span className="text-zinc-700 dark:text-zinc-200">{x.category || "(uncategorized)"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
                    <span className="text-xs">{pct}%</span>
                    <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(x.total)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}
