"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function HealthScoreCard() {
    const [score, setScore] = useState(0);
    const [breakdown, setBreakdown] = useState<any>(null);
    const [tips, setTips] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchScore = () => {
        fetch("/api/analytics/score")
            .then(res => res.json())
            .then(data => {
                setScore(data.score || 0);
                setBreakdown(data.breakdown);
                setTips(data.tips || []);
                setLoading(false);
            })
            .catch(err => console.error(err));
    };

    useEffect(() => {
        fetchScore();
        window.addEventListener("transactionsUpdated", fetchScore);
        return () => window.removeEventListener("transactionsUpdated", fetchScore);
    }, []);

    const getColor = (s: number) => {
        if (s >= 80) return "text-emerald-400";
        if (s >= 50) return "text-yellow-400";
        return "text-red-400";
    };

    const getGrade = (s: number) => {
        if (s >= 80) return "Excellent";
        if (s >= 50) return "Average";
        return "Critical";
    };

    if (loading) return <div className="h-64 rounded-3xl bg-gray-900/50 animate-pulse border border-white/5"></div>;

    // Circular Progress Calculation
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="rounded-3xl border border-white/10 bg-gray-900/40 backdrop-blur-md p-6 relative overflow-hidden">
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] opacity-20 pointer-events-none
                ${score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} />

            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="p-1 rounded bg-indigo-500/20 text-indigo-400">❤️</span>
                Financial Health
            </h3>

            <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Meter */}
                <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="80"
                            cy="80"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            className="text-gray-800"
                        />
                        <motion.circle
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            cx="80"
                            cy="80"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeLinecap="round"
                            className={getColor(score)}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-4xl font-bold ${getColor(score)}`}>{score}</span>
                        <span className="text-xs text-gray-400 uppercase tracking-widest mt-1">Score</span>
                    </div>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-4 w-full">
                    <div>
                        <h4 className={`text-2xl font-bold ${getColor(score)}`}>{getGrade(score)}</h4>
                        <p className="text-sm text-gray-400">Based on your recent activity</p>
                    </div>

                    {tips.length > 0 && (
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                            <p className="text-sm text-indigo-300 font-medium mb-2">💡 Tips to Improve:</p>
                            <ul className="space-y-1">
                                {tips.map((tip, i) => (
                                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                        <span className="mt-1 block h-1 w-1 rounded-full bg-indigo-400" />
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Breakdown Mini Bars */}
            {breakdown && (
                <div className="grid grid-cols-5 gap-2 mt-6 border-t border-white/5 pt-4">
                    {Object.entries(breakdown).map(([key, val]: any) => (
                        <div key={key} className="flex flex-col gap-1">
                            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(val / (key === 'savings' ? 30 : key === 'budget' ? 25 : 15)) * 100}%` }}
                                    className={`h-full rounded-full ${getColor(score)}`}
                                />
                            </div>
                            <span className="text-[10px] uppercase text-gray-500 font-medium truncate">{key}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
