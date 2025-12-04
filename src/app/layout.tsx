import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ToastProvider from "@/components/ui/toast";
import ThemeProvider from "@/components/theme-provider";
import ThemeToggle from "@/components/theme-toggle";
import PWARegister from "@/components/pwa-register";
import NextSessionProvider from "@/components/session-provider";
import AuthButtons from "@/components/auth-buttons";

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
              <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center justify-between">
                  <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Spends</h1>
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <AuthButtons />
                  </div>
                </div>
                {children}
              </div>
              <PWARegister />
            </ToastProvider>
          </NextSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
