"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { safeJson } from "@/lib/http";
import Link from "next/link";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import SavingsAdvisorCard from "@/components/savings-advisor-card";
import PredictorCard from "@/components/predictor-card";
import CashflowProjectionChart from "@/components/cashflow-projection-chart";
import CategoryRadarChart from "@/components/category-radar-chart";
import DailyLimitCard from "@/components/daily-limit-card";

function lastMonths(n: number) {
  const out: { from: string; to: string } = { from: "", to: "" } as any;
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - (n - 1));
  out.from = from.toISOString();
  out.to = to.toISOString();
  return out;
}

export default function AnalyticsPage() {
  const [account, setAccount] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [byCat, setByCat] = useState<Array<{ category: string; total: number }>>([]);
  const [monthly, setMonthly] = useState<Array<{ month: string; income: number; expense: number }>>([]);
  const [balance, setBalance] = useState<Array<{ month: string; net: number; cumulative: number }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { from, to } = lastMonths(12);
    setFrom(from);
    setTo(to);
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const qs: string[] = [];
      if (from) qs.push(`from=${encodeURIComponent(from)}`);
      if (to) qs.push(`to=${encodeURIComponent(to)}`);
      if (account !== "all") qs.push(`account=${encodeURIComponent(account)}`);
      const suffix = qs.length ? `?${qs.join("&")}` : "";

      const [r1, r2, r3] = await Promise.all([
        fetch(`/api/analytics/by-category${suffix}`),
        fetch(`/api/analytics/monthly${suffix}`),
        fetch(`/api/analytics/balance${suffix}`),
      ]);
      const j1 = await safeJson(r1);
      const j2 = await safeJson(r2);
      const j3 = await safeJson(r3);
      if (!j1.ok) throw new Error(j1.data?.error || "by-category failed");
      if (!j2.ok) throw new Error(j2.data?.error || "monthly failed");
      if (!j3.ok) throw new Error(j3.data?.error || "balance failed");
      setByCat(j1.data.data || j1.data);
      setMonthly(j2.data.data || j2.data);
      setBalance(j3.data.data || j3.data);
    } catch (e: any) {
      setError(e?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!from || !to) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, account]);

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
    <main className="space-y-8">
      <div className="space-y-2">
        <div className="pt-1">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            ← Back
          </Link>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Analytics</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Pie by category, bar by month, and cumulative balance over time.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-zinc-600 dark:text-zinc-300">Account</label>
        <select value={account} onChange={(e) => setAccount(e.target.value)} className="rounded-xl border bg-white/80 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900/60">
          <option value="all">All</option>
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
          <option value="upi">UPI</option>
          <option value="wallet">Wallet</option>
        </select>
        <label className="ml-4 text-sm text-zinc-600 dark:text-zinc-300">From</label>
        <input type="date" value={from.slice(0, 10)} onChange={(e) => setFrom(new Date(e.target.value).toISOString())} className="rounded-xl border bg-white/80 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900/60" />
        <label className="text-sm text-zinc-600 dark:text-zinc-300">To</label>
        <input type="date" value={to.slice(0, 10)} onChange={(e) => setTo(new Date(e.target.value).toISOString())} className="rounded-xl border bg-white/80 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900/60" />
      </div>

      {error && <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-sm text-rose-600 dark:text-rose-400">{error}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur dark:bg-zinc-900/60">
          <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">Expenses by Category</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCat} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={90} label>
                  {byCat.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <RTooltip formatter={(v: any) => new Intl.NumberFormat().format(v as number)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur dark:bg-zinc-900/60 lg:col-span-2">
          <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">Monthly Income vs Expense</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} className="fill-zinc-500 text-xs" />
                <YAxis tickLine={false} axisLine={false} className="fill-zinc-500 text-xs" />
                <RTooltip formatter={(v: any) => new Intl.NumberFormat().format(v as number)} />
                <Bar dataKey="income" fill="#10b981" />
                <Bar dataKey="expense" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur dark:bg-zinc-900/60 lg:col-span-3">
          <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">Balance Over Time</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={balance} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} className="fill-zinc-500 text-xs" />
                <YAxis tickLine={false} axisLine={false} className="fill-zinc-500 text-xs" />
                <RTooltip formatter={(v: any) => new Intl.NumberFormat().format(v as number)} />
                <Line type="monotone" dataKey="net" stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cumulative" stroke="#22c55e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DailyLimitCard />
          <CategoryRadarChart />
        </div>

        <CashflowProjectionChart />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PredictorCard />
          <SavingsAdvisorCard />
        </div>
      </div>
    </main>
  );
}
