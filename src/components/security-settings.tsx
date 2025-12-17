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
    const [step, setStep] = useState<'verify' | 'set'>('set');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (pin.length !== 4) {
            setError("PIN must be 4 digits");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (step === 'verify') {
                // Verify old PIN
                const res = await fetch("/api/user/pin", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ pin })
                });
                const { ok, data } = await safeJson(res);

                if (!ok) throw new Error(data?.error || "Incorrect PIN");

                setStep('set');
                setPin("");
                setSuccess(true);
                setTimeout(() => setSuccess(false), 1000);
            } else {
                // Set new PIN
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
            }
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

    function startSetPin() {
        setMode('set');
        setStep(hasPin ? 'verify' : 'set');
        setPin("");
        setError(null);
    }

    return (
        <div className="glass rounded-3xl p-6">
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
                <div className="glass flex items-center justify-between rounded-xl p-4">
                    <div>
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">App Lock</div>
                        <div className="text-sm text-zinc-500">Require PIN to open app</div>
                    </div>

                    {hasPin ? (
                        <div className="flex gap-2">
                            <button
                                onClick={startSetPin}
                                className="glass rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300"
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
                            onClick={startSetPin}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                        >
                            Setup PIN
                        </button>
                    )}
                </div>

                {mode === 'set' && (
                    <form onSubmit={handleSubmit} className="glass rounded-xl border-indigo-200/50 p-4 ring-1 ring-indigo-500/20">
                        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            {step === 'verify' ? "Enter Current PIN" : "Enter New 4-digit PIN"}
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="password"
                                maxLength={4}
                                value={pin}
                                onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                                className="glass w-full rounded-lg px-3 py-2 text-center text-lg tracking-widest outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                placeholder="••••"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={loading || pin.length !== 4}
                                className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (step === 'verify' ? "Verify" : "Save")}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('view');
                                    setPin("");
                                    setError(null);
                                }}
                                className="glass rounded-lg px-4 py-2 font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300"
                            >
                                Cancel
                            </button>
                        </div>
                        {error && <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
                        {success && step === 'set' && <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">PIN verified! Enter new PIN.</p>}
                    </form>
                )}
            </div>
        </div>
    );
}
