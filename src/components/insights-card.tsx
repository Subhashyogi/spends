"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { safeJson } from "@/lib/http";

export default function InsightsCard() {
  const [currency, setCurrency] = useState<string>("INR");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [thisMonthExpense, setThisMonthExpense] = useState<number>(0);
  const [lastMonthExpense, setLastMonthExpense] = useState<number>(0);
  const [thisMonthIncomeToDate, setThisMonthIncomeToDate] = useState<number>(0);
  const [thisMonthExpenseToDate, setThisMonthExpenseToDate] = useState<number>(0);
  const [biggestCat, setBiggestCat] = useState<{ category: string; total: number } | null>(null);
  const [unusualSpending, setUnusualSpending] = useState<{ description: string; amount: number } | null>(null);
  const [spikeCat, setSpikeCat] = useState<{ category: string; pct: number } | null>(null);

  function monthRange(year: number, monthIndex: number) {
    const start = new Date(year, monthIndex, 1, 0, 0, 0, 0);
    const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
    return { from: start.toISOString(), to: end.toISOString(), days: end.getDate() };
  }

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const now = new Date();
      const { from: thisFrom, to: thisToFull } = monthRange(now.getFullYear(), now.getMonth());
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const { from: lastFrom, to: lastTo } = monthRange(lastMonthDate.getFullYear(), lastMonthDate.getMonth());

      // Fetch settings (currency)
      try {
        const sres = await fetch("/api/user/settings", { cache: "no-store" });
        const sj = await safeJson(sres);
        if (sj.ok && sj.data?.currency) setCurrency(sj.data.currency);
      } catch { }

      // This month (full) expense and last month expense
      const results = await Promise.all([
        fetch(`/api/summary?from=${encodeURIComponent(thisFrom)}&to=${encodeURIComponent(thisToFull)}`),
        fetch(`/api/summary?from=${encodeURIComponent(lastFrom)}&to=${encodeURIComponent(lastTo)}`),
        fetch(`/api/analytics/by-category?from=${encodeURIComponent(thisFrom)}&to=${encodeURIComponent(thisToFull)}`),
        fetch(`/api/analytics/by-category?from=${encodeURIComponent(lastFrom)}&to=${encodeURIComponent(lastTo)}`),
        fetch(`/api/transactions?type=expense&from=${encodeURIComponent(thisFrom)}&to=${encodeURIComponent(thisToFull)}`),
      ]);
      const curSum = results[0];
      const prevSum = results[1];
      const byCat = results[2];
      const curJ = await safeJson(curSum);
      const prevJ = await safeJson(prevSum);
      const byCatJ = await safeJson(byCat);
      const prevByCatJ = await safeJson(results[3]);
      const txJ = await safeJson(results[4]);
      if (curJ.ok) setThisMonthExpense(curJ.data?.expenseTotal ?? 0);
      if (prevJ.ok) setLastMonthExpense(prevJ.data?.expenseTotal ?? 0);
      if (byCatJ.ok) {
        const arr = (byCatJ.data?.data || byCatJ.data) as Array<{ category: string; total: number }>;
        setBiggestCat(arr && arr.length ? arr[0] : null);

        // Detect spikes
        if (prevByCatJ.ok) {
          const prevArr = (prevByCatJ.data?.data || prevByCatJ.data) as Array<{ category: string; total: number }>;
          const spikes = arr.map(c => {
            const prev = prevArr.find(p => p.category === c.category);
            if (!prev || prev.total < 100) return null; // Ignore small previous base
            const pct = ((c.total - prev.total) / prev.total) * 100;
            return { ...c, pct };
          }).filter(c => c && c.pct > 50).sort((a, b) => (b?.pct || 0) - (a?.pct || 0));

          if (spikes.length > 0 && spikes[0]) {
            setSpikeCat({ category: spikes[0].category, pct: Math.round(spikes[0].pct) });
          }
        }
      }

      // Detect unusual spending
      if (txJ.ok) {
        const txs = (txJ.data?.data || txJ.data) as Array<{ description: string; amount: number }>;
        if (txs.length > 5) {
          const total = txs.reduce((sum, t) => sum + t.amount, 0);
          const avg = total / txs.length;
          // Flag if > 2.5x average
          const unusual = txs.find(t => t.amount > avg * 2.5);
          if (unusual) {
            setUnusualSpending({ description: unusual.description, amount: unusual.amount });
          }
        }
      }

      // This month to-date for pace projection
      const toNow = new Date();
      const curToDate = await fetch(`/api/summary?from=${encodeURIComponent(thisFrom)}&to=${encodeURIComponent(toNow.toISOString())}`);
      const curToDateJ = await safeJson(curToDate);
      if (curToDateJ.ok) {
        setThisMonthIncomeToDate(curToDateJ.data?.incomeTotal ?? 0);
        setThisMonthExpenseToDate(curToDateJ.data?.expenseTotal ?? 0);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load insights");
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

  const fmt = (n: number) => new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  const monthOverMonth = useMemo(() => {
    if (lastMonthExpense <= 0 && thisMonthExpense <= 0) return null;
    if (lastMonthExpense <= 0 && thisMonthExpense > 0) return `You started spending this month.`;
    const change = ((thisMonthExpense - lastMonthExpense) / lastMonthExpense) * 100;
    const sign = change > 0 ? "more" : change < 0 ? "less" : "the same as";
    const pct = Math.abs(Math.round(change));
    return `You spent ${pct}% ${sign} last month.`;
  }, [thisMonthExpense, lastMonthExpense]);

  const biggestCatLine = useMemo(() => {
    if (!biggestCat) return null;
    return `Your biggest category this month is ${biggestCat.category || "(uncategorized)"} (${fmt(biggestCat.total)}).`;
  }, [biggestCat, currency]);

  const paceLine = useMemo(() => {
    const now = new Date();
    const elapsed = now.getDate();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysInMonth = end.getDate();
    if (elapsed <= 0) return null;
    const netToDate = (thisMonthIncomeToDate - thisMonthExpenseToDate);
    const projected = Math.round((netToDate / elapsed) * daysInMonth);
    return `At this pace, you may save ${fmt(projected)} by month end.`;
  }, [thisMonthIncomeToDate, thisMonthExpenseToDate, currency]);

  const unusualLine = useMemo(() => {
    if (!unusualSpending) return null;
    return `Unusual spending detected: ${unusualSpending.description} (${fmt(unusualSpending.amount)}).`;
  }, [unusualSpending, currency]);

  const spikeLine = useMemo(() => {
    if (!spikeCat) return null;
    return `Spending on ${spikeCat.category} is up ${spikeCat.pct}% compared to last month.`;
  }, [spikeCat]);

  const lines = [monthOverMonth, biggestCatLine, paceLine, unusualLine, spikeLine].filter(Boolean) as string[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur dark:bg-zinc-900/60"
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Insights</h3>
        {loading && <span className="text-xs text-zinc-500">Loading…</span>}
      </div>
      {error ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-sm text-rose-600 dark:text-rose-400">{error}</div>
      ) : (
        <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
          {lines.length === 0 ? (
            <li>No insights yet. Add some transactions.</li>
          ) : (
            lines.map((l, i) => <li key={i}>{l}</li>)
          )}
        </ul>
      )}
    </motion.div>
  );
}
