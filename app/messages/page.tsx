"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, Mic, Paperclip, Send, ShieldCheck, Undo2, X } from "lucide-react";
import { Button, PageShell, SectionHeader, cx } from "@/components/ui";

type TradeMessage = {
  sender: "System" | "MiraMint" | "You";
  body: string;
};

const initialMessages: TradeMessage[] = [
  { sender: "System", body: "Trade draft created. Keep negotiation on-platform for protection." },
  { sender: "MiraMint", body: "I can do Blastoise if the Charizard VMAX stays in the offer." },
  { sender: "You", body: "That works. I added a note for the condition and proof upload." }
];

export default function MessagesPage() {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [mediaStatus, setMediaStatus] = useState("Proof photos, voice notes, and trade updates stay in this thread.");
  const micStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    cameraStreamRef.current = cameraStream;
    if (videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  useEffect(() => {
    micStreamRef.current = micStream;
  }, [micStream]);

  useEffect(() => {
    return () => {
      micStreamRef.current?.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function sendMessage() {
    if (!body.trim()) return;
    setMessages((current) => current.concat({ sender: "You", body: body.trim() }));
    setBody("");
  }

  async function toggleMic() {
    if (micStream) {
      micStream.getTracks().forEach((track) => track.stop());
      setMicStream(null);
      setMediaStatus("Microphone disconnected.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStream(stream);
      setMediaStatus("Microphone connected. Voice note controls are ready for this trade.");
    } catch {
      setMediaStatus("Microphone permission was blocked or is unavailable in this browser.");
    }
  }

  async function toggleCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
      setMediaStatus("Camera disconnected.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      setMediaStatus("Camera connected. Use this for condition checks or proof photos.");
    } catch {
      setMediaStatus("Camera permission was blocked or is unavailable in this browser.");
    }
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <SectionHeader title="Trade Chat" copy="Private trade-specific chat with offer updates, system messages, voice notes, camera proof, and safety warnings." />

        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="order-2 rounded-[26px] border border-[rgba(23,58,99,0.14)] bg-white/54 p-4 lg:order-1">
            <div className="rounded-[22px] bg-white/72 p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--sky-deep)]">Active trade</p>
              <h2 className="mt-2 font-display text-2xl font-black leading-none text-[var(--navy)]">Charizard VMAX</h2>
              <p className="mt-1 text-sm font-black text-[var(--muted)]">for Blastoise</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-[var(--sun)] px-3 py-1 text-xs font-black text-[var(--navy)]">Countered</span>
                <span className="rounded-full border border-[rgba(23,58,99,0.18)] bg-white px-3 py-1 text-xs font-black text-[var(--muted)]">
                  Proof pending
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-sm font-bold text-[var(--muted)]">
              <div className="flex items-start gap-2 rounded-[18px] border border-[rgba(23,58,99,0.12)] bg-white/48 p-3">
                <ShieldCheck className="mt-0.5 shrink-0 text-[var(--mint)]" size={17} />
                Offer updates and proof receipts are logged automatically.
              </div>
              <div className="flex items-start gap-2 rounded-[18px] border border-[rgba(238,77,77,0.22)] bg-[#ffe2e2]/70 p-3 text-[var(--red)]">
                <AlertTriangle className="mt-0.5 shrink-0" size={17} />
                Avoid moving trades off-platform.
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              <Button variant="secondary" className="w-full min-h-11 text-sm">
                <Undo2 size={16} />
                Counter offer
              </Button>
              <Button className="w-full min-h-11 text-sm">
                <CheckCircle2 size={16} />
                Approve
              </Button>
            </div>
          </aside>

          <div className="chat-panel order-1 overflow-hidden rounded-[28px] border border-[rgba(23,58,99,0.14)] bg-white/64 shadow-[0_24px_70px_-42px_rgba(23,58,99,0.65)] lg:order-2">
            <div className="flex flex-col gap-3 border-b border-[rgba(23,58,99,0.12)] bg-white/54 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-display text-2xl font-black text-[var(--navy)]">MiraMint</h1>
                <p className="mt-1 text-xs font-black uppercase tracking-[0.1em] text-[var(--muted)]">Verification pending after approval</p>
              </div>
              <div className="flex gap-2">
                <MediaButton active={Boolean(micStream)} label="Mic" onClick={toggleMic}>
                  <Mic size={17} />
                </MediaButton>
                <MediaButton active={Boolean(cameraStream)} label="Camera" onClick={toggleCamera}>
                  <Camera size={17} />
                </MediaButton>
              </div>
            </div>

            <div className="min-h-[430px] space-y-3 p-4">
              {messages.map((message, index) => (
                <MessageBubble key={`${message.sender}-${index}`} message={message} />
              ))}
            </div>

            <div className="border-t border-[rgba(23,58,99,0.12)] bg-white/58 p-4">
              {cameraStream ? (
                <div className="mb-3 overflow-hidden rounded-[20px] border border-[rgba(23,58,99,0.16)] bg-[var(--navy)]">
                  <div className="flex items-center justify-between px-3 py-2 text-xs font-black text-white">
                    <span>Camera connected</span>
                    <button onClick={toggleCamera} className="grid size-7 place-items-center rounded-full bg-white/16" aria-label="Disconnect camera">
                      <X size={14} />
                    </button>
                  </div>
                  <video ref={videoRef} autoPlay muted playsInline className="max-h-56 w-full object-cover" />
                </div>
              ) : null}

              <div className="flex items-end gap-2 rounded-[24px] border border-[rgba(23,58,99,0.16)] bg-white p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.74)]">
                <button aria-label="Attach proof file" className="grid size-11 shrink-0 place-items-center rounded-full text-[var(--muted)] transition hover:bg-[var(--sky-soft)] hover:text-[var(--navy)]">
                  <Paperclip size={18} />
                </button>
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Message about this trade"
                  className="min-h-11 flex-1 resize-none bg-transparent px-1 py-3 text-sm font-bold leading-6 text-[var(--navy)] outline-none placeholder:text-[var(--muted)]"
                />
                <button aria-label="Send message" onClick={sendMessage} className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-[var(--navy)] bg-[var(--sun)] text-[var(--navy)] shadow-sm">
                  <Send size={18} />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs font-bold text-[var(--muted)]">
                <ShieldCheck size={14} />
                {mediaStatus}
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function MessageBubble({ message }: { message: TradeMessage }) {
  const mine = message.sender === "You";
  const system = message.sender === "System";

  return (
    <div
      className={cx(
        "max-w-[82%] rounded-[22px] border p-3.5 shadow-[0_14px_32px_-28px_rgba(23,58,99,0.65)]",
        mine && "ml-auto border-[var(--navy)] bg-[var(--sun)] text-[var(--navy)]",
        system && "mx-auto max-w-[72%] border-[rgba(25,195,154,0.24)] bg-[#d7f7ee] text-[var(--mint)]",
        !mine && !system && "border-[rgba(23,58,99,0.14)] bg-white text-[var(--navy)]"
      )}
    >
      <div className="text-xs font-black opacity-70">{message.sender}</div>
      <div className="mt-1 text-sm font-bold leading-6">{message.body}</div>
    </div>
  );
}

function MediaButton({ active, children, label, onClick }: { active: boolean; children: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-xs font-black transition",
        active
          ? "border-[var(--navy)] bg-[var(--sun)] text-[var(--navy)]"
          : "border-[rgba(23,58,99,0.16)] bg-white/72 text-[var(--muted)] hover:text-[var(--navy)]"
      )}
    >
      {children}
      {label}
    </button>
  );
}
