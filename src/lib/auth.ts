import "server-only";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/lib/types";

// Returns the current user's profile, or null if not logged in
// (or if Supabase is not configured yet).
export async function getCurrentProfile(): Promise<Profile | null> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    return (data as Profile) ?? null;
  } catch {
    return null;
  }
}

// Guards an admin route in a Server Component / layout.
export async function requireAdmin(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/admin/login");
  if (profile.role !== "admin") redirect("/admin/login?error=not_admin");
  return profile;
}

// Note: there is deliberately no customer guard here. The storefront has no
// accounts — customers browse, check out and track orders as guests. The only
// sign-in that exists is requireAdmin() above, for the shop owner.
