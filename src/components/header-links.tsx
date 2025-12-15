"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

import { Wallet, PieChart, MessageSquare } from "lucide-react";

export default function HeaderLinks() {
  const { data, status } = useSession();
  const loading = status === "loading";

  if (loading) return null;
  if (!data?.user) return null;

  return (
    <div className="flex flex-wrap gap-3 pt-2">
      <Link
        href="/budgets"
        className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] hover:shadow-indigo-500/30 active:scale-[0.98]"
      >
        <Wallet className="h-4 w-4" />
        Budgets
      </Link>
      <Link
        href="/analytics"
        className="group inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
      >
        <PieChart className="h-4 w-4 text-zinc-500 transition-colors group-hover:text-indigo-500 dark:text-zinc-400 dark:group-hover:text-indigo-400" />
        Analytics
      </Link>
      <Link
        href="/chat"
        className="group inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
      >
        <MessageSquare className="h-4 w-4 text-zinc-500 transition-colors group-hover:text-emerald-500 dark:text-zinc-400 dark:group-hover:text-emerald-400" />
        Message
      </Link>
    </div>
  );
}
