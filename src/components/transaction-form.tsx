"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { offlineSync } from "@/lib/offline-sync";
import { smsParser } from "@/lib/sms-parser";
import {
  Loader2,
  MessageSquare,
  Sparkles,
  ScanText,
  X,
  Calendar,
  Wallet,
  ChevronDown,
  ArrowRight,
  Receipt,
  CheckCircle2,
  Tag
} from "lucide-react";
import { safeJson } from "@/lib/http";
import { type LucideIconName, icons } from "@/lib/icons";

interface TransactionFormProps {
  onTransactionAdded?: () => void;
  categories: Array<{ _id: string; name: string; type: "income" | "expense"; color: string; icon: LucideIconName }>;
}

export default function TransactionForm({ onTransactionAdded, categories }: TransactionFormProps) {
  // Core State
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [account, setAccount] = useState<string>("cash"); // cash, bank, upi
  const [category, setCategory] = useState<string>("");
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [description, setDescription] = useState<string>("");

  // Advanced State
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");
  const [showRecurringSuggestion, setShowRecurringSuggestion] = useState(false);

  // Tools State
  const [receiptMode, setReceiptMode] = useState(false);
  const [smsMode, setSmsMode] = useState(false);
  const [smsText, setSmsText] = useState("");

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // --- Handlers ---

  const handleSmsParse = () => {
    if (!smsText.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const result = smsParser.parse(smsText);
      if (result.amount) setAmount(result.amount.toString());
      if (result.description) setDescription(result.description);
      // Try to map date if found
      setLoading(false);
      setSmsMode(false);
      setSmsText("");
    }, 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (!category && !useCustomCategory) {
      setError("Please select a category");
      return;
    }

    setLoading(true);

    const payload = {
      type,
      amount: parseFloat(amount),
      date: new Date(date).toISOString(),
      category,
      description: description || category, // Fallback desc
      account,
      isRecurring,
      frequency: isRecurring ? frequency : undefined,
    };

    if (navigator.onLine) {
      try {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const { ok, data } = await safeJson(res);
        if (!ok) throw new Error(data?.message || "Failed to save");

        setSuccess(true);
        resetForm();
        window.dispatchEvent(new Event("transactionsUpdated"));
        if (onTransactionAdded) onTransactionAdded();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      // Offline
      offlineSync.addRequest({
        url: "/api/transactions",
        method: "POST",
        body: payload,
        timestamp: Date.now()
      });
      setSuccess(true);
      resetForm();
      setLoading(false);
      window.dispatchEvent(new Event("transactionsUpdated"));
      if (onTransactionAdded) onTransactionAdded();
    }
  };

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setCategory("");
    setIsRecurring(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  // --- Render Helpers ---

  const filteredCategories = categories.filter(c => c.type === type);

  return (
    <motion.div
      layout
      className="w-full max-w-2xl mx-auto overflow-hidden bg-white border border-zinc-200 shadow-xl dark:bg-zinc-950 dark:border-zinc-800 rounded-3xl"
    >
      {/* 1. Header & Type Switcher */}
      <div className="relative p-6 pb-2">
        {/* Segmented Control */}
        <div className="relative grid grid-cols-2 p-1 mx-auto bg-zinc-100 rounded-full w-64 dark:bg-zinc-900">
          <motion.div
            className="absolute inset-y-1 left-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm dark:bg-zinc-800"
            animate={{ x: type === 'income' ? 0 : '100%', translateX: type === 'income' ? 0 : 4 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          <button
            type="button"
            onClick={() => setType('income')}
            className={`relative z-10 py-2 text-sm font-medium transition-colors rounded-full text-center ${type === 'income' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'}`}
          >
            Income
          </button>
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`relative z-10 py-2 text-sm font-medium transition-colors rounded-full text-center ${type === 'expense' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'}`}
          >
            Expense
          </button>
        </div>

        {/* Smart Tools (Absolute Position) */}
        <div className="absolute right-6 top-6 flex gap-2">
          <button
            onClick={() => { setSmsMode(!smsMode); setReceiptMode(false); }}
            className="p-2 text-zinc-400 transition-colors bg-zinc-50 rounded-xl hover:text-emerald-600 hover:bg-emerald-50 dark:bg-zinc-900 dark:hover:bg-emerald-900/20"
            title="Paste SMS"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          {type === 'expense' && (
            <button
              onClick={() => { setReceiptMode(!receiptMode); setSmsMode(false); }}
              className="p-2 text-zinc-400 transition-colors bg-zinc-50 rounded-xl hover:text-indigo-600 hover:bg-indigo-50 dark:bg-zinc-900 dark:hover:bg-indigo-900/20"
              title="Scan Receipt"
            >
              <ScanText className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Form Content */}
      <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-6">

        {/* Dynamic Tool Areas (SMS / Receipt) */}
        <AnimatePresence>
          {smsMode && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="p-4 border border-emerald-100 bg-emerald-50/50 rounded-2xl dark:bg-emerald-900/10 dark:border-emerald-800/30">
                <textarea
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  placeholder="Paste bank SMS here... e.g. 'Rs 250 paid to Swiggy'"
                  className="w-full p-3 text-sm bg-white border-0 shadow-sm resize-none rounded-xl focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-900"
                  rows={2}
                />
                <button type="button" onClick={handleSmsParse} disabled={loading} className="flex items-center justify-center w-full gap-2 py-2 mt-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500">
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Auto-Fill Form
                </button>
              </div>
            </motion.div>
          )}
          {receiptMode && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="p-4 text-center border border-indigo-100 bg-indigo-50/50 rounded-2xl dark:bg-indigo-900/10 dark:border-indigo-800/30">
                <p className="mb-2 text-sm text-indigo-800 dark:text-indigo-200">Receipt Scanner coming soon!</p>
                <button type="button" onClick={() => setReceiptMode(false)} className="text-xs font-medium underline text-zinc-500">Close</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Amount Input (Hero) */}
        <div className="relative flex flex-col items-center justify-center py-6">
          <label className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">Enter Amount</label>
          <div className="relative flex items-center justify-center w-full gap-1">
            <span className="text-4xl font-light text-zinc-300 dark:text-zinc-600 pb-1">₹</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              style={{ width: amount ? `${amount.length + 1}ch` : '2ch' }}
              className="h-16 text-5xl font-bold text-center bg-transparent border-none outline-none text-zinc-900 placeholder:text-zinc-200 dark:text-white dark:placeholder:text-zinc-800 focus:ring-0 p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none min-w-[2ch] max-w-full"
              autoFocus
            />
          </div>
        </div>

        {/* Date & Account Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Calendar className="w-4 h-4 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full py-3 pl-10 pr-4 text-sm font-medium bg-zinc-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-900 dark:text-white"
            />
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Wallet className="w-4 h-4 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
            </div>
            <select
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full py-3 pl-10 pr-10 text-sm font-medium appearance-none bg-zinc-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-900 dark:text-white"
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank">Bank</option>
              <option value="card">Card</option>
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Category</label>
            {!useCustomCategory && (
              <button type="button" onClick={() => setUseCustomCategory(true)} className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">
                + Custom
              </button>
            )}
          </div>

          {!useCustomCategory ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 max-h-40 overflow-y-auto pr-1">
              {filteredCategories.map((cat) => (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => setCategory(cat.name)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${category === cat.name
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300 shadow-sm'
                    : 'bg-transparent border-zinc-100 text-zinc-500 hover:bg-zinc-50 hover:border-zinc-200 dark:border-zinc-800 dark:hover:bg-zinc-900'
                    }`}
                >
                  <span className="text-xs font-medium truncate w-full text-center">{cat.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Enter category name..."
                className="flex-1 px-4 py-3 text-sm bg-zinc-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-900 dark:text-white"
                autoFocus
              />
              <button type="button" onClick={() => { setUseCustomCategory(false); setCategory(""); }} className="p-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Description & Recurring */}
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Tag className="w-4 h-4 text-zinc-400" />
            </div>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (Optional)"
              className="w-full py-3 pl-10 pr-4 text-sm bg-zinc-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-between px-3 py-2 border border-zinc-100 rounded-xl dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-zinc-300 rounded focus:ring-indigo-500 dark:bg-zinc-800 dark:border-zinc-700"
              />
              <label htmlFor="recurring" className="text-sm text-zinc-600 dark:text-zinc-300 select-none cursor-pointer">Recurring?</label>
            </div>
            {isRecurring && (
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="py-1 pl-2 pr-6 text-xs bg-zinc-100 border-0 rounded-lg outline-none focus:ring-0 dark:bg-zinc-800 dark:text-zinc-300"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="relative w-full overflow-hidden group"
          >
            <div className={`absolute inset-0 transition-all duration-300 bg-gradient-to-r ${type === 'income' ? 'from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400' : 'from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500'} rounded-xl shadow-lg shadow-indigo-500/20`} />
            <div className="relative flex items-center justify-center w-full py-3.5 text-sm font-semibold text-white gap-2">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {success ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" /> Saved!
                    </>
                  ) : (
                    <>
                      Save Transaction <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </>
              )}
            </div>
          </button>
          {error && <p className="mt-2 text-xs text-center text-rose-500">{error}</p>}
        </div>

      </form>
    </motion.div>
  );
}
