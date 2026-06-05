import { redirect } from "next/navigation";

export default async function SwapPage({ searchParams }: { searchParams: Promise<{ card?: string; chat?: string }> }) {
  const params = await searchParams;
  const query = new URLSearchParams({ tab: "build" });

  if (params.card) query.set("card", params.card);
  if (params.chat) query.set("chat", params.chat);

  redirect(`/marketplace?${query.toString()}`);
}
