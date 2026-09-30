import type { AccountKind, AccountStatus } from "@rules/users";
import { api } from "./client";

/**
 * A person's account, as the service answers with it (decision record 0011). The contract
 * carries no response shapes, so this one is read defensively rather than trusted.
 */
export interface Account {
  readonly id: string;
  readonly type: AccountKind;
  readonly status: AccountStatus;
  readonly name: string;
  readonly email: string | null;
  readonly jobTitle: string | null;
  readonly avatarImageFile: string | null;
  readonly notificationsOn: string | null;
  readonly acceptedTermsAt: string | null;
  readonly lastAcceptedTermsAt: string | null;
  readonly idpUsername: string;
}

const KINDS = new Set(["VENDOR", "GOV", "ADMIN"]);

const textOrNull = (value: unknown) => (typeof value === "string" ? value : null);

export function readAccount(value: unknown): Account | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.id !== "string" || !KINDS.has(record.type as string)) return null;
  return {
    id: record.id,
    type: record.type as AccountKind,
    status: (record.status as AccountStatus) ?? "ACTIVE",
    name: typeof record.name === "string" ? record.name : "",
    email: textOrNull(record.email),
    jobTitle: textOrNull(record.jobTitle),
    avatarImageFile: textOrNull(record.avatarImageFile),
    notificationsOn: textOrNull(record.notificationsOn),
    acceptedTermsAt: textOrNull(record.acceptedTermsAt),
    lastAcceptedTermsAt: textOrNull(record.lastAcceptedTermsAt),
    idpUsername: typeof record.idpUsername === "string" ? record.idpUsername : "",
  };
}

/** What asking for the current session came back with. */
export type SessionAnswer =
  | { readonly kind: "signed-in"; readonly account: Account }
  | { readonly kind: "visitor" }
  | { readonly kind: "refused" };

/**
 * The current session. Reading it with a token is what completes a sign-in: the service makes
 * the account on a first sign-in and refuses one that may not sign in (R-4.1, R-4.4).
 */
export async function fetchCurrentSession(): Promise<SessionAnswer> {
  try {
    const { data, response } = await api.GET("/api/sessions/{id}", {
      params: { path: { id: "current" } },
    });
    // A token the service no longer accepts — expired, or from a session signed out of — is
    // no sign-in at all; anything else it will not answer is a refused one.
    if (response.status === 401) return { kind: "visitor" };
    if (response.status !== 200) return { kind: "refused" };
    const account = readAccount((data as { user?: unknown } | undefined)?.user);
    return account ? { kind: "signed-in", account } : { kind: "visitor" };
  } catch {
    return { kind: "refused" };
  }
}

/**
 * Ends the session with the service (R-4.17). Says whether it has ended: a token the service
 * no longer accepts — signed out of already, in another tab or an earlier attempt — has no
 * session there left to end.
 */
export async function endCurrentSession(): Promise<boolean> {
  try {
    const { response } = await api.DELETE("/api/sessions/{id}", {
      params: { path: { id: "current" } },
    });
    return response.ok || response.status === 401;
  } catch {
    return false;
  }
}

/** The outcome of one change to one's own account. */
export type ChangeAnswer =
  | { readonly kind: "saved"; readonly account: Account }
  | { readonly kind: "refused" };

export async function changeOwnAccount(
  accountId: string,
  tag: "updateProfile" | "acceptTerms" | "updateNotifications",
  value?: unknown,
): Promise<ChangeAnswer> {
  try {
    const { data, response } = await api.PUT("/api/users/{id}", {
      params: { path: { id: accountId } },
      body: value === undefined ? { tag } : { tag, value: value as never },
    });
    const account = response.ok ? readAccount(data) : null;
    return account ? { kind: "saved", account } : { kind: "refused" };
  } catch {
    return { kind: "refused" };
  }
}
