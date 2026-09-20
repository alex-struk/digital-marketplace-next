import path from "node:path";
import { INestApplication } from "@nestjs/common";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import knexFactory from "knex";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * The service as it is started, answering over HTTP, over the schema its own migrations
 * made: the walking skeleton, end to end, with nothing stood in for.
 *
 * PostgreSQL is PGlite — the same engine, in process — so this needs no container.
 */
const DB_PORT = 55435;
const url = `postgresql://postgres:postgres@127.0.0.1:${DB_PORT}/postgres`;

let database: PGlite;
let socket: PGLiteSocketServer;
let app: INestApplication;
let origin: string;

beforeAll(async () => {
  database = await PGlite.create();
  socket = new PGLiteSocketServer({ db: database, port: DB_PORT, host: "127.0.0.1" });
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
  // PGlite answers one connection at a time, so the tool that ran the migrations lets go of
  // it before the service takes it.
  await knex.destroy();

  process.env.DATABASE_URL = url;
  process.env.CONTRACT_PATH = path.resolve(
    __dirname,
    "../../../spec/contract/openapi.yaml",
  );
  const { createApplication } = await import("../src/application");
  app = await createApplication();
  await app.listen(0, "127.0.0.1");
  origin = await app.getUrl();
}, 120_000);

afterAll(async () => {
  await app?.close();
  await socket?.stop();
  await database?.close();
});

describe("the service, started", () => {
  it("reports that it is up, and needs no session to do it", async () => {
    const answer = await fetch(`${origin}/status`);

    expect(answer.status).toBe(200);
    expect(await answer.text()).toBe("OK");
  });

  it("answers with a page the installation carries for itself (R-7.1, R-7.12)", async () => {
    const answer = await fetch(`${origin}/api/content/privacy`);

    expect(answer.status).toBe(200);
    expect(await answer.json()).toMatchObject({
      slug: "privacy",
      title: "privacy",
      body: "Initial version",
      fixed: true,
    });
  });

  it("answers at the address the service level agreement link leads to (R-7.18)", async () => {
    const answer = await fetch(`${origin}/api/content/service-level-agreement`);

    expect(answer.status).toBe(200);
    expect(await answer.json()).toMatchObject({ slug: "service-level-agreement" });
  });

  it("answers at each of the footer's five addresses (R-7.19)", async () => {
    for (const slug of ["about", "disclaimer", "privacy", "accessibility", "copyright"]) {
      const answer = await fetch(`${origin}/api/content/${slug}`);
      expect(answer.status, slug).toBe(200);
    }
  });

  it("answers an address no page holds as not found (R-7.2)", async () => {
    const answer = await fetch(`${origin}/api/content/nothing-here`);

    expect(answer.status).toBe(404);
    expect(await answer.json()).toEqual({
      errors: ["No page is held at that address."],
    });
  });

  it("refuses an address that is not well formed as malformed (R-7.3)", async () => {
    const answer = await fetch(`${origin}/api/content/Not_A_Slug`);

    expect(answer.status).toBe(400);
    expect(await answer.json()).toHaveProperty("errors");
  });

  it("answers nothing at an address the contract does not carry", async () => {
    expect((await fetch(`${origin}/api/not-a-resource`)).status).toBe(404);
    expect((await fetch(`${origin}/auth/createsessionadmin`)).status).toBe(404);
  });
});
