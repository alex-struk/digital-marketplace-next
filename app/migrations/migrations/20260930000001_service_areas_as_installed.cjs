"use strict";

/**
 * The five service areas an installation carries, as the old application's migrations left
 * them: Full Stack Developer, Data Professional, Agile Coach, DevOps Specialist and Service
 * Designer, numbered 1 to 5.
 *
 * The reconstructed baseline (decision record 0007) put "Delivery Manager" at number 5, which
 * no installation of the old application ever held. The acceptance suite's own record of a
 * fresh installation (tests/seed/000-installation.sql) restores Service Designer at number 5
 * and could not be applied over it. This puts number 5 right, and only when nothing refers to
 * it yet, so a database where the row is in use is left alone for a person to look at.
 */

/** @param {import("knex").Knex} knex */
exports.up = async function up(knex) {
  const designer = await knex("serviceAreas").where({ serviceArea: "SERVICE_DESIGNER" }).first("id");
  if (designer) return;
  const manager = await knex("serviceAreas").where({ serviceArea: "DELIVERY_MANAGER" }).first("id");
  if (!manager) {
    await knex("serviceAreas").insert({ serviceArea: "SERVICE_DESIGNER", name: "Service Designer" });
    return;
  }
  const [inOrganizations, inResources] = await Promise.all([
    knex("twuOrganizationServiceAreas").where({ serviceArea: manager.id }).first("serviceArea"),
    knex("twuResources").where({ serviceArea: manager.id }).first("serviceArea"),
  ]);
  if (inOrganizations || inResources) return;
  await knex("serviceAreas")
    .where({ id: manager.id })
    .update({ serviceArea: "SERVICE_DESIGNER", name: "Service Designer" });
};

/** @param {import("knex").Knex} knex */
exports.down = async function down() {
  // Nothing to undo: Service Designer is what every installation should hold.
};
