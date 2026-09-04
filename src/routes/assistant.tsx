import { createFileRoute } from "@tanstack/react-router";
import { Package, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { ChatAssistant } from "@/components/commerce/ChatAssistant";
import { RoleGuard } from "@/components/site/RoleGuard";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { useAuth } from "@/lib/auth";
import { rupees } from "@/lib/commerce/catalog";
import { useCommerceStore } from "@/lib/commerce/store";
import type { Product } from "@/lib/commerce/types";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "Shopping Assistant — MerchantAI" },
      {
        name: "description",
        content:
          "Chat with the store's AI shopping assistant: describe what you need, get matching products, bundles and a policy-gated test checkout.",
      },
      { property: "og:title", content: "Shopping Assistant — MerchantAI" },
      {
        property: "og:description",
        content: "Describe what you need and let the AI assistant find, bundle and check out for you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RoleGuard role="customer">
      <AssistantPage />
    </RoleGuard>
  ),
});

function AssistantPage() {
  const { user } = useAuth();
  const products = useCommerceStore((s) => s.products);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-navy">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-5 pb-14 pt-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            Customer workspace
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-primary-foreground sm:text-4xl">
            Hi {user?.name?.split(" ")[0] ?? "there"}, what are you shopping for?
          </h1>
          <p className="mt-3 max-w-xl text-primary-foreground/75">
            Describe the product and your budget in plain language. The assistant searches the
            merchant's live catalog, suggests what pairs well and runs a safe test checkout.
          </p>
        </div>
      </div>

      <main className="mx-auto -mt-8 max-w-7xl px-5 pb-16">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="panel h-[640px] overflow-hidden">
            <ChatAssistant />
          </div>

          <aside className="space-y-4">
            <CatalogPreview products={products} />
            <Tip
              icon={<Sparkles className="size-4" />}
              title="Say it naturally"
              body="“Wireless earbuds under ₹2,500 for the gym” works better than a keyword."
            />
            <Tip
              icon={<Wallet className="size-4" />}
              title="Budget aware"
              body="Mention a budget and the assistant never proposes a cart above it."
            />
            <Tip
              icon={<ShieldCheck className="size-4" />}
              title="Nothing hidden"
              body="Every discount and charge is checked against the merchant's published policy."
            />
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function CatalogPreview({ products }: { products: Product[] }) {
  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-brand/10 text-brand">
            <Package className="size-4" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-primary">Store catalog</h2>
            <p className="text-[11px] text-muted-foreground">Live from this merchant</p>
          </div>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{products.length} items</span>
      </div>
      {products.length ? (
        <div className="divide-y divide-border">
          {products.map((product) => (
            <div key={product.id} className="px-5 py-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold leading-tight">{product.name}</p>
                <span className="shrink-0 font-mono text-xs text-primary">{rupees(product.price)}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{product.blurb}</p>
              <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
                {product.stock > 0 ? `${product.stock} available` : "Currently out of stock"}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-5 py-6 text-center">
          <p className="text-sm font-medium">The catalog is being stocked.</p>
          <p className="mt-1 text-xs text-muted-foreground">Check back soon for products from this merchant.</p>
        </div>
      )}
    </section>
  );
}

function Tip({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="panel p-5">
      <span className="grid size-9 place-items-center rounded-lg bg-brand/10 text-brand">
        {icon}
      </span>
      <h2 className="mt-3 font-display text-base font-bold text-primary">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
