"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownCircle, ArrowUpCircle, Loader2 } from "lucide-react";
import { safeJson } from "@/lib/http";
import { type LucideIconName } from "@/lib/icons";

interface TransactionFormProps {
  onTransactionAdded?: () => void;
  categories: Array<{ _id: string; name: string; type: "income" | "expense"; color: string; icon: LucideIconName }>;
}

export default function TransactionForm({ onTransactionAdded, categories }: TransactionFormProps) {
  const [type, setType] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<string>("INR");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [account, setAccount] = useState<"cash" | "bank" | "upi" | "wallet">("cash");
  const [date, setDate] = useState<string>("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [canExpense, setCanExpense] = useState<boolean>(true);
  const [useCustomCategory, setUseCustomCategory] = useState<boolean>(false);

  // New state for recurring suggestion
  const [showRecurringSuggestion, setShowRecurringSuggestion] = useState(false);

  // Keywords to detect recurring bills
  const RECURRING_KEYWORDS = ['rent', 'gym', 'subscription', 'bill', 'recharge', 'premium', 'emi', 'sip', 'wifi', 'broadband', 'netflix', 'spotify', 'prime'];

  // Effect to check for recurring keywords
  useEffect(() => {
    if (isRecurring) {
      setShowRecurringSuggestion(false);
      return;
    }

    const text = (description + " " + category).toLowerCase();
    const match = RECURRING_KEYWORDS.some(keyword => text.includes(keyword));

    if (match) {
      setShowRecurringSuggestion(true);
    } else {
      setShowRecurringSuggestion(false);
    }
  }, [description, category, isRecurring]);

  // Friend splitting logic
  const [friends, setFriends] = useState<any[]>([]);
  const [splitWith, setSplitWith] = useState<string[]>([]);
  const [isSplitting, setIsSplitting] = useState(false);

  useEffect(() => {
    fetchFriends();
  }, []);

  async function fetchFriends() {
    try {
      const res = await fetch("/api/friends");
      const data = await res.json();
      if (data.friends) setFriends(data.friends);
    } catch (e) {
      console.error("Failed to fetch friends", e);
    }
  }

  const toggleFriendSplit = (friendId: string) => {
    setSplitWith(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const val = parseFloat(amount);
      if (isNaN(val) || val <= 0) throw new Error("Invalid amount");
      if (!date) throw new Error("Date is required");
      if (!category && !useCustomCategory) throw new Error("Category is required");

      const payload: any = {
        type,
        amount: val,
        currency,
        description,
        category,
        account,
        date: new Date(date).toISOString(),
        isRecurring,
        frequency: isRecurring ? frequency : undefined,
      };

      // Add split data if splitting
      if (isSplitting && splitWith.length > 0) {
        const splitCount = splitWith.length + 1; // +1 for self
        const splitAmount = val / splitCount;

        payload.split = splitWith.map(friendId => {
          const friend = friends.find(f => f.userId === friendId);
          return {
            userId: friendId,
            username: friend?.username,
            amount: splitAmount,
            isSettled: false
          };
        });
      }

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const { ok, data, status } = await safeJson(res);
      if (!ok) throw new Error(data?.message || data?.error || `HTTP ${status}`);

      setSuccess(true);
      setAmount("");
      setDescription("");
      setCategory("");
      setUseCustomCategory(false);
      setIsRecurring(false);
      setSplitWith([]);
      setIsSplitting(false);

      if (onTransactionAdded) onTransactionAdded();

      setTimeout(() => setSuccess(false), 2000);
    } catch (e: any) {
      setError(e?.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onSubmit={handleSubmit}
      className="rounded-3xl border border-zinc-200/50 bg-white/80 p-6 shadow-xl shadow-zinc-200/20 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/80 dark:shadow-zinc-900/20"
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Add Transaction
        </h3>
        <div className="flex self-start rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800 sm:self-auto">
          <button
            type="button"
            onClick={() => setType("income")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${type === "income"
              ? "bg-white text-emerald-600 shadow-sm dark:bg-zinc-700 dark:text-emerald-400"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
          >
            <ArrowUpCircle className="h-4 w-4" />
            Income
          </button>
          <button
            type="button"
            onClick={() => canExpense && setType("expense")}
            disabled={!canExpense}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${type === "expense"
              ? "bg-white text-rose-600 shadow-sm dark:bg-zinc-700 dark:text-rose-400"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              } ${!canExpense ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <ArrowDownCircle className="h-4 w-4" />
            Expense
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
              ₹
            </span>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-zinc-200/50 bg-zinc-50/50 py-2 pl-8 pr-4 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800/50 dark:bg-zinc-900/50 dark:focus:bg-zinc-900"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-zinc-200/50 bg-zinc-50/50 px-4 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800/50 dark:bg-zinc-900/50 dark:focus:bg-zinc-900"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Account
            </label>
            <select
              value={account}
              onChange={(e) => setAccount(e.target.value as any)}
              className="w-full rounded-xl border border-zinc-200/50 bg-zinc-50/50 px-4 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800/50 dark:bg-zinc-900/50 dark:focus:bg-zinc-900"
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="upi">UPI</option>
              <option value="wallet">Wallet</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Category
          </label>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {categories.filter(c => c.type === type).map((cat) => {
              return (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => {
                    setCategory(cat.name);
                    setUseCustomCategory(false);
                  }}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all ${category === cat.name && !useCustomCategory
                    ? "border-indigo-600 bg-indigo-50 text-indigo-600 dark:border-indigo-500 dark:bg-indigo-900/20 dark:text-indigo-400"
                    : "border-zinc-200 hover:border-indigo-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
                    }`}
                >
                  <span className="text-xs font-medium">{cat.name}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setCategory("");
                setUseCustomCategory(true);
              }}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all ${useCustomCategory
                ? "border-indigo-600 bg-indigo-50 text-indigo-600 dark:border-indigo-500 dark:bg-indigo-900/20 dark:text-indigo-400"
                : "border-zinc-200 hover:border-indigo-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
                }`}
            >
              <span className="text-xs font-medium">Custom</span>
            </button>
          </div>

          {useCustomCategory && (
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Custom Category Name
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-zinc-200/50 bg-zinc-50/50 px-4 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800/50 dark:bg-zinc-900/50 dark:focus:bg-zinc-900"
                placeholder="e.g. Taxi, Gift, etc."
              />
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-zinc-200/50 bg-zinc-50/50 px-4 py-2 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800/50 dark:bg-zinc-900/50 dark:focus:bg-zinc-900"
            placeholder="What was this for?"
          />
        </div>

        {/* Recurring Checkbox */}
        <div className="flex items-center justify-between rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="recurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="recurring" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Recurring Transaction
            </label>
          </div>
          {isRecurring && (
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as any)}
              className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          )}
        </div>

        {/* Smart Recurring Suggestion */}
        {showRecurringSuggestion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden rounded-xl bg-indigo-50 p-3 dark:bg-indigo-900/20"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-indigo-700 dark:text-indigo-300">
                💡 Looks like a recurring bill. Make it recurring?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRecurringSuggestion(false)}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRecurring(true);
                    setFrequency("monthly");
                    setShowRecurringSuggestion(false);
                  }}
                  className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-500"
                >
                  Yes, Monthly
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Split with Friends */}
        {type === 'expense' && (
          <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="split"
                  checked={isSplitting}
                  onChange={(e) => setIsSplitting(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="split" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Split with Friends
                </label>
              </div>
            </div>

            {isSplitting && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {friends.length === 0 ? (
                  <p className="col-span-2 text-xs text-zinc-500">No friends added yet.</p>
                ) : (
                  friends.map(friend => (
                    <button
                      key={friend.userId}
                      type="button"
                      onClick={() => toggleFriendSplit(friend.userId)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${splitWith.includes(friend.userId)
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-900/20 dark:text-indigo-300"
                        : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        }`}
                    >
                      <div className="h-6 w-6 rounded-full bg-indigo-100 text-xs flex items-center justify-center text-indigo-600">
                        {friend.username[0].toUpperCase()}
                      </div>
                      {friend.name || friend.username}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

      </div>

      <div className="mt-6 flex items-center justify-between">
        {error && (
          <span className="text-sm text-rose-600 dark:text-rose-400">
            {error}
          </span>
        )}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="ml-auto flex h-10 min-w-[100px] items-center justify-center rounded-xl bg-indigo-600 px-4 font-medium text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span>Save</span>
          )}
        </motion.button>
        {success && (
          <span className="text-sm text-emerald-600 dark:text-emerald-400">Added!</span>
        )}
      </div>
    </motion.form>
  );
}
