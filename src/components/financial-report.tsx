"use client";

import { forwardRef } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Target, Award } from "lucide-react";

type ReportData = {
    userName: string;
    month: string;
    year: number;
    income: number;
    expense: number;
    savings: number;
    savingsRate: number;
    topCategories: { name: string; value: number; color: string }[];
    dailySpending: { day: string; amount: number }[];
    insights: {
        type: "positive" | "negative" | "neutral";
        text: string;
    }[];
    recommendations: string[];
    score: number; // 0-100
};

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const FinancialReport = forwardRef<HTMLDivElement, { data: ReportData }>(({ data }, ref) => {
    const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

    return (
        <div ref={ref} className="mx-auto w-[210mm] bg-white p-[15mm] text-zinc-900 shadow-2xl print:shadow-none">
            {/* Header */}
            <div className="mb-8 flex items-end justify-between border-b-2 border-zinc-900 pb-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-zinc-900">Financial Report</h1>
                    <p className="text-lg text-zinc-500">{data.month} {data.year}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium text-zinc-500">Prepared for</p>
                    <p className="text-xl font-bold">{data.userName}</p>
                </div>
            </div>

            {/* Executive Summary */}
            <div className="mb-8 rounded-xl bg-zinc-50 p-6">
                <h2 className="mb-3 text-lg font-bold uppercase tracking-wider text-zinc-900">Executive Summary</h2>
                <div className="flex items-start gap-4">
                    <div className="flex-1">
                        <p className="text-sm leading-relaxed text-zinc-700">
                            This month, you had a total income of <span className="font-bold text-emerald-600">{fmt(data.income)}</span> and
                            expenses of <span className="font-bold text-rose-600">{fmt(data.expense)}</span>.
                            Your net savings are <span className={`font-bold ${data.savings >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(data.savings)}</span>,
                            resulting in a savings rate of <span className="font-bold">{data.savingsRate}%</span>.
                        </p>
                        <div className="mt-4 flex gap-2">
                            {data.insights.map((insight, i) => (
                                <span key={i} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${insight.type === 'positive' ? 'bg-emerald-100 text-emerald-700' :
                                        insight.type === 'negative' ? 'bg-rose-100 text-rose-700' :
                                            'bg-zinc-200 text-zinc-700'
                                    }`}>
                                    {insight.type === 'positive' ? <TrendingUp className="h-3 w-3" /> :
                                        insight.type === 'negative' ? <TrendingDown className="h-3 w-3" /> :
                                            <CheckCircle2 className="h-3 w-3" />}
                                    {insight.text}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-200 bg-white p-4 text-center">
                        <span className="text-xs font-medium text-zinc-500">Health Score</span>
                        <div className={`text-3xl font-bold ${data.score >= 80 ? 'text-emerald-600' :
                                data.score >= 50 ? 'text-amber-500' :
                                    'text-rose-600'
                            }`}>
                            {data.score}
                        </div>
                        <div className="mt-1 flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(s => (
                                <div key={s} className={`h-1.5 w-4 rounded-full ${s <= Math.round(data.score / 20) ?
                                        (data.score >= 80 ? 'bg-emerald-500' : data.score >= 50 ? 'bg-amber-500' : 'bg-rose-500')
                                        : 'bg-zinc-200'
                                    }`} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Snapshot */}
            <div className="mb-8 grid grid-cols-3 gap-6">
                <div className="rounded-xl border border-zinc-200 p-4">
                    <p className="text-xs font-medium uppercase text-zinc-500">Total Income</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-600">{fmt(data.income)}</p>
                </div>
                <div className="rounded-xl border border-zinc-200 p-4">
                    <p className="text-xs font-medium uppercase text-zinc-500">Total Expenses</p>
                    <p className="mt-1 text-2xl font-bold text-rose-600">{fmt(data.expense)}</p>
                </div>
                <div className="rounded-xl border border-zinc-200 p-4">
                    <p className="text-xs font-medium uppercase text-zinc-500">Net Savings</p>
                    <p className={`mt-1 text-2xl font-bold ${data.savings >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {fmt(data.savings)}
                    </p>
                </div>
            </div>

            {/* Charts */}
            <div className="mb-8 grid grid-cols-2 gap-8">
                <div>
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-900">Expense Breakdown</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.topCategories}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.topCategories.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => fmt(value)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        {data.topCategories.slice(0, 6).map((cat, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                <span className="flex-1 truncate text-zinc-600">{cat.name}</span>
                                <span className="font-medium">{fmt(cat.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-900">Spending Trend</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.dailySpending}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={4} />
                                <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                                <Tooltip formatter={(value: number) => fmt(value)} />
                                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="mt-4 text-xs text-zinc-500 text-center">Daily spending activity for {data.month}</p>
                </div>
            </div>

            {/* AI Recommendations */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold uppercase tracking-wider text-indigo-900">
                    <Target className="h-5 w-5" /> AI Recommendations
                </h3>
                <ul className="space-y-3">
                    {data.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-zinc-700">
                            <div className="mt-1 rounded-full bg-indigo-200 p-1 text-indigo-700">
                                <CheckCircle2 className="h-3 w-3" />
                            </div>
                            {rec}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Footer */}
            <div className="mt-12 border-t border-zinc-200 pt-6 text-center text-xs text-zinc-400">
                <p>Generated by Spends AI • {new Date().toLocaleDateString()}</p>
            </div>
        </div>
    );
});

FinancialReport.displayName = "FinancialReport";
export default FinancialReport;
