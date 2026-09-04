import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, Loader2, ShieldAlert, ShieldCheck, ShieldQuestion, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { rupees } from "@/lib/commerce/catalog";
import {
  createRazorpayTestOrder,
  extractIntent,
  planGrowth,
  searchCatalog,
  verifyRazorpayTestPayment,
} from "@/lib/commerce/agents";
import { openRazorpayCheckout } from "@/lib/commerce/razorpay";
import { authorize } from "@/lib/commerce/policy";
import { store, useCommerceStore } from "@/lib/commerce/store";
import type { GrowthPlan, Intent, PolicyDecision, Product } from "@/lib/commerce/types";
import { cn } from "@/lib/utils";

type Offer = {
  id: string;
  items: { product: Product; qty: number }[];
  discountPct: number;
  amount: number;
  plan: GrowthPlan;
  state: "open" | "working" | "settled";
};

type Message = {
  id: string;
  role: "user" | "agent";
  text: string;
  intent?: Intent;
  results?: Product[];
  offer?: Offer;
  decision?: PolicyDecision;
  receipt?: PaymentReceipt;
  tone?: "default" | "blocked" | "gated" | "paid" | "failed";
};

type PaymentReceipt = {
  orderId: string;
  paymentId: string;
  items: Offer["items"];
  subtotal: number;
  discountPct: number;
  total: number;
  paidAt: number;
};

const SUGGESTIONS = [
  "I need wireless earbuds under ₹2,500 for gym",
  "Waterproof laptop backpack under 3k",
  "Something good for college under ₹6,000",
  "A water bottle for the gym",
];

const uid = () => crypto.randomUUID();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function ChatAssistant() {
  const policy = useCommerceStore((s) => s.policy);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uid(),
      role: "agent",
      text: "I'm this store's growth agent. Tell me what you need — with a budget if you have one — and I'll find it, suggest what pairs well, and take you through a gated Razorpay test checkout.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [failMode, setFailMode] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const push = (m: Message) => setMessages((prev) => [...prev, m]);
  const patch = (id: string, fn: (m: Message) => Message) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? fn(m) : m)));

  async function run(query: string) {
    if (!query.trim() || busy) return;
    setBusy(true);
    setInput("");
    push({ id: uid(), role: "user", text: query });

    // Agent 1 — Intent
    store.log({ actor: "intent", label: "Customer request received", detail: query });
    await sleep(400);
    const intent = extractIntent(query);
    store.log({
      actor: "intent",
      label: "Structured intent extracted",
      detail: `category=${intent.category ?? "any"} budget=${intent.maxPrice ? rupees(intent.maxPrice) : "none"} use=${intent.useCase ?? "n/a"}`,
    });

    // Agent 2 — Catalog
    await sleep(400);
    const results = searchCatalog(intent);
    store.log({
      actor: "catalog",
      label: `${results.length} catalog matches retrieved`,
      detail: results.map((r) => r.name).join(", ") || "no match",
      status: results.length ? "ok" : "warn",
    });

    if (results.length === 0) {
      push({
        id: uid(),
        role: "agent",
        text: "Nothing in this merchant's catalog matches that. I won't invent a product — try earbuds, a smart watch, a backpack, a power bank or a USB hub.",
        intent,
      });
      setBusy(false);
      return;
    }

    const inStock = results.filter((p) => p.stock > 0);
    const anchor = inStock[0] ?? null;

    if (!anchor) {
      store.bump("blocked");
      store.log({
        actor: "policy",
        label: "Action blocked before any money action",
        detail: `${results[0]?.name} is out of stock`,
        status: "error",
      });
      push({
        id: uid(),
        role: "agent",
        tone: "blocked",
        text: `${results[0]?.name} matches your request but it's out of stock, so checkout is blocked by merchant policy. I can notify you when it's restocked instead of taking your money.`,
        intent,
        results,
      });
      setBusy(false);
      return;
    }

    // Agent 3 — Growth
    await sleep(450);
    const plan = planGrowth(anchor, intent, policy);
    store.log({
      actor: "growth",
      label: `Growth action: ${plan.action}`,
      detail: plan.rationale,
    });

    const items = [
      { product: anchor, qty: 1 },
      ...plan.attachments.map((p) => ({ product: p, qty: 1 })),
    ];
    const gross = items.reduce((s, i) => s + i.product.price * i.qty, 0);
    const amount = Math.round(gross * (1 - plan.discountPct / 100));

    store.log({
      actor: "decision",
      label: "Offer assembled",
      detail: `${items.length} lines · ${rupees(gross)} gross · ${plan.discountPct}% discount · AOV ${rupees(plan.baseValue)} → ${rupees(amount)}`,
    });
    store.bump("recommendations");

    const offer: Offer = {
      id: uid(),
      items,
      discountPct: plan.discountPct,
      amount,
      plan,
      state: "open",
    };

    const attachText = plan.attachments.length
      ? ` You can also add ${plan.attachments.map((a) => `${a.name} (${rupees(a.price)})`).join(" and ")}${plan.discountPct ? `, and I'll apply a ${plan.discountPct}% bundle discount` : ""}. Total ${rupees(amount)}${intent.maxPrice ? `, inside your ${rupees(intent.maxPrice)} budget` : ""}.`
      : "";

    push({
      id: uid(),
      role: "agent",
      text: `${anchor.name} at ${rupees(anchor.price)} fits — ${anchor.blurb}${attachText}`,
      intent,
      results,
      offer,
    });
    setBusy(false);
  }

  async function checkout(messageId: string, offer: Offer) {
    patch(messageId, (m) => ({ ...m, offer: { ...offer, state: "working" } }));
    store.bump("accepted");
    store.log({ actor: "decision", label: "Customer accepted the agent's offer" });

    // Policy Engine — deterministic gate before any money action
    await sleep(400);
    const decision = authorize(
      { items: offer.items, discountPct: offer.discountPct, amount: offer.amount },
      policy,
    );
    store.log({
      actor: "policy",
      label: `Policy verdict: ${decision.verdict}`,
      detail: decision.reason,
      status:
        decision.verdict === "APPROVED"
          ? "ok"
          : decision.verdict === "REQUIRES_APPROVAL"
            ? "warn"
            : "error",
    });

    const orderId = uid();

    if (decision.verdict === "BLOCKED") {
      store.bump("blocked");
      store.addOrder({
        id: orderId,
        razorpayOrderId: null,
        items: offer.items,
        discountPct: offer.discountPct,
        amount: offer.amount,
        status: "blocked",
        verdict: decision.verdict,
        aiAttributed: true,
        incrementalRevenue: 0,
        createdAt: Date.now(),
        failureReason: decision.reason,
      });
      patch(messageId, (m) => ({ ...m, offer: { ...offer, state: "settled" } }));
      push({
        id: uid(),
        role: "agent",
        tone: "blocked",
        text: `I stopped before touching Razorpay. ${decision.reason}. No order was created and nothing was charged.`,
        decision,
      });
      return;
    }

    if (decision.verdict === "REQUIRES_APPROVAL") {
      store.addOrder({
        id: orderId,
        razorpayOrderId: null,
        items: offer.items,
        discountPct: offer.discountPct,
        amount: offer.amount,
        status: "pending_approval",
        verdict: decision.verdict,
        aiAttributed: true,
        incrementalRevenue: offer.plan.incrementalRevenue,
        createdAt: Date.now(),
        failureReason: decision.reason,
      });
      patch(messageId, (m) => ({ ...m, offer: { ...offer, state: "settled" } }));
      push({
        id: uid(),
        role: "agent",
        tone: "gated",
        text: `This one is outside my autonomous limit (${decision.reason}), so it's queued for merchant approval in the growth dashboard. I can't create the payment myself.`,
        decision,
      });
      return;
    }

    // Agent 4 — Payment (Razorpay Test Mode)
    store.log({ actor: "payment", label: "Razorpay Orders API — creating test order" });
    const rzp = await createRazorpayTestOrder(offer.amount);
    store.addOrder({
      id: orderId,
      razorpayOrderId: rzp.id,
      items: offer.items,
      discountPct: offer.discountPct,
      amount: offer.amount,
      status: "created",
      verdict: decision.verdict,
      aiAttributed: true,
      incrementalRevenue: offer.plan.incrementalRevenue,
      createdAt: Date.now(),
    });
    store.log({
      actor: "payment",
      label: "Test order created",
      detail: `${rzp.id} · ${rzp.amount} paise · ${rzp.currency}`,
    });

    const result = failMode
      ? {
          ok: false,
          paymentId: "",
          orderId: rzp.id,
          signature: "",
          error: "Test payment failure was requested.",
        }
      : await openRazorpayCheckout(rzp);

    const verified = result.ok
      ? await verifyRazorpayTestPayment({
          orderId: result.orderId,
          paymentId: result.paymentId,
          signature: result.signature,
        })
      : false;

    if (!result.ok || !verified) {
      const failureReason = !result.ok
        ? result.error ?? "unknown error"
        : "Razorpay payment signature verification failed.";
      store.updateOrder(orderId, { status: "failed", failureReason });
      store.log({
        actor: "webhook",
        label: "payment.failed received",
        detail: failureReason,
        status: "error",
      });
      patch(messageId, (m) => ({ ...m, offer: { ...offer, state: "settled" } }));
      push({
        id: uid(),
        role: "agent",
        tone: "failed",
        text: `The test payment failed (${failureReason}). Your cart is intact and the order is marked failed in the audit trail — nothing was captured. Retry to generate a fresh order, or I can send a Razorpay Payment Link instead.`,
        decision,
      });
      push({
        id: uid(),
        role: "agent",
        text: "Retry when you're ready.",
        offer: { ...offer, id: uid(), state: "open" },
      });
      return;
    }

    store.updateOrder(orderId, { status: "paid" });
    store.log({
      actor: "webhook",
      label: "payment.captured received — server verified",
      detail: `${result.paymentId} · ${rupees(offer.amount)}`,
    });
    patch(messageId, (m) => ({ ...m, offer: { ...offer, state: "settled" } }));
    push({
      id: uid(),
      role: "agent",
      tone: "paid",
      text: `Payment successful in test mode — ${rupees(offer.amount)} against ${rzp.id}. Incremental revenue from my recommendation: ${rupees(offer.plan.incrementalRevenue)}.`,
      decision,
      receipt: {
        orderId: rzp.id,
        paymentId: result.paymentId,
        items: offer.items,
        subtotal: offer.items.reduce((sum, item) => sum + item.product.price * item.qty, 0),
        discountPct: offer.discountPct,
        total: offer.amount,
        paidAt: Date.now(),
      },
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-accent-gradient text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold leading-tight">AI shopping assistant</h2>
            <p className="text-[11px] text-muted-foreground">Razorpay test mode · no real money</p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
          Force payment failure
          <Switch checked={failMode} onCheckedChange={setFailMode} />
        </label>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
        {messages.map((m) => (
          <div key={m.id} className="flex gap-3">
            <span
              className={cn(
                "mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border border-border",
                m.role === "agent" ? "bg-secondary text-primary" : "bg-muted text-muted-foreground",
              )}
            >
              {m.role === "agent" ? <Bot className="size-4" /> : <User className="size-4" />}
            </span>
            <div className="min-w-0 flex-1 space-y-3">
              <p
                className={cn(
                  "text-sm leading-relaxed",
                  m.tone === "blocked" && "text-destructive",
                  m.tone === "gated" && "text-warning",
                  m.tone === "paid" && "text-accent",
                  m.tone === "failed" && "text-destructive",
                )}
              >
                {m.text}
              </p>

              {m.intent ? <IntentChips intent={m.intent} /> : null}

              {m.results?.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {m.results.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              ) : null}

              {m.offer ? (
                <OfferCard
                  offer={m.offer}
                  onCheckout={() => checkout(m.id, m.offer!)}
                />
              ) : null}

              {m.decision ? <DecisionCard decision={m.decision} /> : null}

              {m.receipt ? <PaymentReceiptCard receipt={m.receipt} /> : null}
            </div>
          </div>
        ))}
        {busy ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> agents running…
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border px-4 py-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => run(s)}
              disabled={busy}
              className="rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(input);
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What are you looking for?"
            className="bg-secondary/40"
          />
          <Button type="submit" size="icon" disabled={busy || !input.trim()}>
            <ArrowUp className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function IntentChips({ intent }: { intent: Intent }) {
  const chips = [
    intent.category && `category: ${intent.category}`,
    intent.maxPrice && `budget: ${rupees(intent.maxPrice)}`,
    intent.useCase && `use: ${intent.useCase}`,
    ...intent.features.map((f) => `feature: ${f}`),
  ].filter(Boolean) as string[];
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((c) => (
        <span
          key={c}
          className="rounded border border-border bg-secondary/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
        >
          {c}
        </span>
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold leading-snug">{product.name}</p>
        <span className="font-mono text-xs text-primary">{rupees(product.price)}</span>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{product.blurb}</p>
      <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
        {product.category} ·{" "}
        {product.stock > 0 ? `${product.stock} in stock` : (
          <span className="text-destructive">out of stock</span>
        )}
      </p>
    </div>
  );
}

function OfferCard({ offer, onCheckout }: { offer: Offer; onCheckout: () => void }) {
  const gross = offer.items.reduce((s, i) => s + i.product.price * i.qty, 0);
  return (
    <div className="rounded-xl border border-primary/30 bg-hero-glow p-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-wider text-primary">
          {offer.plan.action}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          AOV {rupees(offer.plan.baseValue)} → {rupees(offer.amount)}
        </span>
      </div>
      <ul className="mt-2 space-y-1">
        {offer.items.map((i) => (
          <li key={i.product.id} className="flex justify-between text-xs">
            <span>{i.product.name}</span>
            <span className="font-mono text-muted-foreground">{rupees(i.product.price)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex justify-between border-t border-border pt-2 text-xs font-semibold">
        <span>Total{offer.discountPct ? ` (−${offer.discountPct}%)` : ""}</span>
        <span className="font-mono">
          {offer.discountPct ? (
            <span className="mr-1.5 font-normal text-muted-foreground line-through">
              {rupees(gross)}
            </span>
          ) : null}
          {rupees(offer.amount)}
        </span>
      </div>
      <Button
        className="mt-3 w-full"
        size="sm"
        disabled={offer.state !== "open"}
        onClick={onCheckout}
      >
        {offer.state === "working" ? (
          <>
            <Loader2 className="size-3.5 animate-spin" /> Gating money action…
          </>
        ) : offer.state === "settled" ? (
          "Settled"
        ) : (
          `Accept & pay ${rupees(offer.amount)}`
        )}
      </Button>
    </div>
  );
}

function PaymentReceiptCard({ receipt }: { receipt: PaymentReceipt }) {
  return (
    <div className="rounded-xl border border-accent/40 bg-accent/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
            Payment receipt
          </p>
          <h3 className="mt-1 text-sm font-semibold">Thanks for your order</h3>
        </div>
        <span className="rounded-full bg-accent/15 px-2 py-1 font-mono text-[10px] text-accent">
          PAID
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {receipt.items.map((item) => (
          <div key={item.product.id} className="flex justify-between gap-4 text-xs">
            <span>
              {item.product.name} × {item.qty}
            </span>
            <span className="font-mono">{rupees(item.product.price * item.qty)}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-1 border-t border-border pt-3 text-xs">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="font-mono">{rupees(receipt.subtotal)}</span>
        </div>
        {receipt.discountPct ? (
          <div className="flex justify-between text-accent">
            <span>Bundle discount</span>
            <span className="font-mono">−{receipt.discountPct}%</span>
          </div>
        ) : null}
        <div className="flex justify-between pt-1 text-sm font-bold">
          <span>Total paid</span>
          <span className="font-mono">{rupees(receipt.total)}</span>
        </div>
      </div>
      <div className="mt-3 grid gap-1 border-t border-dashed border-border pt-3 font-mono text-[10px] text-muted-foreground sm:grid-cols-2">
        <span>Razorpay order: {receipt.orderId}</span>
        <span className="sm:text-right">Payment: {receipt.paymentId}</span>
        <span>{new Date(receipt.paidAt).toLocaleString("en-IN")}</span>
        <span className="sm:text-right">Razorpay test mode</span>
      </div>
    </div>
  );
}

function DecisionCard({ decision }: { decision: PolicyDecision }) {
  const Icon =
    decision.verdict === "APPROVED"
      ? ShieldCheck
      : decision.verdict === "REQUIRES_APPROVAL"
        ? ShieldQuestion
        : ShieldAlert;
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2">
        <Icon
          className={cn(
            "size-4",
            decision.verdict === "APPROVED"
              ? "text-accent"
              : decision.verdict === "REQUIRES_APPROVAL"
                ? "text-warning"
                : "text-destructive",
          )}
        />
        <span className="text-xs font-semibold">Policy engine · {decision.verdict}</span>
      </div>
      <ul className="mt-2 space-y-1">
        {decision.checks.map((c) => (
          <li key={c.rule} className="flex items-start gap-2 text-[11px]">
            <span
              className={cn(
                "mt-1 size-1.5 shrink-0 rounded-full",
                c.passed ? "bg-accent" : c.severity === "block" ? "bg-destructive" : "bg-warning",
              )}
            />
            <span className="text-muted-foreground">
              <span className="text-foreground">{c.rule}</span> — {c.detail}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
