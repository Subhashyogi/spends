import SummaryCards from "@/components/summary-cards";
import TransactionForm from "@/components/transaction-form";
import SpendingChart from "@/components/spending-chart";
import TransactionList from "@/components/transaction-list";

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
      </div>

      <SummaryCards />

      <div className="grid gap-4 lg:grid-cols-2">
        <TransactionForm />
        <SpendingChart />
      </div>

      <TransactionList />
    </main>
  );
}
