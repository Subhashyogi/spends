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
    const [isVerified, setIsVerified] = useState(false);
    const [lastBackup, setLastBackup] = useState<string | null>(null);
    const [backupType, setBackupType] = useState<"user" | "system">("user");

    // Fetch last backup time on mount
    useState(() => {
        fetch("/api/backup/cloud?info=true")
            .then(res => res.json())
            .then(data => {
                if (data.timestamp) {
                    setLastBackup(new Date(data.timestamp).toLocaleString());
                    if (data.encryptionMethod) setBackupType(data.encryptionMethod);
                }
            })
            .catch(() => { }); // Ignore errors
    });

    const handleVerify = async () => {
        if (!password) {
            setStatus({ type: "error", message: "Password is required" });
            return;
        }
        setLoading(true);
        setStatus(null);
        try {
            const res = await fetch("/api/user/verify-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password })
            });
            const { ok, data } = await safeJson(res);

            if (!ok) throw new Error(data?.error || "Incorrect password");

            setIsVerified(true);
            setStatus({ type: "success", message: "Password verified! You can now proceed." });
        } catch (e: any) {
            setStatus({ type: "error", message: e.message || "Verification failed" });
            setIsVerified(false);
        } finally {
            setLoading(false);
        }
    };

    const handleLocalBackup = async () => {
        if (!isVerified) return;
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
        if (!isVerified) return;
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
            setLastBackup(new Date().toLocaleString());
            setBackupType("user"); // Manual backup is always user-encrypted
        } catch (e: any) {
            setStatus({ type: "error", message: e.message || "Cloud backup failed" });
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (file?: File) => {
        if (!isVerified) return;
        setLoading(true);
        setStatus(null);
        try {
            // Handle Auto Backup (System Encrypted)
            if (!file && backupType === "system") {
                const res = await fetch("/api/backup/restore-auto", { method: "POST" });
                const { ok, data } = await safeJson(res);
                if (!ok) throw new Error(data?.error || "Failed to restore auto-backup");

                setStatus({ type: "success", message: "Auto-backup restored successfully! Reloading..." });
                setTimeout(() => window.location.reload(), 2000);
                return;
            }

            // Handle Manual Backup (User Encrypted)
            let encryptedData = "";

            if (file) {
                // Read file
                encryptedData = await file.text();
            } else {
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
                    onClick={() => { setMode("local"); setIsVerified(false); setPassword(""); setStatus(null); }}
                    className={`glass flex flex-col items-center gap-3 rounded-2xl p-6 transition-all ${mode === "local"
                        ? "border-indigo-500/50 bg-indigo-50/50 dark:bg-indigo-900/20 ring-2 ring-indigo-500/20"
                        : "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50"
                        }`}
                >
                    <Download className={`h-8 w-8 ${mode === "local" ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400"}`} />
                    <span className={`font-medium ${mode === "local" ? "text-indigo-900 dark:text-indigo-100" : "text-zinc-600 dark:text-zinc-400"}`}>Local Backup</span>
                </button>
                <button
                    onClick={() => { setMode("cloud"); setIsVerified(false); setPassword(""); setStatus(null); }}
                    className={`glass flex flex-col items-center gap-3 rounded-2xl p-6 transition-all ${mode === "cloud"
                        ? "border-indigo-500/50 bg-indigo-50/50 dark:bg-indigo-900/20 ring-2 ring-indigo-500/20"
                        : "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50"
                        }`}
                >
                    <CloudUpload className={`h-8 w-8 ${mode === "cloud" ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400"}`} />
                    <span className={`font-medium ${mode === "cloud" ? "text-indigo-900 dark:text-indigo-100" : "text-zinc-600 dark:text-zinc-400"}`}>Cloud Sync</span>
                </button>
                <button
                    onClick={() => { setMode("restore"); setIsVerified(false); setPassword(""); setStatus(null); }}
                    className={`glass flex flex-col items-center gap-3 rounded-2xl p-6 transition-all ${mode === "restore"
                        ? "border-indigo-500/50 bg-indigo-50/50 dark:bg-indigo-900/20 ring-2 ring-indigo-500/20"
                        : "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50"
                        }`}
                >
                    <RefreshCw className={`h-8 w-8 ${mode === "restore" ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400"}`} />
                    <span className={`font-medium ${mode === "restore" ? "text-indigo-900 dark:text-indigo-100" : "text-zinc-600 dark:text-zinc-400"}`}>Restore</span>
                </button>
            </div>

            <motion.div
                key={mode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-6"
            >
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        {mode === "local" && "Download Encrypted Backup"}
                        {mode === "cloud" && "Save to Cloud"}
                        {mode === "restore" && "Restore Data"}
                    </h3>
                    <p className="text-sm text-zinc-500">
                        {mode === "local" && "Download your data as an encrypted file. You will need your account password to restore it."}
                        {mode === "cloud" && "Securely save an encrypted snapshot of your data to the cloud."}
                        {mode === "restore" && "Restore your data from a local file or cloud backup. This will overwrite current data."}
                    </p>
                    {mode === "cloud" && lastBackup && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Last backup: {lastBackup} {backupType === "system" && "(Auto)"}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Account Password
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setIsVerified(false);
                                    }}
                                    className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-10 pr-4 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-800 dark:bg-zinc-900"
                                    placeholder="Enter your login password"
                                    disabled={loading && isVerified}
                                />
                            </div>
                            {!isVerified && (
                                <button
                                    onClick={handleVerify}
                                    disabled={loading || !password}
                                    className="rounded-xl bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                                </button>
                            )}
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                            Enter your account password to verify your identity and encrypt/decrypt your data.
                        </p>
                    </div>

                    {isVerified && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="space-y-4 pt-2"
                        >
                            {mode === "local" && (
                                <button
                                    onClick={handleLocalBackup}
                                    disabled={loading}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                                    Download Backup
                                </button>
                            )}

                            {mode === "cloud" && (
                                <button
                                    onClick={handleCloudBackup}
                                    disabled={loading}
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
                                            disabled={loading}
                                        />
                                        <button
                                            disabled={loading}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                        >
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                            Restore from File
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => handleRestore()}
                                        disabled={loading}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudDownload className="h-4 w-4" />}
                                        Restore from Cloud {backupType === "system" && "(Auto)"}
                                    </button>
                                </div>
                            )}
                        </motion.div>
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
