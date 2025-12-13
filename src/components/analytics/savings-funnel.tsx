"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

interface FunnelProps {
    funnelData: any[];
    riskScore: number;
}

export default function SavingsFunnel({ funnelData, riskScore }: FunnelProps) {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Funnel Chart */}
            <div className="rounded-3xl border border-zinc-200/50 bg-white/50 p-6 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-transparent">
                <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Cash Flow
                </h3>
                <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={funnelData} layout="vertical">
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', background: 'rgba(0,0,0,0.8)', color: '#fff' }} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                                {funnelData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Overdraft Risk Meter */}
            <div className="rounded-3xl border border-zinc-200/50 bg-white/50 p-6 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-transparent flex flex-col items-center justify-center">
                <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Overdraft Risk
                </h3>

                <div className="relative h-32 w-32 flex items-center justify-center">
                    {/* Background Circle */}
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                        <path
                            className="text-zinc-200 dark:text-zinc-800"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        {/* Progress Circle */}
                        <path
                            className={`${riskScore > 50 ? 'text-rose-500' : 'text-emerald-500'} transition-all duration-1000 ease-out`}
                            strokeDasharray={`${riskScore}, 100`}
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-bold dark:text-white">{riskScore}%</span>
                        <span className="text-[10px] text-zinc-500">Prob</span>
                    </div>
                </div>

                <p className="mt-4 text-center text-xs text-zinc-500">
                    {riskScore > 50 ? "⚠️ High expenses predicted!" : "✅ Safe zone."}
                </p>
            </div>
        </div>
    );
}
