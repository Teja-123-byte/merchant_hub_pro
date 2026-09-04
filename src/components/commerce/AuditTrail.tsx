import { useCommerceStore } from "@/lib/commerce/store";
import type { AuditEvent } from "@/lib/commerce/types";
import { cn } from "@/lib/utils";

const ACTOR_LABEL: Record<AuditEvent["actor"], string> = {
  intent: "INTENT",
  catalog: "CATALOG",
  growth: "GROWTH",
  decision: "DECISION",
  policy: "POLICY",
  payment: "PAYMENT",
  webhook: "WEBHOOK",
  merchant: "MERCHANT",
};

const time = (ts: number) =>
  new Date(ts).toLocaleTimeString("en-GB", { hour12: false });

export function AuditTrail({ limit = 40 }: { limit?: number }) {
  const audit = useCommerceStore((s) => s.audit);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">Decision & audit trail</h3>
        <span className="font-mono text-[11px] text-muted-foreground">
          {audit.length} events
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {audit.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Every agent step, policy check and money action is appended here.
          </p>
        ) : (
          <ol className="space-y-2.5">
            {audit.slice(0, limit).map((e) => (
              <li key={e.id} className="flex gap-3 font-mono text-[11px] leading-relaxed">
                <span className="shrink-0 text-muted-foreground">{time(e.ts)}</span>
                <span
                  className={cn(
                    "h-fit shrink-0 rounded px-1.5 py-0.5 text-[10px] tracking-wide",
                    e.status === "error"
                      ? "bg-destructive/20 text-destructive"
                      : e.status === "warn"
                        ? "bg-warning/20 text-warning"
                        : "bg-secondary text-muted-foreground",
                  )}
                >
                  {ACTOR_LABEL[e.actor]}
                </span>
                <span className="font-sans text-xs text-foreground">
                  {e.label}
                  {e.detail ? (
                    <span className="text-muted-foreground"> — {e.detail}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
