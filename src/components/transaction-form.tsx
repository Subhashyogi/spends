"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownCircle, ArrowUpCircle, Loader2 } from "lucide-react";
import { safeJson } from "@/lib/http";
import { type LucideIconName } from "@/lib/icons";

export default function TransactionForm() {
  const [type, setType] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [account, setAccount] = useState<"cash" | "bank" | "upi" | "wallet">("cash");
  const [date, setDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [canExpense, setCanExpense] = useState<boolean>(true);
  const [categories, setCategories] = useState<Array<{ _id: string; name: string; type: "income" | "expense"; color: string; icon: LucideIconName }>>([]);
  const [catsLoading, setCatsLoading] = useState<boolean>(false);
  const [catsError, setCatsError] = useState<string | null>(null);
  const [useCustomCategory, setUseCustomCategory] = useState<boolean>(false);

  // Check if there's any income; if not, disable expense
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/summary", { cache: "no-store" });
        const { ok, data } = await safeJson(res);
        if (!ok) return; // keep default
        if (!mounted) return;
        setCanExpense((data?.incomeTotal ?? 0) > 0);
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load categories (seeded on first GET)
  useEffect(() => {
    let active = true;
    (async () => {
      setCatsLoading(true);
      try {
        const res = await fetch("/api/categories", { cache: "no-store" });
        const { ok, status, data } = await safeJson(res);
        if (!ok) {
          if (status === 401) setCatsError("Please sign in to load categories.");
          else setCatsError(data?.message || data?.error || `Failed to load categories (HTTP ${status})`);
          return;
        }
        if (!active) return;
        setCategories(data.data || data);
      } finally {
        setCatsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const body: any = {
        type,
        amount: Number(amount),
        description: description || undefined,
        category: category || undefined,
        account,
      };
      if (date) body.date = new Date(date);

      if (type === "expense" && !canExpense) {
        throw new Error("Add an income before adding an expense");
      }

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const { ok, status, data } = await safeJson(res);
      if (!ok) throw new Error(data?.message || data?.error || `HTTP ${status}`);

      // If user used a custom category that doesn't exist yet, attempt to create it
      const exists = categories.some((c) => c.name.toLowerCase() === (category || "").toLowerCase() && c.type === type);
      if (category && !exists) {
        try {
          await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: category, type }),
          });
          // refresh local categories quietly
          const r2 = await fetch("/api/categories", { cache: "no-store" });
          const j2 = await safeJson(r2);
          if (j2.ok) setCategories(j2.data.data || j2.data);
        } catch {}
      }

      setAmount("");
      setDescription("");
      setCategory("");
      setAccount("cash");
      setDate("");
      setSuccess(true);
      window.dispatchEvent(new CustomEvent("transactionsUpdated"));
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(false), 1500);
    }
  }

  return (
    <motion.form
      onSubmit={onSubmit}
      className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur dark:bg-zinc-900/60"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setType("income")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
            type === "income"
              ? "bg-emerald-600 text-white shadow"
              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300"
          }`}
        >
          <ArrowDownCircle className="h-4 w-4" /> Income
        </button>
        <button
          type="button"
          disabled={!canExpense}
          onClick={() => {
            if (!canExpense) return;
            setType("expense");
          }}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
            type === "expense"
              ? "bg-rose-600 text-white shadow"
              : `bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-300 ${
                  !canExpense ? "opacity-50 cursor-not-allowed hover:bg-rose-50" : ""
                }`
          }`}
        >
          <ArrowUpCircle className="h-4 w-4" /> Expense
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-300">Amount</label>
          <input
            type="number"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border bg-white/80 px-3 py-2 outline-none ring-offset-2 transition placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900/60"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-300">Category</label>
          <select
            value={useCustomCategory ? "__custom" : category}
            onChange={(e) => {
              if (e.target.value === "__custom") {
                setUseCustomCategory(true);
                setCategory("");
              } else {
                setUseCustomCategory(false);
                setCategory(e.target.value);
              }
            }}
            className="w-full rounded-xl border bg-white/80 px-3 py-2 outline-none ring-offset-2 transition focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900/60"
          >
            <option value="">Select category</option>
            {(categories.filter((c) => c.type === type)).map((c) => (
              <option key={c._id} value={c.name}>{c.name}</option>
            ))}
            <option value="__custom">Custom…</option>
          </select>
          {catsError && (
            <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-300">
              {catsError} <a className="underline" href="/api/auth/signin">Sign in</a>
            </div>
          )}
          {useCustomCategory && (
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 w-full rounded-xl border bg-white/80 px-3 py-2 outline-none ring-offset-2 transition placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900/60"
              placeholder="e.g., Food, Rent"
            />
          )}
          {catsLoading && <div className="mt-1 text-xs text-zinc-400">Loading categories…</div>}
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-300">Account</label>
          <select
            value={account}
            onChange={(e) => setAccount(e.target.value as any)}
            className="w-full rounded-xl border bg-white/80 px-3 py-2 outline-none ring-offset-2 transition focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900/60"
          >
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
            <option value="upi">UPI</option>
            <option value="wallet">Wallet</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-300">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border bg-white/80 px-3 py-2 outline-none ring-offset-2 transition placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900/60"
            placeholder="optional note"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-300">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border bg-white/80 px-3 py-2 outline-none ring-offset-2 transition placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900/60"
          />
        </div>
      </div>

      {(!canExpense && type === "expense") && (
        <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-sm text-amber-700 dark:text-amber-300">
          Add at least one income before adding an expense.
        </div>
      )}
      {error && (
        <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-sm text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span>Save</span>
          )}
        </motion.button>
        {success && (
          <span className="text-sm text-emerald-600 dark:text-emerald-400">Added!</span>
        )}
      </div>
    </motion.form>
  );
}
