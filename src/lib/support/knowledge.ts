/**
 * Support widget knowledge base.
 *
 * Answer text for anything already published is pulled from `@/lib/faq`, so
 * the widget and the FAQ page cannot drift apart: edit the FAQ and the widget
 * follows. `fromFaq` throws if a question is renamed, turning a silent
 * content bug into a build failure.
 *
 * Entries marked "widget only" cover questions the FAQ page does not answer.
 * Nothing here may promise anything the site does not already say.
 */

import { faqItems } from "@/lib/faq";
import type { SupportEntry } from "./engine";

function fromFaq(
  question: string,
  meta: Omit<SupportEntry, "q" | "a">
): SupportEntry {
  const item = faqItems.find((i) => i.q === question);
  if (!item) {
    throw new Error(
      `[support] FAQ question not found: "${question}". Update knowledge.ts when renaming FAQ copy.`
    );
  }
  return { ...meta, q: item.q, a: item.a };
}

export const SUPPORT_KB: SupportEntry[] = [
  fromFaq("How does String Face Art work?", {
    id: "making-time",
    tags: ["custom", "time"],
    keywords: ["long", "time", "days", "duration", "wait", "ready", "making", "craft", "plank"],
    phrases: ["how long", "how many days", "when will", "turnaround", "lead time"],
    chips: ["custom-price", "track-order"],
  }),
  fromFaq("How much does custom art cost?", {
    id: "custom-price",
    tags: ["custom", "price"],
    keywords: ["price", "cost", "much", "rs", "rupees", "rate", "charge", "kitna", "paisa"],
    phrases: ["how much", "what does it cost", "price of", "cost of"],
    chips: ["photo-best", "making-time"],
  }),
  fromFaq("What photo works best?", {
    id: "photo-best",
    tags: ["custom", "photo"],
    keywords: ["photo", "picture", "image", "best", "upload", "jpg", "png", "resolution", "clear"],
    phrases: ["what photo", "which photo", "photo works", "kind of photo"],
    chips: ["making-time", "photo-private"],
  }),
  fromFaq("Are my uploaded photos private?", {
    id: "photo-private",
    tags: ["custom", "privacy"],
    keywords: ["private", "privacy", "safe", "secure", "delete", "stored", "storage", "share"],
    phrases: ["my photos", "photo private", "keep my photo", "who sees"],
    chips: ["photo-best", "payment"],
  }),
  fromFaq("How do I track my order?", {
    id: "track-order",
    tags: ["orders"],
    keywords: ["track", "tracking", "status", "where", "parcel", "shipped", "kaha"],
    phrases: ["where is my order", "track my order", "order status", "track order"],
    chips: ["delivery-time", "not-arrived"],
  }),
  fromFaq("How do I pay?", {
    id: "payment",
    tags: ["payment"],
    keywords: ["pay", "payment", "esewa", "khalti", "bank", "cod", "cash", "card", "qr", "transfer"],
    phrases: ["how do i pay", "payment method", "bank transfer"],
    chips: ["cod-doubt", "delivery-fee"],
  }),
  fromFaq("Can I return a custom piece?", {
    id: "returns",
    tags: ["returns"],
    keywords: ["return", "refund", "exchange", "damaged", "broken", "wrong", "replace"],
    phrases: ["can i return", "return policy", "refund", "arrived broken"],
    chips: ["delivery-time", "payment"],
  }),
  fromFaq("Do I need an account to order?", {
    id: "account",
    tags: ["orders"],
    keywords: ["account", "login", "signup", "register", "password", "guest"],
    phrases: ["need an account", "create account", "sign up", "log in"],
    chips: ["track-order", "payment"],
  }),
  fromFaq("Do you deliver outside the Kathmandu Valley?", {
    id: "delivery-outside",
    tags: ["delivery"],
    keywords: ["outside", "district", "valley", "kathmandu", "butwal", "chitwan", "pokhara", "remote"],
    phrases: ["outside kathmandu", "outside pokhara", "outside valley", "deliver to"],
    chips: ["delivery-time", "delivery-fee"],
  }),

  // ── widget only ────────────────────────────────────────────
  {
    id: "delivery-time",
    tags: ["delivery", "time"],
    q: "How long does delivery take?",
    keywords: ["delivery", "deliver", "shipping", "courier", "days", "reach", "long", "arrive"],
    phrases: ["delivery time", "how long delivery", "how long to deliver", "days to deliver"],
    a: "We deliver to every district in Nepal. Inside Pokhara it is usually quickest, major cities next, and remote districts take a little longer.\n\nMaking time comes first: ready-made pieces go out in 1 to 3 days after ordering, custom pieces in 7 to 10.",
    chips: ["delivery-fee", "track-order"],
  },
  {
    id: "delivery-fee",
    tags: ["delivery", "price"],
    q: "What does delivery cost?",
    keywords: ["fee", "charge", "shipping", "free", "cost", "delivery"],
    phrases: ["delivery fee", "delivery charge", "shipping cost", "free delivery", "how much delivery"],
    a: "A standard delivery fee is worked out at checkout from your location, and orders above the free-delivery threshold show free delivery in the cart automatically.",
    chips: ["delivery-time", "payment"],
  },
  {
    id: "cod-doubt",
    tags: ["payment"],
    q: "Is Cash on Delivery available?",
    keywords: ["cod", "cash", "hand"],
    phrases: ["cash on delivery", "pay on delivery", "cod available"],
    a: "Yes. Cash on Delivery is available across Nepal: pay the courier when the piece reaches you.",
    chips: ["payment", "track-order"],
  },
  {
    id: "not-arrived",
    tags: ["orders", "delivery"],
    q: "My order hasn't arrived yet",
    keywords: ["late", "delayed", "arrived", "waiting", "stuck", "missing", "still", "received"],
    phrases: ["not arrived", "hasn't arrived", "still waiting", "not received", "not delivered"],
    a: "Courier timings vary by district, so a day or two of drift is normal.\n\nCheck the Track Order page first. If the status has not moved in 3 days, send the Order ID to a human and it will be chased with the courier.",
    chips: ["track-order", "human"],
  },
  {
    id: "gift",
    tags: ["custom"],
    q: "Is it a good gift?",
    keywords: ["gift", "present", "birthday", "anniversary", "wedding", "surprise", "occasion"],
    phrases: ["good gift", "gift for", "anniversary gift", "birthday gift"],
    a: "String Face Art is usually bought as a gift: birthdays, anniversaries, weddings and memorials. It arrives ready to hang, with no framing needed.\n\nIf you need it by a certain date, tell a human and they will confirm whether the timing works.",
    chips: ["making-time", "human"],
  },
  {
    id: "where-made",
    tags: ["about"],
    q: "Where is Dorika based?",
    keywords: ["based", "located", "location", "workshop", "address", "visit", "pokhara"],
    phrases: ["where are you", "where is dorika", "your location", "based in", "your workshop"],
    a: "Dorika is a small family workshop: everything is made by hand and delivered anywhere in Nepal.\n\nIt is not a walk-in shop, so message before planning a visit.",
    chips: ["human", "making-time"],
  },
  {
    id: "bulk",
    tags: ["custom"],
    q: "Do you take bulk or corporate orders?",
    keywords: ["bulk", "wholesale", "corporate", "office", "many", "quantity", "reseller", "event"],
    phrases: ["bulk order", "corporate order", "in bulk", "multiple pieces"],
    a: "Yes, for offices, events and resellers, though each piece is made by hand so timing needs planning. That is best discussed with a human, who can quote for quantity and dates.",
    chips: ["human", "making-time"],
  },
];

export const SUPPORT_GREETING =
  "Hi, this is the Dorika helper. Ask about custom art, pricing, delivery or an order, and I'll answer from our own shop information.";

export const SUPPORT_OPENERS = [
  { label: "How long does it take?", id: "making-time" },
  { label: "How much is custom art?", id: "custom-price" },
  { label: "Track my order", id: "track-order" },
  { label: "Delivery charges", id: "delivery-fee" },
];
