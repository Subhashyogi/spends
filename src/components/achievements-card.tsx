"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { safeJson } from "@/lib/http";
import { Trophy, Medal, Lock, X, ChevronRight } from "lucide-react";

type Badge = {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    unlocked: boolean;
    unlockedAt?: string;
};

export default function AchievementsCard() {
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        loadBadges();

        // Listen for transaction updates to re-check badges
        const onUpdate = () => checkBadges();
        window.addEventListener("transactionsUpdated", onUpdate);
        return () => window.removeEventListener("transactionsUpdated", onUpdate);
    }, []);

    async function loadBadges() {
        try {
            const res = await fetch("/api/badges");
            const { ok, data } = await safeJson(res);
            if (ok) setBadges(data.data || data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function checkBadges() {
        // Trigger a check on the server
        try {
            await fetch("/api/badges", { method: "POST" });
            loadBadges(); // Reload to get updated status
        } catch (e) {
            console.error(e);
        }
    }

    const unlockedBadges = badges.filter(b => b.unlocked);
    const unlockedCount = unlockedBadges.length;

    // Rank Logic
    let rank = { name: "Beginner", icon: "🌱", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20", min: 0, max: 5 };
    if (unlockedCount >= 20) rank = { name: "Elite Money Master", icon: "👑", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20", min: 20, max: 100 };
    else if (unlockedCount >= 10) rank = { name: "Pro Planner", icon: "🚀", color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20", min: 10, max: 20 };
    else if (unlockedCount >= 5) rank = { name: "Smart Saver", icon: "💡", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20", min: 5, max: 10 };

    const nextRankThreshold = rank.max;
    const progressToNext = Math.min(100, Math.round(((unlockedCount - rank.min) / (rank.max - rank.min)) * 100));

    const recentUnlocks = [...unlockedBadges].sort((a, b) =>
        new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime()
    ).slice(0, 3);

    const nextToUnlock = badges.find(b => !b.unlocked);

    if (loading) {
        return <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />;
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            Achievements
                        </h3>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                    >
                        View All <ChevronRight className="h-3 w-3" />
                    </button>
                </div>

                {/* Rank Section */}
                <div className="mb-4 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-xl ${rank.bg}`}>
                                {rank.icon}
                            </div>
                            <div>
                                <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Current Rank</div>
                                <div className={`text-sm font-bold ${rank.color}`}>{rank.name}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{unlockedCount}</div>
                            <div className="text-xs text-zinc-500">Badges</div>
                        </div>
                    </div>
                    {unlockedCount < 20 && (
                        <div className="mt-3">
                            <div className="mb-1 flex justify-between text-[10px] font-medium text-zinc-500">
                                <span>Progress to next rank</span>
                                <span>{unlockedCount} / {nextRankThreshold}</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                                <div className={`h-full transition-all duration-500 ${rank.color.replace('text-', 'bg-')}`} style={{ width: `${progressToNext}%` }} />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 space-y-3">
                    {recentUnlocks.length > 0 ? (
                        <div>
                            <div className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">Recent Unlocks</div>
                            <div className="flex gap-2">
                                {recentUnlocks.map(badge => (
                                    <div key={badge.id} className="group relative flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-50 text-2xl shadow-sm dark:bg-yellow-900/20">
                                        {badge.icon}
                                        <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-900 px-2 py-1 text-xs text-white group-hover:block dark:bg-zinc-100 dark:text-zinc-900">
                                            {badge.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl bg-zinc-50 p-4 text-center text-sm text-zinc-500 dark:bg-zinc-800/50">
                            Start using the app to unlock badges!
                        </div>
                    )}

                    {nextToUnlock && (
                        <div className="mt-4 rounded-xl border border-dashed border-zinc-200 p-3 dark:border-zinc-700">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                                    <Lock className="h-4 w-4" />
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-zinc-500">Next to Unlock</div>
                                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-200">{nextToUnlock.name}</div>
                                    <div className="text-xs text-zinc-400">{nextToUnlock.description}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {mounted && showModal && createPortal(
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-xl dark:bg-zinc-900"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between border-b p-6 dark:border-zinc-800">
                                <div>
                                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">All Achievements</h3>
                                    <p className="text-sm text-zinc-500">Collect them all!</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                    <X className="h-5 w-5 text-zinc-500" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                                    {badges.map(badge => (
                                        <div
                                            key={badge.id}
                                            className={`flex flex-col items-center rounded-2xl border p-4 text-center transition-all ${badge.unlocked
                                                ? "border-yellow-200 bg-yellow-50/50 dark:border-yellow-900/30 dark:bg-yellow-900/10"
                                                : "border-zinc-200 bg-zinc-50 opacity-60 grayscale dark:border-zinc-800 dark:bg-zinc-900"
                                                }`}
                                        >
                                            <div className="mb-2 text-3xl">{badge.icon}</div>
                                            <div className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{badge.name}</div>
                                            <div className="text-[10px] text-zinc-500 leading-tight">{badge.description}</div>
                                            {badge.unlocked && (
                                                <div className="mt-2 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                    Unlocked
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
