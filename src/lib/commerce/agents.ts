import { getProducts } from "./store";
import { createRazorpayOrder } from "./razorpay";
import { verifyRazorpayPayment } from "./razorpay-server";
import type { GrowthPlan, Intent, Product } from "./types";
import type { MerchantPolicy } from "./types";

const CATEGORY_HINTS: Record<string, string[]> = {
  Audio: ["earbud", "earbuds", "headphone", "audio", "music", "speaker", "buds"],
  Accessories: ["cable", "charger", "power bank", "powerbank", "hub", "accessory"],
  Wearables: ["watch", "smartwatch", "band", "wearable"],
  Bags: ["backpack", "bag", "rucksack"],
  Lifestyle: ["bottle", "flask"],
};

const USE_CASES = ["gym", "college", "travel", "office", "work", "running", "party"];
const FEATURES = ["wireless", "waterproof", "sweatproof", "bluetooth", "fast charge", "noise"];

/** Agent 1 — Intent Agent: natural language -> structured intent. */
export function extractIntent(query: string): Intent {
  const q = query.toLowerCase();

  let maxPrice: number | null = null;
  const k = q.match(/(?:under|below|within|upto|up to|less than|budget)?\s*₹?\s*(\d+(?:[.,]\d+)?)\s*(k|thousand)?/g);
  if (k) {
    const nums: number[] = [];
    for (const seg of k) {
      const m = seg.match(/(\d+(?:[.,]\d+)?)\s*(k|thousand)?/);
      if (!m || !m[1]) continue;
      let v = parseFloat(m[1].replace(/,/g, ""));
      if (m[2]) v *= 1000;
      if (v >= 100) nums.push(v);
    }
    if (nums.length) maxPrice = Math.max(...nums);
  }

  let category: string | null = null;
  for (const [cat, words] of Object.entries(CATEGORY_HINTS)) {
    if (words.some((w) => q.includes(w))) {
      category = cat;
      break;
    }
  }

  const useCase = USE_CASES.find((u) => q.includes(u)) ?? null;
  const features = FEATURES.filter((f) => q.includes(f));

  return { category, maxPrice, useCase, features, rawQuery: query };
}

/** Agent 2 — Catalog Agent: semantic-ish scoring over the merchant catalog. */
export function searchCatalog(intent: Intent, limit = 3): Product[] {
  const q = intent.rawQuery.toLowerCase();
  const terms = q.split(/[^a-z0-9]+/).filter((t) => t.length > 2);

  const scored = getProducts().map((p) => {
    let score = 0;
    if (intent.category && p.category === intent.category) score += 5;
    if (intent.useCase && p.tags.includes(intent.useCase)) score += 3;
    for (const f of intent.features) if (p.tags.includes(f)) score += 2;
    for (const t of terms) {
      if (p.name.toLowerCase().includes(t)) score += 2;
      if (p.tags.some((tag) => tag.includes(t))) score += 1.5;
      if (p.blurb.toLowerCase().includes(t)) score += 0.5;
    }
    if (intent.maxPrice && p.price > intent.maxPrice) score -= 4;
    if (p.stock === 0) score -= 1.5;
    return { p, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.p);
}

/** Agent 3 — Growth Agent: maximise order value inside merchant bounds. */
export function planGrowth(
  anchor: Product | null,
  intent: Intent,
  policy: MerchantPolicy,
): GrowthPlan {
  if (!anchor) {
    return {
      action: "NO_ACTION",
      anchor: null,
      attachments: [],
      discountPct: 0,
      rationale: "No catalog match — nothing to grow.",
      baseValue: 0,
      projectedValue: 0,
      incrementalRevenue: 0,
    };
  }

  const budget = intent.maxPrice ?? anchor.price * 1.6;
  const headroom = Math.max(0, budget - anchor.price);

  const candidates = getProducts().filter(
    (p) =>
      p.id !== anchor.id &&
      p.stock > 0 &&
      p.price <= headroom &&
      (p.category === "Accessories" || p.tags.some((t) => anchor.tags.includes(t))),
  ).sort((a, b) => b.price - a.price);

  const attachments = candidates.slice(0, headroom > 1500 ? 2 : 1);
  const base = anchor.price;
  const projected = base + attachments.reduce((s, p) => s + p.price, 0);

  // The agent may propose a discount to close a bundle, but never beyond the
  // policy ceiling it knows about — and the policy engine re-verifies anyway.
  const discountPct = attachments.length >= 2 ? Math.min(5, policy.maxDiscountPct) : 0;

  let action: GrowthPlan["action"] = "NO_ACTION";
  if (attachments.length >= 2) action = "BUNDLE";
  else if (attachments.length === 1) action = "CROSS_SELL";
  else if (headroom > anchor.price * 0.4) action = "UPSELL";

  const rationale =
    action === "NO_ACTION"
      ? "Budget headroom too small for a compliant attach offer."
      : `${action.replace("_", "-")} within ₹${Math.round(budget).toLocaleString("en-IN")} budget: attach ${
          attachments.map((a) => a.name).join(" + ") || "higher tier"
        }.`;

  return {
    action,
    anchor,
    attachments,
    discountPct,
    rationale,
    baseValue: base,
    projectedValue: Math.round(projected * (1 - discountPct / 100)),
    incrementalRevenue: Math.round(projected * (1 - discountPct / 100)) - base,
  };
}

/** Agent 4 — Payment Agent: simulated Razorpay Test Mode order lifecycle. */
export type RazorpayOrder = { id: string; amount: number; currency: "INR"; status: string };

export async function createRazorpayTestOrder(amountInr: number): Promise<RazorpayOrder> {
  return createRazorpayOrder({ data: { amountInr } });
}

export async function verifyRazorpayTestPayment(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): Promise<boolean> {
  const result = await verifyRazorpayPayment({ data: input });
  return result.verified;
}

export async function simulatePayment(
  order: RazorpayOrder,
  outcome: "success" | "failure",
): Promise<{ ok: boolean; paymentId: string; error?: string }> {
  await new Promise((r) => setTimeout(r, 700));
  const paymentId = "pay_TEST" + Math.random().toString(36).slice(2, 12).toUpperCase();
  if (outcome === "failure") {
    return { ok: false, paymentId, error: "BAD_REQUEST_ERROR: payment failed (issuer declined)" };
  }
  return { ok: true, paymentId };
}
