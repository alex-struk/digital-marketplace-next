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

/**
 * The contract as this service answers it: without the test-only entrances, and with the
 * session route accepting `current`, the address that stands for whoever is asking.
 */
export function contractForThisService(
  document: ContractDocument,
): ContractDocument {
  return withCurrentSession(withoutTestOnlyRoutes(withWholeDescriptions(document)));
}

const RESPONSE_MEMBERS = new Set(["description", "headers", "content", "links"]);

/**
 * A few responses in the contract are written as one-line YAML mappings whose description
 * holds an unquoted comma — `{ description: Refused, answered with the reasons … }` — which
 * YAML reads as a description of "Refused" and a second, empty member named by the rest of
 * the sentence. The validator rejects the whole document for that member, and with it
 * every request. The member is put back where the sentence came from; nothing else about
 * the response changes (decision record 0011).
 */
export function withWholeDescriptions(document: ContractDocument): ContractDocument {
  const paths = (document.paths as Record<string, Record<string, unknown>>) ?? {};
  const mended: Record<string, unknown> = {};
  for (const [address, route] of Object.entries(paths)) {
    const operations: Record<string, unknown> = {};
    for (const [method, operation] of Object.entries(route ?? {})) {
      const responses = (operation as { responses?: Record<string, unknown> } | null)?.responses;
      if (!responses || typeof responses !== "object") {
        operations[method] = operation;
        continue;
      }
      const fixed: Record<string, unknown> = {};
      for (const [status, response] of Object.entries(responses)) {
        fixed[status] = wholeResponse(response);
      }
      operations[method] = { ...(operation as object), responses: fixed };
    }
    mended[address] = operations;
  }
  return { ...document, paths: mended };
}

function wholeResponse(response: unknown): unknown {
  if (typeof response !== "object" || response === null) return response;
  const members = Object.entries(response as Record<string, unknown>);
  const strays = members.filter(
    ([key, value]) => !RESPONSE_MEMBERS.has(key) && !key.startsWith("x-") && value === null,
  );
  if (strays.length === 0) return response;
  const kept = Object.fromEntries(
    members.filter(([key]) => !strays.some(([stray]) => stray === key)),
  );
  const description = [kept.description, ...strays.map(([key]) => key)]
    .filter((part) => typeof part === "string" && part.length > 0)
    .join(", ");
  return { ...kept, description };
}

/**
 * The contract types every `{id}` as an identifier, and names no other value for it. The
 * session route is asked for as `/api/sessions/current` — by the single-page app when it
 * signs a person in and out, and by the acceptance suite reading a person's own account
 * (surface.yaml, user-account-self-request) — so here, and only here, the identifier is any
 * string. The handler still refuses a session that is not the requester's own (decision
 * record 0011).
 */
export function withCurrentSession(document: ContractDocument): ContractDocument {
  const paths = { ...((document.paths as Record<string, unknown>) ?? {}) };
  const route = paths["/api/sessions/{id}"] as Record<string, unknown> | undefined;
  if (!route) return document;
  const anyString = [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string" },
      description: "The session, or `current` for the requester's own.",
    },
  ];
  const rewritten: Record<string, unknown> = {};
  for (const [method, operation] of Object.entries(route)) {
    rewritten[method] =
      typeof operation === "object" && operation !== null
        ? { ...(operation as Record<string, unknown>), parameters: anyString }
        : operation;
  }
  paths["/api/sessions/{id}"] = rewritten;
  return { ...document, paths };
}

export function withoutTestOnlyRoutes(
  document: ContractDocument,
): ContractDocument {
  const paths = { ...((document.paths as Record<string, unknown>) ?? {}) };
  for (const route of TEST_ONLY_ROUTES) delete paths[route];
  return { ...document, paths };
}
