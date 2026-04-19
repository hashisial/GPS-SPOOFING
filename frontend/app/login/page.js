"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useAuthSession } from "@/hooks/useAuthSession";
import { apiRequest } from "@/lib/api";

const starterAccounts = [
  "Admin: admin@gpsshield.local / Admin123!",
  "User: analyst@gpsshield.local / User123!"
];

export default function LoginPage() {
  const router = useRouter();
  const { setAuthSession } = useAuthSession();
  const [form, setForm] = useState({
    email: "admin@gpsshield.local",
    password: "Admin123!"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(form)
      });

      setAuthSession(response);
      router.push("/");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-app text-text-primary">
      <div className="absolute inset-0 bg-grid-fade bg-[size:44px_44px] opacity-[0.07]" />
      <div className="absolute right-6 top-6 z-10">
        <ThemeToggle />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-6 py-10 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="panel relative overflow-hidden p-8 shadow-glow"
          >
            <div className="absolute -left-10 top-0 h-36 w-36 rounded-full bg-signal/15 blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-signal/25 bg-signal/10 px-4 py-2 text-sm text-signal">
                <ShieldCheck size={16} />
                Secure mission authentication
              </div>
              <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight">
                Enter the spoofing defense control grid.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-text-muted">
                Sign in to access secure exports, administrative fleet controls,
                threshold tuning, and realtime authenticated websocket streams.
              </p>
            </div>

            <div className="relative mt-8 space-y-3 rounded-3xl border border-line/20 bg-surface-strong/60 p-6">
              <p className="eyebrow">Seeded credentials</p>
              {starterAccounts.map((account) => (
                <p key={account} className="text-sm text-text-primary">
                  {account}
                </p>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="panel p-8"
          >
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <p className="eyebrow">Sign In</p>
                <h2 className="mt-4 font-display text-3xl font-semibold">
                  Authenticated operator access
                </h2>
              </div>

              <label className="block space-y-2">
                <span className="text-sm text-text-muted">Email</span>
                <input
                  className="field"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-text-muted">Password</span>
                <input
                  className="field"
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, password: event.target.value }))
                  }
                />
              </label>

              {error ? (
                <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm">
                  {error}
                </div>
              ) : null}

              <button className="primary-button w-full" disabled={loading} type="submit">
                <LockKeyhole size={16} />
                {loading ? "Signing in..." : "Enter dashboard"}
                <ArrowRight size={16} />
              </button>

              <p className="text-sm text-text-muted">
                Need a quick preview first?{" "}
                <Link href="/" className="text-signal">
                  Open demo mode
                </Link>
              </p>
            </form>
          </motion.section>
        </div>
      </div>
    </main>
  );
}
