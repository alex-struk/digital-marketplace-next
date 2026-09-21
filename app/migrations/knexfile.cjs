"use strict";

/**
 * Knex is the only tool that changes the schema (decision record 0001, departure 1).
 * Prisma reads the result and never migrates it.
 *
 * The connection comes from the environment and is never written into a file.
 */
const connection =
  process.env.DATABASE_URL ||
  `postgres://${process.env.POSTGRES_USER || "postgres"}:${
    process.env.POSTGRES_PASSWORD || ""
  }@${process.env.POSTGRES_HOST || "localhost"}:${
    process.env.POSTGRES_PORT || "5432"
  }/${process.env.POSTGRES_DB || "digital_marketplace"}`;

/** @type {import("knex").Knex.Config} */
const config = {
  client: "pg",
  connection,
  pool: { min: 0, max: 5 },
  migrations: {
    directory: "./migrations",
    tableName: "knex_migrations",
    loadExtensions: [".cjs"],
  },
};

module.exports = {
  development: config,
  test: config,
  production: config,
  ...config,
};
