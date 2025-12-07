import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface WarrantyTrackerProps {
    transactions: any[];
}

export default function WarrantyTracker({ transactions }: WarrantyTrackerProps) {
    const warrantyItems = transactions
        .filter(t => t.hasWarranty && t.warrantyExpiry)
        .map(t => {
            const expiry = new Date(t.warrantyExpiry);
            const now = new Date();
            const diffTime = expiry.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return { ...t, daysLeft: diffDays };
        })
        .filter(t => t.daysLeft > 0) // Only show active warranties
        .sort((a, b) => a.daysLeft - b.daysLeft); // Sort by soonest expiry

    if (warrantyItems.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-zinc-200/50 bg-white/50 p-6 shadow-xl shadow-zinc-200/20 backdrop-blur-xl dark:border-zinc-800/50 dark:bg-zinc-900/50 dark:shadow-zinc-900/20"
        >
            <div className="mb-4 flex items-center gap-2">
                <div className="rounded-lg bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                    <Clock className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Warranty Tracker
                </h3>
            </div>

            <div className="space-y-3">
                {warrantyItems.slice(0, 3).map((item) => (
                    <div
                        key={item._id}
                        className="flex items-center justify-between rounded-xl border border-zinc-100 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                    >
                        <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                {item.description}
                            </p>
                            <p className="text-xs text-zinc-500">
                                Expires in {item.daysLeft} days
                            </p>
                        </div>
                        {item.daysLeft <= 30 ? (
                            <span className="rounded-lg bg-rose-100 px-2 py-1 text-xs font-medium text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
                                Expiring Soon
                            </span>
                        ) : (
                            <span className="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                                Active
                            </span>
                        )}
                    </div>
                ))}
                {warrantyItems.length > 3 && (
                    <p className="text-center text-xs text-zinc-500 mt-2">
                        +{warrantyItems.length - 3} more items
                    </p>
                )}
            </div>
        </motion.div>
    );
}
