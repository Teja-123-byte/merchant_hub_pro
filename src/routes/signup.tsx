import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout, RoleToggle, roleBlurb } from "@/components/site/AuthLayout";
import { homeForRole, useAuth, type Role } from "@/lib/auth";

type Search = { role?: Role };

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>): Search =>
    search["role"] === "merchant" || search["role"] === "customer"
      ? { role: search["role"] }
      : {},
  head: () => ({
    meta: [
      { title: "Create your account — MerchantAI" },
      {
        name: "description",
        content:
          "Sign up to MerchantAI as a merchant to manage your catalog and policies, or as a customer to shop with the gated AI assistant.",
      },
      { property: "og:title", content: "Create your account — MerchantAI" },
      {
        property: "og:description",
        content: "Separate sign-up for merchants and customers, with role-specific workspaces.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { role: initialRole } = Route.useSearch();
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>(initialRole ?? "merchant");
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    const res = signUp({ name, email, password, role, ...(role === "merchant" ? { business } : {}) });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    navigate({ to: homeForRole(role) });
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle={roleBlurb[role]}
      footer={
        <>
          Already registered?{" "}
          <Link to="/login" search={{ role }} className="font-semibold text-brand hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <RoleToggle value={role} onChange={setRole} />

        <Field label="Full name">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Asha Rao"
          />
        </Field>

        {role === "merchant" && (
          <Field label="Business name">
            <input
              required
              value={business}
              onChange={(e) => setBusiness(e.target.value)}
              className={inputClass}
              placeholder="Rao Electronics"
            />
          </Field>
        )}

        <Field label="Email">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@example.com"
          />
        </Field>

        <Field label="Password">
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="At least 6 characters"
          />
        </Field>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-lg bg-brand px-6 py-3.5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-primary"
        >
          Create {role} account
        </button>
      </form>
    </AuthLayout>
  );
}

export const inputClass =
  "w-full rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/20";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
