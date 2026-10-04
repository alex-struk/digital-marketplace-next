"use strict";

/**
 * The files attached to Sprint With Us and Team With Us opportunities, and to Sprint With Us
 * proposals: the old application's own tables, which the reconstructed baseline (decision record
 * 0007) left out.
 *
 * `swuOpportunityAttachments` and `twuOpportunityAttachments` pair an opportunity version with a
 * stored file, as `cwuOpportunityAttachments` does for Code With Us (decision record 0055,
 * "Attachments on Sprint With Us and Team With Us opportunities"): a version's rows are the files
 * it was saved with, and the current version's rows are the opportunity's attachments.
 * `swuProposalAttachments` pairs a Sprint With Us proposal with a stored file, as
 * `cwuProposalAttachments` and `twuProposalAttachments` do for the other two programs (decision
 * record 0058). A file attached to any of them is readable through what it hangs on (R-8.20,
 * R-8.25); nothing about who may read it is recorded against the file itself (R-8.19).
 *
 * Each is created only where it is absent, so a database the old application left behind keeps its
 * own.
 */

const TABLES = [
  { name: "swuOpportunityAttachments", owner: "opportunityVersion", ownerTable: "swuOpportunityVersions" },
  { name: "twuOpportunityAttachments", owner: "opportunityVersion", ownerTable: "twuOpportunityVersions" },
  { name: "swuProposalAttachments", owner: "proposal", ownerTable: "swuProposals" },
];

/** @param {import("knex").Knex} knex */
exports.up = async function up(knex) {
  for (const { name, owner, ownerTable } of TABLES) {
    if (await knex.schema.hasTable(name)) continue;
    await knex.schema.createTable(name, (table) => {
      table.uuid(owner).notNullable().references("id").inTable(ownerTable).onDelete("CASCADE");
      table.uuid("file").notNullable().references("id").inTable("files");
      table.primary([owner, "file"]);
    });
  }
};

/** @param {import("knex").Knex} knex */
exports.down = async function down(knex) {
  for (const { name } of [...TABLES].reverse()) {
    await knex.schema.dropTableIfExists(name);
  }
};
