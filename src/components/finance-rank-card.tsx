"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Star, Crown, Medal } from "lucide-react";
import { BADGES } from "@/lib/badges";

export default function FinanceRankCard() {
    const [rank, setRank] = useState({ title: "Beginner", nextTitle: "Saver", progress: 0, icon: Star });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRank();
    }, []);

    async function fetchRank() {
        try {
            const res = await fetch("/api/user/badges"); // Assuming badges API returns rank info or we calculate it
            const data = await res.json();
            // Mocking rank calculation for now if API doesn't return it directly
            // In a real app, this logic might be shared or backend-driven
            if (data.badges) {
                const count = data.badges.length;
                let title = "Beginner";
                let nextTitle = "Saver";
                let progress = 0;
                let icon = Star;

                if (count >= 20) { title = "Elite Money Master"; nextTitle = "Maxed Out"; progress = 100; icon = Crown; }
                else if (count >= 10) { title = "Wealth Wizard"; nextTitle = "Elite Money Master"; progress = (count - 10) / 10 * 100; icon = Trophy; }
                else if (count >= 5) { title = "Smart Spender"; nextTitle = "Wealth Wizard"; progress = (count - 5) / 5 * 100; icon = Medal; }
                else { title = "Beginner"; nextTitle = "Smart Spender"; progress = count / 5 * 100; icon = Star; }

                setRank({ title, nextTitle, progress, icon });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />;

    const Icon = rank.icon;

    return (
        <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />

            <div className="relative flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
                    <Icon className="h-8 w-8" />
                </div>
                <div>
                    <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Current Rank</div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{rank.title}</h3>
                </div>
            </div>

            <div className="mt-6">
                <div className="mb-2 flex justify-between text-xs font-medium">
                    <span className="text-indigo-600 dark:text-indigo-400">{Math.round(rank.progress)}% to {rank.nextTitle}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${rank.progress}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"
                    />
                </div>
            </div>
        </div>
    );
}
