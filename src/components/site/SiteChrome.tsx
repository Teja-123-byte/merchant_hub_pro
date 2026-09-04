import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";
import { homeForRole, useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function Logo({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span
        className={cn(
          "grid size-9 place-items-center rounded-lg font-display text-base font-extrabold",
          tone === "light" ? "bg-accent text-primary" : "bg-primary text-primary-foreground",
        )}
      >
        M
      </span>
      <span
        className={cn(
          "font-display text-lg font-extrabold tracking-tight",
          tone === "light" ? "text-primary-foreground" : "text-primary",
        )}
      >
        Merchant<span className="text-brand">AI</span>
      </span>
    </Link>
  );
}

const NAV = [
  { label: "Product", to: "/#product" },
  { label: "How it works", to: "/#how" },
  { label: "For merchants", to: "/#merchants" },
  { label: "For customers", to: "/#customers" },
];

export function SiteHeader({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const onNavy = tone === "light";

  return (
    <header className={cn(onNavy ? "bg-transparent" : "border-b border-border bg-background")}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-5">
        <Logo tone={tone} />

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <a
              key={n.label}
              href={n.to}
              className={cn(
                "text-sm font-medium transition-opacity hover:opacity-70",
                onNavy ? "text-primary-foreground/90" : "text-foreground/80",
              )}
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link
                to={homeForRole(user.role)}
                className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5"
              >
                {user.role === "merchant" ? "Dashboard" : "Assistant"}
              </Link>
              <button
                onClick={signOut}
                className={cn(
                  "text-sm font-medium",
                  onNavy ? "text-primary-foreground/80" : "text-muted-foreground",
                )}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={cn(
                  "rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors",
                  onNavy
                    ? "bg-accent text-accent-foreground hover:opacity-90"
                    : "border border-border text-foreground hover:bg-secondary",
                )}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition-transform hover:-translate-y-0.5"
              >
                Create account
              </Link>
            </>
          )}
        </div>

        <button
          className={cn("md:hidden", onNavy ? "text-primary-foreground" : "text-foreground")}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <Menu className="size-6" />
        </button>
      </div>

      {open && (
        <div
          className={cn(
            "space-y-3 px-5 pb-6 md:hidden",
            onNavy ? "text-primary-foreground" : "text-foreground",
          )}
        >
          {NAV.map((n) => (
            <a key={n.label} href={n.to} className="block text-sm font-medium">
              {n.label}
            </a>
          ))}
          <div className="flex gap-3 pt-2">
            <Link
              to="/login"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground"
            >
              Create account
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-navy">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-primary-foreground/70">
            Autonomous growth recommendations, deterministic money controls.
          </p>
        </div>
        <div className="flex gap-8 text-sm text-primary-foreground/70">
          <Link to="/login" className="hover:text-accent">
            Login
          </Link>
          <Link to="/signup" className="hover:text-accent">
            Sign up
          </Link>
          <a href="/#how" className="hover:text-accent">
            How it works
          </a>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 py-5 text-center text-xs text-primary-foreground/50">
        © {new Date().getFullYear()} MerchantAI
      </div>
    </footer>
  );
}
