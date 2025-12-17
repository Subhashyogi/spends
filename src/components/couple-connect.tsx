"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { safeJson } from "@/lib/http";
import { Heart, Copy, Check, Link as LinkIcon, Unlink, Loader2, UserPlus } from "lucide-react";

export default function CoupleConnect() {
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [partnerName, setPartnerName] = useState<string | null>(null);
    const [inputCode, setInputCode] = useState("");
    const [loading, setLoading] = useState(true);
    const [linking, setLinking] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchInfo();
    }, []);

    async function fetchInfo() {
        try {
            const res = await fetch("/api/user/partner");
            const { ok, data } = await safeJson(res);
            if (ok) {
                setInviteCode(data.inviteCode);
                setPartnerName(data.partnerName);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function handleLink() {
        if (!inputCode) return;
        setLinking(true);
        setError(null);
        try {
            const res = await fetch("/api/user/partner", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: inputCode }),
            });
            const { ok, data } = await safeJson(res);
            if (!ok) throw new Error(data?.error || "Failed to link");
            setPartnerName(data.partnerName);
            setInputCode("");
            window.location.reload(); // Reload to refresh data
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLinking(false);
        }
    }

    async function handleUnlink() {
        if (!confirm("Are you sure you want to unlink? You will stop seeing shared data.")) return;
        setLinking(true);
        try {
            await fetch("/api/user/partner", { method: "DELETE" });
            setPartnerName(null);
            window.location.reload();
        } catch (e) {
            console.error(e);
        } finally {
            setLinking(false);
        }
    }

    const copyCode = () => {
        if (inviteCode) {
            navigator.clipboard.writeText(inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) return <div className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />;

    return (
        <div className="glass rounded-2xl p-6">
            <div className="mb-6 flex items-center gap-3">
                <div className="rounded-full bg-rose-100 p-2 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
                    <Heart className="h-6 w-6" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Couple Mode</h2>
                    <p className="text-sm text-zinc-500">Link accounts to track finances together.</p>
                </div>
            </div>

            {partnerName ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass flex flex-col items-center justify-center gap-4 rounded-xl border-rose-200/50 bg-rose-50/50 p-6 text-center dark:border-rose-900/30 dark:bg-rose-900/10"
                >
                    <div className="flex items-center gap-2 text-lg font-medium text-rose-700 dark:text-rose-300">
                        <Heart className="h-5 w-5 fill-rose-600 text-rose-600" />
                        Linked with {partnerName}
                    </div>
                    <button
                        onClick={handleUnlink}
                        disabled={linking}
                        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-rose-600"
                    >
                        <Unlink className="h-4 w-4" />
                        {linking ? "Unlinking..." : "Unlink Account"}
                    </button>
                </motion.div>
            ) : (
                <div className="grid gap-8 md:grid-cols-2">
                    {/* Share Code */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Your Invite Code</h3>
                        <div className="flex items-center gap-2">
                            <div className="glass flex-1 rounded-xl px-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-zinc-900 dark:text-zinc-100">
                                {inviteCode}
                            </div>
                            <button
                                onClick={copyCode}
                                className="glass rounded-xl p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                title="Copy Code"
                            >
                                {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5 text-zinc-500" />}
                            </button>
                        </div>
                        <p className="text-xs text-zinc-500">Share this code with your partner to link accounts.</p>
                    </div>

                    {/* Enter Code */}
                    <div className="space-y-4 border-t border-zinc-200/50 pt-4 md:border-l md:border-t-0 md:pl-8 md:pt-0 dark:border-zinc-800/50">
                        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Enter Partner's Code</h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputCode}
                                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                                placeholder="Ex: X9Y2Z1"
                                className="glass w-full rounded-xl px-4 py-2 font-mono uppercase outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                maxLength={6}
                            />
                            <button
                                onClick={handleLink}
                                disabled={!inputCode || linking}
                                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                            >
                                {linking ? <Loader2 className="h-5 w-5 animate-spin" /> : <LinkIcon className="h-5 w-5" />}
                            </button>
                        </div>
                        {error && <p className="text-xs text-rose-500">{error}</p>}
                        <p className="text-xs text-zinc-500">Enter the code from your partner's screen.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
