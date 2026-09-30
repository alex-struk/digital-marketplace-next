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
  return withLocalServer(withResponsesAsWritten(parse(readFileSync(path, "utf8"))));
}

const RESPONSE_MEMBERS = new Set(["description", "headers", "content", "links", "$ref"]);

/**
 * A response described on one line as `{ description: Refused, answered with ... }` is read
 * by YAML as a description of "Refused" and a second, empty member named by the rest of the
 * sentence, because the comma ends the first value. The validator then rejects the whole
 * contract, and with it every request (decision record 0011). The sentence is put back
 * together here, exactly as it was written; nothing else about the contract changes.
 */
export function withResponsesAsWritten(document: ContractDocument): ContractDocument {
  const paths = (document.paths ?? {}) as Record<string, Record<string, unknown>>;
  for (const operations of Object.values(paths)) {
    for (const operation of Object.values(operations ?? {})) {
      const responses = (operation as { responses?: Record<string, unknown> } | null)
        ?.responses;
      if (!responses || typeof responses !== "object") continue;
      for (const [status, response] of Object.entries(responses)) {
        if (!response || typeof response !== "object") continue;
        const record = response as Record<string, unknown>;
        const strays = Object.keys(record).filter(
          (key) => !RESPONSE_MEMBERS.has(key) && record[key] === null,
        );
        if (strays.length === 0) continue;
        const kept = Object.fromEntries(
          Object.entries(record).filter(([key]) => !strays.includes(key)),
        );
        responses[status] = {
          ...kept,
          description: [record.description, ...strays].filter(Boolean).join(", "),
        };
      }
    }
  }
  return document;
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
 * The address that stands for whoever is asking, in place of a session's identifier
 * (decision record 0011). The recovered contract types every `{id}` as an identifier, but
 * the service it was recovered from answered `/api/sessions/current`, the surface
 * (spec/contract/surface.yaml, user-account-self-request) names that address, and it is how
 * the single-page app completes sign-in. The boundary is told so here, for that one path and
 * that one word, and still checks everything else the contract says about it.
 */
export const CURRENT_SESSION = "current";

export function withCurrentSession(document: ContractDocument): ContractDocument {
  const paths = { ...((document.paths as Record<string, unknown>) ?? {}) };
  const sessions = paths["/api/sessions/{id}"] as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (!sessions) return document;
  const id = {
    name: "id",
    in: "path",
    required: true,
    schema: {
      anyOf: [
        { type: "string", format: "uuid" },
        { type: "string", const: CURRENT_SESSION },
      ],
    },
    description: "The session's identifier, or \"current\" for the asker's own.",
  };
  const operations: Record<string, unknown> = {};
  for (const [method, operation] of Object.entries(sessions)) {
    operations[method] =
      operation && typeof operation === "object" && "parameters" in operation
        ? { ...operation, parameters: [id] }
        : operation;
  }
  paths["/api/sessions/{id}"] = operations;
  return { ...document, paths };
}

export function withoutTestOnlyRoutes(
  document: ContractDocument,
): ContractDocument {
  const paths = { ...((document.paths as Record<string, unknown>) ?? {}) };
  for (const route of TEST_ONLY_ROUTES) delete paths[route];
  return { ...document, paths };
}
