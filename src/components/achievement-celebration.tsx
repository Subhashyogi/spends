"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { safeJson } from "@/lib/http";
import { Trophy, X } from "lucide-react";

type Badge = {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlocked: boolean;
};

export default function AchievementCelebration() {
    const [newUnlock, setNewUnlock] = useState<Badge | null>(null);

    useEffect(() => {
        checkNewUnlocks();

        // Listen for updates
        const onUpdate = () => checkNewUnlocks();
        window.addEventListener("transactionsUpdated", onUpdate);
        return () => window.removeEventListener("transactionsUpdated", onUpdate);
    }, []);

    async function checkNewUnlocks() {
        try {
            // 1. Fetch current badges
            const res = await fetch("/api/badges");
            const { ok, data } = await safeJson(res);
            if (!ok) return;

            const allBadges: Badge[] = data.data || data;
            const unlockedBadges = allBadges.filter(b => b.unlocked);
            const unlockedIds = unlockedBadges.map(b => b.id);

            // 2. Get stored unlocked IDs
            const stored = localStorage.getItem("unlockedBadges");
            const storedIds: string[] = stored ? JSON.parse(stored) : [];

            // 3. Find new unlocks
            const newIds = unlockedIds.filter(id => !storedIds.includes(id));

            if (newIds.length > 0) {
                // Found new unlocks!
                const firstNewBadge = unlockedBadges.find(b => b.id === newIds[0]);
                if (firstNewBadge) {
                    setNewUnlock(firstNewBadge);
                    // Update storage immediately to prevent loop, or wait until close?
                    // Let's update now so we don't show it again on refresh
                    localStorage.setItem("unlockedBadges", JSON.stringify(unlockedIds));
                }
            } else {
                // Sync storage if we have more stored than actual (rare) or just init
                if (unlockedIds.length > storedIds.length) {
                    localStorage.setItem("unlockedBadges", JSON.stringify(unlockedIds));
                }
            }
        } catch (e) {
            console.error("Failed to check achievements", e);
        }
    }

    if (!newUnlock) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                onClick={() => setNewUnlock(null)}
            >
                <motion.div
                    initial={{ scale: 0.5, y: 100, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.5, y: 100, opacity: 0 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="relative flex w-full max-w-sm flex-col items-center overflow-hidden rounded-3xl bg-zinc-900 p-8 text-center shadow-2xl border border-zinc-800"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Confetti / Rays Effect Background */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="h-[500px] w-[500px] bg-[conic-gradient(from_0deg,transparent_0_deg,indigo_90deg,transparent_180deg,indigo_270deg,transparent_360deg)]"
                        />
                    </div>

                    <button
                        onClick={() => setNewUnlock(null)}
                        className="absolute right-4 top-4 rounded-full p-2 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="relative z-10 mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-5xl shadow-lg shadow-indigo-500/30"
                    >
                        {newUnlock.icon}
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="relative z-10 text-2xl font-bold text-white"
                    >
                        Achievement Unlocked!
                    </motion.h2>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="relative z-10 mt-2 space-y-1"
                    >
                        <p className="text-lg font-medium text-indigo-400">{newUnlock.name}</p>
                        <p className="text-sm text-zinc-400">{newUnlock.description}</p>
                    </motion.div>

                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        onClick={() => setNewUnlock(null)}
                        className="relative z-10 mt-8 rounded-xl bg-white px-8 py-3 font-semibold text-zinc-900 shadow-lg hover:bg-zinc-100"
                    >
                        Awesome!
                    </motion.button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
