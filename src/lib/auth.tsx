import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Role = "merchant" | "customer";

export type Account = {
  id: string;
  name: string;
  email: string;
  role: Role;
  business?: string;
};

type StoredAccount = Account & { password: string };

const USERS_KEY = "merchant_ai_users_v1";
const SESSION_KEY = "merchant_ai_session_v1";

function readUsers(): StoredAccount[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(USERS_KEY) ?? "[]") as StoredAccount[];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredAccount[]) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

type AuthValue = {
  user: Account | null;
  ready: boolean;
  signUp: (input: {
    name: string;
    email: string;
    password: string;
    role: Role;
    business?: string;
  }) => { ok: true } | { ok: false; error: string };
  signIn: (input: {
    email: string;
    password: string;
    role: Role;
  }) => { ok: true } | { ok: false; error: string };
  signOut: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw) as Account);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const persist = useCallback((account: Account | null) => {
    setUser(account);
    if (account) window.localStorage.setItem(SESSION_KEY, JSON.stringify(account));
    else window.localStorage.removeItem(SESSION_KEY);
  }, []);

  const signUp: AuthValue["signUp"] = useCallback(
    ({ name, email, password, role, business }) => {
      const users = readUsers();
      const normalized = email.trim().toLowerCase();
      if (users.some((u) => u.email === normalized && u.role === role)) {
        return { ok: false as const, error: "An account with this email already exists." };
      }
      const account: StoredAccount = {
        id: crypto.randomUUID(),
        name: name.trim(),
        email: normalized,
        role,
        password,
        ...(business ? { business: business.trim() } : {}),
      };
      writeUsers([...users, account]);
      const { password: _pw, ...safe } = account;
      persist(safe);
      return { ok: true as const };
    },
    [persist],
  );

  const signIn: AuthValue["signIn"] = useCallback(
    ({ email, password, role }) => {
      const normalized = email.trim().toLowerCase();
      const found = readUsers().find(
        (u) => u.email === normalized && u.role === role && u.password === password,
      );
      if (!found) {
        return {
          ok: false as const,
          error: `No ${role} account matches those credentials.`,
        };
      }
      const { password: _pw, ...safe } = found;
      persist(safe);
      return { ok: true as const };
    },
    [persist],
  );

  const signOut = useCallback(() => persist(null), [persist]);

  const value = useMemo(
    () => ({ user, ready, signUp, signIn, signOut }),
    [user, ready, signUp, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export const homeForRole = (role: Role) => (role === "merchant" ? "/merchant" : "/assistant");
