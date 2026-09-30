/**
 * The tokens a sign-in leaves in the browser (decision records 0004, 0011).
 *
 * They are kept in the browser's local storage so that a person stays signed in across
 * reloads and new tabs, until they sign out or the identity provider's session ends. The
 * access token is also put in a cookie scoped to `/api`, so a request the app cannot add a
 * header to — a plain link to a file, a request made outside the app — still carries it.
 * The cookie is `SameSite=Strict`, so no other site can make the browser send it.
 */
export interface Tokens {
  readonly accessToken: string;
  readonly refreshToken: string | null;
  readonly idToken: string | null;
  /** When the access token expires, in milliseconds since the epoch. */
  readonly expiresAt: number;
}

const STORAGE_KEY = "digital-marketplace.tokens";
export const TOKEN_COOKIE = "dm_access_token";

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readTokens(): Tokens | null {
  const raw = storage()?.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<Tokens>;
    if (typeof value.accessToken !== "string" || typeof value.expiresAt !== "number") {
      return null;
    }
    return {
      accessToken: value.accessToken,
      refreshToken: typeof value.refreshToken === "string" ? value.refreshToken : null,
      idToken: typeof value.idToken === "string" ? value.idToken : null,
      expiresAt: value.expiresAt,
    };
  } catch {
    return null;
  }
}

export function writeTokens(tokens: Tokens): void {
  storage()?.setItem(STORAGE_KEY, JSON.stringify(tokens));
  const seconds = Math.max(0, Math.floor((tokens.expiresAt - Date.now()) / 1000));
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(tokens.accessToken)}; Path=/api; Max-Age=${seconds}; SameSite=Strict`;
}

export function clearTokens(): void {
  storage()?.removeItem(STORAGE_KEY);
  document.cookie = `${TOKEN_COOKIE}=; Path=/api; Max-Age=0; SameSite=Strict`;
}

/** The token endpoint's answer, as tokens to keep. */
export function tokensFrom(answer: Record<string, unknown>, now = Date.now()): Tokens | null {
  const accessToken = answer.access_token;
  if (typeof accessToken !== "string" || accessToken.length === 0) return null;
  const lifetime = typeof answer.expires_in === "number" ? answer.expires_in : 300;
  return {
    accessToken,
    refreshToken: typeof answer.refresh_token === "string" ? answer.refresh_token : null,
    idToken: typeof answer.id_token === "string" ? answer.id_token : null,
    expiresAt: now + lifetime * 1000,
  };
}
