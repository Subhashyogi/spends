"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Laptop, Smartphone, Globe, Clock, Trash2, Loader2, AlertTriangle, LogOut } from "lucide-react";
import { safeJson } from "@/lib/http";
import ConfirmDialog from "@/components/ui/confirm-dialog";

export default function SessionGuard({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [revoking, setRevoking] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        action: () => void;
    }>({
        isOpen: false,
        title: "",
        description: "",
        action: () => { }
    });

    useEffect(() => {
        if (status === "authenticated") {
            loadSessions();
        } else if (status === "unauthenticated") {
            setLoading(false);
        }
    }, [status]);

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

    const revokeSession = async (sessionId: string, isCurrent: boolean) => {
        if (isCurrent) {
            await signOut({ callbackUrl: "/auth/signin" });
            return;
        }

        setRevoking(sessionId);
        try {
            const res = await fetch("/api/auth/sessions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId })
            });

            if (!res.ok) throw new Error("Failed to revoke session");

            const newSessions = sessions.filter(s => s.sessionId !== sessionId);
            setSessions(newSessions);

            // If we're now within the limit, we can stop showing the guard
            // But we'll let the render logic handle that
        } catch (e: any) {
            alert(e.message);
        } finally {
            setRevoking(null);
        }
    };

    const handleRevokeClick = (sessionId: string, isCurrent: boolean) => {
        setConfirmConfig({
            isOpen: true,
            title: isCurrent ? "Log out this device?" : "Log out device?",
            description: isCurrent
                ? "You will be signed out of your current session on this device."
                : "This will log out the selected device. They will need to sign in again.",
            action: () => revokeSession(sessionId, isCurrent)
        });
    };

    if (loading) return null; // Or a loading spinner if you prefer

    // If unauthenticated or within limit, render children
    const uniqueDeviceCount = new Set(sessions.map(s => s.device)).size;

    if (status !== "authenticated" || uniqueDeviceCount <= 3) {
        return <>{children}</>;
    }

    // If we are here, we have > 3 devices. Show blocking screen.
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-50/95 p-4 backdrop-blur-sm dark:bg-zinc-950/95">
            <div className="w-full max-w-lg space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                <div className="space-y-2 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Device Limit Exceeded</h2>
                    <p className="text-sm text-zinc-500">
                        You are logged in on {uniqueDeviceCount} devices. The limit is 3.
                        Please log out of at least {uniqueDeviceCount - 3} device{uniqueDeviceCount - 3 > 1 ? 's' : ''} to continue.
                    </p>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
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
                                            <Globe className="h-3 w-3" /> {session.browser}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> {new Date(session.lastActive).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleRevokeClick(session.sessionId, session.isCurrent)}
                                disabled={revoking === session.sessionId}
                                className="rounded-lg p-2 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
                                title={session.isCurrent ? "Log out" : "Log out device"}
                            >
                                {revoking === session.sessionId ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <LogOut className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                <ConfirmDialog
                    isOpen={confirmConfig.isOpen}
                    title={confirmConfig.title}
                    description={confirmConfig.description}
                    onConfirm={() => {
                        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                        confirmConfig.action();
                    }}
                    onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                />
            </div>
        </div>
    );
}
