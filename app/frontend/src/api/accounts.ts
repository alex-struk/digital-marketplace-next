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
  readonly capabilities: readonly string[];
  readonly deactivatedOn: string | null;
  readonly deactivatedBy: string | null;
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
    capabilities: Array.isArray(record.capabilities)
      ? record.capabilities.filter((entry): entry is string => typeof entry === "string")
      : [],
    deactivatedOn: textOrNull(record.deactivatedOn),
    deactivatedBy: textOrNull(record.deactivatedBy),
  };
}

/** What asking for somebody's account came back with. */
export type AccountAnswer =
  | { readonly kind: "found"; readonly account: Account }
  | { readonly kind: "refused" };

/**
 * Somebody's account by its identifier. The service answers the person themselves and an
 * administrator, and refuses everyone else (R-4.25); a refusal and an account that does not
 * exist look the same here, because the screen shows both as the missing page.
 */
export async function fetchAccount(accountId: string): Promise<AccountAnswer> {
  try {
    const { data, response } = await api.GET("/api/users/{id}", {
      params: { path: { id: accountId } },
    });
    const account = response.ok ? readAccount(data) : null;
    return account ? { kind: "found", account } : { kind: "refused" };
  } catch {
    return { kind: "refused" };
  }
}

/** What asking for everyone registered came back with (R-4.14, R-4.21). */
export type AccountListAnswer =
  | { readonly kind: "listed"; readonly accounts: readonly Account[] }
  | { readonly kind: "refused" };

/** Everyone registered. The service answers an administrator alone (R-4.21). */
export async function fetchAccounts(): Promise<AccountListAnswer> {
  try {
    const { data, response } = await api.GET("/api/users");
    if (!response.ok || !Array.isArray(data)) return { kind: "refused" };
    const accounts = (data as unknown[]).map(readAccount).filter((account): account is Account => account !== null);
    return { kind: "listed", accounts };
  } catch {
    return { kind: "refused" };
  }
}

function reasonsIn(body: unknown): string[] {
  const errors = (body as { errors?: unknown } | null)?.errors;
  return Array.isArray(errors) ? errors.filter((reason): reason is string => typeof reason === "string") : [];
}

/** What an administrator's change to somebody else's account came back with, and why it was refused. */
export type AdministrationAnswer =
  | { readonly kind: "saved"; readonly account: Account }
  | { readonly kind: "refused"; readonly reasons: readonly string[] };

async function administrationAnswer(
  request: Promise<{ data?: unknown; error?: unknown; response: Response }>,
): Promise<AdministrationAnswer> {
  try {
    const { data, error, response } = await request;
    const account = response.ok ? readAccount(data) : null;
    return account ? { kind: "saved", account } : { kind: "refused", reasons: reasonsIn(error) };
  } catch {
    return { kind: "refused", reasons: [] };
  }
}

/**
 * An administrator's change to somebody else's account: reactivating it (R-4.19) or granting or
 * withdrawing administrator rights (R-4.12).
 */
export function administerAccount(
  accountId: string,
  tag: "reactivateUser" | "updateAdminPermissions",
  value?: boolean,
): Promise<AdministrationAnswer> {
  return administrationAnswer(
    api.PUT("/api/users/{id}", {
      params: { path: { id: accountId } },
      body: value === undefined ? { tag } : { tag, value },
    }),
  );
}

/** An administrator deactivating somebody else's account (R-4.30). */
export function deactivateAccount(accountId: string): Promise<AdministrationAnswer> {
  return administrationAnswer(api.DELETE("/api/users/{id}", { params: { path: { id: accountId } } }));
}

/**
 * Saves the contact list an administrator asked for to their device (R-4.32). The file is
 * fetched by the app with the person's bearer token, then offered under the name the service
 * gave it.
 */
export async function downloadContactList(userTypes: readonly string[], fields: readonly string[]): Promise<boolean> {
  try {
    const { data, response } = await api.GET("/api/contact-list", {
      params: { query: { userTypes: userTypes.join(","), fields: fields.join(",") } },
      parseAs: "blob",
    });
    if (!response.ok || !(data instanceof Blob)) return false;
    const named = /filename="?([^";]+)"?/.exec(response.headers.get("content-disposition") ?? "")?.[1];
    const address = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = address;
    link.download = named ?? "dm-contacts.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(address), 0);
    return true;
  } catch {
    return false;
  }
}

/** What the service said to a person deactivating their own account (R-4.9). */
export type DeactivationAnswer =
  | { readonly kind: "deactivated"; readonly identityProviderSignedOut: boolean }
  | { readonly kind: "refused" };

export async function deactivateOwnAccount(accountId: string): Promise<DeactivationAnswer> {
  try {
    const { data, response } = await api.DELETE("/api/users/{id}", {
      params: { path: { id: accountId } },
    });
    if (!response.ok) return { kind: "refused" };
    const record = (typeof data === "object" && data !== null ? data : {}) as Record<string, unknown>;
    return { kind: "deactivated", identityProviderSignedOut: record.identityProviderSignedOut === true };
  } catch {
    return { kind: "refused" };
  }
}

/** What asking for the current session came back with. */
export type SessionAnswer =
  | { readonly kind: "signed-in"; readonly account: Account }
  | { readonly kind: "visitor" }
  | { readonly kind: "refused" }
  /**
   * The token that went with the question is no longer accepted — expired, or from a session
   * signed out of. Only a token is ever refused this way: a question without one is answered.
   */
  | { readonly kind: "token-refused" }
  /** No answer: the request never completed (the page was left, the network failed) or the service faulted. */
  | { readonly kind: "unanswered" };

/** What a status, and the body that came with it, say about the current session. */
export function readSessionAnswer(status: number, body: unknown): SessionAnswer {
  if (status === 401) return { kind: "token-refused" };
  // A fault is not a refusal: nothing has been said about this person.
  if (status >= 500) return { kind: "unanswered" };
  // Anything else the service will not answer is a refused sign-in (R-4.1, R-4.4).
  if (status !== 200) return { kind: "refused" };
  const account = readAccount((body as { user?: unknown } | undefined)?.user);
  return account ? { kind: "signed-in", account } : { kind: "visitor" };
}

/**
 * The current session. Reading it with a token is what completes a sign-in: the service makes
 * the account on a first sign-in and refuses one that may not sign in (R-4.1, R-4.4). A request
 * that never completed is `unanswered`, never a refusal: leaving a page while it is on its way
 * aborts it, and that says nothing about who is signed in (decision record 0038).
 */
export async function fetchCurrentSession(): Promise<SessionAnswer> {
  try {
    const { data, response } = await api.GET("/api/sessions/{id}", {
      params: { path: { id: "current" } },
    });
    return readSessionAnswer(response.status, data);
  } catch {
    return { kind: "unanswered" };
  }
}

/** What the service said to being asked to end the current session (R-4.17). */
export interface SignOutAnswer {
  /** The service was told, and holds no session for this browser any more. */
  readonly ended: boolean;
  /** It held one until now, named by the browser's cookie or its token. */
  readonly heldOne: boolean;
  /** It ended the identity provider's session too (decision record 0018). */
  readonly identityProviderSignedOut: boolean;
}

const NOT_TOLD: SignOutAnswer = { ended: false, heldOne: false, identityProviderSignedOut: false };

/**
 * A token the service no longer accepts — signed out of already, in another tab or an earlier
 * attempt — has no session there left to end, which is as good as ending it.
 */
export function readSignOutAnswer(status: number, body: unknown): SignOutAnswer {
  if (status === 401) return { ended: true, heldOne: false, identityProviderSignedOut: false };
  if (status < 200 || status >= 300) return NOT_TOLD;
  const record = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  return {
    ended: true,
    heldOne: typeof record.id === "string",
    identityProviderSignedOut: record.identityProviderSignedOut === true,
  };
}

/** Ends the session with the service, and through it with the identity provider (R-4.17). */
export async function endCurrentSession(): Promise<SignOutAnswer> {
  try {
    const { data, response } = await api.DELETE("/api/sessions/{id}", {
      params: { path: { id: "current" } },
    });
    return readSignOutAnswer(response.status, data);
  } catch {
    return NOT_TOLD;
  }
}

/** The outcome of one change to one's own account. */
export type ChangeAnswer =
  | { readonly kind: "saved"; readonly account: Account }
  | { readonly kind: "refused" };

export async function changeOwnAccount(
  accountId: string,
  tag: "updateProfile" | "updateCapabilities" | "acceptTerms" | "updateNotifications",
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
