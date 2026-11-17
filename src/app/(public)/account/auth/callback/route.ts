import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { syncCustomerAccount } from "@/lib/account-sync";

export const dynamic = "force-dynamic";

// Handles the links Supabase emails out:
//  • confirmation / magic links  → `token_hash` + `type`
//  • PKCE recovery links         → `code`
// Cookies must be written here (a Route Handler may do that; a Server
// Component may not), then we bounce the customer onward.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = url.origin;

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const nextParam = url.searchParams.get("next") ?? "/account";
  const next = nextParam.startsWith("/account") ? nextParam : "/account";

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/account/auth/login?error=not_configured`);
  }

  const supabase = createClient();

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (data.user) await syncCustomerAccount(supabase, data.user);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      if (data.user) await syncCustomerAccount(supabase, data.user);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/account/auth/login?error=link_expired`);
}
