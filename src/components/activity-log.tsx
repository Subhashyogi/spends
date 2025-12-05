"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { safeJson } from "@/lib/http";
import { Activity, LogIn, PlusCircle, Edit, Trash2, Loader2 } from "lucide-react";

interface Log {
    _id: string;
    action: "LOGIN" | "CREATE" | "UPDATE" | "DELETE";
    entity: "TRANSACTION" | "BUDGET" | "GOAL" | "SESSION";
    details: string;
    createdAt: string;
}

export default function ActivityLog() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/activity-log");
                const { ok, data, status } = await safeJson(res);
                if (!ok) throw new Error(data?.message || data?.error || `HTTP ${status}`);
                setLogs(data.data);
            } catch (e: any) {
                setError(e?.message || "Failed to load logs");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const getIcon = (action: string) => {
        switch (action) {
            case "LOGIN": return <LogIn className="h-4 w-4 text-blue-500" />;
            case "CREATE": return <PlusCircle className="h-4 w-4 text-emerald-500" />;
            case "UPDATE": return <Edit className="h-4 w-4 text-amber-500" />;
            case "DELETE": return <Trash2 className="h-4 w-4 text-rose-500" />;
            default: return <Activity className="h-4 w-4 text-zinc-500" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-sm text-rose-500">
                {error}
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="text-center text-sm text-zinc-500">
                No activity recorded yet.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {logs.map((log) => (
                <motion.div
                    key={log._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                    <div className="mt-1 rounded-full bg-zinc-50 p-2 dark:bg-zinc-800">
                        {getIcon(log.action)}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                {log.action} {log.entity}
                            </p>
                            <span className="text-xs text-zinc-400">
                                {new Date(log.createdAt).toLocaleString()}
                            </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {log.details}
                        </p>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
