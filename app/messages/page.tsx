"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Send, ShieldCheck, Undo2 } from "lucide-react";
import { Button, PageShell, SectionHeader } from "@/components/ui";

const initialMessages = [
  { sender: "System", body: "Trade draft created. Keep negotiation on-platform for protection." },
  { sender: "MiraMint", body: "I can do Blastoise if the Charizard VMAX stays in the offer." },
  { sender: "You", body: "That works. I added a note for the condition and proof upload." }
];

export default function MessagesPage() {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");

  function sendMessage() {
    if (!body.trim()) return;
    setMessages((current) => current.concat({ sender: "You", body: body.trim() }));
    setBody("");
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <SectionHeader title="Trade Chat" copy="Private trade-specific chat with offer updates, system messages, and safety warnings." />
        <div className="glass overflow-hidden rounded-2xl">
          <div className="border-b border-line p-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h1 className="font-black text-white">Charizard VMAX ↔ Blastoise</h1>
                <p className="mt-1 text-xs text-white/48">Status: Countered · Verification pending after approval</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary">
                  <Undo2 size={16} />
                  Counter offer
                </Button>
                <Button>
                  <CheckCircle2 size={16} />
                  Approve
                </Button>
              </div>
            </div>
          </div>
          <div className="bg-danger/10 px-4 py-3 text-sm font-bold text-danger">
            <AlertTriangle className="mr-2 inline" size={16} />
            Warning: avoid moving trades off-platform. Reports and proof are tied to this thread.
          </div>
          <div className="min-h-[420px] space-y-3 p-4">
            {messages.map((message, index) => (
              <div key={`${message.sender}-${index}`} className={`max-w-[82%] rounded-xl border border-line p-3 ${message.sender === "You" ? "ml-auto bg-volt text-ink" : message.sender === "System" ? "mx-auto bg-mint/10 text-mint" : "bg-white/[0.055] text-white"}`}>
                <div className="text-xs font-black opacity-70">{message.sender}</div>
                <div className="mt-1 text-sm font-semibold leading-6">{message.body}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-line p-4">
            <div className="flex gap-2">
              <input
                value={body}
                onChange={(event) => setBody(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") sendMessage();
                }}
                placeholder="Message about this trade"
                className="min-h-12 flex-1 rounded-lg border border-line bg-white/[0.055] px-3 text-sm font-semibold text-white outline-none"
              />
              <button aria-label="Send message" onClick={sendMessage} className="grid size-12 place-items-center rounded-lg bg-volt text-ink">
                <Send size={18} />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-white/44">
              <ShieldCheck size={14} />
              System messages are added automatically for offer, counteroffer, verification, dispute, and completion events.
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
