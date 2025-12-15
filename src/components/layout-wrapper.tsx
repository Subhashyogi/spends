"use client";

import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/theme-toggle";
import AuthButtons from "@/components/auth-buttons";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isChat = pathname?.startsWith("/chat");
    const isAuth = pathname?.startsWith("/auth") || pathname?.startsWith("/register");

    if (isChat || isAuth) {
        return <>{children}</>;
    }

    return (
        <div className="mx-auto w-full px-4 py-10 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Spends</h1>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <AuthButtons />
                </div>
            </div>
            {children}
        </div>
    );
}
