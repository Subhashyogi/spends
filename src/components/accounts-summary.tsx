"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { safeJson } from "@/lib/http";

export default function AccountsSummary() {
  const [rows, setRows] = useState<Array<{ account: string; income: number; expense: number; net: number }>>([]);
  const [total, setTotal] = useState<number>(0);
  const [currency, setCurrency] = useState<string>("INR");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [ares, sres] = await Promise.all([
        fetch("/api/analytics/accounts", { cache: "no-store" }),
        fetch("/api/user/settings", { cache: "no-store" }),
      ]);
      const aj = await safeJson(ares);
      const sj = await safeJson(sres);
      if (aj.ok) {
        setRows(aj.data?.data || aj.data || []);
        setTotal(aj.data?.total ?? 0);
      }
      if (sj.ok && sj.data?.currency) setCurrency(sj.data.currency);
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

  const fmt = (n: number) => new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-2xl p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Accounts Summary</h3>
        {loading && <span className="text-xs text-zinc-500">Loading…</span>}
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-sm text-rose-600 dark:text-rose-400">{error}</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <div key={r.account} className="glass rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{r.account || "(unnamed)"}</div>
                <div className={`text-xs ${r.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{fmt(r.net)}</div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-500">
                <div>Income: <span className="text-zinc-700 dark:text-zinc-300">{fmt(r.income)}</span></div>
                <div>Expense: <span className="text-zinc-700 dark:text-zinc-300">{fmt(r.expense)}</span></div>
              </div>
            </div>
          ))}
          <div className="glass rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Net Worth</div>
              <div className={`text-xs ${total >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{fmt(total)}</div>
            </div>
            <div className="mt-2 text-xs text-zinc-500">Sum of all account balances (income - expense).</div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
