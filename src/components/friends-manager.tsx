"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { safeJson } from "@/lib/http";
import { UserPlus, Users, Loader2, Check } from "lucide-react";

export default function FriendsManager() {
    const [friends, setFriends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState("");
    const [adding, setAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        loadFriends();
    }, []);

    async function loadFriends() {
        try {
            const res = await fetch("/api/friends");
            const { ok, data } = await safeJson(res);
            if (ok) setFriends(data.data || data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function addFriend(e: React.FormEvent) {
        e.preventDefault();
        setAdding(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await fetch("/api/friends", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username })
            });
            const { ok, data } = await safeJson(res);

            if (!ok) throw new Error(data?.error || "Failed to add friend");

            setFriends([...friends, data.data]);
            setUsername("");
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setAdding(false);
        }
    }

    if (loading) return <div className="h-24 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />;

    return (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    <Users className="h-5 w-5 text-indigo-500" />
                    Friends
                </h3>
                <p className="text-sm text-zinc-500">Add friends to split expenses</p>
            </div>

            <form onSubmit={addFriend} className="mb-6 flex gap-2">
                <div className="relative flex-1">
                    <input
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="Enter username (e.g. user123)"
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={adding || !username}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                    {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                    Add
                </button>
            </form>

            {error && (
                <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 flex items-center gap-2">
                    <Check className="h-4 w-4" /> Friend added!
                </div>
            )}

            <div className="space-y-2">
                {friends.length === 0 ? (
                    <p className="text-center text-sm text-zinc-500">No friends yet.</p>
                ) : (
                    friends.map((friend, i) => (
                        <div key={i} className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-800/30">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                    {friend.name?.[0]?.toUpperCase() || "U"}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{friend.name}</div>
                                    <div className="text-xs text-zinc-500">@{friend.username}</div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
