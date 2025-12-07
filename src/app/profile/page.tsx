"use client";

import { useEffect, useState } from "react";
import { safeJson } from "@/lib/http";
import Link from "next/link";
import CoupleConnect from "@/components/couple-connect";
import { signOut } from "next-auth/react";
import { Settings, ArrowLeft, Save, Loader2, FileText, LogOut, Trash2, UserMinus } from "lucide-react";
import AchievementsCard from "@/components/achievements-card";
import StreakCard from "@/components/streak-card";


const CURRENCIES = ["INR", "USD", "EUR", "GBP", "JPY"] as const;

export default function ProfilePage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [avatar, setAvatar] = useState("");
    const [friendsCount, setFriendsCount] = useState(0);
    const [friends, setFriends] = useState<any[]>([]);
    const [showFriends, setShowFriends] = useState(false);
    const [currency, setCurrency] = useState<string>("INR");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [friendRequests, setFriendRequests] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [requesting, setRequesting] = useState<string | null>(null);
    const [friendToUnfriend, setFriendToUnfriend] = useState<string | null>(null);
    const [showAllRequests, setShowAllRequests] = useState(false); // State for toggling requests view

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch("/api/user/settings", { cache: "no-store" });
                const { ok, data, status } = await safeJson(res);
                if (!ok) throw new Error(data?.message || data?.error || `HTTP ${status}`);
                setName(data.name || "");
                setEmail(data.email || "");
                setUsername(data.username || "");
                setAvatar(data.avatar || "");
                setFriendsCount(data.friendsCount || 0);
                setFriends(data.friends || []);
                setFriendRequests(data.friendRequests || []);
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
                body: JSON.stringify({ name, currency, avatar }),
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

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Show preview immediately
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatar(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload to server
        const formData = new FormData();
        formData.append('file', file);

        try {
            setSaving(true);
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            setAvatar(data.url); // Update with server URL

            // Auto-save the new avatar URL
            const saveRes = await fetch("/api/user/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ avatar: data.url }),
            });

            if (!saveRes.ok) throw new Error('Failed to save profile picture');

            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
            window.dispatchEvent(new CustomEvent("userSettingsUpdated"));
        } catch (error) {
            console.error('Upload error:', error);
            setError('Failed to upload image');
        } finally {
            setSaving(false);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            setSearchResults(data.users || []);
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

            // Update local state to show pending
            setSearchResults(prev => prev.map(u =>
                u.id === targetUserId ? { ...u, hasPendingRequest: true } : u
            ));
        } catch (e: any) {
            alert(e.message);
        } finally {
            setRequesting(null);
        }
    };

    const acceptRequest = async (requesterId: string) => {
        try {
            const res = await fetch("/api/friends/accept", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requesterId })
            });

            if (!res.ok) throw new Error("Failed to accept request");

            // Find the request to get user details
            const request = friendRequests.find(r => r.userId === requesterId);

            if (request) {
                setFriends(prev => [...prev, {
                    userId: request.userId,
                    username: request.username,
                    name: request.name
                }]);
                setFriendRequests(prev => prev.filter(r => r.userId !== requesterId));
                setFriendsCount(prev => prev + 1);
                window.dispatchEvent(new CustomEvent("userSettingsUpdated"));
            }
        } catch (e) {
            alert("Failed to accept request");
        }
    };

    const rejectRequest = async (requesterId: string) => {
        try {
            const res = await fetch("/api/friends/reject", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requesterId })
            });

            if (!res.ok) throw new Error("Failed to reject request");

            setFriendRequests(prev => prev.filter(r => r.userId !== requesterId));
        } catch (e) {
            alert("Failed to reject request");
        }
    };

    const handleUnfriend = (friendId: string) => {
        setFriendToUnfriend(friendId);
    };

    const confirmUnfriend = async () => {
        if (!friendToUnfriend) return;

        try {
            const res = await fetch("/api/friends/remove", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ friendId: friendToUnfriend })
            });

            if (!res.ok) throw new Error("Failed to remove friend");

            setFriends(prev => prev.filter(f => f.userId !== friendToUnfriend));
            setFriendsCount(prev => prev - 1);
            window.dispatchEvent(new CustomEvent("userSettingsUpdated"));
            setFriendToUnfriend(null);
        } catch (e) {
            console.error(e);
            alert("Failed to remove friend");
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-transparent">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
        );
    }



    // Filter incoming pending requests
    const incomingRequests = friendRequests.filter(r => r.type === 'incoming' && r.status === 'pending');
    const displayedRequests = showAllRequests ? incomingRequests : incomingRequests.slice(0, 5);

    return (
        <main className="min-h-screen space-y-8 bg-zinc-50 p-4 dark:bg-transparent sm:p-8">
            <div className="mx-auto w-full space-y-8">
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

                {/* Friend Requests Notification Box */}
                {incomingRequests.length > 0 && (
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/30 dark:bg-indigo-900/10">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
                                Friend Requests ({incomingRequests.length})
                            </h3>
                            {incomingRequests.length > 5 && (
                                <button
                                    onClick={() => setShowAllRequests(!showAllRequests)}
                                    className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                                >
                                    {showAllRequests ? "Show Less" : "View All"}
                                </button>
                            )}
                        </div>
                        <div className="space-y-3">
                            {displayedRequests.map((req: any) => (
                                <div key={req.userId} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm dark:bg-zinc-900">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                                            {req.name ? req.name.charAt(0).toUpperCase() : "U"}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{req.name}</p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">@{req.username}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => acceptRequest(req.userId)}
                                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => rejectRequest(req.userId)}
                                            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Profile Form */}
                <div className="rounded-2xl border bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-start">
                        <div className="relative group">
                            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-indigo-100 text-3xl font-bold text-indigo-600 overflow-hidden dark:bg-indigo-500/20 dark:text-indigo-400">
                                {avatar ? (
                                    <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    name ? name.charAt(0).toUpperCase() : "U"
                                )}
                            </div>
                            <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer">
                                <span className="text-xs font-medium text-white">Change</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                            </label>
                        </div>
                        <div className="text-center sm:text-left">
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{name || "User"}</h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">@{username || "username"}</p>
                        </div>
                    </div>

                    <h2 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Personal Information</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-200"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Username</label>
                            <input
                                disabled
                                value={username}
                                className="w-full cursor-not-allowed rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-500"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Email Address</label>
                            <input
                                disabled
                                value={email}
                                className="w-full cursor-not-allowed rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-2 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-500"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Preferred Currency</label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-200"
                            >
                                {CURRENCIES.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Friends</label>
                            <button
                                onClick={() => setShowFriends(true)}
                                className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-200 dark:hover:bg-zinc-800"
                            >
                                <span>{friendsCount} Friends</span>
                                <span className="text-xs text-indigo-600 dark:text-indigo-400">View All</span>
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-end">
                        <button
                            onClick={onSave}
                            disabled={saving}
                            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 font-medium text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-50 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            Save Changes
                        </button>
                    </div>
                    {saved && <p className="mt-2 text-right text-sm text-emerald-600 dark:text-emerald-400">Profile updated!</p>}
                </div>

                {/* Friends Modal with Search */}
                {showFriends && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900">
                            <div className="flex items-center justify-between border-b border-zinc-100 p-4 dark:border-zinc-800">
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Friends</h3>
                                <button onClick={() => setShowFriends(false)} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
                                    <span className="sr-only">Close</span>
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="p-4">
                                {/* Search Bar */}
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        placeholder="Search users to add..."
                                        value={searchQuery}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-200"
                                    />
                                </div>

                                {/* Search Results */}
                                {searchQuery.length >= 2 && (
                                    <div className="mb-6 space-y-2">
                                        <h4 className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Search Results</h4>
                                        {searching ? (
                                            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-zinc-400" /></div>
                                        ) : searchResults.length > 0 ? (
                                            searchResults.map((user) => (
                                                <div key={user.id} className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                                                            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{user.name}</p>
                                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">@{user.username}</p>
                                                        </div>
                                                    </div>
                                                    {user.isFriend ? (
                                                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Friends</span>
                                                    ) : user.hasPendingRequest ? (
                                                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Sent</span>
                                                    ) : (
                                                        <button
                                                            onClick={() => sendFriendRequest(user.id)}
                                                            disabled={requesting === user.id}
                                                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                                                        >
                                                            {requesting === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add Friend"}
                                                        </button>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-center text-sm text-zinc-500">No users found.</p>
                                        )}
                                    </div>
                                )}

                                {/* Friends List */}
                                <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Your Friends</h4>
                                <div className="max-h-[40vh] overflow-y-auto space-y-3">
                                    {friends.length > 0 ? (
                                        friends.map((friend: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                                                        {friend.name ? friend.name.charAt(0).toUpperCase() : "U"}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{friend.name || "Unknown"}</p>
                                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">@{friend.username || "username"}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleUnfriend(friend.userId)}
                                                    className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-500 dark:hover:bg-rose-500/20"
                                                >
                                                    <UserMinus className="h-3.5 w-3.5" />
                                                    Unfriend
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-4 text-center text-zinc-500 dark:text-zinc-400">
                                            <p>No friends yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Unfriend Confirmation Modal */}
                {friendToUnfriend && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Unfriend User?</h3>
                            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                                Are you sure you want to remove this friend? This action cannot be undone.
                            </p>
                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => setFriendToUnfriend(null)}
                                    className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmUnfriend}
                                    className="flex-1 rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500"
                                >
                                    Unfriend
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Couple Connect */}
                <CoupleConnect />

                {/* Gamification */}
                <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Your Progress</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
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
