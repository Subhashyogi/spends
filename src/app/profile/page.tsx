"use client";

import { useEffect, useState } from "react";
import { safeJson } from "@/lib/http";
import Link from "next/link";
import CoupleConnect from "@/components/couple-connect";
import { signOut } from "next-auth/react";
import { Settings, ArrowLeft, Save, Loader2, FileText, LogOut } from "lucide-react";
import AchievementsCard from "@/components/achievements-card";
import StreakCard from "@/components/streak-card";
import FinanceRankCard from "@/components/finance-rank-card";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "JPY"] as const;

export default function ProfilePage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [currency, setCurrency] = useState<string>("INR");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

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
                setError(e?.message || "Failed to load profile");
            } finally {
                setLoading(false);
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
            window.dispatchEvent(new CustomEvent("userSettingsUpdated"));
        } catch (e: any) {
            setError(e?.message || "Save failed");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    return (
        <main className="min-h-screen space-y-8 bg-zinc-50 p-4 dark:bg-black sm:p-8">
            <div className="mx-auto max-w-2xl space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                        >
                            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">My Profile</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/reports"
                            className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                            <FileText className="h-4 w-4" />
                            Reports
                        </Link>
                        <Link
                            href="/settings"
                            className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                            <Settings className="h-4 w-4" />
                            Settings
                        </Link>
                    </div>
                </div>

                {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 dark:border-rose-900/30 dark:bg-rose-900/10 dark:text-rose-400">
                        {error}
                    </div>
                )}

                {/* Profile Form */}
                <div className="rounded-2xl border bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <h2 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Personal Information</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800/50"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email Address</label>
                            <input
                                disabled
                                value={email}
                                className="w-full cursor-not-allowed rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-2.5 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-500"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Preferred Currency</label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800/50"
                            >
                                {CURRENCIES.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <button
                                onClick={onSave}
                                disabled={saving}
                                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 font-medium text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                Save Changes
                            </button>
                            {saved && <p className="text-sm text-emerald-600 dark:text-emerald-400">Profile updated!</p>}
                        </div>
                    </div>
                </div>

                {/* Couple Connect */}
                <CoupleConnect />

                {/* Gamification */}
                <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Your Progress</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FinanceRankCard />
                        <StreakCard />
                    </div>
                    <AchievementsCard />
                </div>

                {/* Sign Out */}
                <div className="flex justify-center pt-4">
                    <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </button>
                </div>
            </div>
        </main>
    );
}
