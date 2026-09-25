import { readFileSync } from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { describe, expect, it } from "vitest";

/**
 * The sandbox's own composition, read as a file rather than run.
 *
 * A sandbox that does not start cannot be asked anything, so what the sandbox must get right
 * before it can answer at all is held here, where `check` reaches it without Docker: a realm
 * the identity provider will accept, and each address published where it was promised.
 *
 * Keycloak deserializes the realm file straight onto its own realm representation and rejects
 * any member it does not know. An explanatory `_comment` key at the head of the realm stopped
 * the import, and with the import the server, which then restarted and stopped again; the
 * whole run ended waiting on an identity provider that never came up. The prose that key held
 * now lives in app/compose/idp/README.md.
 */
const composeDir = path.resolve(__dirname, "../../compose");

const realm: unknown = JSON.parse(
  readFileSync(path.join(composeDir, "idp/realm-template.json"), "utf8"),
);

type Service = {
  ports?: string[];
  image?: string;
  command?: string[];
  depends_on?: unknown;
};

type Compose = { services: Record<string, Service | undefined> };

const compose = parseYaml(readFileSync(path.join(composeDir, "compose.yaml"), "utf8")) as Compose;

/** The definition of a service the sandbox cannot do without. */
function service(name: string): Service {
  const definition = compose.services[name];
  if (!definition) throw new Error(`app/compose/compose.yaml has no "${name}" service.`);
  return definition;
}

/** Every key in the document, at any depth, with the path that reaches it. */
function keysOf(value: unknown, at = ""): { key: string; at: string }[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => keysOf(item, `${at}[${index}]`));
  }
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, member]) => [
      { key, at: at === "" ? key : `${at}.${key}` },
      ...keysOf(member, at === "" ? key : `${at}.${key}`),
    ]);
  }
  return [];
}

/** Every host port the sandbox publishes, with the service that publishes it. */
function publishedPorts(): { service: string; host: string; container: string }[] {
  return Object.entries(compose.services).flatMap(([name, definition]) =>
    (definition?.ports ?? []).map((mapping) => {
      const [host = "", container = ""] = String(mapping).split(":");
      return { service: name, host, container };
    }),
  );
}

describe("the realm the sandbox identity provider imports", () => {
  it("carries no key of its own making, which would stop the import", () => {
    // Keycloak's representation classes are not marked as tolerating unknown members, so a
    // key added for a reader's benefit is a fatal error rather than something ignored.
    const invented = keysOf(realm).filter(({ key }) => key.startsWith("_"));

    expect(
      invented.map(({ at }) => at),
      "explain the realm in app/compose/idp/README.md, not in the realm file",
    ).toEqual([]);

    // The realm passing this only means something if the walk would have found such a key.
    expect(
      keysOf({ _comment: "x", users: [{ _note: "y" }] })
        .filter(({ key }) => key.startsWith("_"))
        .map(({ at }) => at),
    ).toEqual(["_comment", "users[0]._note"]);
  });

  it("names only realm properties Keycloak knows", () => {
    // Narrow on purpose: these are the members of Keycloak's RealmRepresentation this realm
    // sets. A later slice that needs another one adds its name here once it has checked the
    // spelling against Keycloak's own representation.
    const known = new Set([
      "realm",
      "enabled",
      "sslRequired",
      "registrationAllowed",
      "loginWithEmailAllowed",
      "duplicateEmailsAllowed",
      "resetPasswordAllowed",
      "editUsernameAllowed",
      "clients",
      "users",
      "roles",
      "groups",
      "components",
      "identityProviders",
      "identityProviderMappers",
      "clientScopes",
      "requiredActions",
      "attributes",
    ]);

    const unknown = Object.keys(realm as object).filter((key) => !known.has(key));

    expect(unknown, "not members of Keycloak's RealmRepresentation").toEqual([]);
  });

  it("holds the accounts the seed manifest names, each signing in as its identifier", () => {
    const { users } = realm as { users: { username: string; credentials: unknown[] }[] };

    expect(users.length).toBeGreaterThan(0);
    for (const user of users) {
      expect(user.username, "a username is the account's idp_id").toMatch(/^[a-z0-9-]+$/);
      expect(user.credentials, `${user.username} has a way to sign in`).toHaveLength(1);
    }
  });

  it("keeps the password out of the file, leaving a placeholder to be filled at start-up", () => {
    const rendered = JSON.stringify(realm);
    const placeholders = rendered.match(/__SANDBOX_PASSWORD__/g) ?? [];
    const { users } = realm as { users: unknown[] };

    expect(placeholders).toHaveLength(users.length);
  });
});

describe("the addresses the sandbox publishes", () => {
  it("answers the application on 4300, and lets nothing else take that port", () => {
    const onApp = publishedPorts().filter(({ host }) => host === "4300");

    expect(onApp.map(({ service }) => service)).toEqual(["frontend"]);
  });

  it("publishes the identity provider on 8080, where its realm endpoint is reached", () => {
    const onEighty = publishedPorts().filter(({ host }) => host === "8080");

    expect(onEighty.map(({ service }) => service)).toEqual(["idp"]);
    expect(onEighty.map(({ container }) => container)).toEqual(["8080"]);
    expect(service("idp").command).toContain("--http-port=8080");
  });

  it("starts the identity provider only once the realm has been rendered with a password", () => {
    // Without this the identity provider comes up with accounts nobody can sign in as,
    // which fails later and less legibly than not coming up at all.
    expect(service("idp").depends_on).toMatchObject({
      "idp-realm": { condition: "service_completed_successfully" },
    });
  });
});
