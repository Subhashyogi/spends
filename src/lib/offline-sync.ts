import { useState, useEffect } from "react";

const QUEUE_KEY = "offline_tx_queue";

export const offlineSync = {
    // Add request to offline queue
    addRequest: (data: any) => {
        try {
            const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
            queue.push({
                id: crypto.randomUUID(), // Temp ID
                timestamp: Date.now(),
                data: data
            });
            localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
            return true;
        } catch (e) {
            console.error("Failed to queue offline request", e);
            return false;
        }
    },

    // Get pending count
    getPendingCount: () => {
        if (typeof window === 'undefined') return 0;
        const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
        return queue.length;
    },

    // Sync process
    sync: async () => {
        const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
        if (queue.length === 0) return { synced: 0, failed: 0, remaining: 0 };

        let synced = 0;
        let failed = 0;
        const remainingQueue = [];

        for (const item of queue) {
            try {
                // Determine endpoint based on data structure? 
                // For now, assuming all offline items are TRANSACTIONS
                const res = await fetch("/api/transactions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(item.data),
                });

                if (res.ok) {
                    synced++;
                } else {
                    // Critical failure (e.g. 400 Bad Request), discard or retry?
                    // We'll keep 5xx, discard 4xx to prevent infinite loop of bad data
                    if (res.status >= 500) {
                        remainingQueue.push(item);
                        failed++;
                    } else {
                        console.error("Discarding invalid offline request", res.status, item);
                        failed++; // Count as processed but failed
                    }
                }
            } catch (e) {
                // Network error, keep in queue
                remainingQueue.push(item);
                failed++;
            }
        }

        localStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
        return { synced, failed, remaining: remainingQueue.length };
    }
};

// Hook to monitor status
export function useOfflineSync() {
    const [isOnline, setIsOnline] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        // Initial check
        setIsOnline(navigator.onLine);
        setPendingCount(offlineSync.getPendingCount());

        const handleOnline = () => {
            setIsOnline(true);
            // Trigger sync
            offlineSync.sync().then((res) => {
                if (res.synced > 0) {
                    // Dispatch success event if needed
                    window.dispatchEvent(new Event("transactionsUpdated"));
                    setPendingCount(res.remaining);
                }
            });
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        // Listen for storage changes (to update count if items added)
        const handleStorage = () => {
            setPendingCount(offlineSync.getPendingCount());
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('storage', handleStorage); // Sync queue updates across tabs

        // Custom event for queue updates
        window.addEventListener('offlineQueueUpdated', () => {
            setPendingCount(offlineSync.getPendingCount());
        });

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('offlineQueueUpdated', () => { });
        };
    }, []);

    return { isOnline, pendingCount };
}
