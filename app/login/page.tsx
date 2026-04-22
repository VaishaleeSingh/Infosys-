"use client";

/**
 * /login — Infosys-style sign-in page.
 *
 * Layout (matches InfyTQ / Springboard login):
 *
 *   ┌───────────────────────────────┬───────────────────────────────┐
 *   │                               │                               │
 *   │   Infosys wordmark            │   Sign in                     │
 *   │   "Navigate your next"        │                               │
 *   │                               │   Email     [__________]      │
 *   │   (Deep-blue gradient panel   │   Password  [__________]      │
 *   │    with subtle pattern)       │                               │
 *   │                               │   [ Sign In ]                 │
 *   │                               │                               │
 *   │                               │   Forgot password?            │
 *   │                               │                               │
 *   └───────────────────────────────┴───────────────────────────────┘
 *
 * On desktop it's a 50/50 split. On narrow screens the left panel
 * collapses to a top banner so the form stays usable.
 *
 * Auth is local-only (no backend). Any valid-looking email + a
 * password of length >= 4 is accepted. On success we push back to /.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const user = useAuthStore((s) => s.user);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const termsAccepted = useAuthStore((s) => s.termsAccepted);
  // If already logged in, route to either terms or the app.
  useEffect(() => {
    if (user) router.replace(termsAccepted ? "/" : "/terms");
  }, [user, termsAccepted, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    setSubmitting(true);
    // Simulate a network round-trip so the button state feels real.
    await new Promise((r) => setTimeout(r, 350));
    login(email);
    router.replace("/terms");
  };

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-white overflow-hidden">
      {/* LEFT — Infosys brand panel */}
      <aside className="relative md:flex-[1.1] flex items-center justify-center text-white px-8 py-10 md:py-0 overflow-hidden">
        {/* Deep Infosys-blue gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #0B3B6B 0%, #124E87 35%, #007CC3 75%, #00B4A6 100%)",
          }}
          aria-hidden
        />
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.25) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
          aria-hidden
        />

        <div className="relative z-10 max-w-md w-full">
          {/* Infosys wordmark — rendered in text to avoid shipping an
              unlicensed logo asset. Color + weight matches the brand. */}
          <div className="flex items-baseline gap-2 mb-8">
            <span
              className="text-5xl font-bold tracking-tight"
              style={{ fontFamily: '"Helvetica Neue", Arial, sans-serif' }}
            >
              Infosys
            </span>
            <span className="w-3 h-3 rounded-full bg-[#EB2226]" aria-hidden />
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
            Coding Hands-on
          </h1>
          <p className="mt-2 text-lg text-white/85">
            Navigate your next. Solve real-world programming challenges,
            run them against sample tests, and submit in a single sitting.
          </p>

          <ul className="mt-8 space-y-2 text-sm text-white/85">
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 bg-white rounded-full" />
              Python code runs directly in your browser — no installs.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 bg-white rounded-full" />
              Multiple sample test cases per problem.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 bg-white rounded-full" />
              Session-based access — your progress is kept while the tab is open.
            </li>
          </ul>
        </div>
      </aside>

      {/* RIGHT — sign-in form */}
      <main className="md:flex-[1] flex items-center justify-center px-6 py-10 md:py-0">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-sm"
          aria-label="Sign in"
        >
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900">Sign In</h2>
            <p className="text-sm text-gray-500 mt-1">
              Use your Infosys credentials to start the assessment.
            </p>
          </div>

          <label className="block mb-4">
            <span className="block text-[12px] font-medium text-gray-700 mb-1">
              Email
            </span>
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full h-10 px-3 rounded border border-gray-300 focus:border-infy-500 focus:ring-2 focus:ring-infy-100 outline-none text-sm"
            />
          </label>

          <label className="block mb-2">
            <span className="block text-[12px] font-medium text-gray-700 mb-1">
              Password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-10 px-3 rounded border border-gray-300 focus:border-infy-500 focus:ring-2 focus:ring-infy-100 outline-none text-sm"
            />
          </label>

          <div className="flex items-center justify-between text-[12px] mb-6">
            <label className="flex items-center gap-2 text-gray-600">
              <input type="checkbox" className="rounded border-gray-300" />
              Keep me signed in
            </label>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="text-infy-600 hover:text-infy-700"
            >
              Forgot password?
            </a>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 text-[12px] text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-10 rounded bg-infy-500 hover:bg-infy-600 text-white font-medium text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: submitting ? "#007A72" : undefined }}
          >
            {submitting ? "Signing in…" : "Sign In"}
          </button>

          <p className="mt-6 text-center text-[12px] text-gray-500">
            Demo login: any valid email + password ≥ 4 characters.
          </p>

          <footer className="mt-10 pt-6 border-t border-gray-200 text-[11px] text-gray-400 text-center">
            © {new Date().getFullYear()} Infosys Limited · Coding Hands-on
          </footer>
        </form>
      </main>
    </div>
  );
}
