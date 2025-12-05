"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Upload, Cloud, CloudUpload, CloudDownload, Lock, RefreshCw, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { encryptData, decryptData } from "@/lib/encryption";
import { safeJson } from "@/lib/http";

export default function BackupManager() {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [mode, setMode] = useState<"local" | "cloud" | "restore">("local");

    const handleLocalBackup = async () => {
        if (!password) {
            setStatus({ type: "error", message: "Encryption password is required" });
            return;
        }
        setLoading(true);
        setStatus(null);
        try {
            // 1. Fetch data
            const res = await fetch("/api/backup");
            const { ok, data } = await safeJson(res);
            if (!ok) throw new Error("Failed to fetch data");

            // 2. Encrypt
            const encrypted = await encryptData(data.data, password);

            // 3. Download
            const blob = new Blob([encrypted], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `spends_backup_${new Date().toISOString().slice(0, 10)}.enc`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setStatus({ type: "success", message: "Backup downloaded successfully!" });
        } catch (e: any) {
            setStatus({ type: "error", message: e.message || "Backup failed" });
        } finally {
            setLoading(false);
        }
    };

    const handleCloudBackup = async () => {
        if (!password) {
            setStatus({ type: "error", message: "Encryption password is required" });
            return;
        }
        setLoading(true);
        setStatus(null);
        try {
            // 1. Fetch data
            const res = await fetch("/api/backup");
            const { ok, data } = await safeJson(res);
            if (!ok) throw new Error("Failed to fetch data");

            // 2. Encrypt
            const encrypted = await encryptData(data.data, password);

            // 3. Upload
            const uploadRes = await fetch("/api/backup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ encryptedData: encrypted })
            });

            if (!uploadRes.ok) throw new Error("Failed to upload to cloud");

            setStatus({ type: "success", message: "Backup saved to cloud successfully!" });
        } catch (e: any) {
            setStatus({ type: "error", message: e.message || "Cloud backup failed" });
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (file?: File) => {
        if (!password) {
            setStatus({ type: "error", message: "Decryption password is required" });
            return;
        }
        setLoading(true);
        setStatus(null);
        try {
            let encryptedData = "";

            if (file) {
                // Read file
                encryptedData = await file.text();
            } else {
                // Fetch from cloud (we need a GET endpoint for encrypted blob, reuse GET /api/backup?type=cloud maybe? 
                // Or just add a new endpoint. For now let's assume we can't easily fetch cloud blob without another endpoint.
                // Let's add fetching cloud backup to GET /api/backup/cloud)
                const res = await fetch("/api/backup/cloud");
                const { ok, data } = await safeJson(res);
                if (!ok) throw new Error("No cloud backup found");
                encryptedData = data.data;
            }

            // Decrypt
            const decrypted = await decryptData(encryptedData, password);

            // Restore
            const restoreRes = await fetch("/api/backup", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: decrypted })
            });

            if (!restoreRes.ok) throw new Error("Failed to restore data");

            setStatus({ type: "success", message: "Data restored successfully! Reloading..." });
            setTimeout(() => window.location.reload(), 2000);

        } catch (e: any) {
            setStatus({ type: "error", message: e.message || "Restore failed. Wrong password?" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <button
                    onClick={() => setMode("local")}
                    className={`flex flex-col items-center gap-3 rounded-2xl border p-6 transition-all ${mode === "local"
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-900/20 dark:text-indigo-300"
                            : "border-zinc-200 bg-white hover:border-indigo-200 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                        }`}
                >
                    <Download className="h-8 w-8" />
                    <span className="font-medium">Local Backup</span>
                </button>
                <button
                    onClick={() => setMode("cloud")}
                    className={`flex flex-col items-center gap-3 rounded-2xl border p-6 transition-all ${mode === "cloud"
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-900/20 dark:text-indigo-300"
                            : "border-zinc-200 bg-white hover:border-indigo-200 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                        }`}
                >
                    <CloudUpload className="h-8 w-8" />
                    <span className="font-medium">Cloud Sync</span>
                </button>
                <button
                    onClick={() => setMode("restore")}
                    className={`flex flex-col items-center gap-3 rounded-2xl border p-6 transition-all ${mode === "restore"
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-900/20 dark:text-indigo-300"
                            : "border-zinc-200 bg-white hover:border-indigo-200 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                        }`}
                >
                    <RefreshCw className="h-8 w-8" />
                    <span className="font-medium">Restore</span>
                </button>
            </div>

            <motion.div
                key={mode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        {mode === "local" && "Download Encrypted Backup"}
                        {mode === "cloud" && "Save to Cloud"}
                        {mode === "restore" && "Restore Data"}
                    </h3>
                    <p className="text-sm text-zinc-500">
                        {mode === "local" && "Download your data as an encrypted file. You will need your password to restore it."}
                        {mode === "cloud" && "Securely save an encrypted snapshot of your data to the cloud."}
                        {mode === "restore" && "Restore your data from a local file or cloud backup. This will overwrite current data."}
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Encryption Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-10 pr-4 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900"
                                placeholder="Enter a strong password"
                            />
                        </div>
                        <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
                            <AlertTriangle className="mr-1 inline h-3 w-3" />
                            If you forget this password, your backup cannot be recovered.
                        </p>
                    </div>

                    {mode === "local" && (
                        <button
                            onClick={handleLocalBackup}
                            disabled={loading || !password}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            Download Backup
                        </button>
                    )}

                    {mode === "cloud" && (
                        <button
                            onClick={handleCloudBackup}
                            disabled={loading || !password}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
                            Upload to Cloud
                        </button>
                    )}

                    {mode === "restore" && (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".enc"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) handleRestore(e.target.files[0]);
                                    }}
                                    className="absolute inset-0 cursor-pointer opacity-0"
                                    disabled={loading || !password}
                                />
                                <button
                                    disabled={loading || !password}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                    Restore from File
                                </button>
                            </div>
                            <button
                                onClick={() => handleRestore()}
                                disabled={loading || !password}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudDownload className="h-4 w-4" />}
                                Restore from Cloud
                            </button>
                        </div>
                    )}

                    {status && (
                        <div className={`flex items-center gap-2 rounded-xl p-3 text-sm ${status.type === "success"
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                                : "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400"
                            }`}>
                            {status.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                            {status.message}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
