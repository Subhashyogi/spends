"use client";

import { useEffect, useState } from "react";
import { safeJson } from "@/lib/http";
import Link from "next/link";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "JPY"] as const;

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currency, setCurrency] = useState<string>("INR");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/settings", { cache: "no-store" });
        const { ok, data, status } = await safeJson(res);
        if (!ok) throw new Error(data?.message || data?.error || `HTTP ${status}`);
        setName(data.name || "");
        setEmail(data.email || "");
        setCurrency(data.currency || "INR");
      } catch (e: any) {
        setError(e?.message || "Failed to load settings");
      }
    })();
  }, []);

  async function onSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, currency }),
      });
      const { ok, data, status } = await safeJson(res);
      if (!ok) throw new Error(data?.message || data?.error || `HTTP ${status}`);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      // broadcast to refresh UI widgets
      window.dispatchEvent(new CustomEvent("userSettingsUpdated"));
    } catch (e: any) {
      setError(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

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
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Settings</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Manage your profile and preferences.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-sm text-rose-600 dark:text-rose-400">{error}</div>
      )}

      <div className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-300">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border bg-white/80 px-3 py-2 outline-none ring-offset-2 transition placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900/60"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-300">Email</label>
            <input disabled value={email} className="w-full cursor-not-allowed rounded-xl border bg-zinc-100/70 px-3 py-2 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/60" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-300">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-xl border bg-white/80 px-3 py-2 outline-none ring-offset-2 transition focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900/60"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-indigo-500 disabled:opacity-50"
          >
            Save
          </button>
          {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400">Saved</span>}
        </div>
      </div>
    </main>
  );
}
