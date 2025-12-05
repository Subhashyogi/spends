"use client";

import { useState, useEffect, createContext, useContext } from "react";
import PinLockScreen from "./pin-lock-screen";
import { safeJson } from "@/lib/http";

const AppLockContext = createContext<{
    isLocked: boolean;
    hasPin: boolean;
    refreshLockStatus: () => void;
}>({
    isLocked: false,
    hasPin: false,
    refreshLockStatus: () => { },
});

export function useAppLock() {
    return useContext(AppLockContext);
}

export default function AppLockProvider({ children }: { children: React.ReactNode }) {
    const [isLocked, setIsLocked] = useState(false);
    const [hasPin, setHasPin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkPinStatus();
    }, []);

    async function checkPinStatus() {
        try {
            const res = await fetch("/api/user/pin");
            const { ok, data } = await safeJson(res);
            if (ok && data.hasPin) {
                setHasPin(true);
                // If user has PIN, lock app on initial load
                // We can also use sessionStorage to keep it unlocked for the session
                const sessionUnlocked = sessionStorage.getItem("spends_unlocked");
                if (!sessionUnlocked) {
                    setIsLocked(true);
                }
            } else {
                setHasPin(false);
                setIsLocked(false);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function handleUnlock(pin: string) {
        try {
            const res = await fetch("/api/user/pin", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pin })
            });

            if (res.ok) {
                setIsLocked(false);
                sessionStorage.setItem("spends_unlocked", "true");
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    if (loading) return null; // Or a loading spinner

    return (
        <AppLockContext.Provider value={{ isLocked, hasPin, refreshLockStatus: checkPinStatus }}>
            {isLocked ? (
                <PinLockScreen onUnlock={handleUnlock} />
            ) : (
                children
            )}
        </AppLockContext.Provider>
    );
}
