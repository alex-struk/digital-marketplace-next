"use strict";

/**
 * An organization's changelog (R-3.33): `affiliationEvents` records every grant and withdrawal
 * of administrator rights and every transfer of ownership, against the membership it concerns,
 * with when it happened and who made the change. The old application's table of that name did
 * the same; its event names are kept as `ADMIN_STATUS_GRANTED`, `ADMIN_STATUS_REVOKED` and
 * `OWNER_STATUS_GRANTED`.
 *
 * Created only where it is absent, so a database the old application left behind keeps its own.
 */

const EVENTS = ["ADMIN_STATUS_GRANTED", "ADMIN_STATUS_REVOKED", "OWNER_STATUS_GRANTED"];

/** @param {import("knex").Knex} knex */
exports.up = async function up(knex) {
  if (await knex.schema.hasTable("affiliationEvents")) return;
  await knex.schema.createTable("affiliationEvents", (columns) => {
    columns.uuid("id").primary();
    columns.uuid("affiliation").notNullable().references("id").inTable("affiliations").onDelete("CASCADE");
    columns.text("event").notNullable();
    columns.timestamp("createdAt", { useTz: true }).notNullable();
    columns.uuid("createdBy").references("id").inTable("users");
  });
  await knex.raw(
    `ALTER TABLE "affiliationEvents" ADD CONSTRAINT "affiliationEvents_event_check" CHECK ("event" IN (${EVENTS.map(
      (event) => `'${event}'`,
    ).join(", ")}))`,
  );
};

/** @param {import("knex").Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("affiliationEvents");
};
