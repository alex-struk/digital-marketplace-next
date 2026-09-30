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
      "accessTokenLifespan",
      "ssoSessionIdleTimeout",
      "ssoSessionMaxLifespan",
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

type RealmUser = {
  username: string;
  email?: string;
  attributes?: Record<string, string[]>;
};

type RealmClient = {
  clientId: string;
  publicClient: boolean;
  secret?: string;
  redirectUris: string[];
  webOrigins: string[];
  attributes: Record<string, string>;
  protocolMappers?: { protocolMapper: string; config: Record<string, string> }[];
};

describe("signing in through the sandbox realm (R-4.1, decision record 0004)", () => {
  const { users, clients, components } = realm as {
    users: RealmUser[];
    clients: RealmClient[];
    components?: Record<string, { providerId: string; config: Record<string, string[]> }[]>;
  };
  const manifest = readFileSync(path.resolve(composeDir, "../../tests/seed/manifest.yaml"), "utf8");
  const personas = readFileSync(
    path.resolve(composeDir, "../../spec/contract/personas.yaml"),
    "utf8",
  );

  it("carries every account the seed manifest names as reachable, and every persona's username", () => {
    const usernames = new Set(users.map((user) => user.username));
    const seeded = [...manifest.matchAll(/^\s+idp_id: ([a-z0-9-]+)\s*$/gm)]
      .map((match) => match[1] ?? "")
      .filter((id) => id !== "migration_user");
    const signIns = [...personas.matchAll(/sandbox-idp: \{ username: ([a-z0-9-]+) \}/g)].map(
      (match) => match[1] ?? "",
    );

    expect([...seeded, ...signIns].filter((name) => !usernames.has(name))).toEqual([]);
  });

  it("gives every account a kind of identity the service recognises", () => {
    for (const user of users) {
      expect(["idir", "github"], user.username).toContain(user.attributes?.identity_provider?.[0]);
    }
    const kindOf = (name: string) =>
      users.find((user) => user.username === name)?.attributes?.identity_provider?.[0];
    expect(kindOf("first-time-gov")).toBe("idir");
    expect(kindOf("first-time-vendor")).toBe("github");
    expect(kindOf("test-admin")).toBe("idir");
    expect(kindOf("test-vendor-1")).toBe("github");
  });

  it("leaves the account with no address without one, as the identity provider shares none", () => {
    expect(users.find((user) => user.username === "test-vendor-7")?.email).toBeUndefined();
  });

  it("puts the kind of identity in the token, and names the app's client as its audience", () => {
    const client = clients.find((each) => each.clientId === "digital-marketplace-app");
    const mappers = client?.protocolMappers ?? [];

    expect(
      mappers.find((mapper) => mapper.protocolMapper === "oidc-usermodel-attribute-mapper")?.config,
    ).toMatchObject({
      "user.attribute": "identity_provider",
      "claim.name": "identity_provider",
      "access.token.claim": "true",
    });
    expect(
      mappers.find((mapper) => mapper.protocolMapper === "oidc-audience-mapper")?.config,
    ).toMatchObject({ "included.client.audience": "digital-marketplace-app" });
  });

  it("is a public client under PKCE, holding no secret, answering only the app's origin", () => {
    const client = clients.find((each) => each.clientId === "digital-marketplace-app");

    expect(client?.publicClient).toBe(true);
    expect(client?.secret).toBeUndefined();
    expect(client?.attributes["pkce.code.challenge.method"]).toBe("S256");
    expect(client?.redirectUris).toEqual(["http://localhost:4300/*"]);
    expect(client?.webOrigins).toEqual(["http://localhost:4300"]);
    expect(client?.attributes["post.logout.redirect.uris"]).toBe("http://localhost:4300/*");
  });

  it("declares a user profile that requires nothing, and keeps the identity attributes", () => {
    const provider = components?.["org.keycloak.userprofile.UserProfileProvider"]?.[0];
    expect(provider?.providerId).toBe("declarative-user-profile");
    const profile = JSON.parse(provider?.config["kc.user.profile.config"]?.[0] ?? "{}") as {
      attributes: { name: string; required?: unknown }[];
    };
    const names = profile.attributes.map((attribute) => attribute.name);

    expect(names).toEqual(
      expect.arrayContaining(["username", "email", "firstName", "lastName", "identity_provider"]),
    );
    // Nothing is required, so no account is stopped at sign-in to fill in a missing email
    // address or name.
    expect(profile.attributes.filter((attribute) => attribute.required)).toEqual([]);
  });
});

describe("the settings the service starts with in the sandbox", () => {
  const environment = (name: string) =>
    (service(name) as Service & { environment?: Record<string, string> }).environment ?? {};

  it("checks tokens against the realm the browser signs in to, reading its keys over the network", () => {
    expect(environment("backend")).toMatchObject({
      OIDC_ISSUER: "http://localhost:8080/realms/digital-marketplace",
      OIDC_JWKS_URI: "http://idp:8080/realms/digital-marketplace/protocol/openid-connect/certs",
      OIDC_CLIENT_ID: "digital-marketplace-app",
    });
    expect(environment("frontend")).toMatchObject({
      OIDC_ISSUER: "http://localhost:8080/realms/digital-marketplace",
      OIDC_CLIENT_ID: "digital-marketplace-app",
    });
  });

  it("sends mail from the configured sender, marked as a test, through the hold proxy (R-6.3, R-6.4)", () => {
    expect(environment("backend")).toMatchObject({
      MAILER_FROM: "Digital Marketplace <donotreply@example.test>",
      SHOW_TEST_INDICATOR: "1",
      SMTP_HOST: "mail-hold",
    });
    expect(environment("mail")).toMatchObject({ MP_ENABLE_CHAOS: "true" });
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

  it("publishes the mail catcher's API on 8025 through one front, with nothing else there", () => {
    const onMail = publishedPorts().filter(({ host }) => host === "8025");

    expect(onMail.map(({ service }) => service)).toEqual(["mail-api"]);
  });

  it("starts the identity provider only once the realm has been rendered with a password", () => {
    // Without this the identity provider comes up with accounts nobody can sign in as,
    // which fails later and less legibly than not coming up at all.
    expect(service("idp").depends_on).toMatchObject({
      "idp-realm": { condition: "service_completed_successfully" },
    });
  });
});
