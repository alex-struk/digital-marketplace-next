"use strict";

/**
 * Who watches an opportunity, and how often it has been opened.
 *
 * - `cwuOpportunitySubscribers`, `swuOpportunitySubscribers` and `twuOpportunitySubscribers`
 *   pair an opportunity with an account watching it, as the old application's tables of those
 *   names did. The pair is the key, so nobody watches the same opportunity twice (R-1.5), and
 *   each row goes with its opportunity or its account.
 * - `viewCounters` holds a count under a name, `opportunity.<program>.<id>.views` for the times
 *   an opportunity's public page has been opened (R-1.6), as the old application's table did.
 *
 * Each is created only where it is absent, so a database the old application left behind keeps
 * its own.
 */

const PROGRAM_TABLES = {
  cwuOpportunitySubscribers: "cwuOpportunities",
  swuOpportunitySubscribers: "swuOpportunities",
  twuOpportunitySubscribers: "twuOpportunities",
};

/** @param {import("knex").Knex} knex */
exports.up = async function up(knex) {
  for (const [table, opportunities] of Object.entries(PROGRAM_TABLES)) {
    if (await knex.schema.hasTable(table)) continue;
    await knex.schema.createTable(table, (columns) => {
      columns
        .uuid("opportunity")
        .notNullable()
        .references("id")
        .inTable(opportunities)
        .onDelete("CASCADE");
      columns.uuid("user").notNullable().references("id").inTable("users").onDelete("CASCADE");
      columns.timestamp("createdAt", { useTz: true }).notNullable();
      columns.primary(["opportunity", "user"]);
    });
  }

  if (!(await knex.schema.hasTable("viewCounters"))) {
    await knex.schema.createTable("viewCounters", (columns) => {
      columns.string("name").primary();
      columns.integer("count").notNullable().defaultTo(0);
    });
  }
};

/** @param {import("knex").Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("viewCounters");
  for (const table of Object.keys(PROGRAM_TABLES)) {
    await knex.schema.dropTableIfExists(table);
  }
};
