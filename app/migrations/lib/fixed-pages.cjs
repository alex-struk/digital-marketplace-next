"use strict";

/**
 * The pages a fresh installation needs (R-7.12), and the placeholder they carry until
 * somebody writes them.
 *
 * The set is the twenty-two the old application created for itself, the count R-7.12's own
 * then-clause gives and the set `tests/seed/000-installation.sql` restores. Decision record
 * 0026 records why it is twenty-two again and not the sixteen decision record 0008 chose; the
 * service level agreement page (R-7.18) is not among them and not stored: the service answers
 * its address itself until an administrator writes it (backend `content/built-in-pages.ts`).
 *
 * @type {readonly string[]}
 */
const PAGE_SLUGS = Object.freeze([
  // The service's own prose. The first five are the footer's five links (R-7.19), in the
  // order the footer offers them.
  "about",
  "disclaimer",
  "privacy",
  "accessibility",
  "copyright",
  "markdown-guide",
  "terms-and-conditions",
  // A terms and conditions page for each of the three programs.
  "code-with-us-terms-and-conditions",
  "sprint-with-us-terms-and-conditions",
  "team-with-us-terms-and-conditions",
  // Each program's opportunity guide and proposal guide.
  "code-with-us-opportunity-guide",
  "code-with-us-proposal-guide",
  "sprint-with-us-opportunity-guide",
  "sprint-with-us-proposal-guide",
  "team-with-us-opportunity-guide",
  "team-with-us-proposal-guide",
  // The prose the two programs with an evaluation panel embed in their own screens.
  "sprint-with-us-opportunity-scope",
  "team-with-us-opportunity-scope",
  "sprint-with-us-proposal-evaluation",
  "team-with-us-proposal-evaluation",
  "sprint-with-us-evaluation-instructions",
  "team-with-us-evaluation-instructions",
]);

/** The body every needed page carries until an administrator writes it (R-7.12). */
const PLACEHOLDER_BODY = "Initial version";

/**
 * The address of the service level agreement page (R-7.18). It is not one of the stored needed
 * pages; an earlier migration stored it, and a later one takes that placeholder out again.
 */
const SERVICE_LEVEL_AGREEMENT_SLUG = "service-level-agreement";

/**
 * Create a needed page at `slug`, titled by its address with the placeholder body and no
 * author, unless a page already holds that address. Returns whether it created one.
 *
 * @param {import("knex").Knex} knex
 * @param {string} slug
 */
async function createNeededPage(knex, slug) {
  const existing = await knex("content").where({ slug }).first("id");
  if (existing) return false;

  const [created] = await knex("content")
    .insert({
      id: knex.raw("gen_random_uuid()"),
      createdAt: knex.fn.now(),
      createdBy: null,
      slug,
      fixed: true,
    })
    .returning("id");

  await knex("contentVersions").insert({
    id: 1,
    contentId: typeof created === "string" ? created : created.id,
    title: slug,
    body: PLACEHOLDER_BODY,
    createdAt: knex.fn.now(),
    createdBy: null,
  });
  return true;
}

/**
 * Remove the needed page at `slug` only while nobody has touched it: still marked needed, no
 * author, and its one version still the placeholder titled by its address. Returns whether it
 * removed one.
 *
 * @param {import("knex").Knex} knex
 * @param {string} slug
 */
async function removeUntouchedNeededPage(knex, slug) {
  const page = await knex("content").where({ slug, fixed: true }).whereNull("createdBy").first("id");
  if (!page) return false;
  const versions = await knex("contentVersions").where({ contentId: page.id });
  const untouched =
    versions.length === 1 &&
    versions[0].title === slug &&
    versions[0].body === PLACEHOLDER_BODY &&
    versions[0].createdBy === null;
  if (!untouched) return false;
  await knex("contentVersions").where({ contentId: page.id }).delete();
  await knex("content").where({ id: page.id }).delete();
  return true;
}

module.exports = {
  PAGE_SLUGS,
  PLACEHOLDER_BODY,
  SERVICE_LEVEL_AGREEMENT_SLUG,
  createNeededPage,
  removeUntouchedNeededPage,
};
