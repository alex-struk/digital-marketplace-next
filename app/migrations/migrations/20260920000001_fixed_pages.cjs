"use strict";

/**
 * The pages the service needs for itself, as slice 1 first created them: sixteen, including the
 * service level agreement page (decision record 0008).
 *
 * Each page is created marked as needed by the service, titled by its own address, with the
 * body "Initial version" and no author, so an administrator's list shows "System" as both
 * publisher and last editor (R-7.27) until somebody writes it. A page whose address is already
 * taken is left exactly as it stands.
 *
 * The set this migration creates is kept as it was when it was first run, so the history reads
 * the same on every database. `20260930000005_the_twenty_two_needed_pages.cjs` brings it to
 * the twenty-two R-7.12 counts and takes the untouched service level agreement placeholder out
 * again (decision record 0026).
 */

const { createNeededPage, removeUntouchedNeededPage } = require("../lib/fixed-pages.cjs");

const FIRST_PAGE_SLUGS = Object.freeze([
  "about",
  "disclaimer",
  "privacy",
  "accessibility",
  "copyright",
  "markdown-guide",
  "terms-and-conditions",
  "service-level-agreement",
  "code-with-us-terms-and-conditions",
  "sprint-with-us-terms-and-conditions",
  "team-with-us-terms-and-conditions",
  "sprint-with-us-opportunity-scope",
  "sprint-with-us-proposal-evaluation",
  "team-with-us-proposal-evaluation",
  "sprint-with-us-evaluation-instructions",
  "team-with-us-evaluation-instructions",
]);

/** @param {import("knex").Knex} knex */
exports.up = async function up(knex) {
  for (const slug of FIRST_PAGE_SLUGS) {
    await createNeededPage(knex, slug);
  }
};

/** @param {import("knex").Knex} knex */
exports.down = async function down(knex) {
  // Only pages this migration could have created, and only while they are untouched.
  for (const slug of FIRST_PAGE_SLUGS) {
    await removeUntouchedNeededPage(knex, slug);
  }
};
