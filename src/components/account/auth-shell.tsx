import Link from "next/link";
import { Database } from "lucide-react";

// Shared card shell for /account/auth/* pages.
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  below,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  below?: React.ReactNode;
}) {
  return (
    <div className="bg-cream-200">
      <div className="container-page flex min-h-[72vh] items-center justify-center py-14">
        <div className="w-full max-w-md">
          <div className="card p-7 sm:p-8">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-charcoal-400">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>
          {below && <div className="mt-5">{below}</div>}
          <p className="mt-6 text-center text-xs text-charcoal-400">
            An account is always optional.{" "}
            <Link href="/shop" className="font-semibold text-terracotta-600 hover:underline">
              keep shopping as a guest
            </Link>{" "}
            or{" "}
            <Link href="/track" className="font-semibold text-terracotta-600 hover:underline">
              track an order
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      {message}
    </div>
  );
}

export function FormSuccess({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
      {message}
    </div>
  );
}

// Shown when NEXT_PUBLIC_SUPABASE_* is missing, so nobody hits a crash.
export function SupabaseSetupNotice() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="flex items-center gap-2 font-bold">
        <Database className="h-4 w-4" /> Accounts are not switched on yet
      </p>
      <p className="mt-2 leading-relaxed">
        Add <code className="rounded bg-white/70 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="rounded bg-white/70 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
        <code className="rounded bg-white/70 px-1">.env.local</code>, run the SQL in{" "}
        <code className="rounded bg-white/70 px-1">supabase/</code>, then restart the server.
        Shopping, checkout and order tracking keep working without it.
      </p>
    </div>
  );
}
