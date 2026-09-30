import createClient from "openapi-fetch";
import type { paths } from "./contract";

/**
 * The service's own client, generated from `spec/contract/openapi.yaml` — the addresses and
 * methods below are the contract's, not this app's idea of them (the stack profile).
 * `src/api/contract.d.ts` is the generated half and is not edited by hand; run
 * `npm run generate:api` to rebuild it from the contract.
 *
 * The base address is the origin the app is served from: the web server in front of it
 * forwards `/api`, `/status` and `/admin` to the service (decision record 0001), so a
 * browser sees one origin and no address here needs a host in it.
 */
export function originOfThisApp(): string {
  return typeof window === "undefined" ? "/" : window.location.origin;
}

export const api = createClient<paths>({
  baseUrl: originOfThisApp(),
  // Asked for at the moment of the request rather than held from when the client was made,
  // so there is one way requests go out and a test can stand in front of it.
  fetch: (request) => globalThis.fetch(request),
});

/** Where a request's bearer token comes from; nothing, until somebody has signed in. */
type TokenSource = () => Promise<string | null>;
let tokenSource: TokenSource = async () => null;

export function useTokensFrom(source: TokenSource): void {
  tokenSource = source;
}

// Every request carries the signed-in person's access token, and a visitor's carries none
// (decision record 0004). Nothing else about a request changes.
api.use({
  async onRequest({ request }) {
    const token = await tokenSource();
    if (token) request.headers.set("authorization", `Bearer ${token}`);
    return request;
  },
});
