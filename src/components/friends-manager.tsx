"use client";

import { useState } from "react";
import { Search, UserPlus, Loader2 } from "lucide-react";

export default function FriendsManager() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [requesting, setRequesting] = useState<string | null>(null);

    const handleSearch = async (value: string) => {
        setQuery(value);
        if (value.length < 2) {
            setResults([]);
            return;
        }

        setSearching(true);
        try {
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(value)}`);
            const data = await res.json();
            setResults(data.users || []);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setSearching(false);
        }
    };

    const sendFriendRequest = async (targetUserId: string) => {
        setRequesting(targetUserId);
        try {
            const res = await fetch("/api/friends/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetUserId })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to send request");
            }

            // Update local state
            setResults(prev => prev.map(u =>
                u.id === targetUserId ? { ...u, hasPendingRequest: true } : u
            ));
        } catch (e: any) {
            alert(e.message);
        } finally {
            setRequesting(null);
        }
    };

    return (
        <div className="glass rounded-3xl p-6">
            <div className="mb-4">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    <Search className="h-5 w-5 text-indigo-500" />
                    Find Friends
                </h3>
                <p className="text-sm text-zinc-500">Search and add friends</p>
            </div>

            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search by name or username..."
                        className="glass w-full rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                </div>

                <div className="space-y-2">
                    {searching ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                        </div>
                    ) : results.length > 0 ? (
                        results.map((user) => (
                            <div key={user.id} className="glass flex items-center justify-between rounded-xl p-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.name} className="h-full w-full rounded-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-bold">{user.name?.[0]?.toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{user.name}</div>
                                        <div className="text-xs text-zinc-500">@{user.username}</div>
                                    </div>
                                </div>
                                {user.isFriend ? (
                                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Friend</span>
                                ) : user.hasPendingRequest ? (
                                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Sent</span>
                                ) : (
                                    <button
                                        onClick={() => sendFriendRequest(user.id)}
                                        disabled={requesting === user.id}
                                        className="rounded-lg bg-indigo-600 p-1.5 text-white hover:bg-indigo-500 disabled:opacity-50"
                                    >
                                        {requesting === user.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <UserPlus className="h-4 w-4" />
                                        )}
                                    </button>
                                )}
                            </div>
                        ))
                    ) : query.length >= 2 ? (
                        <p className="text-center text-sm text-zinc-500">No users found.</p>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
