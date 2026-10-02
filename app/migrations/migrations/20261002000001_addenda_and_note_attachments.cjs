"use strict";

/**
 * What is added to an opportunity once it is under way: its addenda, and the files carried by a
 * private note in its history.
 *
 * - `cwuOpportunityAddenda`, `swuOpportunityAddenda` and `twuOpportunityAddenda` hold each
 *   addendum added to an opportunity of that program, with who added it and when, as the old
 *   application's tables of those names did (R-1.32). Nothing removes a row but the opportunity
 *   itself going.
 * - `cwuOpportunityNoteAttachments` and `swuOpportunityNoteAttachments` pair a history entry that
 *   records a note with each stored file it carries (R-1.33). Team With Us has no notes, so it has
 *   no such table, as the old application had none.
 *
 * Each is created only where it is absent, so a database the old application left behind keeps
 * its own.
 */

const ADDENDA = {
  cwuOpportunityAddenda: "cwuOpportunities",
  swuOpportunityAddenda: "swuOpportunities",
  twuOpportunityAddenda: "twuOpportunities",
};

const NOTE_ATTACHMENTS = {
  cwuOpportunityNoteAttachments: "cwuOpportunityStatuses",
  swuOpportunityNoteAttachments: "swuOpportunityStatuses",
};

/** @param {import("knex").Knex} knex */
exports.up = async function up(knex) {
  for (const [table, opportunities] of Object.entries(ADDENDA)) {
    if (await knex.schema.hasTable(table)) continue;
    await knex.schema.createTable(table, (columns) => {
      columns.uuid("id").primary();
      columns
        .uuid("opportunity")
        .notNullable()
        .references("id")
        .inTable(opportunities)
        .onDelete("CASCADE");
      columns.text("description").notNullable();
      columns.timestamp("createdAt", { useTz: true }).notNullable();
      columns.uuid("createdBy").references("id").inTable("users");
    });
  }

  for (const [table, history] of Object.entries(NOTE_ATTACHMENTS)) {
    if (await knex.schema.hasTable(table)) continue;
    await knex.schema.createTable(table, (columns) => {
      columns.uuid("event").notNullable().references("id").inTable(history).onDelete("CASCADE");
      columns.uuid("file").notNullable().references("id").inTable("files");
      columns.primary(["event", "file"]);
    });
  }
};

/** @param {import("knex").Knex} knex */
exports.down = async function down(knex) {
  for (const table of [...Object.keys(NOTE_ATTACHMENTS), ...Object.keys(ADDENDA)]) {
    await knex.schema.dropTableIfExists(table);
  }
};
