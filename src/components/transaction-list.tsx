"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, PencilLine, X, Check } from "lucide-react";
import { safeJson } from "@/lib/http";
import { getLucideIcon, type LucideIconName } from "@/lib/icons";

type Txn = {
  _id: string;
  type: "income" | "expense";
  amount: number;
  description?: string;
  category?: string;
  account?: "cash" | "bank" | "upi" | "wallet";
  date: string;
  createdAt?: string;
};

export default function TransactionList() {
  const [items, setItems] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [accountFilter, setAccountFilter] = useState<
    "all" | "cash" | "bank" | "upi" | "wallet"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<"this_week" | "this_month" | "last_month" | "custom">("this_month");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [editId, setEditId] = useState<string | null>(null);
  const [formType, setFormType] = useState<"income" | "expense">("income");
  const [formAmount, setFormAmount] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formCategory, setFormCategory] = useState<string>("");
  const [formDate, setFormDate] = useState<string>("");
  const [formAccount, setFormAccount] = useState<
    "cash" | "bank" | "upi" | "wallet"
  >("cash");
  const [categories, setCategories] = useState<Array<{ _id: string; name: string; type: "income" | "expense"; color: string; icon: LucideIconName }>>([]);

  function rangeToISO() {
    const now = new Date();
    if (dateRange === "this_week") {
      const d = new Date(now);
      const day = (d.getDay() + 6) % 7;
      d.setDate(d.getDate() - day);
      d.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { from: d.toISOString(), to: end.toISOString() };
    }
    if (dateRange === "last_month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { from: start.toISOString(), to: end.toISOString() };
    }
    if (dateRange === "custom") {
      const f = fromDate ? new Date(fromDate) : null;
      const t = toDate ? new Date(toDate) : null;
      return { from: f ? f.toISOString() : undefined, to: t ? new Date(t.getFullYear(), t.getMonth(), t.getDate(), 23, 59, 59, 999).toISOString() : undefined } as any;
    }
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { from: start.toISOString(), to: end.toISOString() };
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params: string[] = [];
      if (filter !== "all") params.push(`type=${filter}`);
      if (accountFilter !== "all") params.push(`account=${accountFilter}`);
      if (categoryFilter !== "all") params.push(`category=${encodeURIComponent(categoryFilter)}`);
      const { from, to } = rangeToISO();
      if (from) params.push(`from=${encodeURIComponent(from)}`);
      if (to) params.push(`to=${encodeURIComponent(to)}`);
      if (search.trim()) params.push(`q=${encodeURIComponent(search.trim())}`);
      const qs = params.length ? `?${params.join("&")}` : "";
      const res = await fetch(`/api/transactions${qs}`);
      const { ok, data, status } = await safeJson(res);
      if (!ok)
        throw new Error(data?.message || data?.error || `HTTP ${status}`);
      setItems(data.data as Txn[]);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => load(), 250);
    return () => clearTimeout(t);
  }, [filter, accountFilter, categoryFilter, dateRange, fromDate, toDate, search]);

  useEffect(() => {
    const onUpdate = () => load();
    window.addEventListener("transactionsUpdated", onUpdate as any);
    return () =>
      window.removeEventListener("transactionsUpdated", onUpdate as any);
  }, []);

  // Load categories once for badges/icons
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/categories", { cache: "no-store" });
        const { ok, data } = await safeJson(res);
        if (ok) setCategories(data.data || data);
      } catch {}
    })();
  }, []);

  async function remove(id: string) {
    const prev = items;
    setItems((s) => s.filter((x) => x._id !== id));
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      const { ok, data, status } = await safeJson(res);
      if (!ok)
        throw new Error(data?.message || data?.error || `HTTP ${status}`);
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
    setFormAccount(t.account || "cash");
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
        account: formAccount,
      };
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const { ok, data, status } = await safeJson(res);
      if (!ok)
        throw new Error(data?.message || data?.error || `HTTP ${status}`);
      setEditId(null);
      window.dispatchEvent(new CustomEvent("transactionsUpdated"));
      // Optimistic local update
      setItems((arr) =>
        arr.map((x) => (x._id === id ? { ...x, ...data.data } : x))
      );
    } catch (e: any) {
      setError(e?.message || "Update failed");
    }
  }

  const totals = useMemo(() => {
    let income = 0,
      expense = 0;
    for (const t of items)
      t.type === "income" ? (income += t.amount) : (expense += t.amount);
    return { income, expense, balance: income - expense };
  }, [items]);

  return (
    <div className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur dark:bg-zinc-900/60">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          Transactions
        </h3>
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
        <div>
          Income:{" "}
          <span className="text-emerald-600 dark:text-emerald-400">
            {new Intl.NumberFormat().format(totals.income)}
          </span>
        </div>
        <div>
          Expense:{" "}
          <span className="text-rose-600 dark:text-rose-400">
            {new Intl.NumberFormat().format(totals.expense)}
          </span>
        </div>
        <div>
          Balance:{" "}
          <span className="text-indigo-600 dark:text-indigo-400">
            {new Intl.NumberFormat().format(totals.balance)}
          </span>
        </div>
      </div>

      {error && <div className="mb-2 text-sm text-rose-500">{error}</div>}

      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        {(["all", "income", "expense"] as const).map((t) => (
          <button
            key={`t-${t}`}
            onClick={() => setFilter(t)}
            className={`rounded-full px-3 py-1 transition ${
              filter === t
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
        <span className="mx-1 text-zinc-400">•</span>
        {(["all", "cash", "bank", "upi", "wallet"] as const).map((a) => (
          <button
            key={`a-${a}`}
            onClick={() => setAccountFilter(a)}
            className={`rounded-full px-3 py-1 transition ${
              accountFilter === a
                ? "bg-indigo-600 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {a[0].toUpperCase() + a.slice(1)}
          </button>
        ))}
        <span className="mx-1 text-zinc-400">•</span>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-full border px-3 py-1 transition dark:border-zinc-700 dark:bg-zinc-900/60"
        >
          <option value="all">All categories</option>
          {(categories.filter((c) => filter === "all" || c.type === filter)).map((c) => (
            <option key={c._id} value={c.name}>{c.name}</option>
          ))}
        </select>

        <span className="mx-1 text-zinc-400">•</span>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as any)}
          className="rounded-full border px-3 py-1 transition dark:border-zinc-700 dark:bg-zinc-900/60"
        >
          <option value="this_week">This week</option>
          <option value="this_month">This month</option>
          <option value="last_month">Last month</option>
          <option value="custom">Custom…</option>
        </select>
        {dateRange === "custom" && (
          <>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-full border px-3 py-1 transition dark:border-zinc-700 dark:bg-zinc-900/60"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-full border px-3 py-1 transition dark:border-zinc-700 dark:bg-zinc-900/60"
            />
          </>
        )}

        <span className="mx-1 text-zinc-400">•</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search description…"
          className="w-44 rounded-full border px-3 py-1 text-xs transition placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900/60"
        />
      </div>

      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
        <AnimatePresence initial={false}>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
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
            : items.map((t) => (
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
                      <select
                        value={formAccount}
                        onChange={(e) => setFormAccount(e.target.value as any)}
                        className="rounded-lg border px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900/60"
                      >
                        <option value="cash">Cash</option>
                        <option value="bank">Bank</option>
                        <option value="upi">UPI</option>
                        <option value="wallet">Wallet</option>
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
                        {(() => {
                          const cat = categories.find((c) => c.name === (t.category || "") && c.type === t.type);
                          const Icon = getLucideIcon(cat?.icon);
                          const fallback = t.type === "income" ? "#059669" : "#dc2626";
                          const color = cat?.color || fallback;
                          return (
                            <span
                              className="h-6 w-6 rounded-full border flex items-center justify-center"
                              style={{ borderColor: color, color }}
                              title={cat ? `${cat.name}` : t.type === "income" ? "Income" : "Expense"}
                            >
                              <Icon className="h-3 w-3" />
                            </span>
                          );
                        })()}
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
                        <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
                          {t.account || "cash"}
                        </span>
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
              ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
