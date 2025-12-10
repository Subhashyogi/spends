"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, Target, Shield, Users, ArrowRight, Loader2 } from "lucide-react";

interface Challenge {
    _id: string;
    type: string;
    title: string;
    description: string;
    targetValue: number;
    currentValue: number;
    status: 'active' | 'completed' | 'failed';
    startDate: string;
}

export default function ChallengesBoard() {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState<string | null>(null);
    const [leaderboardView, setLeaderboardView] = useState<'friends' | 'world'>('friends');
    const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);

    useEffect(() => {
        fetchChallenges();
    }, []);

    useEffect(() => {
        fetchLeaderboard();
    }, [leaderboardView]);

    const fetchLeaderboard = async () => {
        setLeaderboardLoading(true);
        try {
            const res = await fetch(`/api/leaderboard?type=${leaderboardView}`);
            const data = await res.json();
            if (data.leaderboard) setLeaderboardData(data.leaderboard);
        } catch (e) {
            console.error(e);
        } finally {
            setLeaderboardLoading(false);
        }
    };

    const fetchChallenges = async () => {
        try {
            const res = await fetch('/api/challenges');
            const data = await res.json();
            if (data.challenges) setChallenges(data.challenges);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const joinChallenge = async (type: string) => {
        setJoining(type);
        try {
            await fetch('/api/challenges', {
                method: 'POST',
                body: JSON.stringify({ type }),
                headers: { 'Content-Type': 'application/json' }
            });
            await fetchChallenges();
        } catch (e) {
            // error
        } finally {
            setJoining(null);
        }
    };

    const active = challenges.filter(c => c.status === 'active');
    // const completed = challenges.filter(c => c.status === 'completed');

    // Available types that are NOT active
    const availableTypes = [
        { type: 'no_spend', title: 'No-Spend Week', desc: 'Survive 7 days with ₹0 non-essential spend.', icon: Shield, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
        { type: 'budget_cut', title: 'Food Cutter', desc: 'Reduce dining out by 20% this month.', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
        { type: 'savings_sprint', title: 'Savings Sprint', desc: 'Save ₹2,000 extra in 7 days.', icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    ].filter(t => !active.find(a => a.type === t.type));

    if (loading) return <div className="h-40 flex items-center justify-center"><Loader2 className="animate-spin text-zinc-400" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Money Challenges
                </h2>
                <span className="text-xs font-medium text-zinc-500 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-1">
                    Season 1
                </span>
            </div>

            {/* Active Challenges */}
            {active.length > 0 && (
                <div className="grid gap-3">
                    {active.map(c => {
                        // Calc progress
                        let progress = 0;
                        let label = "";

                        if (c.type === 'no_spend') {
                            progress = (c.currentValue / c.targetValue) * 100;
                            label = `${c.currentValue}/${c.targetValue} Days Clean`;
                        } else if (c.type === 'budget_cut') {
                            // Inverse progress: Closer to target is good? 
                            // Wait, target is Spending Limit. 
                            // So % used = Current / Target.
                            progress = (c.currentValue / c.targetValue) * 100;
                            label = `₹${c.currentValue} / ₹${c.targetValue} Spent`;
                        }

                        return (
                            <motion.div layout key={c._id} className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{c.title}</h3>
                                        <p className="text-xs text-zinc-500">{label}</p>
                                    </div>
                                    <div className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold dark:bg-emerald-900/30 dark:text-emerald-400">
                                        ACTIVE
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(progress, 100)}%` }}
                                        className={`h-full rounded-full ${progress > 100 ? 'bg-rose-500' : 'bg-indigo-600'}`}
                                    />
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            {/* Available Challenges */}
            {availableTypes.length > 0 && (
                <div>
                    <h3 className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">Available Quests</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {availableTypes.map(t => (
                            <button
                                key={t.type}
                                onClick={() => joinChallenge(t.type)}
                                disabled={!!joining}
                                className="group flex flex-col items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                            >
                                <div className={`rounded-xl p-2.5 ${t.bg} ${t.color}`}>
                                    <t.icon className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {t.title}
                                    </h4>
                                    <p className="mt-1 text-xs text-zinc-500 line-clamp-2">
                                        {t.desc}
                                    </p>
                                </div>
                                <div className="mt-auto flex w-full items-center justify-between pt-2">
                                    <span className="text-xs font-medium text-zinc-400">+500 XP</span>
                                    {joining === t.type ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                                    ) : (
                                        <ArrowRight className="h-4 w-4 text-zinc-300 group-hover:text-indigo-500 transition-colors" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Leaderboard Section */}
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-zinc-500" />
                        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Leaderboard</h3>
                    </div>

                    <div className="flex bg-zinc-200/50 dark:bg-zinc-800 rounded-lg p-1">
                        <button
                            onClick={() => setLeaderboardView('friends')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${leaderboardView === 'friends' ? 'bg-white shadow text-zinc-900 dark:bg-zinc-700 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'}`}
                        >
                            Friends
                        </button>
                        <button
                            onClick={() => setLeaderboardView('world')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${leaderboardView === 'world' ? 'bg-white shadow text-zinc-900 dark:bg-zinc-700 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'}`}
                        >
                            World
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    {leaderboardLoading ? (
                        <div className="flex justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                        </div>
                    ) : leaderboardData.length > 0 ? (
                        leaderboardData.map((p, i) => (
                            <div key={p.userId} className={`flex items-center justify-between text-sm ${p.me ? 'font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 -mx-2 px-2 py-1 rounded-lg' : 'text-zinc-600 dark:text-zinc-400 px-2'}`}>
                                <div className="flex items-center gap-3">
                                    <span className={`w-6 text-center font-mono text-xs ${p.rank <= 3 ? (p.rank === 1 ? 'text-yellow-500' : p.rank === 2 ? 'text-zinc-400' : 'text-amber-700') : 'text-zinc-500'}`}>
                                        #{p.rank}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {p.image && <img src={p.image} alt={p.name} className="w-5 h-5 rounded-full object-cover" />}
                                        <span>{p.name}</span>
                                    </div>
                                </div>
                                <span className="font-medium">{p.score} XP</span>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-6 text-xs text-zinc-500">
                            No players found in this league yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
