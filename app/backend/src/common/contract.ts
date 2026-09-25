import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";

/**
 * The recovered HTTP contract, `spec/contract/openapi.yaml`, is the source of the API
 * surface (the stack profile, decision record 0003). It is read here once and handed to the
 * boundary validator; no handler repeats what it says.
 */
export const CONTRACT_PATH =
  process.env.CONTRACT_PATH ?? resolve(__dirname, "../../contract/openapi.yaml");

export type ContractDocument = Record<string, unknown>;

export function loadContract(path: string = CONTRACT_PATH): ContractDocument {
  return withLocalServer(parse(readFileSync(path, "utf8")));
}

/**
 * The contract's own server is written as a template variable, because the address a target
 * answers on is the target's own. This service answers at the root of its origin, so the
 * paths are matched exactly as the contract writes them.
 */
export function withLocalServer(document: ContractDocument): ContractDocument {
  return { ...document, servers: [{ url: "/" }] };
}

/**
 * The three sign-in routes that exist only outside a production environment are not built
 * (constitution J3: no test-only entrances), so they are taken out of the surface the
 * boundary validator will accept.
 */
export const TEST_ONLY_ROUTES = [
  "/auth/createsessionadmin",
  "/auth/createsessiongov",
  "/auth/createsessionvendor/{id}",
] as const;

export function withoutTestOnlyRoutes(
  document: ContractDocument,
): ContractDocument {
  const paths = { ...((document.paths as Record<string, unknown>) ?? {}) };
  for (const route of TEST_ONLY_ROUTES) delete paths[route];
  return { ...document, paths };
}
