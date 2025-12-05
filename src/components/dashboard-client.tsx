"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { Wallet, ArrowUpRight, ArrowDownRight, PieChart } from "lucide-react";
import SummaryCards from "@/components/summary-cards";
import InsightsCard from "@/components/insights-card";
import FinanceChatbot from "@/components/finance-chatbot";



import SplitDashboard from "@/components/split-dashboard";
import FriendsManager from "@/components/friends-manager";
import TransactionForm from "@/components/transaction-form";
import SpendingChart from "@/components/spending-chart";
import ExpenseByCategory from "@/components/expense-by-category";
import RecentTransactions from "@/components/recent-transactions";
import BudgetProgress from "@/components/budget-progress";
import AppLockProvider from "@/components/app-lock-provider";

import Button from "@/components/ui/button";
import StatCard from "@/components/stat-card";
import { formatCurrency } from "@/lib/utils";

export default function DashboardClient() {
  const { data, status } = useSession();
  const loading = status === "loading";
  const user = data?.user;

  // State for dashboard data
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalIncome: 0, totalExpense: 0 });
  const [budgets, setBudgets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Fetch data function (simplified for this context)
  const refreshData = async () => {
    // In a real app, this would fetch from API
    // For now, we rely on the components fetching their own data or global state
    // But since we have props passed to some components, we need to fetch here
    try {
      const [txRes, budgetRes, catRes] = await Promise.all([
        fetch("/api/transactions"),
        fetch("/api/budgets"),
        fetch("/api/categories")
      ]);

      const txData = await txRes.json();
      const budgetData = await budgetRes.json();
      const catData = await catRes.json();

      if (txData.data) {
        setTransactions(txData.data);
        // Calculate stats
        let income = 0;
        let expense = 0;
        txData.data.forEach((t: any) => {
          if (t.type === 'income') income += t.amount;
          if (t.type === 'expense') expense += t.amount;
        });
        setStats({ totalIncome: income, totalExpense: expense });
      }
      if (budgetData.data) setBudgets(budgetData.data);
      if (catData.data) setCategories(catData.data);

    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user) {
      refreshData();
      window.addEventListener("transactionsUpdated", refreshData);
      return () => window.removeEventListener("transactionsUpdated", refreshData);
    }
  }, [user]);

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

  if (!user) {
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
    <AppLockProvider>
      <div className="min-h-screen bg-zinc-50 pb-20 dark:bg-black relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 flex justify-center">
          <div className="h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[100px] dark:bg-indigo-500/20" />
        </div>
        <main className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8">
            {/* Stats Overview */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Balance"
                value={formatCurrency(stats.totalIncome - stats.totalExpense)}
                icon={Wallet}
                trend="+2.5%"
                trendUp={true}
              />
              <StatCard
                title="Monthly Income"
                value={formatCurrency(stats.totalIncome)}
                icon={ArrowUpRight}
                trend="+12%"
                trendUp={true}
              />
              <StatCard
                title="Monthly Expenses"
                value={formatCurrency(stats.totalExpense)}
                icon={ArrowDownRight}
                trend="-5%"
                trendUp={true}
              />
              <StatCard
                title="Savings Rate"
                value={`${stats.totalIncome > 0
                  ? Math.round(
                    ((stats.totalIncome - stats.totalExpense) /
                      stats.totalIncome) *
                    100
                  )
                  : 0
                  }%`}
                icon={PieChart}
                trend="+2%"
                trendUp={true}
              />
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                <SpendingChart transactions={transactions} />
                <RecentTransactions transactions={transactions} />
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                <TransactionForm
                  onTransactionAdded={refreshData}
                  categories={categories}
                />
                <BudgetProgress
                  budgets={budgets}
                  transactions={transactions}
                  categories={categories}
                />
                <ExpenseByCategory transactions={transactions} />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <SplitDashboard />
              <FriendsManager />
            </div>
            <FinanceChatbot />
          </div>
        </main>
      </div>
    </AppLockProvider>
  );
}
