import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouterState } from "@tanstack/react-router";
import { fetchCurrentSession, User } from "../api/users";
import { clearTokens, readTokens } from "./tokens";

/**
 * Who is signed in, for every screen.
 *
 * On the first screen of a visit the app asks the service, if the browser holds tokens from
 * an earlier sign-in; with none it knows at once that nobody is signed in. A token the
 * service no longer accepts, or an account it will not let in, is dropped from the browser.
 */
export type SessionState =
  | { readonly status: "loading" }
  | { readonly status: "signed-out" }
  | { readonly status: "signed-in"; readonly user: User };

interface SessionContextValue {
  readonly session: SessionState;
  /** Record the account the service has just answered with. */
  readonly signedIn: (user: User) => void;
  readonly signedOut: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function initialState(): SessionState {
  return readTokens() ? { status: "loading" } : { status: "signed-out" };
}

export function SessionProvider({ children }: { readonly children: ReactNode }) {
  const [session, setSession] = useState<SessionState>(initialState);

  useEffect(() => {
    if (session.status !== "loading") return;
    let current = true;
    void fetchCurrentSession().then((answer) => {
      if (!current) return;
      if (answer.kind === "signed-in") {
        setSession({ status: "signed-in", user: answer.user });
        return;
      }
      if (answer.kind !== "unavailable") clearTokens();
      setSession({ status: "signed-out" });
    });
    return () => {
      current = false;
    };
    // Asked once, for the first screen; later changes come through signedIn and signedOut.
  }, []);

  const signedIn = useCallback((user: User) => setSession({ status: "signed-in", user }), []);
  const signedOut = useCallback(() => {
    clearTokens();
    setSession({ status: "signed-out" });
  }, []);

  const value = useMemo(() => ({ session, signedIn, signedOut }), [session, signedIn, signedOut]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession is used outside the SessionProvider.");
  return value;
}

/** The address a screen was opened at, to come back to after signing in (R-4.22). */
export function currentAddress(location: { pathname: string; searchStr?: string; hash?: string }): string {
  const search = location.searchStr ?? "";
  const hash = location.hash ? `#${location.hash}` : "";
  return `${location.pathname}${search}${hash}`;
}

/**
 * The current address as one string. Selected as a string, not as the router's location
 * object, so a screen re-renders when the address changes and at no other time.
 */
export function useCurrentAddress(): string {
  return useRouterState({ select: (state) => currentAddress(state.location) });
}
