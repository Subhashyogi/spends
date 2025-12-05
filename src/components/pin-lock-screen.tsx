"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Delete, ShieldCheck } from "lucide-react";

interface PinLockScreenProps {
    onUnlock: (pin: string) => Promise<boolean>;
}

export default function PinLockScreen({ onUnlock }: PinLockScreenProps) {
    const [pin, setPin] = useState("");
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (pin.length === 4) {
            handleUnlock();
        }
    }, [pin]);

    async function handleUnlock() {
        setLoading(true);
        const success = await onUnlock(pin);
        if (!success) {
            setError(true);
            setPin("");
            setTimeout(() => setError(false), 500);
        }
        setLoading(false);
    }

    const handleNumClick = (num: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + num);
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-xl">
            <div className="w-full max-w-sm p-8">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400">
                        <Lock className="h-8 w-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Spends Locked</h2>
                    <p className="mt-2 text-sm text-zinc-400">Enter your PIN to access</p>
                </div>

                {/* PIN Dots */}
                <div className="mb-8 flex justify-center gap-4">
                    {[0, 1, 2, 3].map((i) => (
                        <motion.div
                            key={i}
                            animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
                            className={`h-4 w-4 rounded-full transition-colors ${i < pin.length
                                    ? "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                    : "bg-zinc-800"
                                }`}
                        />
                    ))}
                </div>

                {/* NumPad */}
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleNumClick(num.toString())}
                            className="flex h-16 items-center justify-center rounded-2xl bg-zinc-900/50 text-2xl font-medium text-white transition-all hover:bg-zinc-800 active:scale-95"
                        >
                            {num}
                        </button>
                    ))}
                    <div /> {/* Empty slot */}
                    <button
                        onClick={() => handleNumClick("0")}
                        className="flex h-16 items-center justify-center rounded-2xl bg-zinc-900/50 text-2xl font-medium text-white transition-all hover:bg-zinc-800 active:scale-95"
                    >
                        0
                    </button>
                    <button
                        onClick={handleDelete}
                        className="flex h-16 items-center justify-center rounded-2xl bg-zinc-900/50 text-white transition-all hover:bg-zinc-800 active:scale-95"
                    >
                        <Delete className="h-6 w-6" />
                    </button>
                </div>

                <div className="mt-8 text-center">
                    <p className="flex items-center justify-center gap-2 text-xs text-zinc-500">
                        <ShieldCheck className="h-3 w-3" /> Secured by Spends
                    </p>
                </div>
            </div>
        </div>
    );
}
