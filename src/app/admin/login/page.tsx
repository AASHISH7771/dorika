import Link from "next/link";
import { Logo } from "@/components/logo";
import { Field, Input } from "@/components/ui/input";
import { signIn } from "./actions";

export const metadata = { title: "Admin Login" };

const ERRORS: Record<string, string> = {
  invalid:
    "Incorrect email or password — or no account exists with that email yet. Create it in Supabase → Authentication → Users first.",
  unconfirmed:
    "That account exists but its email isn't confirmed. Re-create it with “Auto Confirm User” ticked, or confirm it from the inbox.",
  not_admin:
    "This account signed in but is not an admin yet. Run: update public.profiles set role = 'admin' where email = '…';",
  missing: "Please enter your email and password.",
  not_configured: "Supabase keys are missing from .env.local, so sign-in is disabled.",
};

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string; redirect?: string };
}) {
  const error = searchParams.error ? ERRORS[searchParams.error] ?? "Login failed." : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-200 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo className="h-10" />
        </div>

        <div className="card p-8">
          <h1 className="text-2xl font-extrabold">Admin sign in</h1>
          <p className="mt-1 text-sm text-charcoal-400">
            Manage orders, custom art requests and your store.
          </p>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <form action={signIn} className="mt-6 space-y-4">
            <input type="hidden" name="redirect" value={searchParams.redirect ?? "/admin"} />
            <Field label="Email" htmlFor="email" required>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </Field>
            <Field label="Password" htmlFor="password" required>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
            </Field>
            <button type="submit" className="btn-primary btn-lg w-full">
              Sign in
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-charcoal-400">
          <Link href="/" className="font-semibold text-terracotta-600 hover:underline">
            ← Back to store
          </Link>
        </p>
      </div>
    </div>
  );
}
