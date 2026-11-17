import { NextResponse, type NextRequest } from "next/server";
import { getProductsByIds } from "@/lib/queries";

export const runtime = "nodejs";

// Public endpoint: given a list of product ids (from the guest's localStorage
// wishlist), return the active products. No auth required — guest-friendly.
export async function POST(req: NextRequest) {
  let ids: string[] = [];
  try {
    const body = await req.json();
    if (Array.isArray(body?.ids)) {
      ids = body.ids.filter((x: unknown) => typeof x === "string").slice(0, 100);
    }
  } catch {
    return NextResponse.json({ products: [] });
  }
  const products = await getProductsByIds(ids);
  return NextResponse.json({ products });
}
