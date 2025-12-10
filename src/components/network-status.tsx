"use client";

import { useOfflineSync } from "@/lib/offline-sync";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NetworkStatus() {
    const { isOnline, pendingCount } = useOfflineSync();

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl bg-orange-600 px-4 py-3 text-white shadow-lg shadow-orange-600/20"
                >
                    <WifiOff className="h-5 w-5" />
                    <div>
                        <p className="text-sm font-bold">You are Offline</p>
                        <p className="text-xs opacity-90">Changes will save locally ({pendingCount} pending)</p>
                    </div>
                </motion.div>
            )}

            {isOnline && pendingCount > 0 && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl bg-emerald-600 px-4 py-3 text-white shadow-lg shadow-emerald-600/20"
                >
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <div>
                        <p className="text-sm font-bold">Back Online!</p>
                        <p className="text-xs opacity-90">Syncing {pendingCount} transactions...</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
