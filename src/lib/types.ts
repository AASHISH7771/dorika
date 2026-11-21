// ─────────────────────────────────────────────────────────────
//  Dorika — shared TypeScript types
// ─────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending" | "confirmed" | "in_progress" | "shipped" | "delivered" | "cancelled";

export type CustomStatus = OrderStatus;

export type PaymentMethod = "cod" | "esewa" | "khalti" | "bank_transfer";
export type PaymentStatus = "unpaid" | "pending" | "paid" | "refunded" | "failed";
export type UserRole = "customer" | "admin";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at: number | null;
  category_id: string | null;
  images: string[];
  size: string | null;
  stock: number;
  is_featured: boolean;
  is_active: boolean;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
  category?: Category | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface OrderEvent {
  status: OrderStatus;
  note: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  order_no: string;
  user_id: string | null;
  customer_name: string;
  phone: string;
  email: string | null;
  district: string | null;
  city: string | null;
  address: string | null;
  landmark: string | null;
  notes: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  /** Transaction id the customer typed after paying manually. */
  payment_reference: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  order_events?: OrderEvent[];
}

export interface CustomRequest {
  id: string;
  request_no: string;
  user_id: string | null;
  photo_path: string | null;
  full_name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  district: string | null;
  municipality: string | null;
  ward_tole: string | null;
  full_address: string | null;
  landmark: string | null;
  alt_phone: string | null;
  preferred_date: string | null;
  gift_or_self: string | null;
  background_pref: string | null;
  special_instructions: string | null;
  plank_size: string;
  price: number;
  status: CustomStatus;
  payment_status: PaymentStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Settings {
  id: number;
  store_name: string;
  store_email: string;
  store_phone: string;
  whatsapp: string;
  address: string;
  currency: string;
  delivery_fee: number;
  free_delivery_over: number;
  custom_art_price: number;
  custom_art_days: string;
  hero_headline: string;
  hero_tagline: string;
  cod_enabled: boolean;
  esewa_enabled: boolean;
  khalti_enabled: boolean;
  bank_enabled: boolean;
  // Manual payment destinations (see supabase/04_payments.sql)
  esewa_id: string | null;
  khalti_id: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_qr_url: string | null;
  payment_note: string | null;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string | null;
  full_name: string | null;
  phone: string | null;
  district: string | null;
  city: string | null;
  address: string | null;
  landmark: string | null;
  is_default: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// Cart line stored in localStorage (guest-friendly)
export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  size: string | null;
  quantity: number;
  stock: number;
}

// Tracking result from the public RPC
export interface TrackResult {
  type: "order" | "custom";
  order_no: string;
  customer_name: string;
  status: OrderStatus;
  payment_method?: PaymentMethod;
  payment_status: PaymentStatus;
  total?: number;
  price?: number;
  created_at: string;
  events: OrderEvent[];
}
