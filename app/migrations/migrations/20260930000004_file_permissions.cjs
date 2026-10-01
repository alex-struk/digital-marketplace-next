"use strict";

/**
 * Who may read a stored file (R-8.7), as the old application kept it: one table for each of
 * the three ways read access is granted when a file is uploaded (R-8.24) — to anyone, to one
 * named account, and to every account of one kind. A file with no rows here is readable only
 * by whoever uploaded it, by an administrator, and through whatever it is attached to.
 *
 * The names and keys are the old application's (its migration 20191217200136_file_permissions),
 * so a database it left behind already has these and is left as it is. Rows are written once,
 * when the file is stored, and never changed (R-8.6).
 */

/** @param {import("knex").Knex} knex */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable("filePermissionsPublic"))) {
    await knex.schema.createTable("filePermissionsPublic", (table) => {
      table.uuid("file").primary().references("id").inTable("files").onDelete("CASCADE");
    });
  }

  if (!(await knex.schema.hasTable("filePermissionsUser"))) {
    await knex.schema.createTable("filePermissionsUser", (table) => {
      table.uuid("file").notNullable().references("id").inTable("files").onDelete("CASCADE");
      table.uuid("user").notNullable().references("id").inTable("users").onDelete("CASCADE");
      table.primary(["file", "user"]);
    });
  }

  if (!(await knex.schema.hasTable("filePermissionsUserType"))) {
    await knex.schema.createTable("filePermissionsUserType", (table) => {
      table.uuid("file").notNullable().references("id").inTable("files").onDelete("CASCADE");
      table.text("userType").notNullable();
      table.primary(["file", "userType"]);
    });
    await knex.raw(
      `ALTER TABLE "filePermissionsUserType" ADD CONSTRAINT "filepermissionsusertype_usertype_check" CHECK ("userType" IN ('VENDOR', 'GOV', 'ADMIN'))`,
    );
  }
};

/** @param {import("knex").Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("filePermissionsUserType");
  await knex.schema.dropTableIfExists("filePermissionsUser");
  await knex.schema.dropTableIfExists("filePermissionsPublic");
};
