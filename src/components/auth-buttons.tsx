"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Button from "@/components/ui/button";
import Link from "next/link";
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

  return (
    <Link
      href="/profile"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      title={name}
    >
      <User className="h-4 w-4" />
    </Link>
  );
}
