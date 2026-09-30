"use strict";

/**
 * The Code With Us proposal tables, and the Team With Us proposal attachments, which the
 * reconstructed baseline (decision record 0007) left out.
 *
 * The old application's schema has them, and the acceptance suite's seed writes to them
 * (tests/seed/009-code-with-us-stages.sql, tests/seed/012-files.sql), so without them the
 * seed does not apply and the sandbox cannot be put back to the state the manifest describes.
 * Their shape is the old application's: a proposal names its opportunity and either an
 * individual proponent or an organization, its history is a status table like every other
 * record's, and an attachment is a (proposal, file) pair. Decision record 0012 records why they
 * arrive here rather than with the slice that builds Code With Us proposals.
 *
 * Each table is created only where it is absent, so a database the old application left
 * behind, which already has them, is left as it is.
 */

/** @param {import("knex").Knex} knex */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable("cwuProponents"))) {
    await knex.schema.createTable("cwuProponents", (table) => {
      table.uuid("id").primary();
      table.timestamp("createdAt", { useTz: true }).notNullable();
      table.uuid("createdBy").nullable().references("id").inTable("users");
      table.timestamp("updatedAt", { useTz: true }).notNullable();
      table.uuid("updatedBy").nullable().references("id").inTable("users");
      table.text("legalName").notNullable();
      table.text("email").notNullable();
      table.text("phone").nullable();
      table.text("street1").notNullable();
      table.text("street2").nullable();
      table.text("city").notNullable();
      table.text("region").notNullable();
      table.text("mailCode").notNullable();
      table.text("country").notNullable();
    });
  }

  if (!(await knex.schema.hasTable("cwuProposals"))) {
    await knex.schema.createTable("cwuProposals", (table) => {
      table.uuid("id").primary();
      table.timestamp("createdAt", { useTz: true }).notNullable();
      table.uuid("createdBy").nullable().references("id").inTable("users");
      table.timestamp("updatedAt", { useTz: true }).notNullable();
      table.uuid("updatedBy").nullable().references("id").inTable("users");
      table.text("proposalText").notNullable().defaultTo("");
      table.text("additionalComments").notNullable().defaultTo("");
      table
        .uuid("proponentIndividual")
        .nullable()
        .references("id")
        .inTable("cwuProponents");
      table
        .uuid("proponentOrganization")
        .nullable()
        .references("id")
        .inTable("organizations");
      table.float("score").nullable();
      table
        .uuid("opportunity")
        .notNullable()
        .references("id")
        .inTable("cwuOpportunities")
        .onDelete("CASCADE");
      table.text("anonymousProponentName").notNullable().defaultTo("");
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
};

/** @param {import("knex").Knex} knex */
exports.down = async function down(knex) {
  for (const table of [
    "twuProposalAttachments",
    "cwuProposalStatuses",
    "cwuProposals",
    "cwuProponents",
  ]) {
    await knex.schema.dropTableIfExists(table);
  }
};
