"use client";

import { useEffect, useMemo, useState } from "react";
import { safeJson } from "@/lib/http";
import { getLucideIcon, type LucideIconName } from "@/lib/icons";
import { motion } from "framer-motion";
import { Plus, Trash2, PencilLine, Check, X } from "lucide-react";

type Cat = {
  _id: string;
  name: string;
  type: "income" | "expense";
  color: string;
  icon: LucideIconName;
};

const ICONS: LucideIconName[] = [
  "Tag",
  "Utensils",
  "Bus",
  "ShoppingCart",
  "Home",
  "CreditCard",
  "Heart",
  "Coins",
  "Gift",
  "Banknote",
  "Plus",
];

export default function CategoriesPage() {
  const [items, setItems] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [color, setColor] = useState<string>("#64748b");
  const [icon, setIcon] = useState<LucideIconName>("Tag");
  const [saving, setSaving] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<"income" | "expense">("expense");
  const [editColor, setEditColor] = useState<string>("#64748b");
  const [editIcon, setEditIcon] = useState<LucideIconName>("Tag");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/categories", { cache: "no-store" });
      const { ok, data, status } = await safeJson(res);
      if (!ok) throw new Error(data?.message || data?.error || `HTTP ${status}`);
      setItems(data.data || data);
    } catch (e: any) {
      setError(e?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createCat() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, color, icon }),
      });
      const { ok, data, status } = await safeJson(res);
      if (!ok) throw new Error(data?.message || data?.error || `HTTP ${status}`);
      setName("");
      setColor("#64748b");
      setIcon("Tag");
      await load();
    } catch (e: any) {
      setError(e?.message || "Create failed");
    } finally {
      setSaving(false);
    }
  }

  function beginEdit(c: Cat) {
    setEditId(c._id);
    setEditName(c.name);
    setEditType(c.type);
    setEditColor(c.color);
    setEditIcon(c.icon);
  }

  function cancelEdit() {
    setEditId(null);
  }

  async function saveEdit() {
    if (!editId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/categories/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, type: editType, color: editColor, icon: editIcon }),
      });
      const { ok, data, status } = await safeJson(res);
      if (!ok) throw new Error(data?.message || data?.error || `HTTP ${status}`);
      setEditId(null);
      await load();
    } catch (e: any) {
      setError(e?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    const prev = items;
    setItems((s) => s.filter((x) => x._id !== id));
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const { ok, data, status } = await safeJson(res);
      if (!ok) throw new Error(data?.message || data?.error || `HTTP ${status}`);
    } catch (e: any) {
      setItems(prev);
      setError(e?.message || "Delete failed");
    }
  }

  const grouped = useMemo(() => {
    return {
      income: items.filter((i) => i.type === "income"),
      expense: items.filter((i) => i.type === "expense"),
    };
  }, [items]);

  return (
    <main className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Categories</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Predefined and custom categories with colors and icons.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur dark:bg-zinc-900/60">
        <h3 className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">Add Category</h3>
        {error && <div className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-sm text-rose-600 dark:text-rose-400">{error}</div>}
        <div className="grid gap-3 sm:grid-cols-5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="rounded-xl border bg-white/80 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900/60"
          />
          <select value={type} onChange={(e) => setType(e.target.value as any)} className="rounded-xl border bg-white/80 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900/60">
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 rounded-xl border bg-white/80 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900/60"
          />
          <select value={icon} onChange={(e) => setIcon(e.target.value as LucideIconName)} className="rounded-xl border bg-white/80 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900/60">
            {ICONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <button
            onClick={createCat}
            disabled={saving || !name.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-indigo-500 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
        {["expense", "income"].map((t) => (
          <motion.div key={t} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur dark:bg-zinc-900/60">
            <h3 className="mb-3 text-sm font-medium capitalize text-zinc-700 dark:text-zinc-200">{t} categories</h3>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {(grouped as any)[t].map((c: Cat) => {
                const Icon = getLucideIcon(c.icon);
                return (
                  <div key={c._id} className="flex items-center justify-between py-3">
                    {editId === c._id ? (
                      <div className="flex w-full items-center gap-2">
                        <select value={editType} onChange={(e) => setEditType(e.target.value as any)} className="rounded-lg border px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900/60">
                          <option value="expense">Expense</option>
                          <option value="income">Income</option>
                        </select>
                        <input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 rounded-lg border px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900/60" />
                        <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} className="h-8 w-14 rounded-lg border px-1 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900/60" />
                        <select value={editIcon} onChange={(e) => setEditIcon(e.target.value as LucideIconName)} className="rounded-lg border px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900/60">
                          {ICONS.map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                        <button onClick={saveEdit} className="rounded-lg p-1 text-emerald-600 transition hover:bg-emerald-50 dark:hover:bg-emerald-900/20"><Check className="h-4 w-4" /></button>
                        <button onClick={cancelEdit} className="rounded-lg p-1 text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-900/20"><X className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full border" style={{ borderColor: c.color, color: c.color }}>
                            <Icon className="h-3 w-3" />
                          </span>
                          <div>
                            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{c.name}</div>
                            <div className="text-xs text-zinc-500 capitalize">{c.type}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => beginEdit(c)} className="rounded-lg p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800"><PencilLine className="h-4 w-4" /></button>
                          <button onClick={() => remove(c._id)} className="rounded-lg p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
              {loading && <div className="py-3 text-xs text-zinc-500">Loading…</div>}
            </div>
          </motion.div>
        ))}
      </div>
    </main>
  );
}
