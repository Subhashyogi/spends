"use client";

import { useState, useEffect } from "react";
import { Shield, Loader2, Check, Copy } from "lucide-react";
import { safeJson } from "@/lib/http";

export default function TwoFactorSetup() {
    const [step, setStep] = useState<"initial" | "scan" | "verify" | "success">("initial");
    const [secret, setSecret] = useState("");
    const [qrCode, setQrCode] = useState("");
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check status on mount
    useEffect(() => {
        fetch("/api/user/settings")
            .then(res => safeJson(res))
            .then(({ ok, data }) => {
                if (ok && data.twoFactorEnabled) {
                    setStep("success");
                }
            })
            .catch(console.error);
    }, []);

    const startSetup = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/auth/2fa/generate", { method: "POST" });
            const { ok, data } = await safeJson(res);
            if (!ok) throw new Error(data?.error || "Failed to generate secret");

            setSecret(data.secret);
            setQrCode(data.qrCodeUrl);
            setStep("scan");
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const verifyCode = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/auth/2fa/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, secret })
            });
            const { ok, data } = await safeJson(res);
            if (!ok) throw new Error(data?.error || "Invalid code");

            setStep("success");
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const disable2FA = async () => {
        if (!confirm("Are you sure you want to disable 2FA? Your account will be less secure.")) return;

        setLoading(true);
        try {
            const res = await fetch("/api/auth/2fa/disable", { method: "POST" });
            if (!res.ok) throw new Error("Failed to disable 2FA");
            setStep("initial");
            setSecret("");
            setQrCode("");
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    if (step === "success") {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">Two-Factor Authentication is enabled</span>
                </div>
                <button
                    onClick={disable2FA}
                    className="text-sm text-rose-600 hover:text-rose-500 dark:text-rose-400"
                >
                    Disable 2FA
                </button>
            </div>
        );
    }

    if (step === "scan" || step === "verify") {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">Setup 2FA</h3>
                    <p className="text-sm text-zinc-500">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
                </div>

                {qrCode && (
                    <div className="flex justify-center rounded-xl bg-white p-4">
                        <img src={qrCode} alt="2FA QR Code" className="h-48 w-48" />
                    </div>
                )}

                <div className="rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800">
                    <p className="mb-1 text-xs text-zinc-500">Or enter this code manually:</p>
                    <div className="flex items-center justify-between">
                        <code className="font-mono text-sm text-zinc-900 dark:text-zinc-100">{secret}</code>
                        <button
                            onClick={() => navigator.clipboard.writeText(secret)}
                            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                        >
                            <Copy className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Enter Verification Code</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={code}
                            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-center text-lg tracking-widest outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800"
                        />
                        <button
                            onClick={verifyCode}
                            disabled={code.length !== 6 || loading}
                            className="rounded-xl bg-indigo-600 px-6 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify"}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="text-sm text-rose-600 dark:text-rose-400">
                        {error}
                    </div>
                )}

                <button
                    onClick={() => setStep("initial")}
                    className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                    Cancel
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">Two-Factor Authentication</h3>
                    <p className="text-sm text-zinc-500">Secure your account with TOTP.</p>
                </div>
                <button
                    onClick={startSetup}
                    disabled={loading}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enable"}
                </button>
            </div>
            {error && (
                <div className="text-sm text-rose-600 dark:text-rose-400">
                    {error}
                </div>
            )}
        </div>
    );
}
