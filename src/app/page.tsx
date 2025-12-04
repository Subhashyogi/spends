import SummaryCards from "@/components/summary-cards";
import InsightsCard from "@/components/insights-card";
import TransactionForm from "@/components/transaction-form";
import SpendingChart from "@/components/spending-chart";
import TransactionList from "@/components/transaction-list";
import Link from "next/link";
import ExpenseByCategory from "@/components/expense-by-category";
import BudgetsOverview from "@/components/budgets-overview";
import AccountsSummary from "@/components/accounts-summary";

export default function Home() {
  return (
    <main className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Spends Dashboard
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Track income, expenses, and savings with beautiful charts and smooth animations.
        </p>
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
        </div>
      </div>

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
    </main>
  );
}
