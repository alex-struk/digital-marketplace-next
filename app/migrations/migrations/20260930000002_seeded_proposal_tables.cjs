"use strict";

/**
 * Tables of the kept schema the acceptance suite's seed has grown to write into since the
 * baseline was reconstructed (decision record 0007): Code With Us proposals and their
 * history, the attachments of Team With Us proposals, and the evaluators' and chairs'
 * question scores of both evaluated programs, with the status each set of scores stands at.
 *
 * As with the baseline, every table and column name here is the one the seed itself writes
 * (tests/seed/009 to 012), and the history table has the same shape as the other five status
 * tables. The slices that build proposals, attachments and evaluation own what is kept in
 * them and may find the old application spelled a constraint differently; this only makes
 * the seed applicable, which is what `npm run check` holds the migration history to.
 */

/** The four evaluation tables, as the seed names them by their prefix. */
const EVALUATION_PREFIXES = [
  { prefix: "swuTeamQuestionResponseEvaluator", proposals: "swuProposals" },
  { prefix: "swuTeamQuestionResponseChair", proposals: "swuProposals" },
  { prefix: "twuResourceQuestionResponseEvaluator", proposals: "twuProposals" },
  { prefix: "twuResourceQuestionResponseChair", proposals: "twuProposals" },
];

/** @param {import("knex").Knex} knex */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable("cwuProposals"))) {
    await knex.schema.createTable("cwuProposals", (table) => {
      table.uuid("id").primary();
      table.timestamp("createdAt", { useTz: true }).notNullable();
      table.uuid("createdBy").nullable().references("id").inTable("users");
      table.timestamp("updatedAt", { useTz: true }).notNullable();
      table.uuid("updatedBy").nullable().references("id").inTable("users");
      table.text("proposalText").notNullable().defaultTo("");
      table.text("additionalComments").notNullable().defaultTo("");
      table.uuid("proponentIndividual").nullable();
      table.uuid("proponentOrganization").nullable().references("id").inTable("organizations");
      table.float("score").nullable();
      table
        .uuid("opportunity")
        .notNullable()
        .references("id")
        .inTable("cwuOpportunities")
        .onDelete("CASCADE");
    });
  }

  if (!(await knex.schema.hasTable("cwuProposalStatuses"))) {
    await knex.schema.createTable("cwuProposalStatuses", (table) => {
      table.uuid("id").primary();
      table.timestamp("createdAt", { useTz: true }).notNullable();
      table.uuid("createdBy").nullable().references("id").inTable("users");
      table
        .uuid("proposal")
        .notNullable()
        .references("id")
        .inTable("cwuProposals")
        .onDelete("CASCADE");
      table.text("status").nullable();
      table.text("event").nullable();
      table.text("note").nullable();
    });
  }

  if (!(await knex.schema.hasTable("twuProposalAttachments"))) {
    await knex.schema.createTable("twuProposalAttachments", (table) => {
      table
        .uuid("proposal")
        .notNullable()
        .references("id")
        .inTable("twuProposals")
        .onDelete("CASCADE");
      table.uuid("file").notNullable().references("id").inTable("files");
      table.primary(["proposal", "file"]);
    });
  }

  for (const { prefix, proposals } of EVALUATION_PREFIXES) {
    // One score and note per question, per panel member, per proposal.
    if (!(await knex.schema.hasTable(`${prefix}Evaluations`))) {
      await knex.schema.createTable(`${prefix}Evaluations`, (table) => {
        table
          .uuid("proposal")
          .notNullable()
          .references("id")
          .inTable(proposals)
          .onDelete("CASCADE");
        table.integer("questionOrder").notNullable();
        table.uuid("evaluationPanelMember").notNullable().references("id").inTable("users");
        table.timestamp("createdAt", { useTz: true }).notNullable();
        table.timestamp("updatedAt", { useTz: true }).notNullable();
        table.float("score").nullable();
        table.text("notes").notNullable().defaultTo("");
        table.primary(["proposal", "evaluationPanelMember", "questionOrder"]);
      });
    }
    // Where one panel member's scores for one proposal stand: a draft, or submitted.
    if (!(await knex.schema.hasTable(`${prefix}EvaluationStatuses`))) {
      await knex.schema.createTable(`${prefix}EvaluationStatuses`, (table) => {
        table
          .uuid("proposal")
          .notNullable()
          .references("id")
          .inTable(proposals)
          .onDelete("CASCADE");
        table.uuid("evaluationPanelMember").notNullable().references("id").inTable("users");
        table.text("status").notNullable();
        table.text("note").nullable();
        table.timestamp("createdAt", { useTz: true }).notNullable();
      });
    }
  }
};

/** @param {import("knex").Knex} knex */
exports.down = async function down(knex) {
  for (const { prefix } of [...EVALUATION_PREFIXES].reverse()) {
    await knex.schema.dropTableIfExists(`${prefix}EvaluationStatuses`);
    await knex.schema.dropTableIfExists(`${prefix}Evaluations`);
  }
  await knex.schema.dropTableIfExists("twuProposalAttachments");
  await knex.schema.dropTableIfExists("cwuProposalStatuses");
  await knex.schema.dropTableIfExists("cwuProposals");
};
