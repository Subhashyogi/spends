"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { safeJson } from "@/lib/http";
import { getLucideIcon, type LucideIconName } from "@/lib/icons";
import { Check, PencilLine, Plus, Trash2, X, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import GoalsCard from "@/components/goals-card";
import RulesManager from "@/components/rules-manager";

function currentMonth(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

type Cat = {
  _id: string;
  name: string;
  type: "income" | "expense";
  color: string;
  icon: LucideIconName;
};

type Budget = {
  _id: string;
  month: string;
  amount: number;
  category?: string | null;
  // attached by API
  spent?: number;
  usedPct?: number; // 0-100
  status?: "ok" | "warning" | "over";
};

export default function BudgetsPage() {
  const { notify } = useToast();
  const [month, setMonth] = useState<string>(currentMonth());
  const [items, setItems] = useState<Budget[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Cat[]>([]);

  // create form
  const [newAmount, setNewAmount] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>(""); // optional
  const [saving, setSaving] = useState<boolean>(false);

  // edit form
  const [editId, setEditId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [editCategory, setEditCategory] = useState<string>("");

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
  }, [month]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/categories", { cache: "no-store" });
        const { ok, data } = await safeJson(res);
        if (ok) setCategories((data.data || data).filter((c: Cat) => c.type === "expense"));
      } catch { }
    })();
  }, []);

  async function createBudget() {
    setSaving(true);
    setError(null);
    try {
      const body: any = { month, amount: Number(newAmount) };
      if (newCategory) body.category = newCategory;
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const { ok, data, status } = await safeJson(res);
      if (!ok) throw new Error(data?.message || data?.error || `HTTP ${status}`);
      setNewAmount("");
      setNewCategory("");
      notify({
        title: "Budget added",
        message: `${newCategory ? newCategory : "All expenses"} · ₹${Number(body.amount).toLocaleString()} · ${month}`,
        variant: "success",
      });
      await load();
    } catch (e: any) {
      setError(e?.message || "Create failed");
      notify({ title: "Budget failed", message: e?.message || "Create failed", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  function beginEdit(b: Budget) {
    setEditId(b._id);
    setEditAmount(String(b.amount));
    setEditCategory(b.category || "");
  }

  function cancelEdit() {
    setEditId(null);
  }

  async function saveEdit(id: string) {
    setSaving(true);
    setError(null);
    try {
      const body: any = { amount: Number(editAmount), category: editCategory || undefined };
      const res = await fetch(`/api/budgets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const { ok, data, status } = await safeJson(res);
      if (!ok) throw new Error(data?.message || data?.error || `HTTP ${status}`);
      setEditId(null);
      notify({
        title: "Budget updated",
        message: `${body.category ?? "All expenses"} · ₹${Number(body.amount).toLocaleString()}`,
        variant: "success",
      });
      await load();
    } catch (e: any) {
      setError(e?.message || "Update failed");
      notify({ title: "Update failed", message: e?.message || "Update failed", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const prev = items;
    setItems((s) => s.filter((x) => x._id !== id));
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      const { ok, data, status } = await safeJson(res);
      if (!ok) throw new Error(data?.message || data?.error || `HTTP ${status}`);
      notify({ title: "Budget deleted", message: "The budget was removed", variant: "success" });
    } catch (e: any) {
      setItems(prev);
      setError(e?.message || "Delete failed");
      notify({ title: "Delete failed", message: e?.message || "Delete failed", variant: "error" });
    }
  }

  const rows = useMemo(() => {
    return items.slice().sort((a, b) => (a.category || "").localeCompare(b.category || ""));
  }, [items]);

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
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Budgets</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Set monthly total or per-category budgets. See progress and alerts.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-zinc-600 dark:text-zinc-300">Month</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-xl border bg-white/80 px-3 py-2 text-sm outline-none ring-offset-2 transition focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900/60"
        />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur dark:bg-zinc-900/60">
        <h3 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">Add Budget</h3>
        {error && <div className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-sm text-rose-600 dark:text-rose-400">{error}</div>}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <input
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            placeholder="Amount"
            type="number"
            step="0.01"
            className="rounded-xl border bg-white/80 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900/60"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="rounded-xl border bg-white/80 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900/60"
          >
            <option value="">(All expenses)</option>
            {categories.map((c) => (
              <option key={c._id} value={c.name}>{c.name}</option>
            ))}
          </select>
          <div className="sm:col-span-2" />
          <button
            onClick={createBudget}
            disabled={saving || !newAmount}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-indigo-500 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add Budget
          </button>
        </div>
      </motion.div>

      <div className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur dark:bg-zinc-900/60">
        <h3 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">Budgets for {month}</h3>
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {rows.map((b) => {
            const cat = categories.find((c) => c.name === (b.category || ""));
            const Icon = getLucideIcon(cat?.icon);
            const color = cat?.color || "#6366f1";
            const spent = b.spent ?? 0;
            const used = b.usedPct ?? 0;
            const status = b.status ?? "ok";
            const barColor = status === "over" ? "bg-rose-500" : status === "warning" ? "bg-amber-500" : "bg-emerald-500";
            const badge = b.category ? (
              <span className="flex h-6 w-6 items-center justify-center rounded-full border" style={{ borderColor: color, color }}>
                <Icon className="h-3 w-3" />
              </span>
            ) : (
              <span className="flex h-6 w-6 items-center justify-center rounded-full border text-indigo-600 border-indigo-600">₹</span>
            );

            return (
              <div key={b._id} className="flex items-center justify-between gap-3 py-3">
                {editId === b._id ? (
                  <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      {badge}
                      <div className="text-sm text-zinc-700 dark:text-zinc-200">
                        {b.category || "All expenses"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-28 rounded-lg border px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900/60"
                      />
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="rounded-lg border px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900/60"
                      >
                        <option value="">(All expenses)</option>
                        {categories.map((c) => (
                          <option key={c._id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                      <button onClick={() => saveEdit(b._id)} className="rounded-lg p-1 text-emerald-600 transition hover:bg-emerald-50 dark:hover:bg-emerald-900/20"><Check className="h-4 w-4" /></button>
                      <button onClick={cancelEdit} className="rounded-lg p-1 text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-900/20"><X className="h-4 w-4" /></button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {badge}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                            {b.category || "All expenses"}
                          </div>
                          <div className="text-xs text-zinc-500">
                            Spent {new Intl.NumberFormat().format(spent)} / {new Intl.NumberFormat().format(b.amount)}
                          </div>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                          <div className={`h-2 ${barColor}`} style={{ width: `${Math.min(100, used)}%` }} />
                        </div>
                        {status !== "ok" && (
                          <div className={`mt-1 flex items-center gap-1 text-xs ${status === "over" ? "text-rose-600" : "text-amber-600"}`}>
                            <AlertTriangle className="h-3 w-3" />
                            {status === "over" ? "Budget exceeded" : "Approaching budget"}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => beginEdit(b)} className="rounded-lg p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800"><PencilLine className="h-4 w-4" /></button>
                      <button onClick={() => remove(b._id)} className="rounded-lg p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
          {loading && <div className="py-3 text-xs text-zinc-500">Loading…</div>}
          {!loading && rows.length === 0 && <div className="py-3 text-xs text-zinc-500">No budgets for this month.</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <GoalsCard />
        <RulesManager />
      </div>
    </main>
  );
}
