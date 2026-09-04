import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useAuth, type Role } from "@/lib/auth";

export function RoleGuard({ role, children }: { role: Role; children: ReactNode }) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !user) navigate({ to: "/login", replace: true });
  }, [ready, user, navigate]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Loading your workspace…
      </div>
    );
  }

  if (!user) return null;

  if (user.role !== role) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
        <div className="panel max-w-md p-8">
          <h1 className="font-display text-xl font-extrabold text-primary">
            This area is for {role}s
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You are signed in as a {user.role}. Head back to your own workspace.
          </p>
          <Link
            to={user.role === "merchant" ? "/merchant" : "/assistant"}
            className="mt-6 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground"
          >
            Go to my workspace
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
