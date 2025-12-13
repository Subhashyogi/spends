"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Insight = {
    _id: string;
    type: string;
    title: string;
    message: string;
    status: string;
    data: any;
    confidence: string;
};

export default function InsightsCenter() {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchInsights = async () => {
        try {
            const res = await fetch("/api/ai/insights");
            if (res.ok) {
                const data = await res.json();
                setInsights(data);
            }
        } catch (error) {
            console.error("Failed to fetch insights", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        setInsights(prev => prev.filter(i => i._id !== id));
        try {
            await fetch("/api/ai/insights", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ insightId: id, action })
            });
        } catch (error) {
            console.error("Failed to update insight", error);
            fetchInsights();
        }
    };

    useEffect(() => {
        fetchInsights();
        const interval = setInterval(fetchInsights, 60000);

        window.addEventListener("transactionsUpdated", fetchInsights);

        return () => {
            clearInterval(interval);
            window.removeEventListener("transactionsUpdated", fetchInsights);
        };
    }, []);

    if (loading) return null; // Don't show anything while loading to avoid layout shift
    if (insights.length === 0) return null;

    return (
        <section className="mb-0 relative">
            {/* Header with animated gradient */}
            <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 blur-lg opacity-50 animate-pulse" />
                    <div className="relative h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-purple-500/30 text-white">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">
                        AI Autopilot
                    </h2>
                    <p className="text-xs text-indigo-300 font-medium tracking-wide uppercase">
                        {insights.length} Action{insights.length > 1 ? 's' : ''} Required
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence>
                    {insights.map((insight) => (
                        <motion.div
                            key={insight._id}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className="relative group overflow-hidden rounded-3xl border border-white/10 bg-gray-900/40 backdrop-blur-md shadow-2xl transition-all hover:bg-gray-800/60 hover:border-indigo-500/30"
                        >
                            {/* Animated Background Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-transparent to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            {/* Glow Effect */}
                            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl transition-all group-hover:bg-indigo-500/30" />

                            <div className="relative p-6 z-10">
                                {/* Tag & Confidence */}
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider
                                        ${insight.type === 'alert' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                            insight.type === 'budget_adjust' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                        {insight.type === 'alert' ? '⚠️ Alert' : insight.type === 'recurring_transaction' ? '🔄 Recurring' : '💡 Insight'}
                                    </span>
                                    {insight.confidence === 'high' && (
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400/90 bg-amber-400/10 px-2 py-1 rounded-full border border-amber-400/20">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                            </span>
                                            High Confidence
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <h3 className="text-lg font-bold text-white mb-2 leading-tight">
                                    {insight.title}
                                </h3>
                                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                    {insight.message}
                                </p>

                                {/* Actions */}
                                <div className="flex items-center gap-3">
                                    {insight.type !== 'alert' && (
                                        <button
                                            onClick={() => handleAction(insight._id, 'approve')}
                                            className="flex-1 group/btn relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 p-[1px] shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <div className="relative flex items-center justify-center gap-2 rounded-xl bg-gray-900/50 backdrop-blur-sm px-4 py-2.5 transition-all group-hover/btn:bg-transparent">
                                                <span className="text-sm font-semibold text-white">Approve</span>
                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleAction(insight._id, 'reject')}
                                        className={`flex-1 rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-2.5 text-sm font-medium text-gray-400 transition-all hover:bg-gray-800 hover:text-white hover:border-gray-600 active:scale-[0.98] ${insight.type === 'alert' ? 'w-full bg-gray-800 text-white' : ''}`}
                                    >
                                        {insight.type === 'alert' ? 'Dismiss' : 'Decline'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </section>
    );
}
