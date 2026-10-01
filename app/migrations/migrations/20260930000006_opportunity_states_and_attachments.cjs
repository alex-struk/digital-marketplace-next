"use strict";

/**
 * The states an opportunity may hold, and the files attached to a Code With Us opportunity.
 *
 * - `cwuOpportunityAttachments` pairs a version of a Code With Us opportunity with a stored
 *   file, as the old application's table of that name did: every saved version carries the
 *   attachments it was saved with, so the current version's are the opportunity's attachments
 *   (R-1.4, R-8.25). It is created only where it is absent, so a database the old application
 *   left behind keeps its own.
 * - "Suspended" is not a state the rebuilt service defines (R-1.51). A history row a database
 *   carries in it is mapped to "cancelled" before anything reads it — the one final state an
 *   opportunity that stopped taking proposals and was never awarded can be in (decision record
 *   0029).
 * - Each program's history table then accepts only the states that program recognises, or no
 *   state at all on a row that records an event rather than a change of state (R-1.19). The
 *   store refuses anything else, whatever wrote it.
 */

const STATES = {
  cwuOpportunityStatuses: [
    "DRAFT",
    "UNDER_REVIEW",
    "PUBLISHED",
    "EVALUATION",
    "PROCESSING",
    "AWARDED",
    "CANCELED",
  ],
  swuOpportunityStatuses: [
    "DRAFT",
    "UNDER_REVIEW",
    "PUBLISHED",
    "EVAL_QUESTIONS_INDIVIDUAL",
    "EVAL_QUESTIONS_CONSENSUS",
    "EVAL_CC",
    "EVAL_SCENARIO",
    "PROCESSING",
    "AWARDED",
    "CANCELED",
  ],
  twuOpportunityStatuses: [
    "DRAFT",
    "UNDER_REVIEW",
    "PUBLISHED",
    "EVAL_QUESTIONS_INDIVIDUAL",
    "EVAL_QUESTIONS_CONSENSUS",
    "EVAL_C",
    "PROCESSING",
    "AWARDED",
    "CANCELED",
  ],
};

const constraintName = (table) => `${table.toLowerCase()}_status_check`;

/** @param {import("knex").Knex} knex */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable("cwuOpportunityAttachments"))) {
    await knex.schema.createTable("cwuOpportunityAttachments", (table) => {
      table
        .uuid("opportunityVersion")
        .notNullable()
        .references("id")
        .inTable("cwuOpportunityVersions")
        .onDelete("CASCADE");
      table.uuid("file").notNullable().references("id").inTable("files");
      table.primary(["opportunityVersion", "file"]);
    });
  }

  for (const [table, states] of Object.entries(STATES)) {
    await knex(table).where({ status: "SUSPENDED" }).update({ status: "CANCELED" });
    await knex.raw(`ALTER TABLE ?? DROP CONSTRAINT IF EXISTS ??`, [table, constraintName(table)]);
    // The states are this file's own constants, written in as literals: a schema change takes no
    // bound values.
    const listed = states.map((state) => `'${state}'`).join(", ");
    await knex.raw(
      `ALTER TABLE ?? ADD CONSTRAINT ?? CHECK ("status" IS NULL OR "status" IN (${listed}))`,
      [table, constraintName(table)],
    );
  }
};

/** @param {import("knex").Knex} knex */
exports.down = async function down(knex) {
  for (const table of Object.keys(STATES)) {
    await knex.raw(`ALTER TABLE ?? DROP CONSTRAINT IF EXISTS ??`, [table, constraintName(table)]);
  }
  await knex.schema.dropTableIfExists("cwuOpportunityAttachments");
};

exports.STATES = STATES;
