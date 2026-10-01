"use strict";

/**
 * The needed pages become the twenty-two R-7.12 counts (decision record 0026).
 *
 * The six program guides and the Team With Us opportunity scope page are created where no page
 * holds their address, like every other needed page: titled by the address, bodied "Initial
 * version", no author. The service level agreement placeholder an earlier migration stored is
 * taken out again, but only while nobody has written it; from here on the service answers that
 * address itself until an administrator does (R-7.18).
 */

const {
  PAGE_SLUGS,
  SERVICE_LEVEL_AGREEMENT_SLUG,
  createNeededPage,
  removeUntouchedNeededPage,
} = require("../lib/fixed-pages.cjs");

const ADDED = Object.freeze([
  "code-with-us-opportunity-guide",
  "code-with-us-proposal-guide",
  "sprint-with-us-opportunity-guide",
  "sprint-with-us-proposal-guide",
  "team-with-us-opportunity-guide",
  "team-with-us-proposal-guide",
  "team-with-us-opportunity-scope",
]);

/** @param {import("knex").Knex} knex */
exports.up = async function up(knex) {
  for (const slug of PAGE_SLUGS) {
    await createNeededPage(knex, slug);
  }
  await removeUntouchedNeededPage(knex, SERVICE_LEVEL_AGREEMENT_SLUG);
};

/** @param {import("knex").Knex} knex */
exports.down = async function down(knex) {
  for (const slug of ADDED) {
    await removeUntouchedNeededPage(knex, slug);
  }
  await createNeededPage(knex, SERVICE_LEVEL_AGREEMENT_SLUG);
};
