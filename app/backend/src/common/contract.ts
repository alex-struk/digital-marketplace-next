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

/**
 * The parameters an OpenID Connect provider sends back to `/auth/callback` besides the code
 * (decision record 0015). The recovered contract names only `code` and `redirectOnSuccess`,
 * so the boundary would refuse every real callback for carrying `state`, and one reporting
 * that sign-in was cancelled, which carries `error` and no code. Those are named here as
 * optional, and the code is optional because the error answer has none; a callback without
 * one is answered with the sign-in failure notice. Nothing else about the route is relaxed.
 */
export const IDENTITY_PROVIDER_CALLBACK_PARAMETERS = [
  "state",
  "session_state",
  "iss",
  "error",
  "error_description",
  "error_uri",
] as const;

export function withIdentityProviderCallback(document: ContractDocument): ContractDocument {
  const paths = { ...((document.paths as Record<string, unknown>) ?? {}) };
  const callback = paths["/auth/callback"] as Record<string, Record<string, unknown>> | undefined;
  const read = callback?.get;
  if (!callback || !read) return document;
  const declared = (Array.isArray(read.parameters) ? read.parameters : []) as Record<
    string,
    unknown
  >[];
  const parameters = [
    ...declared.map((parameter) =>
      parameter.name === "code" && parameter.in === "query"
        ? { ...parameter, required: false }
        : parameter,
    ),
    ...IDENTITY_PROVIDER_CALLBACK_PARAMETERS.filter(
      (name) => !declared.some((parameter) => parameter.name === name),
    ).map((name) => ({ name, in: "query", required: false, schema: { type: "string" } })),
  ];
  paths["/auth/callback"] = { ...callback, get: { ...read, parameters } };
  return { ...document, paths };
}

/**
 * The two upload addresses, whose multipart submissions the boundary hands on unread
 * (decision record 0021). The handler reads the submission into the upload working directory
 * itself (R-8.16) and checks it against the contract's FileUpload — a name, a read-access
 * statement and a file — refusing what is missing or malformed as the requester's error, named
 * (R-8.18, R-8.23, R-8.24). Validating it here would mean reading it twice and answering those
 * refusals in the validator's words instead.
 */
export const UPLOAD_ROUTES = /^\/api\/(files|avatars)\/?(\?.*)?$/;

export function isUploadRoute(path: string): boolean {
  return UPLOAD_ROUTES.test(path);
}

/**
 * A file's address, `/api/files/{id}`, takes any identifier rather than only a well-formed one,
 * because a malformed identifier is answered exactly as one no file carries — not authorized,
 * or not found for an administrator (R-8.12) — rather than as a malformed request.
 */
export function withAnyFileIdentifier(document: ContractDocument): ContractDocument {
  const paths = { ...((document.paths as Record<string, unknown>) ?? {}) };
  const file = paths["/api/files/{id}"] as Record<string, Record<string, unknown>> | undefined;
  const read = file?.get;
  if (!file || !read) return document;
  const parameters = (Array.isArray(read.parameters) ? read.parameters : []).map(
    (parameter: Record<string, unknown>) =>
      parameter.$ref === "#/components/parameters/PathId"
        ? { name: "id", in: "path", required: true, schema: { type: "string" } }
        : parameter,
  );
  paths["/api/files/{id}"] = { ...file, get: { ...read, parameters } };
  return { ...document, paths };
}

/**
 * A page is changed and removed at `/api/content/{id}` by its identifier or by its address,
 * as it is read there (R-7.4), so `updateContent` and `deleteContent` take any string rather
 * than only an identifier. The handler reads the value the way reading does, and refuses
 * anybody but an administrator before it looks at the value at all, so a refusal for lack of
 * permission takes the same shape whatever page is named (R-7.16; decision record 0025).
 */
export function withAnyPageReference(document: ContractDocument): ContractDocument {
  const paths = { ...((document.paths as Record<string, unknown>) ?? {}) };
  const page = paths["/api/content/{id}"] as Record<string, Record<string, unknown>> | undefined;
  if (!page) return document;
  const relaxed = { ...page };
  for (const method of ["put", "delete"] as const) {
    const operation = page[method];
    if (!operation) continue;
    const parameters = (Array.isArray(operation.parameters) ? operation.parameters : []).map(
      (parameter: Record<string, unknown>) =>
        parameter.$ref === "#/components/parameters/PathId"
          ? { name: "id", in: "path", required: true, schema: { type: "string" } }
          : parameter,
    );
    relaxed[method] = { ...operation, parameters };
  }
  paths["/api/content/{id}"] = relaxed;
  return { ...document, paths };
}

/**
 * The contact list's two parameters are comma-separated lists (exportContactList). The
 * validator otherwise insists a comma in a query value be written `%2C`, and refuses
 * `?userTypes=GOV,VENDOR` — the form the service the contract was recovered from answered, and
 * the one observables.yaml writes the address in. The comma is allowed as written here; the
 * lists are still required and still strings, and what they may name is checked by the handler
 * (R-4.32).
 */
export function withContactListsAsWritten(document: ContractDocument): ContractDocument {
  const paths = { ...((document.paths as Record<string, unknown>) ?? {}) };
  const contactList = paths["/api/contact-list"] as Record<string, Record<string, unknown>> | undefined;
  const read = contactList?.get;
  if (!contactList || !read) return document;
  const parameters = (Array.isArray(read.parameters) ? read.parameters : []).map(
    (parameter: Record<string, unknown>) =>
      parameter.in === "query" ? { ...parameter, allowReserved: true } : parameter,
  );
  paths["/api/contact-list"] = { ...contactList, get: { ...read, parameters } };
  return { ...document, paths };
}

export function withoutTestOnlyRoutes(
  document: ContractDocument,
): ContractDocument {
  const paths = { ...((document.paths as Record<string, unknown>) ?? {}) };
  for (const route of TEST_ONLY_ROUTES) delete paths[route];
  return { ...document, paths };
}
