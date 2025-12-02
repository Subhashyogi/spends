"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { safeJson } from "@/lib/http";

interface Txn {
  _id: string;
  type: "income" | "expense";
  amount: number;
  date: string;
  category?: string;
}

function formatDateKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function SpendingChart() {
  const [data, setData] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const res = await fetch(`/api/transactions?from=${since.toISOString()}`);
      const { ok, data, status } = await safeJson(res);
      if (!ok) throw new Error(data?.message || data?.error || `HTTP ${status}`);
      setData(data.data as Txn[]);
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

  const chartData = useMemo(() => {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 29);
    const map = new Map<string, { date: string; income: number; expense: number }>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      map.set(formatDateKey(d), {
        date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        income: 0,
        expense: 0,
      });
    }
    for (const t of data) {
      const key = formatDateKey(new Date(t.date));
      if (!map.has(key)) continue;
      const row = map.get(key)!;
      if (t.type === "income") row.income += t.amount;
      if (t.type === "expense") row.expense += t.amount;
    }
    return Array.from(map.values());
  }, [data]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur dark:bg-zinc-900/60"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Last 30 days</h3>
      </div>
      <div className="h-64 w-full">
        {error ? (
          <div className="flex h-full items-center justify-center text-sm text-rose-500">{error}</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} className="fill-zinc-500 text-xs" />
              <YAxis tickLine={false} axisLine={false} className="fill-zinc-500 text-xs" />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid rgba(0,0,0,0.05)" }}
                formatter={(v: any) => new Intl.NumberFormat().format(v as number)}
              />
              <Area type="monotone" dataKey="income" stroke="#059669" fill="url(#income)" strokeWidth={2} />
              <Area type="monotone" dataKey="expense" stroke="#dc2626" fill="url(#expense)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      {loading && (
        <div className="mt-2 text-xs text-zinc-500">Loading chart…</div>
      )}
    </motion.div>
  );
}
