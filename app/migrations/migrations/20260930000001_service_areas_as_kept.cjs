"use strict";

/**
 * The fifth service area, as the old application's own migrations leave it.
 *
 * The reconstructed baseline (decision record 0007) wrote service area 5 as
 * DELIVERY_MANAGER. The old application's history ends with it as SERVICE_DESIGNER, "Service
 * Designer" (its migration 20250521094818_add_service_designer_service_area), and that is
 * what the acceptance suite's seed restores between tests (tests/seed/000-installation.sql,
 * which inserts row 5 by number and so collides with anything else there). Decision record
 * 0012 records the correction.
 *
 * Only a database the baseline made carries DELIVERY_MANAGER, so on one the old application
 * left behind this finds nothing to change. The row keeps its number, so nothing that refers
 * to it moves.
 */

/** @param {import("knex").Knex} knex */
exports.up = async function up(knex) {
  const designer = await knex("serviceAreas").where({ serviceArea: "SERVICE_DESIGNER" }).first("id");
  if (designer) return;
  await knex("serviceAreas")
    .where({ serviceArea: "DELIVERY_MANAGER" })
    .update({ serviceArea: "SERVICE_DESIGNER", name: "Service Designer" });
};

/** @param {import("knex").Knex} knex */
exports.down = async function down(knex) {
  await knex("serviceAreas")
    .where({ serviceArea: "SERVICE_DESIGNER" })
    .update({ serviceArea: "DELIVERY_MANAGER", name: "Delivery Manager" });
};
