"use strict";

/**
 * The kept PostgreSQL schema (constitution J5, decision record 0002), as one baseline.
 *
 * Every table, column name and type here is the shape the acceptance suite's seed files
 * (tests/seed/*.sql) and the recovered contract require. Decision record 0007 records why
 * this is a reconstructed baseline rather than the old application's own migration files,
 * and what that means for a database the old application left behind.
 *
 * Identifiers are quoted by Knex, so the camelCase names and the reserved words "user" and
 * "order" survive exactly as the kept schema spells them.
 */

/** @param {import("knex").Knex} knex */
exports.up = async function up(knex) {
  // ---------------------------------------------------------------- files
  await knex.schema.createTable("fileBlobs", (table) => {
    table.text("hash").primary();
    table.binary("blob").notNullable();
  });

  await knex.schema.createTable("files", (table) => {
    table.uuid("id").primary();
    table.timestamp("createdAt", { useTz: true }).notNullable();
    table.uuid("createdBy").nullable();
    table.text("name").notNullable();
    table.text("fileBlob").notNullable().references("hash").inTable("fileBlobs");
  });

  // ---------------------------------------------------------------- users
  await knex.schema.createTable("users", (table) => {
    table.uuid("id").primary();
    table.timestamp("createdAt", { useTz: true }).notNullable();
    table.timestamp("updatedAt", { useTz: true }).notNullable();
    table.text("type").notNullable();
    table.text("status").notNullable();
    table.text("name").notNullable();
    table.text("email").nullable();
    table.text("jobTitle").nullable();
    table.uuid("avatarImageFile").nullable().references("id").inTable("files");
    table.timestamp("notificationsOn", { useTz: true }).nullable();
    table.timestamp("acceptedTermsAt", { useTz: true }).nullable();
    table.timestamp("lastAcceptedTermsAt", { useTz: true }).nullable();
    table.text("idpUsername").notNullable();
    table.text("idpId").notNullable();
    table.timestamp("deactivatedOn", { useTz: true }).nullable();
    table.uuid("deactivatedBy").nullable().references("id").inTable("users");
    table
      .specificType("capabilities", "text[]")
      .notNullable()
      .defaultTo(knex.raw("'{}'::text[]"));
    table.unique(["type", "idpId"]);
    table.unique(["type", "idpUsername"]);
    table.unique(["type", "email"]);
  });

  await knex.raw(
    `ALTER TABLE "users" ADD CONSTRAINT "users_type_check" CHECK ("type" IN ('VENDOR', 'GOV', 'ADMIN'))`,
  );
  await knex.raw(
    `ALTER TABLE "users" ADD CONSTRAINT "users_status_check" CHECK ("status" IN ('ACTIVE', 'INACTIVE_USER', 'INACTIVE_ADMIN'))`,
  );

  await knex.schema.alterTable("files", (table) => {
    table.foreign("createdBy").references("id").inTable("users");
  });

  // The sign-in session table the old application kept. The rebuild signs in with PKCE and
  // never writes here (decision record 0004); the table and its rows stay.
  await knex.schema.createTable("sessions", (table) => {
    table.uuid("id").primary();
    table.timestamp("createdAt", { useTz: true }).notNullable();
    table.timestamp("updatedAt", { useTz: true }).notNullable();
    table.text("accessToken").nullable();
    table.uuid("user").nullable().references("id").inTable("users");
  });

  // ---------------------------------------------------------------- organizations
  await knex.schema.createTable("organizations", (table) => {
    table.uuid("id").primary();
    table.timestamp("createdAt", { useTz: true }).notNullable();
    table.timestamp("updatedAt", { useTz: true }).notNullable();
    table.text("legalName").notNullable();
    table.uuid("logoImageFile").nullable().references("id").inTable("files");
    table.text("websiteUrl").nullable();
    table.text("streetAddress1").notNullable();
    table.text("streetAddress2").nullable();
    table.text("city").notNullable();
    table.text("region").notNullable();
    table.text("mailCode").notNullable();
    table.text("country").notNullable();
    table.text("contactName").notNullable();
    table.text("contactTitle").nullable();
    table.text("contactEmail").notNullable();
    table.text("contactPhone").nullable();
    table.boolean("active").notNullable().defaultTo(true);
    table.timestamp("deactivatedOn", { useTz: true }).nullable();
    table.uuid("deactivatedBy").nullable().references("id").inTable("users");
    table.timestamp("acceptedSWUTerms", { useTz: true }).nullable();
    table.timestamp("acceptedTWUTerms", { useTz: true }).nullable();
  });

  await knex.schema.createTable("affiliations", (table) => {
    table.uuid("id").primary();
    table.timestamp("createdAt", { useTz: true }).notNullable();
    table.timestamp("updatedAt", { useTz: true }).notNullable();
    table.uuid("user").notNullable().references("id").inTable("users");
    table
      .uuid("organization")
      .notNullable()
      .references("id")
      .inTable("organizations");
    table.text("membershipType").notNullable();
    table.text("membershipStatus").notNullable();
  });

  await knex.raw(
    `ALTER TABLE "affiliations" ADD CONSTRAINT "affiliations_membershipType_check" CHECK ("membershipType" IN ('MEMBER', 'ADMIN', 'OWNER'))`,
  );
  await knex.raw(
    `ALTER TABLE "affiliations" ADD CONSTRAINT "affiliations_membershipStatus_check" CHECK ("membershipStatus" IN ('PENDING', 'ACTIVE', 'INACTIVE'))`,
  );

  // ---------------------------------------------------------------- content
  await knex.schema.createTable("content", (table) => {
    table.uuid("id").primary();
    table.timestamp("createdAt", { useTz: true }).notNullable();
    table.uuid("createdBy").nullable().references("id").inTable("users");
    table.text("slug").notNullable().unique();
    table.boolean("fixed").notNullable().defaultTo(false);
  });

  await knex.schema.createTable("contentVersions", (table) => {
    table.integer("id").notNullable();
    table
      .uuid("contentId")
      .notNullable()
      .references("id")
      .inTable("content")
      .onDelete("CASCADE");
    table.text("title").notNullable();
    table.text("body").notNullable();
    table.timestamp("createdAt", { useTz: true }).notNullable();
    table.uuid("createdBy").nullable().references("id").inTable("users");
    table.primary(["id", "contentId"]);
  });

  // ---------------------------------------------------------------- service areas
  await knex.schema.createTable("serviceAreas", (table) => {
    table.increments("id").primary();
    table.text("serviceArea").notNullable().unique();
    table.text("name").notNullable();
  });

  await knex("serviceAreas").insert([
    { serviceArea: "FULL_STACK_DEVELOPER", name: "Full Stack Developer" },
    { serviceArea: "DATA_PROFESSIONAL", name: "Data Professional" },
    { serviceArea: "AGILE_COACH", name: "Agile Coach" },
    { serviceArea: "DEVOPS_SPECIALIST", name: "DevOps Specialist" },
    {
      serviceArea: "DELIVERY_MANAGER",
      name: "Delivery Manager",
    },
  ]);

  await knex.schema.createTable("twuOrganizationServiceAreas", (table) => {
    table
      .integer("serviceArea")
      .notNullable()
      .references("id")
      .inTable("serviceAreas");
    table
      .uuid("organization")
      .notNullable()
      .references("id")
      .inTable("organizations")
      .onDelete("CASCADE");
    table.primary(["serviceArea", "organization"]);
  });

  // ---------------------------------------------------------------- Code With Us
  await knex.schema.createTable("cwuOpportunities", (table) => {
    table.uuid("id").primary();
    table.timestamp("createdAt", { useTz: true }).notNullable();
    table.uuid("createdBy").nullable().references("id").inTable("users");
  });

  await knex.schema.createTable("cwuOpportunityVersions", (table) => {
    table.uuid("id").primary();
    table.timestamp("createdAt", { useTz: true }).notNullable();
    table.uuid("createdBy").nullable().references("id").inTable("users");
    table
      .uuid("opportunity")
      .notNullable()
      .references("id")
      .inTable("cwuOpportunities")
      .onDelete("CASCADE");
    table.text("title").notNullable();
    table.text("teaser").notNullable().defaultTo("");
    table.boolean("remoteOk").notNullable();
    table.text("remoteDesc").notNullable().defaultTo("");
    table.text("location").notNullable();
    table.integer("reward").notNullable();
    table
      .specificType("skills", "text[]")
      .notNullable()
      .defaultTo(knex.raw("'{}'::text[]"));
    table.text("description").notNullable();
    table.timestamp("proposalDeadline", { useTz: true }).notNullable();
    table.timestamp("assignmentDate", { useTz: true }).notNullable();
    table.timestamp("startDate", { useTz: true }).notNullable();
    table.timestamp("completionDate", { useTz: true }).nullable();
    table.text("submissionInfo").notNullable().defaultTo("");
    table.text("acceptanceCriteria").notNullable().defaultTo("");
    table.text("evaluationCriteria").notNullable().defaultTo("");
  });

  await knex.schema.createTable("cwuOpportunityStatuses", (table) => {
    table.uuid("id").primary();
    table.timestamp("createdAt", { useTz: true }).notNullable();
    table.uuid("createdBy").nullable().references("id").inTable("users");
    table
      .uuid("opportunity")
      .notNullable()
      .references("id")
      .inTable("cwuOpportunities")
      .onDelete("CASCADE");
    table.text("status").nullable();
    table.text("event").nullable();
    table.text("note").nullable();
  });

  // ---------------------------------------------------------------- Sprint With Us
  await knex.schema.createTable("swuOpportunities", (table) => {
    table.uuid("id").primary();
    table.timestamp("createdAt", { useTz: true }).notNullable();
    table.uuid("createdBy").nullable().references("id").inTable("users");
  });

  await knex.schema.createTable("swuOpportunityVersions", (table) => {
    table.uuid("id").primary();
    table.timestamp("createdAt", { useTz: true }).notNullable();
    table.uuid("createdBy").nullable().references("id").inTable("users");
    table
      .uuid("opportunity")
      .notNullable()
      .references("id")
      .inTable("swuOpportunities")
      .onDelete("CASCADE");
    table.text("title").notNullable();
    table.text("teaser").notNullable().defaultTo("");
    table.boolean("remoteOk").notNullable();
    table.text("remoteDesc").notNullable().defaultTo("");
    table.text("location").notNullable();
    table.integer("totalMaxBudget").notNullable();
    table.integer("minTeamMembers").nullable();
    table
      .specificType("mandatorySkills", "text[]")
      .notNullable()
      .defaultTo(knex.raw("'{}'::text[]"));
    table
      .specificType("optionalSkills", "text[]")
      .notNullable()
      .defaultTo(knex.raw("'{}'::text[]"));
    table.text("description").notNullable();
    table.timestamp("proposalDeadline", { useTz: true }).notNullable();
    table.timestamp("assignmentDate", { useTz: true }).notNullable();
    table.integer("questionsWeight").notNullable();
    table.integer("codeChallengeWeight").notNullable();
    table.integer("scenarioWeight").notNullable();
    table.integer("priceWeight").notNullable();
  });

  await knex.schema.createTable("swuOpportunityPhases", (table) => {
    table.uuid("id").primary();
    table
      .uuid("opportunityVersion")
      .notNullable()
      .references("id")
      .inTable("swuOpportunityVersions")
      .onDelete("CASCADE");
    table.text("phase").notNullable();
    table.timestamp("startDate", { useTz: true }).notNullable();
    table.timestamp("completionDate", { useTz: true }).notNullable();
    table.integer("maxBudget").notNullable();
    table.timestamp("createdAt", { useTz: true }).notNullable();
    table.uuid("createdBy").nullable().references("id").inTable("users");
  });

  await knex.schema.createTable("swuPhaseCapabilities", (table) => {
    table
      .uuid("phase")
      .notNullable()
      .references("id")
      .inTable("swuOpportunityPhases")
      .onDelete("CASCADE");
    table.text("capability").notNullable();
    table.boolean("fullTime").notNullable().defaultTo(false);
    table.timestamp("createdAt", { useTz: true }).notNullable();
    table.uuid("createdBy").nullable().references("id").inTable("users");
    table.primary(["phase", "capability"]);
  });

  await knex.schema.createTable("swuTeamQuestions", (table) => {
    table
      .uuid("opportunityVersion")
      .notNullable()
      .references("id")
      .inTable("swuOpportunityVersions")
      .onDelete("CASCADE");
    table.text("question").notNullable();
    table.text("guideline").notNullable();
    table.integer("score").notNullable();
    table.integer("wordLimit").notNullable();
    table.integer("order").notNullable();
    table.timestamp("createdAt", { useTz: true }).notNullable();
    table.uuid("createdBy").nullable().references("id").inTable("users");
    table.integer("minimumScore").nullable();
    table.primary(["opportunityVersion", "order"]);
  });

  await knex.schema.createTable("swuEvaluationPanelMembers", (table) => {
    table
      .uuid("opportunityVersion")
      .notNullable()
      .references("id")
      .inTable("swuOpportunityVersions")
      .onDelete("CASCADE");
    table.uuid("user").notNullable().references("id").inTable("users");
    table.boolean("chair").notNullable().defaultTo(false);
    table.boolean("evaluator").notNullable().defaultTo(false);
    table.integer("order").notNullable();
    table.primary(["opportunityVersion", "user"]);
  });

  await knex.schema.createTable("swuOpportunityStatuses", (table) => {
    table.uuid("id").primary();
    table.timestamp("createdAt", { useTz: true }).notNullable();
    table.uuid("createdBy").nullable().references("id").inTable("users");
    table
      .uuid("opportunity")
      .notNullable()
      .references("id")
      .inTable("swuOpportunities")
      .onDelete("CASCADE");
    table.text("status").nullable();
    table.text("event").nullable();
    table.text("note").nullable();
  });

  await knex.schema.createTable("swuProposals", (table) => {
    table.uuid("id").primary();
    table.timestamp("createdAt", { useTz: true }).notNullable();
    table.uuid("createdBy").nullable().references("id").inTable("users");
    table.timestamp("updatedAt", { useTz: true }).notNullable();
    table.uuid("updatedBy").nullable().references("id").inTable("users");
    table.integer("challengeScore").nullable();
    table.integer("scenarioScore").nullable();
    table.integer("priceScore").nullable();
    table
      .uuid("opportunity")
      .notNullable()
      .references("id")
      .inTable("swuOpportunities")
      .onDelete("CASCADE");
    table
      .uuid("organization")
      .nullable()
      .references("id")
      .inTable("organizations");
    table.text("anonymousProponentName").notNullable().defaultTo("");
  });

  await knex.schema.createTable("swuProposalStatuses", (table) => {
    table.uuid("id").primary();
    table.timestamp("createdAt", { useTz: true }).notNullable();
    table.uuid("createdBy").nullable().references("id").inTable("users");
    table
      .uuid("proposal")
      .notNullable()
      .references("id")
      .inTable("swuProposals")
      .onDelete("CASCADE");
    table.text("status").nullable();
    table.text("event").nullable();
    table.text("note").nullable();
  });

  await knex.schema.createTable("swuProposalPhases", (table) => {
    table.uuid("id").primary();
    table
      .uuid("proposal")
      .notNullable()
      .references("id")
      .inTable("swuProposals")
      .onDelete("CASCADE");
    table.text("phase").notNullable();
    table.integer("proposedCost").notNullable();
  });

  await knex.schema.createTable("swuProposalTeamMembers", (table) => {
    table.uuid("member").notNullable().references("id").inTable("users");
    table
      .uuid("phase")
      .notNullable()
      .references("id")
      .inTable("swuProposalPhases")
      .onDelete("CASCADE");
    table.boolean("scrumMaster").notNullable().defaultTo(false);
    table.primary(["member", "phase"]);
  });

  await knex.schema.createTable("swuProposalReferences", (table) => {
    table
      .uuid("proposal")
      .notNullable()
      .references("id")
      .inTable("swuProposals")
      .onDelete("CASCADE");
    table.integer("order").notNullable();
    table.text("name").notNullable();
    table.text("company").notNullable();
    table.text("phone").notNullable();
    table.text("email").notNullable();
    table.primary(["proposal", "order"]);
  });

  await knex.schema.createTable("swuTeamQuestionResponses", (table) => {
    table
      .uuid("proposal")
      .notNullable()
      .references("id")
      .inTable("swuProposals")
      .onDelete("CASCADE");
    table.integer("order").notNullable();
    table.text("response").notNullable();
    table.integer("score").nullable();
    table.primary(["proposal", "order"]);
  });

  // ---------------------------------------------------------------- Team With Us
  await knex.schema.createTable("twuOpportunities", (table) => {
    table.uuid("id").primary();
    table.timestamp("createdAt", { useTz: true }).notNullable();
    table.uuid("createdBy").nullable().references("id").inTable("users");
  });

  await knex.schema.createTable("twuOpportunityVersions", (table) => {
    table.uuid("id").primary();
    table.timestamp("createdAt", { useTz: true }).notNullable();
    table.uuid("createdBy").nullable().references("id").inTable("users");
    table
      .uuid("opportunity")
      .notNullable()
      .references("id")
      .inTable("twuOpportunities")
      .onDelete("CASCADE");
    table.text("title").notNullable();
    table.text("teaser").notNullable().defaultTo("");
    table.boolean("remoteOk").notNullable();
    table.text("remoteDesc").notNullable().defaultTo("");
    table.text("location").notNullable();
    table.integer("maxBudget").notNullable();
    table.text("description").notNullable();
    table.timestamp("proposalDeadline", { useTz: true }).notNullable();
    table.timestamp("assignmentDate", { useTz: true }).notNullable();
    table.timestamp("startDate", { useTz: true }).notNullable();
    table.timestamp("completionDate", { useTz: true }).nullable();
    table.integer("questionsWeight").notNullable();
    table.integer("challengeWeight").notNullable();
    table.integer("priceWeight").notNullable();
  });

  await knex.schema.createTable("twuResources", (table) => {
    table.uuid("id").primary();
    table
      .integer("serviceArea")
      .notNullable()
      .references("id")
      .inTable("serviceAreas");
    table
      .uuid("opportunityVersion")
      .notNullable()
      .references("id")
      .inTable("twuOpportunityVersions")
      .onDelete("CASCADE");
    table.integer("targetAllocation").notNullable();
    table
      .specificType("mandatorySkills", "text[]")
      .notNullable()
      .defaultTo(knex.raw("'{}'::text[]"));
    table
      .specificType("optionalSkills", "text[]")
      .notNullable()
      .defaultTo(knex.raw("'{}'::text[]"));
    table.integer("order").notNullable();
  });

  await knex.schema.createTable("twuResourceQuestions", (table) => {
    table
      .uuid("opportunityVersion")
      .notNullable()
      .references("id")
      .inTable("twuOpportunityVersions")
      .onDelete("CASCADE");
    table.text("question").notNullable();
    table.text("guideline").notNullable();
    table.integer("score").notNullable();
    table.integer("wordLimit").notNullable();
    table.integer("order").notNullable();
    table.timestamp("createdAt", { useTz: true }).notNullable();
    table.uuid("createdBy").nullable().references("id").inTable("users");
    table.integer("minimumScore").nullable();
    table.primary(["opportunityVersion", "order"]);
  });

  await knex.schema.createTable("twuEvaluationPanelMembers", (table) => {
    table
      .uuid("opportunityVersion")
      .notNullable()
      .references("id")
      .inTable("twuOpportunityVersions")
      .onDelete("CASCADE");
    table.uuid("user").notNullable().references("id").inTable("users");
    table.boolean("chair").notNullable().defaultTo(false);
    table.boolean("evaluator").notNullable().defaultTo(false);
    table.integer("order").notNullable();
    table.primary(["opportunityVersion", "user"]);
  });

  await knex.schema.createTable("twuOpportunityStatuses", (table) => {
    table.uuid("id").primary();
    table.timestamp("createdAt", { useTz: true }).notNullable();
    table.uuid("createdBy").nullable().references("id").inTable("users");
    table
      .uuid("opportunity")
      .notNullable()
      .references("id")
      .inTable("twuOpportunities")
      .onDelete("CASCADE");
    table.text("status").nullable();
    table.text("event").nullable();
    table.text("note").nullable();
  });

  await knex.schema.createTable("twuProposals", (table) => {
    table.uuid("id").primary();
    table.timestamp("createdAt", { useTz: true }).notNullable();
    table.uuid("createdBy").nullable().references("id").inTable("users");
    table.timestamp("updatedAt", { useTz: true }).notNullable();
    table.uuid("updatedBy").nullable().references("id").inTable("users");
    table.integer("challengeScore").nullable();
    table.integer("priceScore").nullable();
    table
      .uuid("opportunity")
      .notNullable()
      .references("id")
      .inTable("twuOpportunities")
      .onDelete("CASCADE");
    table
      .uuid("organization")
      .nullable()
      .references("id")
      .inTable("organizations");
    table.text("anonymousProponentName").notNullable().defaultTo("");
  });

  await knex.schema.createTable("twuProposalStatuses", (table) => {
    table.uuid("id").primary();
    table.timestamp("createdAt", { useTz: true }).notNullable();
    table.uuid("createdBy").nullable().references("id").inTable("users");
    table
      .uuid("proposal")
      .notNullable()
      .references("id")
      .inTable("twuProposals")
      .onDelete("CASCADE");
    table.text("status").nullable();
    table.text("event").nullable();
    table.text("note").nullable();
  });

  await knex.schema.createTable("twuProposalMember", (table) => {
    table.uuid("member").notNullable().references("id").inTable("users");
    table
      .uuid("proposal")
      .notNullable()
      .references("id")
      .inTable("twuProposals")
      .onDelete("CASCADE");
    table.integer("hourlyRate").notNullable();
    table
      .uuid("resource")
      .notNullable()
      .references("id")
      .inTable("twuResources");
    table.primary(["member", "proposal"]);
  });

  await knex.schema.createTable("twuResourceQuestionResponses", (table) => {
    table
      .uuid("proposal")
      .notNullable()
      .references("id")
      .inTable("twuProposals")
      .onDelete("CASCADE");
    table.integer("order").notNullable();
    table.text("response").notNullable();
    table.integer("score").nullable();
    table.primary(["proposal", "order"]);
  });
};

/** @param {import("knex").Knex} knex */
exports.down = async function down(knex) {
  const tables = [
    "twuResourceQuestionResponses",
    "twuProposalMember",
    "twuProposalStatuses",
    "twuProposals",
    "twuOpportunityStatuses",
    "twuEvaluationPanelMembers",
    "twuResourceQuestions",
    "twuResources",
    "twuOpportunityVersions",
    "twuOpportunities",
    "swuTeamQuestionResponses",
    "swuProposalReferences",
    "swuProposalTeamMembers",
    "swuProposalPhases",
    "swuProposalStatuses",
    "swuProposals",
    "swuOpportunityStatuses",
    "swuEvaluationPanelMembers",
    "swuTeamQuestions",
    "swuPhaseCapabilities",
    "swuOpportunityPhases",
    "swuOpportunityVersions",
    "swuOpportunities",
    "cwuOpportunityStatuses",
    "cwuOpportunityVersions",
    "cwuOpportunities",
    "twuOrganizationServiceAreas",
    "serviceAreas",
    "contentVersions",
    "content",
    "affiliations",
    "organizations",
    "sessions",
    "users",
    "files",
    "fileBlobs",
  ];
  for (const table of tables) {
    await knex.schema.dropTableIfExists(table);
  }
};
