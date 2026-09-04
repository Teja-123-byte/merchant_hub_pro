import type { MerchantPolicy, PolicyCheck, PolicyDecision, Product } from "./types";

export const DEFAULT_POLICY: MerchantPolicy = {
  maxDiscountPct: 10,
  maxAutonomousAmount: 50000,
  minMarginPct: 5,
  blockOutOfStock: true,
  maxItemsPerOrder: 5,
};

export type AuthorizeInput = {
  items: { product: Product; qty: number }[];
  discountPct: number;
  amount: number;
};

/**
 * Deterministic gate. The LLM/agent layer may only *request* money actions;
 * this function decides whether they execute, need a human, or are blocked.
 */
export function authorize(
  input: AuthorizeInput,
  policy: MerchantPolicy,
): PolicyDecision {
  const checks: PolicyCheck[] = [];

  const oos = input.items.filter((i) => i.product.stock < i.qty);
  checks.push({
    rule: "Inventory availability",
    passed: !(policy.blockOutOfStock && oos.length > 0),
    detail: oos.length
      ? `${oos.map((i) => i.product.name).join(", ")} unavailable`
      : "All line items in stock",
    severity: "block",
  });

  const revenue = input.amount;
  const cost = input.items.reduce((s, i) => s + i.product.cost * i.qty, 0);
  const marginPct = revenue > 0 ? ((revenue - cost) / revenue) * 100 : -100;
  checks.push({
    rule: `Margin floor ≥ ${policy.minMarginPct}%`,
    passed: marginPct >= policy.minMarginPct,
    detail: `Post-discount margin ${marginPct.toFixed(1)}%`,
    severity: "block",
  });

  checks.push({
    rule: `Basket size ≤ ${policy.maxItemsPerOrder} lines`,
    passed: input.items.length <= policy.maxItemsPerOrder,
    detail: `${input.items.length} line items`,
    severity: "block",
  });

  checks.push({
    rule: `Discount ≤ ${policy.maxDiscountPct}%`,
    passed: input.discountPct <= policy.maxDiscountPct,
    detail: `Agent proposed ${input.discountPct}% discount`,
    severity: "approval",
  });

  checks.push({
    rule: `Autonomous cap ≤ ₹${policy.maxAutonomousAmount.toLocaleString("en-IN")}`,
    passed: input.amount <= policy.maxAutonomousAmount,
    detail: `Order value ₹${input.amount.toLocaleString("en-IN")}`,
    severity: "approval",
  });

  const blocked = checks.find((c) => !c.passed && c.severity === "block");
  if (blocked) {
    return { verdict: "BLOCKED", checks, reason: `${blocked.rule}: ${blocked.detail}` };
  }
  const gated = checks.find((c) => !c.passed && c.severity === "approval");
  if (gated) {
    return {
      verdict: "REQUIRES_APPROVAL",
      checks,
      reason: `${gated.rule}: ${gated.detail}`,
    };
  }
  return { verdict: "APPROVED", checks, reason: "Within all merchant bounds" };
}
