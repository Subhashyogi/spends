import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface SubscriptionTrackerProps {
    transactions: any[];
}

export default function SubscriptionTracker({ transactions }: SubscriptionTrackerProps) {
    // Filter subscriptions from the last 12 months to estimate yearly spend
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    const subscriptions = transactions.filter(t =>
        t.isSubscription && new Date(t.date) >= oneYearAgo
    );

    const totalSpent = subscriptions.reduce((sum, t) => sum + t.amount, 0);

    // Group by name to show unique subscriptions
    const uniqueSubs = Array.from(new Set(subscriptions.map(t => t.subscriptionName || t.description))).slice(0, 5);

    if (subscriptions.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-6"
        >
            <div className="mb-4 flex items-center gap-2">
                <div className="rounded-lg bg-violet-100 p-2 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400">
                    <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Subscriptions
                </h3>
            </div>

            <div className="mb-4">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    You spent <span className="font-bold text-zinc-900 dark:text-zinc-100">₹{totalSpent.toLocaleString()}</span> this year on subscriptions.
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                {uniqueSubs.map((name, i) => (
                    <span
                        key={i}
                        className="glass rounded-full px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300"
                    >
                        {name}
                    </span>
                ))}
            </div>
        </motion.div>
    );
}
