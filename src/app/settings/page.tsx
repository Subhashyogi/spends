"use client";

import Link from "next/link";
import BackupManager from "@/components/backup-manager";
import ActivityLog from "@/components/activity-log";
import SecuritySettings from "@/components/security-settings";
import TwoFactorSetup from "@/components/two-factor-setup";
import DeviceList from "@/components/device-list";
import { ArrowLeft, Shield, Database, Activity } from "lucide-react";

export default function SettingsPage() {
  return (
    <main className="min-h-screen space-y-8 bg-zinc-50 p-4 dark:bg-transparent sm:p-8">
      <div className="mx-auto w-full space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Profile
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Settings</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Manage security, backups, and activity logs.</p>
        </div>

        {/* Security */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-6 flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <div className="rounded-full bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Security</h2>
              <p className="text-xs text-zinc-500">Manage 2FA, devices, and app lock.</p>
            </div>
          </div>
          <div className="space-y-8">
            <SecuritySettings />
            <div className="border-t border-zinc-100 pt-8 dark:border-zinc-800">
              <TwoFactorSetup />
            </div>
            <div className="border-t border-zinc-100 pt-8 dark:border-zinc-800">
              <DeviceList />
            </div>
          </div>
        </div>

        {/* Backup */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-6 flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <div className="rounded-full bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Backup & Restore</h2>
              <p className="text-xs text-zinc-500">Secure your data locally or in the cloud.</p>
            </div>
          </div>
          <BackupManager />
        </div>

        {/* Activity Log */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-6 flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <div className="rounded-full bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Activity Log</h2>
              <p className="text-xs text-zinc-500">Track recent account activity.</p>
            </div>
          </div>
          <ActivityLog />
        </div>
      </div>
    </main>
  );
}
