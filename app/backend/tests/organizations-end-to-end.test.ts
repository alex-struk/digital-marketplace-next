import { createServer, Server } from "node:http";
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { INestApplication } from "@nestjs/common";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import knexFactory from "knex";
import { PNG } from "pngjs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CLIENT_ID, ISSUER, testRealm, TestRealm } from "./realm";
import { freePort } from "./free-port";

/**
 * Organizations against the service as it is started: over the schema its own migrations made
 * with the acceptance suite's seed applied, through the boundary that checks every request
 * against the contract. Logos go through the same image route as profile pictures.
 */
const SEED_DIR = path.resolve(__dirname, "../../../tests/seed");
const QUALIFIED = "00000000-0000-4000-8000-000000000301"; // Northern Pines: owner test-vendor-2, admin -3, member -4
const UNQUALIFIED = "00000000-0000-4000-8000-000000000302"; // Cedar Hollow: owner test-vendor-1
const ARCHIVED = "00000000-0000-4000-8000-000000000303"; // Harbour Lantern: owner test-vendor-2
const PENDING_INVITATION = "00000000-0000-4000-8000-000000000304"; // Salt Marsh: owner test-vendor-2
const ADMINISTRATOR_ID = "00000000-0000-4000-8000-000000000101";

let database: PGlite;
let socket: PGLiteSocketServer;
let keyServer: Server;
let realm: TestRealm;
let app: INestApplication;
let origin: string;

beforeAll(async () => {
  const port = await freePort();
  const url = `postgresql://postgres:postgres@127.0.0.1:${port}/postgres`;
  database = await PGlite.create();
  socket = new PGLiteSocketServer({ db: database, port, host: "127.0.0.1" });
  await socket.start();

  const knex = knexFactory({
    client: "pg",
    connection: url,
    pool: { min: 1, max: 1 },
    migrations: {
      directory: path.resolve(__dirname, "../../migrations/migrations"),
      loadExtensions: [".cjs"],
    },
  });
  await knex.migrate.latest();
  for (const file of readdirSync(SEED_DIR).filter((name) => name.endsWith(".sql")).sort()) {
    await knex.raw(readFileSync(path.join(SEED_DIR, file), "utf8"));
  }
  await knex.destroy();

  realm = await testRealm();
  keyServer = createServer((request, response) => {
    request.resume();
    request.on("end", () => {
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify(realm.jwks));
    });
  });
  await new Promise<void>((resolve) => keyServer.listen(0, "127.0.0.1", resolve));
  const keyAddress = keyServer.address();
  const keyPort = typeof keyAddress === "object" && keyAddress ? keyAddress.port : 0;

  Object.assign(process.env, {
    DATABASE_URL: `${url}?connection_limit=1`,
    CONTRACT_PATH: path.resolve(__dirname, "../../../spec/contract/openapi.yaml"),
    OIDC_ISSUER: ISSUER,
    OIDC_CLIENT_ID: CLIENT_ID,
    OIDC_JWKS_URL: `http://127.0.0.1:${keyPort}/certs`,
    OIDC_BACKCHANNEL_URL: `http://127.0.0.1:${keyPort}`,
    DISABLE_NOTIFICATIONS: "1",
    SERVICE_ORIGIN: "http://localhost:4300",
    FILE_UPLOADS_DIR: mkdtempSync(path.join(tmpdir(), "dm-uploads-test-")),
  });
  const { createApplication } = await import("../src/application");
  app = await createApplication();
  await app.listen(0, "127.0.0.1");
  origin = await app.getUrl();
}, 120_000);

afterAll(async () => {
  await app?.close();
  await new Promise<void>((resolve) => (keyServer ? keyServer.close(() => resolve()) : resolve()));
  await socket?.stop();
  await database?.close();
});

const vendorToken = (username: string) =>
  realm.token({ preferred_username: username, identity_provider: "bceid", sid: username });
const tokens = {
  admin: () => realm.token({ preferred_username: "test-admin", identity_provider: "idir", sid: "admin" }),
  staff: () => realm.token({ preferred_username: "test-gov", identity_provider: "idir", sid: "staff" }),
  vendorOne: () => vendorToken("test-vendor-1"),
  owner: () => vendorToken("test-vendor-2"),
  orgAdmin: () => vendorToken("test-vendor-3"),
  member: () => vendorToken("test-vendor-4"),
  termsReset: () => vendorToken("test-vendor-10"),
};

async function ask(method: string, address: string, token?: string, body?: unknown) {
  const answer = await fetch(`${origin}${address}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await answer.text();
  return { status: answer.status, body: text ? JSON.parse(text) : null };
}

async function uploadLogo(token: string, name: string, content: Uint8Array) {
  const form = new FormData();
  form.append("name", name);
  form.append("metadata", JSON.stringify([{ tag: "any" }]));
  form.append("file", new Blob([content]), name);
  const answer = await fetch(`${origin}/api/avatars`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: form,
  });
  const text = await answer.text();
  return { status: answer.status, body: text ? JSON.parse(text) : null };
}

function png(width: number, height: number): Uint8Array {
  const image = new PNG({ width, height });
  image.data.fill(180);
  return PNG.sync.write(image);
}

const profile = {
  legalName: "Aaron's Test Co-operative",
  streetAddress1: "100 Example Street",
  city: "Victoria",
  region: "British Columbia",
  mailCode: "V0V 0V0",
  country: "Canada",
  contactName: "Alex Placeholder",
  contactEmail: "vendor.one@example.test",
};

const names = (listing: { legalName: string }[]) => listing.map((entry) => entry.legalName);

describe("the organization list (R-3.1, R-3.21)", () => {
  it("lists every organization that is not archived, by legal name, to a visitor, with nothing but its public details", async () => {
    const listed = await ask("GET", "/api/organizations");
    expect(listed.status).toBe(200);
    const listedNames = names(listed.body);
    expect(listedNames).toContain("Northern Pines Digital Ltd.");
    expect(listedNames).not.toContain("Harbour Lantern Consulting Ltd.");
    expect([...listedNames].sort((a, b) => a.localeCompare(b, "en-CA", { sensitivity: "base" }))).toEqual(listedNames);
    for (const row of listed.body) {
      expect(Object.keys(row).sort()).toEqual(["active", "id", "legalName", "logoImageFile", "serviceAreas"]);
    }
  });

  it("tells a vendor the owner, team size and qualification of the organizations they own or administer only", async () => {
    const listed = (await ask("GET", "/api/organizations", await tokens.orgAdmin())).body;
    expect(listed.find((row: { id: string }) => row.id === QUALIFIED)).toMatchObject({
      owner: { name: "Blake Placeholder" },
      numTeamMembers: 3,
      swuQualified: true,
      twuQualified: true,
    });
    expect(listed.find((row: { id: string }) => row.id === UNQUALIFIED).owner).toBeUndefined();
    const asMember = (await ask("GET", "/api/organizations", await tokens.member())).body;
    expect(asMember.find((row: { id: string }) => row.id === QUALIFIED).owner).toBeUndefined();
  });

  it("tells an administrator every organization's details, and public sector staff none", async () => {
    const asAdministrator = (await ask("GET", "/api/organizations", await tokens.admin())).body;
    expect(asAdministrator.every((row: { numTeamMembers?: number }) => typeof row.numTeamMembers === "number")).toBe(true);
    const asStaff = (await ask("GET", "/api/organizations", await tokens.staff())).body;
    expect(asStaff.every((row: { owner?: unknown }) => row.owner === undefined)).toBe(true);
  });
});

describe("the organizations a vendor may act for (R-3.15, R-3.20)", () => {
  it("are those the vendor owns or administers and that are not archived", async () => {
    const owner = await ask("GET", "/api/ownedOrganizations", await tokens.owner());
    expect(owner.status).toBe(200);
    expect(owner.body.map((row: { id: string }) => row.id).sort()).toEqual([QUALIFIED, PENDING_INVITATION].sort());
    expect((await ask("GET", "/api/ownedOrganizations", await tokens.orgAdmin())).body.map((row: { id: string }) => row.id)).toEqual([QUALIFIED]);
    expect((await ask("GET", "/api/ownedOrganizations", await tokens.member())).body).toEqual([]);
  });

  it("are refused as not permitted, in the service's one refusal shape, to anyone but a signed-in vendor", async () => {
    for (const token of [undefined, await tokens.staff(), await tokens.admin()]) {
      const refused = await ask("GET", "/api/ownedOrganizations", token);
      expect(refused.status).toBe(401);
      expect(refused.body).toEqual({ errors: [expect.stringContaining("Only a signed-in vendor")] });
    }
  });
});

describe("reading an organization in full (R-3.3)", () => {
  it("answers its owner, its administrator and a service administrator, and refuses an ordinary member, staff and a visitor", async () => {
    for (const token of [await tokens.owner(), await tokens.orgAdmin(), await tokens.admin()]) {
      const read = await ask("GET", `/api/organizations/${QUALIFIED}`, token);
      expect(read.status).toBe(200);
      expect(read.body).toMatchObject({ id: QUALIFIED, contactPhone: "250-555-0101", numTeamMembers: 3 });
    }
    for (const token of [await tokens.member(), await tokens.staff(), undefined]) {
      expect((await ask("GET", `/api/organizations/${QUALIFIED}`, token)).status).toBe(401);
    }
  });
});

describe("registering, with a logo (R-3.2, R-3.22, R-3.23, R-8.13, R-8.21, R-8.28, R-8.30)", () => {
  it("refuses public sector staff, an administrator, a visitor and a vendor whose terms acceptance has been withdrawn, under permissions", async () => {
    for (const token of [await tokens.staff(), await tokens.admin(), await tokens.termsReset(), undefined]) {
      const refused = await ask("POST", "/api/organizations", token, profile);
      expect(refused.status).toBe(401);
      expect(refused.body).toEqual({ permissions: [expect.any(String)] });
    }
  });

  it("refuses a blank legal name and a malformed email, naming each field", async () => {
    const refused = await ask("POST", "/api/organizations", await tokens.vendorOne(), {
      ...profile,
      legalName: "",
      contactEmail: "not-an-email",
    });
    expect(refused.status).toBe(400);
    expect(refused.body.errors).toEqual([
      expect.stringMatching(/^Legal name:/),
      expect.stringMatching(/^Contact email address:/),
    ]);
  });

  it("refuses a logo named other than .jpg, .jpeg or .png, and one whose content is not an image", async () => {
    const gif = await uploadLogo(await tokens.vendorOne(), "logo.gif", png(10, 10));
    expect(gif.status).toBe(400);
    const notAnImage = await uploadLogo(await tokens.vendorOne(), "logo.png", new TextEncoder().encode("not an image"));
    expect(notAnImage.status).toBe(400);
  });

  it("registers the organization with its logo narrowed to 500 pixels, the vendor its owner, and shows the logo to anyone", async () => {
    const logo = await uploadLogo(await tokens.vendorOne(), "logo.PNG", png(2000, 300));
    expect(logo.status).toBe(201);
    const created = await ask("POST", "/api/organizations", await tokens.vendorOne(), { ...profile, logoImageFile: logo.body.id });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      legalName: profile.legalName,
      active: true,
      logoImageFile: logo.body.id,
      numTeamMembers: 1,
      owner: { id: "00000000-0000-4000-8000-000000000201" },
      websiteUrl: null,
      contactPhone: null,
    });

    const publicRow = (await ask("GET", "/api/organizations")).body.find((row: { id: string }) => row.id === created.body.id);
    expect(publicRow.logoImageFile).toBe(logo.body.id);
    const content = await fetch(`${origin}/api/files/${logo.body.id}?type=blob`);
    expect(content.status).toBe(200);
    const stored = PNG.sync.read(Buffer.from(await content.arrayBuffer()));
    expect([stored.width, stored.height]).toEqual([500, 75]);

    const memberships = await ask("GET", "/api/affiliations", await tokens.vendorOne());
    expect(memberships.status).toBe(200);
    expect(memberships.body.find((row: { organization: { id: string } }) => row.organization.id === created.body.id)).toMatchObject({
      membershipType: "OWNER",
      membershipStatus: "ACTIVE",
      organization: { numTeamMembers: 1 },
    });
    expect((await ask("GET", "/api/ownedOrganizations", await tokens.vendorOne())).body.map((row: { id: string }) => row.id)).toContain(
      created.body.id,
    );
  });
});

describe("changing the profile (R-3.18, R-3.19)", () => {
  const current = {
    legalName: "Northern Pines Digital Ltd.",
    websiteUrl: "https://northern-pines.example.test",
    streetAddress1: "100 Placeholder Way",
    city: "Victoria",
    region: "BC",
    mailCode: "V0V0V0",
    country: "Canada",
    contactName: "Blake Placeholder",
    contactTitle: "Managing Director",
    contactEmail: "org.owner@example.test",
  };

  it("refuses the organization's administrator who is not its owner, a member, staff and a visitor, under permissions", async () => {
    for (const token of [await tokens.orgAdmin(), await tokens.member(), await tokens.staff(), undefined]) {
      const refused = await ask("PUT", `/api/organizations/${QUALIFIED}`, token, {
        tag: "updateProfile",
        value: { ...current, legalName: "Taken over" },
      });
      expect(refused.status).toBe(401);
      expect(refused.body).toEqual({ permissions: [expect.any(String)] });
    }
  });

  it("saves the contact phone number with the rest, and clearing it removes the number", async () => {
    const changed = await ask("PUT", `/api/organizations/${QUALIFIED}`, await tokens.owner(), {
      tag: "updateProfile",
      value: { ...current, contactPhone: "250-555-0199" },
    });
    expect(changed.status).toBe(200);
    expect(changed.body.contactPhone).toBe("250-555-0199");
    const cleared = await ask("PUT", `/api/organizations/${QUALIFIED}`, await tokens.owner(), {
      tag: "updateProfile",
      value: { ...current, contactPhone: "" },
    });
    expect(cleared.body.contactPhone).toBeNull();
    expect((await ask("GET", `/api/organizations/${QUALIFIED}`, await tokens.admin())).body.contactPhone).toBeNull();
  });
});

describe("archiving (R-3.6, R-3.18, R-3.24)", () => {
  it("is refused to the organization's administrator who is not its owner, a member, staff and a visitor, under permissions", async () => {
    for (const token of [await tokens.orgAdmin(), await tokens.member(), await tokens.staff(), undefined]) {
      const refused = await ask("DELETE", `/api/organizations/${QUALIFIED}`, token);
      expect(refused.status).toBe(401);
      expect(refused.body).toEqual({ permissions: [expect.any(String)] });
    }
  });

  it("takes it off the list and off its members' organizations, keeping it marked with the date and who did it", async () => {
    const archived = await ask("DELETE", `/api/organizations/${QUALIFIED}`, await tokens.admin());
    expect(archived.status).toBe(200);
    expect(archived.body).toMatchObject({ active: false, deactivatedBy: ADMINISTRATOR_ID });
    expect(Number.isNaN(Date.parse(archived.body.deactivatedOn))).toBe(false);

    expect((await ask("GET", "/api/organizations")).body.map((row: { id: string }) => row.id)).not.toContain(QUALIFIED);
    const memberOf = (await ask("GET", "/api/affiliations", await tokens.member())).body;
    expect(memberOf.map((row: { organization: { id: string } }) => row.organization.id)).not.toContain(QUALIFIED);
    expect((await ask("GET", "/api/ownedOrganizations", await tokens.owner())).body.map((row: { id: string }) => row.id)).toEqual([
      PENDING_INVITATION,
    ]);
    const record = await ask("GET", `/api/organizations/${QUALIFIED}`, await tokens.owner());
    expect(record.body).toMatchObject({ active: false, deactivatedBy: ADMINISTRATOR_ID });
    expect((await ask("DELETE", `/api/organizations/${QUALIFIED}`, await tokens.owner())).status).toBe(400);
    expect((await ask("GET", `/api/organizations/${ARCHIVED}`, await tokens.admin())).body.active).toBe(false);
  });
});
