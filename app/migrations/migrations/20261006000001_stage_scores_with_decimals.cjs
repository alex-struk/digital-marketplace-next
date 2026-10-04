"use strict";

/**
 * The code challenge, team scenario, challenge and price scores of Sprint With Us and Team With Us
 * proposals, held with their decimals (decision record 0065).
 *
 * The reconstructed baseline keeps these columns as whole numbers. A stage score is entered out of
 * 100 with up to two decimal places (R-2.28), and a price score is a share of the lowest bid, which
 * is seldom whole (R-2.30), so a whole-number column would round both before the weighted total is
 * taken (R-2.31). They become double precision; every whole number already held is kept as it was.
 */

const COLUMNS = [
  { table: "swuProposals", columns: ["challengeScore", "scenarioScore", "priceScore"] },
  { table: "twuProposals", columns: ["challengeScore", "priceScore"] },
];

/** @param {import("knex").Knex} knex */
exports.up = async function up(knex) {
  for (const { table, columns } of COLUMNS) {
    for (const column of columns) {
      await knex.raw(`ALTER TABLE ?? ALTER COLUMN ?? TYPE double precision USING ??::double precision`, [table, column, column]);
    }
  }
};

/** @param {import("knex").Knex} knex */
exports.down = async function down(knex) {
  for (const { table, columns } of COLUMNS) {
    for (const column of columns) {
      await knex.raw(`ALTER TABLE ?? ALTER COLUMN ?? TYPE integer USING round(??)::integer`, [table, column, column]);
    }
  }
};
