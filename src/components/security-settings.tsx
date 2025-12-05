"use client";

import { useState } from "react";
import { useAppLock } from "./app-lock-provider";
import { safeJson } from "@/lib/http";
import { Shield, Lock, Check, Loader2, Trash2 } from "lucide-react";

export default function SecuritySettings() {
    const { hasPin, refreshLockStatus } = useAppLock();
    const [pin, setPin] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [mode, setMode] = useState<'view' | 'set'>('view');

    async function handleSetPin(e: React.FormEvent) {
        e.preventDefault();
        if (pin.length !== 4) {
            setError("PIN must be 4 digits");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/user/pin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pin })
            });
            const { ok, data } = await safeJson(res);

            if (!ok) throw new Error(data?.error || "Failed to set PIN");

            setSuccess(true);
            setPin("");
            setMode('view');
            refreshLockStatus();
            setTimeout(() => setSuccess(false), 2000);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleRemovePin() {
        if (!confirm("Are you sure you want to remove the App Lock?")) return;

        setLoading(true);
        try {
            const res = await fetch("/api/user/pin", { method: "DELETE" });
            if (res.ok) {
                refreshLockStatus();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    <Shield className="h-5 w-5 text-indigo-500" />
                    Security
                </h3>
                {hasPin && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <Check className="h-3 w-3" /> Active
                    </span>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
                    <div>
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">App Lock</div>
                        <div className="text-sm text-zinc-500">Require PIN to open app</div>
                    </div>

                    {hasPin ? (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setMode('set')}
                                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                            >
                                Change PIN
                            </button>
                            <button
                                onClick={handleRemovePin}
                                disabled={loading}
                                className="rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setMode('set')}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                        >
                            Setup PIN
                        </button>
                    )}
                </div>

                {mode === 'set' && (
                    <form onSubmit={handleSetPin} className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/30 dark:bg-indigo-900/10">
                        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Enter 4-digit PIN
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="password"
                                maxLength={4}
                                value={pin}
                                onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-center text-lg tracking-widest outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800"
                                placeholder="••••"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={loading || pin.length !== 4}
                                className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('view');
                                    setPin("");
                                    setError(null);
                                }}
                                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                            >
                                Cancel
                            </button>
                        </div>
                        {error && <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
                    </form>
                )}
            </div>
        </div>
    );
}
