"use client";

import { useEffect, useState } from "react";
import { Laptop, Smartphone, Globe, Clock, Trash2, Loader2, AlertCircle } from "lucide-react";
import { safeJson } from "@/lib/http";

export default function DeviceList() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [revoking, setRevoking] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            const res = await fetch("/api/auth/sessions");
            const { ok, data } = await safeJson(res);
            if (ok) setSessions(data.sessions || []);
        } catch (e) {
            console.error(e);
            setError("Failed to load sessions");
        } finally {
            setLoading(false);
        }
    };

    const revokeSession = async (sessionId: string) => {
        if (!confirm("Are you sure you want to log out this device?")) return;

        setRevoking(sessionId);
        try {
            const res = await fetch("/api/auth/sessions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId })
            });

            if (!res.ok) throw new Error("Failed to revoke session");

            setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
        } catch (e: any) {
            alert(e.message);
        } finally {
            setRevoking(null);
        }
    };

    if (loading) return <div className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">Active Sessions</h3>
                    <p className="text-sm text-zinc-500">Manage devices logged into your account.</p>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </div>
            )}

            <div className="space-y-3">
                {sessions.map((session) => (
                    <div key={session.sessionId} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                {session.device.toLowerCase().includes("mobile") ? (
                                    <Smartphone className="h-5 w-5" />
                                ) : (
                                    <Laptop className="h-5 w-5" />
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                        {session.device}
                                    </p>
                                    {session.isCurrent && (
                                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                            THIS DEVICE
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-zinc-500">
                                    <span className="flex items-center gap-1">
                                        <Globe className="h-3 w-3" /> {session.browser} on {session.os}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> {new Date(session.lastActive).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {!session.isCurrent && (
                            <button
                                onClick={() => revokeSession(session.sessionId)}
                                disabled={revoking === session.sessionId}
                                className="rounded-lg p-2 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
                                title="Revoke Session"
                            >
                                {revoking === session.sessionId ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 className="h-4 w-4" />
                                )}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
