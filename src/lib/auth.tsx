import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Role = "customer" | "employee" | "ambassador" | "admin";

export type PortalUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: Role;
  requestedRole: Role;
  status: "pending" | "approved" | "rejected" | "disabled";
  company: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
};

type AuthState = {
  user: PortalUser | null;
  /** Verified on both channels and approved — may use the portal. */
  active: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  api: <T = Record<string, unknown>>(
    endpoint: string,
    action: string,
    body?: Record<string, unknown>,
  ) => Promise<T>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

/** Thrown for a non-2xx reply so callers can show the server's message. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [csrf, setCsrf] = useState("");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/auth.php?action=session", {
        credentials: "same-origin",
      });
      const data = await response.json();
      setCsrf(data.csrfToken ?? "");
      setUser(data.user ?? null);
      setActive(Boolean(data.active));
    } catch {
      setUser(null);
      setActive(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const api = useCallback(
    async <T,>(
      endpoint: string,
      action: string,
      payload: Record<string, unknown> = {},
    ): Promise<T> => {
      // Always send the CSRF token the server handed us with the session.
      let token = csrf;
      if (!token) {
        const seed = await fetch("/api/auth.php?action=session", {
          credentials: "same-origin",
        }).then((r) => r.json());
        token = seed.csrfToken ?? "";
        setCsrf(token);
      }

      const response = await fetch(`/api/${endpoint}.php?action=${action}`, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
          "x-csrf-token": token,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok === false) {
        throw new ApiError(
          data.error ?? "Something went wrong. Please try again.",
          response.status,
        );
      }

      // Endpoints that return the account keep the context in step.
      if (data.user !== undefined) {
        setUser(data.user);
        setActive(Boolean(data.active));
      }
      return data as T;
    },
    [csrf],
  );

  const logout = useCallback(async () => {
    try {
      await api("auth", "logout");
    } finally {
      setUser(null);
      setActive(false);
      await refresh();
    }
  }, [api, refresh]);

  const value = useMemo(
    () => ({ user, active, loading, refresh, api, logout }),
    [user, active, loading, refresh, api, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

export const roleHome: Record<Role, string> = {
  customer: "/portal",
  employee: "/portal/team",
  ambassador: "/portal/ambassador",
  admin: "/portal/team",
};
