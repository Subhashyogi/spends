import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ToastProvider from "@/components/ui/toast";
import ThemeProvider from "@/components/theme-provider";
import ThemeToggle from "@/components/theme-toggle";
import LayoutWrapper from "@/components/layout-wrapper";

import PWARegister from "@/components/pwa-register";
import NextSessionProvider from "@/components/session-provider";
import AuthButtons from "@/components/auth-buttons";
import AppLockProvider from "@/components/app-lock-provider";
import SessionGuard from "@/components/session-guard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spends – Personal Finance Tracker",
  description: "Track income, expenses, and savings with a sleek dashboard.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/spends.svg",
    apple: "/spends.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-br from-zinc-50 via-white to-indigo-50 dark:from-black dark:via-zinc-950 dark:to-indigo-950/40`}
      >
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>
        <ThemeProvider>
          <NextSessionProvider>
            <ToastProvider>
              <AppLockProvider>
                <SessionGuard>
                  <LayoutWrapper>
                    {children}
                  </LayoutWrapper>
                </SessionGuard>
                <PWARegister />
              </AppLockProvider>
            </ToastProvider>
          </NextSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
