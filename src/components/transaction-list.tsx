"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, PencilLine, X, Check } from "lucide-react";
import { safeJson } from "@/lib/http";

type Txn = {
  _id: string;
  type: "income" | "expense";
  amount: number;
  description?: string;
  category?: string;
  date: string;
  createdAt?: string;
};

export default function TransactionList() {
  const [items, setItems] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [editId, setEditId] = useState<string | null>(null);
  const [formType, setFormType] = useState<"income" | "expense">("income");
  const [formAmount, setFormAmount] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formCategory, setFormCategory] = useState<string>("");
  const [formDate, setFormDate] = useState<string>("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const qs = filter === "all" ? "" : `?type=${filter}`;
      const res = await fetch(`/api/transactions${qs}`);
      const { ok, data, status } = await safeJson(res);
      if (!ok) throw new Error(data?.message || data?.error || `HTTP ${status}`);
      setItems(data.data as Txn[]);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filter]);

  useEffect(() => {
    const onUpdate = () => load();
    window.addEventListener("transactionsUpdated", onUpdate as any);
    return () => window.removeEventListener("transactionsUpdated", onUpdate as any);
  }, []);

  async function remove(id: string) {
    const prev = items;
    setItems((s) => s.filter((x) => x._id !== id));
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      const { ok, data, status } = await safeJson(res);
      if (!ok) throw new Error(data?.message || data?.error || `HTTP ${status}`);
      window.dispatchEvent(new CustomEvent("transactionsUpdated"));
    } catch (e: any) {
      setItems(prev);
      setError(e?.message || "Delete failed");
    }
  }

  function beginEdit(t: Txn) {
    setEditId(t._id);
    setFormType(t.type);
    setFormAmount(String(t.amount));
    setFormDescription(t.description || "");
    setFormCategory(t.category || "");
    setFormDate(new Date(t.date).toISOString().slice(0, 10));
  }

  function cancelEdit() {
    setEditId(null);
  }

  async function saveEdit(id: string) {
    setError(null);
    try {
      const body: any = {
        type: formType,
        amount: Number(formAmount),
        description: formDescription || undefined,
        category: formCategory || undefined,
        date: formDate ? new Date(formDate) : undefined,
      };
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const { ok, data, status } = await safeJson(res);
      if (!ok) throw new Error(data?.message || data?.error || `HTTP ${status}`);
      setEditId(null);
      window.dispatchEvent(new CustomEvent("transactionsUpdated"));
      // Optimistic local update
      setItems((arr) => arr.map((x) => (x._id === id ? { ...x, ...data.data } : x)));
    } catch (e: any) {
      setError(e?.message || "Update failed");
    }
  }

  const totals = useMemo(() => {
    let income = 0,
      expense = 0;
    for (const t of items) t.type === "income" ? (income += t.amount) : (expense += t.amount);
    return { income, expense, balance: income - expense };
  }, [items]);

  return (
    <div className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur dark:bg-zinc-900/60">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Transactions</h3>
        <div className="flex items-center gap-2">
          {(["all", "income", "expense"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`rounded-full px-3 py-1 text-xs transition ${
                filter === t
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 grid grid-cols-3 gap-3 text-xs text-zinc-600 dark:text-zinc-300">
        <div>Income: <span className="text-emerald-600 dark:text-emerald-400">{new Intl.NumberFormat().format(totals.income)}</span></div>
        <div>Expense: <span className="text-rose-600 dark:text-rose-400">{new Intl.NumberFormat().format(totals.expense)}</span></div>
        <div>Balance: <span className="text-indigo-600 dark:text-indigo-400">{new Intl.NumberFormat().format(totals.balance)}</span></div>
      </div>

      {error && <div className="mb-2 text-sm text-rose-500">{error}</div>}

      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
        <AnimatePresence initial={false}>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="flex w-full items-center gap-3">
                  <span className="h-6 w-6 animate-pulse rounded-full bg-zinc-300/50 dark:bg-zinc-700/50" />
                  <div className="flex-1">
                    <div className="mb-1 h-3 w-1/3 animate-pulse rounded bg-zinc-300/50 dark:bg-zinc-700/50" />
                    <div className="h-3 w-1/5 animate-pulse rounded bg-zinc-300/50 dark:bg-zinc-700/50" />
                  </div>
                  <div className="h-6 w-16 animate-pulse rounded bg-zinc-300/50 dark:bg-zinc-700/50" />
                </div>
              </div>
            ))
          ) : (
            items.map((t) => (
              <motion.div
                key={t._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between py-3"
              >
                {editId === t._id ? (
                  <div className="flex w-full items-center gap-3">
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as any)}
                      className="rounded-lg border px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900/60"
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      className="w-28 rounded-lg border px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900/60"
                    />
                    <input
                      type="text"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      placeholder="category"
                      className="w-32 rounded-lg border px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900/60"
                    />
                    <input
                      type="text"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="description"
                      className="flex-1 rounded-lg border px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900/60"
                    />
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="rounded-lg border px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900/60"
                    />
                    <button
                      onClick={() => saveEdit(t._id)}
                      className="rounded-lg p-1 text-emerald-600 transition hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                      aria-label="Save"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="rounded-lg p-1 text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-900/20"
                      aria-label="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-6 w-6 rounded-full ${
                          t.type === "income" ? "bg-emerald-500/20" : "bg-rose-500/20"
                        }`}
                      />
                      <div>
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {t.description || (t.type === "income" ? "Income" : "Expense")}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {t.category || "general"} • {new Date(t.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`text-sm font-semibold ${
                          t.type === "income"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {t.type === "income" ? "+" : "-"}
                        {new Intl.NumberFormat().format(t.amount)}
                      </div>
                      <button
                        onClick={() => beginEdit(t)}
                        className="rounded-lg p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800"
                        aria-label="Edit"
                      >
                        <PencilLine className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(t._id)}
                        className="rounded-lg p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
