import { useSyncExternalStore } from "react";
import { DEFAULT_POLICY } from "./policy";
import type { AuditEvent, MerchantPolicy, Order, Product } from "./types";

type State = {
  policy: MerchantPolicy;
  products: Product[];
  audit: AuditEvent[];
  orders: Order[];
  recommendations: number;
  accepted: number;
  blocked: number;
};

const PERSIST_KEY = "merchant_ai_catalog_v1";

/** No sample data — merchants populate their own catalog. */
let state: State = {
  policy: DEFAULT_POLICY,
  products: [],
  audit: [],
  orders: [],
  recommendations: 0,
  accepted: 0,
  blocked: 0,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function hydrate() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(PERSIST_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw) as Partial<State> | Product[];
    if (Array.isArray(saved)) {
      state = { ...state, products: saved };
    } else if (saved && Array.isArray(saved.products)) {
      state = { ...state, ...saved };
    } else {
      return;
    }
    emit();
  } catch {
    /* ignore */
  }
}

function handleStorage(event: StorageEvent) {
  if (event.key !== PERSIST_KEY) return;
  try {
    if (!event.newValue) {
      state = {
        ...state,
        products: [],
        audit: [],
        orders: [],
        recommendations: 0,
        accepted: 0,
        blocked: 0,
      };
      emit();
      return;
    }
    const saved = JSON.parse(event.newValue) as Partial<State> | Product[];
    if (Array.isArray(saved)) {
      state = { ...state, products: saved };
    } else if (saved && Array.isArray(saved.products)) {
      state = { ...state, ...saved };
    } else {
      return;
    }
    emit();
  } catch {
    /* ignore malformed external updates */
  }
}

let hydrated = false;

export const store = {
  subscribe(l: () => void) {
    if (!hydrated) {
      hydrated = true;
      hydrate();
      if (typeof window !== "undefined") {
        window.addEventListener("storage", handleStorage);
      }
    }
    listeners.add(l);
    return () => listeners.delete(l);
  },
  get: () => state,
  log(e: Omit<AuditEvent, "id" | "ts">) {
    state = {
      ...state,
      audit: [{ ...e, id: crypto.randomUUID(), ts: Date.now() }, ...state.audit].slice(0, 200),
    };
    persist();
    emit();
  },
  setPolicy(patch: Partial<MerchantPolicy>) {
    state = { ...state, policy: { ...state.policy, ...patch } };
    persist();
    emit();
  },
  addProduct(p: Product) {
    state = { ...state, products: [p, ...state.products] };
    persist();
    emit();
  },
  removeProduct(id: string) {
    state = { ...state, products: state.products.filter((p) => p.id !== id) };
    persist();
    emit();
  },
  addOrder(o: Order) {
    state = { ...state, orders: [o, ...state.orders] };
    persist();
    emit();
  },
  updateOrder(id: string, patch: Partial<Order>) {
    state = {
      ...state,
      orders: state.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    };
    persist();
    emit();
  },
  bump(key: "recommendations" | "accepted" | "blocked", by = 1) {
    state = { ...state, [key]: state[key] + by };
    persist();
    emit();
  },
};

export const getProducts = () => state.products;

export function useCommerceStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(state),
    () => selector(state),
  );
}

export function metrics(s: State) {
  const paid = s.orders.filter((o) => o.status === "paid");
  const aiRevenue = paid.reduce((t, o) => t + o.amount, 0);
  const incremental = paid.reduce((t, o) => t + o.incrementalRevenue, 0);
  const totalRevenue = aiRevenue;
  return {
    totalRevenue,
    aiRevenue,
    incremental,
    aovBefore: 0,
    aovNow: paid.length ? Math.round(aiRevenue / paid.length) : 0,
    crossSellRate: s.recommendations > 0 ? (s.accepted / s.recommendations) * 100 : 0,
    recommendations: s.recommendations,
    accepted: s.accepted,
    blocked: s.blocked,
    paidCount: paid.length,
  };
}
