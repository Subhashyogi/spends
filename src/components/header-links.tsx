"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export default function HeaderLinks() {
  const { data, status } = useSession();
  const loading = status === "loading";

  if (loading) return null;
  if (!data?.user) return null;

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      <Link
        href="/budgets"
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow transition hover:bg-indigo-500"
      >
        Budgets
      </Link>
      <Link
        href="/analytics"
        className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        Analytics
      </Link>
      <Link
        href="/chat"
        className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        Message
      </Link>
    </div>
  );
}
