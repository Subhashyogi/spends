"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function BehaviorCard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/analytics/behavior")
            .then(res => res.json())
            .then(d => {
                setData(d);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    if (loading) return null;
    if (!data || !data.insights || data.insights.length === 0) return null;

    const maxTimeVal = Math.max(...Object.values(data.timeBuckets || {}) as number[]);

    return (
        <div className="glass relative overflow-hidden rounded-3xl p-6">
            {/* Gradient Background - Subtle */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 opacity-50" />

            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
                <span className="p-1 rounded bg-purple-500/20 text-purple-600 dark:text-purple-400">🧠</span>
                Behavioral DNA
            </h3>

            <div className="space-y-6">
                {/* Insights List */}
                <div className="grid gap-4">
                    {data.insights.map((insight: any, i: number) => (
                        <motion.div
                            key={i}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass flex gap-4 items-start p-4 hover:border-purple-500/30 transition-colors"
                        >
                            <div className="text-2xl mt-1">
                                {insight.type === 'time' ? '⏰' : insight.type === 'weekend' ? '🎉' : '🛍️'}
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">{insight.title}</h4>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{insight.message}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Time of Day Viz */}
                {data.timeBuckets && (
                    <div className="pt-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
                        <p className="text-xs text-zinc-400 uppercase font-medium mb-3 tracking-wider">Spending Routine</p>
                        <div className="flex items-end gap-2 h-24">
                            {['morning', 'afternoon', 'evening', 'night'].map((time) => {
                                const val = data.timeBuckets[time] || 0;
                                const height = maxTimeVal > 0 ? (val / maxTimeVal) * 100 : 0;
                                return (
                                    <div key={time} className="flex-1 flex flex-col justify-end gap-2 group">
                                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-t-lg relative overflow-hidden h-full">
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${height}%` }}
                                                transition={{ duration: 1 }}
                                                className={`absolute bottom-0 w-full rounded-t-lg opacity-80 group-hover:opacity-100 transition-opacity
                                                    ${time === 'morning' ? 'bg-orange-400' :
                                                        time === 'afternoon' ? 'bg-yellow-400' :
                                                            time === 'evening' ? 'bg-indigo-400' : 'bg-purple-600'}`}
                                            />
                                        </div>
                                        <span className="text-[10px] text-center text-zinc-500 capitalize truncate">{time}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
