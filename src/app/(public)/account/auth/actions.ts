"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { syncCustomerAccount } from "@/lib/account-sync";
import { isValidNepaliPhone, normalizePhone } from "@/lib/utils";

const LOGIN = "/account/auth/login";
const SIGNUP = "/account/auth/signup";
const RESET = "/account/auth/reset";

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

// Only allow internal /account destinations after auth.
function safeNext(raw: unknown, fallback = "/account"): string {
  const value = typeof raw === "string" ? raw : "";
  return value.startsWith("/account") ? value : fallback;
}

// ── Sign in ──────────────────────────────────────────────────
export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("redirect"));

  if (!isSupabaseConfigured()) redirect(`${LOGIN}?error=not_configured`);
  if (!email || !password) redirect(`${LOGIN}?error=missing`);

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    // Supabase deliberately returns "invalid_credentials" for both a wrong
    // password and an unknown email (no account enumeration). Unconfirmed
    // accounts are the one case it reports separately — surface that so the
    // customer knows to check their inbox instead of guessing passwords.
    const raw = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
    const reason =
      raw.includes("email_not_confirmed") || raw.includes("email not confirmed")
        ? "unconfirmed"
        : raw.includes("invalid") || raw.includes("credentials")
          ? "invalid"
          : "failed";

    redirect(
      `${LOGIN}?error=${reason}&email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(next)}`
    );
  }

  await syncCustomerAccount(supabase, data.user!);

  redirect(next);
}

// ── Sign up ──────────────────────────────────────────────────
export async function signUpAction(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (!isSupabaseConfigured()) redirect(`${SIGNUP}?error=not_configured`);
  if (!fullName || !email || !password) redirect(`${SIGNUP}?error=missing`);
  if (phone && !isValidNepaliPhone(phone)) redirect(`${SIGNUP}?error=phone`);
  if (password.length < 8) redirect(`${SIGNUP}?error=weak`);
  if (password !== confirm) redirect(`${SIGNUP}?error=mismatch`);

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // The DB trigger copies full_name into public.profiles.
      data: { full_name: fullName, phone },
      emailRedirectTo: `${siteUrl()}/account/auth/callback?next=/account`,
    },
  });

  if (error) {
    const code = error.message.toLowerCase().includes("already registered")
      ? "exists"
      : "failed";
    redirect(`${SIGNUP}?error=${code}`);
  }

  // Email confirmation off → we already have a session.
  if (data.session && data.user) {
    await syncCustomerAccount(supabase, data.user);
    redirect("/account?welcome=1");
  }

  // Email confirmation on → tell them to check their inbox.
  redirect(`${LOGIN}?sent=1&email=${encodeURIComponent(email)}`);
}

// ── Password reset request ───────────────────────────────────
export async function requestResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!isSupabaseConfigured()) redirect(`${RESET}?error=not_configured`);
  if (!email) redirect(`${RESET}?error=missing`);

  const supabase = createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl()}/account/auth/callback?next=/account/auth/reset`,
  });

  // Always report success — never leak whether an email exists.
  redirect(`${RESET}?sent=1`);
}

// ── Set a new password (after the recovery link) ─────────────
export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (!isSupabaseConfigured()) redirect(`${RESET}?error=not_configured`);
  if (password.length < 8) redirect(`${RESET}?error=weak`);
  if (password !== confirm) redirect(`${RESET}?error=mismatch`);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`${RESET}?error=expired`);

  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`${RESET}?error=failed`);

  redirect("/account?ok=password");
}
