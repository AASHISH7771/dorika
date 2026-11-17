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

// Guards a customer account route.
export async function requireUser(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/account/auth/login");
  return profile;
}

// Guards a customer account route using only the auth session.
// Used by the /account dashboard: it survives a missing profile row
// (and a not-yet-configured Supabase project) without looping.
export async function requireCustomerSession(): Promise<{
  userId: string;
  email: string | null;
}> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) return { userId: user.id, email: user.email ?? null };
  } catch {
    // Supabase not configured yet — fall through to the login page,
    // which explains how to switch accounts on.
  }
  redirect("/account/auth/login");
}
