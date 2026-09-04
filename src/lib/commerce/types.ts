export type Product = {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
  tags: string[];
  blurb: string;
};

export type Intent = {
  category: string | null;
  maxPrice: number | null;
  useCase: string | null;
  features: string[];
  rawQuery: string;
};

export type GrowthAction =
  | "UPSELL"
  | "CROSS_SELL"
  | "BUNDLE"
  | "DISCOUNT"
  | "CAMPAIGN"
  | "NO_ACTION";

export type GrowthPlan = {
  action: GrowthAction;
  anchor: Product | null;
  attachments: Product[];
  discountPct: number;
  rationale: string;
  baseValue: number;
  projectedValue: number;
  incrementalRevenue: number;
};

export type PolicyVerdict = "APPROVED" | "REQUIRES_APPROVAL" | "BLOCKED";

export type PolicyCheck = {
  rule: string;
  passed: boolean;
  detail: string;
  severity: "block" | "approval" | "ok";
};

export type PolicyDecision = {
  verdict: PolicyVerdict;
  checks: PolicyCheck[];
  reason: string;
};

export type MerchantPolicy = {
  maxDiscountPct: number;
  maxAutonomousAmount: number;
  minMarginPct: number;
  blockOutOfStock: boolean;
  maxItemsPerOrder: number;
};

export type AuditEvent = {
  id: string;
  ts: number;
  actor: "intent" | "catalog" | "growth" | "decision" | "policy" | "payment" | "webhook" | "merchant";
  label: string;
  detail?: string;
  status?: "ok" | "warn" | "error";
};

export type OrderStatus =
  | "pending_approval"
  | "created"
  | "paid"
  | "failed"
  | "blocked";

export type Order = {
  id: string;
  razorpayOrderId: string | null;
  items: { product: Product; qty: number }[];
  discountPct: number;
  amount: number;
  status: OrderStatus;
  verdict: PolicyVerdict;
  aiAttributed: boolean;
  incrementalRevenue: number;
  createdAt: number;
  failureReason?: string;
};
