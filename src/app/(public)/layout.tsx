import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { StoreProvider } from "@/components/store-context";
import { JsonLd } from "@/components/json-ld";
import { organizationSchema, websiteSchema } from "@/lib/seo";
import { getStoreInfo } from "@/lib/store-info";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Phone, email, address and shop name come from the admin Settings row, not
  // from build-time config, so an edit in the panel shows up here. The read is
  // cached under the "settings" tag, which the save action purges, so this does
  // not turn every page into a per-request render.
  const store = await getStoreInfo();

  return (
    <>
      {/* Brand + site entities, read by Google on every page. Kept out of the
          admin console, which has no use for them. */}
      <JsonLd data={organizationSchema(store)} />
      <JsonLd data={websiteSchema()} />

      <StoreProvider value={store}>
        <Navbar />
        <main className="min-h-[60vh]">{children}</main>
        <Footer />
        <WhatsAppButton />
      </StoreProvider>
    </>
  );
}
