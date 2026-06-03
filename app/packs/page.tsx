import { redirect } from "next/navigation";

// Canonical pack-opening experience lives at /gacha (full odds, one-by-one
// reveal, per-card disposition, points). Keep /packs as a friendly alias.
export default function PacksPage() {
  redirect("/gacha");
}
