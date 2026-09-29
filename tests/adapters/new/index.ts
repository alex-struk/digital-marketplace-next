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
//
// What the target has become since
// --------------------------------
// When this adapter was brought up to the current contract the same address was serving
// the whole marketplace: the opportunity pages render for anybody, the service answers
// its interface under /api, and every screen that needs a session answers a signed-out
// visitor with the client's "Not Found" screen (or, for the organization screens, a
// redirect to /sign-in). What has not changed is that nobody can sign in: "Sign In Using
// GitHub" and "Sign In Using IDIR" on /sign-in both hand off to an external single sign-on
// service that answers "Login Error: Invalid parameter: redirect_uri" and shows no form.
// The members added for the current contract are bound against the target as it now
// stands (see the section "added for the current contract" below); the members bound
// earlier were left as they were, and their "not a page on this target" reasons describe
// the target as it was then.

import type { Dialog, Locator, Page } from "@playwright/test";
import type { Persona, persona as PersonaTable } from "../../generated/personas";
import { seed } from "../../generated/seed";
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
  // Nothing here has ever succeeded against this target. /sign-in now offers "Sign In Using
  // GitHub" (vendors) and "Sign In Using IDIR" (public sector staff and administrators), and
  // both lead to an external single sign-on service that refuses the request ("Login Error:
  // Invalid parameter: redirect_uri") without showing a form. The attempt is still made
  // rather than assumed, so that the reason reported is what the target did when asked, and
  // so that the day the hand-off reaches a form this keeps working.
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

    // Start from nobody signed in, then take the way in the sign-in screen offers this kind
    // of account: GitHub for a vendor, IDIR for public sector staff and administrators.
    await signOut();
    await page.goto(baseURL + "/sign-in", { waitUntil: "domcontentloaded" });
    await ready();
    const way = /^test-vendor/i.test(entry.username) ? "Sign In Using GitHub" : "Sign In Using IDIR";
    const offer = seen(page.getByRole("link", { name: new RegExp(`^\\s*${way}\\s*$`, "i") })).first();
    if (!(await offer.count())) {
      throw new Error(`unbound: ${where} — the sign-in screen at ${page.url()} offers no "${way}" link`);
    }
    await offer.click();
    await page.waitForLoadState("domcontentloaded").catch(() => undefined);
    await settle();

    const form = await identityProviderForm();
    if (!form) {
      // Only the provider's origin is named: its address carries the request's parameters.
      const said = (await bodyText().catch(() => "")).replace(/\s+/g, " ").slice(0, 300);
      throw new Error(
        `unbound: ${where} — "${way}" on /sign-in hands off to ${new URL(page.url()).origin}, which shows no username and password form; it says: ${said}`,
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
    // Dialogs are listened for from before the address is asked for, so that markup in the
    // body which runs as the page renders is caught (body_script_ran).
    open: async (params) => {
      listenForDialogs();
      await go("/content/:slug", params as unknown as Record<string, string>);
    },
    bodyElementNames: () => bodyElementNames("content-view.body_element_names"),
    bodyScriptRan: () => bodyScriptRan("content-view.body_script_ran"),
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

  // ================================================================ added for the current contract
  //
  // Everything below was found on the target as it stands now (see the header): the
  // opportunity pages render for anybody, the service answers its interface under /api,
  // and nobody can sign in.

  function unbound(where: string, why: string): never {
    throw new Error(`unbound: ${where} — ${why}`);
  }

  // Members of a page that remains unreachable, each refusing with the same reason.
  function unboundMembers(pageId: string, why: string, names: readonly string[]): Record<string, unknown> {
    const built: Record<string, unknown> = {};
    for (const name of names) {
      built[camel(name)] = async (): Promise<never> => unbound(`${pageId}.${name}`, why);
    }
    return built;
  }

  const NOBODY_SIGNS_IN =
    'nobody can sign in on this target: "Sign In Using GitHub" and "Sign In Using IDIR" on /sign-in both hand off to an external single sign-on service that answers "Login Error: Invalid parameter: redirect_uri" and shows no form';

  const behindSignIn = (screen: string, signedOut: string): string =>
    `${screen} is offered only to a signed-in person, and ${NOBODY_SIGNS_IN}; opened signed out with the seeded record's identifier it ${signedOut}`;

  // What this target shows somebody who may not have the screen they asked for: its "Not
  // Found" screen, or the sign-in screen it redirects to. Empty when the screen is shown.
  async function refusalShown(): Promise<string> {
    await ready();
    const at = new URL(page.url());
    if (at.pathname === "/sign-in") return `sent to the sign-in screen (${at.pathname}${at.search})`;
    if (!(await seen(page.getByRole("heading", { name: /^\s*not found\s*$/i })).count())) return "";
    const lines = await textLines();
    const from = Math.max(0, lines.findIndex((line) => /^not found$/i.test(line)));
    const to = lines.findIndex((line, i) => i > from && /^go home$/i.test(line));
    return lines.slice(from, to > from ? to : from + 2).join("\n");
  }

  // ---------------------------------------------------------------- the opportunity pages

  // The three public opportunity pages draw their key figures as a value over its label
  // ("Sep 9, 2026" over "Assignment Date"), the award as an alert above the title, and
  // their longer sections behind a row of tabs (Details, Scope & Contract / Competition
  // Rules, Attachments, Addenda).
  async function opportunityLines(where: string): Promise<string[]> {
    const refused = await refusalShown();
    if (refused) unbound(where, `the opportunity did not open at ${page.url()}: ${refused}`);
    return textLines();
  }

  async function figureAbove(where: string, label: RegExp): Promise<string> {
    const lines = await opportunityLines(where);
    for (let i = 1; i < lines.length; i++) if (label.test(lines[i])) return lines[i - 1];
    return "";
  }

  // The Team With Us page's "Key Dates" section: "<label> (Anticipated) <date>".
  async function keyDate(where: string, label: RegExp): Promise<string> {
    for (const line of await opportunityLines(where)) {
      const found = label.exec(line);
      if (found) return line.slice(found.index + found[0].length).trim();
    }
    return "";
  }

  // What the award notice says beyond the winner's name. A signed-out visitor is shown only
  // "This opportunity was awarded to <name>."; whatever else a reader permitted to see
  // scores is shown there is picked out by what it looks like.
  async function awardDetail(where: string, kind: RegExp): Promise<string> {
    await opportunityLines(where);
    const alerts = seen(page.getByRole("alert"));
    const lines: string[] = [];
    for (let i = 0; i < (await alerts.count()); i++) {
      lines.push(...(await alerts.nth(i).innerText()).split("\n").map((line) => line.trim()).filter(Boolean));
    }
    if (!lines.some((line) => /awarded to/i.test(line))) return "";
    return lines.filter((line) => !/awarded to/i.test(line) && kind.test(line)).join("\n");
  }

  const CONTACT_DETAIL = /@|\+?\d[\d\s().-]{8,}\d|\b(contact|e-?mail|phone)\b/i;
  const SCORE_DETAIL = /\bscore\b|\d+(\.\d+)?\s*%|\bpoints?\b/i;

  // A section behind one of the page's tabs, read from its heading to the "Got Questions?"
  // box that closes every section.
  async function sectionBehind(where: string, tab: string): Promise<string> {
    await opportunityLines(where);
    const control = seen(page.getByText(tab, { exact: true })).first();
    if (!(await control.count())) unbound(where, `the opportunity page at ${page.url()} offers no "${tab}" tab`);
    await control.click();
    await seen(page.getByText(tab, { exact: true }))
      .nth(1)
      .waitFor({ state: "visible", timeout: 10000 })
      .catch(() => undefined);
    await settle();
    const lines = await textLines();
    const from = lines.lastIndexOf(tab);
    if (from < 0) unbound(where, `choosing "${tab}" on ${page.url()} showed no section of that name`);
    const to = lines.findIndex((line, i) => i > from && /^got questions\?$/i.test(line));
    return lines.slice(from + 1, to > from ? to : undefined).join("\n");
  }

  function opportunityView<T>(
    pageId: string,
    route: string,
    earlier: readonly string[],
    added: Record<string, () => Promise<string>>,
  ): T {
    return {
      ...absent<Record<string, unknown>>(pageId, route, notAPage(route), earlier),
      open: (params?: Record<string, string>) => go(route, params),
      ...added,
    } as unknown as T;
  }

  const CWU_VIEW = "opportunity-cwu-view";
  const SWU_VIEW = "opportunity-swu-view";
  const TWU_VIEW = "opportunity-twu-view";

  // ---------------------------------------------------------------- a published page's body

  let dialogsSeen: string[] = [];
  let dialogListener: ((dialog: Dialog) => void) | null = null;

  function listenForDialogs(): void {
    if (dialogListener) page.off("dialog", dialogListener);
    dialogsSeen = [];
    dialogListener = (dialog: Dialog) => {
      dialogsSeen.push(dialog.message());
      dialog.dismiss().catch(() => undefined);
    };
    page.on("dialog", dialogListener);
  }

  // The body is what follows the page's title and its dated line: heading, dates, body.
  async function bodyElementNames(where: string): Promise<string> {
    const refused = await refusalShown();
    if (refused) unbound(where, `no page is published at ${page.url()}: ${refused}`);
    const title = seen(page.getByRole("heading", { level: 1 })).first();
    if (!(await title.count())) unbound(where, `the page at ${page.url()} carries no title to find its body by`);
    return title.evaluate((heading) => {
      const dated = heading.nextElementSibling;
      const body = dated ? dated.nextElementSibling : null;
      const names: string[] = [];
      const walk = (element: Element): void => {
        for (const child of Array.from(element.children)) {
          names.push(child.tagName.toLowerCase());
          walk(child);
        }
      };
      if (body) walk(body);
      return names.join("\n");
    });
  }

  async function bodyScriptRan(where: string): Promise<string> {
    if (!dialogListener) unbound(where, "the page was not opened through content-view.open, so nothing was listening");
    const refused = await refusalShown();
    if (refused) unbound(where, `no page is published at ${page.url()}: ${refused}`);
    // "On opening or within a few seconds after".
    await page.waitForTimeout(3000);
    return dialogsSeen.length ? "yes" : "";
  }

  // ---------------------------------------------------------------- the evaluation screens

  // Opened for real, so that what a person who may not have it is shown can be read: this
  // target answers every one of them, signed out, with its "Not Found" screen.
  function evaluationScreen<T>(pageId: string, route: string, earlier: readonly string[]): T {
    return {
      ...absent<Record<string, unknown>>(pageId, route, notAPage(route), earlier),
      open: (params?: Record<string, string>) => go(route, params),
      refusedWhenNotPermitted: () => refusalShown(),
    } as unknown as T;
  }

  // ---------------------------------------------------------------- the mail catcher

  // Mailpit, at the address the harness names; each Playwright worker has its own, named
  // SDLC_MAIL_API_<worker>, with the unnumbered name as the fallback, exactly as the
  // harness's own mail fixture resolves it. Every message this target sends comes from
  // "Digital Marketplace <donotreply@example.test>" with the service's logo linked home at
  // the top of the formatted body.
  function mailApi(where: string): string {
    const copy = process.env.TEST_PARALLEL_INDEX ?? "0";
    const api = (process.env[`SDLC_MAIL_API_${copy}`] ?? process.env.SDLC_MAIL_API ?? "").replace(/\/+$/, "");
    return api || unbound(where, "SDLC_MAIL_API is not set, so there is no mail catcher to read");
  }

  type MailAddress = { Name?: string; Address?: string };
  type CaughtMessage = {
    ID: string;
    From?: MailAddress | null;
    To?: MailAddress[] | null;
    Cc?: MailAddress[] | null;
    Bcc?: MailAddress[] | null;
    ReplyTo?: MailAddress[] | null;
    Subject?: string;
    HTML?: string;
    Text?: string;
  };

  const mailbox = (one: MailAddress | null | undefined): string =>
    !one?.Address ? "" : one.Name ? `${one.Name} <${one.Address}>` : one.Address;
  const mailboxes = (list: MailAddress[] | null | undefined): string =>
    (list ?? []).map(mailbox).filter(Boolean).join("\n");

  async function mailRequest(where: string, method: string, path: string, data?: unknown): Promise<{ status: number; json: unknown }> {
    const target = mailApi(where) + path;
    const response = await page.request
      .fetch(target, { method, ...(data === undefined ? {} : { data }) })
      .catch((error: unknown) => unbound(where, `the mail catcher at ${target} could not be reached (${String(error)})`));
    const text = await response.text().catch(() => "");
    return { status: response.status(), json: parse(text) };
  }

  const entity = (words: string): string =>
    words
      .replace(/&nbsp;/g, " ")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;|&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");

  // Every link of the formatted body as its label and where it leads; a link drawn as a
  // picture is labelled by the picture's own words.
  function linksOf(html: string): { label: string; href: string }[] {
    const found: { label: string; href: string }[] = [];
    const anchor = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
    for (let match = anchor.exec(html); match !== null; match = anchor.exec(html)) {
      const href = /\bhref\s*=\s*"([^"]*)"/i.exec(match[1])?.[1] ?? /\bhref\s*=\s*'([^']*)'/i.exec(match[1])?.[1];
      if (!href) continue;
      let label = entity(match[2].replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
      if (!label) label = entity(/\balt\s*=\s*"([^"]*)"/i.exec(match[2])?.[1] ?? "").trim();
      found.push({ label, href: entity(href) });
    }
    return found;
  }

  let openedMessage: CaughtMessage | null = null;
  const message = (where: string): CaughtMessage =>
    openedMessage ?? unbound(where, "no message has been opened (caught-message.open)");

  const caughtMessage: S.CaughtMessagePage = {
    async open(params) {
      const where = "caught-message.open";
      const id = params?.messageId;
      if (!id) unbound(where, "no message identifier was given");
      const got = await mailRequest(where, "GET", `/api/v1/message/${encodeURIComponent(id)}`);
      if (got.status !== 200) unbound(where, `the mail catcher answered ${got.status} for message ${id}`);
      openedMessage = got.json as CaughtMessage;
    },
    // The link carrying the label given — its exact words first, then any link containing
    // them. An invitation's message labels its answers "Approve" and "Reject", which are
    // what a criterion's "accept" and "decline" mean.
    async followLinkInBody(input) {
      const where = "caught-message.follow_link_in_body";
      const wanted = (field(input, "label", "link", "name", "text") || textOf(input)).trim().toLowerCase();
      if (!wanted) unbound(where, "no link label was given");
      const links = linksOf(message(where).HTML ?? "");
      const find = (words: string) =>
        links.find((each) => each.label.toLowerCase() === words) ??
        links.find((each) => each.label.toLowerCase().includes(words));
      const SAME: Record<string, string> = { accept: "approve", approve: "accept", decline: "reject", reject: "decline" };
      const other = Object.entries(SAME).find(([word]) => new RegExp(`\\b${word}`).test(wanted))?.[1];
      const link = find(wanted) ?? (other ? find(other) : undefined);
      if (!link) {
        unbound(
          where,
          `the message's formatted body has no link labelled "${wanted}" (its links: ${
            links.map((each) => `"${each.label}"`).join(", ") || "none"
          })`,
        );
      }
      await page.goto(link.href, { waitUntil: "domcontentloaded" });
      await settle();
    },
    visibleRecipients: async () => mailboxes(message("caught-message.visible_recipients").To),
    copiedRecipients: async () => {
      const opened = message("caught-message.copied_recipients");
      return [mailboxes(opened.Cc), mailboxes(opened.Bcc)].filter(Boolean).join("\n");
    },
    sender: async () => mailbox(message("caught-message.sender").From),
    replyTo: async () => mailboxes(message("caught-message.reply_to").ReplyTo),
    subject: async () => message("caught-message.subject").Subject ?? "",
    htmlBody: async () => message("caught-message.html_body").HTML ?? "",
    plainTextBody: async () => message("caught-message.plain_text_body").Text ?? "",
    logoAddress: async () =>
      entity(/<img\b[^>]*\bsrc\s*=\s*"([^"]*)"/i.exec(message("caught-message.logo_address").HTML ?? "")?.[1] ?? ""),
    linksInBody: async () =>
      linksOf(message("caught-message.links_in_body").HTML ?? "")
        .map((each) => `${each.label} -> ${each.href}`)
        .join("\n"),
  };

  let caughtList: CaughtMessage[] | null = null;
  let caughtTotal = 0;
  const caught = (where: string): CaughtMessage[] =>
    caughtList ?? unbound(where, "the list of caught messages has not been opened (caught-message-list.open)");

  const caughtMessageList: S.CaughtMessageListPage = {
    // Newest first, a page at a time until the catcher's own total is reached.
    async open() {
      const where = "caught-message-list.open";
      const all: CaughtMessage[] = [];
      let total = 0;
      for (let start = 0; start < 100000; ) {
        const got = await mailRequest(where, "GET", `/api/v1/messages?start=${start}&limit=500`);
        if (got.status !== 200) unbound(where, `the mail catcher answered ${got.status} for its message list`);
        const listed = (got.json ?? {}) as { messages?: CaughtMessage[]; messages_count?: number; total?: number };
        const batch = listed.messages ?? [];
        total = listed.messages_count ?? listed.total ?? all.length + batch.length;
        all.push(...batch);
        start += batch.length;
        if (!batch.length || all.length >= total) break;
      }
      caughtList = all;
      caughtTotal = Math.max(total, all.length);
    },
    messageIdentifiers: async () => caught("caught-message-list.message_identifiers").map((each) => each.ID).join("\n"),
    messageSubjects: async () =>
      caught("caught-message-list.message_subjects").map((each) => each.Subject ?? "").join("\n"),
    // One line per message, its visible recipients separated by commas.
    messageVisibleRecipients: async () =>
      caught("caught-message-list.message_visible_recipients")
        .map((each) => (each.To ?? []).map(mailbox).filter(Boolean).join(", "))
        .join("\n"),
    messageCount: async () => {
      caught("caught-message-list.message_count");
      return String(caughtTotal);
    },
  };

  // The catcher's own fault injection: while the sender fault is certain its SMTP server
  // refuses every message at the first command. Read on this machine's catcher, GET
  // /api/v1/chaos answers {"Sender":{"ErrorCode":451,"Probability":0}, ...}.
  async function chaos(where: string, probability?: number): Promise<Record<string, unknown>> {
    const got =
      probability === undefined
        ? await mailRequest(where, "GET", "/api/v1/chaos")
        : await mailRequest(where, "PUT", "/api/v1/chaos", { Sender: { ErrorCode: 451, Probability: probability } });
    if (got.status !== 200) {
      unbound(where, `the mail catcher answered ${got.status} for /api/v1/chaos; its fault injection is not switched on`);
    }
    return (got.json ?? {}) as Record<string, unknown>;
  }

  const mailDeliveryFault: S.MailDeliveryFaultPage = {
    open: async () => {
      await chaos("mail-delivery-fault.open");
    },
    refuseDelivery: async () => {
      await chaos("mail-delivery-fault.refuse_delivery", 100);
    },
    restoreDelivery: async () => {
      await chaos("mail-delivery-fault.restore_delivery", 0);
    },
    // "refused <code>" while the fault is in force; nothing while delivery is accepted.
    deliveryRefused: async () => {
      const sender = ((await chaos("mail-delivery-fault.delivery_refused")).Sender ?? {}) as Record<string, unknown>;
      return Number(sender.Probability ?? 0) >= 100 ? `refused ${String(sender.ErrorCode ?? "")}`.trim() : "";
    },
  };

  // The pass-through proxy in front of the catcher's SMTP port, controlled beside the
  // catcher under /hold. Read on this machine's catcher: GET .../toxics answers [] while
  // replies pass at full speed. A delay of three seconds on every reply is added as the
  // toxic "hold" and removed by name; adding one already there, or removing one already
  // gone, leaves the proxy as asked, so those answers count as done too.
  const TOXICS = "/hold/proxies/smtp/toxics";

  async function hold(where: string, method: "GET" | "POST" | "DELETE"): Promise<unknown> {
    const got =
      method === "GET"
        ? await mailRequest(where, "GET", TOXICS)
        : method === "DELETE"
          ? await mailRequest(where, "DELETE", `${TOXICS}/hold`)
          : await mailRequest(where, "POST", TOXICS, {
              name: "hold",
              type: "latency",
              stream: "downstream",
              toxicity: 1,
              attributes: { latency: 3000, jitter: 0 },
            });
    const settled = method === "GET" ? [200] : method === "POST" ? [200, 201, 409] : [200, 204, 404];
    if (!settled.includes(got.status)) unbound(where, `the mail delay proxy answered ${got.status} for ${method} ${TOXICS}`);
    return got.json;
  }

  const mailDeliveryDelay: S.MailDeliveryDelayPage = {
    open: async () => {
      await hold("mail-delivery-delay.open", "GET");
    },
    slowDelivery: async () => {
      await hold("mail-delivery-delay.slow_delivery", "POST");
    },
    restoreDeliverySpeed: async () => {
      await hold("mail-delivery-delay.restore_delivery_speed", "DELETE");
    },
    // "slowed <latency>ms" while the delay is in force; nothing while replies pass at speed.
    deliverySlowed: async () => {
      const listed = await hold("mail-delivery-delay.delivery_slowed", "GET");
      const toxic = (Array.isArray(listed) ? (listed as Record<string, unknown>[]) : []).find((each) => each.name === "hold");
      if (!toxic) return "";
      return `slowed ${String(((toxic.attributes ?? {}) as Record<string, unknown>).latency ?? "")}ms`;
    },
  };

  // ---------------------------------------------------------------- requests no screen makes

  // Each is a request to the service's own interface from the browser's session, so it
  // carries whoever is signed in — on this target, nobody. What the service answered a
  // signed-out request with was read for every address below; what it answers somebody
  // signed in could not be, since nobody can sign in here, so those request bodies follow
  // spec/contract/openapi.yaml and the forms the contract describes.

  type Answer = { status: number; body: string };

  function parse(text: string): unknown {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  const squash = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, "");

  function record(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  }

  // A value an input carries under any of several spellings ("proposalText",
  // "proposal_text"), at its top level or inside a group it names.
  function given(input: unknown, names: string[], within: string[] = []): unknown {
    const wanted = names.map(squash);
    for (const [key, value] of Object.entries(record(input))) {
      if (wanted.includes(squash(key)) && value !== undefined) return value;
    }
    for (const group of within) {
      for (const [key, value] of Object.entries(record(input))) {
        if (squash(key) !== squash(group)) continue;
        const inner = given(value, names);
        if (inner !== undefined) return inner;
      }
    }
    return undefined;
  }

  function textOf(value: unknown): string {
    if (value === undefined || value === null) return "";
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
    if (Array.isArray(value)) return value.map(textOf).join(", ");
    return "";
  }

  function field(input: unknown, ...names: string[]): string {
    return textOf(given(input, names));
  }

  // Text exactly as given; a value left out is sent blank, never made up.
  function givenText(input: unknown, names: string[], within: string[] = []): string {
    const value = given(input, names, within);
    if (value && typeof value === "object" && !Array.isArray(value)) return givenText(value, names);
    return textOf(value);
  }

  type SeedRecord = { id?: unknown; email?: unknown; persona?: unknown };
  const seedGroups = seed as unknown as Record<string, Record<string, SeedRecord> | undefined>;

  // A seeded record named by its handle ("qualified" or "organizations.qualified"), by its
  // identifier, or handed over whole, as its identifier; anything else is sent as given.
  function seededId(value: unknown, ...groups: string[]): string {
    if (value === undefined || value === null) return "";
    if (typeof value === "object") {
      const id = record(value).id;
      return typeof id === "string" ? id : "";
    }
    const named = String(value).trim();
    for (const group of groups) {
      const handle = named.startsWith(`${group}.`) ? named.slice(group.length + 1) : named;
      const found = seedGroups[group]?.[handle];
      if (found && found.id !== undefined) return String(found.id);
    }
    return named;
  }

  // A person named by seed handle, persona, identifier or address, or handed over whole.
  function personOf(value: unknown): { id: string; email: string } | null {
    const users = seedGroups.users ?? {};
    const keys: string[] = [];
    if (typeof value === "string" || typeof value === "number") keys.push(String(value).replace(/^users\./, ""));
    else {
      const handed = record(value);
      for (const key of ["id", "email", "handle", "user", "member", "userId"]) {
        if (typeof handed[key] === "string") keys.push(String(handed[key]).replace(/^users\./, ""));
        else if (handed[key] && typeof handed[key] === "object") {
          const inner = personOf(handed[key]);
          if (inner) return inner;
        }
      }
    }
    for (const key of keys) {
      const found =
        users[key] ??
        Object.values(users).find((each) => each.id === key || each.email === key || each.persona === key);
      if (found) return { id: String(found.id ?? ""), email: String(found.email ?? "") };
    }
    for (const key of keys) {
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) return { id: key, email: "" };
      if (key.includes("@")) return { id: "", email: key };
    }
    return null;
  }

  // One page's requests and the latest answer the service gave to them.
  function requests(pageId: string) {
    let last: Answer | null = null;
    return {
      async send(member: string, method: string, target: string, data?: unknown): Promise<Answer> {
        const where = `${pageId}.${member}`;
        const response = await page.request
          .fetch(target, { method, ...(data === undefined ? {} : { data }) })
          .catch((error: unknown) => unbound(where, `${method} ${target} could not be made (${String(error)})`));
        last = { status: response.status(), body: await response.text().catch(() => "") };
        return last;
      },
      last(member: string): Answer {
        return last ?? unbound(`${pageId}.${member}`, "no request has been made on this page yet");
      },
    };
  }

  // A side read, to learn what a request must carry or what is stored, without taking the
  // place of the answer the observations read.
  async function peek(target: string): Promise<{ status: number; json: unknown }> {
    const response = await page.request.get(target).catch(() => null);
    if (!response) return { status: 0, json: null };
    return { status: response.status(), json: parse(await response.text().catch(() => "")) };
  }

  const acceptedText = (got: Answer): string => (got.status < 300 ? `${got.status} ${got.body}` : "");
  const refusalStatusOf = (got: Answer): string => (got.status >= 400 ? String(got.status) : "");
  const refusedText = (got: Answer, statuses: (status: number) => boolean, about?: RegExp): string =>
    got.status >= 400 && statuses(got.status) && (!about || about.test(got.body)) ? `${got.status} ${got.body}` : "";
  const answeredField = (got: Answer, key: string): string => {
    if (got.status >= 300) return "";
    const value = record(parse(got.body))[key];
    return value === undefined || value === null ? "" : String(value);
  };

  // The form a refusal takes: its body with every piece of prose replaced by its kind.
  function shapeOf(value: unknown): unknown {
    if (Array.isArray(value)) return value.length ? [shapeOf(value[0])] : [];
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, inner]) => [key, shapeOf(inner)]));
    }
    return value === null ? null : typeof value;
  }

  // Every message of a refusal, with where the service reports it. A refusal is a list of
  // messages, or a record of fields each holding messages or further fields; a proponent
  // comes back as { tag, value }, an organization's messages being the organization's.
  const FIELD_NAMES: Record<string, string> = {
    legalname: "legal name",
    email: "email address",
    phone: "phone",
    street1: "street address",
    street2: "second address line",
    city: "city",
    region: "province",
    mailcode: "postal code",
    country: "country",
    proposaltext: "proposal text",
    additionalcomment: "additional comments",
    inceptionphase: "inception phase",
    prototypephase: "prototype phase",
    implementationphase: "implementation phase",
    teamquestionresponses: "team question responses",
    resourcequestionresponses: "resource question responses",
    hourlyrate: "hourly rate",
    scrummaster: "scrum master",
    proposedcost: "proposed cost",
    totalproposedcost: "total proposed cost",
  };
  const fieldName = (key: string): string =>
    FIELD_NAMES[squash(key)] ?? key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();

  type Refused = { where: string; message: string };

  function refusalEntries(body: unknown, path: string[] = [], out: Refused[] = []): Refused[] {
    if (typeof body === "string") {
      out.push({ where: path.join(" "), message: body });
    } else if (Array.isArray(body)) {
      const prose = body.every((each) => typeof each === "string");
      body.forEach((each, i) => refusalEntries(each, prose ? path : [...path, `#${i + 1}`], out));
    } else if (body && typeof body === "object") {
      const fields = body as Record<string, unknown>;
      if (typeof fields.tag === "string" && "value" in fields) {
        refusalEntries(fields.value, fields.tag === "organization" ? [...path, "organization"] : path, out);
      } else {
        for (const [key, value] of Object.entries(fields)) {
          if (!value || typeof value !== "object") {
            if (typeof value === "string") out.push({ where: [...path, fieldName(key)].join(" "), message: value });
            continue;
          }
          refusalEntries(value, key === "errors" || key === "proponent" ? path : [...path, fieldName(key)], out);
        }
      }
    }
    return out;
  }

  function refusalOf(got: Answer): { where: string; message: string }[] {
    if (got.status < 400) return [];
    const body = parse(got.body);
    if (body === null) return got.body.trim() ? [{ where: "", message: got.body.trim() }] : [];
    return refusalEntries(body);
  }

  const messagesOf = (got: Answer): string => refusalOf(got).map((each) => each.message).join("\n");
  const byFieldOf = (got: Answer): string =>
    refusalOf(got)
      .map((each) => (each.where ? `${each.where}: ${each.message}` : each.message))
      .join("\n");

  // ------------------------------------------------ organizations one may act for

  // Signed out, this target answers GET /api/ownedOrganizations with an empty list (200).
  const actingFor = requests("organization-acting-for-list");
  const organizationActingForList: S.OrganizationActingForListPage = {
    open: async () => {
      await actingFor.send("open", "GET", `${baseURL}/api/ownedOrganizations`);
    },
    organizationsOffered: async () => {
      const got = actingFor.last("organizations_offered");
      const listed = got.status === 200 ? parse(got.body) : null;
      return Array.isArray(listed) ? listed.map((each) => textOf(record(each).legalName)).join("\n") : "";
    },
    refusedWhenNotPermitted: async () =>
      refusedText(actingFor.last("refused_when_not_permitted"), (status) => status === 401 || status === 403),
  };

  // ------------------------------------------------ memberships

  // POST /api/affiliations { userEmail, organization, membershipType }; signed out this
  // target answers 401 {"permissions":["You do not have permission to perform this action."]}.
  const invitation = requests("affiliation-invitation-request");
  const affiliationInvitationRequest: S.AffiliationInvitationRequestPage = {
    open: async () => undefined,
    async inviteWithMembershipType(input) {
      const member = "invite_with_membership_type";
      const where = `affiliation-invitation-request.${member}`;
      const organization = seededId(given(input, ["organization", "organizationId", "org", "orgId"]), "organizations");
      const who = given(input, ["email", "userEmail", "invitee", "address", "user", "member", "person"]);
      const email = personOf(who)?.email || textOf(who);
      const membershipType = field(input, "membershipType", "membership_type", "type", "role");
      if (!organization) unbound(where, "the input names no organization to invite to");
      if (!email) unbound(where, "the input names no person to invite");
      if (!membershipType) unbound(where, "the input names no membership type");
      await invitation.send(member, "POST", `${baseURL}/api/affiliations`, {
        userEmail: email,
        organization,
        membershipType,
      });
    },
    invitationCreated: async () => acceptedText(invitation.last("invitation_created")),
    invalidMembershipTypeError: async () =>
      refusedText(invitation.last("invalid_membership_type_error"), () => true, /membershipType|membership type/i),
    membershipIdentifier: async () => answeredField(invitation.last("membership_identifier"), "id"),
  };

  // PUT /api/affiliations/:id { tag: "approve" }; signed out this target answers 401
  // {"permissions":["You do not have permission to perform this action."]}.
  const approval = requests("affiliation-approval-request");
  let approvalOpened = "";
  const affiliationApprovalRequest: S.AffiliationApprovalRequestPage = {
    open: async (params) => {
      approvalOpened = seededId(params?.affiliationId, "affiliations");
    },
    async acceptMembershipByRequest(input) {
      const member = "accept_membership_by_request";
      const named = seededId(
        given(input, ["affiliation", "affiliationId", "membership", "membershipId", "membershipIdentifier", "id"]),
        "affiliations",
      );
      const affiliation = named || approvalOpened;
      if (!affiliation) unbound(`affiliation-approval-request.${member}`, "no membership was opened or named to accept");
      await approval.send(member, "PUT", `${baseURL}/api/affiliations/${encodeURIComponent(affiliation)}`, {
        tag: "approve",
        value: null,
      });
    },
    requestAccepted: async () => acceptedText(approval.last("request_accepted")),
    membershipStatus: async () => answeredField(approval.last("membership_status"), "membershipStatus"),
    refusalMessages: async () => messagesOf(approval.last("refusal_messages")),
    refusalStatus: async () => refusalStatusOf(approval.last("refusal_status")),
  };

  // ------------------------------------------------ accounts

  // Signed out, GET /api/users answers 401 ["You do not have permission to perform this action."].
  const userList = requests("user-list-request");
  const userListRequest: S.UserListRequestPage = {
    open: async () => {
      await userList.send("open", "GET", `${baseURL}/api/users`);
    },
    // One account per line: name, address, kind and standing.
    accountsAnswered: async () => {
      const got = userList.last("accounts_answered");
      const listed = got.status === 200 ? parse(got.body) : null;
      if (!Array.isArray(listed)) return "";
      return listed
        .map((each) => {
          const account = record(each);
          return `${textOf(account.name)} <${textOf(account.email)}> ${textOf(account.type)} ${textOf(account.status)}`.trim();
        })
        .join("\n");
    },
    refusedWhenNotPermitted: async () =>
      refusedText(userList.last("refused_when_not_permitted"), (status) => status === 401 || status === 403),
    refusalStatus: async () => refusalStatusOf(userList.last("refusal_status")),
  };

  // GET /api/sessions/current answers "null" signed out; signed in it carries the account as
  // "user", whose "notificationsOn" holds when new-opportunity notices were turned on.
  async function ownAccount(): Promise<Record<string, unknown>> {
    const got = await peek(`${baseURL}/api/sessions/current`);
    return got.status === 200 ? record(record(got.json).user) : {};
  }

  const userAccountSelfRequest: S.UserAccountSelfRequestPage = {
    open: async () => {
      await ownAccount();
    },
    userIdentifier: async () => textOf((await ownAccount()).id),
    newOpportunityNoticesSince: async () => textOf((await ownAccount()).notificationsOn),
  };

  // GET /api/users/:id; signed out this target answers 401 ["You do not have permission to
  // perform this action."]. Asked afresh at every read, so it shows what is held now.
  const account = requests("user-account-request");
  let accountOpened = "";
  async function askAccount(member: string): Promise<Answer> {
    if (!accountOpened) unbound(`user-account-request.${member}`, "no account was opened");
    return account.send(member, "GET", `${baseURL}/api/users/${encodeURIComponent(accountOpened)}`);
  }
  const userAccountRequest: S.UserAccountRequestPage = {
    open: async (params) => {
      const named = params?.userId ?? "";
      accountOpened = personOf(named)?.id || named;
      if (!accountOpened) unbound("user-account-request.open", "no account was named");
      await askAccount("open");
    },
    newOpportunityNoticesSince: async () => answeredField(await askAccount("new_opportunity_notices_since"), "notificationsOn"),
    refusedWhenNotPermitted: async () =>
      refusedText(await askAccount("refused_when_not_permitted"), (status) => status === 401 || status === 403),
    refusalStatus: async () => refusalStatusOf(await askAccount("refusal_status")),
  };

  // ------------------------------------------------ pages, by request

  // A page is read by its address or its identifier (GET /api/content/about answers the
  // page with "id", "slug", "title", "body"; an unknown address answers 404 ["Content not
  // found"], a malformed one 400 ["Please enter a valid slug."]). A change or removal is sent
  // against the identifier the address finds. Signed out, listing, creating, changing and
  // removing all answer 401 {"permissions":["You do not have permission to perform this action."]}.
  const contentRequests = requests("content-request");
  let contentOpened = "";

  const slugFrom = (input: unknown): string =>
    field(input, "slug", "address", "page") || (typeof input === "string" ? input : "") || contentOpened;

  async function pageRecord(slug: string): Promise<Record<string, unknown> | null> {
    const found = await peek(`${baseURL}/api/content/${encodeURIComponent(slug)}`);
    return found.status === 200 ? record(found.json) : null;
  }

  function pageFields(input: unknown): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const key of ["title", "slug", "body", "fixed"]) {
      const value = given(input, [key]);
      if (value !== undefined) out[key] = value;
    }
    return out;
  }

  async function changePage(member: string, slug: string, changes: Record<string, unknown>): Promise<void> {
    if (!slug) unbound(`content-request.${member}`, "no page was opened or named");
    const current = await pageRecord(slug);
    await contentRequests.send(
      member,
      "PUT",
      `${baseURL}/api/content/${encodeURIComponent(String(current?.id ?? slug))}`,
      { title: current?.title, slug: current?.slug ?? slug, body: current?.body, ...changes },
    );
  }

  const contentRequest: S.ContentRequestPage = {
    open: async (params) => {
      contentOpened = params?.slug ?? "";
    },
    readPageListByRequest: async () => {
      await contentRequests.send("read_page_list_by_request", "GET", `${baseURL}/api/content`);
    },
    readPageByRequest: async (input) => {
      const slug = slugFrom(input);
      if (!slug) unbound("content-request.read_page_by_request", "no page was opened or named");
      await contentRequests.send("read_page_by_request", "GET", `${baseURL}/api/content/${encodeURIComponent(slug)}`);
    },
    createPageByRequest: async (input) => {
      const fields = pageFields(input);
      if (!Object.keys(fields).length) {
        unbound("content-request.create_page_by_request", "the input names no title, address or body to send");
      }
      await contentRequests.send("create_page_by_request", "POST", `${baseURL}/api/content`, fields);
    },
    changePageByRequest: (input) => {
      const { slug: _address, ...changes } = pageFields(input);
      return changePage("change_page_by_request", slugFrom(input), changes);
    },
    // The new address comes as "to" (or a like name), or as a "slug" other than the page
    // opened; the page renamed is the one opened, or the one named as "from".
    renamePageByRequest: async (input) => {
      const member = "rename_page_by_request";
      const named = field(input, "slug", "address");
      const to =
        field(input, "to", "newSlug", "renameTo", "newAddress") ||
        (named && named !== contentOpened ? named : "") ||
        (typeof input === "string" ? input : "");
      if (!to) unbound(`content-request.${member}`, `the input names no new address for "${contentOpened}"`);
      const from = field(input, "from", "oldSlug") || contentOpened;
      const { slug: _address, ...changes } = pageFields(input);
      await changePage(member, from, { ...changes, slug: to });
    },
    removePageByRequest: async (input) => {
      const slug = slugFrom(input);
      if (!slug) unbound("content-request.remove_page_by_request", "no page was opened or named");
      const current = await pageRecord(slug);
      await contentRequests.send(
        "remove_page_by_request",
        "DELETE",
        `${baseURL}/api/content/${encodeURIComponent(String(current?.id ?? slug))}`,
      );
    },
    requestAccepted: async () => acceptedText(contentRequests.last("request_accepted")),
    refusalStatus: async () => refusalStatusOf(contentRequests.last("refusal_status")),
    refusalShape: async () => {
      const got = contentRequests.last("refusal_shape");
      if (got.status < 400) return "";
      const body = parse(got.body);
      return body === null ? typeof got.body : JSON.stringify(shapeOf(body));
    },
  };

  // ------------------------------------------------ evaluations, by request

  // The scores a test hands over: a list of them, a list under "scores" (or a like name), a
  // map from question to score, one question's { score, notes }, or scores and notes as two
  // lists side by side; each as { order, score, notes }, order counting from 0.
  function scoresFrom(input: unknown): { order: number; score: unknown; notes: unknown }[] {
    const held = record(input);
    const keys = ["scores", "questions", "answers", "evaluations", "entries"];
    let listed: unknown[] | null = Array.isArray(input) ? input : null;
    for (const key of keys) if (!listed && Array.isArray(held[key])) listed = held[key] as unknown[];
    for (const key of keys) {
      if (listed || !held[key] || typeof held[key] !== "object") continue;
      listed = Object.entries(held[key] as Record<string, unknown>)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([, value]) => value);
    }
    const notes = Array.isArray(held.notes) ? (held.notes as unknown[]) : null;
    if (!listed && (held.score !== undefined || held.notes !== undefined || held.note !== undefined)) listed = [held];
    if (!listed && notes) listed = notes.map(() => "");
    return (listed ?? []).map((each, i) => {
      if (each && typeof each === "object") {
        const one = each as Record<string, unknown>;
        const order = Number(one.order ?? (one.question !== undefined ? Number(one.question) - 1 : i));
        return { order, score: one.score ?? one.value, notes: one.notes ?? one.note ?? notes?.[i] ?? "" };
      }
      return { order: i, score: each, notes: notes?.[i] ?? "" };
    });
  }

  function throughAll(body: unknown): string[] {
    if (typeof body === "string") return [body];
    if (Array.isArray(body)) return body.flatMap(throughAll);
    if (body && typeof body === "object") return Object.values(body as Record<string, unknown>).flatMap(throughAll);
    return [];
  }

  // One panel member's sheet: the first save creates it (POST to the proponent's collection
  // with { proposal, status: "DRAFT", scores }), a later one changes it (PUT { tag: "edit",
  // value: { scores } }). Signed out, this target answers the read 401 ["You do not have
  // permission to perform this action."] and the create 401 {"permissions":[...]}.
  function evaluationRequest<T>(pageId: string, route: string): T {
    const asked = requests(pageId);
    let opened = "";
    let lastWasSubmission = false;
    const openedOr = (member: string): string => opened || unbound(`${pageId}.${member}`, "no evaluation has been opened");
    const stored = async (member: string): Promise<Record<string, unknown>> => {
      const found = await peek(openedOr(member));
      return found.status === 200 ? record(found.json) : {};
    };
    const storedScores = async (member: string): Promise<Record<string, unknown>[]> => {
      const scores = (await stored(member)).scores;
      return Array.isArray(scores) ? (scores as Record<string, unknown>[]) : [];
    };
    const collection = (): string => opened.replace(/\/[^/]+$/, "");
    const proposal = (): string => /\/proposal\/[^/]+\/([^/]+)\//.exec(opened)?.[1] ?? "";
    const built: Record<string, unknown> = {
      open: async (params?: Record<string, string>) => {
        opened = address(route, params);
        lastWasSubmission = false;
        await asked.send("open", "GET", opened);
      },
      saveDraftAsEntered: async (input?: unknown) => {
        const member = "save_draft_as_entered";
        const target = openedOr(member);
        const scores = scoresFrom(input);
        if (!scores.length) unbound(`${pageId}.${member}`, "the input carries no scores to send");
        lastWasSubmission = false;
        if ((await peek(target)).status === 200) await asked.send(member, "PUT", target, { tag: "edit", value: { scores } });
        else await asked.send(member, "POST", collection(), { proposal: proposal(), status: "DRAFT", scores });
      },
      submitThisEvaluationAlone: async () => {
        const member = "submit_this_evaluation_alone";
        lastWasSubmission = true;
        await asked.send(member, "PUT", openedOr(member), { tag: "submit", value: "" });
      },
      createEvaluationByRequest: async (input?: unknown) => {
        const member = "create_evaluation_by_request";
        openedOr(member);
        const scores = scoresFrom(input);
        if (!scores.length) unbound(`${pageId}.${member}`, "the input carries no scores to send");
        lastWasSubmission = false;
        await asked.send(member, "POST", collection(), { proposal: proposal(), status: "DRAFT", scores });
      },
      storedScores: async () =>
        (await storedScores("stored_scores")).map((each) => `${textOf(each.order)}: ${textOf(each.score)}`).join("\n"),
      storedNotes: async () =>
        (await storedScores("stored_notes")).map((each) => `${textOf(each.order)}: ${textOf(each.notes)}`).join("\n"),
      evaluationStatus: async () => textOf((await stored("evaluation_status")).status),
      refusedAsUnrecognised: async () =>
        refusedText(asked.last("refused_as_unrecognised"), () => true, /parseFailure|unrecogni[sz]ed|not a valid|unknown/i),
      refusedAtSubmission: async () =>
        lastWasSubmission ? refusedText(asked.last("refused_at_submission"), () => true) : "",
      evaluationCreated: async () => {
        const got = asked.last("evaluation_created");
        return got.status < 300 ? got.body : "";
      },
      creationRefusalMessage: async () => {
        const got = asked.last("creation_refusal_message");
        if (got.status < 400) return "";
        const texts = throughAll(parse(got.body));
        return texts.length ? texts.join("\n") : got.body;
      },
    };
    return built as unknown as T;
  }

  // The chair's consensus: changed with PUT { tag: "edit", value: { scores } }. Signed out,
  // this target answers the read 401 ["You do not have permission to perform this action."].
  function consensusRequest<T>(pageId: string, route: string): T {
    const asked = requests(pageId);
    let opened = "";
    const openedOr = (member: string): string => opened || unbound(`${pageId}.${member}`, "no consensus has been opened");
    const stored = async (member: string): Promise<Record<string, unknown>> => {
      const found = await peek(openedOr(member));
      return found.status === 200 ? record(found.json) : {};
    };
    const storedScores = async (member: string): Promise<Record<string, unknown>[]> => {
      const scores = (await stored(member)).scores;
      return Array.isArray(scores) ? (scores as Record<string, unknown>[]) : [];
    };
    const built: Record<string, unknown> = {
      open: async (params?: Record<string, string>) => {
        opened = address(route, params);
        await asked.send("open", "GET", opened);
      },
      changeConsensusByRequest: async (input?: unknown) => {
        const member = "change_consensus_by_request";
        const target = openedOr(member);
        const scores = scoresFrom(input);
        if (!scores.length) unbound(`${pageId}.${member}`, "the input carries no scores to send");
        await asked.send(member, "PUT", target, { tag: "edit", value: { scores } });
      },
      storedScores: async () =>
        (await storedScores("stored_scores")).map((each) => `${textOf(each.order)}: ${textOf(each.score)}`).join("\n"),
      storedNotes: async () =>
        (await storedScores("stored_notes")).map((each) => `${textOf(each.order)}: ${textOf(each.notes)}`).join("\n"),
      consensusStatus: async () => textOf((await stored("consensus_status")).status),
      requestAccepted: async () => acceptedText(asked.last("request_accepted")),
      refusedWhenNotPermitted: async () =>
        refusedText(asked.last("refused_when_not_permitted"), (status) => status === 401 || status === 403 || status === 404),
    };
    return built as unknown as T;
  }

  // ------------------------------------------------ an evaluation panel, by request

  // Sent as the opportunity's "editEvaluationPanel" change, every member as { user, chair,
  // evaluator, order }. Signed out, this target answers 401 {"permissions":[...]}.
  const panel = requests("evaluation-panel-request");
  let panelOpened = "";
  let panelSent = "";

  function namesIn(input: unknown): unknown[] {
    if (input === undefined || input === null) return [];
    if (typeof input === "string") return input.split(/\s*,\s*/).filter(Boolean);
    if (Array.isArray(input)) return input;
    const held = record(input);
    for (const key of ["members", "users", "evaluators", "panel"]) if (held[key] !== undefined) return namesIn(held[key]);
    return [input];
  }

  function panelNow(json: unknown): { user: string; chair: boolean; evaluator: boolean; order: number }[] {
    const members = record(json).evaluationPanel;
    return (Array.isArray(members) ? members : []).map((each, i) => {
      const member = record(each);
      const user = member.user;
      return {
        user: typeof user === "string" ? user : textOf(record(user).id),
        chair: member.chair === true,
        evaluator: member.evaluator === true,
        order: Number(member.order ?? i),
      };
    });
  }

  const evaluationPanelRequest: S.EvaluationPanelRequestPage = {
    open: async (params) => {
      panelOpened = address("/api/opportunities/:program/:opportunityId", params as unknown as Record<string, string>);
      panelSent = "";
      await panel.send("open", "GET", panelOpened);
    },
    async submitPanelWithMemberHoldingNoRole(input) {
      const member = "submit_panel_with_member_holding_no_role";
      const where = `evaluation-panel-request.${member}`;
      if (!panelOpened) unbound(where, "no opportunity has been opened");
      const who = given(input, ["member", "user", "userId", "person", "email"]) ?? input;
      const user = personOf(who)?.id;
      if (!user) unbound(where, `${JSON.stringify(who)} is not an account the seed knows`);
      const members = panelNow((await peek(panelOpened)).json).filter((each) => each.user !== user);
      members.push({ user, chair: false, evaluator: false, order: members.length });
      panelSent = "member-without-role";
      await panel.send(member, "PUT", panelOpened, { tag: "editEvaluationPanel", value: members });
    },
    async submitPanelWithNoChair(input) {
      const member = "submit_panel_with_no_chair";
      const where = `evaluation-panel-request.${member}`;
      if (!panelOpened) unbound(where, "no opportunity has been opened");
      const named = namesIn(input);
      if (!named.length) unbound(where, "the input names no members");
      const members = named.map((each, order) => {
        const user = personOf(each)?.id;
        if (!user) unbound(where, `${JSON.stringify(each)} is not an account the seed knows`);
        return { user, chair: false, evaluator: true, order };
      });
      panelSent = "no-chair";
      await panel.send(member, "PUT", panelOpened, { tag: "editEvaluationPanel", value: members });
    },
    memberWithoutRoleError: async () =>
      panelSent === "member-without-role" ? refusedText(panel.last("member_without_role_error"), () => true) : "",
    missingChairError: async () =>
      panelSent === "no-chair" ? refusedText(panel.last("missing_chair_error"), () => true) : "",
    // One member per line as the service now holds the panel.
    panelAsStored: async () => {
      if (!panelOpened) unbound("evaluation-panel-request.panel_as_stored", "no opportunity has been opened");
      const members = record((await peek(panelOpened)).json).evaluationPanel;
      return (Array.isArray(members) ? members : [])
        .map((each) => {
          const member = record(each);
          const user = record(member.user);
          return `${textOf(user.name) || textOf(user.id)} <${textOf(user.email)}> chair: ${member.chair === true} evaluator: ${member.evaluator === true}`;
        })
        .join("\n");
    },
  };

  // ------------------------------------------------ a stored file attached by identifier

  // The record as the service answers it, each nested record it names given as that
  // record's identifier, sent back as its "edit" change with one more attachment. Signed
  // out, this target answers the update 401 {"permissions":[...]}.
  const attach = requests("file-attach-by-identifier");
  let recordOpened = "";

  function fileIdFor(value: string): string {
    const byHandle = seededId(value, "stored_files");
    const inAddress = /\/api\/files\/([0-9a-f-]{36})/i.exec(byHandle);
    return inAddress ? inAddress[1] : byHandle;
  }

  const fileAttachByIdentifier: S.FileAttachByIdentifierPage = {
    open: async (params) => {
      recordOpened = address("/api/:recordKind/:program/:recordId", params as unknown as Record<string, string>);
      await attach.send("open", "GET", recordOpened);
    },
    async attachStoredFile(input) {
      const member = "attach_stored_file";
      const where = `file-attach-by-identifier.${member}`;
      if (!recordOpened) unbound(where, "no opportunity or proposal has been opened");
      const named = field(input, "fileId", "file", "id", "identifier", "address") || textOf(input);
      if (!named) unbound(where, "the input names no stored file");
      const current = await peek(recordOpened);
      const held = current.status === 200 ? record(current.json) : null;
      let value: Record<string, unknown> = { attachments: [fileIdFor(named)] };
      if (held) {
        value = { ...held };
        for (const [key, inner] of Object.entries(value)) {
          if (inner && typeof inner === "object" && !Array.isArray(inner) && "id" in inner) value[key] = record(inner).id;
        }
        const attached = Array.isArray(held.attachments) ? held.attachments : [];
        value.attachments = [...attached.map((each) => (each && typeof each === "object" ? record(each).id : each)), fileIdFor(named)];
      }
      await attach.send(member, "PUT", recordOpened, { tag: "edit", value });
    },
    attachmentAccepted: async () => acceptedText(attach.last("attachment_accepted")),
    attachmentRefused: async () => refusedText(attach.last("attachment_refused"), () => true),
    attachedFileIdentifiers: async () => {
      if (!recordOpened) unbound("file-attach-by-identifier.attached_file_identifiers", "no record has been opened");
      const held = record((await peek(recordOpened)).json).attachments;
      return (Array.isArray(held) ? held : [])
        .map((each) => (each && typeof each === "object" ? textOf(record(each).id) : textOf(each)))
        .join("\n");
    },
  };

  // ------------------------------------------------ proposals, by request

  function opportunityGiven(where: string, input: unknown): string {
    const id = seededId(given(input, ["opportunity", "opportunityId", "opportunityIdentifier"]), "opportunities");
    return id || unbound(where, `the input names no opportunity (${JSON.stringify(input)})`);
  }

  function organizationGiven(input: unknown): string {
    const names = ["organization", "organizationId", "organizationIdentifier", "org"];
    return seededId(given(input, names, ["proponent"]) ?? given(input, ["proponent"]), "organizations", "unassigned_identifiers");
  }

  function proposalReaders(requested: ReturnType<typeof requests>) {
    return {
      requestAccepted: async () => acceptedText(requested.last("request_accepted")),
      proposalIdentifier: async () => answeredField(requested.last("proposal_identifier"), "id"),
      proposalStatus: async () => answeredField(requested.last("proposal_status"), "status"),
      refusalByField: async () => byFieldOf(requested.last("refusal_by_field")),
      refusalMessages: async () => messagesOf(requested.last("refusal_messages")),
      refusalStatus: async () => refusalStatusOf(requested.last("refusal_status")),
    };
  }

  // POST /api/proposals/code-with-us { opportunity, proposalText, additionalComment,
  // proponent: { tag, value }, attachments, status: "SUBMITTED" }. Signed out, this target
  // answers 401 {"permissions":["You do not have permission to perform this action."]}.
  const cwuProposal = requests("proposal-cwu-request");

  async function sendCwuProposal(member: string, input: unknown, proponent: unknown): Promise<void> {
    await cwuProposal.send(member, "POST", `${baseURL}/api/proposals/code-with-us`, {
      opportunity: opportunityGiven(`proposal-cwu-request.${member}`, input),
      proposalText: givenText(input, ["proposalText", "proposal", "text"]),
      additionalComment: givenText(input, ["additionalComments", "additionalComment", "comments", "comment"]),
      proponent,
      attachments: [],
      status: "SUBMITTED",
    });
  }

  const proposalCwuRequest: S.ProposalCwuRequestPage = {
    open: async () => undefined,
    async submitWithOrganizationProponent(input) {
      const member = "submit_with_organization_proponent";
      const organization = organizationGiven(input);
      if (!organization) unbound(`proposal-cwu-request.${member}`, `the input names no organization (${JSON.stringify(input)})`);
      await sendCwuProposal(member, input, { tag: "organization", value: organization });
    },
    async submitWithIndividualProponent(input) {
      const within = ["individual", "proponent", "details", "contact", "address"];
      const text = (...names: string[]): string => givenText(input, names, within);
      await sendCwuProposal("submit_with_individual_proponent", input, {
        tag: "individual",
        value: {
          legalName: text("legalName", "name"),
          email: text("email", "emailAddress"),
          phone: text("phone", "phoneNumber"),
          street1: text("streetAddress", "street1", "street", "address", "addressLine1", "streetAddress1"),
          street2: text("secondAddressLine", "street2", "addressLine2", "streetAddress2"),
          city: text("city"),
          region: text("province", "region", "state"),
          mailCode: text("postalCode", "mailCode", "zip", "postal"),
          country: text("country"),
        },
      });
    },
    ...proposalReaders(cwuProposal),
  };

  // POST /api/proposals/:program, a submission as its form sends one. Team With Us:
  // { opportunity, organization, team: [{ member, resource, hourlyRate }],
  // resourceQuestionResponses: [{ order, response }], attachments, status }. Sprint With Us:
  // { opportunity, organization, inceptionPhase?, prototypePhase?, implementationPhase?:
  // { members: [{ member, scrumMaster }], proposedCost }, teamQuestionResponses, references,
  // attachments, status }. Signed out, this target answers 401 {"permissions":[...]}.
  const teamProposal = requests("proposal-team-request");
  let teamProgram = "";

  const listGiven = (input: unknown, names: string[]): unknown[] => {
    const value = given(input, names);
    return value === undefined || value === null ? [] : Array.isArray(value) ? value : [value];
  };

  // Answers by order. A question the input leaves unanswered is answered here, so that the
  // request is refused, if at all, for what the test gave.
  function answersFor(input: unknown, questions: unknown): { order: number; response: string }[] {
    const answers = listGiven(input, [
      "answers",
      "responses",
      "resourceQuestionResponses",
      "teamQuestionResponses",
      "resourceQuestions",
      "teamQuestions",
    ]).map((each, i) =>
      each && typeof each === "object"
        ? { order: Number(record(each).order ?? i), response: givenText(each, ["response", "answer", "text"]) }
        : { order: i, response: textOf(each) },
    );
    const asked = Array.isArray(questions) ? questions.length : 0;
    for (let order = 0; order < asked; order++) {
      if (!answers.some((each) => each.order === order)) {
        answers.push({ order, response: "Answered by the acceptance adapter so the proposal is complete." });
      }
    }
    return answers.sort((a, b) => a.order - b.order);
  }

  const memberIdOf = (value: unknown): string => personOf(value)?.id || textOf(value);
  const saysYes = (value: unknown): boolean => value === true || /^(yes|y|true|1)$/i.test(textOf(value).trim());

  async function teamProposalBody(where: string, program: string, input: unknown): Promise<Record<string, unknown>> {
    const opportunity = opportunityGiven(where, input);
    const organization = organizationGiven(input);
    const read = await peek(`${baseURL}/api/opportunities/${program}/${opportunity}`);
    const held = read.status === 200 ? record(read.json) : {};
    const body: Record<string, unknown> = { opportunity, attachments: [], status: "SUBMITTED" };
    if (organization) body.organization = organization;
    if (program === "team-with-us") {
      const resources = (Array.isArray(held.resources) ? held.resources : []).map(record);
      if (!resources.length) unbound(where, `the opportunity ${opportunity} answered ${read.status} with no resources to name a team for`);
      const resourceFor = (value: unknown): string => {
        if (value === undefined || value === null || value === "") return textOf(resources[0].id);
        const wanted = squash(textOf(value));
        const found =
          resources.find((each) => squash(textOf(each.serviceArea)) === wanted) ??
          resources.find((each) => textOf(each.id) === textOf(value));
        return found ? textOf(found.id) : textOf(value);
      };
      body.team = listGiven(input, ["team", "members", "teamMembers"]).map((each) => {
        const one = each && typeof each === "object" && !Array.isArray(each) ? each : { member: each };
        const rate = given(one, ["hourlyRate", "rate"]);
        return {
          member: memberIdOf(given(one, ["member", "user", "person"]) ?? one),
          resource: resourceFor(given(one, ["resource", "serviceArea", "area"])),
          hourlyRate: rate === undefined || rate === null || rate === "" ? 100 : Number(rate),
        };
      });
      body.resourceQuestionResponses = answersFor(input, held.resourceQuestions);
      return body;
    }
    // Sprint With Us: exactly the phases the input names.
    const PHASES: [string, RegExp][] = [
      ["inceptionPhase", /inception/i],
      ["prototypePhase", /prototype|proof/i],
      ["implementationPhase", /implementation/i],
    ];
    const grouped = given(input, ["phases", "team"]);
    const source: [string, unknown][] = Array.isArray(grouped)
      ? grouped.map((each, i): [string, unknown] => [givenText(each, ["phase", "name"]) || String(i), each])
      : Object.entries(grouped && typeof grouped === "object" ? (grouped as Record<string, unknown>) : record(input));
    for (const [key, value] of source) {
      const phase = PHASES.find(([, pattern]) => pattern.test(key));
      if (!phase) continue;
      const details = Array.isArray(value) ? { members: value } : record(value);
      const members = listGiven(details, ["members", "team", "teamMembers"]).map((each) => {
        const one = each && typeof each === "object" && !Array.isArray(each) ? each : { member: each };
        const scrum = given(one, ["scrumMaster", "isScrumMaster"]);
        return {
          member: memberIdOf(given(one, ["member", "user", "person"]) ?? one),
          scrumMaster: scrum === undefined ? undefined : saysYes(scrum),
        };
      });
      // Nobody marked either way: the first named leads, as the form asks one person to.
      if (members.length && members.every((each) => each.scrumMaster === undefined)) members[0].scrumMaster = true;
      const cost = given(details, ["proposedCost", "cost", "price"]);
      body[phase[0]] = {
        members: members.map((each) => ({ member: each.member, scrumMaster: each.scrumMaster === true })),
        proposedCost: cost === undefined || cost === null || cost === "" ? 1000 : Number(cost),
      };
    }
    body.teamQuestionResponses = answersFor(input, held.teamQuestions);
    // References the input leaves out are given here, since the form requires them.
    const givenReferences = listGiven(input, ["references"]);
    const references: unknown[] = givenReferences.length
      ? givenReferences
      : [1, 2, 3].map((n) => ({
          name: `Reference ${n} (acceptance adapter)`,
          company: "Placeholder Ministry",
          phone: "250-555-0100",
          email: `reference.${n}@example.test`,
        }));
    body.references = references.map((each, order) => ({
      name: givenText(each, ["name"]),
      company: givenText(each, ["company", "organization"]),
      phone: givenText(each, ["phone", "phoneNumber"]),
      email: givenText(each, ["email", "emailAddress"]),
      order,
    }));
    return body;
  }

  const proposalTeamRequest: S.ProposalTeamRequestPage = {
    open: async (params) => {
      teamProgram = String(params?.program ?? "");
    },
    async submitTeamProposal(input) {
      const member = "submit_team_proposal";
      const where = `proposal-team-request.${member}`;
      const program = givenText(input, ["program"]) || teamProgram;
      if (program !== "sprint-with-us" && program !== "team-with-us") {
        unbound(where, `no program was opened or given ("sprint-with-us" or "team-with-us"; given: "${program}")`);
      }
      await teamProposal.send(member, "POST", `${baseURL}/api/proposals/${program}`, await teamProposalBody(where, program, input));
    },
    ...proposalReaders(teamProposal),
  };

  // PUT /api/proposals/:program/:id with the stage's own tag and the score as its value.
  // Signed out, this target answers 401 {"permissions":[...]}.
  const stageScore = requests("proposal-evaluation-request");
  let scoreOpened = { program: "", proposal: "" };

  async function sendStageScore(member: string, program: string, tag: string, input: unknown): Promise<void> {
    const where = `proposal-evaluation-request.${member}`;
    const opened = givenText(input, ["program"]) || scoreOpened.program || program;
    if (opened !== program) unbound(where, `this score belongs to ${program}, but the request was opened for "${opened}"`);
    const proposal = seededId(given(input, ["proposal", "proposalId"]), "proposals") || scoreOpened.proposal;
    if (!proposal) unbound(where, "no proposal was opened or named to score");
    const value = typeof input === "number" || typeof input === "string" ? input : given(input, ["score", "value", "points"]);
    const score = Number(value);
    if (value === undefined || value === null || value === "" || !Number.isFinite(score)) {
      unbound(where, `the input names no score to send (${JSON.stringify(input)})`);
    }
    await stageScore.send(member, "PUT", `${baseURL}/api/proposals/${program}/${encodeURIComponent(proposal)}`, {
      tag,
      value: score,
    });
  }

  const proposalEvaluationRequest: S.ProposalEvaluationRequestPage = {
    open: async (params) => {
      scoreOpened = { program: String(params?.program ?? ""), proposal: seededId(params?.proposalId, "proposals") };
    },
    scoreTeamScenarioByRequest: (input) =>
      sendStageScore("score_team_scenario_by_request", "sprint-with-us", "scoreTeamScenario", input),
    scoreCodeChallengeByRequest: (input) =>
      sendStageScore("score_code_challenge_by_request", "sprint-with-us", "scoreCodeChallenge", input),
    scoreChallengeByRequest: (input) => sendStageScore("score_challenge_by_request", "team-with-us", "scoreChallenge", input),
    requestAccepted: async () => acceptedText(stageScore.last("request_accepted")),
    proposalStatus: async () => answeredField(stageScore.last("proposal_status"), "status"),
    refusalMessages: async () => messagesOf(stageScore.last("refusal_messages")),
    refusalStatus: async () => refusalStatusOf(stageScore.last("refusal_status")),
  };

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

    // Opened for real now that the page renders; the members bound earlier stay as they were.
    opportunityCwuView: opportunityView<S.OpportunityCwuViewPage>(
      CWU_VIEW,
      "/opportunities/code-with-us/:opportunityId",
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
      {
        assignmentDate: () => figureAbove(`${CWU_VIEW}.assignment_date`, /^assignment date$/i),
        startDate: () => figureAbove(`${CWU_VIEW}.start_date`, /^(work )?start date$/i),
        successfulProponentContactDetails: () =>
          awardDetail(`${CWU_VIEW}.successful_proponent_contact_details`, CONTACT_DETAIL),
        successfulProponentScore: () => awardDetail(`${CWU_VIEW}.successful_proponent_score`, SCORE_DETAIL),
      },
    ),

    opportunityCwuEdit: {
      ...unboundMembers(
        "opportunity-cwu-edit",
        behindSignIn(
          "the Code With Us management screen (and its ?tab=opportunity form, where the dates are read)",
          'shows the "Not Found" screen (tried with the seeded awarded opportunity)',
        ),
        ["proposal_deadline", "assignment_date", "start_date", "completion_date"],
      ),
      ...absent<S.OpportunityCwuEditPage>(
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
    } as S.OpportunityCwuEditPage,

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

    opportunitySwuView: opportunityView<S.OpportunitySwuViewPage>(
      SWU_VIEW,
      "/opportunities/sprint-with-us/:opportunityId",
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
      {
        assignmentDate: () => figureAbove(`${SWU_VIEW}.assignment_date`, /^assignment date$/i),
        scopeSection: () => sectionBehind(`${SWU_VIEW}.scope_section`, "Scope & Contract"),
        successfulProponentContactDetails: () =>
          awardDetail(`${SWU_VIEW}.successful_proponent_contact_details`, CONTACT_DETAIL),
        successfulProponentScore: () => awardDetail(`${SWU_VIEW}.successful_proponent_score`, SCORE_DETAIL),
      },
    ),

    opportunitySwuEdit: {
      ...unboundMembers(
        "opportunity-swu-edit",
        behindSignIn(
          "the Sprint With Us management screen, with its evaluator-only tabs and its ?tab=opportunity form",
          'shows the "Not Found" screen (tried with the seeded closed Sprint With Us opportunity)',
        ),
        ["instructions_tab", "evaluation_tab", "proposal_deadline", "assignment_date"],
      ),
      ...absent<S.OpportunitySwuEditPage>(
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
    } as S.OpportunitySwuEditPage,

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

    opportunityTwuView: opportunityView<S.OpportunityTwuViewPage>(
      TWU_VIEW,
      "/opportunities/team-with-us/:opportunityId",
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
      {
        assignmentDate: () => figureAbove(`${TWU_VIEW}.assignment_date`, /^contract award date$/i),
        startDate: () => figureAbove(`${TWU_VIEW}.start_date`, /^contract start date$/i),
        // The header shows no completion date; the "Key Dates" section does.
        completionDate: () => keyDate(`${TWU_VIEW}.completion_date`, /^contract completion date( \(anticipated\))?/i),
        termsSection: () => sectionBehind(`${TWU_VIEW}.terms_section`, "Competition Rules"),
        successfulProponentContactDetails: () =>
          awardDetail(`${TWU_VIEW}.successful_proponent_contact_details`, CONTACT_DETAIL),
        successfulProponentScore: () => awardDetail(`${TWU_VIEW}.successful_proponent_score`, SCORE_DETAIL),
      },
    ),

    opportunityTwuEdit: {
      ...unboundMembers(
        "opportunity-twu-edit",
        behindSignIn(
          "the Team With Us management screen, with its evaluator-only tabs, its offered changes of state and its ?tab=opportunity form",
          'shows the "Not Found" screen (tried with the seeded closed Team With Us opportunity)',
        ),
        [
          "instructions_tab",
          "evaluation_tab",
          "offered_state_changes",
          "proposal_deadline",
          "assignment_date",
          "start_date",
          "completion_date",
        ],
      ),
      ...absent<S.OpportunityTwuEditPage>(
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
    } as S.OpportunityTwuEditPage,

    opportunityTwuComplete: absent<S.OpportunityTwuCompletePage>(
      "opportunity-twu-complete",
      "/opportunities/team-with-us/:opportunityId/complete",
      notAPage("/opportunities/team-with-us/:opportunityId/complete"),
      ["full_report"],
    ),

    scheduledTransitionTrigger,

    proposalCwuCreate: {
      ...unboundMembers(
        "proposal-cwu-create",
        behindSignIn("the Code With Us proposal form", 'shows the "Not Found" screen (tried with the seeded published Code With Us opportunity)'),
        ["field_errors_by_field"],
      ),
      ...absent<S.ProposalCwuCreatePage>(
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
    } as S.ProposalCwuCreatePage,

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

    proposalSwuCreate: {
      ...unboundMembers(
        "proposal-swu-create",
        behindSignIn("the Sprint With Us proposal form", 'shows the "Not Found" screen (tried with the seeded closed Sprint With Us opportunity)'),
        ["team_member_choices", "phase_team_sections", "phase_requirements", "cost_errors"],
      ),
      ...absent<S.ProposalSwuCreatePage>(
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
    } as S.ProposalSwuCreatePage,

    proposalSwuEdit: {
      ...unboundMembers(
        "proposal-swu-edit",
        behindSignIn("a Sprint With Us proposal's edit screen", 'shows the "Not Found" screen (tried with the seeded Sprint With Us proposals)'),
        [
          "choose_organization",
          "add_phase_team_member",
          "set_scrum_master",
          "submission_refusal",
          "field_error",
          "organization",
        ],
      ),
      ...absent<S.ProposalSwuEditPage>(
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
    } as S.ProposalSwuEditPage,

    proposalSwuView: {
      ...unboundMembers(
        "proposal-swu-view",
        behindSignIn("a Sprint With Us proposal's evaluation screen", 'shows the "Not Found" screen (tried with the seeded Sprint With Us proposals)'),
        ["history_entries", "rank", "offered_score_actions"],
      ),
      ...absent<S.ProposalSwuViewPage>(
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
    } as S.ProposalSwuViewPage,

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

    proposalTwuCreate: {
      ...unboundMembers(
        "proposal-twu-create",
        behindSignIn("the Team With Us proposal form", 'shows the "Not Found" screen (tried with the seeded closed Team With Us opportunity)'),
        ["team_member_choices"],
      ),
      ...absent<S.ProposalTwuCreatePage>(
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
    } as S.ProposalTwuCreatePage,

    proposalTwuEdit: {
      ...unboundMembers(
        "proposal-twu-edit",
        behindSignIn("a Team With Us proposal's edit screen", 'shows the "Not Found" screen (tried with the seeded Team With Us proposals)'),
        ["choose_organization", "add_team_member_for_resource", "submission_refusal", "field_error", "organization"],
      ),
      ...absent<S.ProposalTwuEditPage>(
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
    } as S.ProposalTwuEditPage,

    proposalTwuView: {
      ...unboundMembers(
        "proposal-twu-view",
        behindSignIn("a Team With Us proposal's evaluation screen", 'shows the "Not Found" screen (tried with the seeded Team With Us proposals)'),
        ["history_entries", "rank", "offered_score_actions"],
      ),
      ...absent<S.ProposalTwuViewPage>(
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
    } as S.ProposalTwuViewPage,

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

    organizationEdit: {
      ...unboundMembers(
        "organization-edit",
        behindSignIn(
          "an organization's edit screen, where its logo is changed",
          "redirects to /sign-in?redirectOnSuccess=… (tried with a seeded organization's identifier)",
        ),
        ["change_logo", "current_logo", "logo_refused_error"],
      ),
      ...absent<S.OrganizationEditPage>(
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
    } as S.OrganizationEditPage,

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

    // Opened for real so that what a person who may not evaluate is shown can be read.
    evaluationIndividualCreateSwu: evaluationScreen<S.EvaluationIndividualCreateSwuPage>(
      "evaluation-individual-create-swu",
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/evaluations/create",
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

    evaluationIndividualEditSwu: evaluationScreen<S.EvaluationIndividualEditSwuPage>(
      "evaluation-individual-edit-swu",
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/team-questions/evaluations/:userId/edit",
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

    evaluationIndividualCreateTwu: evaluationScreen<S.EvaluationIndividualCreateTwuPage>(
      "evaluation-individual-create-twu",
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/evaluations/create",
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

    evaluationIndividualEditTwu: evaluationScreen<S.EvaluationIndividualEditTwuPage>(
      "evaluation-individual-edit-twu",
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/resource-questions/evaluations/:userId/edit",
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

    contentList: {
      ...unboundMembers(
        "content-list",
        behindSignIn("the content management list (administrators only)", 'shows the "Not Found" screen'),
        ["page_count"],
      ),
      ...absent<S.ContentListPage>(
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
    } as S.ContentListPage,

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

    contentEdit: {
      ...unboundMembers(
        "content-edit",
        behindSignIn(
          "a page's management screen (administrators only)",
          'shows the "Not Found" screen (tried with /content/about/edit)',
        ),
        ["published_by_link", "updated_by_link"],
      ),
      ...absent<S.ContentEditPage>(
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
    } as S.ContentEditPage,

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

    caughtMessage,
    caughtMessageList,
    mailDeliveryFault,
    mailDeliveryDelay,
    organizationActingForList,
    affiliationInvitationRequest,
    affiliationApprovalRequest,
    userListRequest,
    contentRequest,
    evaluationIndividualRequestSwu: evaluationRequest<S.EvaluationIndividualRequestSwuPage>(
      "evaluation-individual-request-swu",
      "/api/proposal/sprint-with-us/:proposalId/team-questions/evaluations/:userId",
    ),
    evaluationIndividualRequestTwu: evaluationRequest<S.EvaluationIndividualRequestTwuPage>(
      "evaluation-individual-request-twu",
      "/api/proposal/team-with-us/:proposalId/resource-questions/evaluations/:userId",
    ),
    evaluationConsensusRequestSwu: consensusRequest<S.EvaluationConsensusRequestSwuPage>(
      "evaluation-consensus-request-swu",
      "/api/proposal/sprint-with-us/:proposalId/team-questions/consensus/:userId",
    ),
    evaluationConsensusRequestTwu: consensusRequest<S.EvaluationConsensusRequestTwuPage>(
      "evaluation-consensus-request-twu",
      "/api/proposal/team-with-us/:proposalId/resource-questions/consensus/:userId",
    ),
    evaluationPanelRequest,
    fileAttachByIdentifier,
    proposalCwuRequest,
    proposalTeamRequest,
    proposalEvaluationRequest,
    userAccountSelfRequest,
    userAccountRequest,
  };

  return surface;
}
