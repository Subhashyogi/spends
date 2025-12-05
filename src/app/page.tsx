import DashboardClient from "@/components/dashboard-client";
import HeaderLinks from "@/components/header-links";

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
        <HeaderLinks />
      </div>

      <DashboardClient />
    </main>
  );
}
