"use client";

import { useEffect, useState } from "react";
import SpendingHeatmap from "@/components/analytics/spending-heatmap";
import CategoryRadar from "@/components/analytics/category-radar";
import SavingsFunnel from "@/components/analytics/savings-funnel";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

import CashflowProjectionChart from "@/components/cashflow-projection-chart";
import SpendVelocityCard from "@/components/spend-velocity-card";
import PredictorCard from "@/components/predictor-card";
import CategoryRadarChart from "@/components/category-radar-chart";

export default function AdvancedAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/advanced")
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => console.error(e));
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-zinc-50 dark:bg-black p-8 flex items-center justify-center text-zinc-500">Loading Analytics...</div>;
  }

  return (
    // <div className="min-h-screen bg-zinc-50 dark:bg-black pb-20 relative overflow-hidden">
     <>
     <div className="pointer-events-none absolute inset-0 flex justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[100px] dark:bg-purple-500/20" />
      </div>

      <main className="relative w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/" className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition">
            <ArrowLeft className="h-5 w-5 text-zinc-900 dark:text-white" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Analytics Command Center</h1>
            <p className="text-sm text-zinc-500">Advanced visualization of your financial DNA.</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Detailed Projections (Old Charts) */}
          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <CashflowProjectionChart />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <SpendVelocityCard />
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <PredictorCard />
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <CategoryRadarChart />
            </motion.div>
            {/* New Radar (Comparison) */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <CategoryRadar data={data.radar || []} />
            </motion.div>
          </div>

          {/* Row 1: Heatmap (Full Width) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <SpendingHeatmap data={data.heatmap || []} />
          </motion.div>

          {/* Row 2: Funnel */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <SavingsFunnel funnelData={data.funnel || []} riskScore={data.overdraftRisk || 0} />
          </motion.div>
        </div>
      </main>
      </>
    //  </div> 
  );
}
