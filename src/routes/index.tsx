import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Bot, ClipboardList, Lock, PackagePlus, ShieldCheck } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import heroImg from "@/assets/hero-illustration.png";
import catalogImg from "@/assets/catalog-illustration.png";
import assistantImg from "@/assets/assistant-illustration.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MerchantAI — AI commerce your policies control" },
      {
        name: "description",
        content:
          "MerchantAI gives merchants an autonomous growth assistant and customers a professional shopping agent, with every payment gated by policies you set.",
      },
      { property: "og:title", content: "MerchantAI — AI commerce your policies control" },
      {
        property: "og:description",
        content:
          "An AI assistant that recommends, and deterministic code that decides whether money moves.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-navy">
        <SiteHeader />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-20 pt-8 lg:grid-cols-[1fr_1.05fr]">
          <div>
            <h1 className="font-display text-4xl leading-[1.1] text-primary-foreground sm:text-5xl">
              Sell more with an AI agent you actually{" "}
              <span className="marker-underline text-primary-foreground">control</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-primary-foreground/75">
              MerchantAI understands what a shopper wants, finds it in your catalog, and proposes
              the offer that grows order value. Every money action then passes your policy engine
              before it reaches checkout.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3.5 text-sm font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5"
              >
                Get started free <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/login"
                className="text-sm font-semibold text-primary-foreground/80 hover:text-accent"
              >
                I already have an account
              </Link>
            </div>
          </div>
          <img
            src={heroImg}
            alt="Merchants reviewing an AI sales dashboard"
            width={1200}
            height={912}
            className="w-full"
          />
        </div>
      </section>

      {/* Merchants */}
      <section id="merchants" className="mx-auto max-w-7xl px-5 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <img
            src={catalogImg}
            alt="Merchant adding products to their catalog"
            width={1008}
            height={800}
            loading="lazy"
            className="w-full"
          />
          <div>
            <h2 className="font-display text-3xl leading-tight sm:text-4xl">
              Your catalog, <span className="marker-underline">your rules</span>
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
              Start empty and add exactly the products you sell — price, cost, stock and tags. The
              agent can only ever recommend what you have entered, and only inside the discount,
              margin and spend caps you set.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              <Feature icon={<PackagePlus className="size-4" />} text="Add and manage products in seconds" />
              <Feature icon={<Lock className="size-4" />} text="Autonomy caps enforced in code, not in a prompt" />
              <Feature icon={<BarChart3 className="size-4" />} text="AI-attributed revenue and AOV lift, live" />
            </ul>
            <Link
              to="/signup"
              search={{ role: "merchant" }}
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3.5 text-sm font-semibold text-brand-foreground transition-transform hover:-translate-y-0.5"
            >
              Create a merchant account <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Customers */}
      <section id="customers" className="bg-muted">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl leading-tight sm:text-4xl">
              A shopping assistant that <span className="marker-underline">explains itself</span>
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
              Customers describe what they need in plain language and get a grounded
              recommendation, a transparent bundle price and a checkout that never exceeds what the
              merchant allows.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              <Feature icon={<Bot className="size-4" />} text="Natural language intent, no keyword hunting" />
              <Feature icon={<ShieldCheck className="size-4" />} text="Out-of-stock and over-limit actions are blocked" />
              <Feature icon={<ClipboardList className="size-4" />} text="Every step written to a readable audit trail" />
            </ul>
            <Link
              to="/signup"
              search={{ role: "customer" }}
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Shop with the assistant <ArrowRight className="size-4" />
            </Link>
          </div>
          <img
            src={assistantImg}
            alt="Customer chatting with the AI shopping assistant"
            width={1008}
            height={800}
            loading="lazy"
            className="w-full"
          />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl px-5 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl sm:text-4xl">How it works</h2>
          <p className="mt-4 text-base text-muted-foreground">
            Four agents propose. One deterministic engine decides.
          </p>
        </div>
        <div id="product" className="mt-12 grid gap-6 md:grid-cols-3">
          <Step
            n="01"
            title="Understand"
            body="The intent agent turns a sentence into structured needs — category, budget, use case and features."
          />
          <Step
            n="02"
            title="Recommend"
            body="Catalog and growth agents ground the answer in your products and build a compliant attach offer."
          />
          <Step
            n="03"
            title="Gate"
            body="The policy engine re-verifies every money action: approve, queue for you, or hard-block."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center">
          <h2 className="font-display text-3xl text-primary-foreground sm:text-4xl">
            Bring your catalog. Keep the controls.
          </h2>
          <p className="mt-4 text-base text-primary-foreground/75">
            Separate workspaces for merchants and customers, from the very first sign-up.
          </p>
          <Link
            to="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5"
          >
            Create your account <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="grid size-7 shrink-0 place-items-center rounded-md bg-brand/10 text-brand">
        {icon}
      </span>
      <span className="text-foreground/80">{text}</span>
    </li>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="panel p-7">
      <span className="font-mono text-sm font-semibold text-brand">{n}</span>
      <h3 className="mt-3 text-xl">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
