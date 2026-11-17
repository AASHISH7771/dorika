import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { siteConfig } from "./config";
import type { OrderStatus } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Currency ─────────────────────────────────────────────────
export function formatNPR(amount: number): string {
  const n = Number(amount || 0);
  // Nepali grouping (lakh/crore) with Rs. prefix
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(n);
  return `${siteConfig.currency.symbol} ${formatted}`;
}

// ── Order / request number generation ────────────────────────
// Human-friendly, collision-resistant, no ambiguous chars.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randomCode(len: number): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}
export function generateOrderNo(): string {
  return `DRK-${randomCode(6)}`;
}
export function generateRequestNo(): string {
  return `DRK-C-${randomCode(5)}`;
}

// ── Slug ─────────────────────────────────────────────────────
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ── Phone normalisation (for matching guest orders) ──────────
export function normalizePhone(phone: string): string {
  return (phone || "").replace(/\D/g, "");
}

// ── Dates ────────────────────────────────────────────────────
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Status display helpers ───────────────────────────────────
export const STATUS_FLOW: OrderStatus[] = [
  "pending", "confirmed", "in_progress", "shipped", "delivered",
];

export const statusLabel: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const statusColor: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  in_progress: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

// ── Simple validators ────────────────────────────────────────
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
export function isValidNepaliPhone(phone: string): boolean {
  const p = normalizePhone(phone);
  // 10-digit mobile (97/98...) or with 977 country code
  return /^(977)?9\d{9}$/.test(p) || /^9\d{9}$/.test(p);
}
