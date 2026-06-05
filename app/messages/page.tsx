import { redirect } from "next/navigation";

export default function MessagesPage() {
  redirect("/marketplace?tab=build&chat=open");
}
