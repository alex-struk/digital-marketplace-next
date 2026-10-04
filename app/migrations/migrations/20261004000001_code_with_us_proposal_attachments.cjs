"use strict";

/**
 * The files attached to a Code With Us proposal.
 *
 * `cwuProposalAttachments` pairs a proposal with a stored file, as the old application's table of
 * that name did and as `twuProposalAttachments` already does for Team With Us. A file attached to
 * a proposal is readable by whoever may read the proposal (R-8.20); taking it off the proposal, or
 * deleting the proposal, removes the pair and with it that way of reading the file, while the file
 * itself stays stored (R-8.31). It is created only where it is absent, so a database the old
 * application left behind keeps its own.
 */

/** @param {import("knex").Knex} knex */
exports.up = async function up(knex) {
  if (await knex.schema.hasTable("cwuProposalAttachments")) return;
  await knex.schema.createTable("cwuProposalAttachments", (table) => {
    table
      .uuid("proposal")
      .notNullable()
      .references("id")
      .inTable("cwuProposals")
      .onDelete("CASCADE");
    table.uuid("file").notNullable().references("id").inTable("files");
    table.primary(["proposal", "file"]);
  });
};

/** @param {import("knex").Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("cwuProposalAttachments");
};
