import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { Logo } from "@/components/site/SiteChrome";

const POINTS = [
  "Separate merchant and customer workspaces",
  "Your catalog, your discount and margin caps",
  "Every AI money action gated and audited",
];

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="bg-navy px-8 py-10 lg:px-14 lg:py-14">
        <Logo />
        <div className="mt-16 max-w-md">
          <h2 className="font-display text-3xl leading-tight text-primary-foreground sm:text-4xl">
            AI that grows orders, <span className="marker-underline text-primary-foreground">inside your limits</span>
          </h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-primary-foreground/80">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                  <Check className="size-3" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <h1 className="font-display text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-sm text-muted-foreground">{footer}</div>
        </div>
      </section>
    </main>
  );
}

export function RoleToggle({
  value,
  onChange,
}: {
  value: "merchant" | "customer";
  onChange: (r: "merchant" | "customer") => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1.5">
      {(["merchant", "customer"] as const).map((role) => (
        <button
          key={role}
          type="button"
          onClick={() => onChange(role)}
          className={
            "rounded-lg px-4 py-2.5 text-sm font-semibold capitalize transition-colors " +
            (value === role
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          {role}
        </button>
      ))}
    </div>
  );
}

export const roleBlurb = {
  merchant: "Add products, set policy caps and approve or reject agent orders.",
  customer: "Chat with the store assistant and check out inside merchant limits.",
} as const;
