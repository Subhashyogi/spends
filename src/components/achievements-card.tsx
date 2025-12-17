"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { safeJson } from "@/lib/http";
import { Trophy, Lock, X, ChevronRight } from "lucide-react";

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
        try {
            await fetch("/api/badges", { method: "POST" });
            loadBadges();
        } catch (e) {
            console.error(e);
        }
    }

    const unlockedBadges = badges.filter(b => b.unlocked);
    const unlockedCount = unlockedBadges.length;

    // Rank Logic with Premium Emojis
    let rank = {
        name: "Beginner",
        icon: "🌱",
        color: "text-emerald-400",
        gradient: "from-emerald-400 to-teal-500",
        bg: "bg-emerald-500/10",
        min: 0,
        max: 5
    };

    if (unlockedCount >= 20) rank = {
        name: "Elite Money Master",
        icon: "👑",
        color: "text-yellow-400",
        gradient: "from-yellow-400 to-amber-600",
        bg: "bg-yellow-500/10",
        min: 20,
        max: 100
    };
    else if (unlockedCount >= 10) rank = {
        name: "Pro Planner",
        icon: "🚀",
        color: "text-indigo-400",
        gradient: "from-indigo-400 to-purple-600",
        bg: "bg-indigo-500/10",
        min: 10,
        max: 20
    };
    else if (unlockedCount >= 5) rank = {
        name: "Smart Saver",
        icon: "💡",
        color: "text-blue-400",
        gradient: "from-blue-400 to-cyan-500",
        bg: "bg-blue-500/10",
        min: 5,
        max: 10
    };

    const nextRankThreshold = rank.max;
    const progressToNext = Math.min(100, Math.round(((unlockedCount - rank.min) / (rank.max - rank.min)) * 100));

    // Sort unlocked badges by date (newest first)
    const sortedUnlockedBadges = [...unlockedBadges].sort((a, b) =>
        new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime()
    );

    const nextToUnlock = badges.find(b => !b.unlocked);

    if (loading) {
        return <div className="h-48 animate-pulse rounded-3xl bg-zinc-900/50" />;
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass flex flex-col overflow-hidden rounded-3xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-200/10 p-6">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Achievements
                    </h3>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                    >
                        View All <ChevronRight className="h-3 w-3" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Rank Card */}
                    <div className="glass-heavy relative overflow-hidden rounded-2xl p-6">
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`flex h-14 w-14 items-center justify-center rounded-full border border-black/5 bg-white/20 text-3xl shadow-inner dark:border-white/10 dark:bg-black/20`}>
                                    {rank.icon}
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Current Rank</div>
                                    <div className={`text-lg font-bold ${rank.color} bg-gradient-to-r ${rank.gradient} bg-clip-text text-transparent`}>
                                        {rank.name}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{unlockedCount}</div>
                                <div className="text-xs font-medium text-zinc-500">Badges</div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative z-10 mt-6">
                            <div className="mb-2 flex justify-between text-[10px] font-medium text-zinc-500">
                                <span>Progress to next rank</span>
                                <span>{unlockedCount} / {nextRankThreshold}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressToNext}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className={`h-full bg-gradient-to-r ${rank.gradient} shadow-[0_0_15px_rgba(0,0,0,0.5)]`}
                                />
                            </div>
                        </div>

                        {/* Background Glow */}
                        <div className={`absolute -right-10 -top-10 h-40 w-40 rounded-full blur-[60px] opacity-20 ${rank.bg.replace('/10', '')}`} />
                    </div>

                    {/* Unlocked Achievements (Scrollable) */}
                    <div className="mt-8">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Unlocked Achievements</div>
                            <span className="text-[10px] text-zinc-600">{sortedUnlockedBadges.length} unlocked</span>
                        </div>

                        {sortedUnlockedBadges.length > 0 ? (
                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800">
                                {sortedUnlockedBadges.map((badge, i) => (
                                    <motion.div
                                        key={badge.id}
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group relative flex-shrink-0"
                                    >
                                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl glass text-3xl shadow-sm transition-all hover:scale-105 hover:shadow-md">
                                            {badge.icon}
                                        </div>
                                        <div className="absolute -bottom-8 left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-800 px-2 py-1 text-[10px] font-medium text-white shadow-xl border border-zinc-700 group-hover:block">
                                            {badge.name}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="glass rounded-xl p-4 text-center text-sm text-zinc-500">
                                Start your journey to unlock badges!
                            </div>
                        )}
                    </div>

                    {/* Next to Unlock */}
                    {nextToUnlock && (
                        <div className="mt-4">
                            <div className="mb-4 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Next to Unlock</div>
                            <div className="group relative overflow-hidden rounded-2xl glass p-1 transition-all">
                                <div className="flex items-center gap-4 p-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 group-hover:text-zinc-400 transition-colors">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{nextToUnlock.name}</div>
                                            <span className="text-[10px] font-medium text-zinc-500">Locked</span>
                                        </div>
                                        <div className="text-xs text-zinc-500">{nextToUnlock.description}</div>
                                    </div>
                                </div>
                                {/* Progress hint */}
                                <div className="absolute bottom-0 left-0 h-1 w-full bg-zinc-100 dark:bg-zinc-800/50">
                                    <div className={`h-full w-1/3 bg-gradient-to-r ${rank.gradient} shadow-[0_0_10px_rgba(0,0,0,0.5)]`} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Modal */}
            {mounted && showModal && createPortal(
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="glass flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between border-b border-zinc-200/10 p-6">
                                <div>
                                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">All Achievements</h3>
                                    <p className="text-sm text-zinc-400">Track your progress and collect them all</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="rounded-full bg-zinc-100 dark:bg-zinc-800 p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                                    {badges.map((badge, i) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            key={badge.id}
                                            className={`relative flex flex-col items-center overflow-hidden rounded-2xl border p-5 text-center transition-all ${badge.unlocked
                                                ? "glass border-emerald-500/20 shadow-lg"
                                                : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50 opacity-50 grayscale"
                                                }`}
                                        >
                                            <div className="mb-3 text-4xl drop-shadow-md">{badge.icon}</div>
                                            <div className="mb-1 text-sm font-bold text-zinc-900 dark:text-zinc-100">{badge.name}</div>
                                            <div className="text-[10px] font-medium text-zinc-500 leading-tight">{badge.description}</div>

                                            {badge.unlocked && (
                                                <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            )}
                                        </motion.div>
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
