"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Button from "@/components/ui/button";
import { User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function AuthButtons() {
  const { data, status } = useSession();
  const loading = status === "loading";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  if (loading) return null;

  if (!data?.user) {
    return (
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => signIn(undefined, { callbackUrl: "/" })}>Sign in</Button>
        <a href="/register" className="inline-flex h-8 items-center justify-center rounded-xl bg-indigo-600 px-3 text-xs font-medium text-white hover:bg-indigo-500">Register</a>
      </div>
    );
  }

  const name = data.user.name || "User";
  const email = data.user.email || "";
  // id was attached in session callbacks
  const id = (data.user as any)?.id as string | undefined;

  return (
    <div ref={ref} className="relative">
      <Button
        aria-label="Account"
        variant="secondary"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        title={name}
      >
        <User className="h-4 w-4" />
      </Button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border bg-white/95 p-3 text-sm shadow-lg backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
          <div className="mb-2">
            <div className="font-medium text-zinc-900 dark:text-zinc-50">{name}</div>
            {email && <div className="truncate text-xs text-zinc-600 dark:text-zinc-300">{email}</div>}
            {id && <div className="mt-1 truncate text-[10px] text-zinc-400">ID: {id}</div>}
          </div>
          <div className="mb-2 flex items-center justify-between">
            <a href="/settings" className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">Settings</a>
          </div>
          <div className="flex items-center justify-end">
            <Button size="sm" variant="secondary" onClick={() => signOut({ callbackUrl: "/" })}>Sign out</Button>
          </div>
        </div>
      )}
    </div>
  );
}
