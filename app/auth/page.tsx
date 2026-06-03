"use client";

import { useState } from "react";
import { Mail, ShieldCheck, Sparkles } from "lucide-react";
import { Button, PageShell, SectionHeader } from "@/components/ui";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("Email login keeps the MVP wallet-optional.");

  async function signIn() {
    if (!email.trim()) {
      setStatus("Enter an email to request a magic link.");
      return;
    }

    if (!supabase) {
      setStatus("Supabase environment variables are not set, so this demo is showing the intended auth flow.");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/binder` }
    });

    setStatus(error ? error.message : "Magic link sent. Check your inbox.");
  }

  return (
    <PageShell>
      <section className="mx-auto grid min-h-[70vh] max-w-6xl place-items-center px-4 py-8 md:px-6">
        <div className="glass w-full max-w-xl rounded-2xl p-6">
          <SectionHeader title="Start Your Binder" copy="Sign in with email now. Wallet proof can be connected later only when you need it." />
          <div className="grid gap-3">
            <label className="text-xs font-black uppercase text-white/44">Email</label>
            <div className="flex min-h-12 items-center gap-3 rounded-lg border border-line bg-white/[0.055] px-3">
              <Mail size={18} className="text-white/44" />
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="collector@example.com" className="w-full bg-transparent text-sm font-semibold text-white outline-none" />
            </div>
            <button onClick={signIn} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-volt px-4 py-2 text-sm font-black text-ink shadow-glow transition hover:bg-white">
              <Sparkles size={16} />
              Send magic link
            </button>
            <Button variant="secondary">
              <ShieldCheck size={16} />
              Connect wallet for proof later
            </Button>
            <p className="rounded-lg border border-line bg-white/[0.045] p-3 text-sm leading-6 text-white/58">{status}</p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
