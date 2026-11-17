import { getSettings } from "@/lib/queries";
import { PageHeader } from "@/components/admin/ui";
import { Field, Input, Textarea } from "@/components/ui/input";
import { siteConfig } from "@/lib/config";
import { saveSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: { saved?: string } }) {
  const s = await getSettings();

  const v = {
    store_name: s?.store_name ?? siteConfig.name,
    store_email: s?.store_email ?? siteConfig.contact.email,
    store_phone: s?.store_phone ?? siteConfig.contact.phone,
    whatsapp: s?.whatsapp ?? siteConfig.contact.whatsapp,
    address: s?.address ?? siteConfig.contact.address,
    currency: s?.currency ?? "NPR",
    delivery_fee: s?.delivery_fee ?? 150,
    free_delivery_over: s?.free_delivery_over ?? 5000,
    custom_art_price: s?.custom_art_price ?? siteConfig.customArt.price,
    custom_art_days: s?.custom_art_days ?? siteConfig.customArt.makingTime,
    hero_headline: s?.hero_headline ?? "",
    hero_tagline: s?.hero_tagline ?? "",
    cod_enabled: s?.cod_enabled ?? true,
    esewa_enabled: s?.esewa_enabled ?? false,
    khalti_enabled: s?.khalti_enabled ?? false,
    bank_enabled: s?.bank_enabled ?? true,
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Store info, delivery, custom art and payment methods." />

      {!s && (
        <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Showing defaults — connect Supabase and run the SQL scripts to persist changes.
        </p>
      )}
      {searchParams.saved && (
        <p className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Settings saved.
        </p>
      )}

      <form action={saveSettings} className="space-y-6">
        <fieldset className="card p-5">
          <legend className="px-2 font-extrabold">Store info</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Store name" htmlFor="store_name">
              <Input id="store_name" name="store_name" defaultValue={v.store_name} />
            </Field>
            <Field label="Currency" htmlFor="currency">
              <Input id="currency" name="currency" defaultValue={v.currency} />
            </Field>
            <Field label="Email" htmlFor="store_email">
              <Input id="store_email" name="store_email" type="email" defaultValue={v.store_email} />
            </Field>
            <Field label="Phone" htmlFor="store_phone">
              <Input id="store_phone" name="store_phone" defaultValue={v.store_phone} />
            </Field>
            <Field label="WhatsApp number" htmlFor="whatsapp" hint="With country code, e.g. 9779708285877">
              <Input id="whatsapp" name="whatsapp" defaultValue={v.whatsapp} />
            </Field>
            <Field label="Address" htmlFor="address">
              <Input id="address" name="address" defaultValue={v.address} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="card p-5">
          <legend className="px-2 font-extrabold">Delivery</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Delivery fee (Rs.)" htmlFor="delivery_fee">
              <Input id="delivery_fee" name="delivery_fee" type="number" min={0} defaultValue={v.delivery_fee} />
            </Field>
            <Field label="Free delivery over (Rs.)" htmlFor="free_delivery_over" hint="0 to disable">
              <Input id="free_delivery_over" name="free_delivery_over" type="number" min={0} defaultValue={v.free_delivery_over} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="card p-5">
          <legend className="px-2 font-extrabold">Custom art</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Default price (Rs.)" htmlFor="custom_art_price">
              <Input id="custom_art_price" name="custom_art_price" type="number" min={0} defaultValue={v.custom_art_price} />
            </Field>
            <Field label="Making time" htmlFor="custom_art_days">
              <Input id="custom_art_days" name="custom_art_days" defaultValue={v.custom_art_days} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="card p-5">
          <legend className="px-2 font-extrabold">Homepage hero</legend>
          <div className="space-y-4">
            <Field label="Headline" htmlFor="hero_headline">
              <Input id="hero_headline" name="hero_headline" defaultValue={v.hero_headline} />
            </Field>
            <Field label="Tagline" htmlFor="hero_tagline">
              <Textarea id="hero_tagline" name="hero_tagline" defaultValue={v.hero_tagline} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="card p-5">
          <legend className="px-2 font-extrabold">Payment methods</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <PaymentToggle name="cod_enabled" label="Cash on Delivery" defaultChecked={v.cod_enabled} />
            <PaymentToggle name="bank_enabled" label="Bank Transfer" defaultChecked={v.bank_enabled} />
            <PaymentToggle name="esewa_enabled" label="eSewa" defaultChecked={v.esewa_enabled} />
            <PaymentToggle name="khalti_enabled" label="Khalti" defaultChecked={v.khalti_enabled} />
          </div>
          <p className="mt-3 text-xs text-charcoal-400">
            eSewa and Khalti appear at checkout when enabled, but online payment capture is not wired yet
            (structure is ready for your keys).
          </p>
        </fieldset>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary btn-lg">
            Save settings
          </button>
        </div>
      </form>
    </>
  );
}

function PaymentToggle({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-cream-200 px-4 py-3 text-sm">
      <span className="font-medium text-charcoal-700">{label}</span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="relative h-6 w-11 rounded-full bg-charcoal-200 transition peer-checked:bg-terracotta-500 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
    </label>
  );
}
