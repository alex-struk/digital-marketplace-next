import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import knexFactory, { Knex } from "knex";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaService } from "../src/prisma/prisma.service";
import { PrismaPageStore } from "../src/content/prisma-page.store";
import { ContentService } from "../src/content/content.service";
import { ContentController } from "../src/content/content.controller";
import { ManagedPage } from "../src/content/page";
import { freePort } from "./free-port";

/**
 * Reading a page over the kept schema itself: the migration history is run, a page is put
 * there the way the service puts one there, and the route answers.
 *
 * PostgreSQL here is PGlite — the same engine, in process — so this needs nothing but Node.
 */
let url = "";
const ADMINISTRATOR = "00000000-0000-4000-8000-000000000101";
const ORDINARY_PAGE = "00000000-0000-4000-8000-000000000501";

let database: PGlite;
let socket: PGLiteSocketServer;
let knex: Knex;
let prisma: PrismaService;
let controller: ContentController;

beforeAll(async () => {
  const PORT = await freePort();
  url = `postgresql://postgres:postgres@127.0.0.1:${PORT}/postgres`;
  database = await PGlite.create();
  socket = new PGLiteSocketServer({ db: database, port: PORT, host: "127.0.0.1" });
  await socket.start();

  knex = knexFactory({
    client: "pg",
    connection: url,
    pool: { min: 1, max: 1 },
    migrations: {
      directory: path.resolve(__dirname, "../../migrations/migrations"),
      loadExtensions: [".cjs"],
    },
  });
  await knex.migrate.latest();

  await knex("users").insert({
    id: ADMINISTRATOR,
    createdAt: new Date(),
    updatedAt: new Date(),
    type: "ADMIN",
    status: "ACTIVE",
    name: "Robin Placeholder",
    email: "admin.one@example.test",
    idpUsername: "test-admin",
    idpId: "test-admin",
  });
  await knex("content").insert({
    id: ORDINARY_PAGE,
    createdAt: new Date("2026-01-05T17:00:00Z"),
    createdBy: ADMINISTRATOR,
    slug: "about-us",
    fixed: false,
  });
  await knex("contentVersions").insert([
    {
      id: 1,
      contentId: ORDINARY_PAGE,
      title: "About us",
      body: "The first version of this page.",
      createdAt: new Date("2026-01-05T17:00:00Z"),
      createdBy: ADMINISTRATOR,
    },
    {
      id: 2,
      contentId: ORDINARY_PAGE,
      title: "About us",
      body: "The third and current version, with a **formatted** word in it.",
      createdAt: new Date("2026-01-07T17:00:00Z"),
      createdBy: ADMINISTRATOR,
    },
  ]);

  // PGlite answers one connection at a time, so the tool that set the database up lets go
  // of it before the service takes it.
  await knex.destroy();

  prisma = new PrismaService({ datasourceUrl: url });
  controller = new ContentController(
    new ContentService(new PrismaPageStore(prisma)),
    { readingAccount: async () => null },
  );
}, 120_000);

afterAll(async () => {
  await prisma?.$disconnect();
  await socket?.stop();
  await database?.close();
});

describe("a page read by its address (R-7.1)", () => {
  it("comes back with its title, its current body and both of its dates", async () => {
    const page = await controller.read("about-us");

    expect(page.title).toBe("About us");
    expect(page.body).toBe(
      "The third and current version, with a **formatted** word in it.",
    );
    expect(page.createdAt).toBe("2026-01-05T17:00:00.000Z");
    expect(page.updatedAt).toBe("2026-01-07T17:00:00.000Z");
    expect(page.fixed).toBe(false);
  });

  it("comes back for a page the service made for itself, at its placeholder wording", async () => {
    const page = await controller.read("privacy");

    expect(page.title).toBe("privacy");
    expect(page.body).toBe("Initial version");
    expect(page.fixed).toBe(true);
  });

  it("comes back for the service level agreement page, which nobody has written (R-7.18)", async () => {
    const page = await controller.read("service-level-agreement");
    const privacy = await controller.read("privacy");

    expect(page.title).toBe("service-level-agreement");
    expect(page.body).toBe("Initial version");
    expect(page.fixed).toBe(true);
    // Dated as the installation is.
    expect(page.createdAt).toBe(privacy.createdAt);
  });
});

describe("a page read by its identifier (R-7.4)", () => {
  it("is the same page", async () => {
    const byAddress = await controller.read("about-us");
    const byIdentifier = await controller.read(ORDINARY_PAGE);

    expect(byIdentifier).toEqual(byAddress);
  });
});

describe("an address that holds no page (R-7.2, R-7.3)", () => {
  it("is answered as not found", async () => {
    await expect(controller.read("nothing-here")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("is refused as malformed when it is not a well-formed address", async () => {
    await expect(controller.read("Not_A_Slug")).rejects.toMatchObject({
      status: 400,
    });
  });

  it("is answered as not found for an identifier no page carries", async () => {
    await expect(
      controller.read("00000000-0000-4000-8000-000000000999"),
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe("the list of pages on a fresh installation (R-7.5, R-7.12)", () => {
  it("carries the twenty-two pages the service needs, each titled by its address and holding the placeholder", async () => {
    const asAdministrator = new ContentController(
      new ContentService(new PrismaPageStore(prisma)),
      { readingAccount: async () => ({ id: ADMINISTRATOR, type: "ADMIN" }) },
    );
    const pages = await asAdministrator.list({} as never);
    const needed = pages.filter((page) => page.fixed);

    expect(needed).toHaveLength(22);
    for (const page of needed) {
      expect(page.title).toBe(page.slug);
      expect(page.body).toBe("Initial version");
    }
    // The service level agreement page is answered, not stored, so it is not listed.
    expect(pages.map((page) => page.slug)).not.toContain("service-level-agreement");
    // Every page once, the administrator's own among them, in order of title.
    expect(pages).toHaveLength(23);
    expect(pages.map((page) => page.slug)).toContain("about-us");
    const titles = pages.map((page) => page.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b, "en")));
  });

  it("is refused to anyone who is not an administrator", async () => {
    await expect(controller.list({} as never)).rejects.toMatchObject({ status: 401 });
  });
});

describe("an administrator writing the service level agreement page (R-7.18, R-7.25)", () => {
  it("stores it as a page the service needs, at its own address, authored by them", async () => {
    const asAdministrator = new ContentController(
      new ContentService(new PrismaPageStore(prisma)),
      { readingAccount: async () => ({ id: ADMINISTRATOR, type: "ADMIN" }) },
    );
    const answered = (await asAdministrator.read("service-level-agreement", {} as never)) as ManagedPage;
    expect(answered.createdBy).toBeNull();
    expect(answered.updatedBy).toBeNull();
    await expect(asAdministrator.remove(answered.id, {} as never)).rejects.toMatchObject({ status: 400 });

    const written = await asAdministrator.change(
      answered.id,
      { title: "Service level agreement", slug: "service-level-agreement", body: "What we commit to." },
      {} as never,
    );

    expect(written.id).not.toBe("service-level-agreement");
    expect(written.fixed).toBe(true);
    expect(written.updatedBy).toEqual({ id: ADMINISTRATOR, name: "Robin Placeholder" });
    const read = await controller.read("service-level-agreement");
    expect(read.body).toBe("What we commit to.");
    expect(read.id).toBe(written.id);
  });
});
