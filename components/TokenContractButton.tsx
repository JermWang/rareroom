"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function TokenContractButton({ address, className }: { address?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const hasAddress = Boolean(address?.trim());

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function copyAddress() {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
    } catch {
      const input = document.createElement("textarea");
      input.value = address;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }

    setCopied(true);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      className={className}
      onClick={copyAddress}
      disabled={!hasAddress}
      aria-label={hasAddress ? "Copy SPL token contract address" : "SPL token contract address coming soon"}
      title={hasAddress ? "Copy SPL token contract address" : "Add NEXT_PUBLIC_SPL_TOKEN_CONTRACT_ADDRESS to enable"}
    >
      {copied ? <Check size={18} /> : <Copy size={18} />}
      {copied ? "Copied" : hasAddress ? "Copy token address" : "Token address soon"}
    </button>
  );
}
