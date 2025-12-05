"use client";

import { useState, useRef, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { format, subMonths } from "date-fns";
import { Printer, Loader2, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { safeJson } from "@/lib/http";
import FinancialReport from "./financial-report";

export default function ReportGenerator() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const reportRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: reportRef,
        documentTitle: `Financial_Report_${format(selectedDate, "MMM_yyyy")}`,
    });

    useEffect(() => {
        generateReport();
    }, [selectedDate]);

    async function generateReport() {
        setLoading(true);
        try {
            // Fetch data
            const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).toISOString();
            const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59).toISOString();

            const [txRes, userRes] = await Promise.all([
                fetch(`/api/transactions?from=${start}&to=${end}&limit=1000`),
                fetch("/api/user/settings")
            ]);

            const txJson = await safeJson(txRes);
            const userJson = await safeJson(userRes);

            const transactions = txJson.data.data || [];
            const userName = userJson.data.name || "User";

            // Process Data
            const income = transactions.filter((t: any) => t.type === "income").reduce((sum: number, t: any) => sum + t.amount, 0);
            const expense = transactions.filter((t: any) => t.type === "expense").reduce((sum: number, t: any) => sum + t.amount, 0);
            const savings = income - expense;
            const savingsRate = income ? Math.round((savings / income) * 100) : 0;

            // Categories
            const catTotals: Record<string, number> = {};
            transactions.filter((t: any) => t.type === "expense").forEach((t: any) => {
                const c = t.category || "Uncategorized";
                catTotals[c] = (catTotals[c] || 0) + t.amount;
            });
            const topCategories = Object.entries(catTotals)
                .map(([name, value]) => ({ name, value, color: "#000" }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 6);

            // Daily Spending
            const dailyMap: Record<string, number> = {};
            transactions.filter((t: any) => t.type === "expense").forEach((t: any) => {
                const d = new Date(t.date).getDate();
                dailyMap[d] = (dailyMap[d] || 0) + t.amount;
            });
            const dailySpending = Array.from({ length: new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate() }, (_, i) => ({
                day: String(i + 1),
                amount: dailyMap[i + 1] || 0
            }));

            // Insights & Score
            const insights = [];
            const recommendations = [];
            let score = 70; // Base score

            if (savingsRate >= 20) {
                insights.push({ type: "positive", text: "Healthy Savings Rate" });
                score += 10;
            } else {
                insights.push({ type: "negative", text: "Low Savings Rate" });
                recommendations.push("Aim to save at least 20% of your income.");
                score -= 10;
            }

            if (expense > income) {
                insights.push({ type: "negative", text: "Overspending" });
                recommendations.push("Review discretionary spending to stay within income.");
                score -= 20;
            }

            if (topCategories.length > 0) {
                recommendations.push(`Your highest spending is in ${topCategories[0].name}. Look for ways to optimize this.`);
            }

            setReportData({
                userName,
                month: format(selectedDate, "MMMM"),
                year: selectedDate.getFullYear(),
                income,
                expense,
                savings,
                savingsRate,
                topCategories,
                dailySpending,
                insights,
                recommendations,
                score: Math.max(0, Math.min(100, score))
            });

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-8">
            {/* Controls */}
            <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border bg-white p-4 shadow-sm sm:flex-row dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setSelectedDate(subMonths(selectedDate, 1))}
                        className="rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="text-center">
                        <p className="text-sm font-medium text-zinc-500">Reporting Period</p>
                        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{format(selectedDate, "MMMM yyyy")}</p>
                    </div>
                    <button
                        onClick={() => setSelectedDate(subMonths(selectedDate, -1))}
                        disabled={selectedDate.getMonth() === new Date().getMonth() && selectedDate.getFullYear() === new Date().getFullYear()}
                        className="rounded-full p-2 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>

                <button
                    onClick={handlePrint}
                    disabled={!reportData || loading}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Printer className="h-5 w-5" />}
                    Print / Save PDF
                </button>
            </div>

            {/* Preview Area */}
            <div className="overflow-auto rounded-3xl bg-zinc-100 p-8 dark:bg-zinc-950">
                <div className="mx-auto w-fit shadow-2xl">
                    {reportData ? (
                        <FinancialReport ref={reportRef} data={reportData} />
                    ) : (
                        <div className="flex h-[297mm] w-[210mm] items-center justify-center bg-white">
                            <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
