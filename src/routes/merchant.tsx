import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Plus, Trash2, X } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuditTrail } from "@/components/commerce/AuditTrail";
import { PolicyPanel } from "@/components/commerce/PolicyPanel";
import { RoleGuard } from "@/components/site/RoleGuard";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { rupees } from "@/lib/commerce/catalog";
import { metrics, store, useCommerceStore } from "@/lib/commerce/store";
import type { Order, Product } from "@/lib/commerce/types";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/merchant")({
  head: () => ({
    meta: [
      { title: "Merchant Dashboard — MerchantAI" },
      {
        name: "description",
        content:
          "Add your own products, set agent policy bounds, approve gated actions and track AI-attributed revenue, AOV lift and cross-sell conversion.",
      },
      { property: "og:title", content: "Merchant Dashboard — MerchantAI" },
      {
        property: "og:description",
        content: "Own your catalog and bound the growth agent with enforced policy controls.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RoleGuard role="merchant">
      <MerchantDashboard />
    </RoleGuard>
  ),
});

function MerchantDashboard() {
  const { user } = useAuth();
  const state = useCommerceStore((s) => s);
  const m = metrics(state);
  const pending = state.orders.filter((o) => o.status === "pending_approval");

  const chartData = [
    { name: "Baseline AOV", value: m.aovBefore },
    { name: "Agent AOV", value: m.aovNow },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-navy">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-5 pb-14 pt-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            Merchant workspace
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-primary-foreground sm:text-4xl">
            {user?.business || user?.name || "Your store"}
          </h1>
          <p className="mt-3 max-w-xl text-primary-foreground/75">
            Add the products the agent is allowed to sell, set the money guardrails and review
            everything the agent did on your behalf.
          </p>
        </div>
      </div>

      <main className="mx-auto -mt-8 max-w-7xl space-y-6 px-5 pb-16">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total revenue" value={rupees(m.totalRevenue)} hint="all agent orders" />
          <Stat
            label="AI-attributed revenue"
            value={rupees(m.aiRevenue)}
            hint={`${m.paidCount} paid agent orders`}
            accent
          />
          <Stat
            label="Average order value"
            value={rupees(m.aovNow)}
            hint={`incremental ${rupees(m.incremental)}`}
          />
          <Stat
            label="Cross-sell conversion"
            value={`${m.crossSellRate.toFixed(1)}%`}
            hint={`${m.accepted} accepted / ${m.recommendations} recommended`}
          />
        </section>

        <CatalogManager products={state.products} />

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="panel p-6">
            <h2 className="font-display text-lg font-bold text-primary">AOV impact</h2>
            <div className="mt-4 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="var(--color-muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => rupees(v)}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "var(--color-muted)" : "var(--color-brand)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-3 border-t border-border pt-3 text-center">
              <MiniStat label="Recommendations" value={m.recommendations} />
              <MiniStat label="Accepted" value={m.accepted} />
              <MiniStat label="Blocked actions" value={m.blocked} tone="destructive" />
            </div>
          </div>

          <div className="panel p-6">
            <h2 className="font-display text-lg font-bold text-primary">Agent policy</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              These bounds are re-checked on every money action. Tighten them and the agent gets
              gated or blocked automatically.
            </p>
            <div className="mt-5">
              <PolicyPanel />
            </div>
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="font-display text-lg font-bold text-primary">Approval queue</h2>
          {pending.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Nothing waiting. Orders above your autonomous cap or discount ceiling land here
              instead of executing.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {pending.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning/5 p-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">
                      {rupees(o.amount)} · {o.items.length} lines · {o.discountPct}% discount
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {o.items.map((i) => i.product.name).join(", ")}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-warning">{o.failureReason}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approve(o)}>
                      <Check className="size-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => reject(o)}>
                      <X className="size-3.5" /> Reject
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="panel overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-display text-lg font-bold text-primary">Agent orders</h2>
            </div>
            <div className="max-h-90 overflow-y-auto p-4">
              {state.orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No agent orders yet — they appear as customers check out through the assistant.
                </p>
              ) : (
                <ul className="space-y-2">
                  {state.orders.map((o) => (
                    <li
                      key={o.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {o.razorpayOrderId ?? "no payment order"}
                        </p>
                        <p className="text-xs">{o.items.map((i) => i.product.name).join(", ")}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-xs">{rupees(o.amount)}</p>
                        <StatusPill status={o.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="panel h-105 overflow-hidden">
            <AuditTrail limit={60} />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

const EMPTY = {
  name: "",
  price: "",
  cost: "",
  stock: "",
  category: "",
  tags: "",
  blurb: "",
};

function CatalogManager({ products }: { products: Product[] }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(form.price);
    const cost = Number(form.cost || 0);
    const stock = Number(form.stock || 0);
    if (!form.name.trim()) return setError("Product name is required.");
    if (!Number.isFinite(price) || price <= 0) return setError("Enter a valid price.");
    if (cost > price) return setError("Cost cannot be higher than the price.");

    const product: Product = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      price,
      cost,
      stock,
      category: form.category.trim() || "general",
      tags: form.tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      blurb: form.blurb.trim() || "Added by the merchant.",
    };
    store.addProduct(product);
    store.log({
      actor: "merchant",
      label: "Product added to catalog",
      detail: `${product.name} · ${rupees(product.price)}`,
    });
    setForm(EMPTY);
    setError(null);
  }

  function remove(p: Product) {
    store.removeProduct(p.id);
    store.log({
      actor: "merchant",
      label: "Product removed from catalog",
      detail: p.name,
      status: "warn",
    });
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="panel p-6">
        <h2 className="font-display text-lg font-bold text-primary">Add a product</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your catalog starts empty. Anything you add here is what the agent can sell.
        </p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <Field label="Product name">
            <Input value={form.name} onChange={set("name")} placeholder="Wireless earbuds" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (₹)">
              <Input value={form.price} onChange={set("price")} inputMode="numeric" placeholder="2499" />
            </Field>
            <Field label="Cost (₹)">
              <Input value={form.cost} onChange={set("cost")} inputMode="numeric" placeholder="1400" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Stock">
              <Input value={form.stock} onChange={set("stock")} inputMode="numeric" placeholder="25" />
            </Field>
            <Field label="Category">
              <Input value={form.category} onChange={set("category")} placeholder="audio" />
            </Field>
          </div>
          <Field label="Agent tags (comma separated)">
            <Input value={form.tags} onChange={set("tags")} placeholder="gym, wireless, bluetooth" />
          </Field>
          <Field label="Short description">
            <Input value={form.blurb} onChange={set("blurb")} placeholder="Sweatproof, 30h battery" />
          </Field>

          {error && <p className="text-xs font-medium text-destructive">{error}</p>}

          <Button type="submit" className="w-full">
            <Plus className="size-4" /> Add product
          </Button>
        </form>
      </div>

      <div className="panel overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-bold text-primary">
            Your catalog{" "}
            <span className="text-sm font-medium text-muted-foreground">({products.length})</span>
          </h2>
        </div>
        {products.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            No products yet. Add your first one to switch the assistant on.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 font-medium">Product</th>
                  <th className="px-4 py-2.5 font-medium">Category</th>
                  <th className="px-4 py-2.5 font-medium">Price</th>
                  <th className="px-4 py-2.5 font-medium">Margin</th>
                  <th className="px-4 py-2.5 font-medium">Stock</th>
                  <th className="px-4 py-2.5 font-medium">Tags</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-2.5 font-medium">{p.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{p.category}</td>
                    <td className="px-4 py-2.5 font-mono">{rupees(p.price)}</td>
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">
                      {p.price > 0 ? (((p.price - p.cost) / p.price) * 100).toFixed(0) : 0}%
                    </td>
                    <td
                      className={cn(
                        "px-4 py-2.5 font-mono",
                        p.stock === 0 ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {p.stock}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[10px] text-muted-foreground">
                      {p.tags.slice(0, 4).join(" · ")}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => remove(p)}
                        aria-label={`Remove ${p.name}`}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-foreground">{label}</span>
      {children}
    </label>
  );
}

function approve(o: Order) {
  const razorpayOrderId = "order_TEST" + Math.random().toString(36).slice(2, 12).toUpperCase();
  store.log({
    actor: "merchant",
    label: "Merchant approved gated action",
    detail: `${rupees(o.amount)} · ${o.failureReason ?? ""}`,
    status: "warn",
  });
  store.updateOrder(o.id, { status: "created", razorpayOrderId });
  store.log({
    actor: "payment",
    label: "Test payment order created after approval",
    detail: razorpayOrderId,
  });
  setTimeout(() => {
    store.updateOrder(o.id, { status: "paid" });
    store.log({
      actor: "webhook",
      label: "payment.captured received — server verified",
      detail: `${razorpayOrderId} · ${rupees(o.amount)}`,
    });
  }, 900);
}

function reject(o: Order) {
  store.bump("blocked");
  store.updateOrder(o.id, { status: "blocked", failureReason: "Rejected by merchant" });
  store.log({
    actor: "merchant",
    label: "Merchant rejected gated action",
    detail: rupees(o.amount),
    status: "error",
  });
}

function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div className={cn("panel p-5", accent && "border-brand/40")}>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1.5 font-display text-xl font-extrabold", accent && "text-brand")}>
        {value}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone?: "destructive" }) {
  return (
    <div>
      <p
        className={cn(
          "font-display text-lg font-extrabold",
          tone === "destructive" && "text-destructive",
        )}
      >
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function StatusPill({ status }: { status: Order["status"] }) {
  const map: Record<Order["status"], string> = {
    paid: "bg-accent/40 text-primary",
    created: "bg-brand/15 text-brand",
    pending_approval: "bg-warning/20 text-warning",
    failed: "bg-destructive/15 text-destructive",
    blocked: "bg-destructive/15 text-destructive",
  };
  return (
    <span className={cn("rounded px-1.5 py-0.5 font-mono text-[10px]", map[status])}>
      {status.replace("_", " ")}
    </span>
  );
}
