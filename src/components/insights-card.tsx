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

  // Helper to create insight objects
  const insightsList = useMemo(() => {
    const list = [];

    if (lastMonthExpense > 0 && thisMonthExpense > 0) {
      const change = ((thisMonthExpense - lastMonthExpense) / lastMonthExpense) * 100;
      const sign = change > 0 ? "increase" : "decrease";
      list.push({
        icon: change > 0 ? "📈" : "📉",
        title: "Spending Trend",
        text: `You spent ${Math.abs(Math.round(change))}% ${change > 0 ? 'more' : 'less'} than last month.`,
        type: change > 0 ? 'bad' : 'good'
      });
    } else if (thisMonthExpense > 0) {
      list.push({ icon: "🚀", title: "Fresh Start", text: "You started spending this month.", type: 'neutral' });
    }

    if (biggestCat) {
      list.push({
        icon: "🏆",
        title: "Top Category",
        text: `Most money went to ${biggestCat.category} (${fmt(biggestCat.total)}).`,
        type: 'neutral'
      });
    }

    const now = new Date();
    const elapsed = now.getDate();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    if (elapsed > 0) {
      const netToDate = (thisMonthIncomeToDate - thisMonthExpenseToDate);
      const projected = Math.round((netToDate / elapsed) * end.getDate());
      list.push({
        icon: "💰",
        title: "Savings Pace",
        text: `Projected savings: ${fmt(projected)} by month end.`,
        type: projected > 0 ? 'good' : 'bad'
      });
    }

    if (unusualSpending) {
      list.push({
        icon: "⚠️",
        title: "Unusual Expense",
        text: `High spending specific to: ${unusualSpending.description} (${fmt(unusualSpending.amount)}).`,
        type: 'bad'
      });
    }

    if (spikeCat) {
      list.push({
        icon: "📊",
        title: "Category Spike",
        text: `Spending on ${spikeCat.category} is up ${spikeCat.pct}%!`,
        type: 'bad'
      });
    }

    return list;
  }, [thisMonthExpense, lastMonthExpense, biggestCat, thisMonthIncomeToDate, thisMonthExpenseToDate, unusualSpending, spikeCat, currency]);


  if (loading) return <div className="animate-pulse h-32 bg-gray-800/50 rounded-2xl mb-8"></div>;
  if (insightsList.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="p-1 rounded bg-indigo-500/20 text-indigo-400">⚡</span>
          Quick Analysis
        </h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {insightsList.map((item, i) => (
          <div key={i} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gray-900/40 p-4 transition-all hover:bg-gray-800/60 hover:border-indigo-500/20 backdrop-blur-sm">
            <div className="flex gap-4">
              <div className="text-2xl">{item.icon}</div>
              <div>
                <h4 className="text-sm font-semibold text-gray-200 mb-1">{item.title}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{item.text}</p>
              </div>
            </div>
            {/* Subtle gradient line at bottom */}
            <div className={`absolute bottom-0 left-0 h-1 w-full opacity-30 
                    ${item.type === 'good' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                item.type === 'bad' ? 'bg-gradient-to-r from-rose-500 to-orange-500' :
                  'bg-gradient-to-r from-blue-500 to-indigo-500'}`} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
