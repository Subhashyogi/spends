"use client";

import * as React from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import {
    CreditCard,
    LayoutDashboard,
    Settings,
    Sparkles,
    Moon,
    Sun,
    Plus,
    ArrowRight,
    TrendingUp,
    TrendingDown,
    LogOut
} from "lucide-react";
import { useTheme } from "next-themes";

export function CommandMenu() {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();
    const { setTheme, theme } = useTheme();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={() => setOpen(false)}
            />

            {/* Command Dialog */}
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white/90 shadow-2xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/90 animate-in fade-in zoom-in-95 duration-200">
                <Command className="w-full">
                    <div className="flex items-center border-b border-zinc-200 px-4 dark:border-zinc-800">
                        <Sparkles className="mr-2 h-5 w-5 text-indigo-500 animate-pulse" />
                        <Command.Input
                            placeholder="Type a command or search..."
                            className="flex h-14 w-full bg-transparent text-sm outline-none placeholder:text-zinc-500 dark:text-white"
                            autoFocus
                        />
                    </div>

                    <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
                        <Command.Empty className="py-6 text-center text-sm text-zinc-500">
                            No results found.
                        </Command.Empty>

                        <Command.Group heading="Actions" className="mb-2 px-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            <Command.Item
                                onSelect={() => runCommand(() => document.getElementById("amount-input")?.focus())}
                                className="flex cursor-pointer select-none items-center rounded-lg px-2 py-3 text-sm text-zinc-900 hover:bg-zinc-100 hover:text-indigo-600 dark:text-zinc-100 dark:hover:bg-zinc-800/50 dark:hover:text-indigo-400 group transition-colors"
                            >
                                <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    <Plus className="h-4 w-4" />
                                </div>
                                <span>Add New Transaction</span>
                                <span className="ml-auto text-xs text-zinc-400 group-hover:text-indigo-500">Jump to Form</span>
                            </Command.Item>
                        </Command.Group>

                        <Command.Group heading="Navigation" className="mb-2 px-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            <Command.Item
                                onSelect={() => runCommand(() => router.push("/"))}
                                className="flex cursor-pointer select-none items-center rounded-lg px-2 py-3 text-sm text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
                            >
                                <LayoutDashboard className="mr-3 h-4 w-4 text-zinc-500" />
                                Dashboard
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => router.push("/stories"))}
                                className="flex cursor-pointer select-none items-center rounded-lg px-2 py-3 text-sm text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
                            >
                                <Sparkles className="mr-3 h-4 w-4 text-zinc-500" />
                                AI Stories
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => router.push("/settings"))} // Assuming settings page or modal
                                className="flex cursor-pointer select-none items-center rounded-lg px-2 py-3 text-sm text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
                            >
                                <Settings className="mr-3 h-4 w-4 text-zinc-500" />
                                Settings
                            </Command.Item>
                        </Command.Group>

                        <Command.Group heading="Appearance" className="mb-2 px-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            <Command.Item
                                onSelect={() => runCommand(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}
                                className="flex cursor-pointer select-none items-center rounded-lg px-2 py-3 text-sm text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
                            >
                                {theme === 'dark' ? <Sun className="mr-3 h-4 w-4 text-amber-500" /> : <Moon className="mr-3 h-4 w-4 text-indigo-500" />}
                                Toggle Theme
                            </Command.Item>
                        </Command.Group>
                    </Command.List>

                    <div className="border-t border-zinc-200 px-4 py-2 dark:border-zinc-800">
                        <p className="text-xs text-zinc-400">
                            Press <kbd className="rounded bg-zinc-200 px-1 py-0.5 font-sans text-[10px] dark:bg-zinc-800">Esc</kbd> to close
                        </p>
                    </div>
                </Command>
            </div>
        </div>
    );
}
