// ─────────────────────────────────────────────────────────────
//  FAQ content
//
//  Extracted from the client accordion so the same questions can also be
//  emitted as FAQPage structured data on the server (src/lib/seo.ts).
//  One source of truth: edit here, and both the UI and the schema update.
// ─────────────────────────────────────────────────────────────

export interface Faq {
  q: string;
  a: string;
}

export const faqs: Faq[] = [
  {
    q: "Do I need an account to order?",
    a: "No. You can browse, add to cart, checkout, and submit a custom art request entirely as a guest. Accounts are optional and only let you save your details and see order history.",
  },
  {
    q: "How does String Face Art work?",
    a: "You upload a clear face photo, we design a thread pattern from it, hand-craft it onto a 45cm round wooden plank, and deliver it to your door. The whole process takes about 7-10 days.",
  },
  {
    q: "What photo works best?",
    a: "A clear, well-lit, front-facing photo of the face with good contrast gives the best result. You can upload JPG, PNG or WEBP up to 10MB.",
  },
  {
    q: "How much does custom art cost?",
    a: "The signature 45cm String Face Art has a fixed price shown on the Custom Art page. Couple/two-face versions are priced higher. You'll always see the price before you submit.",
  },
  {
    q: "How do I pay?",
    a: "We offer Cash on Delivery, and (where enabled) eSewa, Khalti and bank transfer / QR. You choose at checkout.",
  },
  {
    q: "Do you deliver outside the Kathmandu Valley?",
    a: "Yes. We deliver to every district in Nepal through courier partners. Delivery time and fee depend on your location.",
  },
  {
    q: "How do I track my order?",
    a: "Go to the Track Order page and enter your Order ID (sent on confirmation) and the phone number you used. You'll see a live status timeline.",
  },
  {
    q: "Can I return a custom piece?",
    a: "Custom pieces are personalised and can't be returned unless they arrive damaged or incorrect. If anything's wrong, message us within 48 hours and we'll fix it.",
  },
  {
    q: "Are my uploaded photos private?",
    a: "Yes. Photos are stored privately and only accessible to our team through secure links. We use them solely to create your artwork.",
  },
];
