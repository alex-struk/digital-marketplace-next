"use strict";

/**
 * The pages a fresh installation needs (R-7.12), and the placeholder they carry until
 * somebody writes them.
 *
 * The set is the twenty-two the old application created for itself, minus the seven nothing
 * in the service links to, plus the service level agreement page the learn-more screens, the
 * program cards and the three opportunity forms all link to (R-7.18). Decision record 0008
 * records the reasoning and the addresses, which later slices bind to.
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
  // What the service commits to, linked from five places (R-7.18).
  "service-level-agreement",
  // A terms and conditions page for each of the three programs.
  "code-with-us-terms-and-conditions",
  "sprint-with-us-terms-and-conditions",
  "team-with-us-terms-and-conditions",
  // The prose the two programs with an evaluation panel embed in their own screens.
  "sprint-with-us-opportunity-scope",
  "sprint-with-us-proposal-evaluation",
  "team-with-us-proposal-evaluation",
  "sprint-with-us-evaluation-instructions",
  "team-with-us-evaluation-instructions",
]);

/** The body every needed page carries until an administrator writes it (R-7.12). */
const PLACEHOLDER_BODY = "Initial version";

/**
 * The seven pages the old application created for itself and linked to from nowhere. They
 * are not created here, and the addresses are kept so nobody re-adds one by accident
 * (the ruling recorded against D-content-27).
 *
 * @type {readonly string[]}
 */
const PAGES_NOT_CREATED = Object.freeze([
  "code-with-us-opportunity-guide",
  "code-with-us-proposal-guide",
  "sprint-with-us-opportunity-guide",
  "sprint-with-us-proposal-guide",
  "team-with-us-opportunity-guide",
  "team-with-us-proposal-guide",
  "team-with-us-opportunity-scope",
]);

module.exports = { PAGE_SLUGS, PLACEHOLDER_BODY, PAGES_NOT_CREATED };
