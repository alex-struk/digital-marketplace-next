"use strict";

/**
 * The individual and consensus evaluation tables of the two programs with evaluation panels,
 * which the reconstructed baseline (decision record 0007) left out.
 *
 * The old application's evaluation-panel migration (20240527213854) made them, and the
 * acceptance suite's seed writes to them (tests/seed/010-sprint-with-us-stages.sql,
 * tests/seed/011-team-with-us-stages.sql). For each program there is one pair for a panel
 * member's own scores ("Evaluator") and one for the chair's agreed scores ("Chair"): a
 * score and notes per question, and a history of the evaluation's status. The panel member is
 * named by their account, as the panel itself names them. Decision record 0012 records why
 * they arrive now.
 *
 * Each table is created only where it is absent, so a database the old application left
 * behind, which already has them, is left as it is.
 */

const PREFIXES = [
  { prefix: "swuTeamQuestionResponse", proposals: "swuProposals" },
  { prefix: "twuResourceQuestionResponse", proposals: "twuProposals" },
];
const WHO = ["Evaluator", "Chair"];

/** @param {import("knex").Knex} knex */
exports.up = async function up(knex) {
  for (const { prefix, proposals } of PREFIXES) {
    for (const who of WHO) {
      const evaluations = `${prefix}${who}Evaluations`;
      if (!(await knex.schema.hasTable(evaluations))) {
        await knex.schema.createTable(evaluations, (table) => {
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
          table.float("score").notNullable();
          table.text("notes").notNullable().defaultTo("");
          table.primary(["proposal", "questionOrder", "evaluationPanelMember"]);
        });
      }

      const statuses = `${prefix}${who}EvaluationStatuses`;
      if (!(await knex.schema.hasTable(statuses))) {
        await knex.schema.createTable(statuses, (table) => {
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
          table.primary(["proposal", "evaluationPanelMember", "createdAt"]);
        });
      }
    }
  }
};

/** @param {import("knex").Knex} knex */
exports.down = async function down(knex) {
  for (const { prefix } of PREFIXES) {
    for (const who of WHO) {
      await knex.schema.dropTableIfExists(`${prefix}${who}EvaluationStatuses`);
      await knex.schema.dropTableIfExists(`${prefix}${who}Evaluations`);
    }
  }
};
