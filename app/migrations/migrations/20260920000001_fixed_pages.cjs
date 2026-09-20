"use strict";

/**
 * The pages the service needs for itself, on a fresh installation (R-7.12), including the
 * service level agreement page every screen that offers it links to (R-7.18).
 *
 * Each page is created marked as needed by the service, titled by its own address, with the
 * body "Initial version" and no author, so an administrator's list shows "System" as both
 * publisher and last editor (R-7.27) until somebody writes it.
 *
 * A page whose address is already taken is left exactly as it stands: an installation the old
 * application left behind keeps its own wording, its own history and its own authors. That is
 * also what makes this migration safe to run against a database that already carries the old
 * application's twenty-two pages.
 *
 * The set is the twenty-two the old application created, minus the seven nothing in the
 * service links to (the three programs' opportunity and proposal guides and the Team With Us
 * opportunity scope page), plus the service level agreement page. Decision record 0008 records
 * the addresses and why the set is the size it is.
 */

const { PAGE_SLUGS, PLACEHOLDER_BODY } = require("../lib/fixed-pages.cjs");

/** @param {import("knex").Knex} knex */
exports.up = async function up(knex) {
  for (const slug of PAGE_SLUGS) {
    const existing = await knex("content").where({ slug }).first("id");
    if (existing) continue;

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
  }
};

/** @param {import("knex").Knex} knex */
exports.down = async function down(knex) {
  // Only pages this migration could have created, and only while they are untouched.
  const rows = await knex("content")
    .whereIn("slug", PAGE_SLUGS)
    .andWhere({ fixed: true })
    .select("id");
  for (const row of rows) {
    const versions = await knex("contentVersions").where({ contentId: row.id });
    const untouched =
      versions.length === 1 && versions[0].body === PLACEHOLDER_BODY;
    if (!untouched) continue;
    await knex("contentVersions").where({ contentId: row.id }).delete();
    await knex("content").where({ id: row.id }).delete();
  }
};
