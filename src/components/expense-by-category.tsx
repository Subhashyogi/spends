"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { safeJson } from "@/lib/http";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RTooltip,
} from "recharts";

interface ExpenseByCategoryProps {
  transactions: any[];
}

export default function ExpenseByCategory({ transactions }: ExpenseByCategoryProps) {
  const [items, setItems] = useState<Array<{ category: string; total: number }>>([]);

  useEffect(() => {
    if (!transactions) return;

    // Calculate totals from transactions
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const expenses = transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const map = new Map<string, number>();
    for (const t of expenses) {
      const cat = t.category || "Uncategorized";
      map.set(cat, (map.get(cat) || 0) + t.amount);
    }

    const arr = Array.from(map.entries()).map(([category, total]) => ({ category, total }));
    arr.sort((a, b) => b.total - a.total);
    setItems(arr);
  }, [transactions]);

  const total = useMemo(() => items.reduce((s, x) => s + (x.total || 0), 0), [items]);
  const top3 = useMemo(() => items.slice(0, 3), [items]);

  const colors = [
    "#ef4444",
    "#3b82f6",
    "#10b981",
    "#a855f7",
    "#f59e0b",
    "#22c55e",
    "#06b6d4",
    "#f97316",
    "#64748b",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-3xl p-6"
    >
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Expense by Category</h3>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          This Month
        </span>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-1">
        <div className="relative h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={items}
                dataKey="total"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                cornerRadius={5}
              >
                {items.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                    strokeWidth={0}
                  />
                ))}
              </Pie>
              <RTooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                formatter={(v: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v as number)}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs text-zinc-500 font-medium">Total</span>
            <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(total)}
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-center space-y-3">
          {items.length === 0 ? (
            <div className="text-center text-sm text-zinc-500">No expenses recorded this month.</div>
          ) : (
            top3.map((x, i) => {
              const pct = total > 0 ? Math.round((x.total / total) * 100) : 0;
              return (
                <div key={i} className="group flex items-center justify-between rounded-2xl border border-zinc-100/50 bg-zinc-50/50 p-3 transition-all hover:bg-white hover:shadow-md hover:shadow-zinc-200/10 dark:border-zinc-800/50 dark:bg-zinc-900/50 dark:hover:bg-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-800">
                      <span className="h-3 w-3 rounded-full" style={{ background: colors[i % colors.length] }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{x.category || "Uncategorized"}</p>
                      <div className="h-1 w-16 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(x.total)}
                    </p>
                    <p className="text-xs text-zinc-500">{pct}%</p>
                  </div>
                </div>
              );
            })
          )}
          {items.length > 3 && (
            <div className="text-center">
              <span className="text-xs text-zinc-400">and {items.length - 3} more categories...</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
