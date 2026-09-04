import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { rupees } from "@/lib/commerce/catalog";
import { store, useCommerceStore } from "@/lib/commerce/store";

export function PolicyPanel() {
  const policy = useCommerceStore((s) => s.policy);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium">Max autonomous transaction</span>
          <span className="font-mono text-primary">{rupees(policy.maxAutonomousAmount)}</span>
        </div>
        <Slider
          className="mt-3"
          value={[policy.maxAutonomousAmount]}
          min={500}
          max={50000}
          step={500}
          onValueChange={(v) => store.setPolicy({ maxAutonomousAmount: v[0] ?? 0 })}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Above this the agent must request merchant approval before creating an order.
        </p>
      </div>

      <div>
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium">Max autonomous discount</span>
          <span className="font-mono text-primary">{policy.maxDiscountPct}%</span>
        </div>
        <Slider
          className="mt-3"
          value={[policy.maxDiscountPct]}
          min={0}
          max={40}
          step={1}
          onValueChange={(v) => store.setPolicy({ maxDiscountPct: v[0] ?? 0 })}
        />
      </div>

      <div>
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium">Margin floor</span>
          <span className="font-mono text-primary">{policy.minMarginPct}%</span>
        </div>
        <Slider
          className="mt-3"
          value={[policy.minMarginPct]}
          min={0}
          max={40}
          step={1}
          onValueChange={(v) => store.setPolicy({ minMarginPct: v[0] ?? 0 })}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Negative-margin baskets are hard-blocked, never gated.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-3">
        <div>
          <p className="text-sm font-medium">Block out-of-stock lines</p>
          <p className="text-xs text-muted-foreground">Prevents unfulfillable checkouts.</p>
        </div>
        <Switch
          checked={policy.blockOutOfStock}
          onCheckedChange={(v) => store.setPolicy({ blockOutOfStock: v })}
        />
      </div>
    </div>
  );
}
