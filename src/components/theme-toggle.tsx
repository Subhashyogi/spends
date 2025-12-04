"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Button from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const current = resolvedTheme; // toggle only between light/dark
  const isDark = current === "dark";

  return (
    <Button
      aria-label="Toggle dark mode"
      variant="secondary"
      size="sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Switch to light" : "Switch to dark"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
