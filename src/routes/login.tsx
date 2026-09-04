import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout, RoleToggle, roleBlurb } from "@/components/site/AuthLayout";
import { Field, inputClass } from "@/routes/signup";
import { homeForRole, useAuth, type Role } from "@/lib/auth";

type Search = { role?: Role };

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): Search =>
    search["role"] === "merchant" || search["role"] === "customer"
      ? { role: search["role"] }
      : {},
  head: () => ({
    meta: [
      { title: "Log in — MerchantAI" },
      {
        name: "description",
        content:
          "Log in to MerchantAI. Merchants manage catalog and policy; customers shop with the gated AI assistant.",
      },
      { property: "og:title", content: "Log in — MerchantAI" },
      { property: "og:description", content: "Role-based login for merchants and customers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { role: initialRole } = Route.useSearch();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>(initialRole ?? "merchant");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = signIn({ email: email.trim(), password, role });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    navigate({ to: homeForRole(role) });
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle={roleBlurb[role]}
      footer={
        <>
          New here?{" "}
          <Link to="/signup" search={{ role }} className="font-semibold text-brand hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <RoleToggle value={role} onChange={setRole} />

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
            placeholder="••••••••"
          />
        </Field>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          className="w-full rounded-lg bg-brand px-6 py-3.5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-primary"
        >
          Log in as {role}
        </button>
      </form>
    </AuthLayout>
  );
}
