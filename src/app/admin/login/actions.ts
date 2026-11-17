"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Sign an admin in. Verifies the profile role is 'admin' before allowing access.
export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/admin");

  if (!email || !password) {
    redirect("/admin/login?error=missing");
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    const raw = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
    const reason =
      raw.includes("email_not_confirmed") || raw.includes("email not confirmed")
        ? "unconfirmed"
        : "invalid";
    redirect(`/admin/login?error=${reason}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user!.id)
    .single();

  if (profile?.role !== "admin") {
    await supabase.auth.signOut();
    redirect("/admin/login?error=not_admin");
  }

  redirect(redirectTo.startsWith("/admin") ? redirectTo : "/admin");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
