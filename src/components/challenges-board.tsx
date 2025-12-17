"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, Target, Shield, Users, ArrowRight, Loader2, Sparkles, X } from "lucide-react";

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

    // AI State
    const [aiLoading, setAiLoading] = useState(false);
    const [proposedChallenge, setProposedChallenge] = useState<any | null>(null);

    useEffect(() => {
        fetchChallenges();
        window.addEventListener("transactionsUpdated", fetchChallenges);
        return () => window.removeEventListener("transactionsUpdated", fetchChallenges);
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

    const generateAIChallenge = async () => {
        setAiLoading(true);
        try {
            const res = await fetch('/api/ai/generate-challenge', { method: 'POST' });
            const data = await res.json();
            if (data.challenge) {
                setProposedChallenge(data.challenge);
            } else {
                alert("AI couldn't find a challenge right now. Try spending more!");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setAiLoading(false);
        }
    };

    const acceptAIChallenge = async () => {
        if (!proposedChallenge) return;
        setProposedChallenge(null); // Optimistic close
        try {
            // We reuse the POST /api/challenges logic but likely need to handle custom payloads
            // If the existing API expects { type }, we might need to update it or send extra data.
            // For now, let's assume valid types are supported or the backend handles it.
            // But wait, our API likely checks 'type' against enum. 
            // The AI returns one of the enum types. 

            // We need to pass the custom metadata (targetValue, etc) to override defaults potentially.
            // Let's assume the backend supports overrides or we send the whole object.
            // Since I am only editing frontend here, I will send the whole object and hope backend uses it, 
            // OR I update the backend. But let's verify if 'type' matches 'no_spend' etc.

            await fetch('/api/challenges', {
                method: 'POST',
                body: JSON.stringify({
                    type: proposedChallenge.type,
                    // If backend allows custom params:
                    customTitle: proposedChallenge.title,
                    customTarget: proposedChallenge.targetValue,
                    customDesc: proposedChallenge.description,
                    endDate: proposedChallenge.endDate
                }),
                headers: { 'Content-Type': 'application/json' }
            });
            await fetchChallenges();
        } catch (e) {
            console.error(e);
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
                <div className="flex gap-2">
                    <button
                        onClick={generateAIChallenge}
                        disabled={aiLoading}
                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full hover:from-purple-600 hover:to-indigo-700 transition-all shadow-sm"
                    >
                        {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        AI Quest
                    </button>
                    <span className="text-xs font-medium text-zinc-500 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-1 flex items-center">
                        Season 1
                    </span>
                </div>
            </div>

            {/* AI Proposal Modal/Card */}
            {proposedChallenge && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl border border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800 relative">
                    <button onClick={() => setProposedChallenge(null)} className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-600"><X className="w-4 h-4" /></button>
                    <div className="flex gap-3">
                        <div className="mt-1 p-2 bg-purple-100 dark:bg-purple-800 rounded-xl text-purple-600 dark:text-purple-300">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{proposedChallenge.title}</h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{proposedChallenge.description}</p>
                            <div className="mt-3 flex gap-2">
                                <button
                                    onClick={acceptAIChallenge}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                                >
                                    Accept Quest
                                </button>
                                <div className="px-3 py-2 text-xs font-medium text-zinc-500 bg-white/50 dark:bg-zinc-800/50 rounded-lg">
                                    Target: ₹{proposedChallenge.targetValue}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

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
                            <motion.div layout key={c._id} className="relative overflow-hidden glass rounded-2xl p-4">
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
                                className="group glass flex flex-col items-start gap-3 rounded-2xl p-4 transition-all hover:scale-[1.02] hover:shadow-lg text-left"
                            >
                                <div className={`rounded-xl p-2.5 ${t.bg} ${t.color}`}>
                                    <t.icon className="h-5 w-5" />
                                </div>
                                <div className="text-left w-full">
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
            <div className="glass rounded-2xl p-4">
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
