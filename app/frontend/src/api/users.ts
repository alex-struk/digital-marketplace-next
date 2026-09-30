import type { AccountKind, AccountStatus } from "@rules/users";
import { api } from "./client";

/**
 * A person's account as the service answers with it (decision record 0011). The contract
 * carries no response bodies, so this is the one place the app says what one looks like.
 */
export interface User {
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
  readonly deactivatedOn: string | null;
  readonly deactivatedBy: string | null;
  readonly capabilities: readonly string[];
}

export function readUser(value: unknown): User | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.id !== "string" || typeof record.type !== "string") return null;
  if (typeof record.name !== "string" || typeof record.idpUsername !== "string") return null;
  const text = (field: string) =>
    typeof record[field] === "string" ? (record[field] as string) : null;
  return {
    id: record.id,
    type: record.type as AccountKind,
    status: (text("status") ?? "ACTIVE") as AccountStatus,
    name: record.name,
    email: text("email"),
    jobTitle: text("jobTitle"),
    avatarImageFile: text("avatarImageFile"),
    notificationsOn: text("notificationsOn"),
    acceptedTermsAt: text("acceptedTermsAt"),
    lastAcceptedTermsAt: text("lastAcceptedTermsAt"),
    idpUsername: record.idpUsername,
    deactivatedOn: text("deactivatedOn"),
    deactivatedBy: text("deactivatedBy"),
    capabilities: Array.isArray(record.capabilities)
      ? record.capabilities.filter((item): item is string => typeof item === "string")
      : [],
  };
}

/**
 * Who the service says is signed in: an account, nobody, or a refusal — a person the
 * service will not let in (R-4.4, R-4.6, R-4.1).
 */
export type SessionAnswer =
  | { readonly kind: "signed-in"; readonly user: User }
  | { readonly kind: "signed-out" }
  | { readonly kind: "refused" }
  | { readonly kind: "unavailable" };

export async function fetchCurrentSession(): Promise<SessionAnswer> {
  try {
    const { data, response } = await api.GET("/api/sessions/{id}", {
      params: { path: { id: "current" } },
    } as never);
    if (response.status === 401 || response.status === 403) return { kind: "refused" };
    if (!response.ok) return { kind: "unavailable" };
    const user = readUser((data as { user?: unknown } | undefined)?.user);
    return user ? { kind: "signed-in", user } : { kind: "signed-out" };
  } catch {
    return { kind: "unavailable" };
  }
}

/** Sign out with the service (R-4.17). True when the service has ended the session. */
export async function endCurrentSession(): Promise<boolean> {
  try {
    const { response } = await api.DELETE("/api/sessions/{id}", {
      params: { path: { id: "current" } },
    } as never);
    return response.ok;
  } catch {
    return false;
  }
}

export type OwnAccountChange =
  | {
      readonly tag: "updateProfile";
      readonly value: { name: string; email: string; jobTitle: string };
    }
  | { readonly tag: "acceptTerms" }
  | { readonly tag: "updateNotifications"; readonly value: boolean };

/** One change to one's own account. The updated account, or null when the service refused it. */
export async function changeOwnAccount(
  userId: string,
  change: OwnAccountChange,
): Promise<User | null> {
  try {
    const { data, response } = await api.PUT("/api/users/{id}", {
      params: { path: { id: userId } },
      body: change as never,
    });
    if (!response.ok) return null;
    return readUser(data);
  } catch {
    return null;
  }
}
