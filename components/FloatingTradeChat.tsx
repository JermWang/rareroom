"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, MessageSquare, Mic, Minus, Paperclip, Send, ShieldCheck, Undo2, X } from "lucide-react";

type TradeMessage = {
  id?: string;
  sender: "System" | "Collector" | "You";
  body: string;
};

const initialMessages: TradeMessage[] = [
  { sender: "System", body: "Open or send a real trade to start a protected on-platform thread." }
];

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function FloatingTradeChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [activeTradeId, setActiveTradeId] = useState<string | null>(null);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [mediaStatus, setMediaStatus] = useState("Condition photos, voice notes, and trade updates stay in this thread.");
  const micStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const openChat = (event: Event) => {
      const detail = (event as CustomEvent<{ tradeId?: string }>).detail;
      if (detail?.tradeId) setActiveTradeId(detail.tradeId);
      setOpen(true);
    };
    window.addEventListener("rareroom:open-trade-chat", openChat);

    const params = new URLSearchParams(window.location.search);
    if (params.get("chat") === "open") {
      setOpen(true);
    }

    return () => window.removeEventListener("rareroom:open-trade-chat", openChat);
  }, []);

  useEffect(() => {
    if (!activeTradeId) return;
    let cancelled = false;
    async function loadMessages() {
      try {
        const res = await fetch(`/api/messages?tradeId=${encodeURIComponent(activeTradeId as string)}`);
        const json = await res.json();
        if (!cancelled && res.ok) {
          setMessages(json.messages.length > 0 ? json.messages : [{ sender: "System", body: "Trade thread created. Keep negotiation on-platform for protection." }]);
          setMediaStatus("Messages in this thread are saved to the trade record.");
        }
      } catch {
        if (!cancelled) setMediaStatus("Could not load saved messages for this trade.");
      }
    }
    loadMessages();
    return () => {
      cancelled = true;
    };
  }, [activeTradeId]);

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

  async function sendMessage() {
    if (!body.trim()) return;
    const text = body.trim();
    setBody("");
    if (!activeTradeId) {
      setMessages((current) => current.concat({ sender: "You", body: text }));
      setMediaStatus("This draft message is local because no real trade thread is open.");
      return;
    }
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeId: activeTradeId, body: text })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not save message.");
      setMessages((current) => current.concat(json.message));
    } catch (error) {
      setMessages((current) => current.concat({ sender: "System", body: error instanceof Error ? error.message : "Could not save message." }));
    }
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
      setMediaStatus("Camera connected. Use this for condition checks, not ownership validation.");
    } catch {
      setMediaStatus("Camera permission was blocked or is unavailable in this browser.");
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[86px] right-4 z-[60] inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] border-[var(--navy)] bg-[var(--sun)] px-4 font-display text-xs font-black text-[var(--navy)] shadow-[0_4px_0_var(--navy),0_14px_24px_-18px_rgba(23,58,99,0.58)] transition hover:-translate-y-0.5 md:bottom-6 md:right-6"
        aria-label="Open trade chat"
      >
        <MessageSquare size={19} />
        <span className="hidden sm:inline">Trade chat</span>
        <span className="absolute right-1.5 top-1.5 size-3 rounded-full border-2 border-white bg-[var(--mint)]" />
      </button>
    );
  }

  return (
    <section
      aria-label="Trade chat"
      className="floating-chat-panel fixed bottom-[76px] left-3 right-3 z-[60] flex max-h-[calc(100dvh-104px)] flex-col overflow-hidden rounded-[26px] border-2 border-[var(--navy)] bg-[#eaf8ff]/95 shadow-[0_28px_80px_-36px_rgba(23,58,99,0.75)] backdrop-blur-xl md:bottom-6 md:left-auto md:right-6 md:h-[620px] md:w-[390px]"
    >
      <header className="flex items-start justify-between gap-3 border-b border-[rgba(23,58,99,0.14)] bg-white/58 p-3.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-full border-2 border-[var(--navy)] bg-[var(--sun)] text-xs font-black text-[var(--navy)]">MM</span>
            <div className="min-w-0">
              <h2 className="truncate font-display text-xl font-black leading-none text-[var(--navy)]">Trade chat</h2>
              <p className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.09em] text-[var(--muted)]">
                {activeTradeId ? "Saved trade thread" : "No active trade"}
              </p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-[var(--sun)] px-2.5 py-1 text-[10px] font-black text-[var(--navy)]">Countered</span>
            <span className="rounded-full border border-[rgba(23,58,99,0.16)] bg-white px-2.5 py-1 text-[10px] font-black text-[var(--muted)]">Source pending</span>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-full border border-[rgba(23,58,99,0.14)] bg-white/72 text-[var(--navy)]" aria-label="Minimize trade chat">
            <Minus size={16} />
          </button>
          <button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-full border border-[rgba(23,58,99,0.14)] bg-white/72 text-[var(--navy)]" aria-label="Close trade chat">
            <X size={16} />
          </button>
        </div>
      </header>

      <div className="flex items-center justify-between gap-2 border-b border-[rgba(23,58,99,0.12)] bg-white/36 px-3.5 py-2.5">
        <div className="flex gap-2">
          <MediaButton active={Boolean(micStream)} label="Mic" onClick={toggleMic}>
            <Mic size={15} />
          </MediaButton>
          <MediaButton active={Boolean(cameraStream)} label="Camera" onClick={toggleCamera}>
            <Camera size={15} />
          </MediaButton>
        </div>
        <div className="hidden gap-1.5 sm:flex">
          <ActionPill>
            <Undo2 size={13} />
            Counter
          </ActionPill>
          <ActionPill primary>
            <CheckCircle2 size={13} />
            Approve
          </ActionPill>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3.5">
        {messages.map((message, index) => (
          <MessageBubble key={`${message.sender}-${index}`} message={message} />
        ))}
      </div>

      <div className="border-t border-[rgba(23,58,99,0.12)] bg-white/62 p-3">
        {cameraStream ? (
          <div className="mb-2 overflow-hidden rounded-[18px] border border-[rgba(23,58,99,0.16)] bg-[var(--navy)]">
            <div className="flex items-center justify-between px-3 py-2 text-xs font-black text-white">
              <span>Camera connected</span>
              <button onClick={toggleCamera} className="grid size-7 place-items-center rounded-full bg-white/16" aria-label="Disconnect camera">
                <X size={14} />
              </button>
            </div>
            <video ref={videoRef} autoPlay muted playsInline className="max-h-40 w-full object-cover" />
          </div>
        ) : null}

        <div className="flex items-end gap-1.5 rounded-[22px] border border-[rgba(23,58,99,0.16)] bg-white p-1.5">
          <button aria-label="Attach condition file" className="grid size-10 shrink-0 place-items-center rounded-full text-[var(--muted)] transition hover:bg-[var(--sky-soft)] hover:text-[var(--navy)]">
            <Paperclip size={17} />
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
            className="max-h-24 min-h-10 flex-1 resize-none bg-transparent px-1 py-2.5 text-sm font-bold leading-5 text-[var(--navy)] outline-none placeholder:text-[var(--muted)]"
          />
          <button aria-label="Send message" onClick={sendMessage} className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-[var(--navy)] bg-[var(--sun)] text-[var(--navy)] shadow-sm">
            <Send size={17} />
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px] font-bold leading-4 text-[var(--muted)]">
          <ShieldCheck size={13} />
          <span>{mediaStatus}</span>
        </div>
      </div>
    </section>
  );
}

function MessageBubble({ message }: { message: TradeMessage }) {
  const mine = message.sender === "You";
  const system = message.sender === "System";

  return (
    <div
      className={cx(
        "max-w-[88%] rounded-[19px] border px-3 py-2.5 shadow-[0_14px_32px_-28px_rgba(23,58,99,0.65)]",
        mine && "ml-auto border-[var(--navy)] bg-[var(--sun)] text-[var(--navy)]",
        system && "mx-auto max-w-[84%] border-[rgba(25,195,154,0.24)] bg-[#d7f7ee] text-[var(--mint)]",
        !mine && !system && "border-[rgba(23,58,99,0.14)] bg-white text-[var(--navy)]"
      )}
    >
      <div className="text-[10px] font-black opacity-70">{message.sender}</div>
      <div className="mt-0.5 text-sm font-bold leading-5">{message.body}</div>
    </div>
  );
}

function MediaButton({ active, children, label, onClick }: { active: boolean; children: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-2.5 text-xs font-black transition",
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

function ActionPill({ children, primary = false }: { children: ReactNode; primary?: boolean }) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex min-h-8 items-center gap-1 rounded-full border px-2.5 text-[11px] font-black",
        primary ? "border-[var(--navy)] bg-[var(--sun)] text-[var(--navy)]" : "border-[rgba(23,58,99,0.18)] bg-white/72 text-[var(--navy)]"
      )}
    >
      {children}
    </button>
  );
}
