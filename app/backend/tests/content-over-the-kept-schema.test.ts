import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import knexFactory, { Knex } from "knex";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaService } from "../src/prisma/prisma.service";
import { PrismaPageStore } from "../src/content/prisma-page.store";
import { ContentService } from "../src/content/content.service";
import { ContentController } from "../src/content/content.controller";

/**
 * Reading a page over the kept schema itself: the migration history is run, a page is put
 * there the way the service puts one there, and the route answers.
 *
 * PostgreSQL here is PGlite — the same engine, in process — so this needs nothing but Node.
 */
const PORT = 55434;
const url = `postgresql://postgres:postgres@127.0.0.1:${PORT}/postgres`;
const ADMINISTRATOR = "00000000-0000-4000-8000-000000000101";
const ORDINARY_PAGE = "00000000-0000-4000-8000-000000000501";

let database: PGlite;
let socket: PGLiteSocketServer;
let knex: Knex;
let prisma: PrismaService;
let controller: ContentController;

beforeAll(async () => {
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
    const page = await controller.read("service-level-agreement");

    expect(page.title).toBe("service-level-agreement");
    expect(page.body).toBe("Initial version");
    expect(page.fixed).toBe(true);
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
