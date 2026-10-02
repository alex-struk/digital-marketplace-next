import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
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

/**
 * A value from the compose file as compose interpolates it: each `${NAME:-default}` takes the
 * variable when `vars` sets it and the default otherwise (decision record 0045).
 */
function interpolate(value: string, vars: Record<string, string> = {}): string {
  return value.replace(/\$\{([A-Z0-9_]+):-([^}]*)\}/g, (_, name: string, fallback: string) =>
    vars[name] ? vars[name] : fallback,
  );
}

/** Every host port the sandbox publishes, with the service that publishes it. */
function publishedPorts(
  vars: Record<string, string> = {},
): { service: string; host: string; container: string }[] {
  return Object.entries(compose.services).flatMap(([name, definition]) =>
    (definition?.ports ?? []).map((mapping) => {
      const [host = "", container = ""] = interpolate(String(mapping), vars).split(":");
      return { service: name, host, container };
    }),
  );
}

/** The realm as the idp-realm service renders it, run here outside its container. */
function renderRealm(env: Record<string, string>): unknown {
  const out = mkdtempSync(path.join(tmpdir(), "realm-"));
  try {
    execFileSync(process.execPath, [path.join(composeDir, "idp/render-realm.mjs")], {
      env: {
        PATH: process.env.PATH ?? "",
        REALM_TEMPLATE: path.join(composeDir, "idp/realm-template.json"),
        REALM_OUTPUT: path.join(out, "realm.json"),
        ...env,
      },
      stdio: "pipe",
    });
    return JSON.parse(readFileSync(path.join(out, "realm.json"), "utf8"));
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}

type RenderedClient = {
  redirectUris: string[];
  webOrigins: string[];
  attributes: Record<string, string>;
};

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
      // How long a sign-in lasts (app/compose/idp/README.md; decision record 0039).
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

describe("signing in to the sandbox realm (slice 2)", () => {
  type RealmUser = {
    username: string;
    email?: string;
    attributes?: Record<string, string[]>;
  };
  type Realm = {
    users: RealmUser[];
    clients: {
      clientId: string;
      publicClient?: boolean;
      protocolMappers?: { protocolMapper: string; config: Record<string, string> }[];
      attributes?: Record<string, string>;
    }[];
    components?: Record<string, { providerId: string; config: Record<string, string[]> }[]>;
  };
  const sandbox = realm as Realm;
  const personas = parseYaml(
    readFileSync(path.resolve(__dirname, "../../../spec/contract/personas.yaml"), "utf8"),
  ) as { personas: { id: string; sign_in: { "sandbox-idp"?: { username?: string } } | null }[] };

  it("carries every persona the acceptance suite signs in as", () => {
    const usernames = new Set(sandbox.users.map((user) => user.username));
    const wanted = personas.personas
      .map((persona) => persona.sign_in?.["sandbox-idp"]?.username)
      .filter((username): username is string => Boolean(username));

    expect(wanted.filter((username) => !usernames.has(username))).toEqual([]);
  });

  it("says of every account which way in it came, which decides the kind of account (R-4.1)", () => {
    for (const user of sandbox.users) {
      expect(["idir", "bceid", "github"], user.username).toContain(
        user.attributes?.identity_provider?.[0],
      );
    }
  });

  it("holds a first-time account with no email address, for R-4.1 and R-4.2", () => {
    const noEmail = sandbox.users.find((user) => user.username === "first-time-vendor-no-email");
    expect(noEmail).toBeDefined();
    expect(noEmail?.email).toBeUndefined();
  });

  it("puts the way in, and this client as audience, into every access token", () => {
    const client = sandbox.clients.find((c) => c.clientId === "digital-marketplace-app");
    expect(client?.publicClient).toBe(true);
    expect(client?.attributes?.["pkce.code.challenge.method"]).toBe("S256");
    const mappers = client?.protocolMappers ?? [];
    expect(mappers).toContainEqual(
      expect.objectContaining({
        protocolMapper: "oidc-usermodel-attribute-mapper",
        config: expect.objectContaining({
          "user.attribute": "identity_provider",
          "claim.name": "identity_provider",
          "access.token.claim": "true",
        }),
      }),
    );
    expect(mappers).toContainEqual(
      expect.objectContaining({
        protocolMapper: "oidc-audience-mapper",
        config: expect.objectContaining({ "included.client.audience": "digital-marketplace-app" }),
      }),
    );
  });

  it("does not ask an account with no email address for one when it signs in, and keeps its attributes", () => {
    // Keycloak's own default profile requires an email address of every user, which would stop
    // a persona without one at an "update your account" page instead of signing it in.
    const provider = sandbox.components?.["org.keycloak.userprofile.UserProfileProvider"]?.[0];
    expect(provider?.providerId).toBe("declarative-user-profile");
    const profile = JSON.parse(provider?.config["kc.user.profile.config"]?.[0] ?? "{}") as {
      attributes: { name: string; required?: unknown }[];
      unmanagedAttributePolicy?: string;
    };
    expect(profile.attributes.find((attribute) => attribute.name === "email")?.required).toBeUndefined();
    expect(profile.unmanagedAttributePolicy).toBe("ENABLED");
  });
});

describe("the mail path's settings in the sandbox (R-6.1 to R-6.4)", () => {
  type Env = Record<string, string>;
  const backend = compose.services.backend as Service & { environment: Env };
  const mail = compose.services.mail as Service & { environment: Env };

  it("sends from the one configured sender, marked as a test, and links to where the application answers", () => {
    expect(backend.environment.MAILER_FROM).toBe("Digital Marketplace <donotreply@example.test>");
    expect(backend.environment.SHOW_TEST_INDICATOR).toBe("1");
    expect(interpolate(backend.environment.SERVICE_ORIGIN!)).toBe("http://localhost:4300");
  });

  it("switches notifications off only when the environment asks", () => {
    expect(backend.environment.DISABLE_NOTIFICATIONS).toBe("${SDLC_ORACLE_DISABLE_NOTIFICATIONS:-0}");
  });

  it("lets a test make the mail catcher refuse delivery", () => {
    expect(mail.environment.MP_ENABLE_CHAOS).toBe("true");
  });

  it("checks tokens against the realm the browser signs in at", () => {
    expect(interpolate(backend.environment.OIDC_ISSUER!)).toBe(
      "http://localhost:8080/realms/digital-marketplace",
    );
    expect(backend.environment.OIDC_CLIENT_ID).toBe("digital-marketplace-app");
  });
});

describe("completing sign-in at the service (decision record 0015)", () => {
  type Env = Record<string, string>;
  const backend = compose.services.backend as Service & { environment: Env };
  const idp = compose.services.idp as Service & { environment: Env };

  it("exchanges the code over the compose network, where the browser's address does not reach", () => {
    expect(backend.environment.OIDC_BACKCHANNEL_URL).toBe("http://idp:8080/realms/digital-marketplace");
  });

  it("has the identity provider name itself as the browser reaches it, whoever asks", () => {
    // Otherwise a token the service asked for at idp:8080 would name that as its issuer, and
    // neither the service nor the browser renewing it would accept it.
    expect(interpolate(idp.environment.KC_HOSTNAME!)).toBe("http://localhost:8080");
    for (const vars of [{}, { SDLC_IDP_PORT: "8081" }] as Record<string, string>[]) {
      expect(`${interpolate(idp.environment.KC_HOSTNAME!, vars)}/realms/digital-marketplace`).toBe(
        interpolate(backend.environment.OIDC_ISSUER!, vars),
      );
    }
  });

  it("lets the browser back in at the address the service answers at", () => {
    const realmRenderer = compose.services["idp-realm"] as Service & { environment: Env };
    const client = (
      renderRealm({
        SDLC_SANDBOX_PASSWORD: "x",
        APP_ORIGIN: interpolate(realmRenderer.environment.APP_ORIGIN!),
      }) as { clients: RenderedClient[] }
    ).clients[0]!;
    expect(client.redirectUris).toEqual(["http://localhost:4300/*"]);
    expect(client.webOrigins).toEqual(["http://localhost:4300"]);
    expect(client.attributes["post.logout.redirect.uris"]).toBe("http://localhost:4300/*");
    expect(`${interpolate(backend.environment.SERVICE_ORIGIN!)}/auth/callback`).toMatch(
      /^http:\/\/localhost:4300\//,
    );
  });

  it("lets a copy on another port back in at its own address, and only there", () => {
    const vars = { SDLC_APP_PORT: "4301" };
    const realmRenderer = compose.services["idp-realm"] as Service & { environment: Env };
    const origin = interpolate(realmRenderer.environment.APP_ORIGIN!, vars);
    const client = (
      renderRealm({ SDLC_SANDBOX_PASSWORD: "x", APP_ORIGIN: origin }) as {
        clients: RenderedClient[];
      }
    ).clients[0]!;

    expect(origin).toBe("http://localhost:4301");
    expect(interpolate(backend.environment.SERVICE_ORIGIN!, vars)).toBe(origin);
    expect(client.redirectUris).toEqual(["http://localhost:4301/*"]);
    expect(client.webOrigins).toEqual(["http://localhost:4301"]);
    expect(client.attributes["post.logout.redirect.uris"]).toBe("http://localhost:4301/*");
  });

  it("builds the app knowing where the browser reaches the identity provider", () => {
    const frontend = compose.services.frontend as Service & {
      build: { args: Record<string, string> };
    };
    const dockerfile = readFileSync(path.resolve(composeDir, "../frontend/Dockerfile"), "utf8");
    const idp = compose.services.idp as Service & { environment: Env };

    expect(dockerfile).toMatch(/^ARG VITE_OIDC_URL=http:\/\/localhost:8080$/m);
    for (const vars of [{}, { SDLC_IDP_PORT: "8081" }] as Record<string, string>[]) {
      expect(interpolate(frontend.build.args.VITE_OIDC_URL!, vars)).toBe(
        interpolate(idp.environment.KC_HOSTNAME!, vars),
      );
    }
  });

  it("forwards /auth to the service rather than answering it as a screen", () => {
    const caddyfile = readFileSync(path.resolve(composeDir, "../frontend/Caddyfile"), "utf8");
    expect(caddyfile).toMatch(/handle \/auth\/\* \{\s*reverse_proxy/);
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

  it("publishes the mail catcher's front on 8025", () => {
    const onMail = publishedPorts().filter(({ host }) => host === "8025");

    expect(onMail.map(({ service }) => service)).toEqual(["mail-front"]);
  });

  it("publishes every host port from a variable, so copies can run side by side (decision record 0045)", () => {
    const vars = { SDLC_APP_PORT: "4301", SDLC_IDP_PORT: "8081", SDLC_MAIL_PORT: "8026" };
    const published = publishedPorts(vars).map(({ service, host }) => `${service}:${host}`);

    expect(published.sort()).toEqual(["frontend:4301", "idp:8081", "mail-front:8026"]);
    // The container's side does not move; only what the host sees does.
    expect(publishedPorts(vars).map(({ container }) => container).sort()).toEqual([
      "3000",
      "8025",
      "8080",
    ]);
  });

  it("starts the identity provider only once the realm has been rendered with a password", () => {
    // Without this the identity provider comes up with accounts nobody can sign in as,
    // which fails later and less legibly than not coming up at all.
    expect(service("idp").depends_on).toMatchObject({
      "idp-realm": { condition: "service_completed_successfully" },
    });
  });
});
