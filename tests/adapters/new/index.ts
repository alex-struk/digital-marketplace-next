// Adapter binding the abstract Surface to the running "new" target.
//
// Everything here was found by opening the application in a browser and looking at it.
// Controls are located by their role, their accessible name, their visible text, or the
// address they lead to — never by a class, an id or a test attribute, because there is no
// source in this workspace and a test must not depend on one.
//
// What this target is, as it stands
// ---------------------------------
// The application is a single-page client with its own router. Four addresses render a
// page of their own:
//
//   /                      the home page
//   /content/:slug         a published page
//   /learn-more/:program   the three program explainers
//   /status                plain text, "OK", answered by the service rather than the client
//
// Every other address in spec/contract/surface.yaml — the dashboard, the opportunity and
// proposal screens, the organization and user screens, the evaluation screens, the content
// management screens and the file addresses under /api — is answered by the client's own
// "Page not found" screen, or, under /api, by a 404 from the service. There is no sign-in
// anywhere: /sign-in and /auth/sign-in are both "Page not found", and the home page's
// "Sign in" link leads to the first of them, so no session can be established and no
// screen that needs one can be reached from any state.
//
// So the pages below fall into two kinds. Five are bound against what is actually on the
// screen. The rest report every action and observation as
// "unbound: <page>.<member> — <reason>", and so does their open(), so that a test which
// only opens such a page is not told it succeeded.

import type { Locator, Page } from "@playwright/test";
import type { Persona, persona as PersonaTable } from "../../generated/personas";
import type * as S from "../../generated/surface";

type Scope = Page | Locator;

export default function create(
  page: Page,
  ctx: { baseURL: string; persona: typeof PersonaTable },
): S.Surface {
  void ctx.persona;
  const baseURL = String(ctx.baseURL ?? "").replace(/\/+$/, "");

  // ---------------------------------------------------------------- navigation

  function address(route: string, params?: Record<string, string>): string {
    const supplied: Record<string, string | undefined> = params ?? {};
    const filled = route.replace(/:([A-Za-z0-9_]+)/g, (_match, name: string) => {
      const value =
        supplied[name] ??
        supplied[name.replace(/Id$/, "")] ??
        supplied.id ??
        supplied.slug;
      if (value === undefined || value === "") {
        // Not unbound: the address exists, the caller did not say which record to open.
        throw new Error(
          `open() of ${route} was called without a value for ":${name}" (given: ${JSON.stringify(params ?? {})})`,
        );
      }
      return String(value);
    });
    return baseURL + filled;
  }

  // The same, for an address that is not a page on this target: what a test did or did not
  // pass for a parameter cannot matter there, and complaining about it would hide the
  // reason the page could not be reached.
  function leniently(route: string, params?: Record<string, string>): string {
    const supplied: Record<string, string | undefined> = params ?? {};
    return (
      baseURL +
      route.replace(/:([A-Za-z0-9_]+)/g, (_match, name: string) =>
        String(supplied[name] ?? supplied[name.replace(/Id$/, "")] ?? supplied.id ?? supplied.slug ?? "unknown"),
      )
    );
  }

  const seen = (locator: Locator): Locator => locator.filter({ visible: true });

  async function settle(): Promise<void> {
    await page.waitForLoadState("domcontentloaded").catch(() => undefined);
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => undefined);
  }

  // A screen has rendered once its heading is up: the client draws the page after it has
  // fetched whatever the page is about.
  async function ready(): Promise<void> {
    await settle();
    await seen(page.getByRole("heading"))
      .first()
      .waitFor({ state: "visible", timeout: 10000 })
      .catch(() => undefined);
  }

  async function go(route: string, params?: Record<string, string>): Promise<void> {
    await page.goto(address(route, params), { waitUntil: "domcontentloaded" });
    await settle();
  }

  async function visit(href: string): Promise<void> {
    const target = /^https?:\/\//.exec(href) !== null ? href : baseURL + href;
    await page.goto(target, { waitUntil: "domcontentloaded" });
    await settle();
  }

  // ---------------------------------------------------------------- reading the screen

  async function bodyText(): Promise<string> {
    return (await page.evaluate(() => document.body.innerText)).trim();
  }

  // The page's own content, with the banner and the standing footer left off.
  async function mainText(): Promise<string> {
    await ready();
    const main = page.getByRole("main");
    if (await main.count()) return (await main.first().innerText()).trim();
    return bodyText();
  }

  async function textLines(): Promise<string[]> {
    return (await mainText())
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  // A value shown under its own label, the way this target draws a page's dates.
  async function valueAfter(labels: string[]): Promise<string> {
    const lines = await textLines();
    for (let i = 0; i < lines.length - 1; i++) if (labels.includes(lines[i])) return lines[i + 1];
    return "";
  }

  async function firstHeading(): Promise<string> {
    const heading = seen(page.getByRole("heading"));
    return (await heading.count()) ? (await heading.first().innerText()).trim() : "";
  }

  // What the client shows in place of a page it has no route for.
  async function notFoundShown(): Promise<boolean> {
    await ready();
    return (
      (await seen(page.getByRole("heading", { name: /^\s*page not found\s*$/i })).count()) > 0
    );
  }

  async function paragraphs(scope: Scope): Promise<string[]> {
    const found = seen(scope.getByRole("paragraph"));
    const count = await found.count();
    const out: string[] = [];
    for (let i = 0; i < count; i++) {
      const words = (await found.nth(i).innerText()).trim();
      if (words) out.push(words);
    }
    return out;
  }

  // ---------------------------------------------------------------- driving controls

  async function findControl(scope: Scope, name: RegExp): Promise<Locator | null> {
    for (const role of ["link", "button"] as const) {
      const found = seen(scope.getByRole(role, { name }));
      if (await found.count()) return found.first();
    }
    const words = seen(scope.getByText(name));
    const count = await words.count();
    // Ancestors carrying the same words come first in document order, so the last match is
    // the control itself rather than the box around it.
    return count ? words.nth(count - 1) : null;
  }

  async function isDisabled(control: Locator): Promise<boolean> {
    if (await control.isDisabled().catch(() => false)) return true;
    return (await control.getAttribute("aria-disabled").catch(() => null)) === "true";
  }

  // A disabled control is the page saying it is not ready, and is reported at once rather
  // than pressed until the test runs out of time.
  async function press(where: string, name: RegExp, scope: Scope = page): Promise<void> {
    await ready();
    const control = await findControl(scope, name);
    if (!control) {
      throw new Error(`unbound: ${where} — no control named ${name} on ${page.url()}`);
    }
    if (await isDisabled(control)) {
      throw new Error(`${where} — the control named ${name} is disabled on ${page.url()}`);
    }
    await control.click();
    await settle();
  }

  async function hrefOf(scope: Scope, name: RegExp): Promise<string> {
    const links = seen(scope.getByRole("link", { name }));
    if (!(await links.count())) return "";
    return (await links.first().getAttribute("href")) ?? "";
  }

  // ---------------------------------------------------------------- pages that are not here
  //
  // Every address the contract names that this target answers with its "Page not found"
  // screen, or with a 404 under /api. open() throws for the same reason its members do:
  // a test that opens one of these and reads nothing else must not be told it worked.

  const camel = (name: string): string => name.replace(/_([a-z0-9])/g, (_match, c: string) => c.toUpperCase());

  const notAPage = (route: string): string =>
    `${route} is not a page on this target — it answers the service's own "Page not found" screen`;

  function absent<T>(pageId: string, route: string, answers: string, members: readonly string[]): T {
    const built: Record<string, unknown> = {
      open: async (params?: Record<string, string>): Promise<void> => {
        // Under /api there is nothing for a browser to show, so nothing is opened.
        if (route.startsWith("/api/")) {
          throw new Error(`unbound: ${pageId}.open — ${answers}`);
        }
        await page
          .goto(leniently(route, params), { waitUntil: "domcontentloaded" })
          .catch(() => undefined);
        await settle();
        // What the address actually answered this time, rather than what it answered when
        // this adapter was written.
        const shown = await firstHeading().catch(() => "");
        throw new Error(
          `unbound: ${pageId}.open — ${answers}${shown ? ` (it shows "${shown}")` : ""}`,
        );
      },
    };
    for (const member of members) {
      built[camel(member)] = async (): Promise<never> => {
        throw new Error(`unbound: ${pageId}.${member} — ${answers}`);
      };
    }
    return built as unknown as T;
  }

  // ---------------------------------------------------------------- sign in and out

  type SignInEntry = { route?: string; username?: string; unavailable?: string };

  // This target signs in through the sandbox identity provider, so a persona's username is
  // read from persona.signIn["sandbox-idp"] and the password from the environment — never
  // from anything written down in the suite.
  //
  // Nothing here has ever succeeded against this target: it has no sign-in screen and no
  // route to an identity provider. The attempt is still made rather than assumed, so that
  // the reason reported is what the target did when asked, and so that the day it grows a
  // sign-in form this keeps working.
  async function signIn(who: Persona): Promise<void> {
    const table = who.signIn as unknown as null | Record<string, SignInEntry>;
    if (!table) {
      // The anonymous visitor has no account; being signed out is the whole state.
      await signOut();
      return;
    }
    const where = `signIn.${who.id}`;
    const entry = table["sandbox-idp"];
    if (!entry || entry.unavailable !== undefined || !entry.username) {
      throw new Error(
        `unbound: ${where} — ${entry?.unavailable ?? "this persona has no sandbox identity provider account"}`,
      );
    }
    const password = process.env.SDLC_SANDBOX_PASSWORD;
    if (!password) {
      throw new Error(
        `unbound: ${where} — SDLC_SANDBOX_PASSWORD is not set, so there is no password to sign in with`,
      );
    }

    // The way in, if there is one: the sign-in screen, or the offer of one on the home page.
    await page.goto(baseURL + "/sign-in", { waitUntil: "domcontentloaded" });
    await settle();
    if (await notFoundShown()) {
      await page.goto(baseURL + "/", { waitUntil: "domcontentloaded" });
      await settle();
      const offer = await findControl(page, /^\s*sign in\b/i);
      if (offer) {
        await offer.click();
        await settle();
      }
    }

    const form = await identityProviderForm();
    if (!form) {
      throw new Error(
        `unbound: ${where} — this target offers no way to sign in: "/sign-in" and the home page's "Sign in" link both end on the service's own "Page not found" screen, and no identity provider form with a username and a password is reachable from it (ended on ${page.url()})`,
      );
    }
    await form.username.fill(entry.username);
    await form.password.fill(password);
    const submit = await findControl(page, /^(sign in|log in|continue|submit)$/i);
    if (!submit) {
      throw new Error(
        `unbound: ${where} — the identity provider form on ${page.url()} offers nothing to submit it with`,
      );
    }
    await submit.click();
    await page
      .waitForURL((url) => url.origin === new URL(baseURL).origin, { timeout: 30000 })
      .catch(() => undefined);
    await settle();
  }

  async function identityProviderForm(): Promise<{ username: Locator; password: Locator } | null> {
    const username = seen(page.getByLabel(/user\s*name|email|account/i)).first();
    const password = seen(page.getByLabel(/password/i)).first();
    if ((await username.count()) && (await password.count())) return { username, password };
    return null;
  }

  // There is no session to end on this target and no "/sign-out" screen to end it on, so
  // being signed out is a matter of the browser carrying nothing: the cookies go, and the
  // browser is left on the one page that is always readable.
  async function signOut(): Promise<void> {
    await page.context().clearCookies().catch(() => undefined);
    await page.goto(baseURL + "/", { waitUntil: "domcontentloaded" });
    await settle();
  }

  // ================================================================ the pages that are here

  // ---------------------------------------------------------------- home

  const home: S.HomePage = {
    open: () => go("/"),
    browseOpportunities: () => press("home.browse_opportunities", /^browse opportunities$/i),
    signIn: () => press("home.sign_in", /^sign in$/i),
    signUp: () => press("home.sign_up", /^sign up$/i),
    // The home page carries no figure for what the service has awarded: no such number and
    // no label naming one, anywhere on it. It is looked for rather than assumed away.
    totalAwardedOpportunityCount: async () => {
      const found = await valueAfter(["Total Opportunities Awarded", "Opportunities awarded"]);
      if (found) return found;
      throw new Error(
        `unbound: home.total_awarded_opportunity_count — the home page carries no count of awarded opportunities; it reads: ${(await mainText()).replace(/\n+/g, " | ")}`,
      );
    },
    totalAwardedOpportunityValue: async () => {
      const found = await valueAfter(["Total Value of All Opportunities", "Value of awarded opportunities"]);
      if (found) return found;
      throw new Error(
        `unbound: home.total_awarded_opportunity_value — the home page carries no total value of awarded opportunities; it reads: ${(await mainText()).replace(/\n+/g, " | ")}`,
      );
    },
    readableWhenSignedOut: () => mainText(),
  };

  // ---------------------------------------------------------------- the service's own status

  // Not a screen. The address answers "OK" as plain text, and requesting it is the act the
  // contract names — the one a test performs instead of waiting for a clock.
  const scheduledTransitionTrigger: S.ScheduledTransitionTriggerPage = {
    open: () => go("/status"),
    runPendingTransitions: async () => {
      await visit("/status");
      const answered = await bodyText();
      if (!answered) {
        throw new Error(
          `unbound: scheduled-transition-trigger.run_pending_transitions — ${baseURL}/status answered nothing`,
        );
      }
    },
    serviceIsUp: async () => {
      if (new URL(page.url()).pathname !== "/status") await visit("/status");
      return bodyText();
    },
  };

  // ---------------------------------------------------------------- the footer

  const footer = (): Locator => page.getByRole("contentinfo").first();

  async function footerLink(name: RegExp): Promise<string> {
    await ready();
    if (!(await footer().count())) return "";
    return hrefOf(footer(), name);
  }

  async function openFromFooter(where: string, name: RegExp): Promise<void> {
    await ready();
    if (!(await footer().count())) {
      throw new Error(`unbound: ${where} — this page carries no footer (${page.url()})`);
    }
    await press(where, name, footer());
  }

  const contentFooter: S.ContentFooterPage = {
    open: () => go("/"),
    openAbout: () => openFromFooter("content-footer.open_about", /^about$/i),
    openDisclaimer: () => openFromFooter("content-footer.open_disclaimer", /^disclaimer$/i),
    openPrivacy: () => openFromFooter("content-footer.open_privacy", /^privacy$/i),
    openAccessibility: () => openFromFooter("content-footer.open_accessibility", /^accessibility$/i),
    openCopyright: () => openFromFooter("content-footer.open_copyright", /^copyright$/i),
    aboutLink: () => footerLink(/^about$/i),
    disclaimerLink: () => footerLink(/^disclaimer$/i),
    privacyLink: () => footerLink(/^privacy$/i),
    accessibilityLink: () => footerLink(/^accessibility$/i),
    copyrightLink: () => footerLink(/^copyright$/i),
    presentWhenSignedOut: async () => {
      await ready();
      return (await footer().count()) ? (await footer().innerText()).trim() : "";
    },
  };

  // ---------------------------------------------------------------- the service level agreement link

  const slaLink = (): Locator =>
    seen(page.getByRole("link", { name: /service level agreement/i }));

  const contentServiceLevelAgreementLink: S.ContentServiceLevelAgreementLinkPage = {
    open: () => go("/learn-more/code-with-us"),
    followServiceLevelAgreementLink: async () => {
      await ready();
      const href = (await slaLink().count()) ? await slaLink().first().getAttribute("href") : null;
      if (!href) {
        throw new Error(
          `unbound: content-service-level-agreement-link.follow_service_level_agreement_link — no service level agreement link on ${page.url()}`,
        );
      }
      await visit(href);
    },
    serviceLevelAgreementLink: async () => {
      await ready();
      return (await slaLink().count()) ? (await slaLink().first().innerText()).trim() : "";
    },
    linkTargetAddress: async () => {
      await ready();
      return ((await slaLink().count()) ? await slaLink().first().getAttribute("href") : null) ?? "";
    },
    answerAtLinkTarget: async () => {
      await ready();
      if (await slaLink().count()) {
        const href = await slaLink().first().getAttribute("href");
        if (href) await visit(href);
      }
      return mainText();
    },
  };

  // ---------------------------------------------------------------- a published page

  const ADDRESS_LINE = /^Address of this page:\s*(\S+)/;

  async function statedAddress(): Promise<string> {
    for (const line of await textLines()) {
      const found = ADDRESS_LINE.exec(line);
      if (found) return found[1];
    }
    return "";
  }

  // The body the page is showing, without the line stating the page's own address.
  async function pageBodyText(): Promise<string> {
    const main = page.getByRole("main");
    if (!(await main.count())) return "";
    return (await paragraphs(main.first()))
      .filter((words) => ADDRESS_LINE.exec(words) === null)
      .join("\n");
  }

  const contentView: S.ContentViewPage = {
    // An address with no page behind it is something a criterion is about, so this never
    // refuses to open one: what the service answered is read back by the observations.
    open: (params) => go("/content/:slug", params as unknown as Record<string, string>),
    followBodyLink: async () => {
      if (await notFoundShown()) {
        throw new Error(
          `unbound: content-view.follow_body_link — no page is published at ${page.url()}, so there is no body to follow a link in`,
        );
      }
      const main = page.getByRole("main");
      const links = (await main.count())
        ? seen(main.first().getByRole("link"))
        : seen(page.getByRole("link"));
      const count = await links.count();
      for (let i = 0; i < count; i++) {
        const href = (await links.nth(i).getAttribute("href")) ?? "";
        // The banner's and the footer's links are not the page's own body.
        if (!href || href.startsWith("#")) continue;
        await links.nth(i).click();
        await settle();
        return;
      }
      throw new Error(
        `unbound: content-view.follow_body_link — the body of the page at ${page.url()} carries no link, and this target has no screen on which a page with one could be written`,
      );
    },
    pageAddress: async () => {
      if (await notFoundShown()) return "";
      const stated = await statedAddress();
      return stated || new URL(page.url()).pathname;
    },
    pageTitle: async () => {
      if (await notFoundShown()) return "";
      const heading = seen(page.getByRole("heading", { level: 1 }));
      return (await heading.count()) ? (await heading.first().innerText()).trim() : "";
    },
    pageBody: async () => ((await notFoundShown()) ? "" : pageBodyText()),
    publishedDate: async () => ((await notFoundShown()) ? "" : valueAfter(["Published"])),
    updatedDate: async () =>
      (await notFoundShown()) ? "" : valueAfter(["Last updated", "Updated"]),
    readableWhenSignedOut: () => mainText(),
    notFoundForUnknownAddress: async () => ((await notFoundShown()) ? mainText() : ""),
  };

  // ================================================================ the pages that are not

  const NO_FILE_ROUTE =
    'there is no file address on this target: POST /api/files answers 404 "Cannot POST /api/files" and GET /api/files/<id> answers 404 "Cannot GET /api/files/<id>" for a well-formed identifier, so nothing can be stored and nothing can be read back';

  const surface: S.Surface = {
    signIn,
    signOut,

    home,

    opportunityDashboard: absent<S.OpportunityDashboardPage>(
      "opportunity-dashboard",
      "/dashboard",
      notAPage("/dashboard"),
      [
        "create_opportunity",
        "open_opportunity",
        "my_opportunities_table",
        "opportunity_status",
        "own_opportunities_only",
        "all_opportunities_for_administrator",
        "empty_my_opportunities_message",
      ],
    ),

    opportunityList: absent<S.OpportunityListPage>(
      "opportunity-list",
      "/opportunities",
      notAPage("/opportunities"),
      [
        "filter_by_program",
        "filter_by_status",
        "filter_remote_only",
        "search",
        "toggle_watch",
        "unpublished_group",
        "open_group",
        "closed_group",
        "opportunity_status",
        "proposal_deadline",
      ],
    ),

    opportunityProgramSelect: absent<S.OpportunityProgramSelectPage>(
      "opportunity-program-select",
      "/opportunities/create",
      notAPage("/opportunities/create"),
      ["choose_code_with_us", "choose_sprint_with_us", "choose_team_with_us", "program_card", "max_budget"],
    ),

    opportunityCwuCreate: absent<S.OpportunityCwuCreatePage>(
      "opportunity-cwu-create",
      "/opportunities/code-with-us/create",
      notAPage("/opportunities/code-with-us/create"),
      ["save_draft", "submit_for_review", "publish", "add_attachment", "field_error"],
    ),

    opportunityCwuView: absent<S.OpportunityCwuViewPage>(
      "opportunity-cwu-view",
      "/opportunities/code-with-us/:opportunityId",
      notAPage("/opportunities/code-with-us/:opportunityId"),
      [
        "toggle_watch",
        "start_proposal",
        "opportunity_identifier",
        "status",
        "published_date",
        "created_by_name",
        "last_changed_by_name",
        "proposal_deadline",
        "reward",
        "addenda",
        "successful_proponent",
      ],
    ),

    opportunityCwuEdit: absent<S.OpportunityCwuEditPage>(
      "opportunity-cwu-edit",
      "/opportunities/code-with-us/:opportunityId/edit",
      notAPage("/opportunities/code-with-us/:opportunityId/edit"),
      [
        "edit_details",
        "submit_for_review",
        "publish",
        "cancel_opportunity",
        "delete_opportunity",
        "add_addendum",
        "add_note",
        "opportunity_identifier",
        "created_by_name",
        "last_changed_by_name",
        "summary_tab",
        "opportunity_tab",
        "addenda_tab",
        "history_tab",
        "proposals_tab",
        "reporting_views",
        "reporting_watchers",
        "reporting_proposals",
      ],
    ),

    opportunityCwuComplete: absent<S.OpportunityCwuCompletePage>(
      "opportunity-cwu-complete",
      "/opportunities/code-with-us/:opportunityId/complete",
      notAPage("/opportunities/code-with-us/:opportunityId/complete"),
      ["full_report"],
    ),

    opportunitySwuCreate: absent<S.OpportunitySwuCreatePage>(
      "opportunity-swu-create",
      "/opportunities/sprint-with-us/create",
      notAPage("/opportunities/sprint-with-us/create"),
      [
        "save_draft",
        "submit_for_review",
        "publish",
        "add_phase",
        "add_team_question",
        "set_evaluation_panel",
        "field_error",
        "score_weight_error",
      ],
    ),

    opportunitySwuView: absent<S.OpportunitySwuViewPage>(
      "opportunity-swu-view",
      "/opportunities/sprint-with-us/:opportunityId",
      notAPage("/opportunities/sprint-with-us/:opportunityId"),
      [
        "toggle_watch",
        "start_proposal",
        "opportunity_identifier",
        "status",
        "published_date",
        "created_by_name",
        "last_changed_by_name",
        "proposal_deadline",
        "total_max_budget",
        "phases",
        "addenda",
        "successful_proponent",
      ],
    ),

    opportunitySwuEdit: absent<S.OpportunitySwuEditPage>(
      "opportunity-swu-edit",
      "/opportunities/sprint-with-us/:opportunityId/edit",
      notAPage("/opportunities/sprint-with-us/:opportunityId/edit"),
      [
        "edit_details",
        "submit_for_review",
        "publish",
        "cancel_opportunity",
        "delete_opportunity",
        "add_addendum",
        "add_note",
        "edit_evaluation_panel",
        "finalize_question_consensuses",
        "start_team_scenario",
        "opportunity_identifier",
        "created_by_name",
        "last_changed_by_name",
        "summary_tab",
        "opportunity_tab",
        "addenda_tab",
        "history_tab",
        "proposals_tab",
        "team_questions_tab",
        "code_challenge_tab",
        "team_scenario_tab",
        "evaluation_panel_tab",
        "consensus_tab",
      ],
    ),

    opportunitySwuComplete: absent<S.OpportunitySwuCompletePage>(
      "opportunity-swu-complete",
      "/opportunities/sprint-with-us/:opportunityId/complete",
      notAPage("/opportunities/sprint-with-us/:opportunityId/complete"),
      ["full_report"],
    ),

    opportunityTwuCreate: absent<S.OpportunityTwuCreatePage>(
      "opportunity-twu-create",
      "/opportunities/team-with-us/create",
      notAPage("/opportunities/team-with-us/create"),
      [
        "save_draft",
        "submit_for_review",
        "publish",
        "add_resource",
        "add_resource_question",
        "set_evaluation_panel",
        "field_error",
        "score_weight_error",
      ],
    ),

    opportunityTwuView: absent<S.OpportunityTwuViewPage>(
      "opportunity-twu-view",
      "/opportunities/team-with-us/:opportunityId",
      notAPage("/opportunities/team-with-us/:opportunityId"),
      [
        "toggle_watch",
        "start_proposal",
        "opportunity_identifier",
        "status",
        "published_date",
        "created_by_name",
        "last_changed_by_name",
        "proposal_deadline",
        "max_budget",
        "resources",
        "addenda",
        "successful_proponent",
      ],
    ),

    opportunityTwuEdit: absent<S.OpportunityTwuEditPage>(
      "opportunity-twu-edit",
      "/opportunities/team-with-us/:opportunityId/edit",
      notAPage("/opportunities/team-with-us/:opportunityId/edit"),
      [
        "edit_details",
        "submit_for_review",
        "publish",
        "cancel_opportunity",
        "delete_opportunity",
        "add_addendum",
        "edit_evaluation_panel",
        "finalize_question_consensuses",
        "opportunity_identifier",
        "created_by_name",
        "last_changed_by_name",
        "summary_tab",
        "opportunity_tab",
        "addenda_tab",
        "history_tab",
        "proposals_tab",
        "resource_questions_tab",
        "challenge_tab",
        "evaluation_panel_tab",
        "consensus_tab",
      ],
    ),

    opportunityTwuComplete: absent<S.OpportunityTwuCompletePage>(
      "opportunity-twu-complete",
      "/opportunities/team-with-us/:opportunityId/complete",
      notAPage("/opportunities/team-with-us/:opportunityId/complete"),
      ["full_report"],
    ),

    scheduledTransitionTrigger,

    proposalCwuCreate: absent<S.ProposalCwuCreatePage>(
      "proposal-cwu-create",
      "/opportunities/code-with-us/:opportunityId/proposals/create",
      notAPage("/opportunities/code-with-us/:opportunityId/proposals/create"),
      [
        "choose_proponent_individual",
        "choose_proponent_organization",
        "add_attachment",
        "save_draft",
        "submit_proposal",
        "accept_program_terms",
        "accept_app_terms",
        "cancel",
        "field_error",
        "opportunity_summary",
        "terms_modal",
        "submit_disabled_until_terms_accepted",
      ],
    ),

    proposalCwuEdit: absent<S.ProposalCwuEditPage>(
      "proposal-cwu-edit",
      "/opportunities/code-with-us/:opportunityId/proposals/:proposalId/edit",
      notAPage("/opportunities/code-with-us/:opportunityId/proposals/:proposalId/edit"),
      [
        "start_editing",
        "save_changes",
        "save_changes_and_submit",
        "submit_proposal",
        "withdraw_proposal",
        "delete_proposal",
        "add_attachment",
        "remove_attachment",
        "proposal_identifier",
        "opportunity_identifier",
        "proposal_tab",
        "status",
        "submitted_at",
        "score",
        "rank",
        "available_actions",
      ],
    ),

    proposalCwuView: absent<S.ProposalCwuViewPage>(
      "proposal-cwu-view",
      "/opportunities/code-with-us/:opportunityId/proposals/:proposalId",
      notAPage("/opportunities/code-with-us/:opportunityId/proposals/:proposalId"),
      [
        "enter_score",
        "award_proposal",
        "disqualify_proposal",
        "proposal_identifier",
        "proposal_tab",
        "history_tab",
        "proponent",
        "score",
        "rank",
        "export_link",
      ],
    ),

    proposalCwuExportOne: absent<S.ProposalCwuExportOnePage>(
      "proposal-cwu-export-one",
      "/opportunities/code-with-us/:opportunityId/proposals/:proposalId/export",
      notAPage("/opportunities/code-with-us/:opportunityId/proposals/:proposalId/export"),
      ["exported_proposal"],
    ),

    proposalCwuExportAll: absent<S.ProposalCwuExportAllPage>(
      "proposal-cwu-export-all",
      "/opportunities/code-with-us/:opportunityId/proposals/export",
      notAPage("/opportunities/code-with-us/:opportunityId/proposals/export"),
      ["exported_proposal"],
    ),

    proposalSwuCreate: absent<S.ProposalSwuCreatePage>(
      "proposal-swu-create",
      "/opportunities/sprint-with-us/:opportunityId/proposals/create",
      notAPage("/opportunities/sprint-with-us/:opportunityId/proposals/create"),
      [
        "choose_organization",
        "add_phase_team_member",
        "set_scrum_master",
        "set_phase_proposed_cost",
        "answer_team_question",
        "add_reference",
        "add_attachment",
        "save_draft",
        "submit_proposal",
        "accept_program_terms",
        "accept_app_terms",
        "field_error",
        "capability_gap_error",
        "budget_exceeded_error",
        "unqualified_organization_notice",
        "pending_team_member",
      ],
    ),

    proposalSwuEdit: absent<S.ProposalSwuEditPage>(
      "proposal-swu-edit",
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/edit",
      notAPage("/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/edit"),
      [
        "start_editing",
        "save_changes",
        "save_changes_and_submit",
        "submit_proposal",
        "withdraw_proposal",
        "delete_proposal",
        "proposal_identifier",
        "opportunity_identifier",
        "proposal_tab",
        "scoresheet_tab",
        "status",
        "anonymous_proponent_name",
        "total_score",
        "rank",
      ],
    ),

    proposalSwuView: absent<S.ProposalSwuViewPage>(
      "proposal-swu-view",
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId",
      notAPage("/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId"),
      [
        "score_code_challenge",
        "screen_in_to_team_scenario",
        "screen_out_from_team_scenario",
        "score_team_scenario",
        "award_proposal",
        "disqualify_proposal",
        "proposal_identifier",
        "proposal_tab",
        "team_questions_tab",
        "code_challenge_tab",
        "team_scenario_tab",
        "history_tab",
        "wrong_stage_error",
        "questions_score",
        "challenge_score",
        "scenario_score",
        "price_score",
        "total_score",
      ],
    ),

    proposalSwuExportOne: absent<S.ProposalSwuExportOnePage>(
      "proposal-swu-export-one",
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/export",
      notAPage("/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/export"),
      ["exported_proposal", "anonymous_proponent_name"],
    ),

    proposalSwuExportAll: absent<S.ProposalSwuExportAllPage>(
      "proposal-swu-export-all",
      "/opportunities/sprint-with-us/:opportunityId/proposals/export",
      notAPage("/opportunities/sprint-with-us/:opportunityId/proposals/export"),
      ["exported_proposal"],
    ),

    proposalTwuCreate: absent<S.ProposalTwuCreatePage>(
      "proposal-twu-create",
      "/opportunities/team-with-us/:opportunityId/proposals/create",
      notAPage("/opportunities/team-with-us/:opportunityId/proposals/create"),
      [
        "choose_organization",
        "add_team_member_for_resource",
        "set_hourly_rate",
        "answer_resource_question",
        "add_attachment",
        "save_draft",
        "submit_proposal",
        "accept_program_terms",
        "accept_app_terms",
        "field_error",
        "service_area_error",
        "unqualified_organization_notice",
      ],
    ),

    proposalTwuEdit: absent<S.ProposalTwuEditPage>(
      "proposal-twu-edit",
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/edit",
      notAPage("/opportunities/team-with-us/:opportunityId/proposals/:proposalId/edit"),
      [
        "start_editing",
        "save_changes",
        "save_changes_and_submit",
        "submit_proposal",
        "withdraw_proposal",
        "delete_proposal",
        "proposal_identifier",
        "opportunity_identifier",
        "proposal_tab",
        "scoresheet_tab",
        "status",
        "anonymous_proponent_name",
        "total_score",
        "rank",
      ],
    ),

    proposalTwuView: absent<S.ProposalTwuViewPage>(
      "proposal-twu-view",
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId",
      notAPage("/opportunities/team-with-us/:opportunityId/proposals/:proposalId"),
      [
        "score_resource_questions",
        "screen_in_to_challenge",
        "screen_out_from_challenge",
        "score_challenge",
        "award_proposal",
        "disqualify_proposal",
        "proposal_identifier",
        "proposal_tab",
        "resource_questions_tab",
        "challenge_tab",
        "history_tab",
        "wrong_stage_error",
        "questions_score",
        "challenge_score",
        "price_score",
        "total_score",
      ],
    ),

    proposalTwuExportOne: absent<S.ProposalTwuExportOnePage>(
      "proposal-twu-export-one",
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/export",
      notAPage("/opportunities/team-with-us/:opportunityId/proposals/:proposalId/export"),
      ["exported_proposal"],
    ),

    proposalTwuExportAll: absent<S.ProposalTwuExportAllPage>(
      "proposal-twu-export-all",
      "/opportunities/team-with-us/:opportunityId/proposals/export",
      notAPage("/opportunities/team-with-us/:opportunityId/proposals/export"),
      ["exported_proposal"],
    ),

    proposalVendorDashboard: absent<S.ProposalVendorDashboardPage>(
      "proposal-vendor-dashboard",
      "/dashboard",
      notAPage("/dashboard"),
      [
        "show_my_proposals",
        "show_org_proposals",
        "my_proposals_table",
        "org_proposals_table",
        "proposal_status",
        "empty_my_proposals_message",
        "empty_org_proposals_message",
      ],
    ),

    proposalListStub: absent<S.ProposalListStubPage>(
      "proposal-list-stub",
      "/proposals",
      notAPage("/proposals"),
      ["placeholder_text"],
    ),

    organizationList: absent<S.OrganizationListPage>(
      "organization-list",
      "/organizations",
      notAPage("/organizations"),
      [
        "change_page",
        "open_organization",
        "create_organization",
        "my_organizations",
        "organization_name",
        "owner_name",
        "swu_qualified_mark",
        "twu_qualified_mark",
        "pagination",
        "refused_when_not_permitted",
      ],
    ),

    organizationCreate: absent<S.OrganizationCreatePage>(
      "organization-create",
      "/organizations/create",
      notAPage("/organizations/create"),
      ["create_organization", "cancel", "change_logo", "field_error", "submit_disabled_until_valid"],
    ),

    organizationEdit: absent<S.OrganizationEditPage>(
      "organization-edit",
      "/organizations/:orgId/edit",
      notAPage("/organizations/:orgId/edit"),
      [
        "edit_organization",
        "save_changes",
        "cancel_editing",
        "archive_organization",
        "add_team_members",
        "approve_pending_member",
        "remove_team_member",
        "toggle_member_admin_status",
        "accept_org_admin_terms",
        "change_owner",
        "edit_service_areas",
        "save_service_areas",
        "view_swu_terms",
        "view_twu_terms",
        "organization_identifier",
        "organization_tab",
        "team_tab",
        "swu_qualification_tab",
        "twu_qualification_tab",
        "changelog_tab",
        "swu_qualified_badge",
        "twu_qualified_badge",
        "owner_badge",
        "pending_badge",
        "team_member_row",
        "team_capabilities",
        "swu_requirement_two_members",
        "swu_requirement_all_capabilities",
        "swu_requirement_terms_accepted",
        "twu_requirement_service_area",
        "twu_requirement_terms_accepted",
        "service_area_checkbox",
        "not_qualified_notice",
        "changelog_entry",
        "field_error",
        "invalid_membership_type_error",
      ],
    ),

    organizationSwuTerms: absent<S.OrganizationSwuTermsPage>(
      "organization-swu-terms",
      "/organizations/:orgId/sprint-with-us-terms-and-conditions",
      notAPage("/organizations/:orgId/sprint-with-us-terms-and-conditions"),
      ["accept_terms", "cancel", "terms_body", "accepted_on_notice"],
    ),

    organizationTwuTerms: absent<S.OrganizationTwuTermsPage>(
      "organization-twu-terms",
      "/organizations/:orgId/team-with-us-terms-and-conditions",
      notAPage("/organizations/:orgId/team-with-us-terms-and-conditions"),
      ["accept_terms", "cancel", "terms_body", "accepted_on_notice"],
    ),

    organizationUserMemberships: absent<S.OrganizationUserMembershipsPage>(
      "organization-user-memberships",
      "/users/:userId?tab=organizations",
      notAPage("/users/:userId?tab=organizations"),
      [
        "approve_invitation",
        "reject_invitation",
        "leave_organization",
        "create_organization",
        "open_organization",
        "owned_organizations_table",
        "affiliated_organizations_table",
        "pending_badge",
        "team_member_count",
        "swu_qualified_mark",
        "empty_owned_message",
        "empty_affiliated_message",
        "accept_confirmation",
        "decline_confirmation",
      ],
    ),

    userSignIn: absent<S.UserSignInPage>(
      "user-sign-in",
      "/sign-in",
      notAPage("/sign-in"),
      [
        "sign_in_as_vendor",
        "sign_in_as_public_sector_employee",
        "go_to_sign_up",
        "vendor_card",
        "public_sector_card",
      ],
    ),

    userSignUpChooseAccount: absent<S.UserSignUpChooseAccountPage>(
      "user-sign-up-choose-account",
      "/sign-up",
      notAPage("/sign-up"),
      ["sign_up_as_vendor", "sign_up_as_public_sector_employee", "vendor_card", "public_sector_card"],
    ),

    userSignUpComplete: absent<S.UserSignUpCompletePage>(
      "user-sign-up-complete",
      "/sign-up/complete",
      notAPage("/sign-up/complete"),
      [
        "change_avatar",
        "accept_app_terms",
        "toggle_new_opportunity_notifications",
        "complete_profile",
        "idp_username_readonly",
        "name_field",
        "email_field",
        "job_title_field",
        "terms_checkbox",
        "complete_disabled_until_terms_accepted",
        "field_error",
      ],
    ),

    userSignOut: absent<S.UserSignOutPage>(
      "user-sign-out",
      "/sign-out",
      notAPage("/sign-out"),
      ["signed_out_message", "sign_out_failed_message"],
    ),

    userNotice: absent<S.UserNoticePage>(
      "user-notice",
      "/notice/:noticeId",
      notAPage("/notice/:noticeId"),
      ["back_to_home", "deactivated_own_account_notice", "sign_in_failed_notice"],
    ),

    userList: absent<S.UserListPage>(
      "user-list",
      "/users",
      notAPage("/users"),
      [
        "search_by_name",
        "open_export_contact_list",
        "toggle_export_user_type",
        "toggle_export_field",
        "export_contact_list",
        "cancel_export",
        "open_user_profile",
        "user_row",
        "status_badge",
        "account_type",
        "admin_check",
        "export_modal",
        "export_disabled_until_selection",
      ],
    ),

    userProfile: absent<S.UserProfilePage>(
      "user-profile",
      "/users/:userId",
      notAPage("/users/:userId"),
      [
        "edit_profile",
        "save_changes",
        "cancel_editing",
        "change_avatar",
        "toggle_admin_permission",
        "deactivate_account",
        "reactivate_account",
        "confirm_activation_change",
        "cancel_activation_change",
        "user_identifier",
        "profile_tab",
        "capabilities_tab",
        "notifications_tab",
        "legal_tab",
        "organizations_tab",
        "status_badge",
        "account_type",
        "permissions_label",
        "admin_checkbox",
        "idp_username_readonly",
        "name_field",
        "email_field",
        "job_title_field",
        "field_error",
        "activation_modal",
        "not_found_page",
      ],
    ),

    userProfileCapabilities: absent<S.UserProfileCapabilitiesPage>(
      "user-profile-capabilities",
      "/users/:userId?tab=capabilities",
      notAPage("/users/:userId?tab=capabilities"),
      [
        "toggle_capability",
        "expand_capability_description",
        "capability_row",
        "capability_checked",
        "capability_description",
      ],
    ),

    userProfileNotifications: absent<S.UserProfileNotificationsPage>(
      "user-profile-notifications",
      "/users/:userId?tab=notifications",
      notAPage("/users/:userId?tab=notifications"),
      [
        "toggle_new_opportunity_notifications",
        "confirm_unsubscribe",
        "cancel_unsubscribe",
        "new_opportunities_checkbox",
        "notification_email_address",
        "unsubscribe_modal",
      ],
    ),

    userProfileLegal: absent<S.UserProfileLegalPage>(
      "user-profile-legal",
      "/users/:userId?tab=legal",
      notAPage("/users/:userId?tab=legal"),
      [
        "open_app_terms",
        "accept_updated_terms",
        "confirm_accept_updated_terms",
        "privacy_policy",
        "app_terms_link",
        "accepted_on_notice",
        "terms_updated_warning",
        "program_terms_links",
        "accept_updated_terms_modal",
      ],
    ),

    userProfileSelf: absent<S.UserProfileSelfPage>(
      "user-profile-self",
      "/users/me",
      notAPage("/users/me"),
      [
        "edit_profile",
        "save_changes",
        "cancel_editing",
        "change_avatar",
        "deactivate_account",
        "confirm_activation_change",
        "cancel_activation_change",
        "user_identifier",
        "profile_tab",
        "capabilities_tab",
        "notifications_tab",
        "legal_tab",
        "organizations_tab",
        "status_badge",
        "account_type",
        "idp_username_readonly",
        "name_field",
        "email_field",
        "job_title_field",
        "field_error",
        "activation_modal",
        "sign_in_required",
      ],
    ),

    userProfileSelfCapabilities: absent<S.UserProfileSelfCapabilitiesPage>(
      "user-profile-self-capabilities",
      "/users/me?tab=capabilities",
      notAPage("/users/me?tab=capabilities"),
      [
        "toggle_capability",
        "expand_capability_description",
        "capability_row",
        "capability_checked",
        "capability_description",
      ],
    ),

    userProfileSelfNotifications: absent<S.UserProfileSelfNotificationsPage>(
      "user-profile-self-notifications",
      "/users/me?tab=notifications",
      notAPage("/users/me?tab=notifications"),
      [
        "toggle_new_opportunity_notifications",
        "confirm_unsubscribe",
        "cancel_unsubscribe",
        "new_opportunities_checkbox",
        "notification_email_address",
        "unsubscribe_modal",
      ],
    ),

    userProfileSelfLegal: absent<S.UserProfileSelfLegalPage>(
      "user-profile-self-legal",
      "/users/me?tab=legal",
      notAPage("/users/me?tab=legal"),
      [
        "open_app_terms",
        "accept_updated_terms",
        "confirm_accept_updated_terms",
        "privacy_policy",
        "app_terms_link",
        "accepted_on_notice",
        "terms_updated_warning",
        "program_terms_links",
        "accept_updated_terms_modal",
      ],
    ),

    organizationUserMembershipsSelf: absent<S.OrganizationUserMembershipsSelfPage>(
      "organization-user-memberships-self",
      "/users/me?tab=organizations",
      notAPage("/users/me?tab=organizations"),
      [
        "approve_invitation",
        "reject_invitation",
        "leave_organization",
        "create_organization",
        "open_organization",
        "owned_organizations_table",
        "affiliated_organizations_table",
        "pending_badge",
        "team_member_count",
        "swu_qualified_mark",
        "empty_owned_message",
        "empty_affiliated_message",
        "accept_confirmation",
        "decline_confirmation",
      ],
    ),

    evaluationPanelDashboard: absent<S.EvaluationPanelDashboardPage>(
      "evaluation-panel-dashboard",
      "/dashboard",
      notAPage("/dashboard"),
      [
        "show_my_opportunities",
        "show_panel_opportunities",
        "open_opportunity",
        "evaluations_tab",
        "panel_opportunities_table",
        "opportunity_status",
        "empty_panel_opportunities_message",
      ],
    ),

    evaluationPanelSwu: absent<S.EvaluationPanelSwuPage>(
      "evaluation-panel-swu",
      "/opportunities/sprint-with-us/:opportunityId/edit?tab=evaluationPanel",
      notAPage("/opportunities/sprint-with-us/:opportunityId/edit?tab=evaluationPanel"),
      [
        "add_panel_member",
        "remove_panel_member",
        "choose_panel_chair",
        "mark_member_as_chair",
        "save_evaluation_panel",
        "panel_member_row",
        "chair_field",
        "minimum_members_error",
        "duplicate_member_error",
        "non_public_sector_member_error",
        "missing_chair_error",
        "panel_locked_after_consensus",
      ],
    ),

    evaluationPanelTwu: absent<S.EvaluationPanelTwuPage>(
      "evaluation-panel-twu",
      "/opportunities/team-with-us/:opportunityId/edit?tab=evaluationPanel",
      notAPage("/opportunities/team-with-us/:opportunityId/edit?tab=evaluationPanel"),
      [
        "add_panel_member",
        "remove_panel_member",
        "choose_panel_chair",
        "mark_member_as_chair",
        "save_evaluation_panel",
        "panel_member_row",
        "chair_field",
        "minimum_members_error",
        "duplicate_member_error",
        "non_public_sector_member_error",
        "missing_chair_error",
        "panel_locked_after_consensus",
      ],
    ),

    evaluationInstructionsSwu: absent<S.EvaluationInstructionsSwuPage>(
      "evaluation-instructions-swu",
      "/opportunities/sprint-with-us/:opportunityId/edit?tab=instructions",
      notAPage("/opportunities/sprint-with-us/:opportunityId/edit?tab=instructions"),
      ["instructions_body", "visible_to_evaluators_only"],
    ),

    evaluationInstructionsTwu: absent<S.EvaluationInstructionsTwuPage>(
      "evaluation-instructions-twu",
      "/opportunities/team-with-us/:opportunityId/edit?tab=instructions",
      notAPage("/opportunities/team-with-us/:opportunityId/edit?tab=instructions"),
      ["instructions_body", "visible_to_evaluators_only"],
    ),

    evaluationIndividualListSwu: absent<S.EvaluationIndividualListSwuPage>(
      "evaluation-individual-list-swu",
      "/opportunities/sprint-with-us/:opportunityId/edit?tab=evaluation",
      notAPage("/opportunities/sprint-with-us/:opportunityId/edit?tab=evaluation"),
      [
        "open_proponent_evaluation",
        "submit_scores_for_consensus",
        "proponent_row",
        "anonymous_proponent_name",
        "evaluation_status",
        "submit_disabled_until_complete",
        "incomplete_evaluation_error",
        "own_evaluations_only",
      ],
    ),

    evaluationIndividualListTwu: absent<S.EvaluationIndividualListTwuPage>(
      "evaluation-individual-list-twu",
      "/opportunities/team-with-us/:opportunityId/edit?tab=evaluation",
      notAPage("/opportunities/team-with-us/:opportunityId/edit?tab=evaluation"),
      [
        "open_proponent_evaluation",
        "submit_scores_for_consensus",
        "proponent_row",
        "anonymous_proponent_name",
        "evaluation_status",
        "submit_disabled_until_complete",
        "incomplete_evaluation_error",
        "own_evaluations_only",
      ],
    ),

    evaluationConsensusListSwu: absent<S.EvaluationConsensusListSwuPage>(
      "evaluation-consensus-list-swu",
      "/opportunities/sprint-with-us/:opportunityId/edit?tab=consensus",
      notAPage("/opportunities/sprint-with-us/:opportunityId/edit?tab=consensus"),
      [
        "open_proponent_consensus",
        "submit_final_consensus_scores",
        "confirm_submit_consensus",
        "finalize_consensus_scores",
        "confirm_finalize_consensus",
        "cancel_modal",
        "proponent_row",
        "consensus_status",
        "submit_confirmation_modal",
        "finalize_confirmation_modal",
        "not_all_consensuses_submitted_error",
        "no_screenable_proponent_error",
        "empty_for_owner_not_on_panel",
      ],
    ),

    evaluationConsensusListTwu: absent<S.EvaluationConsensusListTwuPage>(
      "evaluation-consensus-list-twu",
      "/opportunities/team-with-us/:opportunityId/edit?tab=consensus",
      notAPage("/opportunities/team-with-us/:opportunityId/edit?tab=consensus"),
      [
        "open_proponent_consensus",
        "submit_final_consensus_scores",
        "confirm_submit_consensus",
        "finalize_consensus_scores",
        "confirm_finalize_consensus",
        "cancel_modal",
        "proponent_row",
        "consensus_status",
        "submit_confirmation_modal",
        "finalize_confirmation_modal",
        "not_all_consensuses_submitted_error",
        "no_screenable_proponent_error",
        "empty_for_owner_not_on_panel",
      ],
    ),

    evaluationIndividualCreateSwu: absent<S.EvaluationIndividualCreateSwuPage>(
      "evaluation-individual-create-swu",
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/evaluations/create",
      notAPage(
        "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/evaluations/create",
      ),
      [
        "enter_question_score",
        "enter_question_notes",
        "save_draft",
        "save_and_go_to_next_proponent",
        "save_and_go_to_previous_proponent",
        "anonymous_proponent_name",
        "question_response",
        "score_out_of_range_error",
        "empty_notes_error",
        "duplicate_evaluation_error",
      ],
    ),

    evaluationIndividualEditSwu: absent<S.EvaluationIndividualEditSwuPage>(
      "evaluation-individual-edit-swu",
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/evaluations/:userId/edit",
      notAPage(
        "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/evaluations/:userId/edit",
      ),
      [
        "enter_question_score",
        "enter_question_notes",
        "save_changes",
        "save_and_go_to_next_proponent",
        "evaluation_status",
        "read_only_after_submitted",
        "score_out_of_range_error",
        "empty_notes_error",
      ],
    ),

    evaluationConsensusCreateSwu: absent<S.EvaluationConsensusCreateSwuPage>(
      "evaluation-consensus-create-swu",
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/consensus/create",
      notAPage(
        "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/consensus/create",
      ),
      [
        "enter_question_score",
        "enter_question_notes",
        "save_draft",
        "save_and_go_to_next_proponent",
        "anonymous_proponent_name",
        "panel_member_score",
        "panel_member_notes",
        "chair_only",
        "duplicate_consensus_error",
      ],
    ),

    evaluationConsensusEditSwu: absent<S.EvaluationConsensusEditSwuPage>(
      "evaluation-consensus-edit-swu",
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/consensus/:userId/edit",
      notAPage(
        "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/consensus/:userId/edit",
      ),
      [
        "enter_question_score",
        "enter_question_notes",
        "save_changes",
        "save_and_go_to_next_proponent",
        "consensus_status",
        "editable_after_submitted",
        "panel_member_score",
        "panel_member_notes",
      ],
    ),

    evaluationIndividualCreateTwu: absent<S.EvaluationIndividualCreateTwuPage>(
      "evaluation-individual-create-twu",
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/evaluations/create",
      notAPage(
        "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/evaluations/create",
      ),
      [
        "enter_question_score",
        "enter_question_notes",
        "save_draft",
        "save_and_go_to_next_proponent",
        "save_and_go_to_previous_proponent",
        "anonymous_proponent_name",
        "question_response",
        "score_out_of_range_error",
        "empty_notes_error",
        "duplicate_evaluation_error",
      ],
    ),

    evaluationIndividualEditTwu: absent<S.EvaluationIndividualEditTwuPage>(
      "evaluation-individual-edit-twu",
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/evaluations/:userId/edit",
      notAPage(
        "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/evaluations/:userId/edit",
      ),
      [
        "enter_question_score",
        "enter_question_notes",
        "save_changes",
        "save_and_go_to_next_proponent",
        "evaluation_status",
        "read_only_after_submitted",
        "score_out_of_range_error",
        "empty_notes_error",
      ],
    ),

    evaluationConsensusCreateTwu: absent<S.EvaluationConsensusCreateTwuPage>(
      "evaluation-consensus-create-twu",
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/consensus/create",
      notAPage(
        "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/consensus/create",
      ),
      [
        "enter_question_score",
        "enter_question_notes",
        "save_draft",
        "save_and_go_to_next_proponent",
        "anonymous_proponent_name",
        "panel_member_score",
        "panel_member_notes",
        "chair_only",
        "duplicate_consensus_error",
      ],
    ),

    evaluationConsensusEditTwu: absent<S.EvaluationConsensusEditTwuPage>(
      "evaluation-consensus-edit-twu",
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/consensus/:userId/edit",
      notAPage(
        "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/consensus/:userId/edit",
      ),
      [
        "enter_question_score",
        "enter_question_notes",
        "save_changes",
        "save_and_go_to_next_proponent",
        "consensus_status",
        "editable_after_submitted",
        "panel_member_score",
        "panel_member_notes",
      ],
    ),

    notificationUnsubscribeLanding: absent<S.NotificationUnsubscribeLandingPage>(
      "notification-unsubscribe-landing",
      "/users/me?tab=notifications&unsubscribe",
      notAPage("/users/me?tab=notifications&unsubscribe"),
      [
        "confirm_unsubscribe",
        "cancel_unsubscribe",
        "unsubscribe_confirmation",
        "confirmation_names_signed_in_address",
        "resolves_to_signed_in_person",
        "sign_in_required",
      ],
    ),

    notificationOptinOpportunityList: absent<S.NotificationOptinOpportunityListPage>(
      "notification-optin-opportunity-list",
      "/opportunities",
      notAPage("/opportunities"),
      [
        "toggle_new_opportunity_notifications",
        "notification_control",
        "notification_control_state",
        "notification_control_hidden_on_narrow_screen",
      ],
    ),

    notificationTermsBroadcast: absent<S.NotificationTermsBroadcastPage>(
      "notification-terms-broadcast",
      "/content/terms-and-conditions/edit",
      notAPage("/content/terms-and-conditions/edit"),
      [
        "notify_vendors_of_updated_terms",
        "confirm_notify_vendors",
        "cancel_notify_vendors",
        "notify_vendors_control",
        "notify_vendors_confirmation",
        "notify_vendors_success",
        "notify_vendors_failure",
      ],
    ),

    notificationEmailReference: absent<S.NotificationEmailReferencePage>(
      "notification-email-reference",
      "/admin/email-notification-reference",
      '/admin/email-notification-reference is not on this target — the service answers it with a 404 of its own, and the client has no route for it either',
      [
        "open_reference",
        "message_group_title",
        "message_subject",
        "message_summary",
        "message_body",
        "refused_for_non_administrator",
      ],
    ),

    contentFooter,
    contentServiceLevelAgreementLink,

    contentList: absent<S.ContentListPage>(
      "content-list",
      "/content",
      notAPage("/content"),
      [
        "open_page_for_editing",
        "open_public_page",
        "create_page",
        "page_title",
        "page_public_address",
        "page_is_fixed",
        "page_created_date",
        "page_updated_date",
        "ordered_by_title",
        "refused_for_non_administrator",
      ],
    ),

    contentCreate: absent<S.ContentCreatePage>(
      "content-create",
      "/content/create",
      notAPage("/content/create"),
      [
        "enter_title",
        "enter_slug",
        "enter_body",
        "upload_body_image",
        "publish_page",
        "confirm_publish",
        "cancel",
        "field_error",
        "slug_rule_help",
        "resulting_public_address",
        "publish_disabled_until_valid",
        "publish_confirmation",
        "published_success",
        "duplicate_slug_error",
        "refused_for_non_administrator",
      ],
    ),

    contentEdit: absent<S.ContentEditPage>(
      "content-edit",
      "/content/:slug/edit",
      notAPage("/content/:slug/edit"),
      [
        "start_editing",
        "edit_title",
        "edit_slug",
        "edit_body",
        "upload_body_image",
        "publish_changes",
        "confirm_publish_changes",
        "cancel_editing",
        "delete_page",
        "confirm_delete_page",
        "page_address",
        "published_date",
        "updated_date",
        "published_by",
        "updated_by",
        "fixed_page_warning",
        "slug_locked_for_fixed_page",
        "delete_withheld_for_fixed_page",
        "field_error",
        "duplicate_slug_error",
        "changes_published_success",
        "deleted_success",
        "refused_for_non_administrator",
        "body_being_edited",
        "version_history",
      ],
    ),

    contentView,

    fileUpload: absent<S.FileUploadPage>("file-upload", "/api/files", NO_FILE_ROUTE, [
      "upload_file",
      "upload_file_stating_its_read_access",
      "upload_file_without_declaring_its_size",
      "upload_file_with_no_file_part",
      "upload_file_with_unrecognised_read_access",
      "upload_file_with_malformed_read_access",
      "stored_file_identifier",
      "refused_for_size",
      "size_limit_named_in_refusal",
      "refused_for_file_name_length",
      "refused_for_read_access",
      "refused_when_signed_out",
      "service_fault",
    ]),

    fileDescription: absent<S.FileDescriptionPage>(
      "file-description",
      "/api/files/:fileId",
      NO_FILE_ROUTE,
      [
        "file_identifier",
        "file_name",
        "stored_date",
        "stored_content_identifier",
        "refused_when_not_permitted",
        "refused_for_unknown_file",
        "not_found_for_administrator",
      ],
    ),

    fileDownload: absent<S.FileDownloadPage>(
      "file-download",
      "/api/files/:fileId?type=blob",
      NO_FILE_ROUTE,
      [
        "download_file",
        "file_contents",
        "file_name_on_save",
        "offered_as_download_not_displayed",
        "content_type_from_name",
        "readable_when_signed_out_if_public",
        "refused_when_not_permitted",
        "refused_for_unknown_file",
        "not_found_for_administrator",
      ],
    ),

    fileAttachmentControl: absent<S.FileAttachmentControlPage>(
      "file-attachment-control",
      "/opportunities/:program/:opportunityId/edit?tab=opportunity",
      notAPage("/opportunities/:program/:opportunityId/edit?tab=opportunity"),
      [
        "add_attachment",
        "rename_new_attachment",
        "remove_new_attachment",
        "remove_existing_attachment",
        "download_attachment",
        "attachment_address",
        "size_limit_stated_before_choosing",
        "upload_refused_for_size",
        "new_attachment_row",
        "existing_attachment_row",
        "existing_attachment_name_read_only",
        "original_extension_restored",
        "file_name_error",
        "remove_control_hidden_when_not_removable",
        "attachment_list_on_public_view",
      ],
    ),

    fileImagePicker: absent<S.FileImagePickerPage>(
      "file-image-picker",
      "/users/me",
      notAPage("/users/me"),
      [
        "choose_image",
        "image_address",
        "current_image",
        "chosen_image_preview",
        "only_jpeg_and_png_offered",
        "rejected_image_error",
        "image_readable_when_signed_out",
        "stored_image_width",
        "stored_image_height",
      ],
    ),

    fileEmbeddedImage: absent<S.FileEmbeddedImagePage>(
      "file-embedded-image",
      "/content/:slug/edit",
      notAPage("/content/:slug/edit"),
      [
        "upload_body_image",
        "image_address",
        "image_inserted_into_text",
        "only_jpeg_and_png_offered",
        "uploading_indicator",
        "image_rendered_in_published_text",
        "upload_failure_leaves_text_unchanged",
      ],
    ),
  };

  return surface;
}
