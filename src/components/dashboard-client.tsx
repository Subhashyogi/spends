"use client";

import { useSession, signIn } from "next-auth/react";
import SummaryCards from "@/components/summary-cards";
import InsightsCard from "@/components/insights-card";
import TransactionForm from "@/components/transaction-form";
import SpendingChart from "@/components/spending-chart";
import ExpenseByCategory from "@/components/expense-by-category";
import BudgetsOverview from "@/components/budgets-overview";
import AccountsSummary from "@/components/accounts-summary";
import Button from "@/components/ui/button";
import TransactionList from "@/components/transaction-list";

export default function DashboardClient() {
  const { data, status } = useSession();
  const loading = status === "loading";

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-2xl bg-zinc-200/50 dark:bg-zinc-800/50" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-64 animate-pulse rounded-2xl bg-zinc-200/50 dark:bg-zinc-800/50" />
          <div className="h-64 animate-pulse rounded-2xl bg-zinc-200/50 dark:bg-zinc-800/50" />
        </div>
      </div>
    );
  }

  if (!data?.user) {
    return (
      <div className="rounded-2xl border p-8 text-center dark:border-zinc-800">
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Welcome to Spends
        </h3>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Please sign in to view your dashboard, add transactions, and see
          analytics.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button onClick={() => signIn(undefined, { callbackUrl: "/" })}>
            Sign in
          </Button>
          <a
            href="/register"
            className="inline-flex h-9 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Register
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <SummaryCards />
      <InsightsCard />
      <div className="grid gap-4 lg:grid-cols-2">
        <TransactionForm />
        <SpendingChart />
      </div>
      <ExpenseByCategory />
      <AccountsSummary />
      <BudgetsOverview />
      <TransactionList />
    </>
  );
}
