"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Button from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export default function RegisterPage() {
  const router = useRouter();
  const { notify } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!name.trim() || !email.trim() || password.length < 6) {
        throw new Error("Enter name, email and a password (6+ chars)");
      }
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Registration failed");

      notify({ title: "Registered", message: "Signing you in…", variant: "success" });
      const result = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password,
      });
      if (result && !result.error) {
        router.push("/");
      } else {
        notify({ title: "Sign-in required", message: "Please sign in with your credentials", variant: "warning" });
        router.push("/api/auth/signin");
      }
    } catch (e: any) {
      setError(e?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Create account</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Register to keep your data private to your account.</p>
      </div>

      <form onSubmit={onSubmit} className="rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur dark:bg-zinc-900/60">
        <div className="grid gap-3">
          <div>
            <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-300">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border bg-white/80 px-3 py-2 outline-none ring-offset-2 transition focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900/60"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border bg-white/80 px-3 py-2 outline-none ring-offset-2 transition focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900/60"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border bg-white/80 px-3 py-2 outline-none ring-offset-2 transition focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900/60"
              placeholder="••••••••"
            />
            <div className="mt-1 text-xs text-zinc-500">At least 6 characters.</div>
          </div>
        </div>

        {error && <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-sm text-rose-600 dark:text-rose-400">{error}</div>}

        <div className="mt-4 flex items-center gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create account"}
          </Button>
          <a href="/api/auth/signin" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">Have an account? Sign in</a>
        </div>
      </form>
    </main>
  );
}
