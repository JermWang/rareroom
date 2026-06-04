"use client";

import { useState } from "react";
import { Mail, ShieldCheck, Sparkles } from "lucide-react";
import { Button, PageShell, SectionHeader } from "@/components/ui";
import { supabase } from "@/lib/supabase";

function DiscordIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028ZM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
    </svg>
  );
}

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Sign in with Discord, or use an email magic link.");

  async function signInWithDiscord() {
    if (!supabase) {
      setStatus("Supabase isn't configured here yet, so this is showing the intended flow.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/binder` }
    });
    if (error) {
      setBusy(false);
      setStatus(error.message);
    }
    // On success the browser redirects to Discord, so no further handling needed here.
  }

  async function signInWithEmail() {
    if (!email.trim()) {
      setStatus("Enter an email to request a magic link.");
      return;
    }
    if (!supabase) {
      setStatus("Supabase environment variables are not set, so this demo is showing the intended auth flow.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/binder` }
    });
    setBusy(false);
    setStatus(error ? error.message : "Magic link sent. Check your inbox.");
  }

  return (
    <PageShell>
      <section className="mx-auto grid min-h-[70vh] max-w-6xl place-items-center px-4 py-8 md:px-6">
        <div className="rr-panel w-full max-w-xl rounded-2xl p-6">
          <SectionHeader title="Start Your Binder" copy="Use your Discord account to keep the username and avatar you already have — or sign in with an email magic link." />
          <div className="grid gap-3">
            {/* Social-first: Discord */}
            <button
              onClick={signInWithDiscord}
              disabled={busy}
              className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-lg px-4 py-2 text-sm font-black text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: "#5865F2" }}
            >
              <DiscordIcon size={19} />
              Continue with Discord
            </button>

            <div className="my-1 flex items-center gap-3 text-xs font-black uppercase text-[var(--muted)]">
              <span className="h-px flex-1 bg-[var(--line)]" />
              or use email
              <span className="h-px flex-1 bg-[var(--line)]" />
            </div>

            <label className="text-xs font-black uppercase text-[var(--muted)]">Email</label>
            <div className="flex min-h-12 items-center gap-3 rounded-lg border-2 border-[var(--line)] bg-white px-3">
              <Mail size={18} className="text-[var(--muted)] shrink-0" />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && signInWithEmail()}
                placeholder="collector@example.com"
                className="w-full bg-transparent text-sm font-semibold text-[var(--navy)] outline-none placeholder:text-[var(--muted)]"
              />
            </div>
            <button
              onClick={signInWithEmail}
              disabled={busy}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--sun)] px-4 py-2 text-sm font-black text-[var(--navy)] shadow-sm transition hover:bg-[var(--sun-deep)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Sparkles size={16} />
              Send magic link
            </button>

            <Button variant="secondary">
              <ShieldCheck size={16} />
              Connect wallet for proof later
            </Button>
            <p className="rounded-lg border border-[var(--line)] bg-[var(--sky-soft)] p-3 text-sm leading-6 text-[var(--navy)]">{status}</p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
