import { redirect } from "next/navigation";

export default function MessagesPage() {
  redirect("/swap?chat=open");
}
