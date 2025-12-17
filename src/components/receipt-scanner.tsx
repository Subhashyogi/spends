"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Loader2, Upload, ScanLine, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createWorker } from "tesseract.js";

interface ReceiptScannerProps {
    onScanComplete: (data: any) => void;
}

export default function ReceiptScanner({ onScanComplete }: ReceiptScannerProps) {
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setScanning(true);
        setError(null);
        setProgress(0);

        try {
            const worker = await createWorker("eng", 1, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 100));
                    }
                }
            });

            const { data: { text } } = await worker.recognize(file);
            await worker.terminate();

            console.log("OCR Result:", text);
            // Heuristic Parsing (Client Side)
            const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

            let merchant = lines[0] || "Unknown Merchant";
            let maxAmount = 0;
            const simpleMoneyRegex = /(\d+\.\d{2})/g;

            const matches = text.match(simpleMoneyRegex) || [];
            matches.forEach(m => {
                const val = parseFloat(m);
                if (!isNaN(val) && val > maxAmount) {
                    maxAmount = val;
                }
            });

            // Date Parsing
            const dateRegex = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})|(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/;
            const dateMatch = text.match(dateRegex);
            let date = dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0];

            // Normalize Date
            try {
                const d = new Date(date);
                if (!isNaN(d.getTime())) {
                    date = d.toISOString().split('T')[0];
                }
            } catch (e) { }


            const resultData = {
                amount: maxAmount > 0 ? maxAmount : null,
                date: date,
                merchant: merchant,
                category: "Uncategorized",
                description: merchant
            };

            onScanComplete(resultData);

        } catch (e: any) {
            console.error(e);
            setError("Failed to read receipt. Image might be unclear.");
        } finally {
            setScanning(false);
        }
    }, [onScanComplete]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxFiles: 1,
        disabled: scanning
    });

    return (
        <div className="w-full">
            <div
                {...getRootProps()}
                className={`relative overflow-hidden rounded-2xl border-2 border-dashed p-6 transition-all cursor-pointer
                    ${isDragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-zinc-200 hover:border-indigo-400 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900'}
                    ${scanning ? 'pointer-events-none opacity-80' : ''}
                `}
            >
                <input {...getInputProps()} />

                <div className="flex flex-col items-center justify-center text-center gap-2">
                    {scanning ? (
                        <>
                            <div className="relative h-12 w-12">
                                <ScanLine className="h-12 w-12 text-indigo-500 animate-pulse" />
                                <motion.div
                                    className="absolute top-0 left-0 w-full h-1 bg-indigo-400 shadow-[0_0_10px_indigo]"
                                    animate={{ top: ["0%", "100%", "0%"] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                />
                            </div>
                            <p className="text-sm font-medium text-indigo-600 animate-pulse">
                                Scanning... {progress}%
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="rounded-full bg-indigo-50 p-3 dark:bg-indigo-900/30">
                                <Upload className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                    Click to Upload Receipt
                                </p>
                                <p className="text-xs text-zinc-500">
                                    Local OCR (No Upload Required)
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {error && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-2 text-xs text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
                        <X className="h-4 w-4" /> {error}
                    </div>
                )}
            </div>

            <p className="mt-2 text-center text-[10px] text-zinc-400">
                Powered by Local Browser OCR. Privacy Friendly.
            </p>
        </div>
    );
}
