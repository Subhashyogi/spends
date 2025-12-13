"use client";

import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from 'recharts';

interface RadarProps {
    data: any[];
}

export default function CategoryRadar({ data }: RadarProps) {
    // If no data, show empty state
    if (!data || data.length === 0) {
        return (
            <div className="rounded-3xl border border-zinc-200/50 bg-white/50 p-6 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/50 h-[300px] flex items-center justify-center text-zinc-500">
                Not enough data for Radar
            </div>
        );
    }

    return (
        <div className="rounded-3xl border border-zinc-200/50 bg-white/50 p-6 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-transparent">
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Category Balance
            </h3>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                        <PolarGrid stroke="#52525b" strokeOpacity={0.2} />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                        <Radar
                            name="Spending"
                            dataKey="A"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            fill="#8b5cf6"
                            fillOpacity={0.4}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', background: 'rgba(0,0,0,0.8)', color: '#fff' }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
