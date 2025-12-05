"use client";

import Link from "next/link";
import ReportGenerator from "@/components/report-generator";

export default function ReportsPage() {
    return (
        <main className="min-h-screen bg-zinc-50 p-4 dark:bg-black sm:p-8">
            <div className="mx-auto max-w-5xl space-y-8">
                <div className="space-y-2">
                    <div className="pt-1">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                            ← Back to Dashboard
                        </Link>
                    </div>
                    <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Financial Reports</h1>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Generate and download professional monthly reports.</p>
                </div>

                <ReportGenerator />
            </div>
        </main>
    );
}
