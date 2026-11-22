import type { Metadata } from "next";
import { requireCustomerSession } from "@/lib/auth";
import { getAccountProfile } from "@/lib/account-queries";
import { AccountNav } from "@/components/account/account-nav";
import { signOutCustomer } from "../actions";

export const dynamic = "force-dynamic";

/**
 * Every dashboard page is per-customer. robots.txt already blocks /account,
 * but that only stops crawling — a disallowed URL that is linked from
 * somewhere can still be indexed without its content being read. noindex is
 * the actual guarantee, so it is declared once here for the whole section.
 */
export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false, follow: false },
};

export default async function AccountDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireCustomerSession();
  const profile = await getAccountProfile(session.userId, session.email);

  return (
    <div className="min-h-[70vh] bg-cream-200">
      <div className="container-page py-8 lg:py-10">
        <div className="grid gap-6 lg:grid-cols-[264px_1fr] lg:gap-8">
          <aside>
            <AccountNav
              name={profile.full_name}
              email={profile.email ?? session.email ?? ""}
              signOut={signOutCustomer}
            />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
