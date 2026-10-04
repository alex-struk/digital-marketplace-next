// Adapter binding the abstract Surface to the running "new" target.
//
// Everything here was found by opening the application in a browser and looking at it.
// Controls are located by their role, their accessible name, their visible text, or the
// address they lead to — never by a class, an id or a test attribute, because there is no
// source in this workspace and a test must not depend on one.
//
// What this target is, as it stands
// ---------------------------------
// The whole marketplace is served at this address. A signed-out visitor is shown the home
// page, the opportunity list and each opportunity's public page, the organization list,
// the sign-in, sign-up and signed-out screens, the two notices, the published pages under
// /content/:slug, the program explainers under /learn-more and the service's own /status;
// the service answers its interface under /api (files included) for whoever the browser's
// session carries.
//
// Signing in goes through the sandbox identity provider's own form ("Sign in as a vendor" /
// "Sign in as a public sector employee" on /sign-in), and signIn() fills it. The screens
// behind a session were walked signed in (as the vendors, the public sector employee, the
// administrator, the vendor still to complete a profile and the first-time accounts), and
// walked again on the current build (2026-10-03). The running build serves a signed-in
// person /dashboard (to the administrator and public sector staff, "Create an opportunity"
// over a table of opportunities, each linked; to a vendor, "My proposals" and "My
// organizations' proposals"), their own profile at /users/me or /users/<their own id>
// (editable, with its picture picker) with its Capabilities, Organizations, Notifications
// and Legal sections, another account's /users/:userId and the list of accounts at /users
// to the administrator, the content management screens (/content, /content/create,
// /content/:slug/edit) to the administrator, /sign-up/complete to a vendor still to
// complete a profile, the organization screens (/organizations, /organizations/create, an
// organization's /organizations/:orgId/edit with its qualification sections, and its
// Sprint With Us and Team With Us terms screens), every program's public opportunity page,
// and to a vendor the three programs' proposal forms and their own proposal's screen
// (.../proposals/:proposalId/edit). To the administrator and public sector staff it also
// serves the program chooser (/opportunities/create), the three programs' forms
// (/opportunities/{code,sprint,team}-with-us/create), each program's management screen
// (/opportunities/<program>/:opportunityId/edit, its ?tab= sections, Proposals among them,
// and form, attachments included) and every program's proposal screen
// (/opportunities/<program>/:opportunityId/proposals/:proposalId, the Sprint With Us and
// Team With Us ones reached from the proponent links of the opportunity's Proposals
// section). It still answers "Page not found", to everybody walked, at /proposals, at
// every program's printable copies (.../proposals/:proposalId/export,
// .../proposals/export) and .../complete, and at the evaluation and consensus screens
// (.../team-questions/..., .../resource-questions/...); and
// /admin/email-notification-reference is not a screen at all (the service answers it 404
// "Cannot GET", to the administrator too). Those screens' open() reports "unbound:
// <page>.open — <reason>" only when the address really answers with that refusal, and
// their members report "unbound: <page>.<member> — <reason>". A member that is about the
// refusal itself (refused_for_non_administrator, sign_in_required, not_found_page, ...)
// reads that refusal.
//
// Every page is laid out inside one "main" landmark that also holds the site's banner and
// its footer, so a page's own words are read with the banner's and the footer's taken off.

import type { Dialog, Locator, Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { request as httpRequest } from "node:http";
import type { IncomingMessage, RequestOptions } from "node:http";
import { request as httpsRequest } from "node:https";
import { extname } from "node:path";
import type { Persona, persona as PersonaTable } from "../../generated/personas";
import { seed } from "../../generated/seed";
import type * as S from "../../generated/surface";
import { uploadFile } from "../../fixtures/upload";

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
  // A section of a screen by its name. The running build draws its forms' and pages'
  // sections as regions that carry no accessible name of their own, each under a level-2
  // heading ("Resources", "Evaluation panel", "Scope"), so a region is found by its name or,
  // failing that, by the heading it holds.
  const regionNamed = (scope: Page | Locator, name: RegExp): Locator =>
    scope.getByRole("region", { name }).or(scope.getByRole("region").filter({ has: page.getByRole("heading", { name }) }));

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

  const lined = (words: string): string[] =>
    words
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

  // The page's own content, with the banner and the standing footer left off. Both sit
  // inside the same "main" landmark as the page itself, the banner first and the footer
  // last, so their lines are taken off the front and the back of what main says.
  async function mainText(): Promise<string> {
    await ready();
    const main = page.getByRole("main");
    if (!(await main.count())) return bodyText();
    let lines = lined(await main.first().innerText());
    const banner = seen(page.getByRole("navigation"));
    if (await banner.count()) {
      const top = lined(await banner.first().innerText());
      if (top.length && top.every((line, i) => lines[i] === line)) lines = lines.slice(top.length);
    }
    if (await siteFooter().count()) {
      const bottom = lined(await siteFooter().innerText());
      const from = lines.length - bottom.length;
      if (bottom.length && from >= 0 && bottom.every((line, i) => lines[from + i] === line)) lines = lines.slice(0, from);
    }
    return lines.join("\n");
  }

  // The site's footer: its links over "Owned and operated by the B.C. Government.", with no
  // landmark role of its own. A footer drawn as a contentinfo landmark is taken first.
  function siteFooter(): Locator {
    return page
      .getByRole("contentinfo")
      .or(page.getByText("Owned and operated by the B.C. Government.", { exact: true }).locator("xpath=.."))
      .last();
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

  // A value drawn beside its label on one line, the way the signed-in profile draws its
  // account facts ("Account type: Vendor", "Status: Active"), or under a label on a line of
  // its own; labels are matched without regard to case.
  async function labelledValue(labels: string[]): Promise<string> {
    const wanted = labels.map((label) => label.toLowerCase());
    const lines = await textLines();
    for (let i = 0; i < lines.length; i++) {
      const beside = /^([^:]+):\s*(.+)$/.exec(lines[i]);
      if (beside && wanted.includes(beside[1].trim().toLowerCase())) return beside[2].trim();
      const alone = lines[i].replace(/:\s*$/, "").trim().toLowerCase();
      if (wanted.includes(alone) && i + 1 < lines.length) return lines[i + 1];
    }
    return "";
  }

  async function firstHeading(): Promise<string> {
    const heading = seen(page.getByRole("heading"));
    return (await heading.count()) ? (await heading.first().innerText()).trim() : "";
  }

  // What the client shows in place of a page it has no record or route for: its "Not
  // Found" screen now, "Page not found" when this adapter was first written.
  async function notFoundShown(): Promise<boolean> {
    await ready();
    return (
      (await seen(page.getByRole("heading", { name: /^\s*(page )?not found\s*$/i })).count()) > 0
    );
  }

  // The lines of the page's content that match, one per line.
  async function linesMatching(pattern: RegExp): Promise<string> {
    return (await textLines()).filter((line) => pattern.test(line)).join("\n");
  }

  // A value drawn over its label ("95" over "Total Opportunities Awarded").
  async function valueAbove(label: RegExp): Promise<string> {
    const lines = await textLines();
    for (let i = 1; i < lines.length; i++) if (label.test(lines[i])) return lines[i - 1];
    return "";
  }

  // "Published <date> | Updated <date>": one line on a wide screen, and read as up to three
  // lines of text ("Published …", "|", "Updated …"); both are read the same way.
  async function datedLine(which: "Published" | "Updated"): Promise<string> {
    const words = (await textLines()).join("\n");
    const found = new RegExp(`(?:^|\\n|\\|\\s*)${which}\\s+([^\\n|]+)`).exec(words);
    return found ? found[1].trim() : "";
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

  // ---------------------------------------------------------------- screens behind sign-in
  //
  // Every screen the contract names that needs a session. Each was opened signed out, with
  // the seeded record's identifier wherever its address takes one, and what it answered is
  // named in the reason. open() throws for the same reason its members do, so that a test
  // which opens one of these and reads nothing else is not told it worked — except on a
  // screen with a member about the refusal itself, where reaching the refusal is the point
  // and open() only goes there.

  const camel = (name: string): string => name.replace(/_([a-z0-9])/g, (_match, c: string) => c.toUpperCase());

  // What walking the target signed in found, walked again on the current build (2026-10-03)
  // as the administrator, the public sector employee who sits on the seeded panels, the
  // organization-owner vendor and a vendor with no proposals: the dashboards, one's own
  // account screens, the organization screens with their qualification sections and terms
  // screens, every program's public opportunity page, the three programs' proposal forms
  // and a vendor's own proposal's screen, to public sector staff and the administrator the
  // program chooser, the forms, the three programs' management screens and the Code With Us
  // proposal's screen, and (seen again 2026-10-04) the Sprint With Us and Team With Us
  // proposal's screens. What still answers "Page not found" is named at the end: /proposals,
  // every printable copy, every
  // .../complete and the evaluation and consensus screens.
  const NOBODY_SIGNS_IN =
    'walked signed in on the current build (as the administrator, as the public sector employee who owns the seeded opportunities and sits on their panels, and as vendors — the seeded organization owner, who wrote the seeded proposals, and a vendor with none — with the seeded records\' identifiers), the running build serves a signed-in person /dashboard (to staff "Create an opportunity" over "My opportunities", to the administrator every opportunity, to a vendor "My proposals" and "My organizations\' proposals"), /opportunities and every program\'s public opportunity page (with "Watch this opportunity", and "Start a proposal" while it takes proposals), the account screens under /users, /organizations, /organizations/create, /organizations/:orgId/edit (its Sprint With Us and Team With Us qualification sections drawing the requirements and "Read the … terms and conditions") and /organizations/:orgId/{sprint,team}-with-us-terms-and-conditions, to the administrator the content-management screens under /content, to a vendor the three programs\' proposal forms .../proposals/create and their own proposal\'s screen .../proposals/:proposalId/edit, and to the administrator and public sector staff /opportunities/create, the three programs\' forms, their management screens /opportunities/{code,sprint,team}-with-us/:opportunityId/edit (sections Summary, Opportunity, Addenda, History, Proposals — proponents in plain text with no link onward — and, on Sprint With Us and Team With Us, Evaluation panel; no instructions, evaluation or consensus section, ?tab=instructions, ?tab=evaluation and ?tab=consensus drawing the Summary) and the Code With Us proposal\'s screen /opportunities/code-with-us/:opportunityId/proposals/:proposalId (proponent, Status, Submitted, Proposal ID, Score, "Printable copy", and the sections Proposal and History, with no button); the Sprint With Us and Team With Us proposal\'s screen /opportunities/{sprint,team}-with-us/:opportunityId/proposals/:proposalId (proponent, Opportunity, Status, Submitted, Proposal ID, "Printable copy", and the sections Proposal and History, with no button); walked the same way it still answers "Page not found" at /proposals, at every program\'s .../proposals/:proposalId/export (where the Code With Us screen\'s "Printable copy" lands, to the proposal\'s own author too) and .../proposals/export, at every program\'s .../complete, and at the evaluation and consensus screens under .../team-questions/ and .../resource-questions/';

  // What each such address answered a signed-out visitor when it was last opened: /dashboard
  // and /sign-up/complete send them to /sign-in?redirectOnSuccess=…, and everything else
  // (/users/me, /users/:userId, /organizations/:orgId/edit, the create screens) shows the
  // client's "Page not found" screen.
  function signedOutAnswer(route: string): string {
    if (/^\/(dashboard|sign-up\/complete)(\?|$)/.test(route)) {
      return "redirects to /sign-in";
    }
    return 'shows the "Page not found" screen';
  }

  const behindSession = (route: string): string =>
    `${route} is offered only to a signed-in person, and ${NOBODY_SIGNS_IN}; opened signed out (with the seeded record's identifier where it takes one) it ${signedOutAnswer(route)}`;

  // The evaluation sections a Sprint With Us or Team With Us management screen does not have:
  // the screen itself opens, and ?tab=<section> draws its Summary.
  const sectionMissing = (program: "sprint-with-us" | "team-with-us", tab: string): string =>
    `the management screen /opportunities/${program}/:opportunityId/edit opens, signed in, to the administrator and to the public sector employee who owns the seeded opportunities and sits on their panels, but offers no instructions, evaluation or consensus section: walked on the current build on the seeded ${program === "sprint-with-us" ? "Sprint With Us opportunities at individual evaluation (with an evaluation already begun), at consensus and at the code challenge" : "Team With Us opportunities at individual evaluation (with an evaluation already begun), at consensus and at the challenge"}, its sections are Summary, Opportunity, Addenda, History, Proposals and Evaluation panel, and ?tab=${tab} draws the Summary; opened signed out the screen shows the "Page not found" screen`;

  function absent<T>(
    pageId: string,
    route: string,
    answers: string,
    members: readonly string[],
    refusals: readonly string[] = [],
  ): T {
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
        if (refusals.length) return;
        // A build that serves the screen to whoever signed in has opened it, and only the
        // members nothing on it does report unbound.
        if (!(await whyNotHere().catch(() => ""))) return;
        // What the address actually answered this time, rather than what it answered when
        // this adapter was written.
        const shown = await firstHeading().catch(() => "");
        throw new Error(
          `unbound: ${pageId}.open — ${answers}${shown ? ` (it shows "${shown}" at ${page.url()})` : ""}`,
        );
      },
    };
    for (const member of members) {
      built[camel(member)] = async (): Promise<never> => {
        throw new Error(`unbound: ${pageId}.${member} — ${answers}`);
      };
    }
    for (const member of refusals) built[camel(member)] = () => refusalShown();
    return built as unknown as T;
  }

  // ---------------------------------------------------------------- sign in and out

  type SignInEntry = { route?: string; username?: string; unavailable?: string };

  // This target signs in through the sandbox identity provider, so a persona's username is
  // read from persona.signIn["sandbox-idp"] and the password from the environment — never
  // from anything written down in the suite.
  //
  // /sign-in offers "Sign in as a vendor" and "Sign in as a public sector employee" (buttons),
  // and each hands off to the sandbox identity provider's "Sign in to your account" form,
  // which returns through /auth/callback to the marketplace once it accepts the account.
  // Who the browser was last signed in as (the anonymous visitor when signed out), so a
  // screen or control that is missing can be told apart as a refusal of that person.
  let actingAs: Persona | null = null;
  const actingMay = (capability: RegExp): boolean =>
    !!actingAs && ((actingAs as unknown as { can?: string[] }).can ?? []).some((one) => capability.test(one));
  const actingId = (): string => (actingAs as unknown as { id?: string } | null)?.id ?? "nobody signed in";

  async function signIn(who: Persona): Promise<void> {
    const table = who.signIn as unknown as null | Record<string, SignInEntry>;
    actingAs = null;
    if (!table) {
      // The anonymous visitor has no account; being signed out is the whole state.
      await forgetEveryone();
      actingAs = who;
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

    // Start from a browser holding nothing for the target (a person still signed in is
    // sent from /sign-in on to /dashboard), then take the way in the sign-in screen offers
    // this kind of account: "Sign in as a vendor" for a vendor, "Sign in as a public sector
    // employee" for public sector staff and administrators. Every vendor's sandbox username
    // says so.
    await forgetEveryone();
    await page.goto(baseURL + "/sign-in", { waitUntil: "domcontentloaded" });
    await ready();
    const way = /vendor/i.test(entry.username) ? "Sign in as a vendor" : "Sign in as a public sector employee";
    const offer = await findControl(page, new RegExp(`^\\s*${way}\\s*$`, "i"));
    if (!offer) {
      throw new Error(`unbound: ${where} — the sign-in screen at ${page.url()} offers no "${way}" control`);
    }
    await offer.click();

    // The provider's own form: "Sign in to your account", with "Username", "Password" and
    // "Sign In". The password box sits beside a "Show password" button, so both are found
    // as text boxes by name rather than by any label mentioning a password.
    const form = await identityProviderForm();
    if (!form) {
      // Only the provider's origin is named: its address carries the request's parameters.
      const said = (await bodyText().catch(() => "")).replace(/\s+/g, " ").slice(0, 300);
      throw new Error(
        `unbound: ${where} — "${way}" on /sign-in hands off to ${originOf(page.url())}, which shows no username and password form; it says: ${said}`,
      );
    }
    await form.username.fill(entry.username);
    await form.password.fill(password);
    const submit = seen(page.getByRole("button", { name: /^\s*(sign in|log in)\s*$/i })).first();
    if (!(await submit.count())) {
      throw new Error(
        `unbound: ${where} — the identity provider form at ${originOf(page.url())} offers nothing to submit it with`,
      );
    }
    await submit.click();
    const home = originOf(baseURL);
    const back = await page
      .waitForURL((url) => url.origin === home && !/^\/auth\/callback/.test(url.pathname), { timeout: 30000 })
      .then(() => true)
      .catch(() => false);
    if (!back) {
      // Still on the provider: it refused the account, and says why. That is a real failure
      // of signing in, not a missing binding.
      const said = (await bodyText().catch(() => "")).replace(/\s+/g, " ").slice(0, 300);
      throw new Error(
        `${where} — the identity provider at ${originOf(page.url())} did not hand back to ${home} after "Sign In" as ${entry.username}; it says: ${said}`,
      );
    }
    await settle();
    // The client sends the person on after it has loaded their account (a vendor still to
    // complete a profile to /sign-up/complete, everyone else to /dashboard), so wait until
    // the address has stopped moving before handing the browser back.
    let last = page.url();
    for (let steady = 0, i = 0; steady < 3 && i < 40; i++) {
      await page.waitForTimeout(250);
      const now = page.url();
      steady = now === last ? steady + 1 : 0;
      last = now;
    }
    await ready();
    actingAs = who;
  }

  function originOf(href: string): string {
    return /^[a-z]+:\/\/[^/?#]+/i.exec(href)?.[0] ?? href;
  }

  async function identityProviderForm(): Promise<{ username: Locator; password: Locator } | null> {
    const username = seen(page.getByRole("textbox", { name: /^\s*(user\s*name|username or email|email)\s*$/i })).first();
    const password = seen(page.getByRole("textbox", { name: /^\s*password\s*$/i })).first();
    await username.waitFor({ state: "visible", timeout: 20000 }).catch(() => undefined);
    if ((await username.count()) && (await password.count())) return { username, password };
    // A password input has no textbox role in every browser; fall back to its label alone.
    const byLabel = seen(page.getByLabel(/^\s*password\s*$/i, { exact: false })).first();
    if ((await username.count()) && (await byLabel.count())) return { username, password: byLabel };
    return null;
  }

  // Nobody signed in: the browser carries no cookies (the marketplace's nor the identity
  // provider's) and none of the target's local or session storage, where the client keeps
  // "digital-marketplace.tokens" and "digital-marketplace.account". Storage can only be
  // emptied from the target's own origin, so the browser is left on "/" and reloaded there.
  async function forgetEveryone(): Promise<void> {
    await page.context().clearCookies().catch(() => undefined);
    if (originOf(page.url()) !== originOf(baseURL)) {
      await page.goto(baseURL + "/", { waitUntil: "domcontentloaded" });
    }
    await clearStorage();
    await page.goto(baseURL + "/", { waitUntil: "domcontentloaded" });
    await settle();
  }

  async function clearStorage(): Promise<void> {
    await page
      .evaluate(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
      })
      .catch(() => undefined);
  }

  // Signing out the way a person does: the "Sign out" link in the header's "Account"
  // navigation (it goes to /sign-out), or /sign-out itself when the browser is not on a
  // marketplace screen carrying that link. The service ends the session there and draws
  // "Signed Out" / "You have successfully signed out" / "Sign in again", and the browser is
  // left on that screen for user-sign-out to read. Nothing is cleared here: whether the
  // session actually ended is the service's to decide and the test's to check. The full
  // reset lives in forgetEveryone(), at the start of signIn() and for the anonymous persona.
  async function signOut(): Promise<void> {
    actingAs = null;
    const onTarget = originOf(page.url()) === originOf(baseURL);
    const link = onTarget
      ? seen(page.getByRole("navigation").getByRole("link", { name: /^\s*sign out\s*$/i })).first()
      : null;
    if (link && (await link.count())) {
      await link.click();
      await page.waitForURL((url) => url.pathname === "/sign-out", { timeout: 15000 }).catch(() => undefined);
    }
    if (new URL(page.url()).pathname !== "/sign-out") {
      await page.goto(baseURL + "/sign-out", { waitUntil: "domcontentloaded" });
    }
    await ready();
  }

  // ================================================================ the pages that are here

  // ---------------------------------------------------------------- home

  const home: S.HomePage = {
    open: () => go("/"),
    browseOpportunities: () => press("home.browse_opportunities", /^browse opportunities$/i),
    signIn: () => press("home.sign_in", /^sign in$/i),
    signUp: () => press("home.sign_up", /^sign up$/i),
    // Each figure is drawn over its label ("95" over "TOTAL OPPORTUNITIES AWARDED", the
    // label shown in capitals).
    totalAwardedOpportunityCount: async () => {
      const found = await valueAbove(/^total opportunities awarded$/i);
      if (found) return found;
      throw new Error(
        `unbound: home.total_awarded_opportunity_count — the home page carries no "Total Opportunities Awarded" figure; it reads: ${(await mainText()).replace(/\n+/g, " | ")}`,
      );
    },
    totalAwardedOpportunityValue: async () => {
      const found = await valueAbove(/^total value of all opportunities$/i);
      if (found) return found;
      throw new Error(
        `unbound: home.total_awarded_opportunity_value — the home page carries no "Total Value of All Opportunities" figure; it reads: ${(await mainText()).replace(/\n+/g, " | ")}`,
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

  const footer = siteFooter;

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

  // Where following the link last landed, so the answer is read from that page itself.
  let slaFollowedTo: string | null = null;

  const contentServiceLevelAgreementLink: S.ContentServiceLevelAgreementLinkPage = {
    open: async () => {
      slaFollowedTo = null;
      await go("/learn-more/code-with-us");
    },
    followServiceLevelAgreementLink: async () => {
      await ready();
      const href = (await slaLink().count()) ? await slaLink().first().getAttribute("href") : null;
      if (!href) {
        throw new Error(
          `unbound: content-service-level-agreement-link.follow_service_level_agreement_link — no service level agreement link on ${page.url()}`,
        );
      }
      await visit(href);
      slaFollowedTo = page.url();
    },
    serviceLevelAgreementLink: async () => {
      await ready();
      return (await slaLink().count()) ? (await slaLink().first().innerText()).trim() : "";
    },
    linkTargetAddress: async () => {
      await ready();
      return ((await slaLink().count()) ? await slaLink().first().getAttribute("href") : null) ?? "";
    },
    // Once the link has been followed, the answer is the page it led to, which carries no
    // such link of its own. Otherwise nothing is followed, and so nothing is answered, where
    // the page offers no such link (the program explainers carry none on this target).
    answerAtLinkTarget: async () => {
      await ready();
      if (slaFollowedTo && page.url() === slaFollowedTo) return mainText();
      if (!(await slaLink().count())) return "";
      const href = await slaLink().first().getAttribute("href");
      if (!href) return "";
      await visit(href);
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
      // The page is drawn as an article in main: its title, its dates as terms, its body and
      // a line stating its own address, which carries no link. So every link in the article
      // is in the body (seen with a page written to link to /content/about).
      const main = page.getByRole("main");
      const article = seen(main.getByRole("article"));
      const body = (await article.count()) ? article.first() : main.first();
      const links = seen(body.getByRole("link"));
      const count = await links.count();
      for (let i = 0; i < count; i++) {
        const href = (await links.nth(i).getAttribute("href")) ?? "";
        if (!href || href.startsWith("#")) continue;
        await links.nth(i).click();
        await settle();
        return;
      }
      throw new Error(
        `unbound: content-view.follow_body_link — the body of the page at ${page.url()} carries no link to follow`,
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
    // Under the title, a list of terms: "Published" over "January 5, 2026", "Last updated"
    // over "January 7, 2026".
    publishedDate: async () => ((await notFoundShown()) ? "" : publicDate("published_date", "Published")),
    updatedDate: async () => ((await notFoundShown()) ? "" : publicDate("updated_date", "Last updated")),
    readableWhenSignedOut: () => mainText(),
    notFoundForUnknownAddress: async () => ((await notFoundShown()) ? mainText() : ""),
  };

  // ---------------------------------------------------------------- managing pages
  //
  // Served to the administrator (the header's "Content" link): /content lists every page in
  // a table captioned "Every page, in order of title" (Title, Public address, Needed by the
  // service, Created, Last updated) under a "Create page" link; /content/create is a form
  // (Title, Address, a formatted Body with an "Insert image" button) with "Cancel" and
  // "Publish page" in a "Page actions" group, "Publish page" confirmed in a "Publish this
  // page?" dialog, after which the browser lands on the new page's /content/<slug>/edit with
  // a "Page published" status. That screen shows the page's facts as a list of terms
  // (Public address, Published, Published by, Last updated, Last updated by), "Edit page" and
  // "Delete page" in "Page actions", and the current wording read-only; "Edit page" opens
  // the form with "Cancel" and "Publish changes" ("Publish your changes?" to confirm, then a
  // "Changes published" status). "Delete page" asks "Delete “<title>”?" and lands on
  // /content with a "Page removed" status. A page the service needs carries a note "The
  // service needs this page", no "Delete page", and an Address field it will not let be
  // changed. A refused address is announced as an alert ("This address is already in use")
  // and under the field; a field the form will not accept is marked invalid, with its reason
  // beside it and in a "Fix N field(s) to publish the page" note. Anybody else, signed out
  // included, is shown "Page not found" at all three addresses.

  // The refusal a person who may not manage pages is shown, or "" when the screen is up.
  async function managementRefused(): Promise<string> {
    await ready();
    return refusalShown();
  }

  // Controls pressed on the form or the screen itself, never their namesakes in a dialog.
  function screenControl(name: RegExp): Locator {
    return seen(page.getByRole("main").getByRole("button", { name }));
  }

  function openDialog(): Locator {
    return seen(page.getByRole("dialog")).filter({ hasText: /\S/ });
  }

  async function pressOnScreen(where: string, name: RegExp): Promise<void> {
    await ready();
    const refused = await refusalShown();
    if (refused) unbound(where, `the management screen did not open at ${page.url()}: ${refused}`);
    const control = screenControl(name).first();
    if (!(await control.count())) unbound(where, `no control named ${name} on ${page.url()}`);
    if (await isDisabled(control)) {
      const said = await linesMatching(/^(fill in|fix \d+ field)/i);
      throw new Error(`${where} — the control named ${name} is disabled on ${page.url()}${said ? `; the page says: ${said}` : ""}`);
    }
    await control.click();
    await settle();
  }

  async function dialogShown(timeout = 5000): Promise<boolean> {
    await openDialog().first().waitFor({ state: "visible", timeout }).catch(() => undefined);
    if (!(await openDialog().count())) return false;
    await page.waitForTimeout(300);
    return true;
  }

  async function pressInDialog(where: string, name: RegExp): Promise<void> {
    if (!(await dialogShown())) unbound(where, `no confirmation is open on ${page.url()}`);
    const control = seen(openDialog().first().getByRole("button", { name })).first();
    if (!(await control.count())) unbound(where, `the confirmation on ${page.url()} offers no control named ${name}`);
    await control.click();
    await openDialog().first().waitFor({ state: "hidden", timeout: 15000 }).catch(() => undefined);
    await settle();
  }

  async function closeDialog(): Promise<void> {
    for (let attempt = 0; attempt < 3 && (await openDialog().count()); attempt++) {
      const cancel = seen(openDialog().first().getByRole("button", { name: /^\s*(cancel|close)\s*$/i })).first();
      if (await cancel.count()) await cancel.click().catch(() => undefined);
      else await page.keyboard.press("Escape").catch(() => undefined);
      await openDialog().first().waitFor({ state: "hidden", timeout: 2000 }).catch(() => undefined);
    }
  }

  // The form's three fields, by the start of their labels ("Title(required)", "Address",
  // "Body (required)"); on a page's screen the read-only "Current wording" boxes carry the
  // same names, so the editable one is taken when there is one.
  const CONTENT_FIELDS: Record<string, { label: RegExp; keys: string[] }> = {
    title: { label: /^\s*title/i, keys: ["title", "pageTitle", "name"] },
    slug: { label: /^\s*address/i, keys: ["slug", "address", "path", "url"] },
    body: { label: /^\s*body/i, keys: ["body", "content", "text", "markdown"] },
  };

  function contentBox(which: string): Locator {
    return seen(page.getByRole("main").getByRole("textbox", { name: CONTENT_FIELDS[which].label }));
  }

  async function editableBox(which: string): Promise<Locator | null> {
    const boxes = contentBox(which);
    const count = await boxes.count();
    for (let i = 0; i < count; i++) if (await boxes.nth(i).isEditable().catch(() => false)) return boxes.nth(i);
    return null;
  }

  // The values an input hands over, by field: a bare value is the field the action names,
  // and a record fills every field it carries. A key matching no field is reported, never
  // dropped.
  function contentValues(where: string, input: unknown, which?: string): Record<string, string> {
    if (input === undefined || input === null) return which ? { [which]: "" } : {};
    if (typeof input !== "object" || Array.isArray(input)) {
      if (!which) unbound(where, `the input ${JSON.stringify(input)} names no field of the form`);
      return { [which]: textOf(input) };
    }
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(record(input))) {
      const slot = Object.keys(CONTENT_FIELDS).find((name) => CONTENT_FIELDS[name].keys.map(squash).includes(squash(key)));
      if (!slot) unbound(where, `the input carries "${key}", and the form has no field for it (only Title, Address and Body)`);
      out[slot] = textOf(value);
    }
    if (which && !(which in out)) {
      const values = Object.values(record(input)).filter((value) => typeof value === "string");
      if (values.length === 1 && !Object.keys(out).length) out[which] = String(values[0]);
    }
    return out;
  }

  async function fillContent(where: string, values: Record<string, string>, startIfNeeded: boolean): Promise<void> {
    if (!Object.keys(values).length) return;
    await ready();
    const refused = await refusalShown();
    if (refused) unbound(where, `the management screen did not open at ${page.url()}: ${refused}`);
    // A page's screen shows its wording read-only until "Edit page" is pressed.
    if (startIfNeeded && !(await editableBox(Object.keys(values)[0])) && (await screenControl(/^\s*edit page\s*$/i).count())) {
      await pressOnScreen(where, /^\s*edit page\s*$/i);
    }
    for (const [which, value] of Object.entries(values)) {
      let box = await editableBox(which);
      if (!box) {
        await contentBox(which).first().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
        box = await editableBox(which);
      }
      if (!box) {
        if (await contentBox(which).count()) {
          const said = await linesMatching(/cannot be changed|cannot change/i);
          throw new Error(`${where} — the ${which === "slug" ? "Address" : which} field is read-only on ${page.url()}${said ? `: ${said}` : ""}`);
        }
        unbound(where, `no ${which === "slug" ? "Address" : which} field on ${page.url()}`);
      }
      await box.fill(value);
    }
    await page.keyboard.press("Tab").catch(() => undefined);
    await settle();
  }

  // Every reason the form gives for not taking what was entered: the alert it raises, each
  // invalid field's own message, and the list of fields still to fix.
  async function contentErrors(pattern?: RegExp): Promise<string> {
    await ready();
    const said: string[] = [];
    const alerts = seen(page.getByRole("main").getByRole("alert"));
    for (let i = 0; i < (await alerts.count()); i++) said.push((await alerts.nth(i).innerText()).trim());
    const HELP = /^(between 1 and|use lowercase letters and numbers, in groups|public address:|formatted text,|changing the address moves|the service needs this page at)/i;
    const boxes = seen(page.getByRole("main").getByRole("textbox"));
    for (let i = 0; i < (await boxes.count()); i++) {
      const box = boxes.nth(i);
      if ((await box.getAttribute("aria-invalid")) !== "true") continue;
      const described = await box.evaluate((element) =>
        (element.getAttribute("aria-describedby") ?? "")
          .split(/\s+/)
          .filter(Boolean)
          .map((id) => (document.getElementById(id) as HTMLElement | null)?.innerText?.trim() ?? ""),
      );
      for (const words of described) if (words && !HELP.test(words)) said.push(words);
    }
    const notes = seen(page.getByRole("main").getByRole("note", { name: /^\s*fix \d+ field/i }));
    for (let i = 0; i < (await notes.count()); i++) said.push(...lined(await notes.nth(i).innerText()));
    return [...new Set(said.filter(Boolean))].filter((words) => !pattern || pattern.test(words)).join("\n");
  }

  // A status the screen announces ("Page published", "Changes published", "Page removed").
  async function contentStatus(pattern: RegExp): Promise<string> {
    await ready();
    const statuses = seen(page.getByRole("main").getByRole("status")).filter({ hasText: pattern });
    await statuses.first().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    return (await statuses.allInnerTexts()).map((words) => words.trim()).join("\n");
  }

  async function screenControlState(name: RegExp): Promise<string> {
    await ready();
    const control = screenControl(name).first();
    if (!(await control.count())) return "absent";
    return (await isDisabled(control)) ? "disabled" : "enabled";
  }

  // The page list's body rows, once drawn; none when the list is refused.
  async function contentRows(): Promise<Locator[]> {
    await ready();
    if (await refusalShown()) return [];
    const table = seen(page.getByRole("main").getByRole("table")).first();
    await seen(table.getByRole("cell")).first().waitFor({ state: "visible", timeout: 10000 }).catch(() => undefined);
    const rows = table.getByRole("row").filter({ has: page.getByRole("cell") });
    const out: Locator[] = [];
    for (let i = 0; i < (await rows.count()); i++) out.push(rows.nth(i));
    return out;
  }

  async function contentColumn(index: number): Promise<string> {
    const lines: string[] = [];
    for (const row of await contentRows()) {
      const cell = row.getByRole("cell").nth(index);
      lines.push((await cell.innerText()).trim());
    }
    return lines.join("\n");
  }

  // The row a test names by title, address or slug; the first row when it names none.
  async function contentRow(where: string, input: unknown): Promise<Locator> {
    const named = typeof input === "object" && input !== null
      ? field(input, "slug", "address", "title", "name", "page")
      : textOf(input);
    const rows = await contentRows();
    if (!rows.length) {
      const refused = await refusalShown();
      unbound(where, refused ? `the page list did not open at ${page.url()}: ${refused}` : `the page list at ${page.url()} has no rows`);
    }
    if (!named) return rows[0];
    const wanted = named.replace(/^\/?content\//, "").replace(/^\//, "");
    for (const row of rows) {
      const cells = (await row.getByRole("cell").allInnerTexts()).map((words) => words.trim());
      if (cells[0] === named || cells[1] === `/content/${wanted}` || cells[1] === named) return row;
    }
    unbound(where, `no page titled or addressed "${named}" in the list at ${page.url()}`);
  }

  // The value the page's screen gives under one of its terms ("Published", "Published by").
  async function contentFact(term: string): Promise<{ words: string; href: string }> {
    await ready();
    const terms = seen(page.getByRole("main").getByRole("term")).filter({ hasText: new RegExp(`^\\s*${term}\\s*$`, "i") });
    if (!(await terms.count())) return { words: "", href: "" };
    const value = terms.first().locator("xpath=following-sibling::*[1]");
    const words = (await value.innerText().catch(() => "")).trim();
    const link = seen(value.getByRole("link")).first();
    const href = (await link.count()) ? ((await link.getAttribute("href")) ?? "") : "";
    return { words, href };
  }

  // A date on the public page, read from under its term; a page without the term is unbound.
  async function publicDate(member: string, term: string): Promise<string> {
    await ready();
    const terms = seen(page.getByRole("main").getByRole("term")).filter({ hasText: new RegExp(`^\\s*${term}\\s*$`, "i") });
    if (!(await terms.count())) {
      unbound(`content-view.${member}`, `the page at ${page.url()} shows no "${term}" term under its title`);
    }
    return (await contentFact(term)).words;
  }

  // A reader on a page's screen: unbound when the screen was refused, its value otherwise.
  async function onPageScreen<T>(where: string, read: () => Promise<T>): Promise<T> {
    const refused = await managementRefused();
    if (refused) unbound(where, `the page's management screen did not open at ${page.url()}: ${refused}`);
    return read();
  }

  // A reader on the list or the create form: what the screen shows, nothing when it is the
  // refusal (a person who may not manage pages is shown none of it).
  async function onScreen(read: () => Promise<string>): Promise<string> {
    if (await managementRefused()) return "";
    return read();
  }

  // The terms page's management screen, signed in as the administrator, carries a region
  // headed "Notify vendors of updated terms" below the current wording: a button of that
  // name opens an unnamed dialog ("Notify vendors that the terms have changed?") with
  // "Cancel" and "Notify vendors". Once confirmed the region announces a status "Vendors
  // have been notified …", or an alert "Vendors have not been notified …" when the service
  // refuses. Anyone else is shown "Page not found" there, with no such control.
  const TERMS_ROUTE = "/content/terms-and-conditions/edit";
  const announcement = (): Locator =>
    seen(regionNamed(page.getByRole("main"), /^\s*notify vendors of updated terms\s*$/i));
  const NOTIFY_CONTROL = /^\s*notify vendors of updated terms\s*$/i;

  async function announcementSays(role: "status" | "alert", pattern: RegExp): Promise<string> {
    await ready();
    const said = seen(announcement().getByRole(role)).filter({ hasText: pattern });
    await said.first().waitFor({ state: "visible", timeout: 10000 }).catch(() => undefined);
    return (await said.allInnerTexts()).map((words) => words.trim()).join("\n");
  }

  const termsBroadcast: S.NotificationTermsBroadcastPage = {
    open: () => go(TERMS_ROUTE),
    notifyVendorsOfUpdatedTerms: async () => {
      const where = "notification-terms-broadcast.notify_vendors_of_updated_terms";
      await ready();
      const refused = await refusalShown();
      if (refused) unbound(where, `the terms page's management screen did not open at ${page.url()}: ${refused}`);
      const control = seen(announcement().getByRole("button", { name: NOTIFY_CONTROL })).first();
      if (!(await control.count())) unbound(where, `no control named ${NOTIFY_CONTROL} on ${page.url()}`);
      if (await isDisabled(control)) {
        throw new Error(`${where} — the control named ${NOTIFY_CONTROL} is disabled on ${page.url()}`);
      }
      await control.click();
      await dialogShown();
    },
    confirmNotifyVendors: () =>
      pressInDialog("notification-terms-broadcast.confirm_notify_vendors", /^\s*notify vendors\s*$/i),
    cancelNotifyVendors: () =>
      pressInDialog("notification-terms-broadcast.cancel_notify_vendors", /^\s*cancel\s*$/i),
    // The control's own words where it is offered; nothing where it is not, the refusal a
    // non-administrator is shown included.
    notifyVendorsControl: async () => {
      await ready();
      const control = seen(page.getByRole("main").getByRole("button", { name: NOTIFY_CONTROL })).first();
      return (await control.count()) ? (await control.innerText()).trim() : "";
    },
    notifyVendorsConfirmation: async () => {
      if (!(await dialogShown())) return "";
      return (await openDialog().first().innerText()).trim();
    },
    notifyVendorsSuccess: () => announcementSays("status", /have been notified/i),
    notifyVendorsFailure: () => announcementSays("alert", /\S/),
  };

  const contentList: S.ContentListPage = {
    open: () => go("/content"),
    openPageForEditing: async (input) => {
      const where = "content-list.open_page_for_editing";
      const row = await contentRow(where, input);
      await row.getByRole("cell").nth(0).getByRole("link").first().click();
      await page.waitForURL((url) => /\/content\/[^/]+\/edit$/.test(url.pathname), { timeout: 15000 }).catch(() => undefined);
      await ready();
    },
    openPublicPage: async (input) => {
      const where = "content-list.open_public_page";
      const row = await contentRow(where, input);
      const href = await row.getByRole("cell").nth(1).getByRole("link").first().getAttribute("href");
      if (!href) unbound(where, `the row on ${page.url()} carries no public address link`);
      await visit(href);
    },
    createPage: async () => {
      const where = "content-list.create_page";
      await ready();
      const refused = await refusalShown();
      if (refused) unbound(where, `the page list did not open at ${page.url()}: ${refused}`);
      const link = seen(page.getByRole("main").getByRole("link", { name: /^\s*create page\s*$/i })).first();
      if (!(await link.count())) unbound(where, `no "Create page" link on ${page.url()}`);
      await link.click();
      await page.waitForURL((url) => url.pathname === "/content/create", { timeout: 15000 }).catch(() => undefined);
      await ready();
    },
    pageTitle: () => contentColumn(0),
    pagePublicAddress: () => contentColumn(1),
    // "<public address>: Yes" for a page the service needs, ": No" for an ordinary one.
    pageIsFixed: async () => {
      const lines: string[] = [];
      for (const row of await contentRows()) {
        const cells = (await row.getByRole("cell").allInnerTexts()).map((words) => words.trim());
        lines.push(`${cells[1]}: ${cells[2]}`);
      }
      return lines.join("\n");
    },
    pageCreatedDate: () => contentColumn(3),
    pageUpdatedDate: () => contentColumn(4),
    orderedByTitle: () => contentColumn(0),
    refusedForNonAdministrator: () => refusalShown(),
    pageCount: async () => {
      if (await managementRefused()) return "";
      return String((await contentRows()).length);
    },
  };

  // A person who may not manage pages is shown "Page not found" at /content/create, with no
  // form to type into; that refusal is what the test reads next, so the form's actions do
  // nothing there rather than report the form missing.
  const contentCreate: S.ContentCreatePage = {
    open: () => go("/content/create"),
    enterTitle: async (input) => {
      if (await managementRefused()) return;
      await fillContent("content-create.enter_title", contentValues("content-create.enter_title", input, "title"), false);
    },
    enterSlug: async (input) => {
      if (await managementRefused()) return;
      await fillContent("content-create.enter_slug", contentValues("content-create.enter_slug", input, "slug"), false);
    },
    enterBody: async (input) => {
      if (await managementRefused()) return;
      await fillContent("content-create.enter_body", contentValues("content-create.enter_body", input, "body"), false);
    },
    uploadBodyImage: (input) => insertBodyImage("content-create.upload_body_image", input),
    publishPage: async (input) => {
      const where = "content-create.publish_page";
      if (await managementRefused()) return;
      await fillContent(where, contentValues(where, input), false);
      await pressOnScreen(where, /^\s*publish page\s*$/i);
      if (!(await dialogShown())) {
        throw new Error(`${where} — pressing "Publish page" raised no "Publish this page?" confirmation on ${page.url()}`);
      }
    },
    // Accepted, the browser lands on the new page's screen; refused, the form stays with an
    // alert. Whichever comes first ends the wait.
    confirmPublish: async () => {
      if (await managementRefused()) return;
      await pressInDialog("content-create.confirm_publish", /^\s*publish page\s*$/i);
      await Promise.race([
        page.waitForURL((url) => url.pathname !== "/content/create", { timeout: 15000 }),
        seen(page.getByRole("main").getByRole("alert")).first().waitFor({ state: "visible", timeout: 15000 }),
      ]).catch(() => undefined);
      await ready();
    },
    cancel: async () => {
      if (await managementRefused()) return;
      await closeDialog();
      await pressOnScreen("content-create.cancel", /^\s*cancel\s*$/i);
    },
    fieldError: () => onScreen(() => contentErrors()),
    // "Use lowercase letters and numbers, in groups joined by single hyphens, like about-us.
    // No capital letters, spaces or underscores, and no hyphen at the start or end."
    slugRuleHelp: () => onScreen(() => linesMatching(/^use lowercase letters and numbers, in groups/i)),
    // "Public address: http://…/content/<slug>", or "shown once the address is valid."
    resultingPublicAddress: () =>
      onScreen(async () => (await linesMatching(/^public address:/i)).replace(/^public address:\s*/i, "")),
    publishDisabledUntilValid: () => onScreen(() => screenControlState(/^\s*publish page\s*$/i)),
    publishConfirmation: async () => ((await dialogShown(2000)) ? (await openDialog().first().innerText()).trim() : ""),
    publishedSuccess: () => onScreen(() => contentStatus(/page published/i)),
    duplicateSlugError: () => onScreen(() => contentErrors(/already (in use|uses)/i)),
    refusedForNonAdministrator: () => refusalShown(),
  };

  // What the editor's status line said while the last image was being put in, every wording
  // in order; read by file-embedded-image.uploading_indicator.
  let bodyImageNotices: string[] = [];

  // "Insert image" over the body opens the browser's file chooser (JPEG or PNG, up to 10 MB);
  // the image is stored at once and written into the body at the cursor as
  // "![Describe this image](@file/<id>)", announced in the status beside it ("<name> was
  // inserted at the cursor. …"), or refused in an alert ("<name> could not be inserted / It
  // is not a JPEG or PNG image. … Nothing was added to the body.") with the body untouched.
  //
  // Walked as the administrator on /content/about-us/edit after "Edit page" (and on
  // /content/create): pressing "Insert image" — by mouse or by Enter — opened no chooser on
  // the running build, while "Bold" beside it did work on the body. That is the control
  // failing a person, so it fails the action plainly rather than reporting it unbound.
  async function insertBodyImage(where: string, input: unknown): Promise<void> {
    await ready();
    const refused = await refusalShown();
    if (refused) unbound(where, `the management screen did not open at ${page.url()}: ${refused}`);
    if (!(await editableBox("body")) && (await screenControl(/^\s*edit page\s*$/i).count())) {
      await pressOnScreen(where, /^\s*edit page\s*$/i);
    }
    const body = await editableBox("body");
    if (!body) unbound(where, `no editable Body on ${page.url()}`);
    const name = field(input, "file", "fileName", "file_name", "name", "image") || (typeof input === "string" ? input : "") || "body-image.png";
    const content = given(input, ["content", "contents"]);
    const bytes = Number(field(input, "bytes", "size", "sizeBytes"));
    const path = uploadFile({
      name,
      ...(typeof content === "string" || content instanceof Uint8Array ? { content } : {}),
      ...(Number.isFinite(bytes) && bytes > 0 ? { bytes } : {}),
    });
    const before = await body.inputValue();
    await body.click();
    const chooser = page.waitForEvent("filechooser", { timeout: 10000 }).catch(() => null);
    await pressOnScreen(where, /^\s*insert image\s*$/i);
    const offered = await chooser;
    if (!offered) throw new Error(`${where} — "Insert image" on ${page.url()} opened no file chooser`);
    // Every wording the status line takes from here on, however briefly it is shown.
    bodyImageNotices = [];
    await page
      .getByRole("main")
      .getByRole("status")
      .evaluateAll((lines) => {
        const heard: string[] = [];
        (window as unknown as { __bodyImageNotices: string[] }).__bodyImageNotices = heard;
        for (const line of lines) {
          new MutationObserver(() => {
            const words = (line as HTMLElement).innerText.trim();
            if (words && heard[heard.length - 1] !== words) heard.push(words);
          }).observe(line, { subtree: true, childList: true, characterData: true });
        }
      })
      .catch(() => undefined);
    await offered.setFiles(path);
    for (let waited = 0; waited < 15000; waited += 250) {
      if ((await body.inputValue().catch(() => before)) !== before) break;
      if (await seen(page.getByRole("main").getByRole("alert")).filter({ hasText: /could not be inserted/i }).count()) break;
      const said = (await seen(page.getByRole("main").getByRole("status")).allInnerTexts()).join("").trim();
      if (said && !/uploading|storing/i.test(said)) break;
      await page.waitForTimeout(250);
    }
    await settle();
    bodyImageNotices = await page
      .evaluate(() => (window as unknown as { __bodyImageNotices?: string[] }).__bodyImageNotices ?? [])
      .catch(() => []);
  }

  const contentEdit: S.ContentEditPage = {
    open: (params) => go("/content/:slug/edit", params as unknown as Record<string, string>),
    startEditing: () => pressOnScreen("content-edit.start_editing", /^\s*edit page\s*$/i),
    editTitle: (input) => fillContent("content-edit.edit_title", contentValues("content-edit.edit_title", input, "title"), true),
    editSlug: (input) => fillContent("content-edit.edit_slug", contentValues("content-edit.edit_slug", input, "slug"), true),
    editBody: (input) => fillContent("content-edit.edit_body", contentValues("content-edit.edit_body", input, "body"), true),
    uploadBodyImage: (input) => insertBodyImage("content-edit.upload_body_image", input),
    publishChanges: async (input) => {
      const where = "content-edit.publish_changes";
      await fillContent(where, contentValues(where, input), true);
      await pressOnScreen(where, /^\s*publish changes\s*$/i);
      if (!(await dialogShown())) {
        throw new Error(`${where} — pressing "Publish changes" raised no "Publish your changes?" confirmation on ${page.url()}`);
      }
    },
    confirmPublishChanges: async () => {
      await pressInDialog("content-edit.confirm_publish_changes", /^\s*publish changes\s*$/i);
      await Promise.race([
        seen(page.getByRole("main").getByRole("status")).filter({ hasText: /\S/ }).first().waitFor({ state: "visible", timeout: 15000 }),
        seen(page.getByRole("main").getByRole("alert")).first().waitFor({ state: "visible", timeout: 15000 }),
      ]).catch(() => undefined);
      await ready();
    },
    cancelEditing: async () => {
      await closeDialog();
      await pressOnScreen("content-edit.cancel_editing", /^\s*cancel\s*$/i);
    },
    // Withheld from a page the service needs; that is read by delete_withheld_for_fixed_page.
    deletePage: async () => {
      const where = "content-edit.delete_page";
      await ready();
      if (!(await refusalShown()) && !(await screenControl(/^\s*delete page\s*$/i).count())) {
        const note = await linesMatching(/cannot change its address or delete it/i);
        throw new Error(`${where} — no "Delete page" on ${page.url()}${note ? `: ${note}` : ""}`);
      }
      await pressOnScreen(where, /^\s*delete page\s*$/i);
      if (!(await dialogShown())) throw new Error(`${where} — pressing "Delete page" raised no confirmation on ${page.url()}`);
    },
    confirmDeletePage: async () => {
      await pressInDialog("content-edit.confirm_delete_page", /^\s*delete page\s*$/i);
      await Promise.race([
        page.waitForURL((url) => url.pathname === "/content", { timeout: 15000 }),
        seen(page.getByRole("main").getByRole("alert")).first().waitFor({ state: "visible", timeout: 15000 }),
      ]).catch(() => undefined);
      await ready();
    },
    // Under "Public address" on the screen, or "Public address: http://…/content/<slug>"
    // while the form is open.
    pageAddress: () =>
      onPageScreen("content-edit.page_address", async () => {
        const fact = (await contentFact("Public address")).words;
        if (fact) return fact;
        const stated = /(\/content\/[^\s/]+)\s*$/.exec(await linesMatching(/^public address:/i));
        return stated ? stated[1] : (/^(\/content\/[^/]+)\/edit$/.exec(new URL(page.url()).pathname)?.[1] ?? "");
      }),
    publishedDate: () => onPageScreen("content-edit.published_date", async () => (await contentFact("Published")).words),
    updatedDate: () => onPageScreen("content-edit.updated_date", async () => (await contentFact("Last updated")).words),
    // A page no person wrote names "System", with no link.
    publishedBy: () => onPageScreen("content-edit.published_by", async () => (await contentFact("Published by")).words),
    updatedBy: () => onPageScreen("content-edit.updated_by", async () => (await contentFact("Last updated by")).words),
    publishedByLink: () =>
      onPageScreen("content-edit.published_by_link", async () => {
        const href = (await contentFact("Published by")).href;
        return href ? new URL(href, baseURL).pathname : "";
      }),
    updatedByLink: () =>
      onPageScreen("content-edit.updated_by_link", async () => {
        const href = (await contentFact("Last updated by")).href;
        return href ? new URL(href, baseURL).pathname : "";
      }),
    fixedPageWarning: () =>
      onPageScreen("content-edit.fixed_page_warning", async () => {
        const note = seen(page.getByRole("main").getByRole("note", { name: /service needs this page/i }));
        return (await note.count()) ? (await note.first().innerText()).trim() : "";
      }),
    // "The service needs this page at this address, so the address cannot be changed." on
    // the form, "… you cannot change its address or delete it." on the screen.
    slugLockedForFixedPage: () =>
      onPageScreen("content-edit.slug_locked_for_fixed_page", () =>
        linesMatching(/address cannot be changed|cannot change its address/i),
      ),
    deleteWithheldForFixedPage: () =>
      onPageScreen("content-edit.delete_withheld_for_fixed_page", () => screenControlState(/^\s*delete page\s*$/i)),
    fieldError: () => onPageScreen("content-edit.field_error", () => contentErrors()),
    duplicateSlugError: () => onPageScreen("content-edit.duplicate_slug_error", () => contentErrors(/already (in use|uses)/i)),
    changesPublishedSuccess: () =>
      onPageScreen("content-edit.changes_published_success", () => contentStatus(/changes published/i)),
    // Announced on the page list, where the browser lands once the page is gone.
    deletedSuccess: () => onPageScreen("content-edit.deleted_success", () => contentStatus(/page removed|deleted/i)),
    refusedForNonAdministrator: () => refusalShown(),
    bodyBeingEdited: () =>
      onPageScreen("content-edit.body_being_edited", async () => {
        const box = (await editableBox("body")) ?? contentBox("body").first();
        return (await box.count()) ? (await box.inputValue()).trim() : "";
      }),
    // The screen offers no earlier versions ("The wording it replaces is kept on record, but
    // it cannot be viewed or restored from the service."), so this reads empty.
    versionHistory: () =>
      onPageScreen("content-edit.version_history", async () => {
        const region = seen(regionNamed(page.getByRole("main"), /history|versions/i));
        return (await region.count()) ? (await region.first().innerText()).trim() : "";
      }),
  };

  // ---------------------------------------------------------------- an image in the body

  // The image control of the formatted-text editor, bound where the contract places it: the
  // administrator's /content/<slug>/edit, after "Edit page" (walked on the seeded about-us
  // page). The toolbar "Formatting for Body" carries "Insert image", described by "Insert
  // image takes a JPEG or PNG image, up to 10 MB. An inserted image is stored as soon as you
  // choose it and anyone can see it." An inserted image goes into the body as
  // "![Describe this image](@file/<id>)", and the published /content/<slug> draws it as an
  // image whose address is /api/files/<id>?type=blob (the image itself; /api/files/<id>
  // alone answers the file's record, not the image).

  let embeddedSlug = "";

  function slugInView(): string {
    const path = new URL(page.url()).pathname;
    const found = /^\/content\/([^/]+)(?:\/edit)?\/?$/.exec(path);
    return found && found[1] !== "create" ? decodeURIComponent(found[1]) : embeddedSlug;
  }

  // The body as the screen holds it: the form's box while editing, the "Current wording"
  // box otherwise.
  async function bodyNow(): Promise<string> {
    const box = (await editableBox("body")) ?? contentBox("body").first();
    return (await box.count()) ? box.inputValue() : "";
  }

  // The images written into a body, one per line, as the body carries them.
  const imagesInBody = (body: string): string[] =>
    [...body.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)].map((found) => found[0]);

  const servedAt = (reference: string): string => {
    const id = /^@file\/([^)\s]+)$/.exec(reference)?.[1];
    return id ? `/api/files/${id}?type=blob` : reference;
  };

  const fileEmbeddedImage: S.FileEmbeddedImagePage = {
    open: async (params) => {
      if (params?.slug) embeddedSlug = params.slug;
      await go("/content/:slug/edit", params as unknown as Record<string, string>);
    },
    uploadBodyImage: (input) => insertBodyImage("file-embedded-image.upload_body_image", input),
    // The address the last image in the body is kept at; nothing when the body has none. The
    // body's reference is read again for a few seconds, since it is written once the image is
    // stored.
    imageAddress: () =>
      onPageScreen("file-embedded-image.image_address", async () => {
        for (let waited = 0; ; waited += 250) {
          const last = imagesInBody(await bodyNow()).pop();
          if (last) return servedAt(/\(([^)\s]+)\)$/.exec(last)?.[1] ?? "");
          if (waited >= 5000) return "";
          await page.waitForTimeout(250);
        }
      }),
    // Only the image references in the body ("![Describe this image](@file/<id>)"), never the
    // rest of the wording: empty when no image was put in.
    imageInsertedIntoText: () =>
      onPageScreen("file-embedded-image.image_inserted_into_text", async () => {
        for (let waited = 0; ; waited += 250) {
          const found = imagesInBody(await bodyNow());
          if (found.length || waited >= 5000) return found.join("\n");
          await page.waitForTimeout(250);
        }
      }),
    // The rule the editor states under its toolbar, which "Insert image" is described by.
    onlyJpegAndPngOffered: () =>
      onPageScreen("file-embedded-image.only_jpeg_and_png_offered", async () => {
        if (!(await editableBox("body")) && (await screenControl(/^\s*edit page\s*$/i).count())) {
          await pressOnScreen("file-embedded-image.only_jpeg_and_png_offered", /^\s*edit page\s*$/i);
        }
        if (!(await screenControl(/^\s*insert image\s*$/i).count())) {
          unbound(
            "file-embedded-image.only_jpeg_and_png_offered",
            `no "Insert image" control over the body on ${page.url()}, after "Edit page" where offered`,
          );
        }
        return linesMatching(/^insert image takes /i);
      }),
    // Every wording the status line took while the last image was being stored that speaks
    // of it being under way; the status as it stands when no image was put in here.
    uploadingIndicator: () =>
      onPageScreen("file-embedded-image.uploading_indicator", async () => {
        const heard = bodyImageNotices.length
          ? bodyImageNotices
          : await seen(page.getByRole("main").getByRole("status")).allInnerTexts();
        return heard
          .map((words) => words.trim())
          .filter((words) => /uploading|storing|inserting|in progress/i.test(words))
          .join("\n");
      }),
    // Read on the published /content/<slug>: the addresses of the images its text draws from
    // the service's stored files, one per line; empty when it draws none.
    imageRenderedInPublishedText: async () => {
      const where = "file-embedded-image.image_rendered_in_published_text";
      const slug = slugInView();
      if (!slug) unbound(where, `no page address is known on ${page.url()}, and the page was never opened with one`);
      const published = address("/content/:slug", { slug });
      if (new URL(page.url()).pathname !== new URL(published).pathname) {
        await page.goto(published, { waitUntil: "domcontentloaded" });
      }
      await ready();
      const refused = await refusalShown();
      if (refused) unbound(where, `the published page did not open at ${page.url()}: ${refused}`);
      let sources: string[] = [];
      for (let waited = 0; waited <= 5000; waited += 250) {
        sources = (
          await seen(page.getByRole("main").getByRole("img")).evaluateAll((images) =>
            images.map((image) => image.getAttribute("src") ?? ""),
          )
        ).filter((source) => source.includes("/api/files/"));
        if (sources.length) break;
        await page.waitForTimeout(250);
      }
      return sources.join("\n");
    },
    // The body as it stands after a refused image, for the test to compare with what it was.
    uploadFailureLeavesTextUnchanged: () =>
      onPageScreen("file-embedded-image.upload_failure_leaves_text_unchanged", async () => (await bodyNow()).trim()),
  };

  // ================================================================ the rest of the surface

  function unbound(where: string, why: string): never {
    throw new Error(`unbound: ${where} — ${why}`);
  }

  // An action the page refused this person: recorded here and on the run's output, not
  // thrown, so the test's own follow-up reading of the outcome decides.
  const refusalLog: string[] = [];
  function noteRefusal(what: string): void {
    refusalLog.push(what);
    console.info(`refused: ${what}`);
  }

  // Members of a page that remains unreachable, each refusing with the same reason.
  function unboundMembers(pageId: string, why: string, names: readonly string[]): Record<string, unknown> {
    const built: Record<string, unknown> = {};
    for (const name of names) {
      built[camel(name)] = async (): Promise<never> => unbound(`${pageId}.${name}`, why);
    }
    return built;
  }

  const behindSignIn = (screen: string, signedOut: string): string =>
    `${screen} is offered only to a signed-in person, and ${NOBODY_SIGNS_IN}; opened signed out with the seeded record's identifier it ${signedOut}`;

  // What this target shows somebody who may not have the screen they asked for: its "Not
  // Found" screen, the sign-in screen it redirects to, or (for an address the service
  // answers itself) its plain "You do not have permission" answer. Empty when the screen
  // is shown.
  async function refusalShown(): Promise<string> {
    await ready();
    const at = new URL(page.url());
    if (at.pathname === "/sign-in") return `sent to the sign-in screen (${at.pathname}${at.search})`;
    if (!(await page.getByRole("main").count())) {
      const said = await bodyText().catch(() => "");
      return /do not have permission|not authori[sz]ed/i.test(said) ? said : "";
    }
    // "Page not found" over "Back to home" now; "Not Found" over "Go Home" once.
    if (!(await seen(page.getByRole("heading", { name: /^\s*(page )?not found\s*$/i })).count())) return "";
    const lines = await textLines();
    const from = Math.max(0, lines.findIndex((line) => /^(page )?not found$/i.test(line)));
    const to = lines.findIndex((line, i) => i > from && /^(go home|back to home)$/i.test(line));
    return lines.slice(from, to > from ? to : from + 2).join("\n");
  }

  // Why the browser is not on the screen it was sent to: a refusal (above), or a hand-off to
  // another origin (the identity provider). Empty when it is on a screen of this target.
  async function whyNotHere(): Promise<string> {
    const refused = await refusalShown();
    if (refused) return refused;
    if (originOf(page.url()) !== originOf(baseURL)) return `handed off to ${originOf(page.url())}`;
    return "";
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

  // Every notice the opportunity page raises outside its own sections, one per line in the
  // order shown: its alerts, statuses and pop-ups, leaving out those inside a section's
  // region ("Scope", "Addenda" and the rest) and the "Loading opportunity…" status it shows
  // while it fetches. Read on the seeded closed, awarded and open Sprint With Us
  // opportunities signed out, where the running build raises none, so each reads empty.
  async function pageNotices(where: string): Promise<string> {
    await opportunityLines(where);
    await seen(page.getByRole("progressbar"))
      .first()
      .waitFor({ state: "hidden", timeout: 10000 })
      .catch(() => undefined);
    const noticeIn = (scope: Page | Locator): Locator =>
      seen(
        scope
          .getByRole("alert")
          .or(scope.getByRole("status"))
          .or(scope.getByRole("alertdialog"))
          .or(scope.getByRole("dialog")),
      );
    const textsOf = async (notices: Locator): Promise<string[]> => {
      const texts: string[] = [];
      for (let i = 0; i < (await notices.count()); i++) {
        const notice = notices.nth(i);
        if (await seen(notice.getByRole("progressbar")).count()) continue;
        const text = lined(await notice.innerText().catch(() => "")).join("\n");
        if (text) texts.push(text);
      }
      return texts;
    };
    const inSections = await textsOf(noticeIn(page.getByRole("main").getByRole("region")));
    const lines: string[] = [];
    for (const text of await textsOf(noticeIn(page))) {
      const at = inSections.indexOf(text);
      if (at >= 0) {
        inSections.splice(at, 1);
        continue;
      }
      // A notice nested in another one is read once, with its container.
      if (lines.some((line) => line.includes(text))) continue;
      lines.push(text);
    }
    return lines.join("\n");
  }

  const CONTACT_DETAIL = /@|\+?\d[\d\s().-]{8,}\d|\b(contact|e-?mail|phone)\b/i;
  const SCORE_DETAIL = /\bscore\b|\d+(\.\d+)?\s*%|\bpoints?\b/i;

  // A section of the page. The running build draws each as a region under its own level-2
  // heading ("Description", "Phases", "Scope", "Addenda"), read as the region's text below
  // its heading; an older layout put them behind a row of tabs, read from the tab's heading
  // to the "Got Questions?" box that closes every section. `headings` names the region's
  // heading where it differs from the tab's ("Scope" for "Scope & Contract").
  async function sectionBehind(where: string, tab: string, headings: string[] = []): Promise<string> {
    await opportunityLines(where);
    for (const heading of [tab, ...headings]) {
      const region = seen(
        page.getByRole("main").getByRole("region").filter({ has: page.getByRole("heading", { name: heading, exact: true }) }),
      ).last();
      if (!(await region.count())) continue;
      const lines = lined(await region.innerText());
      return (lines[0] === heading ? lines.slice(1) : lines).join("\n");
    }
    const control = seen(page.getByText(tab, { exact: true })).first();
    if (!(await control.count())) {
      unbound(where, `the opportunity page at ${page.url()} offers no "${tab}" tab and no section headed ${[tab, ...headings].map((one) => `"${one}"`).join(" or ")}`);
    }
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

  // A section of the Details tab below its "Got Questions?" box ("Phases of Work", "Service
  // Areas"), from its heading to the one after it. The Details tab is chosen first if an
  // earlier reader left another tab open.
  async function detailsSection(where: string, start: RegExp, end: RegExp): Promise<string> {
    let lines = await opportunityLines(where);
    if (!lines.some((line) => start.test(line))) {
      const details = seen(page.getByText("Details", { exact: true })).first();
      if (await details.count()) {
        await details.click();
        await settle();
        lines = await opportunityLines(where);
      }
    }
    const from = lines.findIndex((line) => start.test(line));
    if (from < 0) return "";
    const to = lines.findIndex((line, i) => i > from && end.test(line));
    return lines.slice(from + 1, to > from ? to : undefined).join("\n");
  }

  const PROGRAM_NAME: Record<string, string> = {
    "code-with-us": "Code With Us",
    "sprint-with-us": "Sprint With Us",
    "team-with-us": "Team With Us",
  };

  // "Watch this opportunity", a checkbox each program's public page offers a signed-in
  // person; pressing it saves at once. An input that says which way it should end up is
  // honoured, and a box already that way is left alone.
  async function toggleWatchBox(where: string, walked: string, input: unknown): Promise<void> {
    const box = seen(page.getByRole("main").getByRole("checkbox", { name: /^\s*watch( this opportunity)?\s*$/i })).first();
    await box.waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    if (!(await box.count())) {
      unbound(where, `${walked}: the page offers a signed-in person a "Watch this opportunity" box, and on ${page.url()} as ${actingId()} there is none; it offers ${await offered()}`);
    }
    if (await isDisabled(box)) throw new Error(`${where} — the "Watch this opportunity" box is disabled on ${page.url()}`);
    const was = await box.isChecked();
    const wanted = boxWanted(input, ["watch", "watching", "watched", "subscribed"]);
    if (wanted !== undefined && wanted === was) return;
    await box.click();
    await settle();
    await page
      .waitForFunction(
        (before) => {
          const found = Array.from(document.querySelectorAll("main input[type=checkbox]")) as HTMLInputElement[];
          return found.some((one) => one.checked !== before);
        },
        was,
        { timeout: 5000 },
      )
      .catch(() => undefined);
  }

  // "Start a proposal", a link to .../proposals/create, offered to a signed-in vendor while
  // the opportunity takes proposals. A vendor who already holds a proposal on it is offered
  // "View your proposal" in its place (the service keeps one per vendor), which is its one
  // way on from here to that proposal; the old target's binding does the same.
  async function startProposalLink(where: string, walked: string): Promise<void> {
    const control =
      (await findControl(page, /^\s*(start|create|submit|write)( a)? proposal\s*$/i)) ??
      (await findControl(page, /^\s*view (your|my)? ?proposal\s*$/i));
    if (!control) unbound(where, `${walked}: signed in as a vendor on an opportunity still taking proposals the page offers "Start a proposal" (or "View your proposal" once the vendor holds one), and on ${page.url()} as ${actingId()} it offers neither; it offers ${await offered()}`);
    if (await isDisabled(control)) throw new Error(`${where} — "${(await control.innerText().catch(() => "")).trim()}" is disabled on ${page.url()}`);
    await control.click();
    await settle();
    await ready();
  }

  // Read on the seeded published, awarded and closed opportunities of each program. The
  // header reads "Published <date> | Updated <date>" over the title, the program's name
  // over its status badge, and "Closes <date> at <time>" (or "Closed …"); an award is an
  // alert above it all, "This opportunity was awarded to <name>.". The public page names
  // nobody who made or changed the opportunity, for anybody who can open it, so those read
  // as nothing on a page that did open.
  function opportunityView<T>(
    pageId: string,
    route: string,
    program: string,
    added: Record<string, () => Promise<string>>,
  ): T {
    const where = (member: string): string => `${pageId}.${member}`;
    // Walked on the current build signed in as the organization-owner vendor: the seeded open
    // Sprint With Us opportunity draws "Watch this opportunity" and "Start a proposal" as the
    // Code With Us page does; a closed one (Sprint With Us or Team With Us) the box alone.
    const walked = `walked signed in as the organization-owner vendor on the seeded open Sprint With Us opportunity and on closed Sprint With Us and Team With Us ones (the seed holds no Team With Us opportunity still taking proposals)`;
    const built: Record<string, unknown> = {
      open: (params?: Record<string, string>) => go(route, params),
      toggleWatch: async (input: unknown) => {
        await opportunityLines(where("toggle_watch"));
        await toggleWatchBox(where("toggle_watch"), walked, input);
      },
      startProposal: async () => {
        await opportunityLines(where("start_proposal"));
        await startProposalLink(where("start_proposal"), walked);
      },
      opportunityIdentifier: async () => {
        await opportunityLines(where("opportunity_identifier"));
        const segment = new RegExp(`^/opportunities/${program}/([^/?#]+)`).exec(new URL(page.url()).pathname)?.[1] ?? "";
        return segment === "create" ? "" : segment;
      },
      // The value given under the page's "Status" term ("Status" over "Published"); the
      // program's name over its status badge, as an older layout drew it, otherwise.
      status: async () => {
        const lines = await opportunityLines(where("status"));
        const term = await definitionOf(/^status$/i);
        if (term) return term;
        const at = lines.indexOf(PROGRAM_NAME[program]);
        return at >= 0 && at + 1 < lines.length ? lines[at + 1] : "";
      },
      publishedDate: async () => {
        await opportunityLines(where("published_date"));
        return datedLine("Published");
      },
      createdByName: async () => {
        await opportunityLines(where("created_by_name"));
        return valueAfter(["Created By"]);
      },
      lastChangedByName: async () => {
        await opportunityLines(where("last_changed_by_name"));
        return valueAfter(["Updated By", "Last Changed By"]);
      },
      proposalDeadline: async () =>
        (await opportunityLines(where("proposal_deadline"))).filter((line) => /^Close[sd]\b/.test(line)).join("\n"),
      // "There are currently no addenda for this opportunity." is an empty list.
      addenda: async () => {
        const section = await sectionBehind(where("addenda"), "Addenda");
        return /^(there are currently no addenda|no addenda have been added)/i.test(section) ? "" : section;
      },
      successfulProponent: async () => {
        const banner = (await opportunityLines(where("successful_proponent"))).find((line) => /awarded to\s+\S/i.test(line));
        return banner ? (/awarded to\s+(.+)$/i.exec(banner)?.[1] ?? "").replace(/\.$/, "").trim() : "";
      },
      ...added,
    };
    return built as unknown as T;
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
  // target answers every one of them with its "Page not found" screen, signed out and, on the
  // current build, signed in as the administrator and as the panel's public sector employee.
  function evaluationScreen<T>(pageId: string, route: string, earlier: readonly string[]): T {
    return {
      ...absent<Record<string, unknown>>(
        pageId,
        route,
        `${behindSession(route)}; signed in as the public sector employee who sits on the seeded panels, with the seeded Sprint With Us opportunity at "Team questions: individual evaluation" (opportunities.swuEvaluationAlreadyBegun) and the Team With Us one (opportunities.twuEvaluationAlreadyBegun) and their seeded proposals, this address and the proposal's own page answer "Page not found", and those opportunities' management screens offer only Summary, Opportunity, Addenda, History, Proposals (proponents in plain text, no link onward) and Evaluation panel — nothing that opens a proponent's evaluation`,
        earlier,
      ),
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
  // catcher under /hold (observables.yaml delivery_delay), and nowhere else: the contract
  // gives no other address for it. On the sandbox this target was walked against there is
  // no such proxy: every /hold address on the catcher answers its plain "404 page not
  // found", and nothing answers on the proxy's usual control port (8474) or the ports
  // around the catcher, so these members report unbound there until the sandbox serves it.
  // Where it is served, GET .../toxics answers [] while replies pass at full speed; a delay
  // of three seconds on every reply is added as the toxic "hold" and removed by name;
  // adding one already there, or removing one already gone, leaves the proxy as asked, so
  // those answers count as done too.
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
    // On a catcher started without the proxy beside it, every /hold address gets the same
    // plain "404 page not found" as any address the catcher does not serve.
    if (got.status === 404 && method !== "DELETE") {
      unbound(
        where,
        `the mail catcher answered 404 for ${method} ${TOXICS}, the same not-found it gives any address it does not ` +
          `serve: the delay proxy's control API (observables.yaml delivery_delay) is not mounted beside this catcher, ` +
          `and no such proxy was found anywhere else on the sandbox (a sandbox gap, not the target's)`,
      );
    }
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
  // carries whoever is signed in. What the service answered a signed-out request with was
  // read for every address below; what it answers somebody signed in has not been read (the
  // revision that walked the screens signed in did not re-send these requests), so those
  // request bodies follow spec/contract/openapi.yaml and the forms the contract describes.

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
    // A Sprint With Us phase is named as the phases are named everywhere else ("Inception"),
    // with the part of it a message concerns after it ("Inception members: ...").
    inceptionphase: "Inception",
    prototypephase: "Prototype",
    implementationphase: "Implementation",
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
      // This target names a phase by its request key inside the message itself
      // ("inceptionPhase: This opportunity does not require this phase."); the message is
      // reported against the phase's name instead.
      const phase = /^\s*(inceptionPhase|prototypePhase|implementationPhase)(?:\.([A-Za-z0-9#]+))?\s*:\s*([\s\S]*)$/.exec(body);
      if (phase) {
        const named = [...path, fieldName(phase[1]), ...(phase[2] ? [fieldName(phase[2])] : [])];
        out.push({ where: named.join(" "), message: phase[3].trim() });
      } else {
        out.push({ where: path.join(" "), message: body });
      }
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

  // ------------------------------------------------ watching, by request

  // POST /api/subscribers/:program { opportunity } answers 201 with the subscription
  // ({ opportunity: { id }, user: { id }, createdAt }); DELETE /api/subscribers/:program/:id
  // (the opportunity's identifier) answers 200 with the subscription it removed. This target
  // files every refusal under one generic list, never under a reason of its own: signed out
  // 401 {"errors":["You must be signed in to watch an opportunity."]}; a second watch 400
  // {"errors":["opportunity: You are already watching this opportunity."]}; one's own
  // opportunity 400 {"errors":["You cannot subscribe to your own opportunity."]}; an
  // identifier naming nothing readable 400 {"errors":["opportunity: No opportunity you may
  // read is held at that identifier."]}; stopping a watch there is none 400
  // {"errors":["opportunity: You are not watching this opportunity."]}.
  const watchRequest = requests("opportunity-watch-request");
  let watchProgram = "";
  let watchOpportunity = "";
  const seededOpportunities = (seed as unknown as Record<string, Record<string, { id?: unknown; program?: unknown }>>)
    .opportunities ?? {};

  function watchTarget(member: string, input: unknown): { program: string; id: string } {
    const where = `opportunity-watch-request.${member}`;
    const named =
      typeof input === "string" || typeof input === "number"
        ? String(input)
        : given(input, ["opportunity", "opportunityId", "opportunityIdentifier", "identifier", "id"]);
    const id = seededId(named, "opportunities") || watchOpportunity;
    if (!id) unbound(where, "the input names no opportunity to watch");
    const seeded = Object.values(seededOpportunities).find((each) => String(each.id) === id);
    const program = field(input, "program") || watchProgram || textOf(seeded?.program);
    if (!program) unbound(where, "no program was opened and the input names none");
    watchOpportunity = id;
    watchProgram = program;
    return { program, id };
  }

  const opportunityWatchRequest: S.OpportunityWatchRequestPage = {
    open: async (params) => {
      watchProgram = params?.program ?? "";
      watchOpportunity = "";
    },
    async watchByRequest(input) {
      const member = "watch_by_request";
      const { program, id } = watchTarget(member, input);
      await watchRequest.send(member, "POST", `${baseURL}/api/subscribers/${encodeURIComponent(program)}`, {
        opportunity: id,
      });
    },
    async stopWatchingByRequest(input) {
      const member = "stop_watching_by_request";
      const { program, id } = watchTarget(member, input);
      await watchRequest.send(
        member,
        "DELETE",
        `${baseURL}/api/subscribers/${encodeURIComponent(program)}/${encodeURIComponent(id)}`,
      );
    },
    requestAccepted: async () => acceptedText(watchRequest.last("request_accepted")),
    refusalStatus: async () => refusalStatusOf(watchRequest.last("refusal_status")),
    // The name(s) the refusal body files its messages under, as the service gives them.
    refusalReason: async () => {
      const got = watchRequest.last("refusal_reason");
      if (got.status < 400) return "";
      const body = parse(got.body);
      return body && typeof body === "object" && !Array.isArray(body) ? Object.keys(body).join("\n") : "";
    },
    refusalMessages: async () => messagesOf(watchRequest.last("refusal_messages")),
    // GET /api/opportunities/:program/:id carries "subscribed" for the signed-in person.
    watching: async () => {
      const where = "opportunity-watch-request.watching";
      if (!watchOpportunity || !watchProgram) unbound(where, "no opportunity has been asked about on this page yet");
      const got = await peek(
        `${baseURL}/api/opportunities/${encodeURIComponent(watchProgram)}/${encodeURIComponent(watchOpportunity)}`,
      );
      if (got.status !== 200) {
        unbound(where, `GET /api/opportunities/${watchProgram}/${watchOpportunity} answered ${got.status}, not the opportunity`);
      }
      return textOf(record(got.json).subscribed);
    },
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

  // DELETE /api/affiliations/:id ends a membership, answering 200 with the membership. This
  // target refuses ending the sole owner's (affiliations.qualifiedOwner) with 400
  // {"errors":["This is the sole owner for the organization, and cannot be removed."]}, and
  // an identifier holding no membership with 404 {"errors":["No membership is held at that
  // address."]}.
  const removal = requests("affiliation-removal-request");
  let removalOpened = "";
  const affiliationRemovalRequest: S.AffiliationRemovalRequestPage = {
    open: async (params) => {
      removalOpened = seededId(params?.affiliationId, "affiliations");
    },
    async endMembershipByRequest(input) {
      const member = "end_membership_by_request";
      const named = seededId(
        given(input, ["affiliation", "affiliationId", "membership", "membershipId", "membershipIdentifier", "id"]),
        "affiliations",
      );
      const affiliation = named || removalOpened;
      if (!affiliation) unbound(`affiliation-removal-request.${member}`, "no membership was opened or named to end");
      await removal.send(member, "DELETE", `${baseURL}/api/affiliations/${encodeURIComponent(affiliation)}`);
    },
    requestAccepted: async () => acceptedText(removal.last("request_accepted")),
    refusalMessages: async () => messagesOf(removal.last("refusal_messages")),
    refusalStatus: async () => refusalStatusOf(removal.last("refusal_status")),
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

  // Answers by order, exactly those the input gives. A question it leaves unanswered is
  // left unanswered, so the service accepts or refuses the proposal for what the test gave.
  function answersFor(input: unknown): { order: number; response: string }[] {
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
    return answers.sort((a, b) => a.order - b.order);
  }

  const memberIdOf = (value: unknown): string => personOf(value)?.id || textOf(value);
  const saysYes = (value: unknown): boolean => value === true || /^(yes|y|true|1)$/i.test(textOf(value).trim());

  // Only what the input carries is sent: a rate, a cost, a scrum master, a reference or an
  // answer it leaves out is left out of the request too, so that the service accepts or
  // refuses the proposal for what the test gave and for nothing this adapter supplied.
  async function teamProposalBody(where: string, program: string, input: unknown): Promise<Record<string, unknown>> {
    const opportunity = opportunityGiven(where, input);
    const organization = organizationGiven(input);
    const body: Record<string, unknown> = { opportunity, attachments: [], status: "SUBMITTED" };
    if (organization) body.organization = organization;
    if (program === "team-with-us") {
      // A resource the input names by its service area ("Full Stack Developer") is sent as
      // that resource's identifier, read from the opportunity; any other value as given.
      const read = await peek(`${baseURL}/api/opportunities/${program}/${opportunity}`);
      const resources = (Array.isArray(record(read.json).resources) ? (record(read.json).resources as unknown[]) : []).map(record);
      const resourceFor = (value: unknown): string => {
        const wanted = squash(textOf(value));
        const found =
          resources.find((each) => squash(textOf(each.serviceArea)) === wanted) ??
          resources.find((each) => textOf(each.id) === textOf(value));
        return found ? textOf(found.id) : textOf(value);
      };
      body.team = listGiven(input, ["team", "members", "teamMembers"]).map((each) => {
        const one = each && typeof each === "object" && !Array.isArray(each) ? each : { member: each };
        const member: Record<string, unknown> = { member: memberIdOf(given(one, ["member", "user", "person"]) ?? one) };
        const resource = given(one, ["resource", "serviceArea", "area"]);
        if (resource !== undefined && resource !== null && resource !== "") member.resource = resourceFor(resource);
        const rate = given(one, ["hourlyRate", "rate"]);
        if (rate !== undefined && rate !== null && rate !== "") member.hourlyRate = Number(rate);
        return member;
      });
      body.resourceQuestionResponses = answersFor(input);
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
      // A member is scrum master only where the input says so.
      const members = listGiven(details, ["members", "team", "teamMembers"]).map((each) => {
        const one = each && typeof each === "object" && !Array.isArray(each) ? each : { member: each };
        const member: Record<string, unknown> = { member: memberIdOf(given(one, ["member", "user", "person"]) ?? one) };
        const scrum = given(one, ["scrumMaster", "isScrumMaster"]);
        if (scrum !== undefined && scrum !== null && scrum !== "") member.scrumMaster = saysYes(scrum);
        return member;
      });
      const phaseBody: Record<string, unknown> = { members };
      const cost = given(details, ["proposedCost", "cost", "price"]);
      if (cost !== undefined && cost !== null && cost !== "") phaseBody.proposedCost = Number(cost);
      body[phase[0]] = phaseBody;
    }
    body.teamQuestionResponses = answersFor(input);
    body.references = listGiven(input, ["references"]).map((each, order) => ({
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

  // ------------------------------------------------ stored files, by request

  // POST /api/files takes a multipart form { name, metadata?, file }, metadata being who
  // may read the file as a list of { tag, value } (tag any, user or userType). GET
  // /api/files/:id answers the file's description, and with ?type=blob its bytes. Read on
  // this target signed out: the description and the bytes of the seeded private file, and
  // of an identifier nothing is stored under, all answer 401 ["You do not have permission
  // to perform this action."]; a form with no file part answers 500 {"message":"No file
  // uploaded"}. Each request carries the browser's session, so whoever is signed in.
  type FileAnswer = { status: number; headers: Record<string, string>; body: string };
  let fileAnswer: FileAnswer | null = null;
  const lastFile = (where: string): FileAnswer =>
    fileAnswer ?? unbound(where, "no request has been sent to the file address yet");

  const MIME: Record<string, string> = {
    ".txt": "text/plain",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".csv": "text/csv",
    ".json": "application/json",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".zip": "application/zip",
  };

  // The file a test names, as bytes in memory under that name. The harness makes the bytes
  // (so every adapter offers the same content for the same name and type), but it makes
  // them under a short stand-in name with the same ending: the name itself is what some
  // criteria turn on, and a name longer than the file system allows (256 characters, say)
  // has to reach the service as it is rather than fail on this machine's disk first.
  function fileGiven(name: string, content?: string | Uint8Array, bytes?: number): { name: string; mimeType: string; buffer: Buffer } {
    const ending = extname(name).toLowerCase();
    const standIn = /^\.[a-z0-9]{1,10}$/.test(ending) ? `offered${ending}` : "offered";
    const path = uploadFile({
      name: standIn,
      ...(typeof bytes === "number" && Number.isFinite(bytes) ? { bytes } : {}),
      ...(content !== undefined ? { content } : {}),
    });
    return { name, mimeType: MIME[ending] || "application/octet-stream", buffer: readFileSync(path) };
  }

  // How big the test asked the file to be, in bytes, however it said so: a number of bytes
  // under any of the usual names, a size written with its unit ("11 MB", "10.5MB", "512 KB"),
  // or a number under a name that carries the unit (sizeMB, megabytes, sizeKB). A size the
  // test gave and this cannot read is left out rather than guessed, and the content (or the
  // harness's default) decides the file. Units are binary: the service's 10 MB is 10 × 1024².
  //
  // Walked as the administrator: POST /api/files stores a file of 10,485,760 bytes (201) and
  // refuses one of 10,485,761 with 413 "The file is larger than 10 MB. Upload a file of 10 MB
  // or smaller."; a size this did not read left the harness's few-byte default to be sent, which
  // was stored, and refused_for_size then read '' (R-8.17). So a size is also read from any key
  // that names one (fileSize, sizeInMegabytes, length), with its unit spelled out ("11
  // megabytes") or relative to the limit ("over 10 MB", "10 MB + 1 byte"), and an input that
  // only says the file is over the limit (oversized, tooLarge, exceedsLimit) is 11 MB.
  function bytesGiven(input: unknown): number | undefined {
    const UNIT: Record<string, number> = {
      b: 1, byte: 1, bytes: 1,
      k: 1024, kb: 1024, kib: 1024, kilobyte: 1024, kilobytes: 1024,
      m: 1024 ** 2, mb: 1024 ** 2, mib: 1024 ** 2, megabyte: 1024 ** 2, megabytes: 1024 ** 2,
      g: 1024 ** 3, gb: 1024 ** 3, gib: 1024 ** 3, gigabyte: 1024 ** 3, gigabytes: 1024 ** 3,
    };
    const amount = (said: string, scale: number): number | undefined => {
      const one = /^\s*(\d+(?:\.\d+)?)\s*([a-z]*)\s*$/i.exec(said);
      if (!one) return undefined;
      const unit = one[2].toLowerCase();
      const factor = unit ? UNIT[unit] : scale;
      return factor === undefined ? undefined : Math.round(Number(one[1]) * factor);
    };
    const read = (value: unknown, scale: number): number | undefined => {
      if (typeof value === "number" && Number.isFinite(value) && value >= 0) return Math.round(value * scale);
      if (typeof value !== "string") return undefined;
      const text = value.replace(/[,_]/g, "").trim();
      const whole = amount(text, scale);
      if (whole !== undefined) return whole;
      // "10 MB + 1 byte", "10MB+1"
      const sum = /^(.+?)\s*\+\s*(.+)$/.exec(text);
      if (sum) {
        const [a, b] = [amount(sum[1], scale), amount(sum[2], 1)];
        if (a !== undefined && b !== undefined) return a + b;
      }
      // "over 10 MB", "more than 10 MB", "> 10 MB", "larger than 10 MB"
      const over = /^(?:over|more than|larger than|bigger than|greater than|above|exceeding|>)\s*(.+)$/i.exec(text);
      if (over) {
        const limit = amount(over[1], scale);
        if (limit !== undefined) return limit + 1;
      }
      return undefined;
    };
    const scaled: [string[], number][] = [
      [["bytes", "size", "sizeBytes", "size_bytes", "sizeInBytes", "byteLength", "fileSize", "fileSizeBytes", "length", "byteSize"], 1],
      [["kilobytes", "sizeKB", "size_kb", "kb", "sizeKiB", "sizeInKB", "sizeInKilobytes", "fileSizeKB"], 1024],
      [["megabytes", "sizeMB", "size_mb", "mb", "sizeMiB", "sizeInMB", "sizeInMegabytes", "fileSizeMB"], 1024 ** 2],
    ];
    for (const [names, scale] of scaled) {
      const value = given(input, names);
      if (value === undefined || value === null) continue;
      const bytes = read(value, scale);
      if (bytes !== undefined) return bytes;
    }
    // Any other key that names a size, read with the unit its name or its value carries.
    for (const [key, value] of Object.entries(record(input))) {
      const name = squash(key);
      if (!/size|bytes|megabyte|kilobyte/.test(name)) continue;
      const scale = /mb|mib|megabyte/.test(name) ? 1024 ** 2 : /kb|kib|kilobyte/.test(name) ? 1024 : 1;
      const bytes = read(value, scale);
      if (bytes !== undefined) return bytes;
    }
    const over = given(input, ["oversized", "tooLarge", "tooBig", "overLimit", "overSizeLimit", "exceedsLimit", "exceedsSizeLimit", "largerThanLimit"]);
    if (over === true) return 11 * 1024 ** 2;
    return undefined;
  }

  type Upload = { name: string; metadata?: string; file?: { fileName: string; mimeType: string; buffer: Buffer } };

  // Who may read a stored file, exactly as the input states it: a bare word is a tag, a
  // string otherwise is sent as it is written (well-formed or not), and a record or list is
  // sent as a list. Nothing stated is nothing sent.
  function readAccessGiven(input: unknown): string | undefined {
    const stated = given(input, ["readAccess", "read_access", "metadata", "access", "permissions"]);
    if (stated === undefined || stated === null) return undefined;
    if (typeof stated === "string") return /^[A-Za-z]+$/.test(stated) ? JSON.stringify([{ tag: stated }]) : stated;
    return JSON.stringify(Array.isArray(stated) ? stated : [stated]);
  }

  // The file the test names, made by the harness and sent under that name with whatever content or
  // size the test gave; the stored name is the one given for it, or the file's own.
  function uploadGiven(where: string, input: unknown, metadata: string | undefined, withFile = true): Upload {
    const fileName = field(input, "file", "fileName", "file_name", "name") || (typeof input === "string" ? input : "");
    if (!fileName) unbound(where, `the input names no file to upload (${JSON.stringify(input)})`);
    const name = field(input, "name", "storedName") || fileName;
    if (!withFile) return { name, metadata };
    const content = given(input, ["content", "contents", "body", "text"]);
    const made = fileGiven(
      fileName,
      typeof content === "string" || content instanceof Uint8Array ? content : undefined,
      bytesGiven(input),
    );
    const mimeType = field(input, "mimeType", "contentType", "content_type") || made.mimeType;
    return { name, metadata, file: { fileName, mimeType, buffer: made.buffer } };
  }

  async function sendUpload(where: string, form: Upload): Promise<void> {
    const multipart: Record<string, string | { name: string; mimeType: string; buffer: Buffer }> = { name: form.name };
    if (form.metadata !== undefined) multipart.metadata = form.metadata;
    if (form.file) multipart.file = { name: form.file.fileName, mimeType: form.file.mimeType, buffer: form.file.buffer };
    const response = await page.request
      .post(`${baseURL}/api/files`, { multipart })
      .catch((error: unknown) => unbound(where, `the upload could not be sent (${String(error)})`));
    fileAnswer = { status: response.status(), headers: response.headers(), body: await response.text().catch(() => "") };
  }

  // Neither the browser nor Playwright's request client sends a body without stating its
  // length, so this one upload leaves from the test process itself: the same form, with
  // the browser's cookies, written in chunks with no Content-Length at all.
  async function sendUploadWithoutLength(where: string, form: Upload): Promise<void> {
    const target = new URL(`${baseURL}/api/files`);
    const cookie = (await page.context().cookies(target.origin)).map((c) => `${c.name}=${c.value}`).join("; ");
    const boundary = `----withoutLength${Date.now().toString(16)}`;
    const part = (disposition: string, type?: string): string =>
      `--${boundary}\r\nContent-Disposition: form-data; ${disposition}\r\n${type ? `Content-Type: ${type}\r\n` : ""}\r\n`;
    const pieces: (string | Buffer)[] = [part(`name="name"`), form.name, "\r\n"];
    if (form.metadata !== undefined) pieces.push(part(`name="metadata"`), form.metadata, "\r\n");
    if (form.file) {
      pieces.push(
        part(`name="file"; filename="${form.file.fileName.replace(/"/g, "%22")}"`, form.file.mimeType),
        form.file.buffer,
        "\r\n",
      );
    }
    pieces.push(`--${boundary}--\r\n`);
    const options: RequestOptions = {
      method: "POST",
      headers: {
        "content-type": `multipart/form-data; boundary=${boundary}`,
        "transfer-encoding": "chunked",
        ...(cookie ? { cookie } : {}),
      },
    };
    fileAnswer = await new Promise<FileAnswer>((resolve, reject) => {
      const onResponse = (response: IncomingMessage): void => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("error", reject);
        response.on("end", () => {
          const headers: Record<string, string> = {};
          for (const [key, value] of Object.entries(response.headers)) {
            if (value !== undefined) headers[key] = Array.isArray(value) ? value.join(", ") : value;
          }
          resolve({ status: response.statusCode ?? 0, headers, body: Buffer.concat(chunks).toString("utf8") });
        });
      };
      const sent = target.protocol === "https:" ? httpsRequest(target, options, onResponse) : httpRequest(target, options, onResponse);
      sent.on("error", reject);
      for (const piece of pieces) sent.write(piece);
      sent.end();
    }).catch((error: unknown) => unbound(where, `the upload could not be sent (${String(error)})`));
  }

  async function askFile(where: string, target: string): Promise<void> {
    const response = await page.request
      .get(target)
      .catch((error: unknown) => unbound(where, `GET ${target} could not be made (${String(error)})`));
    fileAnswer = { status: response.status(), headers: response.headers(), body: await response.text().catch(() => "") };
  }

  // A refusal handed over whole, its status and its body; nothing when the answer was not one.
  const fileRefusal = (where: string, statuses: (status: number) => boolean): string => {
    const got = lastFile(where);
    return got.status >= 400 && statuses(got.status) ? `${got.status} ${got.body}` : "";
  };
  const fileField = (where: string, key: string): string => {
    const got = lastFile(where);
    if (got.status >= 300) return "";
    const value = record(parse(got.body))[key];
    return value === undefined || value === null ? "" : String(value);
  };

  const fileUpload: S.FileUploadPage = {
    open: async () => {
      fileAnswer = null;
    },
    uploadFile: (input) => {
      const where = "file-upload.upload_file";
      return sendUpload(where, uploadGiven(where, input, readAccessGiven(input)));
    },
    uploadFileStatingItsReadAccess: (input) => {
      const where = "file-upload.upload_file_stating_its_read_access";
      const stated = readAccessGiven(input);
      if (stated === undefined) unbound(where, `the input states no read access (${JSON.stringify(input)})`);
      return sendUpload(where, uploadGiven(where, input, stated));
    },
    uploadFileWithoutDeclaringItsSize: (input) => {
      const where = "file-upload.upload_file_without_declaring_its_size";
      return sendUploadWithoutLength(where, uploadGiven(where, input, readAccessGiven(input)));
    },
    uploadFileWithNoFilePart: (input) => {
      const where = "file-upload.upload_file_with_no_file_part";
      return sendUpload(where, uploadGiven(where, input, readAccessGiven(input), false));
    },
    // What makes these two what they are named for is the read access itself: the one the
    // input states is sent, and where it states none, a tag the service does not define, or
    // a statement that is not a list at all.
    uploadFileWithUnrecognisedReadAccess: (input) => {
      const where = "file-upload.upload_file_with_unrecognised_read_access";
      return sendUpload(where, uploadGiven(where, input, readAccessGiven(input) ?? JSON.stringify([{ tag: "nobodyInParticular" }])));
    },
    uploadFileWithMalformedReadAccess: (input) => {
      const where = "file-upload.upload_file_with_malformed_read_access";
      return sendUpload(where, uploadGiven(where, input, readAccessGiven(input) ?? "{not a read access"));
    },
    // A refused upload stored nothing and has no identifier: that reads as nothing.
    storedFileIdentifier: async () => fileField("file-upload.stored_file_identifier", "id"),
    refusedForSize: async () => fileRefusal("file-upload.refused_for_size", (status) => status < 500),
    sizeLimitNamedInRefusal: async () => fileRefusal("file-upload.size_limit_named_in_refusal", () => true),
    refusedForFileNameLength: async () => fileRefusal("file-upload.refused_for_file_name_length", (status) => status < 500),
    refusedForReadAccess: async () => fileRefusal("file-upload.refused_for_read_access", (status) => status < 500),
    refusedWhenSignedOut: async () => fileRefusal("file-upload.refused_when_signed_out", (status) => status === 401),
    serviceFault: async () => {
      const got = lastFile("file-upload.service_fault");
      if (got.status < 500) return "";
      const message = record(parse(got.body)).message;
      return `${got.status} ${typeof message === "string" ? message : got.body}`;
    },
  };

  const fileDescription: S.FileDescriptionPage = {
    open: async (params) => {
      const where = "file-description.open";
      const id = fileIdFor(String(params?.fileId ?? ""));
      if (!id) unbound(where, "no file was named");
      await askFile(where, `${baseURL}/api/files/${encodeURIComponent(id)}`);
    },
    fileIdentifier: async () => fileField("file-description.file_identifier", "id"),
    fileName: async () => fileField("file-description.file_name", "name"),
    storedDate: async () => fileField("file-description.stored_date", "createdAt"),
    storedContentIdentifier: async () => fileField("file-description.stored_content_identifier", "fileBlob"),
    refusedWhenNotPermitted: async () =>
      fileRefusal("file-description.refused_when_not_permitted", (status) => status === 401 || status === 403),
    // Short of an administrator, an unknown file is refused as not permitted (401), exactly
    // as a known one would be; only an administrator is told it is not there.
    refusedForUnknownFile: async () =>
      fileRefusal("file-description.refused_for_unknown_file", (status) => status === 401 || status === 403 || status === 404),
    notFoundForAdministrator: async () => fileRefusal("file-description.not_found_for_administrator", (status) => status === 404),
  };

  let downloadOpened = "";
  const header = (where: string, name: string): string => lastFile(where).headers[name] ?? "";

  const fileDownload: S.FileDownloadPage = {
    open: async (params) => {
      const where = "file-download.open";
      downloadOpened = fileIdFor(String(params?.fileId ?? ""));
      if (!downloadOpened) unbound(where, "no file was named");
      await askFile(where, `${baseURL}/api/files/${encodeURIComponent(downloadOpened)}?type=blob`);
    },
    downloadFile: async (input) => {
      const where = "file-download.download_file";
      const id = fileIdFor(field(input, "fileId", "id", "file") || (typeof input === "string" ? input : "")) || downloadOpened;
      if (!id) unbound(where, "no file was opened or named to download");
      await askFile(where, `${baseURL}/api/files/${encodeURIComponent(id)}?type=blob`);
    },
    fileContents: async () => {
      const got = lastFile("file-download.file_contents");
      return got.status < 300 ? got.body : "";
    },
    fileNameOnSave: async () => {
      const where = "file-download.file_name_on_save";
      if (lastFile(where).status >= 300) return "";
      const found = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header(where, "content-disposition"));
      return found ? decodeURIComponent(found[1]) : "";
    },
    offeredAsDownloadNotDisplayed: async () => {
      const where = "file-download.offered_as_download_not_displayed";
      if (lastFile(where).status >= 300) return "";
      return /^\s*(attachment|inline)/i.exec(header(where, "content-disposition"))?.[1].toLowerCase() ?? "";
    },
    contentTypeFromName: async () => {
      const where = "file-download.content_type_from_name";
      return lastFile(where).status < 300 ? header(where, "content-type") : "";
    },
    readableWhenSignedOutIfPublic: async () => {
      const got = lastFile("file-download.readable_when_signed_out_if_public");
      return got.status === 200 ? got.body : "";
    },
    refusedWhenNotPermitted: async () =>
      fileRefusal("file-download.refused_when_not_permitted", (status) => status === 401 || status === 403),
    refusedForUnknownFile: async () =>
      fileRefusal("file-download.refused_for_unknown_file", (status) => status === 401 || status === 403 || status === 404),
    notFoundForAdministrator: async () => fileRefusal("file-download.not_found_for_administrator", (status) => status === 404),
  };

  let attachmentsOf = { program: "", opportunityId: "" };

  // ------------------------------------------------ the public pages that were not here before

  // The opportunity list, signed in and signed out alike: a "Filter opportunities" search
  // group holding a "Program" chooser (a button reading the choice, "All programs Program",
  // that opens a "Program" list of All programs, Code With Us, Sprint With Us and Team With
  // Us), a "Status" chooser of the same kind, a "Remote work accepted only" box and a "Search
  // by title or location" search box; the list narrows as each is changed ("Showing N
  // opportunities. The list changes as you choose."). Each card is a link: title, program,
  // status badge, "Closes <date> at <time>" (or "Closed …"), summary, value, location.
  // The list heads its groups "Unpublished", "Open" and "Closed", each a line of its own.
  const OPPORTUNITY_GROUPS = [
    /^unpublished(?: opportunities)?$/i,
    /^open(?: opportunities)?$/i,
    /^closed(?: opportunities)?$/i,
  ];

  async function opportunityGroup(header: RegExp): Promise<string> {
    const rows = async (): Promise<string[] | null> => {
      const lines = await textLines();
      const start = lines.findIndex((line) => header.test(line));
      if (start < 0) return null;
      const body: string[] = [];
      for (let i = start + 1; i < lines.length; i++) {
        if (OPPORTUNITY_GROUPS.some((group) => group.test(lines[i]))) break;
        body.push(lines[i]);
      }
      if (body.length && /^\d+$/.test(body[0])) body.shift();
      return body;
    };
    await ready();
    let body = await rows();
    // This reader is shown no such group at all: nothing is in it for them.
    if (body === null) return "";
    if (!body.length) {
      // A folded group shows only its header, and opens when that is chosen.
      const shown = seen(page.getByText(header));
      const count = await shown.count();
      if (count) {
        await shown.nth(count - 1).click();
        await settle();
        body = (await rows()) ?? [];
      }
    }
    return body.join("\n");
  }

  const PROGRAM_WORDS: [RegExp, string][] = [
    [/code.?with.?us|^cwu$/i, "Code With Us"],
    [/sprint.?with.?us|^swu$/i, "Sprint With Us"],
    [/team.?with.?us|^twu$/i, "Team With Us"],
  ];

  async function pickFrom(where: string, box: Locator, value: string): Promise<void> {
    await box.click();
    const option = seen(page.getByRole("option", { name: value, exact: true })).first();
    await option.waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    if (!(await option.count())) {
      const offered = await seen(page.getByRole("option")).allInnerTexts().catch(() => []);
      await page.keyboard.press("Escape").catch(() => undefined);
      unbound(where, `the chooser on ${page.url()} offers no "${value}" (it offers: ${offered.join(", ") || "nothing"})`);
    }
    await option.click();
    await settle();
  }

  // The list's "Filter opportunities" search group.
  const listFilters = (): Locator => seen(page.getByRole("search", { name: /filter opportunities/i })).first();

  // One of the group's choosers: a button named for its choice and its label ("All programs
  // Program", "All statuses Status") opening a list named for the label. The wanted choice
  // is matched without regard to case; the list narrows as soon as it is chosen.
  async function listChoice(where: string, button: RegExp, list: RegExp, wanted: string): Promise<void> {
    await ready();
    const chooser = seen(listFilters().getByRole("button", { name: button })).first();
    if (!(await chooser.count())) {
      unbound(where, `no chooser named ${button} among the filters on ${page.url()}; it offers ${await offered()}`);
    }
    await chooser.click();
    const options = seen(page.getByRole("listbox", { name: list }).getByRole("option"));
    await options.first().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    const names = (await options.allInnerTexts()).map((one) => one.trim());
    const at = names.findIndex((one) => one.toLowerCase() === wanted.toLowerCase());
    if (at < 0) {
      await page.keyboard.press("Escape").catch(() => undefined);
      unbound(where, `the chooser named ${button} on ${page.url()} offers no "${wanted}" (it offers: ${names.join(", ") || "nothing"})`);
    }
    await options.nth(at).click();
    await settle();
  }

  const opportunityList: S.OpportunityListPage = {
    open: () => go("/opportunities"),
    filterByProgram: async (input) => {
      const where = "opportunity-list.filter_by_program";
      const named = field(input, "program", "value", "name") || textOf(input);
      if (!named) unbound(where, `the input names no program (${JSON.stringify(input)})`);
      const value = PROGRAM_WORDS.find(([pattern]) => pattern.test(named))?.[1] ?? named;
      await listChoice(where, /\bprogram$/i, /^program$/i, value);
    },
    // The "Filter opportunities" search group carries, signed in and signed out alike, a
    // "Status" chooser: a button reading the choice ("All statuses Status") that opens a
    // "Status" list of "All statuses", "Draft", "Under review", "Published", "Evaluation" and
    // "Awarded". Choosing one narrows the list at once ("Showing N opportunities.").
    filterByStatus: async (input) => {
      const where = "opportunity-list.filter_by_status";
      const named = field(input, "status", "value") || textOf(input);
      if (!named) unbound(where, `the input names no status (${JSON.stringify(input)})`);
      // A state named as the service stores it ("UNDER_REVIEW", "EVAL_QUESTIONS_CONSENSUS")
      // is matched to the words the chooser uses.
      let wanted = named.replace(/[_-]+/g, " ").trim().toLowerCase();
      if (/^eval/.test(wanted)) wanted = "evaluation";
      if (/^(all|any)$/.test(wanted)) wanted = "all statuses";
      await listChoice(where, /\bstatus$/i, /^status$/i, wanted);
    },
    filterRemoteOnly: async (input) => {
      const where = "opportunity-list.filter_remote_only";
      await ready();
      const box = seen(listFilters().getByRole("checkbox", { name: /^remote work accepted only$/i })).first();
      if (!(await box.count())) unbound(where, `no "Remote work accepted only" box among the filters on ${page.url()}; it offers ${await offered()}`);
      const stated = given(input, ["remote", "remoteOk", "remoteOnly", "checked", "on"]);
      await box.setChecked(stated === undefined || stated === null ? true : saysYes(stated));
      await settle();
    },
    search: async (input) => {
      const where = "opportunity-list.search";
      const words = field(input, "query", "search", "term", "text", "title", "location") || textOf(input);
      if (!words) unbound(where, `the input names nothing to search for (${JSON.stringify(input)})`);
      await ready();
      const box = seen(listFilters().getByRole("searchbox", { name: /^search by title or location$/i })).first();
      if (!(await box.count())) unbound(where, `no "Search by title or location" box among the filters on ${page.url()}; it offers ${await offered()}`);
      await box.fill(words);
      await settle();
    },
    // Signed in, each card carries a "Watch <title>" box ("Tick Watch on an opportunity to be
    // emailed whenever it changes. You cannot watch one you created."), saved as soon as it is
    // ticked; a card of the reader's own opportunity carries none, and a signed-out visitor's
    // list none at all. The input names the card by its title or identifier (the first card
    // offering the box when it names none) and may say which way the box should end up. A
    // card shown without the box is the list refusing this reader, logged so the test's own
    // follow-up reading decides.
    toggleWatch: async (input) => {
      const where = "opportunity-list.toggle_watch";
      await ready();
      await seen(page.getByRole("main").getByText(/^showing \d+ opportunit/i))
        .first()
        .waitFor({ state: "visible", timeout: 10000 })
        .catch(() => undefined);
      const id = field(input, "opportunityId", "id");
      const title = field(input, "title", "opportunity", "name") || (typeof input === "string" ? input : "");
      const cards = seen(page.getByRole("main").getByRole("article"));
      const watchBox = (card: Locator): Locator => card.getByRole("checkbox", { name: /^\s*watch\b/i }).first();
      let card: Locator | null = null;
      for (let i = 0; i < (await cards.count()); i++) {
        const one = cards.nth(i);
        const href = (await one.getByRole("link").first().getAttribute("href").catch(() => null)) ?? "";
        const heading = (await one.getByRole("heading").first().innerText().catch(() => "")).trim();
        const matches = id
          ? href.replace(/[?#].*$/, "").endsWith(`/${id}`)
          : title
            ? heading.toLowerCase() === title.trim().toLowerCase()
            : (await watchBox(one).count()) > 0;
        if (matches) {
          card = one;
          break;
        }
      }
      if (!card) {
        if (!id && !title) {
          noteRefusal(`${where} — no card on ${page.url()} offers ${actingId()} a "Watch" box`);
          return;
        }
        unbound(where, `no card for ${id || `"${title}"`} among the ${await cards.count()} the list on ${page.url()} shows`);
      }
      const box = watchBox(card);
      if (!(await box.count())) {
        noteRefusal(`${where} — the card for ${id || `"${title}"`} on ${page.url()} offers ${actingId()} no "Watch" box`);
        return;
      }
      if (await isDisabled(box)) throw new Error(`${where} — the "Watch" box for ${id || `"${title}"`} is disabled on ${page.url()}`);
      const was = await box.isChecked();
      const wanted = boxWanted(input, ["watch", "watching", "watched", "subscribed"]);
      if (wanted !== undefined && wanted === was) return;
      await box.click();
      await settle();
      for (let tries = 0; tries < 20 && (await box.isChecked().catch(() => was)) === was; tries++) {
        await page.waitForTimeout(250);
      }
      if ((await box.isChecked().catch(() => was)) === was) {
        throw new Error(`${where} — ticking the "Watch" box for ${id || `"${title}"`} on ${page.url()} left it ${was ? "ticked" : "unticked"}`);
      }
    },
    unpublishedGroup: () => opportunityGroup(OPPORTUNITY_GROUPS[0]),
    openGroup: () => opportunityGroup(OPPORTUNITY_GROUPS[1]),
    closedGroup: () => opportunityGroup(OPPORTUNITY_GROUPS[2]),
    // Every card from the first group down, as the list shows it.
    opportunityStatus: async () => {
      const lines = await textLines();
      const start = lines.findIndex((line) => OPPORTUNITY_GROUPS.some((group) => group.test(line)));
      return start < 0 ? "" : lines.slice(start).join("\n");
    },
    proposalDeadline: () => linesMatching(/^Close[sd]\b/),
  };

  // The organization list, a table captioned "Registered organizations by legal name.": read
  // signed out it has one column, "Organization", the names not links; signed in as a vendor
  // it has "Organization", "Owner", "Team size", "Sprint With Us qualified" and "Team With Us
  // qualified", the last four filled ("Yes"/"No") only for organizations the vendor owns or
  // administers, whose names are links to their screens.
  async function columnValues(header: RegExp): Promise<string> {
    await ready();
    const headers = seen(page.getByRole("columnheader"));
    let at = -1;
    for (let i = 0; i < (await headers.count()); i++) if (header.test((await headers.nth(i).innerText()).trim())) at = i;
    if (at < 0) return "";
    const rows = seen(page.getByRole("row"));
    const out: string[] = [];
    for (let i = 0; i < (await rows.count()); i++) {
      const cells = rows.nth(i).getByRole("cell");
      if ((await cells.count()) > at) out.push((await cells.nth(at).innerText()).trim());
    }
    return out.join("\n");
  }

  const ORGANIZATIONS_SIGNED_IN = `is offered only to a signed-in person, and ${NOBODY_SIGNS_IN}`;

  const organizationList: S.OrganizationListPage = {
    open: () => go("/organizations"),
    changePage: async (input) => {
      const where = "organization-list.change_page";
      await ready();
      const wanted = field(input, "page", "to") || textOf(input);
      // The pager is the navigation "Pages of organizations": "Page N of M" and a link "Page
      // n" for each page.
      const name = wanted ? new RegExp(`^(page )?${wanted.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") : /^(next|›|»)( page)?$/i;
      const control = seen(page.getByRole("button", { name }).or(page.getByRole("link", { name }))).first();
      if (!(await control.count())) {
        const pager = seen(page.getByRole("navigation", { name: /pagination|pager|pages of/i }));
        const says = (await pager.count()) ? (await pager.first().innerText()).replace(/\s+/g, " ").trim() : "no pager";
        unbound(where, `no pager control named ${name} on ${page.url()}; the pager reads "${says}"`);
      }
      await control.click();
      await settle();
    },
    openOrganization: async (input) => {
      const where = "organization-list.open_organization";
      const named = field(input, "legalName", "name", "organization") || textOf(input);
      await ready();
      const link = seen(page.getByRole("link", { name: named ? new RegExp(named.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : /./ })).first();
      if (!named || !(await link.count()) || !(await link.getAttribute("href"))?.startsWith("/organizations/")) {
        unbound(where, `no link named ${JSON.stringify(named)} to an organization's screen on ${page.url()}; signed in, the list links only the organizations the viewer owns and draws the rest as plain text, and an organization's screen ${ORGANIZATIONS_SIGNED_IN}`);
      }
      await link.click();
      await settle();
    },
    createOrganization: async () => {
      await ready();
      if (!(await findControl(page, /^create organization$/i))) {
        unbound("organization-list.create_organization", `no "Create organization" on ${page.url()} — it is drawn there for a signed-in person, and creating one ${ORGANIZATIONS_SIGNED_IN}`);
      }
      await press("organization-list.create_organization", /^create organization$/i);
    },
    myOrganizations: async () => {
      await ready();
      if (!(await findControl(page, /^my organizations$/i))) {
        unbound("organization-list.my_organizations", `no "My organizations" on ${page.url()} — it is drawn there for a signed-in person, and a person's own organizations are ${ORGANIZATIONS_SIGNED_IN.replace(/^is/, "are")}`);
      }
      await press("organization-list.my_organizations", /^my organizations$/i);
    },
    organizationName: () => columnValues(/^(organization|organization name|legal name)$/i),
    // A withheld owner is shown as a dash, which is no name.
    ownerName: async () => {
      const shown = await columnValues(/^owner$/i);
      return shown
        .split("\n")
        .map((line) => (/^[—–-]$/.test(line) ? "" : line))
        .join("\n")
        .trim();
    },
    swuQualifiedMark: () => columnValues(/^(swu|sprint with us) qualified\??$/i),
    twuQualifiedMark: () => columnValues(/^(twu|team with us) qualified\??$/i),
    // The navigation "Pages of organizations": "Page 1 of 1" and the link "Page 1".
    pagination: async () => {
      await ready();
      const pager = seen(page.getByRole("navigation", { name: /pagination|pager|pages of/i }));
      return (await pager.count()) ? (await pager.first().innerText()).trim() : "";
    },
    refusedWhenNotPermitted: () => refusalShown(),
  };

  // /sign-in: "Sign In", "Choose the kind of account you sign in with.", then a "Vendor"
  // region ("Sign in as a vendor") and a "Public sector employee" region ("Sign in as a
  // public sector employee"), then "Don't have an account? Sign up". /sign-up ("Choose
  // Account Type") is the same with "Sign up as …" and closes on "Already have an account?
  // Sign in". Each way in leads to the sandbox identity provider's form.
  async function cardFrom(start: RegExp, end?: RegExp): Promise<string> {
    const lines = await textLines();
    const from = lines.findIndex((line) => start.test(line));
    if (from < 0) return "";
    let to = end ? lines.findIndex((line, i) => i > from && end.test(line)) : -1;
    if (to < 0) to = lines.findIndex((line, i) => i > from && /^(don.t|already) have an account/i.test(line));
    return lines.slice(from, to > from ? to : undefined).join("\n");
  }

  const VENDOR_CARD = /^vendor$/i;
  const PUBLIC_SECTOR_CARD = /^public sector employee$/i;

  const userSignIn: S.UserSignInPage = {
    open: () => go("/sign-in"),
    signInAsVendor: () => press("user-sign-in.sign_in_as_vendor", /^sign in (as a vendor|using github)$/i),
    signInAsPublicSectorEmployee: () =>
      press("user-sign-in.sign_in_as_public_sector_employee", /^sign in (as a public sector employee|using idir)$/i),
    goToSignUp: () => press("user-sign-in.go_to_sign_up", /^sign up$/i),
    vendorCard: () => cardFrom(VENDOR_CARD, PUBLIC_SECTOR_CARD),
    publicSectorCard: () => cardFrom(PUBLIC_SECTOR_CARD),
  };

  const userSignUpChooseAccount: S.UserSignUpChooseAccountPage = {
    open: () => go("/sign-up"),
    signUpAsVendor: () => press("user-sign-up-choose-account.sign_up_as_vendor", /^sign up (as a vendor|using github)$/i),
    signUpAsPublicSectorEmployee: () =>
      press(
        "user-sign-up-choose-account.sign_up_as_public_sector_employee",
        /^sign up (as a public sector employee|using idir)$/i,
      ),
    vendorCard: () => cardFrom(VENDOR_CARD, PUBLIC_SECTOR_CARD),
    publicSectorCard: () => cardFrom(PUBLIC_SECTOR_CARD),
  };

  // /sign-out: "Signed Out" / "You have successfully signed out" / "Sign in again", whether
  // reached through the header's "Sign out" link (surface.signOut) or opened directly.
  const userSignOut: S.UserSignOutPage = {
    open: () => go("/sign-out"),
    signedOutMessage: () => linesMatching(/signed out/i),
    signOutFailedMessage: () => linesMatching(/(sign.?out|signing out).*(fail|could not|unable)|(fail|could not|unable).*sign.?out/i),
  };

  // /notice/deactivatedOwnAccount: "Account Deactivation Successful", "You have successfully
  // deactivated your account.", "Back to Home". /notice/authFailure: "Sign-In Failed",
  // 'Please try again using the "Sign-In" button.'. Any other notice is "Not Found".
  async function noticeSaying(heading: RegExp): Promise<string> {
    const lines = await textLines();
    const from = lines.findIndex((line) => heading.test(line));
    if (from < 0) return "";
    return lines.slice(from).filter((line) => !/^back to home$/i.test(line)).join("\n");
  }

  const userNotice: S.UserNoticePage = {
    open: (params) => go("/notice/:noticeId", params as unknown as Record<string, string>),
    backToHome: () => press("user-notice.back_to_home", /^(back to home|go home)$/i),
    deactivatedOwnAccountNotice: () => noticeSaying(/deactivat/i),
    signInFailedNotice: () => noticeSaying(/^sign.?in failed/i),
  };

  // /proposals once drew the words "Proposal List" and nothing else. Walked on the current
  // build it answers the "Page not found" screen signed out and signed in (as the
  // administrator and as the organization-owner vendor), and nothing in the application leads
  // to it — a vendor's proposals are on /dashboard. So the reading decides when it runs:
  // absent while the address answers "Page not found", unbound if it answers anything else,
  // since that screen has not been seen.
  const proposalListStub: S.ProposalListStubPage = {
    open: () => go("/proposals"),
    placeholderText: async () => {
      if (new URL(page.url()).pathname !== "/proposals") await go("/proposals");
      if (await notFoundShown()) {
        throw new Error(
          `absent: proposal-list-stub.placeholder_text — /proposals answered ${actingId()} the application's "Page not found" screen at ${page.url()}; walked on the current build signed out and signed in as the administrator and as the organization-owner vendor it answers the same, and no link, tab, menu or button in the application leads to it`,
        );
      }
      return unbound(
        "proposal-list-stub.placeholder_text",
        `/proposals no longer answers "Page not found" (it shows "${await firstHeading()}" at ${page.url()}); the page has been built since this binding was written and its placeholder has not been seen, so the next binding run binds it`,
      );
    },
  };

  // ================================================================ signed-in screens, found at run time
  //
  // The screens below are shown only to a signed-in person. Walked signed in, the running
  // build draws /dashboard, /sign-up/complete, one's own profile, the organization screens
  // and the proposal forms and screens named in NOBODY_SIGNS_IN, and answers the rest of the
  // proposal screens and the evaluation screens with "Page not found". Each
  // member looks for what the contract names by role and accessible name — the way a person
  // reads the screen — and throws "unbound: …" naming what it looked for, and what the
  // screen offers instead, when it is not there. Nothing here returns a reading from a screen
  // it did not reach: a refusal, a hand-off to the identity provider, or a missing tab is
  // unbound, and only a screen that opened and shows nothing reads as empty.

  // The accessible names of what a screen offers, for a reason to name when a control is
  // not among them.
  async function offered(): Promise<string> {
    const names: string[] = [];
    for (const role of ["tab", "button", "link", "textbox", "checkbox", "combobox"] as const) {
      const found = seen(page.getByRole(role));
      const count = Math.min(await found.count().catch(() => 0), 40);
      for (let i = 0; i < count; i++) {
        const one = found.nth(i);
        const name = await one
          .evaluate((element) => {
            const input = element as HTMLInputElement;
            const label = input.labels && input.labels.length ? input.labels[0].innerText : "";
            return (element.getAttribute("aria-label") || label || (element as HTMLElement).innerText || "").trim();
          })
          .catch(() => "");
        if (name) names.push(`${role} "${name.replace(/\s+/g, " ").slice(0, 60)}"`);
      }
    }
    return names.length ? names.join(", ") : "nothing that can be pressed or filled";
  }

  // "proposalDeadline", "proposal_deadline" -> /proposal\s*deadline/i, the label a field of
  // that name carries.
  const labelFor = (key: string): RegExp =>
    new RegExp(
      key
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("[\\s-]*"),
      "i",
    );

  // A form field by its label, on the view as it stands or behind one of its tabs.
  async function fieldLabelled(label: RegExp, walkTabs = true): Promise<Locator | null> {
    const look = async (): Promise<Locator | null> => {
      for (const role of ["textbox", "combobox", "spinbutton", "checkbox", "radio"] as const) {
        const found = seen(page.getByRole(role, { name: label }));
        if (await found.count()) return found.first();
      }
      const byLabel = seen(page.getByLabel(label));
      return (await byLabel.count()) ? byLabel.first() : null;
    };
    const here = await look();
    if (here || !walkTabs) return here;
    const tabs = seen(page.getByRole("tab"));
    const count = await tabs.count();
    for (let i = 0; i < count; i++) {
      await tabs.nth(i).click().catch(() => undefined);
      await settle();
      const found = await look();
      if (found) return found;
    }
    return null;
  }

  async function valueOf(box: Locator): Promise<string> {
    const role = await box.getAttribute("type").catch(() => null);
    if (role === "checkbox" || role === "radio") return (await box.isChecked()) ? "checked" : "unchecked";
    const value = await box.inputValue().catch(() => null);
    if (value !== null) return value.trim();
    return (await box.innerText().catch(() => "")).trim();
  }

  async function enter(where: string, key: string, box: Locator, value: unknown): Promise<void> {
    if (await isDisabled(box)) unbound(where, `the field for "${key}" is disabled on ${page.url()}`);
    const kind = await box.getAttribute("type").catch(() => null);
    const role = await box.getAttribute("role").catch(() => null);
    const tag = await box.evaluate((element) => element.tagName.toLowerCase()).catch(() => "");
    if (kind === "checkbox" || kind === "radio") {
      await box.setChecked(saysYes(value));
    } else if (tag === "select") {
      await box.selectOption({ label: textOf(value) });
    } else if (role === "combobox" && tag !== "input") {
      await pickFrom(where, box, textOf(value));
    } else {
      await box.fill(textOf(value));
    }
  }

  // Every value the test gave, entered in the field its key names, before anything is
  // pressed. A key no field on the screen takes is reported rather than dropped.
  async function fillFrom(
    where: string,
    input: unknown,
    labels: Record<string, RegExp> = {},
    skip: string[] = [],
  ): Promise<void> {
    const named = Object.fromEntries(Object.entries(labels).map(([key, label]) => [squash(key), label]));
    const skipped = skip.map(squash);
    for (const [key, value] of Object.entries(record(input))) {
      if (value === undefined || skipped.includes(squash(key))) continue;
      const label = named[squash(key)] ?? labelFor(key);
      const box = await fieldLabelled(label);
      if (!box) unbound(where, `no field on ${page.url()} takes "${key}" (looked for one labelled ${label}); it offers ${await offered()}`);
      await enter(where, key, box, value);
    }
  }

  // The messages a form draws: its alerts, and the description of every field marked
  // invalid. None drawn reads as nothing.
  async function formMessages(): Promise<string> {
    const lines: string[] = [];
    const alerts = seen(page.getByRole("alert"));
    for (let i = 0; i < (await alerts.count()); i++) lines.push(...lined(await alerts.nth(i).innerText().catch(() => "")));
    for (const role of ["textbox", "combobox", "spinbutton", "checkbox"] as const) {
      const boxes = seen(page.getByRole(role));
      for (let i = 0; i < (await boxes.count()); i++) {
        const said = await boxes
          .nth(i)
          .evaluate((element) => {
            if (element.getAttribute("aria-invalid") !== "true") return "";
            const ids = (element.getAttribute("aria-describedby") ?? element.getAttribute("aria-errormessage") ?? "")
              .split(/\s+/)
              .filter(Boolean);
            return ids.map((id) => document.getElementById(id)?.innerText ?? "").join("\n");
          })
          .catch(() => "");
        lines.push(...lined(said));
      }
    }
    return [...new Set(lines)].join("\n");
  }

  // A file offered through the chooser a control opens.
  // Returns the name the file was offered under.
  async function offerFile(where: string, control: RegExp, input: unknown): Promise<string> {
    const named = given(input, ["file", "name", "fileName", "image", "logo", "avatar", "picture"]);
    const request = typeof input === "string" ? { name: input } : named && typeof named === "object" ? record(named) : { ...record(input), name: textOf(named) };
    const name = textOf(record(request).name);
    if (!name) unbound(where, "the input names no file to offer");
    // Offered as a payload, not a path: Playwright hands the browser these bytes under this
    // name, so a name no file on disk could carry still reaches the page as it was given.
    const payload = fileGiven(
      name,
      record(request).content as string | Uint8Array | undefined,
      bytesGiven(request) ?? bytesGiven(input),
    );
    const button = await findControl(page, control);
    if (!button) {
      // A plain file input, found by its label.
      const box = seen(page.getByLabel(control));
      if (await box.count()) {
        await box.first().setInputFiles(payload);
        await settle();
        return name;
      }
      unbound(where, `no control named ${control} on ${page.url()} opens a file chooser; it offers ${await offered()}`);
    }
    const chooser = page.waitForEvent("filechooser", { timeout: 5000 }).catch(() => null);
    await button.click();
    const opened = await chooser;
    if (opened) {
      await opened.setFiles(payload);
      await settle();
      return name;
    }
    // Walked signed in as the administrator and as a vendor: "Edit profile" draws the
    // "Profile picture (optional)" group with its rule and a "Choose a profile picture"
    // button, and pressing that button (click, Enter or Space) opens no file chooser — the
    // file field beside it, hidden from view, is never even clicked. The control the
    // contract names is on the page and does nothing, so this is the page failing to take a
    // file, reported as it is and not as an unbound member.
    const label = ((await button.innerText().catch(() => "")) || String(control)).trim();
    throw new Error(
      `${where} — pressed "${label}" on ${page.url()} and no file chooser opened, so "${name}" could not be offered; the page offers no other way a person can give it a file`,
    );
  }

  // The dialog on screen, or nothing when none is open.
  function dialog(): Locator {
    return seen(page.getByRole("dialog").or(page.getByRole("alertdialog"))).last();
  }

  async function inDialog(where: string, name: RegExp): Promise<void> {
    await dialog().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    if (!(await dialog().count())) unbound(where, `no dialog is open on ${page.url()} to press ${name} in`);
    await press(where, name, dialog());
  }

  async function confirmIfAsked(where: string, name: RegExp): Promise<void> {
    await dialog().waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined);
    if (await dialog().count()) await press(where, name, dialog());
  }

  // One line per table row, its cells joined with " | ".
  async function tableRows(scope: Scope = page): Promise<string[]> {
    const rows = seen(scope.getByRole("row"));
    const out: string[] = [];
    for (let i = 0; i < (await rows.count()); i++) {
      const cells = seen(rows.nth(i).getByRole("cell"));
      const count = await cells.count();
      if (!count) continue; // the header row
      const words: string[] = [];
      for (let c = 0; c < count; c++) words.push((await cells.nth(c).innerText()).replace(/\s+/g, " ").trim());
      out.push(words.join(" | "));
    }
    return out;
  }

  // The values of one column, found by its header.
  async function columnOf(header: RegExp): Promise<string[]> {
    const headers = seen(page.getByRole("columnheader"));
    let at = -1;
    for (let i = 0; i < (await headers.count()); i++) {
      if (header.test((await headers.nth(i).innerText()).trim())) {
        at = i;
        break;
      }
    }
    if (at < 0) return [];
    return (await tableRows()).map((row) => row.split(" | ")[at] ?? "").filter(Boolean);
  }

  // The name a screen shows for a person named by seed handle, persona, identifier or
  // address, or handed over whole (a persona carries its name); empty when none is known.
  function shownName(value: unknown): string {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const handed = record(value);
      if (typeof handed.name === "string" && handed.name.trim()) return handed.name.trim();
      for (const key of ["member", "user", "person", "newOwner", "owner"]) {
        if (handed[key] !== undefined) {
          const inner = shownName(handed[key]);
          if (inner) return inner;
        }
      }
    }
    const person = personOf(value);
    if (!person) return "";
    const found = Object.values(seedGroups.users ?? {}).find(
      (each) => (person.id && each.id === person.id) || (person.email && each.email === person.email),
    );
    const name = found ? record(found).name : undefined;
    return typeof name === "string" ? name : "";
  }

  // A row of the screen's tables that names the person or thing the test gave. Team tables
  // name people by name alone, so a person is looked for by address and by name.
  async function rowNaming(where: string, input: unknown, groups: string[]): Promise<Locator> {
    const person = personOf(given(input, ["member", "user", "email", "person"]) ?? input);
    const words = [
      person?.email,
      shownName(input),
      givenText(input, ["email", "name", "title"]),
      typeof input === "string" ? input : "",
      seededId(given(input, ["id"]) ?? "", ...groups),
    ].filter((word): word is string => !!word);
    const rows = seen(page.getByRole("row"));
    for (const word of words) {
      const found = rows.filter({ hasText: word });
      if (await found.count()) return found.first();
    }
    return unbound(where, `no row on ${page.url()} names ${JSON.stringify(input)}; the rows read: ${(await tableRows()).join(" / ") || "none"}`);
  }

  // The screen a signed-in page is reached at, and the checks every member makes before it
  // reads or presses anything.
  function signedInScreen(pageId: string, route: string) {
    const where = (member: string): string => `${pageId}.${member}`;
    const on = async (member: string): Promise<void> => {
      await ready();
      const why = await whyNotHere();
      if (why) {
        unbound(
          where(member),
          `${route} did not open as a screen at ${page.url()}: ${why.replace(/\n+/g, " ")}; the screen is offered only to a signed-in person who may have it; ${NOBODY_SIGNS_IN}, and /users/:userId opens for the signed-in person's own identifier and, to the administrator, for another account's`,
        );
      }
    };
    return {
      where,
      on,
      open: (params?: Record<string, string>) => go(route, params),
      press: async (member: string, name: RegExp): Promise<void> => {
        await on(member);
        await press(where(member), name);
      },
      // A field's value, as a box or as the text shown under its label; a screen that opened
      // and carries no such field reads as nothing.
      field: async (member: string, label: RegExp, shownAs: string[] = []): Promise<string> => {
        await on(member);
        const box = await fieldLabelled(label, false);
        if (box) return valueOf(box);
        return shownAs.length ? valueAfter(shownAs) : "";
      },
      // A tab's panel; a screen that opened without that tab reads as nothing.
      tab: async (member: string, name: RegExp): Promise<string> => {
        await on(member);
        const tab = seen(page.getByRole("tab", { name }));
        if (!(await tab.count())) return "";
        await tab.first().click();
        await settle();
        const panel = seen(page.getByRole("tabpanel"));
        return (await panel.count()) ? (await panel.first().innerText()).trim() : mainText();
      },
      messages: async (member: string, about?: RegExp): Promise<string> => {
        await on(member);
        const said = await formMessages();
        return about ? lined(said).filter((line) => about.test(line)).join("\n") : said;
      },
      lines: async (member: string, pattern: RegExp): Promise<string> => {
        await on(member);
        return linesMatching(pattern);
      },
    };
  }

  // ---------------------------------------------------------------- the evaluation panel tab
  //
  // Walked as the owning public sector employee and as the administrator on the seeded
  // closed Sprint With Us and Team With Us opportunities: the management screen's
  // "Opportunity sections" offer an "Evaluation panel" link to ?tab=evaluationPanel, whose
  // "Evaluation panel" section holds one group per member ("Evaluator 1", "Evaluator 2"),
  // each with a "Public sector employee (required)" chooser (only public sector people are
  // offered, by name), a "Chair: evaluator N" box and "Remove evaluator N"; then "Add an
  // evaluator" (a new group, its chooser reading "Select an item"), a "Chair (required)"
  // chooser that takes an evaluator or somebody who chairs without evaluating, and "Save
  // evaluation panel" under "Evaluation panel actions". Ticking an evaluator's Chair box
  // chooses them in the Chair chooser and unticking it empties the chooser. A save says "The
  // evaluation panel has been saved." in a status; a refused one raises an alert "The
  // evaluation panel has N problem(s)" / "The panel was not saved. It is still the panel it
  // was before." over one line per fault ("Evaluation panel: name at least two members",
  // "Chair: choose a chair for the panel", "Evaluator 2: Casey Placeholder is already on the
  // panel"). Once consensus has begun (the seeded opportunities at "Questions: consensus")
  // the section shows a note "The evaluation panel can no longer be changed" / "The
  // consensus stage has begun, so the panel is fixed." over a "Members of the evaluation
  // panel" table (Name, Role: "Evaluator", "Evaluator and chair") and no controls. A vendor
  // is answered "Page not found".
  function evaluationPanelPage<T>(pageId: string, route: string): T {
    const screen = signedInScreen(pageId, route);
    const where = screen.where;
    const section = (): Locator => seen(regionNamed(page.getByRole("main"), /^evaluation panel$/i)).first();
    const members = (): Locator => seen(section().getByRole("group", { name: /^evaluator \d+$/i }));
    const lockNote = (): Locator => seen(section().getByRole("note"));
    const memberChooser = (group: Locator): Locator => seen(group.getByRole("button", { name: /public sector employee/i })).first();
    const chairChooser = (): Locator => seen(section().getByRole("button", { name: /^.*\bchair \(required\)\s*$/i })).first();
    const BLANK = /^\s*select an item\s*$/i;

    async function reached(member: string): Promise<void> {
      await screen.on(member);
      await section().waitFor({ state: "visible", timeout: 10000 }).catch(() => undefined);
      if (!(await section().count())) {
        const tabs = (await seen(page.getByRole("navigation", { name: /opportunity sections/i })).getByRole("link").allInnerTexts().catch(() => [] as string[]))
          .map((one) => `"${one.trim()}"`)
          .join(", ");
        unbound(where(member), `${page.url()} shows no "Evaluation panel" section; the management screen's sections are ${tabs || "none"}`);
      }
    }

    // A panel that can no longer be changed refuses every change: noted, not thrown, so the
    // test's own reading of panel_locked_after_consensus decides.
    async function editable(member: string): Promise<boolean> {
      await reached(member);
      if (await lockNote().count()) {
        noteRefusal(`${where(member)} — the panel on ${page.url()} says "${(await lockNote().first().innerText()).replace(/\s+/g, " ").trim()}" and offers no control to change it`);
        return false;
      }
      return true;
    }

    async function chosen(chooser: Locator): Promise<string> {
      const words = (await chooser.innerText().catch(() => "")).trim();
      return BLANK.test(words) ? "" : words;
    }

    // Choose a person by name in a chooser. A person the chooser does not offer (a vendor is
    // never offered; only public sector employees are) is a refusal: noted, nothing is
    // chosen, and false returned for the caller to raise or let the save decide.
    async function pick(member: string, chooser: Locator, name: string, person: unknown): Promise<boolean> {
      if ((await chosen(chooser)).toLowerCase() === name.toLowerCase()) return true;
      await chooser.click();
      const list = seen(page.getByRole("listbox")).last();
      await list.waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
      const option = list.getByRole("option", { name: new RegExp(`^\\s*${escapeRx(name)}\\s*$`, "i") });
      if (!(await option.count())) {
        const names = (await list.getByRole("option").allInnerTexts().catch(() => [] as string[])).map((one) => one.trim()).filter(Boolean);
        await page.keyboard.press("Escape").catch(() => undefined);
        const found = personOf(person);
        const users = seedGroups.users ?? {};
        const seeded = found ? (Object.values(users).find((each) => each.id === found.id) as Record<string, unknown> | undefined) : undefined;
        const kind = seeded && typeof seeded.account_type === "string" ? ` (a ${String(seeded.account_type).toLowerCase()} account)` : "";
        noteRefusal(`${where(member)} — the chooser on ${page.url()} offers ${names.map((one) => `"${one}"`).join(", ") || "nobody"} and not "${name}"${kind}, so nobody was chosen`);
        return false;
      }
      await option.first().click();
      await settle();
      return true;
    }

    // The people an action names, each with whether they are to chair: a seeded account (by
    // handle, identifier or record), { member | user | person, chair }, or a list of either
    // under members / evaluators / panel.
    function picks(input: unknown): { person: unknown; chair: unknown }[] {
      const listed = Array.isArray(input) ? input : given(input, ["members", "evaluators", "panel", "panelMembers"]);
      const items = listed !== undefined && listed !== null ? [listed].flat() : [input];
      return items
        .filter((one) => one !== undefined && one !== null)
        .map((one) => ({ person: given(one, ["member", "user", "person", "evaluator"]) ?? one, chair: given(one, ["chair", "isChair"]) }));
    }

    async function nameOf(member: string, person: unknown): Promise<string> {
      const name = await personName(person);
      if (!name) unbound(where(member), `the input names nobody the panel's chooser could offer (${JSON.stringify(person)})`);
      return name;
    }

    // The member group holding a person, by name, or at a place in the panel (the first is 1).
    async function memberGroup(member: string, input: unknown): Promise<Locator> {
      const place = typeof input === "number" ? input : Number(givenText(input, ["index", "position", "place", "slot"]) || NaN);
      if (Number.isFinite(place) && place > 0) {
        const at = seen(section().getByRole("group", { name: new RegExp(`^evaluator ${place}$`, "i") })).first();
        if (await at.count()) return at;
        unbound(where(member), `the panel on ${page.url()} has no "Evaluator ${place}"`);
      }
      const name = await nameOf(member, given(input, ["member", "user", "person", "evaluator"]) ?? input);
      for (let i = 0; i < (await members().count()); i++) {
        const group = members().nth(i);
        if ((await chosen(memberChooser(group))).toLowerCase() === name.toLowerCase()) return group;
      }
      const there: string[] = [];
      for (let i = 0; i < (await members().count()); i++) there.push((await chosen(memberChooser(members().nth(i)))) || "nobody chosen");
      return unbound(where(member), `no evaluator on the panel at ${page.url()} is "${name}"; it lists ${there.join(", ") || "nobody"}`);
    }

    async function tickChair(group: Locator, on: boolean): Promise<void> {
      const box = seen(group.getByRole("checkbox", { name: /^\s*chair\b/i })).first();
      if ((await box.isChecked()) !== on) await box.click();
      await settle();
    }

    const namesNoChair = (input: unknown): boolean =>
      input === null || input === false || /^(none|nobody|no one|)$/i.test(typeof input === "string" ? input.trim() : "x") ||
      (given(input, ["chair", "member", "user", "person"]) === null);

    // The faults a refused save names, one per line, from its alert.
    async function faults(member: string, about: RegExp): Promise<string> {
      await reached(member);
      await seen(page.getByRole("alert")).first().waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined);
      const lines: string[] = [];
      const alerts = seen(page.getByRole("alert"));
      for (let i = 0; i < (await alerts.count()); i++) lines.push(...lined(await alerts.nth(i).innerText().catch(() => "")));
      return [...new Set(lines.filter((line) => about.test(line) && !/^the evaluation panel has \d+ problems?$/i.test(line) && !/^the panel was not saved\b/i.test(line)))].join("\n");
    }

    // Each member as "<name> — <role>", the roles as the locked table words them
    // ("Evaluator", "Evaluator and chair"), with somebody who chairs without evaluating
    // as "<name> — Chair". A member still reading "Select an item" is nobody yet.
    async function rows(member: string): Promise<string[]> {
      await reached(member);
      if (await lockNote().count()) {
        return (await tableRows(section())).map((row) => row.replace(/\s*\|\s*/, " — "));
      }
      const out: string[] = [];
      const named: string[] = [];
      for (let i = 0; i < (await members().count()); i++) {
        const group = members().nth(i);
        const name = await chosen(memberChooser(group));
        if (!name) continue;
        named.push(name.toLowerCase());
        const chair = await seen(group.getByRole("checkbox", { name: /^\s*chair\b/i })).first().isChecked().catch(() => false);
        out.push(`${name} — ${chair ? "Evaluator and chair" : "Evaluator"}`);
      }
      const chair = await chosen(chairChooser());
      if (chair && !named.includes(chair.toLowerCase())) out.push(`${chair} — Chair`);
      return out;
    }

    const built = {
      open: (params?: Record<string, string>) => screen.open(params),
      // Each person named joins the first member still reading "Select an item", or a new
      // one "Add an evaluator" makes; a chair flag ticks their Chair box.
      addPanelMember: async (input?: unknown): Promise<void> => {
        const member = "add_panel_member";
        if (!(await editable(member))) return;
        const wanted = picks(input);
        if (!wanted.length) unbound(where(member), `the input names nobody to add (${JSON.stringify(input)})`);
        for (const one of wanted) {
          const name = await nameOf(member, one.person);
          let group: Locator | null = null;
          for (let i = 0; i < (await members().count()); i++) {
            if (!(await chosen(memberChooser(members().nth(i))))) {
              group = members().nth(i);
              break;
            }
          }
          if (!group) {
            const before = await members().count();
            await press(where(member), /^\s*add an evaluator\s*$/i, section());
            if ((await members().count()) <= before) unbound(where(member), `"Add an evaluator" made no new member on ${page.url()}`);
            group = members().last();
          }
          // A person the chooser does not offer is refused a place on the panel, raised here
          // so the test reads the refusal from the action itself.
          if (!(await pick(member, memberChooser(group), name, one.person))) {
            throw new Error(`refused: ${refusalLog[refusalLog.length - 1] ?? `${where(member)} — the chooser on ${page.url()} does not offer "${name}"`}`);
          }
          if (one.chair !== undefined && one.chair !== null) await tickChair(group, saysYes(one.chair));
        }
      },
      removePanelMember: async (input?: unknown): Promise<void> => {
        const member = "remove_panel_member";
        if (!(await editable(member))) return;
        const group = input === undefined || input === null ? members().last() : await memberGroup(member, input);
        const remove = seen(group.getByRole("button", { name: /^\s*remove evaluator \d+\s*$/i })).first();
        if (!(await remove.count())) {
          noteRefusal(`${where(member)} — the member on ${page.url()} offers no "Remove"`);
          return;
        }
        await remove.click();
        await settle();
      },
      // The "Chair (required)" chooser, which takes any public sector employee; naming
      // nobody empties it by unticking whichever evaluator's Chair box holds it.
      choosePanelChair: async (input?: unknown): Promise<void> => {
        const member = "choose_panel_chair";
        if (!(await editable(member))) return;
        if (namesNoChair(input)) {
          for (let i = 0; i < (await members().count()); i++) await tickChair(members().nth(i), false);
          return;
        }
        const person = given(input, ["chair", "member", "user", "person"]) ?? input;
        await pick(member, chairChooser(), await nameOf(member, person), person);
      },
      markMemberAsChair: async (input?: unknown): Promise<void> => {
        const member = "mark_member_as_chair";
        if (!(await editable(member))) return;
        const group = await memberGroup(member, input);
        const flag = given(input, ["chair", "isChair"]);
        await tickChair(group, flag === undefined || flag === null ? true : saysYes(flag));
      },
      saveEvaluationPanel: async (): Promise<void> => {
        const member = "save_evaluation_panel";
        if (!(await editable(member))) return;
        await press(where(member), /^\s*save evaluation panel\s*$/i, section());
        const deadline = Date.now() + 10000;
        while (Date.now() < deadline) {
          if (await seen(section().getByRole("status").filter({ hasText: /saved/i })).count()) break;
          if (await seen(page.getByRole("alert")).count()) break;
          await page.waitForTimeout(250);
        }
      },
      panelMemberRow: async (): Promise<string> => (await rows("panel_member_row")).join("\n"),
      // Who chairs: the "Chair (required)" chooser's choice, or on a locked panel the member
      // whose role names the chair; nobody chosen reads as nothing.
      chairField: async (): Promise<string> => {
        const member = "chair_field";
        await reached(member);
        if (await lockNote().count()) {
          return (await rows(member)).filter((row) => /chair$/i.test(row)).map((row) => row.replace(/\s+—.*$/, "")).join("\n");
        }
        return chosen(chairChooser());
      },
      minimumMembersError: () => faults("minimum_members_error", /at least two|minimum|two members/i),
      duplicateMemberError: () => faults("duplicate_member_error", /already on the panel|more than once|duplicate|named once/i),
      nonPublicSectorMemberError: () => faults("non_public_sector_member_error", /public sector|vendor/i),
      missingChairError: () => faults("missing_chair_error", /chair/i),
      panelLockedAfterConsensus: async (): Promise<string> => {
        await reached("panel_locked_after_consensus");
        if (!(await lockNote().count())) return "";
        // The note's title and its words, as the section draws them above the table.
        const lines = lined(await section().innerText());
        const to = lines.findIndex((line) => /^members of the evaluation panel$/i.test(line));
        return lines.slice(/^evaluation panel$/i.test(lines[0] ?? "") ? 1 : 0, to > 0 ? to : undefined).join("\n");
      },
    };
    return built as unknown as T;
  }

  // ---------------------------------------------------------------- the dashboard
  //
  // Signed in as the administrator: "Dashboard", a "Create an opportunity" link to
  // /opportunities/create, and "All opportunities" — a table (Title, Program, Status, Last
  // updated, Created by) of every opportunity, each title a link to its management screen.
  // A public sector employee sees the same over "My opportunities", or, with none, "You have
  // not created any opportunities yet." and no table.

  const dash = signedInScreen("opportunity-dashboard", "/dashboard");
  async function dashboardRows(member: string): Promise<string> {
    await dash.on(member);
    const tab = seen(page.getByRole("tab", { name: /opportunities/i }));
    if (await tab.count()) {
      await tab.first().click();
      await settle();
    }
    return (await tableRows()).join("\n");
  }
  const opportunityDashboard: S.OpportunityDashboardPage = {
    open: () => dash.open(),
    createOpportunity: () => dash.press("create_opportunity", /^\s*(\+\s*)?create( an?)?( new)? opportunity\s*$/i),
    openOpportunity: async (input) => {
      const where = dash.where("open_opportunity");
      await dash.on("open_opportunity");
      const id = seededId(given(input, ["opportunity", "opportunityId", "id"]) ?? "", "opportunities");
      const title = typeof input === "string" ? input : givenText(input, ["title", "name"]);
      const links = seen(page.getByRole("link"));
      for (let i = 0; i < (await links.count()); i++) {
        const link = links.nth(i);
        const href = (await link.getAttribute("href")) ?? "";
        const words = (await link.innerText()).trim();
        if ((id && href.includes(id)) || (title && words === title)) {
          await link.click();
          await settle();
          return;
        }
      }
      unbound(where, `no opportunity link on ${page.url()} for ${JSON.stringify(input)}; the rows read: ${(await tableRows()).join(" / ") || "none"}`);
    },
    myOpportunitiesTable: () => dashboardRows("my_opportunities_table"),
    opportunityStatus: async () => {
      await dashboardRows("opportunity_status");
      return (await columnOf(/^status$/i)).join("\n");
    },
    ownOpportunitiesOnly: () => dashboardRows("own_opportunities_only"),
    allOpportunitiesForAdministrator: () => dashboardRows("all_opportunities_for_administrator"),
    emptyMyOpportunitiesMessage: () =>
      dash.lines("empty_my_opportunities_message", /\bno\b.*opportunit|haven.t|have not|nothing to show|get started/i),
  };

  // ---------------------------------------------------------------- the Code With Us form

  const cwuNew = signedInScreen("opportunity-cwu-create", "/opportunities/code-with-us/create");
  const CWU_FIELDS: Record<string, RegExp> = {
    title: /^\s*title\b/i,
    teaser: /^\s*teaser\b/i,
    summary: /^\s*teaser\b/i,
    location: /^\s*location\b/i,
    remoteDesc: /remote work description/i,
    remoteDescription: /remote work description/i,
    reward: /^\s*reward\b/i,
    description: /^\s*description\b/i,
    proposalDeadline: /proposal\s*deadline/i,
    assignmentDate: /assignment\s*date/i,
    startDate: /^\s*(proposed\s*|work\s*)?start\s*date/i,
    completionDate: /completion\s*date/i,
  };
  const CWU_REMOTE = ["remoteOk", "remote", "remoteAllowed", "remoteWork", "remoteAcceptable"];
  const CWU_SKILLS = ["skills", "mandatorySkills", "requiredSkills", "skill"];
  const CWU_FILES = ["attachment", "attachments", "file", "files"];

  // Whether remote work is acceptable is the Overview's "Remote OK: remote work is
  // acceptable" box, under Location and above "Remote work description". A form that asks it
  // instead as "Is remote work acceptable?" with "Yes" and "No" radios is answered there.
  async function chooseRemote(where: string, value: unknown): Promise<void> {
    const box = seen(page.getByRole("checkbox", { name: /remote (ok|work)/i })).first();
    if (await box.count()) {
      const want = saysYes(value);
      if ((await box.isChecked().catch(() => !want)) === want) return;
      await box.setChecked(want).catch(() => undefined);
      if ((await box.isChecked().catch(() => !want)) !== want) await box.setChecked(want, { force: true });
      return;
    }
    const group = seen(page.getByRole("radiogroup", { name: /remote work/i })).first();
    if (!(await group.count())) unbound(where, `no "Remote OK" box and no "Is remote work acceptable?" choice on ${page.url()}; it offers ${await offered()}`);
    const answer = saysYes(value) ? "Yes" : "No";
    const radio = group.getByRole("radio", { name: answer, exact: true });
    if (await radio.isChecked().catch(() => false)) return;
    await group.getByText(answer, { exact: true }).first().click();
    if (!(await radio.isChecked().catch(() => false))) await radio.check({ force: true }).catch(() => undefined);
  }

  // "Skills (required)" opens a list of skills to pick from, and keeps it open while more are
  // picked; each pick is drawn beside the button as a row of "Skills selections" with its
  // own "Remove <skill>" button. The list given is the list kept: others are removed.
  async function chooseSkills(where: string, value: unknown): Promise<void> {
    const wanted = [value].flat().map(textOf).map((one) => one.trim()).filter(Boolean);
    const picked = seen(page.getByRole("grid", { name: /skills selections/i }).getByRole("row"));
    const already: string[] = [];
    for (let i = 0; i < (await picked.count()); i++) already.push((await picked.nth(i).innerText()).trim().split("\n")[0]);
    for (const old of already) {
      if (wanted.some((one) => one.toLowerCase() === old.toLowerCase())) continue;
      const remove = seen(page.getByRole("button", { name: new RegExp(`^remove ${escapeRx(old)}\\b`, "i") })).first();
      if (await remove.count()) await remove.click();
    }
    const missing = wanted.filter((one) => !already.some((old) => old.toLowerCase() === one.toLowerCase()));
    if (!missing.length) return;
    const opener = seen(page.getByRole("button", { name: /skills/i })).first();
    if (!(await opener.count())) unbound(where, `no "Skills" chooser on ${page.url()}; it offers ${await offered()}`);
    await opener.click();
    const list = seen(page.getByRole("listbox", { name: /skills/i })).last();
    await list.waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    for (const skill of missing) {
      if (!(await list.isVisible().catch(() => false))) await opener.click();
      const option = list.getByRole("option", { name: new RegExp(`^\\s*${escapeRx(skill)}\\s*$`, "i") });
      if (!(await option.count())) {
        const names = (await list.getByRole("option").allInnerTexts().catch(() => [] as string[])).map((one) => one.trim()).filter(Boolean);
        await page.keyboard.press("Escape").catch(() => undefined);
        unbound(where, `the "Skills" chooser on ${page.url()} offers no skill "${skill}"; it offers ${names.join(", ")}`);
      }
      await option.first().click();
    }
    if (await list.isVisible().catch(() => false)) await page.keyboard.press("Escape").catch(() => undefined);
  }

  const escapeRx = (words: string): string => words.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Every value the test gave, entered in the Code With Us form before anything is pressed.
  async function fillCwuForm(where: string, input: unknown): Promise<void> {
    const remote = given(input, CWU_REMOTE);
    if (remote !== undefined && remote !== null) await chooseRemote(where, remote);
    const skills = given(input, CWU_SKILLS);
    if (skills !== undefined && skills !== null) await chooseSkills(where, skills);
    await fillFrom(where, input, CWU_FIELDS, [...CWU_REMOTE, ...CWU_SKILLS, ...CWU_FILES]);
    const files = given(input, CWU_FILES);
    for (const file of [files ?? []].flat()) await addAttachmentFile(where, file);
  }

  // The form's own action, and the confirmation it asks for ("Publish this opportunity?"
  // with "Publish opportunity"). An action the form accepts lands on the new opportunity's
  // management screen; one it refuses stays on the form with its messages.
  async function cwuSubmit(member: string, input: unknown, name: RegExp): Promise<void> {
    const where = cwuNew.where(member);
    // The form is offered to the administrator and public sector staff; anybody else (a
    // vendor, a visitor) is answered "Page not found", which is the refusal itself. It is
    // logged, not thrown: the test's own follow-up reading decides what the refusal means.
    await ready();
    const why = await whyNotHere();
    if (why && !actingMay(/^create opportunity$/i)) {
      noteRefusal(
        `${where} — /opportunities/code-with-us/create answered ${actingId()} with ${why.replace(/\n+/g, " ")} at ${page.url()}; only a person who may create an opportunity is offered the form`,
      );
      return;
    }
    if (why) {
      unbound(where, `/opportunities/code-with-us/create did not open at ${page.url()} for ${actingId()}, who may create an opportunity: ${why.replace(/\n+/g, " ")}`);
    }
    await cwuNew.on(member);
    await fillCwuForm(where, input);
    await press(where, name);
    await confirmIfAsked(where, /^\s*(publish|submit|save)( opportunity| for review| draft)?\s*$/i);
    // Accepted, it lands on the new opportunity's management screen; refused, it stays on
    // the form with an alert ("This opportunity has N problems").
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      if (/\/edit$/.test(new URL(page.url()).pathname)) break;
      if (await seen(page.getByRole("alert")).count()) break;
      await page.waitForTimeout(250);
    }
    await ready();
  }

  // "Add attachment" opens the file chooser; the file is listed as "New: <name>, <size>.",
  // with a "Name for <name> (optional)" box, until the form is saved. The row reads
  // "Uploading…" first; the action returns only once the upload has ended, either with the
  // row's "Download <name>" link to /api/files/<id> or with its alert ("<name> is too large
  // to attach", "<name> could not be attached").
  async function addAttachmentFile(where: string, input: unknown): Promise<void> {
    const control = /^\s*add attachment\s*$/i;
    const adder = await findControl(page, control);
    if (!adder) {
      unbound(where, `no "Add attachment" control on ${page.url()}; it offers ${await offered()}`);
    }
    // The Sprint With Us and Team With Us create forms once drew "Attachments" with a disabled
    // "Add attachment"; on the current build they offer it enabled, as the Code With Us form
    // does. A disabled one is the page holding it back, and is reported at once.
    if (await isDisabled(adder!)) {
      const note = lined(await attachmentRegion().innerText().catch(() => ""))
        .filter((line) => !/^\s*(attachments|add attachment)\s*$/i.test(line))
        .join(" ");
      throw new Error(`${where} — "Add attachment" is disabled on ${page.url()}${note ? `, which says "${note}"` : ""}`);
    }
    const name = await offerFile(where, control, input);
    const region = attachmentRegion();
    const row = seen(region.getByRole("listitem")).filter({ hasText: name }).last();
    const ended = new RegExp(`${escapeRx(name)}.*(too large to attach|could not be attached)`, "i");
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      if (await row.count()) {
        const stored = await row
          .getByRole("link", { name: new RegExp(`^\\s*download\\b`, "i") })
          .evaluateAll((links) => links.some((link) => (link.getAttribute("href") ?? "").includes("/api/files/")))
          .catch(() => false);
        if (stored) return;
        const alerts = await seen(row.getByRole("alert")).allInnerTexts().catch(() => [] as string[]);
        if (alerts.some((said) => ended.test(said.replace(/\s+/g, " ")))) return;
      }
      const regionAlerts = await seen(region.getByRole("alert")).allInnerTexts().catch(() => [] as string[]);
      if (regionAlerts.some((said) => ended.test(said.replace(/\s+/g, " ")))) return;
      await page.waitForTimeout(100);
    }
    const shown = (await row.count()) ? lined(await row.innerText().catch(() => "")).join(" / ") : "no row naming it";
    throw new Error(`${where} — "${name}" was offered on ${page.url()} and after 30 s its row carries neither a "Download ${name}" link nor an alert that it could not be attached (${shown})`);
  }

  const opportunityCwuCreate: S.OpportunityCwuCreatePage = {
    open: () => cwuNew.open(),
    saveDraft: (input) => cwuSubmit("save_draft", input, /^\s*save draft\s*$/i),
    submitForReview: (input) => cwuSubmit("submit_for_review", input, /^\s*submit for review\s*$/i),
    publish: (input) => cwuSubmit("publish", input, /^\s*publish\s*$/i),
    addAttachment: async (input) => {
      await cwuNew.on("add_attachment");
      await addAttachmentFile(cwuNew.where("add_attachment"), input);
    },
    fieldError: () => cwuNew.messages("field_error"),
  };

  // ---------------------------------------------------------------- the Sprint With Us and Team With Us forms
  //
  // Walked signed in as the administrator and as a public sector employee, both open as one
  // long form of regions: "Overview" (Title, Teaser, Location, "Is remote work acceptable?"
  // Yes/No, "Remote work description"), the budget ("Total maximum budget" for Sprint With
  // Us with "Skills (required)"; "Maximum budget" for Team With Us), "Description", "Key
  // dates" (Proposal deadline and Assignment date; Team With Us adds "Start date" and
  // "Completion date (optional)"), then "Phases" (Sprint With Us: an "Implementation phase"
  // group with its own Start and Completion dates, and "Add an inception phase" / "Add a
  // prototype phase") or "Resources" (Team With Us: "Resource 1" with a "Service area"
  // chooser and "Target allocation (% of full time)", and "Add a resource"), then "Team
  // questions" / "Resource questions" ("Question 1" with Question, Guideline for evaluators,
  // Maximum score, Minimum score and Response word limit, and "Add a team question" / "Add a
  // resource question"), "Scoring weights" (percentages, with a "Total: N%" status),
  // "Evaluation panel" ("Panel member 1" with a "Public sector employee" chooser and
  // "Evaluator" and "Chair" boxes, and "Add a panel member") and a disabled "Add
  // attachment". Under them the "Opportunity actions" group offers the administrator "Save
  // draft" and "Publish" (which asks "Publish this opportunity?" with "Publish opportunity")
  // and a public sector employee "Save draft" and "Submit for review". An accepted save
  // lands on the new opportunity's management screen; a refused one stays on the form with
  // an alert ("The opportunity was not saved") and the field marked invalid with its reason.
  const PROGRAM_FIELDS: Record<string, RegExp> = {
    ...CWU_FIELDS,
    maxBudget: /^\s*(total\s+)?maximum budget\b/i,
    totalMaxBudget: /^\s*(total\s+)?maximum budget\b/i,
    budget: /^\s*(total\s+)?maximum budget\b/i,
    startDate: /^\s*start date\b/i,
    completionDate: /^\s*completion date\b/i,
  };
  const QUESTION_FIELDS: [string, RegExp, string[]][] = [
    ["question", /^\s*question\b/i, ["question", "text", "prompt"]],
    ["guideline", /^\s*guideline\b/i, ["guideline", "guidelines", "guidance"]],
    ["maximum_score", /^\s*maximum score\b/i, ["maximumScore", "maxScore", "score"]],
    ["minimum_score", /^\s*minimum score\b/i, ["minimumScore", "minScore"]],
    ["response_word_limit", /^\s*response word limit\b/i, ["responseWordLimit", "wordLimit", "words"]],
  ];
  const WEIGHT_FIELDS: [RegExp, string[]][] = [
    [/^\s*(team|resource) questions \(%\)/i, ["questions", "teamQuestions", "resourceQuestions", "questionsWeight", "teamQuestionsWeight", "resourceQuestionsWeight"]],
    [/^\s*code challenge \(%\)/i, ["codeChallenge", "codeChallengeWeight"]],
    [/^\s*team scenario \(%\)/i, ["teamScenario", "scenario", "teamScenarioWeight"]],
    [/^\s*challenge \(%\)/i, ["challenge", "challengeWeight"]],
    [/^\s*price \(%\)/i, ["price", "priceWeight"]],
  ];
  const PHASE_KEYS = ["phases", "phase", "inception", "prototype", "implementation"];
  const QUESTION_KEYS = ["questions", "teamQuestions", "resourceQuestions", "evaluationQuestions"];
  const RESOURCE_KEYS = ["resources", "resource"];
  const PANEL_KEYS = ["panel", "evaluationPanel", "panelMembers", "evaluators"];
  const WEIGHT_KEYS = ["weights", "scoringWeights", ...WEIGHT_FIELDS.flatMap(([, keys]) => keys)];

  // The name the seed's account files give the account with this identifier and email, or
  // "" when the seed cannot be read or holds no such row.
  function seededName(id: string, email: string): string {
    if (!id || !email) return "";
    const row = new RegExp(`'${escapeRx(id)}'[^()]*?'((?:[^']|'')+)',\\s*'${escapeRx(email)}'`);
    for (const file of ["001-users.sql", "008-more-accounts.sql"]) {
      try {
        const found = row.exec(readFileSync(new URL(`../../seed/${file}`, import.meta.url), "utf8"));
        if (found) return found[1].replace(/''/g, "'");
      } catch {
        // A seed file that cannot be read names nobody.
      }
    }
    return "";
  }

  // A person as the panel's chooser names them: the seeded account's name, or failing that
  // the name the service holds for that account.
  async function personName(value: unknown): Promise<string> {
    const named = givenText(value, ["name"]);
    if (named) return named;
    const person = personOf(value);
    if (person) {
      const users = seedGroups.users ?? {};
      const found = Object.values(users).find((each) => (person.id && each.id === person.id) || (person.email && each.email === person.email));
      const seeded = found && typeof (found as Record<string, unknown>).name === "string" ? String((found as Record<string, unknown>).name) : "";
      if (seeded) return seeded;
      if (person.id) {
        const answer = await page.request.get(`${baseURL}/api/users/${person.id}`).catch(() => null);
        const body = answer && answer.ok() ? ((await answer.json().catch(() => ({}))) as Record<string, unknown>) : {};
        if (typeof body.name === "string" && body.name) return body.name;
      }
      // Only the administrator may read another account (public sector staff are answered
      // "You are not permitted to read that account."), and the chooser lists names alone,
      // rendered with the form. The seed that made the account names it, just before its
      // email, in the row its identifier opens.
      const fromSeed = seededName(person.id, person.email);
      if (fromSeed) return fromSeed;
    }
    return typeof value === "string" ? value : "";
  }

  function programForm(pageId: string, route: string, kind: "sprint" | "team") {
    const screen = signedInScreen(pageId, route);
    const where = screen.where;
    const questionsRegion = (): Locator =>
      seen(regionNamed(page, kind === "sprint" ? /^team questions$/i : /^resource questions$/i)).first();
    const addQuestionName = kind === "sprint" ? /^\s*add a team question\s*$/i : /^\s*add a resource question\s*$/i;

    // A chooser drawn as a button that opens a list of options ("Service area", "Public
    // sector employee", "Skills").
    async function choose(member: string, scope: Locator, button: RegExp, value: string): Promise<void> {
      const opener = seen(scope.getByRole("button", { name: button })).first();
      if (!(await opener.count())) unbound(where(member), `no chooser named ${button} on ${page.url()}; it offers ${await offered()}`);
      await opener.click();
      const list = seen(page.getByRole("listbox")).last();
      await list.waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
      const option = list.getByRole("option", { name: new RegExp(`^\\s*${escapeRx(value)}\\s*$`, "i") });
      if (!(await option.count())) {
        const names = (await list.getByRole("option").allInnerTexts().catch(() => [] as string[])).map((one) => one.trim()).filter(Boolean);
        await page.keyboard.press("Escape").catch(() => undefined);
        unbound(where(member), `the chooser named ${button} on ${page.url()} offers no "${value}"; it offers ${names.join(", ") || "nothing"}`);
      }
      await option.first().click();
      await settle();
    }

    async function fillBox(member: string, scope: Locator, label: RegExp, key: string, value: unknown): Promise<void> {
      const box = seen(scope.getByRole("textbox", { name: label })).first();
      if (!(await box.count())) unbound(where(member), `no field labelled ${label} on ${page.url()} takes "${key}"`);
      await enter(where(member), key, box, value);
    }

    // The last question group of the list, or the one at a place in it (the first is 1).
    function questionGroup(at?: number): Locator {
      const groups = seen(questionsRegion().getByRole("group", { name: /^question \d+$/i }));
      return at ? seen(questionsRegion().getByRole("group", { name: new RegExp(`^question ${at}$`, "i") })).first() : groups.last();
    }

    async function fillQuestion(member: string, group: Locator, input: unknown): Promise<void> {
      if (typeof input === "string") {
        await fillBox(member, group, QUESTION_FIELDS[0][1], "question", input);
        return;
      }
      for (const [name, label, keys] of QUESTION_FIELDS) {
        const value = given(input, [name, ...keys]);
        if (value !== undefined && value !== null) await fillBox(member, group, label, name, value);
      }
    }

    // A question still blank: its Question and Guideline boxes both empty.
    async function isBlankQuestion(group: Locator): Promise<boolean> {
      if (!(await group.count())) return false;
      for (const [, label] of QUESTION_FIELDS.slice(0, 2)) {
        const box = seen(group.getByRole("textbox", { name: label })).first();
        if (!(await box.count())) return false;
        if ((await box.inputValue().catch(() => "x")).trim()) return false;
      }
      return true;
    }

    // The form opens with "Question 1" already there, blank: while it is still the only
    // question and still blank it takes the one given; otherwise "Add a team question" /
    // "Add a resource question" makes room for it. (Only the opening row is reused, so a
    // question given with no text still counts as one more question.)
    async function addQuestion(member: string, input: unknown): Promise<void> {
      await screen.on(member);
      const groups = seen(questionsRegion().getByRole("group", { name: /^question \d+$/i }));
      const reuse = (await groups.count()) === 1 && (await isBlankQuestion(questionGroup(1)));
      if (!reuse) await press(where(member), addQuestionName, questionsRegion());
      await fillQuestion(member, questionGroup(), input);
    }

    async function addPhase(member: string, input: unknown): Promise<void> {
      await screen.on(member);
      const named = (typeof input === "string" ? input : givenText(input, ["phase", "kind", "type", "name"])).toLowerCase();
      const region = seen(regionNamed(page, /^phases$/i)).first();
      if (!(await region.count())) unbound(where(member), `no "Phases" section on ${page.url()}; it offers ${await offered()}`);
      let phase = /inception/.test(named) ? "inception" : /implementation/.test(named) ? "implementation" : /prototype/.test(named) ? "prototype" : "";
      if (!phase) {
        // Named no phase: the first the form still offers to add, the prototype before the
        // inception phase (an inception phase is taken only with a prototype phase).
        for (const one of ["prototype", "inception"]) {
          if (await seen(region.getByRole("button", { name: new RegExp(`^\\s*add an? ${one} phase\\s*$`, "i") })).count()) {
            phase = one;
            break;
          }
        }
        if (!phase) unbound(where(member), `the "Phases" section on ${page.url()} offers no phase to add (it offers ${(await region.getByRole("button").allInnerTexts()).join(", ")})`);
      }
      // The implementation phase is always there; the others are added.
      if (phase !== "implementation" && !(await seen(region.getByRole("group", { name: new RegExp(`^${phase} phase$`, "i") })).count())) {
        await press(where(member), new RegExp(`^\\s*add an? ${phase} phase\\s*$`, "i"), region);
      }
      const group = seen(region.getByRole("group", { name: new RegExp(`^${phase} phase$`, "i") })).first();
      const start = given(input, ["startDate", "start"]);
      const end = given(input, ["completionDate", "endDate", "completion", "end"]);
      if (start !== undefined && start !== null) await fillBox(member, group, /^\s*start date\b/i, "startDate", start);
      if (end !== undefined && end !== null) await fillBox(member, group, /^\s*completion date\b/i, "completionDate", end);
    }

    async function addResource(member: string, input: unknown): Promise<void> {
      await screen.on(member);
      const region = seen(regionNamed(page, /^resources$/i)).first();
      if (!(await region.count())) unbound(where(member), `no "Resources" section on ${page.url()}; it offers ${await offered()}`);
      // The form opens with "Resource 1" already there, its "Service area" chooser reading
      // "Select an item": a resource still blank like that takes the one given; otherwise
      // "Add a resource" makes room for it.
      const last = seen(region.getByRole("group", { name: /^resource \d+$/i })).last();
      const blank =
        (await last.count()) &&
        /^\s*select an item\s*$/i.test(await seen(last.getByRole("button", { name: /service area/i })).first().innerText().catch(() => ""));
      if (!blank) await press(where(member), /^\s*add a resource\s*$/i, region);
      const group = seen(region.getByRole("group", { name: /^resource \d+$/i })).last();
      const area = typeof input === "string" ? input : givenText(input, ["serviceArea", "area", "role"]);
      if (area) {
        // "FULL_STACK_DEVELOPER" is offered as "Full Stack Developer".
        const words = /^[A-Z_]+$/.test(area) ? area.toLowerCase().replace(/_/g, " ") : area;
        await choose(member, group, /service area/i, words);
      }
      const allocation = given(input, ["targetAllocation", "allocation", "percentage"]);
      if (allocation !== undefined && allocation !== null) await fillBox(member, group, /target allocation/i, "targetAllocation", allocation);
    }

    // The panel given is the panel kept: each member chosen in turn ("Panel member N"), with
    // its Evaluator and Chair boxes set when the input says, and any member past them removed.
    async function setPanel(member: string, input: unknown): Promise<void> {
      await screen.on(member);
      const region = seen(regionNamed(page, /^evaluation panel$/i)).first();
      if (!(await region.count())) unbound(where(member), `no "Evaluation panel" section on ${page.url()}; it offers ${await offered()}`);
      const members = [Array.isArray(input) ? input : given(input, ["members", ...PANEL_KEYS]) ?? input].flat().filter((one) => one !== undefined && one !== null);
      if (!members.length) unbound(where(member), `the input names nobody for the panel (${JSON.stringify(input)})`);
      const groups = () => seen(region.getByRole("group", { name: /^panel member \d+$/i }));
      // A chair named beside the members ({ members, chair }) rather than flagged on one of
      // them: the member it names gets the Chair box, and every other member goes without.
      const named = Array.isArray(input) ? undefined : given(input, ["chair", "panelChair", "chairperson"]);
      let chairAt = -1;
      if (named !== undefined && named !== null && typeof named !== "boolean") {
        if (typeof named === "number" && Number.isInteger(named) && named >= 0 && named < members.length) chairAt = named;
        else {
          const chairName = (await personName(given(named, ["user", "person", "member", "evaluator"]) ?? named)).toLowerCase();
          for (let i = 0; i < members.length && chairAt < 0; i++) {
            const one = members[i];
            if (one === named || (chairName && (await personName(given(one, ["user", "person", "member", "evaluator"]) ?? one)).toLowerCase() === chairName)) chairAt = i;
          }
        }
        if (chairAt < 0) unbound(where(member), `the chair the input names (${JSON.stringify(named)}) is none of the members it gives for the panel`);
      }
      for (let i = 0; i < members.length; i++) {
        if ((await groups().count()) <= i) await press(where(member), /^\s*add a panel member\s*$/i, region);
        const group = seen(region.getByRole("group", { name: new RegExp(`^panel member ${i + 1}$`, "i") })).first();
        const one = members[i];
        const name = await personName(given(one, ["user", "person", "member", "evaluator"]) ?? one);
        if (!name) unbound(where(member), `panel member ${i + 1} of the input names nobody the chooser could offer (${JSON.stringify(one)})`);
        const opener = seen(group.getByRole("button", { name: /public sector employee/i })).first();
        if (((await opener.innerText().catch(() => "")).trim().toLowerCase()) !== name.toLowerCase()) {
          await choose(member, group, /public sector employee/i, name);
        }
        for (const [box, keys] of [[/^\s*evaluator\s*$/i, ["evaluator", "isEvaluator"]], [/^\s*chair\b/i, ["chair", "isChair"]]] as [RegExp, string[]][]) {
          const said = chairAt >= 0 && keys[0] === "chair" ? chairAt === i : given(one, keys);
          if (said === undefined || said === null) continue;
          const tick = seen(group.getByRole("checkbox", { name: box })).first();
          if (!(await tick.count())) unbound(where(member), `panel member ${i + 1} on ${page.url()} offers no box named ${box}`);
          if ((await tick.isChecked()) !== saysYes(said)) await tick.click();
        }
      }
      for (let n = await groups().count(); n > members.length; n--) {
        await press(where(member), new RegExp(`^\\s*remove panel member ${n}\\s*$`, "i"), region);
      }
    }

    async function fillWeights(member: string, input: unknown): Promise<void> {
      const weights = { ...record(input), ...record(given(input, ["weights", "scoringWeights"])) };
      const region = seen(regionNamed(page, /^scoring weights$/i)).first();
      for (const [label, keys] of WEIGHT_FIELDS) {
        const value = given(weights, keys);
        if (value === undefined || value === null) continue;
        await fillBox(member, region, label, keys[0], value);
      }
    }

    // Every value the test gave, entered before anything is pressed.
    async function fillForm(member: string, input: unknown): Promise<void> {
      const remote = given(input, CWU_REMOTE);
      if (remote !== undefined && remote !== null) await chooseRemote(where(member), remote);
      const skills = given(input, CWU_SKILLS);
      if (skills !== undefined && skills !== null) await chooseSkills(where(member), skills);
      // The Sprint With Us form has no start or completion date of its own: "Key dates" holds
      // only the proposal deadline and the assignment date, and every "Start date" and
      // "Completion date" box sits inside a phase group (walked as the administrator with the
      // implementation and prototype phases shown). A start or completion date given for the
      // opportunity as a whole therefore has no box here, and is never written into a phase's
      // (the first "Completion date" on the page is the prototype phase's); the phases' own
      // dates come from addPhase.
      const phaseDates = kind === "sprint" ? ["startDate", "completionDate", "endDate"] : [];
      for (const key of phaseDates) {
        if (given(input, [key]) !== undefined) {
          noteRefusal(`${where(member)} — "${key}" names the opportunity's own date, which the Sprint With Us form at ${page.url()} does not take (its dates belong to the phase groups); left to the phases`);
        }
      }
      await fillFrom(where(member), input, PROGRAM_FIELDS, [...CWU_REMOTE, ...CWU_SKILLS, ...PHASE_KEYS, ...QUESTION_KEYS, ...RESOURCE_KEYS, ...PANEL_KEYS, ...WEIGHT_KEYS, ...phaseDates]);
      for (const [key, value] of Object.entries(record(input))) {
        if (squash(key) === "phases") for (const one of [value].flat()) await addPhase(member, one);
        else if (["inception", "prototype", "implementation"].includes(squash(key))) await addPhase(member, { ...record(value), phase: key });
      }
      const resources = given(input, RESOURCE_KEYS);
      if (resources !== undefined && resources !== null) for (const one of [resources].flat()) await addResource(member, one);
      const questions = given(input, QUESTION_KEYS);
      if (questions !== undefined && questions !== null) {
        // The first question is already on the form, blank; it takes the first one given.
        const list = [questions].flat();
        for (let i = 0; i < list.length; i++) {
          if (i === 0 && (await questionGroup(1).count())) await fillQuestion(member, questionGroup(1), list[0]);
          else await addQuestion(member, list[i]);
        }
      }
      await fillWeights(member, input);
      const panel = given(input, PANEL_KEYS);
      if (panel !== undefined && panel !== null) await setPanel(member, panel);
    }

    // The form's own actions. The form is offered to the administrator and public sector
    // staff; anybody else is answered "Page not found", and a person is offered only the
    // actions they may take (the administrator no "Submit for review", a public sector
    // employee no "Publish"). Either is the refusal itself, logged rather than thrown, so the
    // test's own follow-up reading decides.
    async function submit(member: string, input: unknown, name: RegExp): Promise<void> {
      await ready();
      const why = await whyNotHere();
      if (why && !actingMay(/^create opportunity$/i)) {
        noteRefusal(`${where(member)} — ${route} answered ${actingId()} with ${why.replace(/\n+/g, " ")} at ${page.url()}; only a person who may create an opportunity is offered the form`);
        return;
      }
      await screen.on(member);
      const actions = seen(page.getByRole("group", { name: /^opportunity actions$/i })).first();
      if (!(await actions.count())) unbound(where(member), `no "Opportunity actions" on ${page.url()}; it offers ${await offered()}`);
      const control = seen(actions.getByRole("button", { name })).first();
      if (!(await control.count())) {
        const there = (await actions.getByRole("button").allInnerTexts()).map((one) => `"${one.trim()}"`).join(", ");
        noteRefusal(`${where(member)} — no control named ${name} among the actions ${actingId()} is offered on ${page.url()} (${there})`);
        return;
      }
      await fillForm(member, input);
      if (await isDisabled(control)) throw new Error(`${where(member)} — the control named ${name} is disabled on ${page.url()}`);
      await control.click();
      await settle();
      await confirmIfAsked(where(member), /^\s*(publish|submit|save)( opportunity| for review| draft)?\s*$/i);
      const deadline = Date.now() + 10000;
      while (Date.now() < deadline) {
        if (/\/edit$/.test(new URL(page.url()).pathname)) break;
        if (await seen(page.getByRole("alert")).count()) break;
        await page.waitForTimeout(250);
      }
      await ready();
    }

    return {
      open: () => screen.open(),
      saveDraft: (input?: unknown) => submit("save_draft", input, /^\s*save draft\s*$/i),
      submitForReview: (input?: unknown) => submit("submit_for_review", input, /^\s*submit for review\s*$/i),
      publish: (input?: unknown) => submit("publish", input, /^\s*publish\s*$/i),
      addQuestion,
      addPhase,
      addResource,
      setPanel,
      fillForm,
      fieldError: () => screen.messages("field_error"),
      // The weights are shown as a "Total: N%" status; only a message the form raises about
      // them is an error. A total other than 100% raised none when saved or put forward.
      scoreWeightError: () => screen.messages("score_weight_error", /weight|total|100\s*%/i),
      // The fields one question offers, in the criteria's words, one per line, for the
      // question at a given place (the first by default); empty when there is none there.
      evaluationQuestionFields: async (place?: unknown): Promise<string> => {
        const member = "evaluation_question_fields";
        await screen.on(member);
        if (!(await questionsRegion().count())) {
          unbound(where(member), `no "${kind === "sprint" ? "Team" : "Resource"} questions" section on ${page.url()}; it offers ${await offered()}`);
        }
        const at = Number(typeof place === "object" ? given(place, ["position", "index", "place", "question"]) : place) || 1;
        const group = questionGroup(at);
        if (!(await group.count())) return "";
        const names = await group.getByRole("textbox").evaluateAll((boxes) =>
          boxes.map((box) => ((box as HTMLInputElement).labels?.[0]?.innerText ?? box.getAttribute("aria-label") ?? "").trim()),
        );
        return names
          .map((label) => QUESTION_FIELDS.find(([, pattern]) => pattern.test(label))?.[0] ?? label.replace(/\(.*?\)/g, "").trim().toLowerCase().replace(/\W+/g, "_"))
          .join("\n");
      },
    };
  }

  const swuForm = programForm("opportunity-swu-create", "/opportunities/sprint-with-us/create", "sprint");
  const opportunitySwuCreate: S.OpportunitySwuCreatePage = {
    open: swuForm.open,
    saveDraft: swuForm.saveDraft,
    submitForReview: swuForm.submitForReview,
    publish: swuForm.publish,
    addPhase: (input) => swuForm.addPhase("add_phase", input),
    addTeamQuestion: (input) => swuForm.addQuestion("add_team_question", input),
    setEvaluationPanel: (input) => swuForm.setPanel("set_evaluation_panel", input),
    fieldError: swuForm.fieldError,
    scoreWeightError: swuForm.scoreWeightError,
    evaluationQuestionFields: swuForm.evaluationQuestionFields,
  };

  const twuForm = programForm("opportunity-twu-create", "/opportunities/team-with-us/create", "team");
  const opportunityTwuCreate: S.OpportunityTwuCreatePage = {
    open: twuForm.open,
    saveDraft: twuForm.saveDraft,
    submitForReview: twuForm.submitForReview,
    publish: twuForm.publish,
    addResource: (input) => twuForm.addResource("add_resource", input),
    addResourceQuestion: (input) => twuForm.addQuestion("add_resource_question", input),
    setEvaluationPanel: (input) => twuForm.setPanel("set_evaluation_panel", input),
    fieldError: twuForm.fieldError,
    scoreWeightError: twuForm.scoreWeightError,
    evaluationQuestionFields: twuForm.evaluationQuestionFields,
  };

  // ---------------------------------------------------------------- an organization's terms
  //
  // Walked as the seeded organization's owner and as the service administrator: the screen
  // draws the organization's legal name over the heading "Sprint With Us Terms & Conditions" /
  // "Team With Us Terms & Conditions", then the region "Terms and conditions" holding the terms
  // body. Unaccepted, the owner is offered "Accept terms and conditions" and "Cancel" (accepting
  // returns to the matching qualification section), and anyone else reads "<legal name> has not
  // accepted these terms. …" over "Back to the organization". Once accepted it shows the
  // paragraph "<legal name> accepted these terms on <date>" and only "Back to the organization".
  function orgTermsScreen(pageId: string, route: string) {
    const screen = signedInScreen(pageId, route);
    return {
      open: (params: Record<string, string>) => screen.open(params),
      acceptTerms: async (): Promise<void> => {
        await screen.press("accept_terms", /^\s*accept terms and conditions\s*$/i);
        await confirmIfAsked(screen.where("accept_terms"), /accept/i);
      },
      cancel: () => screen.press("cancel", /^\s*cancel\s*$/i),
      termsBody: async (): Promise<string> => {
        await screen.on("terms_body");
        const region = seen(regionNamed(page.getByRole("main"), /^\s*terms and conditions\s*$/i)).first();
        return (await region.count()) ? (await region.innerText()).trim() : "";
      },
      // Empty while the terms are unaccepted.
      acceptedOnNotice: async (): Promise<string> => {
        await screen.on("accepted_on_notice");
        const said = (await paragraphs(page.getByRole("main"))).map((one) => one.replace(/\s+/g, " ").trim());
        return said.filter((one) => /\baccepted these terms on\b/i.test(one)).join("\n");
      },
    };
  }

  // ---------------------------------------------------------------- an organization's own screen

  const orgEdit = signedInScreen("organization-edit", "/organizations/:orgId/edit");
  // Walked signed in as the organization owner on the seeded qualified organization: the
  // screen's sections are links under the navigation "Organization sections" — "Organization"
  // (?tab=organization, the one shown first), "Team members" (?tab=team), "Sprint With Us
  // qualification", "Team With Us qualification" and "Changelog" — and each section's content
  // is the region named as its link is. The Organization region holds "Edit organization" over
  // the read-only profile, and the region "Archive this organization" holds "Archive
  // organization".
  const ORG_TAB = {
    organization: /^\s*organization\s*$/i,
    team: /^\s*team( members)?\s*$/i,
    swu: /sprint with us/i,
    twu: /team with us/i,
    changelog: /history|change\s*log/i,
  };
  async function orgSectionLink(name: RegExp): Promise<Locator | null> {
    const link = seen(page.getByRole("navigation", { name: /organization sections/i }).getByRole("link", { name }));
    if (await link.count()) return link.first();
    const tab = seen(page.getByRole("tab", { name }));
    return (await tab.count()) ? tab.first() : null;
  }
  // The region named as a section's link is, once that link has been followed; null when the
  // screen draws no such region.
  async function orgSectionRegion(tab: Locator): Promise<{ label: string; region: Locator | null }> {
    const label = (await tab.innerText()).replace(/\s+/g, " ").trim();
    await tab.click();
    await settle();
    await ready();
    const exactly = new RegExp(`^\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i");
    const region = seen(regionNamed(page.getByRole("main"), exactly)).first();
    await region.waitFor({ state: "visible", timeout: 10000 }).catch(() => undefined);
    return { label, region: (await region.count()) ? region : null };
  }
  // Opens a section for a member that acts or reads inside it. A section the build draws but
  // has not filled — both qualification sections once said only "This section is not
  // available yet."; on the current build they draw the requirements, the approved service
  // areas and "Read the … terms and conditions" — offers none of what the member needs,
  // which is unbound, not empty. Team members and Changelog are drawn: the Changelog region holds the table
  // "Changes to administrator rights and ownership, newest first" (Date | Change | Member |
  // Made by, e.g. "Admin Rights Given") or, with none, "No administrator rights have been
  // given or withdrawn, and ownership has not been transferred."
  async function orgTabOpen(member: string, name: RegExp): Promise<void> {
    await orgEdit.on(member);
    const tab = await orgSectionLink(name);
    if (!tab) unbound(orgEdit.where(member), `no section named ${name} under "Organization sections" on ${page.url()}; it offers ${await offered()}`);
    const { label, region } = await orgSectionRegion(tab);
    const said = region ? (await region.innerText()).trim() : "";
    if (/not available yet/i.test(said)) {
      unbound(
        orgEdit.where(member),
        `opened the "${label}" section of ${page.url()} (as the organization's owner, from "Organization sections"); it draws the heading "${label}" and only "${lined(said).filter((line) => line !== label).join(" ")}", with no control, table or notice in it`,
      );
    }
  }
  // A section's content: the region named as its link is. A screen that opened without that
  // section, or whose section draws no region of that name, reads as nothing — never as the
  // text of another section.
  async function orgSection(member: string, name: RegExp): Promise<string> {
    await orgEdit.on(member);
    const tab = await orgSectionLink(name);
    if (!tab) return "";
    const { region } = await orgSectionRegion(tab);
    return region ? (await region.innerText()).trim() : "";
  }
  // The message of every field marked invalid on an organization's form — the last of what
  // describes it, its hint coming first — or nothing when no field is.
  async function orgFieldErrors(): Promise<string> {
    const said: string[] = [];
    const boxes = seen(page.getByRole("main").getByRole("textbox"));
    for (let i = 0; i < (await boxes.count()); i++) {
      const words = await boxes
        .nth(i)
        .evaluate((element) => {
          if (element.getAttribute("aria-invalid") !== "true") return "";
          const ids = (element.getAttribute("aria-errormessage") ?? element.getAttribute("aria-describedby") ?? "")
            .split(/\s+/)
            .filter(Boolean);
          return ids.length ? (document.getElementById(ids[ids.length - 1])?.innerText ?? "") : "";
        })
        .catch(() => "");
      said.push(...lined(words));
    }
    return [...new Set(said)].join("\n");
  }
  async function orgTabLines(member: string, name: RegExp, pattern: RegExp): Promise<string> {
    await orgTabOpen(member, name);
    return linesMatching(pattern);
  }
  // A requirement's whole list item, status included ("Met …" / "Not met …"); a section that
  // opened without the list, or without that requirement, reads as nothing.
  async function requirementItem(member: string, tab: RegExp, list: RegExp, pattern: RegExp): Promise<string> {
    await orgTabOpen(member, tab);
    const items = seen(page.getByRole("main").getByRole("list", { name: list }).getByRole("listitem"));
    const said = (await items.allInnerTexts()).map((one) => one.replace(/\s+/g, " ").trim());
    return said.filter((one) => pattern.test(one)).join("\n");
  }
  async function boxName(box: Locator): Promise<string> {
    return box.evaluate((element) => {
      const input = element as HTMLInputElement;
      return (element.getAttribute("aria-label") || (input.labels?.[0]?.innerText ?? "")).trim();
    });
  }
  // The service area boxes of the Team With Us qualification section, opening the editor with
  // "Edit service areas" when it is closed; null when the section offers neither.
  async function serviceAreaBoxes(member: string): Promise<Locator | null> {
    const inMain = (): Locator => seen(page.getByRole("main").getByRole("checkbox"));
    if (!(await inMain().count())) {
      await orgTabOpen(member, ORG_TAB.twu);
      const edit = seen(page.getByRole("main").getByRole("button", { name: /^\s*edit service areas\s*$/i })).first();
      if (!(await edit.count())) return null;
      if (await isDisabled(edit)) throw new Error(`${orgEdit.where(member)} — "Edit service areas" is disabled on ${page.url()}`);
      await edit.click();
      await settle();
      await inMain().first().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    }
    const group = seen(page.getByRole("group", { name: /service areas/i }).getByRole("checkbox"));
    if (await group.count()) return group;
    return (await inMain().count()) ? inMain() : null;
  }
  // The form "Edit organization" opens: "Edit organization" over the logo group and the fields,
  // closed by "Save changes" and "Cancel". A form already open is left as it is, so what an
  // earlier step entered in it is kept.
  async function orgEditing(member: string): Promise<void> {
    await orgEdit.on(member);
    if (await seen(page.getByRole("main").getByRole("button", { name: /^\s*save changes\s*$/i })).count()) return;
    await orgTabOpen(member, ORG_TAB.organization);
    const edit = await findControl(page, /^\s*edit( organization)?\s*$/i);
    if (edit && !(await isDisabled(edit))) {
      await edit.click();
      await settle();
    }
  }
  // A row that names the person but offers no such control (the owner's row offers none) is
  // the screen's answer, reported as such rather than as a control never found.
  async function orgInRow(member: string, input: unknown, control: RegExp, confirm: RegExp): Promise<void> {
    await orgTabOpen(member, ORG_TAB.team);
    const where = orgEdit.where(member);
    const row = await rowNaming(where, input, ["users"]);
    if (!(await findControl(row, control))) {
      throw new Error(
        `${where} — the row "${(await row.innerText()).replace(/\s+/g, " ").trim()}" in the team table on ${page.url()} offers no control named ${control}`,
      );
    }
    // The answer to the membership change (DELETE /api/affiliations/<id> for a removal) is
    // awaited before returning: a refusal — "This is the sole owner for the organization, and
    // cannot be removed." under "That change could not be made" — is drawn in the Team members
    // section only once that answer arrives, and a read taken before it would miss it.
    const answered = page
      .waitForResponse(
        (response) =>
          /\/api\/affiliations\b/i.test(response.url()) && response.request().method() !== "GET",
        { timeout: 15000 },
      )
      .catch(() => undefined);
    await press(where, control, row);
    await confirmIfAsked(where, confirm);
    if (await answered) {
      await settle();
      const team = seen(regionNamed(page.getByRole("main"), /^\s*team( members)?\s*$/i)).first();
      await team.getByRole("alert").first().waitFor({ state: "visible", timeout: 2000 }).catch(() => undefined);
    }
  }
  // Walked as the organization's owner and as the administrator on the seeded qualified
  // organization's ?tab=team: the table "Everyone who belongs to or has been invited to this
  // organization" has the columns Name ("Blake Placeholder (you)" on the viewer's own row),
  // Membership ("Owner", "Administrator", "Member", "Pending"), Capabilities (a count) and
  // Actions. The cells of one column, on the rows whose cell matches.
  async function teamColumn(header: RegExp, pattern: RegExp): Promise<string> {
    const at = await columnIndex(header);
    if (at < 0) return "";
    return (await tableRows(seen(page.getByRole("main"))))
      .map((row) => (row.split(" | ")[at] ?? "").trim())
      .filter((cell) => pattern.test(cell))
      .join("\n");
  }
  async function columnIndex(header: RegExp): Promise<number> {
    const headers = seen(page.getByRole("main").getByRole("columnheader"));
    for (let i = 0; i < (await headers.count()); i++) {
      if (header.test((await headers.nth(i).innerText()).trim())) return i;
    }
    return -1;
  }
  // The team table names people only; each row's name is followed by the address and persona
  // of the account it is, looked up from the organization's memberships (each carries its
  // user's identifier and name) and the seed, so that a row can be matched to a persona.
  async function teamRowsNamed(): Promise<string[]> {
    const rows = await tableRows(seen(page.getByRole("main")));
    const orgId = /\/organizations\/([^/?#]+)\/edit/.exec(page.url())?.[1] ?? "";
    const byName = new Map<string, string>();
    const known = await peek(`${baseURL}/api/affiliations?organization=${encodeURIComponent(orgId)}`);
    if (Array.isArray(known.json)) {
      for (const one of known.json) {
        const user = record(record(one).user);
        if (typeof user.name === "string" && user.id !== undefined) byName.set(user.name.trim(), String(user.id));
      }
    }
    const users = Object.values(seedGroups.users ?? {});
    return rows.map((row) => {
      const cells = row.split(" | ");
      const shown = (cells[0] ?? "").replace(/\s*\(you\)\s*$/i, "").trim();
      const id = byName.get(shown);
      const found = users.find((each) => (id && each.id === id) || record(each).name === shown);
      const also = found ? [found.email, found.persona].filter((one) => typeof one === "string" && one) : [];
      if (also.length) cells[0] = `${cells[0]} (${also.join(", ")})`;
      return cells.join(" | ");
    });
  }
  // Making a member an administrator opens the dialog "Give <name> administrator rights?",
  // whose box "I have read this statement and confirm it" must be ticked before its "Give
  // administrator rights" is enabled; withdrawing the rights takes effect at once.
  let orgAdminTermsWanted: boolean | null = null;
  // Set when toggle_member_admin_status leaves the statement dialog open for
  // accept_org_admin_terms to answer; any other member of the screen cancels it first.
  let orgAdminTermsLeftOpen = false;
  async function dismissAdminTerms(): Promise<void> {
    if (!orgAdminTermsLeftOpen) return;
    orgAdminTermsLeftOpen = false;
    const open = dialog();
    if (!(await open.count()) || !(await seen(open.getByRole("checkbox", { name: ADMIN_TERMS })).count())) return;
    const cancel = seen(open.getByRole("button", { name: /^\s*(cancel|close)\s*$/i })).first();
    if (await cancel.count()) await cancel.click().catch(() => undefined);
    else await page.keyboard.press("Escape").catch(() => undefined);
    await open.waitFor({ state: "hidden", timeout: 3000 }).catch(() => undefined);
    await settle();
  }
  const ADMIN_TERMS = /statement|terms|agree|confirm/i;
  const ADMIN_GIVE = /^\s*give administrator rights\s*$/i;
  async function adminTermsDialog(): Promise<Locator | null> {
    const open = dialog();
    await open.waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined);
    if (!(await open.count())) return null;
    return (await seen(open.getByRole("checkbox", { name: ADMIN_TERMS })).count()) ? open : null;
  }
  async function answerAdminTerms(where: string, open: Locator, wanted: boolean): Promise<void> {
    orgAdminTermsLeftOpen = false;
    const box = seen(open.getByRole("checkbox", { name: ADMIN_TERMS })).first();
    await box.setChecked(wanted);
    await settle();
    if (!wanted) return;
    const give = seen(open.getByRole("button", { name: ADMIN_GIVE })).first();
    if (!(await give.count())) unbound(where, `the dialog "${(await open.innerText()).split("\n")[0]}" on ${page.url()} offers no "Give administrator rights"`);
    if (await isDisabled(give)) throw new Error(`${where} — "Give administrator rights" stays disabled with the statement ticked on ${page.url()}`);
    await give.click();
    await settle();
  }
  const organizationEdit: S.OrganizationEditPage = {
    open: (params) => orgEdit.open(params as unknown as Record<string, string>),
    editOrganization: async () => {
      await orgTabOpen("edit_organization", ORG_TAB.organization);
      await press(orgEdit.where("edit_organization"), /^\s*edit( organization)?\s*$/i);
    },
    saveChanges: async (input) => {
      const where = orgEdit.where("save_changes");
      await orgEditing("save_changes");
      const logo = LOGO_KEYS.map((key) => given(input, [key])).find((one) => one !== undefined);
      await fillFrom(where, input, ORG_FIELDS, LOGO_KEYS);
      if (logo !== undefined) await offerFile(where, ORG_LOGO, logo);
      await press(where, /^\s*save( changes)?\s*$/i);
      await confirmIfAsked(where, /^\s*save( changes)?\s*$/i);
    },
    cancelEditing: () => orgEdit.press("cancel_editing", /^\s*cancel\s*$/i),
    archiveOrganization: async () => {
      await orgEdit.press("archive_organization", /^\s*archive( organization)?\s*$/i);
      await confirmIfAsked(orgEdit.where("archive_organization"), /^\s*archive( organization)?\s*$/i);
    },
    addTeamMembers: async (input) => {
      const where = orgEdit.where("add_team_members");
      await orgTabOpen("add_team_members", ORG_TAB.team);
      await press(where, /add team members?/i);
      const emails = [given(input, ["emails", "email", "members", "member", "users"]) ?? input]
        .flat()
        .map((one) => personOf(one)?.email || textOf(one))
        .filter(Boolean);
      if (!emails.length) unbound(where, "the input names nobody to invite");
      const scope = (await dialog().count()) ? dialog() : page;
      const boxes = seen(scope.getByRole("textbox"));
      for (let i = 0; i < emails.length; i++) {
        if ((await boxes.count()) <= i) {
          const more = await findControl(scope, /add (another|more)|^\s*\+\s*$/i);
          if (!more) unbound(where, `the invitation form on ${page.url()} has room for ${await boxes.count()} address(es) and offers no way to add another`);
          await more.click();
        }
        await boxes.nth(i).fill(emails[i]);
      }
      // The dialog "Add team members" says each person "joins the team as a member once they
      // accept" and offers no membership type; a member kind is what it sends, any other kind
      // cannot be entered on it.
      const kind = givenText(input, ["membershipType", "type", "role"]);
      if (kind && !/^\s*member(ship)?\s*$/i.test(kind)) {
        const chooser = await fieldLabelled(/membership|type|role/i, false);
        if (!chooser) unbound(where, `the "Add team members" dialog on ${page.url()} offers only "Email address N" boxes, "Add another email address", "Cancel" and "Send invitations" — no membership type, so the input's membershipType "${kind}" cannot be entered`);
        await enter(where, "membershipType", chooser, kind);
      }
      await press(where, /^\s*(add|invite|send)( team members?| invitations?)?\s*$/i, scope);
    },
    // Offered to the service administrator only: a pending row's "Approve <name>" makes the
    // person a member at once, with no confirmation. The organization's owner is shown the
    // pending row with only "Remove <name>", which is reported as the row's answer.
    approvePendingMember: (input) => orgInRow("approve_pending_member", input, /^\s*approve\b/i, /^\s*approve\b/i),
    // Each row's "Remove" asks "Remove <name> from the team?" and is confirmed by "Remove from
    // team". The owner's row offers no Remove.
    removeTeamMember: (input) =>
      orgInRow("remove_team_member", input, /^\s*remove\s*$/i, /^\s*remove( team member| from team)?\s*$/i),
    // A row offers "Give administrator rights to <name>" or "Remove administrator rights from
    // <name>". The input may say which is wanted (admin / isAdmin / grant: true or false);
    // otherwise whichever the row offers is pressed. Giving the rights opens the statement
    // dialog, which is answered here when accept_org_admin_terms was taken first, and is
    // otherwise left open for it.
    toggleMemberAdminStatus: async (input) => {
      const where = orgEdit.where("toggle_member_admin_status");
      await orgTabOpen("toggle_member_admin_status", ORG_TAB.team);
      const row = await rowNaming(where, input, ["users"]);
      const said = given(input, ["admin", "isAdmin", "administrator", "grant", "makeAdmin", "value"]);
      const giving = said === undefined ? null : saysYes(said);
      const control =
        giving === null
          ? /^\s*(give administrator rights|remove administrator rights)/i
          : giving
            ? /^\s*give administrator rights/i
            : /^\s*remove administrator rights/i;
      const button = seen(row.getByRole("button", { name: control })).first();
      if (!(await button.count())) {
        throw new Error(
          `${where} — the row "${(await row.innerText()).replace(/\s+/g, " ").trim()}" in the team table on ${page.url()} offers no control named ${control}`,
        );
      }
      if (await isDisabled(button)) throw new Error(`${where} — the row's ${control} is disabled on ${page.url()}`);
      await button.click();
      await settle();
      const open = await adminTermsDialog();
      if (open && orgAdminTermsWanted !== null) {
        await answerAdminTerms(where, open, orgAdminTermsWanted);
        orgAdminTermsWanted = null;
      } else if (open) {
        orgAdminTermsLeftOpen = true;
      }
    },
    // The statement box is in the dialog a row's "Give administrator rights to <name>" opens.
    // With that dialog open the box is set and, when ticked, "Give administrator rights" is
    // pressed. With none open, a member named in the input has their dialog opened first;
    // otherwise the answer is kept for the next toggle_member_admin_status to give.
    acceptOrgAdminTerms: async (input) => {
      const where = orgEdit.where("accept_org_admin_terms");
      await orgEdit.on("accept_org_admin_terms");
      const said = given(input, ["checked", "accept", "accepted", "value"]);
      const wanted = input === undefined || input === null ? true : saysYes(said ?? (typeof input === "object" ? true : input));
      let open = await adminTermsDialog();
      const named = given(input, ["member", "user", "email", "person", "name"]);
      if (!open && named !== undefined) {
        await orgTabOpen("accept_org_admin_terms", ORG_TAB.team);
        const row = await rowNaming(where, input, ["users"]);
        const give = seen(row.getByRole("button", { name: /^\s*give administrator rights/i })).first();
        if (!(await give.count())) {
          throw new Error(
            `${where} — the row "${(await row.innerText()).replace(/\s+/g, " ").trim()}" in the team table on ${page.url()} offers no "Give administrator rights", so there is no statement to confirm`,
          );
        }
        await give.click();
        await settle();
        open = await adminTermsDialog();
        if (!open) unbound(where, `pressing "Give administrator rights" on ${page.url()} opened no dialog with a statement box`);
      }
      if (!open) {
        orgAdminTermsWanted = wanted;
        return;
      }
      await answerAdminTerms(where, open, wanted);
      orgAdminTermsWanted = null;
    },
    // Offered to the service administrator (the organization's owner is not offered it):
    // "Change owner" in the team section's "Team actions" opens the dialog "Change owner",
    // whose "New owner (required)" is a button reading "Select an item" that opens a listbox
    // of the members who have accepted, by name; its own "Change owner" makes the change.
    changeOwner: async (input) => {
      const where = orgEdit.where("change_owner");
      await orgTabOpen("change_owner", ORG_TAB.team);
      await press(where, /^\s*change owner\s*$/i, seen(page.getByRole("main")));
      await dialog().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
      if (!(await dialog().count())) unbound(where, `pressing "Change owner" on ${page.url()} opened no dialog`);
      const scope = dialog();
      const target = given(input, ["newOwner", "owner", "user", "member"]) ?? input;
      const wanted = shownName(target) || givenText(input, ["name"]) || (typeof target === "string" ? target : "");
      if (!wanted) unbound(where, `the input ${JSON.stringify(input)} names no new owner`);
      const chooser = seen(scope.getByRole("button", { name: /new owner/i }).or(scope.getByRole("combobox", { name: /new owner/i }))).first();
      if (!(await chooser.count())) unbound(where, `the "Change owner" dialog on ${page.url()} offers no "New owner" chooser`);
      await chooser.click();
      const exactly = new RegExp(`^\\s*${wanted.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i");
      const options = seen(page.getByRole("option"));
      await options.first().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
      const option = seen(page.getByRole("option", { name: exactly })).first();
      if (!(await option.count())) {
        const offeredNames = (await options.allInnerTexts()).map((one) => one.trim()).join(", ") || "nobody";
        await page.keyboard.press("Escape").catch(() => undefined);
        throw new Error(`${where} — "${wanted}" is not among the eligible new owners on ${page.url()}; it offers ${offeredNames}`);
      }
      await option.click();
      await settle();
      await press(where, /^\s*change owner\s*$/i, scope);
      await confirmIfAsked(where, /change owner|confirm|yes/i);
    },
    editServiceAreas: async () => {
      await orgTabOpen("edit_service_areas", ORG_TAB.twu);
      await press(orgEdit.where("edit_service_areas"), /edit( service areas)?/i);
    },
    // Pressed by the service administrator: "Edit service areas" under "Approved service
    // areas" on the Team With Us qualification section turns the list into the group "Service
    // areas this organization is approved for", one box per area, over "Save service areas"
    // and "Cancel"; saving replaces the approvals with exactly the areas ticked, so every box
    // is set — the named ones ticked, all others cleared — before saving.
    saveServiceAreas: async (input) => {
      const where = orgEdit.where("save_service_areas");
      await orgEdit.on("save_service_areas");
      const boxes = await serviceAreaBoxes("save_service_areas");
      if (!boxes) {
        unbound(where, `the Team With Us qualification section of ${page.url()} offers no "Edit service areas" and no service area boxes; it offers ${await offered()}`);
      }
      const areas = [given(input, ["serviceAreas", "areas", "serviceArea"]) ?? []].flat().map(textOf).filter(Boolean);
      const names: string[] = [];
      for (let i = 0; i < (await boxes.count()); i++) names.push(await boxName(boxes.nth(i)));
      for (const area of areas) {
        if (!names.some((name) => labelFor(area).test(name))) {
          unbound(where, `no service area box named "${area}" on ${page.url()}; it offers ${names.join(", ") || "none"}`);
        }
      }
      for (let i = 0; i < names.length; i++) {
        await boxes.nth(i).setChecked(areas.some((area) => labelFor(area).test(names[i])));
      }
      await press(where, /^\s*save service areas\s*$/i);
      await confirmIfAsked(where, /^\s*save/i);
    },
    // "Read the Sprint With Us terms and conditions" / "Read the Team With Us terms and
    // conditions", the link closing each qualification section, to the terms screen.
    viewSwuTerms: async () => {
      await orgTabOpen("view_swu_terms", ORG_TAB.swu);
      await press(orgEdit.where("view_swu_terms"), /^\s*read the sprint with us terms( and conditions)?\s*$/i, page.getByRole("main"));
    },
    viewTwuTerms: async () => {
      await orgTabOpen("view_twu_terms", ORG_TAB.twu);
      await press(orgEdit.where("view_twu_terms"), /^\s*read the team with us terms( and conditions)?\s*$/i, page.getByRole("main"));
    },
    changeLogo: async (input) => {
      await orgEditing("change_logo");
      await offerFile(orgEdit.where("change_logo"), ORG_LOGO, input);
    },
    // The closed form's "Logo" group holds the image "<legal name> logo"; an organization
    // with none says "No logo has been added." instead. The logo held is what the screen shows
    // with the form closed, so an open form is left by drawing the screen again.
    currentLogo: async () => {
      await orgEdit.on("current_logo");
      if (await seen(page.getByRole("main").getByRole("button", { name: /^\s*save changes\s*$/i })).count()) {
        await visit(page.url());
        await orgEdit.on("current_logo");
      }
      await orgTabOpen("current_logo", ORG_TAB.organization);
      const image = seen(page.getByRole("main").getByRole("img", { name: /logo/i }));
      return (await image.count()) ? ((await image.first().getAttribute("src")) ?? "") : "";
    },
    // A refused file is answered in the form's "Logo (optional)" group by an alert ("<name>
    // cannot be used as a logo", then "… Please select a different logo image. The current
    // logo has been kept."). No alert there, or no form open, reads as nothing.
    logoRefusedError: async () => {
      await orgEdit.on("logo_refused_error");
      const group = seen(page.getByRole("main").getByRole("group", { name: /logo/i }));
      if (!(await group.count())) return "";
      const alerts = seen(group.first().getByRole("alert"));
      const said: string[] = [];
      for (let i = 0; i < (await alerts.count()); i++) said.push(...lined(await alerts.nth(i).innerText()));
      return said.join("\n");
    },
    // Drawn under the organization's name as "Organization ID: <id>".
    organizationIdentifier: async () => {
      await orgEdit.on("organization_identifier");
      const line = (await textLines()).find((one) => /^organization id:/i.test(one));
      return line ? line.replace(/^organization id:\s*/i, "").trim() : "";
    },
    organizationTab: () => orgSection("organization_tab", ORG_TAB.organization),
    teamTab: () => orgSection("team_tab", ORG_TAB.team),
    swuQualificationTab: () => orgSection("swu_qualification_tab", ORG_TAB.swu),
    twuQualificationTab: () => orgSection("twu_qualification_tab", ORG_TAB.twu),
    changelogTab: () => orgSection("changelog_tab", ORG_TAB.changelog),
    // Drawn under the organization's name, whichever section is open: "Sprint With Us
    // qualified" and "Team With Us qualified" for the seeded qualified organization, neither
    // for the unqualified one.
    swuQualifiedBadge: () => orgEdit.lines("swu_qualified_badge", /^sprint with us qualified$/i),
    twuQualifiedBadge: () => orgEdit.lines("twu_qualified_badge", /^team with us qualified$/i),
    // The team table's Membership cells that read "Owner" / "Pending".
    ownerBadge: async () => {
      await orgTabOpen("owner_badge", ORG_TAB.team);
      return teamColumn(/^membership$/i, /^owner$/i);
    },
    pendingBadge: async () => {
      await orgTabOpen("pending_badge", ORG_TAB.team);
      return teamColumn(/^membership$/i, /^pending$/i);
    },
    // One line per row, the name followed by the account's address and persona. A person who
    // may not see the organization (an ordinary member, an outsider) is answered "Page not
    // found" at /organizations/:orgId/edit, which is this target's refusal: no rows are shown.
    teamMemberRow: async () => {
      await ready();
      if (/\/organizations\/[^/?#]+\/edit/.test(new URL(page.url()).pathname) && (await notFoundShown())) return "";
      await orgTabOpen("team_member_row", ORG_TAB.team);
      return (await teamRowsNamed()).join("\n");
    },
    // The "Team capabilities" region lists each capability as "<name>: held" or "<name>: not
    // held".
    teamCapabilities: async () => {
      await orgTabOpen("team_capabilities", ORG_TAB.team);
      // The innermost region: "Team members" holds the "Team capabilities" heading too.
      const region = seen(regionNamed(page.getByRole("main"), /^\s*team capabilities\s*$/i)).last();
      if (!(await region.count())) return "";
      return (await seen(region.getByRole("listitem")).allInnerTexts()).map((one) => one.trim()).filter(Boolean).join("\n");
    },
    // Each requirement is one item of the list "Sprint With Us requirements" / "Team With Us
    // requirements", read whole: "Met <requirement>" or "Not met <requirement>".
    swuRequirementTwoMembers: () =>
      requirementItem("swu_requirement_two_members", ORG_TAB.swu, /sprint with us requirements/i, /\b(two|2)\b.*member/i),
    swuRequirementAllCapabilities: () =>
      requirementItem("swu_requirement_all_capabilities", ORG_TAB.swu, /sprint with us requirements/i, /capabilit/i),
    swuRequirementTermsAccepted: () =>
      requirementItem("swu_requirement_terms_accepted", ORG_TAB.swu, /sprint with us requirements/i, /terms/i),
    twuRequirementServiceArea: () =>
      requirementItem("twu_requirement_service_area", ORG_TAB.twu, /team with us requirements/i, /service area/i),
    twuRequirementTermsAccepted: () =>
      requirementItem("twu_requirement_terms_accepted", ORG_TAB.twu, /team with us requirements/i, /terms/i),
    // The approved service areas only, one per line: with the editor open (the service
    // administrator's "Edit service areas"), the areas whose boxes are ticked; with it closed,
    // the items under "Approved service areas". Where the editor is offered it is opened to read
    // the ticked boxes, then cancelled. An unticked area is never named.
    serviceAreaCheckbox: async () => {
      await orgEdit.on("service_area_checkbox");
      const editing = (await seen(page.getByRole("main").getByRole("checkbox")).count()) > 0;
      if (!editing) await orgTabOpen("service_area_checkbox", ORG_TAB.twu);
      const edit = seen(page.getByRole("main").getByRole("button", { name: /^\s*edit service areas\s*$/i })).first();
      if (!editing && !(await edit.count())) {
        const section = seen(regionNamed(page.getByRole("main"), /^\s*approved service areas\s*$/i)).last();
        if (!(await section.count())) return "";
        const items = (await seen(section.getByRole("listitem")).allInnerTexts()).map((one) => one.trim()).filter(Boolean);
        return items.join("\n");
      }
      const boxes = await serviceAreaBoxes("service_area_checkbox");
      if (!boxes) return "";
      const out: string[] = [];
      for (let i = 0; i < (await boxes.count()); i++) {
        if (await boxes.nth(i).isChecked()) out.push(await boxName(boxes.nth(i)));
      }
      if (!editing) {
        const actions = page.getByRole("group", { name: /service area actions/i });
        const cancel = seen(actions.getByRole("button", { name: /^\s*cancel\s*$/i })).first();
        if (await cancel.count()) {
          await cancel.click();
          await settle();
        }
      }
      return out.join("\n");
    },
    // The notice belongs to a qualification section, read from the Sprint With Us one.
    notQualifiedNotice: () => orgTabLines("not_qualified_notice", ORG_TAB.swu, /not (yet )?qualified/i),
    changelogEntry: async () => {
      await orgTabOpen("changelog_entry", ORG_TAB.changelog);
      return (await tableRows()).join("\n");
    },
    // Fields marked invalid on the organization's form, and, on the team section, the warning
    // drawn above the team table once the invitation dialog closes — an address nobody has
    // registered is reported by an alert titled "<address> is not registered with the Digital
    // Marketplace", over "They have been emailed an invitation to sign up. They are not on your
    // team."
    fieldError: async () => {
      await orgEdit.on("field_error");
      const said = lined(await orgFieldErrors());
      const team = seen(regionNamed(page.getByRole("main"), /^\s*team( members)?\s*$/i)).first();
      if (await team.count()) {
        const alerts = seen(team.getByRole("alert"));
        for (let i = 0; i < (await alerts.count()); i++) said.push(...lined(await alerts.nth(i).innerText()));
      }
      return [...new Set(said)].join("\n");
    },
    invalidMembershipTypeError: async () => {
      await orgTabOpen("invalid_membership_type_error", ORG_TAB.team);
      return unbound(
        orgEdit.where("invalid_membership_type_error"),
        `opened the Team members section of ${page.url()} (signed in as the organization's owner and as the service administrator) and its "Add team members" dialog: it offers only "Email address N" boxes, "Add another email address", "Cancel" and "Send invitations", and says each person "joins the team as a member" — there is no membership type to choose, so no other kind can be sent from the screen and no refusal of one is ever drawn on it`,
      );
    },
  };
  // "Give <name> administrator rights?" is modal: left open by toggle_member_admin_status for
  // accept_org_admin_terms, it would stand over every other control and text on the screen.
  // Every member but those two (and open, which draws the screen afresh) cancels it first —
  // which gives nobody the rights, as leaving it unanswered does not.
  for (const key of Object.keys(organizationEdit)) {
    if (key === "open" || key === "toggleMemberAdminStatus" || key === "acceptOrgAdminTerms") continue;
    const members = organizationEdit as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>;
    const original = members[key];
    members[key] = async (...args: unknown[]) => {
      await dismissAdminTerms();
      return original(...args);
    };
  }

  // ---------------------------------------------------------------- creating an organization
  //
  // Walked signed in as the organization-owner vendor: /organizations/create draws "Create
  // Organization" over the regions "Organization details" (the group "Logo (optional)" with
  // the button "Choose a logo (optional)", which opens a file chooser; "Legal name(required)",
  // "Website (optional)"), "Address" and "Contact", then "Create organization" — disabled
  // until every required field is filled — and "Cancel", which goes back to /organizations.
  // A field left wrong is marked invalid, its message drawn after its hint, and a note "Fix N
  // fields to create the organization" lists them. A created organization opens at
  // /organizations/<id>/edit.
  const orgCreate = signedInScreen("organization-create", "/organizations/create");
  const ORG_FIELDS: Record<string, RegExp> = {
    legalName: /^\s*legal name/i,
    name: /^\s*legal name/i,
    websiteUrl: /^\s*website/i,
    website: /^\s*website/i,
    // The form calls the first line "Street address" and the second "Address line 2"; a test
    // may name either line in any of the ways an address is commonly spelled.
    streetAddress1: /^\s*street address/i,
    streetAddress: /^\s*street address/i,
    street: /^\s*street address/i,
    street1: /^\s*street address/i,
    address: /^\s*street address/i,
    address1: /^\s*street address/i,
    addressLine1: /^\s*street address/i,
    addressLineOne: /^\s*street address/i,
    streetAddressLineOne: /^\s*street address/i,
    streetAddress2: /^\s*address line 2/i,
    street2: /^\s*address line 2/i,
    address2: /^\s*address line 2/i,
    addressLine2: /^\s*address line 2/i,
    addressLineTwo: /^\s*address line 2/i,
    streetAddressLineTwo: /^\s*address line 2/i,
    secondAddressLine: /^\s*address line 2/i,
    city: /^\s*city/i,
    region: /^\s*province or state/i,
    province: /^\s*province or state/i,
    state: /^\s*province or state/i,
    provinceOrState: /^\s*province or state/i,
    stateOrProvince: /^\s*province or state/i,
    mailCode: /^\s*postal code/i,
    postalCode: /^\s*postal code/i,
    zip: /^\s*postal code/i,
    zipCode: /^\s*postal code/i,
    postalOrZipCode: /^\s*postal code/i,
    postalCodeOrZipCode: /^\s*postal code/i,
    country: /^\s*country/i,
    contactName: /^\s*contact name/i,
    contactTitle: /^\s*contact title/i,
    contactEmail: /^\s*contact email/i,
    contactPhone: /^\s*contact phone/i,
  };
  const LOGO_KEYS = ["logo", "logoImageFile", "image", "file"];
  const ORG_LOGO = /^\s*choose a logo/i;
  const organizationCreate: S.OrganizationCreatePage = {
    open: () => orgCreate.open(),
    createOrganization: async (input) => {
      const where = orgCreate.where("create_organization");
      await orgCreate.on("create_organization");
      await fillFrom(where, input, ORG_FIELDS, LOGO_KEYS);
      const logo = LOGO_KEYS.map((key) => given(input, [key])).find((one) => one !== undefined);
      if (logo !== undefined) await offerFile(where, ORG_LOGO, logo);
      await press(where, /^\s*create organization\s*$/i, seen(page.getByRole("main")));
      await page.waitForURL(/\/organizations\/[^/?#]+\/edit/, { timeout: 10000 }).catch(() => undefined);
      await settle();
    },
    cancel: () => orgCreate.press("cancel", /^\s*cancel\s*$/i),
    changeLogo: async (input) => {
      await orgCreate.on("change_logo");
      await offerFile(orgCreate.where("change_logo"), ORG_LOGO, input);
    },
    // The message of every field marked invalid — the last of what describes it, its hint
    // coming first — or nothing when no field is.
    fieldError: async () => {
      await orgCreate.on("field_error");
      const said: string[] = [];
      const boxes = seen(page.getByRole("main").getByRole("textbox"));
      for (let i = 0; i < (await boxes.count()); i++) {
        const words = await boxes
          .nth(i)
          .evaluate((element) => {
            if (element.getAttribute("aria-invalid") !== "true") return "";
            const ids = (element.getAttribute("aria-errormessage") ?? element.getAttribute("aria-describedby") ?? "")
              .split(/\s+/)
              .filter(Boolean);
            return ids.length ? (document.getElementById(ids[ids.length - 1])?.innerText ?? "") : "";
          })
          .catch(() => "");
        said.push(...lined(words));
      }
      return [...new Set(said)].join("\n");
    },
    submitDisabledUntilValid: async () => {
      await orgCreate.on("submit_disabled_until_valid");
      const control = seen(page.getByRole("main").getByRole("button", { name: /^\s*create organization\s*$/i })).first();
      if (!(await control.count())) return "absent";
      return (await isDisabled(control)) ? "disabled" : "enabled";
    },
  };

  // ---------------------------------------------------------------- one's organizations
  //
  // Walked signed in as the organization-owner vendor at its own /users/<id>?tab=organizations:
  // "My Organizations" draws the region "Organizations you own" ("Create organization" over a
  // table "Owned organizations, with team size and Sprint With Us qualification": Organization
  // (a link to its screen), Team members, Sprint With Us qualified) and the region
  // "Organizations you belong to".
  //
  // "Organizations you own" with none says "You do not own any organizations. Create one to
  // propose on Sprint With Us and Team With Us opportunities." in place of the table.
  // "Organizations you belong to" holds a table "Organizations you are a member of or have
  // been invited to" (Organization, Membership — "Member" or "Pending" —, Actions; names are
  // plain text) or, with none, "You do not belong to any other organizations. An
  // organization's owner or administrators can invite you by email."
  // Walked as the invited vendor and as an organization member: a pending row's Actions are
  // "Accept the invitation from <org>" (opens "Join <org>?", confirmed by "Join organization")
  // and "Decline the invitation from <org>" (opens "Decline the invitation from <org>?",
  // confirmed by "Decline invitation"); a member's row offers "Leave <org>" (opens "Leave
  // <org>?", confirmed by "Leave organization"). Each dialog also has "Cancel". The invitation
  // email ("<org> has invited you to join its team") links to
  // ?tab=organizations&invitation=<affiliation>&answer=accept (or =decline), which opens this
  // section with that answer's dialog already open.
  // An organization as the tables name it — its legal name — from a seed handle, an
  // identifier, a record handed over whole, or the name itself.
  function orgNamed(input: unknown): string {
    const value = given(input, ["organization", "org", "legalName", "name", "id"]) ?? input;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const one = record(value);
      return textOf(one.legal_name ?? one.legalName ?? one.name) || orgNamed(one.id);
    }
    const text = textOf(value).trim();
    const orgs = seedGroups.organizations ?? {};
    const byHandle = orgs[text.replace(/^organizations\./, "")];
    if (byHandle) return textOf(record(byHandle).legal_name);
    for (const one of Object.values(orgs)) if (String(record(one).id) === text) return textOf(record(one).legal_name);
    return text;
  }
  const OWNED = /^\s*organizations you own\s*$/i;
  const AFFILIATED = /^\s*organizations you belong to\s*$/i;
  function membershipScreen(pageId: string, route: string) {
    const screen = signedInScreen(pageId, route);
    async function region(member: string, name: RegExp, heading: string): Promise<Locator> {
      await screen.on(member);
      const found = seen(regionNamed(page.getByRole("main"), name)).first();
      await found.waitFor({ state: "visible", timeout: 10000 }).catch(() => undefined);
      if (!(await found.count())) {
        unbound(screen.where(member), `${page.url()} shows no "${heading}" section; it offers ${await offered()}`);
      }
      return found;
    }
    const owned = (member: string) => region(member, OWNED, "Organizations you own");
    const affiliated = (member: string) => region(member, AFFILIATED, "Organizations you belong to");
    // One column of the owned table, each value after the organization it belongs to.
    async function ownedColumn(member: string, header: RegExp): Promise<string> {
      const scope = await owned(member);
      const headers = seen(scope.getByRole("columnheader"));
      let at = -1;
      for (let i = 0; i < (await headers.count()); i++) if (header.test((await headers.nth(i).innerText()).trim())) at = i;
      if (at < 0) return "";
      return (await tableRows(scope))
        .map((row) => row.split(" | "))
        .map((cells) => `${cells[0]} | ${cells[at] ?? ""}`)
        .join("\n");
    }
    // A paragraph of a section, drawn only when its table is not.
    async function emptyNote(scope: Locator): Promise<string> {
      if (await seen(scope.getByRole("table")).count()) return "";
      return (await paragraphs(scope)).join("\n");
    }
    // An invitation or membership answered from the row that names the organization. Arrived
    // from the invitation email, the screen already holds this answer's dialog open, and it is
    // confirmed there; a dialog of another kind is cancelled before the row is pressed.
    async function answer(member: string, input: unknown, control: RegExp, confirm: RegExp, kind: RegExp): Promise<void> {
      const where = screen.where(member);
      await screen.on(member);
      if (await dialog().count()) {
        const said = (await dialog().innerText()).trim();
        const named = orgNamed(input);
        if (kind.test(said) && (!named || said.toLowerCase().includes(named.toLowerCase()))) {
          await press(where, confirm, dialog());
          return;
        }
        await closeDialog();
      }
      const scope = await affiliated(member);
      const named = orgNamed(input);
      const rows = seen(scope.getByRole("row"));
      const row = named ? rows.filter({ hasText: named }).first() : rows.nth(1);
      if (!(await row.count())) {
        unbound(where, `no row of "Organizations you belong to" on ${page.url()} names ${JSON.stringify(input)}; the rows read: ${(await tableRows(scope)).join(" / ") || "none"}`);
      }
      const found = await findControl(row, control);
      if (!found || !(await found.evaluate((one) => one.matches("a, button, [role=button], [role=link]")).catch(() => false))) {
        unbound(
          where,
          `the row "${(await row.innerText()).replace(/\s+/g, " ").trim()}" in "Organizations you belong to" on ${page.url()} offers no control named ${control} — a pending row offers "Accept the invitation from <org>" and "Decline the invitation from <org>", a member's row "Leave <org>"`,
        );
      }
      await press(where, control, row);
      await confirmIfAsked(where, confirm);
    }
    // The dialog an invitation answer lands on, open on the screen; none open is unbound,
    // since the answer could not be brought to this screen to be confirmed.
    // Walked as the invited vendor: a pending row's "Accept the invitation from <org>" opens
    // "Join <org>?" (confirmed by "Join organization"), and its "Decline the invitation from
    // <org>" opens "Decline the invitation from <org>?" (confirmed by "Decline invitation").
    // Each read returns the open dialog only when it is its own kind; the screen open with the
    // other dialog, or with none, shows no such confirmation.
    async function answerDialog(member: string, kind: RegExp): Promise<string> {
      await screen.on(member);
      await dialog().waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined);
      if (!(await dialog().count())) return "";
      const said = (await dialog().innerText()).trim();
      return kind.test(said) ? said : "";
    }
    return {
      open: (params?: Record<string, string>) => screen.open(params),
      approveInvitation: (input?: unknown) =>
        answer("approve_invitation", input, /^\s*(approve|accept)\b/i, /^\s*join organization\s*$/i, /^\s*join\b/i),
      rejectInvitation: (input?: unknown) =>
        answer("reject_invitation", input, /^\s*(reject|decline)\b/i, /^\s*decline invitation\s*$/i, /^\s*decline the invitation/i),
      leaveOrganization: (input?: unknown) =>
        answer("leave_organization", input, /^\s*leave\b/i, /^\s*leave organization\s*$/i, /^\s*leave\b/i),
      createOrganization: async () => {
        const scope = await owned("create_organization");
        await press(screen.where("create_organization"), /^\s*create organization\s*$/i, scope);
      },
      // Each name in either table is a link to that organization's screen when the viewer
      // owns it; a member's or invitee's row names it in plain text.
      openOrganization: async (input?: unknown) => {
        const where = screen.where("open_organization");
        await screen.on("open_organization");
        const named = orgNamed(input);
        const exactly = named ? new RegExp(`^\\s*${named.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i") : undefined;
        const links = seen(page.getByRole("main").getByRole("table").getByRole("link", exactly ? { name: exactly } : {}));
        if (!(await links.count())) {
          unbound(where, `no organization link${named ? ` named "${named}"` : ""} in the tables on ${page.url()}; the owned table links each organization the viewer owns, and "Organizations you belong to" names its organizations in plain text; the rows read: ${(await tableRows()).join(" / ") || "none"}`);
        }
        await links.first().click();
        await settle();
      },
      ownedOrganizationsTable: async () => (await tableRows(await owned("owned_organizations_table"))).join("\n"),
      affiliatedOrganizationsTable: async () => (await tableRows(await affiliated("affiliated_organizations_table"))).join("\n"),
      // The rows of "Organizations you belong to" whose Membership cell reads "Pending" (the
      // Actions cell, "Accept … Decline …", follows it).
      pendingBadge: async () => {
        const scope = await affiliated("pending_badge");
        const headers = seen(scope.getByRole("columnheader"));
        let at = -1;
        for (let i = 0; i < (await headers.count()); i++) if (/^membership$/i.test((await headers.nth(i).innerText()).trim())) at = i;
        if (at < 0) return "";
        return (await tableRows(scope)).filter((row) => /^pending$/i.test((row.split(" | ")[at] ?? "").trim())).join("\n");
      },
      teamMemberCount: () => ownedColumn("team_member_count", /^team members$/i),
      swuQualifiedMark: () => ownedColumn("swu_qualified_mark", /^sprint with us qualified$/i),
      emptyOwnedMessage: async () => emptyNote(await owned("empty_owned_message")),
      emptyAffiliatedMessage: async () => emptyNote(await affiliated("empty_affiliated_message")),
      acceptConfirmation: () => answerDialog("accept_confirmation", /^\s*join\b|join organization/i),
      declineConfirmation: () => answerDialog("decline_confirmation", /^\s*decline\b|decline invitation/i),
    };
  }

  // ---------------------------------------------------------------- completing a profile

  // "Complete Your Profile" is shown only to a vendor still to agree: "Sign-in username"
  // (read-only), "Name", "Email address", "Email me when new opportunities are posted", the
  // terms box, and "Complete profile", disabled until the terms box is ticked. Anyone else is
  // sent on: an account with nothing to complete to /dashboard, a signed-out visitor to
  // /sign-in?redirectOnSuccess=%2Fsign-up%2Fcomplete.
  const signUp = signedInScreen("user-sign-up-complete", "/sign-up/complete");
  const TERMS_BOX = /terms|agree/i;
  const NOTICES_BOX = /new opportunit/i;
  const SENT_ON = ["/dashboard", "/sign-in"];
  // Whether the profile form is on screen. False when /sign-up/complete sent the browser on
  // to /dashboard or /sign-in, which is the page answering that this person has no profile to
  // complete; anywhere else the page was never reached, which is unbound.
  async function signUpFormShown(member: string): Promise<boolean> {
    await settle();
    // The page sends people on after it loads, so wait for the form or for the move away.
    await Promise.race([
      seen(page.getByRole("heading", { name: /complete your profile/i })).first().waitFor({ state: "visible", timeout: 10000 }),
      page.waitForURL((url) => url.pathname !== "/sign-up/complete", { timeout: 10000 }),
    ]).catch(() => undefined);
    await settle();
    const at = new URL(page.url());
    if (originOf(page.url()) === originOf(baseURL) && SENT_ON.includes(at.pathname)) return false;
    if (at.pathname !== "/sign-up/complete") {
      unbound(signUp.where(member), `the browser is at ${page.url()}, not on /sign-up/complete nor where that page sends people (/dashboard, /sign-in); open() was not the last place it went`);
    }
    await signUp.on(member);
    return true;
  }
  async function onSignUpForm(member: string): Promise<void> {
    if (!(await signUpFormShown(member))) {
      unbound(signUp.where(member), `/sign-up/complete sent the browser on to ${page.url()} instead of showing the profile form; it is shown only to a vendor who has still to agree to the terms`);
    }
  }
  async function setBox(where: string, name: RegExp, wanted: boolean | undefined): Promise<void> {
    const box = seen(page.getByRole("checkbox", { name }));
    if (!(await box.count())) unbound(where, `no box named ${name} on ${page.url()}; it offers ${await offered()}`);
    await box.first().setChecked(wanted ?? !(await box.first().isChecked()));
    await settle();
  }
  const boxWanted = (input: unknown, keys: string[]): boolean | undefined => {
    if (typeof input === "boolean") return input;
    const value = given(input, [...keys, "checked", "value", "on", "enabled"]);
    return value === undefined ? undefined : saysYes(value);
  };
  const TERMS_KEYS = ["acceptTerms", "acceptAppTerms", "terms", "acceptedTerms", "agree"];
  const NOTICE_KEYS = ["notifications", "notificationsOn", "newOpportunities", "notifyNewOpportunities", "toggleNewOpportunityNotifications"];
  const PROFILE_FIELDS: Record<string, RegExp> = {
    name: /^\s*(full\s*)?name\b/i,
    email: /e-?mail/i,
    jobTitle: /job\s*title/i,
  };
  const userSignUpComplete: S.UserSignUpCompletePage = {
    open: () => signUp.open(),
    changeAvatar: async (input) => {
      await onSignUpForm("change_avatar");
      await offerFile(signUp.where("change_avatar"), /avatar|choose image|upload image|picture|photo/i, input);
    },
    acceptAppTerms: async (input) => {
      await onSignUpForm("accept_app_terms");
      await setBox(signUp.where("accept_app_terms"), TERMS_BOX, boxWanted(input, TERMS_KEYS) ?? true);
    },
    toggleNewOpportunityNotifications: async (input) => {
      await onSignUpForm("toggle_new_opportunity_notifications");
      await setBox(signUp.where("toggle_new_opportunity_notifications"), NOTICES_BOX, boxWanted(input, NOTICE_KEYS));
    },
    completeProfile: async (input) => {
      const where = signUp.where("complete_profile");
      await onSignUpForm("complete_profile");
      if (given(input, TERMS_KEYS) !== undefined) await setBox(where, TERMS_BOX, boxWanted(input, TERMS_KEYS) ?? true);
      if (given(input, NOTICE_KEYS) !== undefined) await setBox(where, NOTICES_BOX, boxWanted(input, NOTICE_KEYS) ?? true);
      const picture = given(input, ["avatar", "image", "picture"]);
      await fillFrom(where, input, PROFILE_FIELDS, [...TERMS_KEYS, ...NOTICE_KEYS, "avatar", "image", "picture"]);
      if (picture !== undefined) await offerFile(where, /avatar|choose image|upload image|picture|photo/i, picture);
      await press(where, /^\s*complete( profile)?\s*$/i);
      const left = await page
        .waitForURL((url) => url.pathname !== "/sign-up/complete", { timeout: 20000 })
        .then(() => true)
        .catch(() => false);
      if (!left) {
        const shown = await formMessages();
        throw new Error(`${where} — "Complete Profile" was pressed but the page stayed on ${page.url()}; ${shown ? `it shows: ${shown.replace(/\n/g, " ")}` : "it shows no message"}`);
      }
      await ready();
    },
    // Each reading answers empty when the page sent the browser on instead of showing the
    // form: no form is what an account with nothing to complete, or a signed-out visitor, sees.
    idpUsernameReadonly: async () => {
      if (!(await signUpFormShown("idp_username_readonly"))) return "";
      const box = await fieldLabelled(/github|idir|user\s*name/i, false);
      return box ? valueOf(box) : "";
    },
    nameField: async () => {
      if (!(await signUpFormShown("name_field"))) return "";
      const box = await fieldLabelled(PROFILE_FIELDS.name, false);
      return box ? valueOf(box) : "";
    },
    emailField: async () => {
      if (!(await signUpFormShown("email_field"))) return "";
      const box = await fieldLabelled(PROFILE_FIELDS.email, false);
      return box ? valueOf(box) : "";
    },
    jobTitleField: async () => {
      if (!(await signUpFormShown("job_title_field"))) return "";
      const box = await fieldLabelled(PROFILE_FIELDS.jobTitle, false);
      return box ? valueOf(box) : "";
    },
    termsCheckbox: async () => {
      if (!(await signUpFormShown("terms_checkbox"))) return "";
      const box = seen(page.getByRole("checkbox", { name: TERMS_BOX }));
      return (await box.count()) ? ((await box.first().isChecked()) ? "checked" : "unchecked") : "";
    },
    completeDisabledUntilTermsAccepted: async () => {
      if (!(await signUpFormShown("complete_disabled_until_terms_accepted"))) return "";
      const box = seen(page.getByRole("checkbox", { name: TERMS_BOX }));
      if (!(await box.count()) || (await box.first().isChecked())) return "";
      const control = await findControl(page, /^\s*complete( profile)?\s*$/i);
      return control && (await isDisabled(control)) ? "disabled" : "";
    },
    fieldError: async () => {
      if (!(await signUpFormShown("field_error"))) return "";
      return formMessages();
    },
  };

  // ---------------------------------------------------------------- a profile

  // Walked signed in: the profile is "User Profile" over a "Profile sections" navigation of
  // links (Profile, and for a vendor Capabilities and Organizations, then Notifications and
  // Legal), the account facts "Account type: …", "Status: …" and "Account ID: …" each on a
  // line, "Details" with read-only "Sign-in username", "Name", "Email address" (and "Job
  // title" for public sector staff) boxes, and for public sector staff a "Permissions"
  // section. One's own profile offers "Edit profile", which opens "Edit your details" with a
  // "Profile picture (optional)" group ("Choose a profile picture"), "Name(required)", "Email
  // address(required)", "Job title (optional)", "Save changes" and "Cancel"; a vendor's also
  // offers "Deactivate account". ?tab=capabilities draws "Capabilities" (see below), and
  // ?tab=organizations "My Organizations" with a line saying organizations cannot yet be
  // registered. A vendor still to complete a profile is sent from the profile to
  // /sign-up/complete. Another account's /users/:userId opens for the administrator (the
  // account facts and "Details", nothing to edit) and answers "Page not found" to anyone else.
  const SECTION_HEADINGS: Record<string, RegExp> = {
    capabilities: /capabilit/i,
    organizations: /organi[sz]ations/i,
    notifications: /^\s*notifications\s*$/i,
    legal: /policies|terms|legal|agreements/i,
  };
  async function profileSection(where: string, name: RegExp, key: string): Promise<string> {
    const tab = seen(page.getByRole("tab", { name }));
    if (await tab.count()) {
      await tab.first().click();
      await settle();
      const panel = seen(page.getByRole("tabpanel"));
      return (await panel.count()) ? (await panel.first().innerText()).trim() : mainText();
    }
    const sections = page.getByRole("navigation", { name: /profile sections/i });
    const link = seen(sections.getByRole("link", { name }));
    // A screen that opened without that section reads as nothing.
    if (!(await link.count())) return "";
    await link.first().click();
    await settle();
    await ready();
    const heading = await firstHeading();
    const wanted = SECTION_HEADINGS[key];
    if (wanted && !wanted.test(heading)) {
      unbound(where, `the "${key}" link under "Profile sections" goes to ${page.url()}, which draws "${heading}" (the Profile section again) and no ${key} section`);
    }
    const names = lined(await sections.innerText().catch(() => ""));
    return (await textLines()).filter((line) => !names.includes(line)).join("\n");
  }

  function profileScreen(pageId: string, route: string) {
    const signedIn = signedInScreen(pageId, route);
    // The client sends a vendor still to complete a profile from the profile on to
    // /sign-up/complete: the profile is not what that person is shown, and saying so is
    // the answer, not a reading of the form it was sent to.
    const on = async (member: string): Promise<void> => {
      await signedIn.on(member);
      await Promise.race([
        seen(page.getByText(/^\s*status:/i)).first().waitFor({ state: "visible", timeout: 10000 }),
        page.waitForURL((url) => url.pathname === "/sign-up/complete", { timeout: 10000 }),
      ]).catch(() => undefined);
      if (new URL(page.url()).pathname === "/sign-up/complete") {
        throw new Error(
          `${pageId}.${member} — ${route} sent this person on to ${page.url()} ("Complete Your Profile"): the account has still to complete its profile, and the profile is not shown to it until then`,
        );
      }
    };
    const screen = {
      ...signedIn,
      on,
      press: async (member: string, name: RegExp): Promise<void> => {
        await on(member);
        await press(signedIn.where(member), name);
      },
      tab: async (member: string, name: RegExp, key = ""): Promise<string> => {
        await on(member);
        return profileSection(signedIn.where(member), name, key);
      },
      messages: async (member: string): Promise<string> => {
        await on(member);
        return formMessages();
      },
    };
    const w = screen.where;
    const profileField = async (member: string, label: RegExp, shownAs: string[]): Promise<string> => {
      await screen.on(member);
      const box = await fieldLabelled(label, false);
      return box ? valueOf(box) : labelledValue(shownAs);
    };
    return {
      open: (params?: Record<string, string>) => screen.open(params),
      editProfile: () => screen.press("edit_profile", /^\s*edit( profile)?\s*$/i),
      // What the test gave is entered first, opening the form for editing when it is not
      // already; a disabled save is the form refusing, and is reported at once.
      saveChanges: async (input?: unknown) => {
        await screen.on("save_changes");
        const picture = given(input, ["avatar", "image", "picture"]);
        const values = Object.keys(record(input)).length > 0;
        if (values || picture !== undefined) {
          // The profile draws its boxes read-only until "Edit profile" is pressed.
          const name = await fieldLabelled(PROFILE_FIELDS.name, false);
          if (!name || (await isDisabled(name)) || !(await name.isEditable().catch(() => false))) {
            const edit = await findControl(page, /^\s*edit( profile)?\s*$/i);
            if (edit) {
              await edit.click();
              await settle();
            }
          }
          await fillFrom(w("save_changes"), input, PROFILE_FIELDS, ["avatar", "image", "picture"]);
          if (picture !== undefined) await offerFile(w("save_changes"), /avatar|choose image|upload image|picture|photo/i, picture);
        }
        await press(w("save_changes"), /^\s*save( changes)?\s*$/i);
        await confirmIfAsked(w("save_changes"), /^\s*save( changes)?\s*$/i);
      },
      cancelEditing: () => screen.press("cancel_editing", /^\s*cancel\s*$/i),
      changeAvatar: async (input?: unknown) => {
        await screen.on("change_avatar");
        // The picture is chosen on the form "Edit profile" opens.
        if (!(await findControl(page, /^\s*choose (a |a different )?profile picture\s*$/i))) {
          const edit = await findControl(page, /^\s*edit( profile)?\s*$/i);
          if (edit && !(await isDisabled(edit))) {
            await edit.click();
            await settle();
          }
        }
        await offerFile(w("change_avatar"), /avatar|choose image|upload image|picture|photo/i, input);
      },
      deactivateAccount: () => screen.press("deactivate_account", /deactivate( account)?/i),
      reactivateAccount: () => screen.press("reactivate_account", /reactivate( account)?/i),
      confirmActivationChange: async () => {
        await screen.on("confirm_activation_change");
        await inDialog(w("confirm_activation_change"), /deactivate|reactivate|confirm|^\s*yes\s*$/i);
      },
      cancelActivationChange: async () => {
        await screen.on("cancel_activation_change");
        await inDialog(w("cancel_activation_change"), /^\s*(cancel|no)\s*$/i);
      },
      toggleAdminPermission: async () => {
        await screen.on("toggle_admin_permission");
        const box = seen(page.getByRole("checkbox", { name: /admin/i }).or(page.getByRole("switch", { name: /admin/i })));
        if (!(await box.count())) unbound(w("toggle_admin_permission"), `no administrator box on ${page.url()}; it offers ${await offered()}`);
        if (await isDisabled(box.first())) throw new Error(`${w("toggle_admin_permission")} — the administrator box is disabled on ${page.url()}`);
        await box.first().click();
        await confirmIfAsked(w("toggle_admin_permission"), /^\s*(yes|confirm|save|ok|update)\b/i);
        await settle();
      },
      userIdentifier: async () => {
        await screen.on("user_identifier");
        const named = /^\/users\/([^/?#]+)/.exec(new URL(page.url()).pathname)?.[1] ?? "";
        return named && named !== "me" ? named : textOf((await ownAccount()).id);
      },
      profileTab: async () => {
        await screen.on("profile_tab");
        const tab = seen(page.getByRole("tab", { name: /^\s*profile\s*$/i }));
        if (await tab.count()) return screen.tab("profile_tab", /^\s*profile\s*$/i);
        return mainText();
      },
      capabilitiesTab: () => screen.tab("capabilities_tab", /capabilities/i, "capabilities"),
      notificationsTab: () => screen.tab("notifications_tab", /notifications/i, "notifications"),
      legalTab: () => screen.tab("legal_tab", /policies|terms|legal|agreements/i, "legal"),
      organizationsTab: () => screen.tab("organizations_tab", /organizations/i, "organizations"),
      // Signed in, the profile draws "Account type: Vendor", "Status: Active" and "Account ID: …"
      // each on a line of its own, the value beside its label ("Status:" and its value in one
      // paragraph); on() waits for that line, which is drawn after the heading.
      statusBadge: async () => {
        await screen.on("status_badge");
        return labelledValue(["Status", "Account Status"]);
      },
      accountType: async () => {
        await screen.on("account_type");
        return labelledValue(["Account Type"]);
      },
      permissionsLabel: async () => {
        await screen.on("permissions_label");
        return labelledValue(["Permissions", "Permission", "Permission(s)"]);
      },
      adminCheckbox: async () => {
        await screen.on("admin_checkbox");
        const box = seen(page.getByRole("checkbox", { name: /admin/i }).or(page.getByRole("switch", { name: /admin/i })));
        return (await box.count()) ? ((await box.first().isChecked()) ? "checked" : "unchecked") : "";
      },
      // Signed in, "Details" carries "Sign-in username", "Name" and "Email address" as
      // labelled text boxes; a label drawn with its value as text is read beside or under it.
      idpUsernameReadonly: () => profileField("idp_username_readonly", /github|idir|user\s*name/i, ["Sign-in username", "GitHub", "IDIR", "Username"]),
      nameField: () => profileField("name_field", PROFILE_FIELDS.name, ["Name"]),
      emailField: () => profileField("email_field", PROFILE_FIELDS.email, ["Email", "Email Address"]),
      jobTitleField: () => profileField("job_title_field", PROFILE_FIELDS.jobTitle, ["Job Title"]),
      fieldError: () => screen.messages("field_error"),
      activationModal: async () => {
        await screen.on("activation_modal");
        return (await dialog().count()) ? (await dialog().innerText()).trim() : "";
      },
    };
  }

  // /users/:userId is a screen this build serves: walked signed in, it opens for the signed-in
  // person's own identifier and, to the administrator, for another account's (the seeded
  // organization owner's profile shows "Email address", "Name", "Sign-in username" and its
  // status to test-admin). Walked as a vendor, another account's identifier answers "Page not
  // found": that is the service refusing this person the account, so a reading of the
  // profile reports what they are shown — nothing — and not_found_page reads the refusal.
  // Actions on a refused profile still report the refusal, since there is nothing to press.
  const profileOfUserId = profileScreen("user-profile", "/users/:userId");
  const PROFILE_READINGS = [
    "userIdentifier", "profileTab", "capabilitiesTab", "notificationsTab", "legalTab", "organizationsTab",
    "statusBadge", "accountType", "permissionsLabel", "adminCheckbox", "idpUsernameReadonly", "nameField",
    "emailField", "jobTitleField", "fieldError", "activationModal",
  ] as const;
  const readingsOfRefusedProfile: Partial<Record<(typeof PROFILE_READINGS)[number], () => Promise<string>>> = {};
  for (const name of PROFILE_READINGS) {
    const read = profileOfUserId[name] as () => Promise<string>;
    readingsOfRefusedProfile[name] = async () => {
      const at = new URL(page.url());
      if (originOf(page.url()) === originOf(baseURL) && /^\/users\/[^/]+$/.test(at.pathname) && (await notFoundShown())) return "";
      return read();
    };
  }

  // ---------------------------------------------------------------- the list of accounts
  //
  // /users is the administrator's "Digital Marketplace Users" screen (the header's "Users"
  // link): a "Search by name" box, an "Export contact list" button, and one table of every
  // account — "Status | Account type | Name | Administrator", the name a link to
  // /users/<id>, the last cell "Yes" or "No" — all of them at once, with no pager, and
  // "<n> of <m> people shown" under it. Searching narrows the rows in place. Anyone else
  // signed in is shown "Page not found" there, and a signed-out visitor is sent to
  // /sign-in?redirectOnSuccess=/users.
  //
  // "Export contact list" opens a dialog: "Account types (required)" with "Public sector
  // employees" and "Vendors", "Fields (required)" with "First name", "Last name", "Email
  // address" and "Organization name", every box unticked to start with, and "Cancel" and
  // "Export", the latter disabled until one type and one field are ticked. Export downloads
  // dm-contacts-<date>.csv (from /api/contact-list) and closes the dialog.
  const USER_LIST = "/users";

  // On the list, or why not: the refusal this visitor was shown instead. Straight after
  // signing in the client may still be loading the account when /users is asked for, so a
  // "Page not found" is looked at once more before it is believed.
  async function onUserList(): Promise<string> {
    await ready();
    const table = seen(page.getByRole("table")).first();
    const loaded = async (): Promise<boolean> => {
      await table.waitFor({ state: "visible", timeout: 8000 }).catch(() => undefined);
      return (await table.count()) > 0;
    };
    if (await loaded()) return "";
    if (new URL(page.url()).pathname === USER_LIST && (await notFoundShown())) {
      await page.waitForTimeout(1500);
      await page.reload({ waitUntil: "domcontentloaded" });
      await ready();
      if (await loaded()) return "";
    }
    return (await whyNotHere()) || `${page.url()} shows no table of accounts`;
  }

  async function userListOrUnbound(member: string): Promise<void> {
    const why = await onUserList();
    if (why) {
      unbound(
        `user-list.${member}`,
        `${USER_LIST} did not show the list of accounts at ${page.url()}: ${why.replace(/\n+/g, " ")}; the list is the administrator's (signed in as the administrator it opens from the header's "Users" link; signed in as a public sector employee it answers "Page not found")`,
      );
    }
  }

  // Every row of the table as its cells' text, read in one pass. The table draws its rows
  // after the accounts arrive; a search that leaves rows out says "<n> of <m> people shown"
  // under it, which is the only sign a search that leaves none has finished.
  async function userListRows(): Promise<string[][]> {
    if (await onUserList()) return [];
    await seen(page.getByRole("table").first().getByRole("cell").or(page.getByText(/\bof \d+ (people|person) shown\b/i)))
      .first()
      .waitFor({ state: "visible", timeout: 8000 })
      .catch(() => undefined);
    return seen(page.getByRole("table"))
      .first()
      .evaluate((table) =>
        Array.from((table as HTMLTableElement).tBodies)
          .flatMap((body) => Array.from(body.rows))
          .map((row) => Array.from(row.cells).map((cell) => (cell.innerText ?? "").replace(/\s+/g, " ").trim()))
          .filter((cells) => cells.length > 0),
      )
      .catch(() => [] as string[][]);
  }

  // Where each column sits, by its header, so the readers do not depend on the order.
  async function userListColumns(): Promise<Record<"status" | "type" | "name" | "admin", number>> {
    const headers = (await seen(page.getByRole("columnheader")).allInnerTexts()).map((each) => each.trim());
    const at = (pattern: RegExp, fallback: number): number => {
      const found = headers.findIndex((each) => pattern.test(each));
      return found < 0 ? fallback : found;
    };
    return {
      status: at(/^status$/i, 0),
      type: at(/account\s*type/i, 1),
      name: at(/^name$/i, 2),
      admin: at(/admin/i, 3),
    };
  }

  async function userListColumn(which: "status" | "type" | "name" | "admin"): Promise<string> {
    const rows = await userListRows();
    if (!rows.length) return "";
    const at = (await userListColumns())[which];
    return rows.map((cells) => cells[at] ?? "").join("\n");
  }

  // The export dialog, opened when it is not already.
  async function exportDialog(member: string): Promise<Locator> {
    await userListOrUnbound(member);
    if (!(await dialog().count())) await press(`user-list.${member}`, /^\s*export contact list\s*$/i);
    await dialog().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    if (!(await dialog().count())) {
      unbound(`user-list.${member}`, `"Export contact list" on ${page.url()} was pressed and no dialog opened`);
    }
    return dialog();
  }

  // What a test calls an account type or a field, as the dialog labels it.
  function exportTypeLabel(said: string): RegExp {
    const words = squash(said);
    if (/vendor/.test(words)) return /^\s*vendors?\s*$/i;
    if (!words || /gov|publicsector|staff|employee|admin|idir/.test(words)) return /^\s*public sector employees?\s*$/i;
    return new RegExp(`^\\s*${said.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i");
  }

  function exportFieldLabel(said: string): RegExp {
    const words = squash(said);
    if (!words || /email/.test(words)) return /^\s*email address\s*$/i;
    if (/first|given/.test(words)) return /^\s*first name\s*$/i;
    if (/last|surname|family/.test(words)) return /^\s*last name\s*$/i;
    if (/org|company/.test(words)) return /^\s*organization name\s*$/i;
    return new RegExp(`^\\s*${said.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i");
  }

  // The state a test asked a box to be left in, or undefined to turn it over.
  function exportBoxWanted(input: unknown): boolean | undefined {
    if (typeof input === "boolean") return input;
    const said = given(input, ["checked", "selected", "on", "include", "included", "enabled"]);
    return said === undefined ? undefined : saysYes(said);
  }

  async function setExportBox(member: string, scope: Locator, label: RegExp, said: string, wanted: boolean | undefined): Promise<void> {
    const box = seen(scope.getByRole("checkbox", { name: label }));
    if (!(await box.count())) {
      const offered = (await seen(scope.getByRole("checkbox")).evaluateAll((boxes) =>
        boxes.map((each) => ((each as HTMLInputElement).labels?.[0]?.innerText ?? each.getAttribute("aria-label") ?? "").trim()),
      )).join(", ");
      unbound(`user-list.${member}`, `the export dialog has no box labelled ${label} (asked for "${said}"); it offers ${offered || "no boxes"}`);
    }
    const now = await box.first().isChecked();
    if (now !== (wanted ?? !now)) await box.first().click();
  }

  // The list of names a test gave for a group of boxes ("userTypes": ["VENDOR"]), as text.
  function namesGiven(value: unknown): string[] {
    if (value === undefined || value === null) return [];
    if (Array.isArray(value)) return value.map(textOf).filter(Boolean);
    if (typeof value === "object") {
      return Object.entries(record(value))
        .filter(([, on]) => saysYes(on))
        .map(([key]) => key);
    }
    return textOf(value).split(/\s*,\s*/).filter(Boolean);
  }

  const EXPORT_TYPE_KEYS = ["userTypes", "userType", "types", "type", "accountTypes", "accountType"];
  const EXPORT_FIELD_KEYS = ["fields", "field", "columns", "column"];

  const userListScreen: S.UserListPage = {
    open: async () => {
      await go(USER_LIST);
      await onUserList();
    },
    searchByName: async (input) => {
      const where = "user-list.search_by_name";
      await userListOrUnbound("search_by_name");
      const box = seen(page.getByRole("searchbox", { name: /search by name/i }).or(page.getByRole("textbox", { name: /search by name/i }))).first();
      if (!(await box.count())) unbound(where, `no "Search by name" box on ${page.url()}`);
      const words = typeof input === "string" ? input : givenText(input, ["name", "query", "search", "term", "text", "value"]);
      await box.fill(words);
      await page.waitForTimeout(300);
      await settle();
    },
    openExportContactList: async () => {
      await exportDialog("open_export_contact_list");
    },
    // A type named the way the criteria name accounts ("public sector employee", "GOV",
    // "vendor") is the box it stands for; a state given ({ checked }) is set, otherwise the
    // box is turned over.
    toggleExportUserType: async (input) => {
      const scope = await exportDialog("toggle_export_user_type");
      const said = (typeof input === "string" ? input : givenText(input, [...EXPORT_TYPE_KEYS, "name", "label"])).trim();
      await setExportBox("toggle_export_user_type", scope, exportTypeLabel(said), said, exportBoxWanted(input));
    },
    toggleExportField: async (input) => {
      const scope = await exportDialog("toggle_export_field");
      const said = (typeof input === "string" ? input : givenText(input, [...EXPORT_FIELD_KEYS, "fieldName", "name", "label"])).trim();
      await setExportBox("toggle_export_field", scope, exportFieldLabel(said), said, exportBoxWanted(input));
    },
    // The types and fields the test gave are ticked (and the rest of each group unticked)
    // before "Export" is pressed; a disabled "Export" is reported at once with what the
    // dialog says. Pressed, it downloads the list and closes the dialog.
    exportContactList: async (input) => {
      const where = "user-list.export_contact_list";
      const scope = await exportDialog("export_contact_list");
      for (const key of Object.keys(record(input))) {
        if (![...EXPORT_TYPE_KEYS, ...EXPORT_FIELD_KEYS].some((each) => squash(each) === squash(key))) {
          unbound(where, `the export dialog has nothing for "${key}": it offers only account types and fields`);
        }
      }
      const groups: [string[], (said: string) => RegExp, RegExp[]][] = [
        [EXPORT_TYPE_KEYS, exportTypeLabel, [/^\s*public sector employees?\s*$/i, /^\s*vendors?\s*$/i]],
        [EXPORT_FIELD_KEYS, exportFieldLabel, [/^\s*first name\s*$/i, /^\s*last name\s*$/i, /^\s*email address\s*$/i, /^\s*organization name\s*$/i]],
      ];
      for (const [keys, labelOf, every] of groups) {
        const value = given(input, keys);
        if (value === undefined) continue;
        const wanted = namesGiven(value).map((said) => ({ said, label: labelOf(said) }));
        for (const each of wanted) await setExportBox("export_contact_list", scope, each.label, each.said, true);
        for (const label of every) {
          if (wanted.some((each) => String(each.label) === String(label))) continue;
          const box = seen(scope.getByRole("checkbox", { name: label }));
          if ((await box.count()) && (await box.first().isChecked())) await box.first().click();
        }
      }
      const control = await findControl(scope, /^\s*export\s*$/i);
      if (!control) unbound(where, `the export dialog on ${page.url()} has no "Export" button`);
      if (await isDisabled(control)) {
        const said = lined(await scope.innerText().catch(() => "")).filter((line) => /choose|required|at least/i.test(line));
        throw new Error(`${where} — "Export" is disabled in the export dialog on ${page.url()}; it says: ${said.join(" | ") || "nothing"}`);
      }
      const downloaded = page.waitForEvent("download", { timeout: 15000 }).catch(() => null);
      await control.click();
      await downloaded;
      await settle();
    },
    cancelExport: async () => {
      await userListOrUnbound("cancel_export");
      await inDialog("user-list.cancel_export", /^\s*cancel\s*$/i);
    },
    // The account the test named — by seed handle, persona, identifier, address or name —
    // opened from its name in the list.
    openUserProfile: async (input) => {
      const where = "user-list.open_user_profile";
      await userListOrUnbound("open_user_profile");
      const person = personOf(input);
      const links = seen(page.getByRole("table").first().getByRole("link"));
      const hrefs = await links.evaluateAll((each) => each.map((link) => link.getAttribute("href") ?? ""));
      let at = person?.id ? hrefs.findIndex((href) => href.replace(/[?#].*$/, "").endsWith(`/users/${person.id}`)) : -1;
      if (at < 0) {
        const name = typeof input === "string" ? input : givenText(input, ["name", "userName", "displayName"]);
        if (name) {
          const texts = (await links.allInnerTexts()).map((each) => each.trim().toLowerCase());
          at = texts.findIndex((each) => each === name.trim().toLowerCase());
        }
      }
      if (at < 0) {
        unbound(where, `no name in the list on ${page.url()} links to the account ${JSON.stringify(input)} (${hrefs.length} accounts listed)`);
      }
      await links.nth(at).click();
      await page.waitForURL((url) => /^\/users\/[^/]+$/.test(url.pathname), { timeout: 10000 }).catch(() => undefined);
      await ready();
    },
    // Each row as "Status | Account type | Name", one per line.
    userRow: async () => {
      const rows = await userListRows();
      if (!rows.length) return "";
      const at = await userListColumns();
      return rows.map((cells) => [cells[at.status], cells[at.type], cells[at.name]].filter(Boolean).join(" | ")).join("\n");
    },
    statusBadge: () => userListColumn("status"),
    accountType: () => userListColumn("type"),
    // The Administrator column beside the name it belongs to: "Robin Placeholder: Yes".
    adminCheck: async () => {
      const rows = await userListRows();
      if (!rows.length) return "";
      const at = await userListColumns();
      return rows.map((cells) => `${cells[at.name] ?? ""}: ${cells[at.admin] ?? ""}`).join("\n");
    },
    // The dialog's words while it is open; closed (cancelled, exported, never opened), nothing.
    exportModal: async () => {
      if (await onUserList()) return "";
      return (await dialog().count()) ? (await dialog().innerText()).trim() : "";
    },
    // "disabled" while Export cannot be pressed, nothing once it can. The dialog is opened
    // to look, as a person would.
    exportDisabledUntilSelection: async () => {
      const scope = await exportDialog("export_disabled_until_selection");
      const control = await findControl(scope, /^\s*export\s*$/i);
      if (!control) unbound("user-list.export_disabled_until_selection", `the export dialog on ${page.url()} has no "Export" button`);
      return (await isDisabled(control)) ? "disabled" : "";
    },
  };

  const userProfile: S.UserProfilePage = {
    ...profileOfUserId,
    ...(readingsOfRefusedProfile as Pick<S.UserProfilePage, (typeof PROFILE_READINGS)[number]>),
    open: (params) => go("/users/:userId", params as unknown as Record<string, string>),
    // An account the reader may not see, or none by that identifier: the "Page not found"
    // screen, read whole; a profile that opened reads as nothing.
    notFoundPage: async () => ((await notFoundShown()) ? mainText() : ""),
  };

  const { reactivateAccount: _selfHasNoReactivate, toggleAdminPermission: _selfHasNoAdmin, permissionsLabel: _selfHasNoPermissions, adminCheckbox: _selfHasNoAdminBox, ...selfProfile } =
    profileScreen("user-profile-self", "/users/me");
  void _selfHasNoReactivate;
  void _selfHasNoAdmin;
  void _selfHasNoPermissions;
  void _selfHasNoAdminBox;
  const userProfileSelf: S.UserProfileSelfPage = {
    ...selfProfile,
    open: () => go("/users/me"),
    // Signed out, /users/me answers with the "Page not found" screen (or, once, a redirect
    // to /sign-in): that refusal is read back; the profile itself reads as nothing.
    signInRequired: () => refusalShown(),
  };

  // ---------------------------------------------------------------- the profile picture

  // Walked signed in (as the administrator and as a vendor): the profile says "No profile
  // picture has been added." or shows an image "Your current profile picture" (its address
  // /api/files/<id>?type=blob). "Edit profile" opens "Edit your details", whose first group,
  // "Profile picture (optional)", carries the rule "A JPEG or PNG image, up to 10 MB. A
  // picture wider or taller than 500 pixels is made smaller to fit, keeping its proportions.
  // Anyone can see your profile picture, including people who are not signed in." and a
  // "Choose a profile picture" button, which opens no file chooser (click, Enter or Space),
  // so choosing a picture fails, naming that button (see offerFile). A stored picture is shown as "Your current profile
  // picture"; refusals are alerts in the group. Readings read what the page shows and never
  // press "Save changes": saving is userProfileSelf.saveChanges, which a test calls itself.
  //
  // On an organization's screens the same picker is the organization's logo. Walked signed in
  // as the owner of the seeded organizations: /organizations/create draws the group "Logo
  // (optional)" (with "No logo has been added." or the logo held), the rule "A JPEG or PNG
  // image, up to 10 MB. A logo wider or taller than 500 pixels is made smaller to fit, …" and
  // "Choose a logo (optional)" ("Choose a different logo" once one is held or chosen); on
  // /organizations/<id>/edit the same group is on the form "Edit organization" opens in the
  // "Organization" section, and the closed screen shows the stored logo in a group "Logo" as
  // the image "<legal name> logo" (/api/files/<id>?type=blob). This button does open a file
  // chooser. A file chosen is previewed as "Preview of <name>, the new logo" with the status
  // "<name> is ready. Save your changes to use it as the logo."; a refused one is an alert in
  // the group ("<name> cannot be used as a logo" …). An 800×400 PNG saved was stored at
  // 500×250. While the browser is on one of those screens, this picker is the logo's.
  const PICKER_GROUP = /^\s*(profile picture|logo)\b/i;
  const PICKER_BUTTON = /^\s*choose (a |a different )?(profile picture|logo)(\s*\(optional\))?\s*$/i;
  const CURRENT_PICTURE = /^\s*your current profile picture\s*$|current logo|\blogo\s*$/i;
  const pickerGroup = (): Locator => seen(page.getByRole("group", { name: PICKER_GROUP })).first();
  // The group as the form draws it, with its button: the closed organization screen's "Logo"
  // group holds only the image.
  const pickerForm = (): Locator =>
    seen(page.getByRole("group", { name: PICKER_GROUP }).filter({ has: page.getByRole("button", { name: PICKER_BUTTON }) })).first();
  const onOrganizationScreen = (): boolean =>
    originOf(page.url()) === originOf(baseURL) && /^\/organizations\/(create|[^/]+\/edit)$/.test(new URL(page.url()).pathname);

  async function onPicker(member: string): Promise<void> {
    const where = `file-image-picker.${member}`;
    const at = new URL(page.url());
    if (onOrganizationScreen()) {
      await ready();
      const why = await whyNotHere();
      if (why) unbound(where, `${at.pathname} did not open as a screen at ${page.url()}: ${why.replace(/\n+/g, " ")}; the logo picker is offered there to the organization's owner`);
      // The logo is drawn in the edit screen's "Organization" section only.
      if (/\/edit$/.test(at.pathname) && !(await pickerGroup().count())) {
        const section = await orgSectionLink(ORG_TAB.organization);
        if (section) {
          await section.click();
          await settle();
          await ready();
        }
      }
      return;
    }
    const onProfile = originOf(page.url()) === originOf(baseURL) && /^\/(users\/[^/]+|sign-up\/complete)$/.test(at.pathname);
    if (!onProfile) await go("/users/me");
    await ready();
    const why = await whyNotHere();
    if (why) unbound(where, `/users/me did not open as a screen at ${page.url()}: ${why.replace(/\n+/g, " ")}; the picture picker is offered on one's own profile once signed in`);
    await seen(page.getByText(/^\s*status:/i).or(page.getByRole("group", { name: PICKER_GROUP })))
      .first()
      .waitFor({ state: "visible", timeout: 10000 })
      .catch(() => undefined);
  }

  // The picker as drawn on the edit form, opened with "Edit profile" when it is not up.
  async function pickerShown(member: string): Promise<Locator> {
    const where = `file-image-picker.${member}`;
    await onPicker(member);
    const logo = onOrganizationScreen();
    const opener = logo ? /^\s*edit organization\s*$/i : /^\s*edit profile\s*$/i;
    if (!(await pickerForm().count())) {
      const edit = await findControl(page, opener);
      if (edit && !(await isDisabled(edit))) {
        await edit.click();
        await settle();
        await pickerForm().waitFor({ state: "visible", timeout: 10000 }).catch(() => undefined);
      }
    }
    if (!(await pickerForm().count())) {
      unbound(
        where,
        logo
          ? `signed in, opened ${page.url()} (its "Organization" section) and pressed "Edit organization" where offered; no "Logo" group with a "Choose a logo" button is drawn; it offers ${await offered()}`
          : `signed in, opened ${page.url()} and pressed "Edit profile" where offered; no "Profile picture" group is drawn; it offers ${await offered()}`,
      );
    }
    return pickerForm();
  }

  // The address of the stored picture (or, on an organization screen, logo) as the page draws
  // it, or nothing when it holds none. A chosen file's preview ("Preview of <name>, the new
  // logo") is not what is stored, and is never read as it.
  async function storedPictureAddress(member: string): Promise<string> {
    await onPicker(member);
    const images = seen(page.getByRole("main").getByRole("img", { name: CURRENT_PICTURE }));
    for (let i = 0; i < (await images.count()); i++) {
      const alt = ((await images.nth(i).getAttribute("alt")) ?? "").trim();
      if (/^preview of\b/i.test(alt)) continue;
      return (await images.nth(i).getAttribute("src")) ?? "";
    }
    return "";
  }

  async function storedPictureSize(member: string, side: "width" | "height"): Promise<string> {
    const src = await storedPictureAddress(member);
    if (!src) return "";
    const size = await page.evaluate(async (href) => {
      const image = new Image();
      image.src = new URL(href, window.location.href).href;
      await image.decode().catch(() => undefined);
      return { width: image.naturalWidth, height: image.naturalHeight };
    }, src);
    return size[side] ? String(size[side]) : "";
  }

  const fileImagePicker: S.FileImagePickerPage = {
    open: () => go("/users/me"),
    chooseImage: async (input) => {
      await pickerShown("choose_image");
      await offerFile("file-image-picker.choose_image", PICKER_BUTTON, input);
    },
    imageAddress: () => storedPictureAddress("image_address"),
    currentImage: () => storedPictureAddress("current_image"),
    // The preview of a picture chosen and not yet saved, by what it says it shows.
    chosenImagePreview: async () => {
      await onPicker("chosen_image_preview");
      const preview = seen(page.getByRole("img", { name: /^\s*preview of\b/i }));
      if (!(await preview.count())) return "";
      return (await preview.first().getAttribute("alt"))?.trim() ?? "";
    },
    // The rule the picker states against its button, on the edit form.
    onlyJpegAndPngOffered: async () => {
      const group = await pickerShown("only_jpeg_and_png_offered");
      const button = seen(group.getByRole("button", { name: PICKER_BUTTON })).first();
      if (await button.count()) {
        const described = await button.evaluate((element) =>
          (element.getAttribute("aria-describedby") ?? "")
            .split(/\s+/)
            .filter(Boolean)
            .map((id) => document.getElementById(id)?.innerText ?? "")
            .join("\n"),
        );
        if (described.trim()) return described.trim();
      }
      return (await paragraphs(group)).filter((words) => /jpe?g|png/i.test(words)).join("\n");
    },
    // The refusal the picker draws in its group, as it stands; none reads as nothing.
    rejectedImageError: async () => {
      await onPicker("rejected_image_error");
      if (!(await pickerGroup().count())) return "";
      const alerts = seen(pickerGroup().getByRole("alert"));
      return (await alerts.allInnerTexts()).map((words) => words.trim()).filter(Boolean).join("\n");
    },
    // The stored picture asked for with no session (no cookie, no credentials): its type when
    // it is answered, nothing when it is refused or there is no picture.
    imageReadableWhenSignedOut: async () => {
      const src = await storedPictureAddress("image_readable_when_signed_out");
      if (!src) return "";
      const answer = await page.evaluate(async (href) => {
        const response = await fetch(new URL(href, window.location.href).href, { credentials: "omit" });
        return { ok: response.ok, type: response.headers.get("content-type") ?? "" };
      }, src);
      return answer.ok ? answer.type || "answered" : "";
    },
    storedImageWidth: () => storedPictureSize("stored_image_width", "width"),
    storedImageHeight: () => storedPictureSize("stored_image_height", "height"),
  };

  // ---------------------------------------------------------------- the signed-in person's notices

  // A section of one's own account: /users/me?tab=… or /users/<own id>?tab=…. The client sends
  // a vendor still to complete a profile on to /sign-up/complete from here too.
  function accountSection(pageId: string, route: string) {
    const screen = signedInScreen(pageId, route);
    const on = async (member: string): Promise<void> => {
      await screen.on(member);
      if (new URL(page.url()).pathname === "/sign-up/complete") {
        throw new Error(
          `${pageId}.${member} — ${route} sent this person on to ${page.url()} ("Complete Your Profile"): the account has still to complete its profile, and its account screens are not shown to it until then`,
        );
      }
    };
    return { ...screen, on };
  }

  // Walked signed in: "Notifications" over "Notifications are sent to <address>. If this is
  // wrong, correct it on your profile." and one box, "Email me when new opportunities are
  // posted". Pressing the box changes nothing — it stays as it was, no dialog opens and
  // nothing is sent to the service — so no unsubscribe dialog is ever shown.
  function noticesScreen(pageId: string, route: string) {
    const notices = accountSection(pageId, route);
    async function noticesTab(member: string): Promise<void> {
      await notices.on(member);
      const tab = seen(page.getByRole("tab", { name: /notifications/i }));
      if (await tab.count()) {
        await tab.first().click();
        await settle();
      }
    }
    async function noticesBox(member: string): Promise<Locator> {
      await noticesTab(member);
      const box = seen(page.getByRole("checkbox", { name: NOTICES_BOX }).or(page.getByRole("switch", { name: NOTICES_BOX })));
      if (!(await box.count())) unbound(notices.where(member), `no new-opportunities box on ${page.url()}; it offers ${await offered()}`);
      return box.first();
    }
    return {
      open: (params?: Record<string, string>) => notices.open(params),
      toggleNewOpportunityNotifications: async (input?: unknown) => {
        const where = notices.where("toggle_new_opportunity_notifications");
        const box = await noticesBox("toggle_new_opportunity_notifications");
        const wanted = boxWanted(input, NOTICE_KEYS);
        if (await isDisabled(box)) throw new Error(`${where} — the new-opportunities box is disabled on ${page.url()}`);
        const was = await box.isChecked();
        if (wanted !== undefined && was === wanted) return;
        await box.click();
        await settle();
        // A box that did not move and asked nothing has not done what was pressed.
        if ((await box.isChecked()) === was && !(await dialog().count())) {
          throw new Error(`${where} — pressing "Email me when new opportunities are posted" on ${page.url()} left it ${was ? "ticked" : "unticked"}, and no dialog opened`);
        }
      },
      confirmUnsubscribe: async () => {
        await noticesTab("confirm_unsubscribe");
        await inDialog(notices.where("confirm_unsubscribe"), /unsubscribe|confirm|^\s*yes\s*$/i);
      },
      cancelUnsubscribe: async () => {
        await noticesTab("cancel_unsubscribe");
        await inDialog(notices.where("cancel_unsubscribe"), /^\s*(cancel|no)\s*$/i);
      },
      newOpportunitiesCheckbox: async () => ((await (await noticesBox("new_opportunities_checkbox")).isChecked()) ? "checked" : "unchecked"),
      notificationEmailAddress: async () => {
        await noticesTab("notification_email_address");
        const found = /[^\s@]+@[^\s@]+\.[^\s@]+/.exec(await mainText());
        return found ? found[0].replace(/[.,;]+$/, "") : "";
      },
      unsubscribeModal: async () => {
        await noticesTab("unsubscribe_modal");
        return (await dialog().count()) ? (await dialog().innerText()).trim() : "";
      },
    };
  }
  const userProfileSelfNotifications: S.UserProfileSelfNotificationsPage = noticesScreen("user-profile-self-notifications", "/users/me?tab=notifications");

  // Walked signed in: /users/me?tab=notifications&unsubscribe opens on the Notifications
  // section ("Notifications are sent to <address>. If this address is wrong, correct it on
  // your profile." and the "Email me when new opportunities are posted" box). To an account
  // that receives those emails (test-vendor-1, box ticked) it also opens a dialog, "Stop
  // emails about new opportunities?", saying "You are signed in as <name>. <address> will no
  // longer be emailed when new opportunities are posted." with "Keep receiving them" and
  // "Unsubscribe"; "Keep receiving them" closes it and leaves the box ticked. To an account
  // that does not receive them (the administrator, box unticked) no dialog opens, and the
  // readings report that empty. Signed out the address redirects to /sign-in, which
  // sign_in_required reads, and the readings read that refusal as nothing shown.
  function unsubscribeLanding(): S.NotificationUnsubscribeLandingPage {
    const pageId = "notification-unsubscribe-landing";
    const route = "/users/me?tab=notifications&unsubscribe";
    const notices = noticesScreen(pageId, route);
    // True once the section is drawn, after giving the dialog its moment to open over it.
    const reached = async (): Promise<boolean> => {
      await ready();
      if (await whyNotHere()) return false;
      await dialog().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
      return true;
    };
    const inConfirmation = async (member: string, name: RegExp, what: string): Promise<void> => {
      const where = `${pageId}.${member}`;
      if (!(await reached())) unbound(where, `${route} did not open (${await whyNotHere()})`);
      if (!(await dialog().count())) {
        throw new Error(
          `${where} — signed in and opened ${page.url()}: no "Stop emails about new opportunities?" dialog opened, so there is no "${what}" to press (the dialog is shown only to an account whose "Email me when new opportunities are posted" box is ticked)`,
        );
      }
      await press(where, name, dialog());
      await settle();
    };
    return {
      open: () => go(route),
      confirmUnsubscribe: () => inConfirmation("confirm_unsubscribe", /^\s*unsubscribe\s*$/i, "Unsubscribe"),
      cancelUnsubscribe: () => inConfirmation("cancel_unsubscribe", /^\s*(keep receiving( them)?|cancel)\s*$/i, "Keep receiving them"),
      unsubscribeConfirmation: async () => {
        if (!(await reached())) return "";
        return (await dialog().count()) ? (await dialog().innerText()).trim() : "";
      },
      confirmationNamesSignedInAddress: async () => {
        if (!(await reached())) return "";
        if (!(await dialog().count())) return "";
        const found = /[^\s@]+@[^\s@]+\.[^\s@]+/.exec(await dialog().innerText());
        return found ? found[0].replace(/[.,;]+$/, "") : "";
      },
      resolvesToSignedInPerson: async () => {
        if (!(await reached())) return "";
        return notices.notificationEmailAddress();
      },
      signInRequired: () => refusalShown(),
    } as S.NotificationUnsubscribeLandingPage;
  }

  // ---------------------------------------------------------------- the signed-in person's capabilities

  // Walked signed in as a vendor: "Capabilities" over "Tick each capability you have. Your
  // choices are saved as you make them, and you may leave them all unticked." and a list
  // named "Capabilities", one item per capability: a box named for it ("Agile Coaching")
  // and a "Show description of Agile Coaching" button, which turns into "Hide description of
  // …" and draws the description as a paragraph under it. Ticking or unticking a box saves
  // it at once and says so in a status line ("Saved. DevOps Engineering is recorded as a
  // capability you hold." / "… is no longer recorded."). The same section is drawn at
  // /users/<own id>?tab=capabilities. A public sector account's profile has no such section,
  // and the administrator is shown another account's profile without it.
  const CAPABILITY_KEYS = ["capability", "name", "title", "label", "capabilityName"];
  const escapeText = (words: string): string => words.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  function capabilitiesScreen(pageId: string, route: string) {
    const screen = accountSection(pageId, route);
    const list = (): Locator => seen(page.getByRole("list", { name: /^\s*capabilities\s*$/i })).first();
    // True when the list is drawn. An action needs it and reports unbound without it; a
    // reading of a section that opened without it is the empty answer.
    async function onList(member: string, needed: boolean): Promise<boolean> {
      await screen.on(member);
      await list().waitFor({ state: "visible", timeout: 10000 }).catch(() => undefined);
      if (await list().count()) return true;
      if (needed) {
        unbound(
          screen.where(member),
          `signed in, opened ${page.url()}: it draws "${await firstHeading()}" and no list of capabilities to tick (walked as a vendor the list is there; a public sector account's profile has no Capabilities section, and another account's profile is drawn to the administrator without one)`,
        );
      }
      return false;
    }
    const capabilityOf = (input: unknown): string => (typeof input === "string" ? input : givenText(input, CAPABILITY_KEYS)).trim();
    async function boxFor(member: string, input: unknown): Promise<Locator> {
      const name = capabilityOf(input);
      if (!name) unbound(screen.where(member), `the input names no capability (looked for ${CAPABILITY_KEYS.join(", ")}; given ${JSON.stringify(input)})`);
      const box = seen(list().getByRole("checkbox", { name: new RegExp(`^\\s*${escapeText(name)}\\s*$`, "i") }));
      if (!(await box.count())) {
        const names = await seen(list().getByRole("checkbox")).evaluateAll((boxes) =>
          boxes.map((element) => element.getAttribute("aria-label") ?? (element as HTMLInputElement).labels?.[0]?.innerText ?? ""),
        );
        unbound(screen.where(member), `no capability named "${name}" on ${page.url()}; it lists ${names.filter(Boolean).join(", ") || "none"}`);
      }
      return box.first();
    }
    async function boxNames(onlyTicked: boolean): Promise<string[]> {
      const boxes = seen(list().getByRole("checkbox"));
      const out: string[] = [];
      for (let i = 0; i < (await boxes.count()); i++) {
        const box = boxes.nth(i);
        if (onlyTicked && !(await box.isChecked())) continue;
        const item = box.locator("xpath=ancestor::li[1]");
        const first = lined(await item.innerText().catch(() => ""))[0] ?? "";
        out.push(first);
      }
      return out.filter(Boolean);
    }
    return {
      open: (params?: Record<string, string>) => screen.open(params),
      toggleCapability: async (input?: unknown) => {
        const where = screen.where("toggle_capability");
        await onList("toggle_capability", true);
        const box = await boxFor("toggle_capability", input);
        if (await isDisabled(box)) throw new Error(`${where} — the box for "${capabilityOf(input)}" is disabled on ${page.url()}`);
        const was = await box.isChecked();
        const wanted = boxWanted(input, ["held", "selected", "ticked", "has"]);
        if (wanted !== undefined && wanted === was) return;
        await box.click();
        // The choice is saved as it is made, and the status line says so.
        await seen(page.getByRole("status").filter({ hasText: /saved|could not|failed|error/i }))
          .first()
          .waitFor({ state: "visible", timeout: 10000 })
          .catch(() => undefined);
        await settle();
        if ((await box.isChecked()) === was) {
          const said = (await page.getByRole("status").allInnerTexts().catch(() => [])).join(" ").trim();
          throw new Error(`${where} — pressing "${capabilityOf(input)}" on ${page.url()} left it ${was ? "ticked" : "unticked"}${said ? `; it says: ${said}` : ""}`);
        }
      },
      expandCapabilityDescription: async (input?: unknown) => {
        const where = screen.where("expand_capability_description");
        await onList("expand_capability_description", true);
        const name = capabilityOf(input);
        const of = name ? escapeText(name) : ".+";
        const shown = seen(list().getByRole("button", { name: new RegExp(`^\\s*hide description of ${of}\\s*$`, "i") }));
        if (name && (await shown.count())) return;
        const toggle = seen(list().getByRole("button", { name: new RegExp(`^\\s*show description of ${of}\\s*$`, "i") }));
        if (!(await toggle.count())) unbound(where, `no "Show description of ${name || "…"}" button on ${page.url()}`);
        await toggle.first().click();
        await settle();
      },
      // One line per capability the section lists, in its order.
      capabilityRow: async () => ((await onList("capability_row", false)) ? (await boxNames(false)).join("\n") : ""),
      // The capabilities whose boxes are ticked, one per line; none ticked reads as nothing.
      capabilityChecked: async () => ((await onList("capability_checked", false)) ? (await boxNames(true)).join("\n") : ""),
      // The descriptions drawn open, one per line; none open reads as nothing.
      capabilityDescription: async () => {
        if (!(await onList("capability_description", false))) return "";
        return (await paragraphs(list())).join("\n");
      },
    };
  }
  const userProfileSelfCapabilities: S.UserProfileSelfCapabilitiesPage = capabilitiesScreen("user-profile-self-capabilities", "/users/me?tab=capabilities");
  const userProfileCapabilities: S.UserProfileCapabilitiesPage = capabilitiesScreen("user-profile-capabilities", "/users/:userId?tab=capabilities");

  // ---------------------------------------------------------------- the signed-in person's policies and terms

  // Walked signed in: "Policies, Terms & Agreements" with "Privacy policy" ("Read the Digital
  // Marketplace privacy policy", "You agreed to this policy when your account was created."),
  // "Terms and conditions" ("Read the Digital Marketplace terms and conditions", "You agreed
  // to the terms and conditions on <date>", or "You last agreed …" for the vendor whose
  // agreement was reset) and "Program terms" (a link for each of Code With Us, Sprint With Us
  // and Team With Us). Nothing on it asks anyone to accept updated terms, the reset vendor
  // included: no warning, no button and no dialog.
  function legalScreen(pageId: string, route: string) {
    const legal = accountSection(pageId, route);
    const APP_TERMS = /^\s*read the .*terms and conditions\s*$/i;
    const PROGRAM_TERMS = /(code|sprint|team) with us terms/i;
    async function between(member: string, from: RegExp, to: RegExp): Promise<string> {
      await legal.on(member);
      const lines = await textLines();
      const start = lines.findIndex((line) => from.test(line));
      if (start < 0) return "";
      const end = lines.findIndex((line, i) => i > start && to.test(line));
      return lines.slice(start, end > start ? end : undefined).join("\n");
    }
    return {
      open: (params?: Record<string, string>) => legal.open(params),
      openAppTerms: async () => {
        await legal.on("open_app_terms");
        const link = seen(page.getByRole("link", { name: APP_TERMS }));
        if (!(await link.count())) unbound(legal.where("open_app_terms"), `no "Read the … terms and conditions" link on ${page.url()}; it offers ${await offered()}`);
        await link.first().click();
        await settle();
      },
      acceptUpdatedTerms: async () => {
        await legal.on("accept_updated_terms");
        const button = seen(page.getByRole("button", { name: /accept|agree/i }));
        if (!(await button.count())) {
          unbound(legal.where("accept_updated_terms"), `${page.url()} offers no control to accept updated terms (walked signed in as the vendor whose agreement was reset, it says "You last agreed to terms and conditions on …" and offers only links); it offers ${await offered()}`);
        }
        if (await isDisabled(button.first())) throw new Error(`${legal.where("accept_updated_terms")} — the accept control is disabled on ${page.url()}`);
        await button.first().click();
        await settle();
      },
      confirmAcceptUpdatedTerms: async () => {
        await legal.on("confirm_accept_updated_terms");
        await inDialog(legal.where("confirm_accept_updated_terms"), /accept|agree|confirm|^\s*yes\s*$/i);
      },
      privacyPolicy: () => between("privacy_policy", /^privacy policy$/i, /^terms and conditions$/i),
      appTermsLink: async () => {
        await legal.on("app_terms_link");
        return hrefOf(page, APP_TERMS);
      },
      // Only the affirmative "You agreed to the terms and conditions on <date>". Walked signed
      // in as the vendor who never agreed, the section says "You have not agreed to the terms
      // and conditions." and the vendor whose agreement was reset reads "You last agreed to
      // terms and conditions on …"; neither is a standing acceptance, so both read as nothing.
      acceptedOnNotice: async () => {
        await legal.on("accepted_on_notice");
        return linesMatching(/^\s*you agreed to (the )?terms/i);
      },
      termsUpdatedWarning: async () => {
        await legal.on("terms_updated_warning");
        return linesMatching(/(terms|conditions)[^.]*\b(updated|changed)\b|\b(updated|new) terms\b|must (accept|agree)/i);
      },
      programTermsLinks: async () => {
        await legal.on("program_terms_links");
        const links = seen(page.getByRole("link", { name: PROGRAM_TERMS }));
        const out: string[] = [];
        for (let i = 0; i < (await links.count()); i++) out.push((await links.nth(i).innerText()).trim());
        return out.join("\n");
      },
      acceptUpdatedTermsModal: async () => {
        await legal.on("accept_updated_terms_modal");
        return (await dialog().count()) ? (await dialog().innerText()).trim() : "";
      },
    };
  }

  // ---------------------------------------------------------------- the vendor's dashboard

  // Walked on the current build signed in as the organization-owner vendor (who wrote the
  // seeded proposals) and as the first vendor (who wrote none): /dashboard is "Dashboard",
  // the navigation "Dashboard sections" with the links "My proposals" (#my-proposals) and
  // "My organizations' proposals" (#organization-proposals), and a region for each. "My
  // proposals" holds the table "Proposals you wrote, most recently updated first"
  // (Opportunity — a link to the proposal's screen — | Program | Status | Last updated), or
  // "You have not started any proposals. Browse opportunities to find one to bid on.";
  // "My organizations' proposals" the table "Proposals written for organizations you own or
  // administer" (Opportunity | Organization | Program | Written by | Status), or "No one has
  // started a proposal for an organization you own or administer." A vendor still to
  // complete a profile is sent on to /sign-up/complete instead.
  const vendorDash = signedInScreen("proposal-vendor-dashboard", "/dashboard");
  const MY_PROPOSALS = /^\s*my proposals\s*$/i;
  const ORG_PROPOSALS = /^\s*my organi[sz]ations.? proposals\s*$/i;
  async function vendorDashShown(member: string): Promise<boolean> {
    await vendorDash.on(member);
    return new URL(page.url()).pathname !== "/sign-up/complete";
  }
  const vendorDashRegion = (name: RegExp): Locator => seen(regionNamed(page.getByRole("main"), name)).first();
  async function vendorDashPress(member: string, name: RegExp): Promise<void> {
    const where = vendorDash.where(member);
    if (!(await vendorDashShown(member))) {
      unbound(where, `/dashboard sent this person on to ${page.url()} ("Complete Your Profile") instead of showing a dashboard`);
    }
    const sections = seen(page.getByRole("navigation", { name: /dashboard sections/i }));
    const control = seen(sections.getByRole("link", { name }).or(page.getByRole("tab", { name })));
    if (!(await control.count())) {
      unbound(
        where,
        `signed in as ${actingId()}, /dashboard at ${page.url()} offers no section link named ${name}; walked on the current build as the organization-owner vendor and the first vendor, its "Dashboard sections" are "My proposals" and "My organizations' proposals"; this one offers ${await offered()}`,
      );
    }
    await control.first().click();
    await settle();
    await vendorDashRegion(name).scrollIntoViewIfNeeded().catch(() => undefined);
  }
  // A section's rows, one line per row with its cells joined by " | "; nothing when the
  // section holds no table, or when the page sent the person on to complete a profile.
  async function vendorDashRows(member: string, name: RegExp): Promise<string[]> {
    if (!(await vendorDashShown(member))) return [];
    const region = vendorDashRegion(name);
    if (!(await region.count())) {
      unbound(vendorDash.where(member), `/dashboard at ${page.url()} draws no section headed ${name} for ${actingId()}; it offers ${await offered()}`);
    }
    return tableRows(region);
  }
  // A section's own words while it holds no table: its empty message.
  async function vendorDashEmpty(member: string, name: RegExp): Promise<string> {
    if (!(await vendorDashShown(member))) return "";
    const region = vendorDashRegion(name);
    if (!(await region.count())) {
      unbound(vendorDash.where(member), `/dashboard at ${page.url()} draws no section headed ${name} for ${actingId()}; it offers ${await offered()}`);
    }
    if (await seen(region.getByRole("table")).count()) return "";
    return (await paragraphs(region)).map((one) => one.replace(/\s+/g, " ").trim()).join("\n");
  }
  const proposalVendorDashboard: S.ProposalVendorDashboardPage = {
    open: () => vendorDash.open(),
    showMyProposals: () => vendorDashPress("show_my_proposals", MY_PROPOSALS),
    showOrgProposals: () => vendorDashPress("show_org_proposals", ORG_PROPOSALS),
    myProposalsTable: async () => (await vendorDashRows("my_proposals_table", MY_PROPOSALS)).join("\n"),
    orgProposalsTable: async () => (await vendorDashRows("org_proposals_table", ORG_PROPOSALS)).join("\n"),
    // The "Status" column of "My proposals" (the third: Opportunity | Program | Status | Last
    // updated), one per row.
    proposalStatus: async () => {
      const rows = await vendorDashRows("proposal_status", MY_PROPOSALS);
      const region = vendorDashRegion(MY_PROPOSALS);
      const headers = (await seen(region.getByRole("columnheader")).allInnerTexts()).map((one) => one.trim());
      const at = headers.findIndex((one) => /^status$/i.test(one));
      if (at < 0) return "";
      return rows.map((row) => row.split(" | ")[at] ?? "").filter(Boolean).join("\n");
    },
    emptyMyProposalsMessage: () => vendorDashEmpty("empty_my_proposals_message", MY_PROPOSALS),
    emptyOrgProposalsMessage: () => vendorDashEmpty("empty_org_proposals_message", ORG_PROPOSALS),
  };

  // ---------------------------------------------------------------- choosing a program
  //
  // /opportunities/create, to the administrator and public sector staff: "Create an
  // opportunity" over one region per program, each its name, a sentence, "Maximum budget:
  // <amount>" and a "Create a <program> opportunity" link to that program's form. A vendor
  // is shown "Page not found" there.
  const programSelect = signedInScreen("opportunity-program-select", "/opportunities/create");
  async function programRegions(member: string): Promise<Locator> {
    await programSelect.on(member);
    return seen(page.getByRole("main").getByRole("region"));
  }
  async function chooseProgram(member: string, program: string): Promise<void> {
    await programSelect.on(member);
    await press(programSelect.where(member), new RegExp(`^\\s*create an? ${program} opportunity\\s*$`, "i"));
    await ready();
  }
  const opportunityProgramSelect: S.OpportunityProgramSelectPage = {
    open: () => programSelect.open(),
    chooseCodeWithUs: () => chooseProgram("choose_code_with_us", "Code With Us"),
    chooseSprintWithUs: () => chooseProgram("choose_sprint_with_us", "Sprint With Us"),
    chooseTeamWithUs: () => chooseProgram("choose_team_with_us", "Team With Us"),
    // One block per program, its lines joined; blocks separated by a blank line.
    programCard: async () => {
      const regions = await programRegions("program_card");
      const out: string[] = [];
      for (let i = 0; i < (await regions.count()); i++) out.push(lined(await regions.nth(i).innerText()).join("\n"));
      return out.join("\n\n");
    },
    // "Code With Us: Up to $70,000", one line per program.
    maxBudget: async () => {
      const regions = await programRegions("max_budget");
      const out: string[] = [];
      for (let i = 0; i < (await regions.count()); i++) {
        const lines = lined(await regions.nth(i).innerText());
        const budget = lines.find((line) => /^maximum budget\b/i.test(line));
        if (budget) out.push(`${lines[0]}: ${budget.replace(/^maximum budget:?\s*/i, "")}`);
      }
      return out.join("\n");
    },
  };

  // ---------------------------------------------------------------- reading term and definition

  // A value this target draws as a term over its definition ("Proposal deadline" /
  // "December 1, 2026 at 4:00 p.m. Pacific time"); a term the screen does not carry reads
  // as nothing.
  async function definitionOf(term: RegExp): Promise<string> {
    await ready();
    return page
      .getByRole("main")
      .evaluate(
        (main, [source, flags]) => {
          const wanted = new RegExp(source, flags);
          for (const dt of Array.from(main.querySelectorAll("dt"))) {
            if (!wanted.test((dt as HTMLElement).innerText.trim())) continue;
            let next = dt.nextElementSibling;
            while (next && next.tagName.toLowerCase() !== "dd") next = next.nextElementSibling;
            return next ? (next as HTMLElement).innerText.trim() : "";
          }
          return "";
        },
        [term.source, term.flags] as const,
      )
      .catch(() => "");
  }

  // "Opportunity ID: <id>", drawn on both the public page and the management screen.
  async function shownIdentifier(): Promise<string> {
    const line = (await textLines()).find((one) => /^opportunity id:/i.test(one));
    if (line) return line.replace(/^opportunity id:\s*/i, "").trim();
    // Still on a program's create form (a create it refused): no opportunity was made.
    const segment = /^\/opportunities\/[^/]+\/([^/?#]+)/.exec(new URL(page.url()).pathname)?.[1] ?? "";
    return segment === "create" ? "" : segment;
  }

  // ---------------------------------------------------------------- a Code With Us opportunity's page
  //
  // /opportunities/code-with-us/:opportunityId: "Code With Us opportunity" over the title,
  // then Status, Proposal deadline, Reward, Location, Remote work, Published, Created by and
  // Last changed by as terms and definitions (Created by and Last changed by only to staff),
  // "Opportunity ID: <id>", a "Watch this opportunity" checkbox under "Watching sends you an
  // email whenever this opportunity changes." (to anybody signed in; it says "You are no
  // longer watching this opportunity." and the like once pressed), to staff who may manage it
  // a "Manage this opportunity" link, and the Description (with its Attachments), Skills, Key
  // dates ("Assignment date: <date>", ...) and Addenda sections. Walked as the administrator,
  // a public sector employee and a vendor on the seeded published, draft and awarded
  // opportunities: an awarded opportunity names no successful proponent anywhere on it, and
  // to a vendor, while the opportunity takes proposals, it offers the link "Start a proposal"
  // to .../proposals/create (the Sprint With Us and Team With Us pages draw the same box and
  // link on the current build).
  //
  // A draft is shown only to whoever may see it: the seeded draft of another staff member
  // opens for the administrator (its Status "Draft") and answers a vendor and the other
  // public sector employee "Page not found". That answer, for an opportunity known to exist
  // (a seeded one, or one this run has already seen open), is the page withholding it from
  // this reader, so every reading of it is empty. For an identifier nobody has seen open it
  // cannot be told apart from a page that never existed, and is reported unbound.
  const cwuView = signedInScreen(CWU_VIEW, "/opportunities/code-with-us/:opportunityId");
  const knownOpportunities = new Set<string>(
    Object.values(seed.opportunities as unknown as Record<string, { id?: string }>)
      .map((one) => one.id ?? "")
      .filter(Boolean),
  );
  const cwuIdShown = (): string => /^\/opportunities\/code-with-us\/([^/?#]+)/.exec(new URL(page.url()).pathname)?.[1] ?? "";
  // True when the page is shown; false when it is withheld from this reader.
  async function onCwuView(member: string): Promise<boolean> {
    const refused = await refusalShown();
    const id = cwuIdShown();
    if (!refused) {
      if (id) knownOpportunities.add(id);
      return true;
    }
    if (id && knownOpportunities.has(id)) {
      noteRefusal(`${cwuView.where(member)} — the opportunity ${id}, which exists, answered ${actingId()} with ${refused.replace(/\n+/g, " ")}`);
      return false;
    }
    return unbound(cwuView.where(member), `the opportunity did not open at ${page.url()}: ${refused}`);
  }
  // The same, for an action: there is nothing to press on a page that was withheld.
  async function cwuViewShown(member: string): Promise<void> {
    if (!(await onCwuView(member))) {
      unbound(cwuView.where(member), `${page.url()} answered ${actingId()} "Page not found", so there is nothing on it to press`);
    }
  }
  async function cwuViewTerm(member: string, term: RegExp): Promise<string> {
    if (!(await onCwuView(member))) return "";
    return definitionOf(term);
  }
  async function cwuKeyDate(member: string, label: RegExp): Promise<string> {
    if (!(await onCwuView(member))) return "";
    const region = seen(regionNamed(page, /^key dates$/i));
    if (!(await region.count())) return "";
    for (const line of lined(await region.first().innerText())) {
      const found = label.exec(line);
      if (found) return line.slice(found.index + found[0].length).replace(/^\s*:\s*/, "").trim();
    }
    return "";
  }
  const CWU_VIEW_WALKED =
    "walked as the administrator, a public sector employee and a vendor on the seeded published, draft and awarded Code With Us opportunities";
  const opportunityCwuView: S.OpportunityCwuViewPage = {
    open: (params) => go("/opportunities/code-with-us/:opportunityId", params as unknown as Record<string, string>),
    // "Watch this opportunity" and "Start a proposal", as toggleWatchBox and
    // startProposalLink read them on every program's page.
    toggleWatch: async (input) => {
      await cwuViewShown("toggle_watch");
      await toggleWatchBox(cwuView.where("toggle_watch"), CWU_VIEW_WALKED, input);
    },
    startProposal: async () => {
      await cwuViewShown("start_proposal");
      await startProposalLink(cwuView.where("start_proposal"), CWU_VIEW_WALKED);
    },
    opportunityIdentifier: async () => {
      if (!(await onCwuView("opportunity_identifier"))) return "";
      return shownIdentifier();
    },
    status: () => cwuViewTerm("status", /^status$/i),
    publishedDate: async () => {
      const shown = await cwuViewTerm("published_date", /^published$/i);
      return /^not yet published$/i.test(shown) ? "" : shown;
    },
    createdByName: () => cwuViewTerm("created_by_name", /^created by$/i),
    lastChangedByName: () => cwuViewTerm("last_changed_by_name", /^last changed by$/i),
    proposalDeadline: () => cwuViewTerm("proposal_deadline", /^proposal deadline$/i),
    assignmentDate: () => cwuKeyDate("assignment_date", /^assignment date\b/i),
    startDate: () => cwuKeyDate("start_date", /^start date\b/i),
    reward: () => cwuViewTerm("reward", /^reward$/i),
    // The Addenda section's entries; "No addenda have been added." is none.
    addenda: async () => {
      if (!(await onCwuView("addenda"))) return "";
      const region = seen(regionNamed(page, /^addenda$/i));
      if (!(await region.count())) return "";
      return lined(await region.first().innerText())
        .slice(1)
        .filter((line) => !/^no addenda have been added\.?$/i.test(line))
        .join("\n");
    },
    // An awarded opportunity's page names no winner (seen on the seeded awarded one), so
    // these read as nothing on a page that opened.
    successfulProponent: async () => {
      if (!(await onCwuView("successful_proponent"))) return "";
      const said = (await textLines()).find((line) => /awarded to\s+\S/i.test(line));
      return said ? (/awarded to\s+(.+)$/i.exec(said)?.[1] ?? "").replace(/\.$/, "").trim() : definitionOf(/^(successful proponent|awarded to)$/i);
    },
    successfulProponentContactDetails: async () => {
      if (!(await onCwuView("successful_proponent_contact_details"))) return "";
      return awardDetail(`${CWU_VIEW}.successful_proponent_contact_details`, CONTACT_DETAIL);
    },
    successfulProponentScore: async () => {
      if (!(await onCwuView("successful_proponent_score"))) return "";
      return awardDetail(`${CWU_VIEW}.successful_proponent_score`, SCORE_DETAIL);
    },
  };

  // ---------------------------------------------------------------- managing a Code With Us opportunity
  //
  // /opportunities/code-with-us/:opportunityId/edit, to the administrator and to public
  // sector staff for an opportunity they may manage (another staff member's draft answers
  // "Page not found"): "Manage a Code With Us opportunity" over the title, "Status: <state>"
  // and "Opportunity ID: <id>", an "Opportunity actions" group, and the sections as links
  // under "Opportunity sections" (?tab=summary, opportunity, addenda, history). The actions
  // offered follow the state: a draft offers "Publish" (the administrator) or "Submit for
  // review" (its own author on the staff), and "Delete", with no "Edit" because its
  // ?tab=opportunity form is already editable; another staff member's draft answers a
  // public sector employee "Page not found"; a
  // published opportunity "Edit" and, to the administrator, "Cancel opportunity"; an awarded
  // one nothing. A published, lapsed or awarded one also has an Addenda section, which a
  // draft does not. "Edit" goes to
  // ?tab=opportunity, the form itself, with "Save changes" and "Cancel". Publishing and deleting ask first ("Publish opportunity",
  // "Delete opportunity").
  const CWU_EDIT = "opportunity-cwu-edit";
  const cwuManage = signedInScreen(CWU_EDIT, "/opportunities/code-with-us/:opportunityId/edit");
  const CWU_MANAGE_WALKED =
    "walked as the administrator and as a public sector employee on the seeded draft, published, awarded and with-three-proposals Code With Us opportunities and on ones just saved and published";
  function actionsGroup(): Locator {
    return seen(page.getByRole("group", { name: /^opportunity actions$/i })).first();
  }
  // The management screen's own address, without the section it is on.
  function manageAddress(): string {
    const found = /^(\/opportunities\/[^/]+\/[^/?#]+\/edit)/.exec(new URL(page.url()).pathname);
    return found ? baseURL + found[1] : "";
  }
  async function toSection(member: string, tab: string): Promise<boolean> {
    await cwuManage.on(member);
    const link = seen(page.getByRole("navigation", { name: /opportunity sections/i }).getByRole("link", { name: new RegExp(`^\\s*${tab}\\s*$`, "i") }));
    if (!(await link.count())) return false;
    const href = (await link.first().getAttribute("href")) ?? "";
    if (!new URL(page.url()).search.includes(`tab=${tab.toLowerCase()}`)) {
      if (href) await visit(href);
      else await link.first().click();
      await ready();
    }
    return true;
  }
  // The management screen answers "Page not found" to anybody who may not manage this
  // opportunity: a vendor, or a staff member on somebody else's. For such a reader that
  // refusal is the answer (they are shown none of it), so a reading made by them is nothing
  // and the refusal is logged. Only the administrator, who may manage any opportunity, being
  // refused means the screen could not be reached, and that stays unbound.
  async function refusedReader(member: string): Promise<boolean> {
    await ready();
    const why = await refusalShown();
    if (!why || !actingAs || actingMay(/any opportunity$/i)) return false;
    noteRefusal(`${cwuManage.where(member)} — the management screen answered ${actingId()} with ${why.replace(/\n+/g, " ")} at ${page.url()}`);
    return true;
  }
  async function sectionText(member: string, tab: string): Promise<string> {
    if (await refusedReader(member)) return "";
    if (!(await toSection(member, tab))) return "";
    const region = seen(regionNamed(page.getByRole("main"), new RegExp(`^${tab}$`, "i")));
    return (await region.count()) ? lined(await region.first().innerText()).join("\n") : "";
  }
  // Whether a management screen's History section offers anything for adding a note: a text
  // box, a file chooser or a button inside the section ("true"), or only the table of what
  // happened, "Every change of state and every event, newest first" ("false"). Seen as the
  // owning public sector employee on the seeded Code With Us opportunity with a private note
  // and on the seeded open Sprint With Us opportunity with a submitted proposal, and as the
  // administrator on the latter: each History section is that table alone, nothing to add.
  // An answer of absence comes only from a section actually reached: when the region named
  // History is not on the page, or its table of what happened never shows, the section was
  // not found and the reading is unbound, naming the address and the reader.
  async function noteControlsIn(where: string, region: Locator): Promise<string> {
    await region.waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    if (!(await region.count())) {
      unbound(where, `the "History" link was followed but no region named "History" is on ${page.url()} as ${actingId()}`);
    }
    const table = seen(region.getByRole("table")).first();
    const shown = await table.waitFor({ state: "visible", timeout: 5000 }).then(() => true, () => false);
    if (!shown) {
      unbound(where, `the "History" region on ${page.url()} as ${actingId()} never showed its table of what happened`);
    }
    const offered =
      (await seen(region.getByRole("textbox")).count()) +
      (await seen(region.getByRole("button")).count()) +
      (await region.getByLabel(/attach|upload|choose file/i).count());
    return offered ? "true" : "false";
  }
  // The Opportunity section is the form itself, and a form's text never carries what is in
  // its boxes: "Title(required)", "Location(required)", "Description (required)" and the rest
  // are labels whose values live in the fields. So the section is read as its text followed
  // by one "<label>: <value>" line for each field in it — text boxes and areas, the chosen
  // answer of each radio group ("Is remote work acceptable? (required): Yes"), ticked boxes
  // and the chosen options of a list ("Skills (required): Backend Development, …").
  async function formSectionText(member: string, tab: string): Promise<string> {
    const text = await sectionText(member, tab);
    if (!text) return text;
    const region = seen(regionNamed(page.getByRole("main"), new RegExp(`^${tab}$`, "i"))).first();
    const fields = await region.evaluate((root) => {
      const words = (node: Element | null | undefined) => ((node as HTMLElement | null)?.innerText ?? node?.textContent ?? "").replace(/\s+/g, " ").trim();
      const named = (element: Element): string => {
        const labelled = element.getAttribute("aria-labelledby");
        if (labelled) {
          const said = labelled.split(/\s+/).map((id) => words(document.getElementById(id))).filter(Boolean).join(" ");
          if (said) return said;
        }
        const labels = (element as HTMLInputElement).labels;
        if (labels && labels.length) {
          // A label that wraps its list would otherwise read out every option in it.
          const label = labels[0].cloneNode(true) as Element;
          for (const inner of Array.from(label.querySelectorAll("select, textarea, input"))) inner.remove();
          const said = (label.textContent ?? "").replace(/\s+/g, " ").trim();
          if (said) return said;
        }
        const own = (element.getAttribute("aria-label") ?? "").trim();
        if (own) return own;
        // The skills list is a hidden list of options behind a "Skills (required)" button that
        // opens it; its name is the label that button is named by, less the button's own text.
        for (let at = element.parentElement, up = 0; at && at !== root && up < 4; at = at.parentElement, up++) {
          const opener = Array.from(at.querySelectorAll("button")).find((one) => one.getAttribute("aria-haspopup") === "listbox" && one.hasAttribute("aria-labelledby"));
          if (!opener) continue;
          const said = (opener.getAttribute("aria-labelledby") ?? "")
            .split(/\s+/)
            .map((id) => document.getElementById(id))
            .filter((one) => one && !opener.contains(one))
            .map((one) => words(one))
            .filter(Boolean)
            .join(" ");
          if (said) return said;
        }
        return "";
      };
      const out: string[] = [];
      const groupsDone = new Set<Element>();
      for (const element of Array.from(root.querySelectorAll("input, textarea, select"))) {
        if (element instanceof HTMLSelectElement) {
          const chosen = Array.from(element.selectedOptions).map((option) => option.text.trim()).filter(Boolean);
          if (chosen.length) out.push(`${named(element)}: ${chosen.join(", ")}`);
          continue;
        }
        const box = element as HTMLInputElement | HTMLTextAreaElement;
        const type = (box.getAttribute("type") ?? "text").toLowerCase();
        if (type === "hidden" || type === "file" || type === "button" || type === "submit") continue;
        if (type === "radio" || type === "checkbox") {
          let group: Element | null = box.parentElement;
          while (group && group !== root && !/^(radiogroup|group)$/.test(group.getAttribute("role") ?? "") && group.tagName !== "FIELDSET") group = group.parentElement;
          if (group === root) group = null;
          const groupName = group
            ? named(group) || words(group.querySelector("legend"))
            : "";
          if (type === "radio" && group) {
            if (groupsDone.has(group)) continue;
            groupsDone.add(group);
            const picked = Array.from(group.querySelectorAll("input")).filter((one) => one.type === "radio" && one.checked);
            out.push(`${groupName}: ${picked.map((one) => named(one)).join(", ")}`);
          } else if ((box as HTMLInputElement).checked) {
            out.push(groupName ? `${groupName}: ${named(box)}` : `${named(box)}: checked`);
          }
          continue;
        }
        if (!box.value) continue;
        out.push(`${named(box)}: ${box.value}`);
      }
      return out;
    });
    return [text, ...fields].join("\n");
  }
  async function manageAction(member: string, name: RegExp, confirm: RegExp | null): Promise<void> {
    const where = cwuManage.where(member);
    await cwuManage.on(member);
    if (!(await actionsGroup().count())) await toSection(member, "Summary");
    const group = actionsGroup();
    const control = (await group.count()) ? seen(group.getByRole("button", { name })).first() : null;
    if (!control || !(await control.count())) {
      const status = (await textLines()).find((line) => /^status:/i.test(line)) ?? "no status shown";
      const there = (await group.count()) ? (await group.getByRole("button").allInnerTexts()).map((one) => `"${one.trim()}"`).join(", ") : "nothing";
      unbound(where, `no control named ${name} among the opportunity's actions on ${page.url()} (${status}; the actions offered are ${there}); ${CWU_MANAGE_WALKED}`);
    }
    if (await isDisabled(control)) throw new Error(`${where} — the control named ${name} is disabled on ${page.url()}`);
    await control.click();
    await settle();
    if (confirm) await confirmIfAsked(where, confirm);
    await ready();
  }
  // The form on ?tab=opportunity, filled from the input and saved.
  async function saveCwuDetails(member: string, input: unknown): Promise<void> {
    const where = cwuManage.where(member);
    if (!Object.keys(record(input)).length) return;
    await toCwuForm(member);
    await fillCwuForm(where, input);
    await press(where, /^\s*save changes\s*$/i);
    await confirmIfAsked(where, /^\s*(save|publish)( changes)?\s*$/i);
    await ready();
  }
  async function toCwuForm(member: string): Promise<void> {
    if (!(await toSection(member, "Opportunity"))) {
      unbound(cwuManage.where(member), `the management screen at ${page.url()} offers no "Opportunity" section; it offers ${await offered()}`);
    }
  }
  async function cwuFormDate(member: string, label: RegExp): Promise<string> {
    await toCwuForm(member);
    const box = await fieldLabelled(label, false);
    return box ? valueOf(box) : "";
  }
  async function summaryTerm(member: string, term: RegExp): Promise<string> {
    await cwuManage.on(member);
    if (!(await definitionOf(term))) await toSection(member, "Summary");
    return definitionOf(term);
  }
  // Views, watchers and proposals: a published, lapsed or awarded opportunity's Summary
  // section carries a "Reporting" region of terms, "Views", "Watchers" and "Proposals
  // submitted", each over its number ("0" when there are none), to the administrator and to
  // the owning staff member. A draft's summary says instead "Views, watchers and proposals
  // are counted once the opportunity is published.", which is read as nothing.
  const REPORTING_SEEN =
    "seen as the administrator on the seeded published, lapsed-with-three-proposals and awarded Code With Us opportunities, whose Summary carries a \"Reporting\" region listing Views, Watchers and Proposals submitted";
  async function reportingCount(member: string, term: RegExp): Promise<string> {
    if (await refusedReader(member)) return "";
    const shown = await summaryTerm(member, term);
    if (shown) return shown;
    if ((await textLines()).some((line) => /counted once the opportunity is published/i.test(line))) return "";
    return unbound(
      cwuManage.where(member),
      `the Summary on ${page.url()} shows no ${term} count under "Reporting" (it shows ${(await textLines()).filter((line) => !/^(summary|opportunity|addenda|history)$/i.test(line)).slice(0, 14).join(" / ")}); ${REPORTING_SEEN}`,
    );
  }
  const opportunityCwuEdit: S.OpportunityCwuEditPage = {
    open: (params) => cwuManage.open(params as unknown as Record<string, string>),
    // "Edit" opens the form; whatever the input carries is entered and saved there. A draft
    // offers no "Edit": its ?tab=opportunity shows the form already editable, with "Save
    // changes", so it is edited in place.
    editDetails: async (input) => {
      const where = cwuManage.where("edit_details");
      await cwuManage.on("edit_details");
      if (!(await actionsGroup().count())) await toSection("edit_details", "Summary");
      const edit = (await actionsGroup().count()) ? seen(actionsGroup().getByRole("button", { name: /^\s*edit\s*$/i })).first() : null;
      if (edit && (await edit.count())) {
        await manageAction("edit_details", /^\s*edit\s*$/i, null);
      } else {
        await toCwuForm("edit_details");
        if (!(await findControl(page.getByRole("main"), /^\s*save changes\s*$/i))) {
          const status = (await textLines()).find((line) => /^status:/i.test(line)) ?? "no status shown";
          const there = (await actionsGroup().count()) ? (await actionsGroup().getByRole("button").allInnerTexts()).map((one) => `"${one.trim()}"`).join(", ") : "nothing";
          unbound(where, `no "Edit" among the opportunity's actions on ${page.url()} (${status}; the actions offered are ${there}), and its Opportunity section offers no "Save changes" to edit the form in place; ${CWU_MANAGE_WALKED}`);
        }
      }
      if (Object.keys(record(input)).length) {
        await fillCwuForm(where, input);
        await press(where, /^\s*save changes\s*$/i);
        await confirmIfAsked(where, /^\s*(save|publish)( changes)?\s*$/i);
        await ready();
      }
    },
    // Pressed from the Opportunity section, the form being submitted. The answer to an
    // incomplete draft ("This opportunity is incomplete …") is drawn inside whichever section
    // is open and is held only in the page, so it is left as it is for the readers; pressed
    // from the Summary section (where open() and a fresh save land) the alert went with that
    // section and opportunity_tab, which has to switch sections, could never see it.
    submitForReview: async (input) => {
      await saveCwuDetails("submit_for_review", input);
      await toSection("submit_for_review", "Opportunity");
      await manageAction("submit_for_review", /^\s*submit for review\s*$/i, /^\s*submit( for review| opportunity)?\s*$/i);
    },
    // "Publish" is offered to the administrator, on a draft or one under review. Anybody else
    // is offered no "Publish" (a public sector employee's own draft offers "Submit for
    // review" and "Delete") or not the screen at all, and that absence is the refusal. It is
    // logged and the action returns, so the test's own follow-up reading decides.
    publish: async (input) => {
      if (!actingMay(/^publish opportunity$/i)) {
        const where = cwuManage.where("publish");
        await ready();
        const why = await whyNotHere();
        if (why) {
          noteRefusal(`${where} — the management screen answered ${actingId()} with ${why.replace(/\n+/g, " ")} at ${page.url()}`);
          return;
        }
        if (!(await actionsGroup().count())) await toSection("publish", "Summary");
        const control = (await actionsGroup().count()) ? seen(actionsGroup().getByRole("button", { name: /^\s*publish\s*$/i })).first() : null;
        if (!control || !(await control.count())) {
          const status = (await textLines()).find((line) => /^status:/i.test(line)) ?? "no status shown";
          const there = (await actionsGroup().count()) ? (await actionsGroup().getByRole("button").allInnerTexts()).map((one) => `"${one.trim()}"`).join(", ") : "nothing";
          noteRefusal(`${where} — no "Publish" among the opportunity's actions for ${actingId()} on ${page.url()} (${status}; the actions offered are ${there})`);
          return;
        }
      }
      await saveCwuDetails("publish", input);
      await manageAction("publish", /^\s*publish\s*$/i, /^\s*publish( opportunity)?\s*$/i);
    },
    // "Cancel opportunity" is offered to the administrator on a published opportunity (seen on
    // the seeded published and lapsed-with-three-proposals ones), and asks first: a dialog
    // "Cancel this opportunity?" with an optional "Note (optional)" box, "Keep opportunity"
    // and its own "Cancel opportunity". A draft offers "Edit", "Publish" and "Delete" instead,
    // an awarded one nothing, and a public sector employee is not offered it; that absence is
    // the refusal, logged so the test's own follow-up reading decides.
    cancelOpportunity: async (input) => {
      const member = "cancel_opportunity";
      const where = cwuManage.where(member);
      if (await refusedReader(member)) return;
      await cwuManage.on(member);
      if (!(await actionsGroup().count())) await toSection(member, "Summary");
      const group = actionsGroup();
      await seen(group.getByRole("button")).first().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
      const control = seen(group.getByRole("button", { name: /^\s*cancel opportunity\s*$/i })).first();
      if (!(await control.count())) {
        const status = (await textLines()).find((line) => /^status:/i.test(line)) ?? "no status shown";
        const there = (await group.count()) ? (await group.getByRole("button").allInnerTexts()).map((one) => `"${one.trim()}"`).join(", ") : "nothing";
        noteRefusal(`${where} — no "Cancel opportunity" among the opportunity's actions for ${actingId()} on ${page.url()} (${status}; the actions offered are ${there || "nothing"})`);
        return;
      }
      if (await isDisabled(control)) throw new Error(`${where} — "Cancel opportunity" is disabled on ${page.url()}`);
      await control.click();
      await settle();
      await dialog().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
      if (!(await dialog().count())) throw new Error(`${where} — "Cancel opportunity" on ${page.url()} asked nothing to confirm`);
      const note = givenText(input, ["note", "reason", "text", "comment"]) || (typeof input === "string" ? input : "");
      if (note) {
        const box = seen(dialog().getByRole("textbox", { name: /note/i })).first();
        if (!(await box.count())) unbound(where, `the "Cancel this opportunity?" dialog on ${page.url()} offers no "Note" box for the note given`);
        await box.fill(note);
      }
      await press(where, /^\s*cancel opportunity\s*$/i, dialog());
      await ready();
    },
    deleteOpportunity: () => manageAction("delete_opportunity", /^\s*delete( opportunity)?\s*$/i, /^\s*delete( opportunity)?\s*$/i),
    // The Addenda section (?tab=addenda) of a published, lapsed or awarded opportunity lists
    // the addenda ("No addenda have been added." when none) over a "New addendum (required)"
    // box and an "Add addendum" button that sends it. A draft has no Addenda section at all
    // (its sections are Summary, Opportunity and History), and the management screen answers
    // anybody who may not manage the opportunity "Page not found"; either absence is the
    // refusal, logged so the test's own follow-up reading decides.
    addAddendum: async (input) => {
      const member = "add_addendum";
      const where = cwuManage.where(member);
      if (await refusedReader(member)) return;
      await cwuManage.on(member);
      if (!(await toSection(member, "Addenda"))) {
        const status = (await textLines()).find((line) => /^status:/i.test(line)) ?? "no status shown";
        const sections = (await seen(page.getByRole("navigation", { name: /opportunity sections/i }).getByRole("link")).allInnerTexts()).map((one) => `"${one.trim()}"`).join(", ");
        noteRefusal(`${where} — the management screen at ${page.url()} offers ${actingId()} no "Addenda" section (${status}; its sections are ${sections || "none"})`);
        return;
      }
      const region = seen(regionNamed(page.getByRole("main"), /^addenda$/i)).first();
      const box = seen(region.getByRole("textbox", { name: /addendum/i })).first();
      const words = givenText(input, ["addendum", "text", "description", "body", "content"]) || textOf(input);
      if (!(await box.count())) {
        unbound(where, `the Addenda section on ${page.url()} offers ${actingId()} no "New addendum" box, only "${lined(await region.innerText()).join(" / ")}"; seen as the administrator on the seeded published and lapsed-with-three-proposals Code With Us opportunities, where it does`);
      }
      if (words) await box.fill(words);
      await press(where, /^\s*add addendum\s*$/i, region);
      await confirmIfAsked(where, /^\s*(add|publish|save|submit)( addendum)?\s*$/i);
      await ready();
    },
    opportunityIdentifier: async () => {
      await cwuManage.on("opportunity_identifier");
      return shownIdentifier();
    },
    createdByName: () => summaryTerm("created_by_name", /^created by$/i),
    lastChangedByName: () => summaryTerm("last_changed_by_name", /^last changed by$/i),
    summaryTab: () => sectionText("summary_tab", "Summary"),
    opportunityTab: () => formSectionText("opportunity_tab", "Opportunity"),
    addendaTab: () => sectionText("addenda_tab", "Addenda"),
    historyTab: () => sectionText("history_tab", "History"),
    // Before the opportunity closes the section withholds every proposal: it draws only
    // "Proposals are not shown until the opportunity closes … can be read once it has closed
    // to proposals, at …" and no table (seen as public sector staff and the administrator on
    // the seeded published opportunity). That withholding reads as nothing, as the old
    // binding reads its own "will be displayed here once this opportunity has closed".
    proposalsTab: async () => {
      if (await toSection("proposals_tab", "Proposals")) {
        const region = seen(regionNamed(page.getByRole("main"), /^proposals$/i)).first();
        const said = (await region.count()) ? lined(await region.innerText()).join("\n") : "";
        const listed = (await region.count()) ? await seen(region.getByRole("row")).count() : 0;
        if (!listed && /not shown until the opportunity closes|once it has closed to proposals/i.test(said)) return "";
        return sectionText("proposals_tab", "Proposals");
      }
      return unbound(
        cwuManage.where("proposals_tab"),
        `the management screen at ${page.url()} offers only the sections ${(await seen(page.getByRole("navigation", { name: /opportunity sections/i }).getByRole("link")).allInnerTexts()).map((one) => `"${one.trim()}"`).join(", ")}, and ?tab=proposals shows the summary; ${CWU_MANAGE_WALKED}`,
      );
    },
    reportingViews: () => reportingCount("reporting_views", /^views$/i),
    reportingWatchers: () => reportingCount("reporting_watchers", /^watchers$/i),
    reportingProposals: () => reportingCount("reporting_proposals", /^proposals( submitted)?$/i),
    proposalDeadline: () => cwuFormDate("proposal_deadline", /proposal\s*deadline/i),
    assignmentDate: () => cwuFormDate("assignment_date", /assignment\s*date/i),
    startDate: () => cwuFormDate("start_date", /^\s*start\s*date/i),
    completionDate: () => cwuFormDate("completion_date", /completion\s*date/i),
    // A reader the screen refuses is offered nothing, the refusal logged.
    noteControlOffered: async () => {
      const member = "note_control_offered";
      if (await refusedReader(member)) return "false";
      if (!(await toSection(member, "History"))) {
        return unbound(cwuManage.where(member), `the management screen at ${page.url()} offers ${actingId()} no "History" section; it offers ${await offered()}`);
      }
      return noteControlsIn(cwuManage.where(member), seen(regionNamed(page.getByRole("main"), /^history$/i)).first());
    },
  };

  // ---------------------------------------------------------------- managing a Sprint With Us or Team With Us opportunity
  //
  // /opportunities/{sprint,team}-with-us/:opportunityId/edit draws the same frame as the Code
  // With Us screen — "Manage a … opportunity" over the title, "Status: <state>", "Opportunity
  // ID: <id>", an "Opportunity actions" group and the sections as links under "Opportunity
  // sections" — but offers much less. Its sections are Summary, Addenda (not on a draft) and
  // History; ?tab=opportunity and any other section name fall back to the Summary. The
  // Summary is terms: Program, Proposal deadline ("September 2, 2026 at 4:00 p.m. Pacific
  // time"), Assignment date, the budget, Created by and Last changed by, a "Reporting" region
  // once published, and the line "The rest of this opportunity — what makes it a … opportunity,
  // and putting it forward for review or publication — cannot be managed here yet." The only
  // action is "Cancel opportunity", offered to the administrator in every state from published
  // to processing (its dialog is the Code With Us one); a draft and an awarded one offer none,
  // and a public sector employee is offered none on their own. The Addenda and History
  // sections are the Code With Us ones, each History the table of what happened
  // alone, with no form for adding a note (seen as the administrator and the owning staff). A panel evaluator,
  // and staff on somebody else's, are answered "Page not found".
  //
  // The running build has since grown: its sections are now Summary, Opportunity (the
  // program's form, read-only once published; editable on a draft, with "Save changes",
  // after "Edit"), Addenda (not on a draft), History and Evaluation panel, and a draft
  // offers its owning public sector employee "Edit", "Submit for review" (refused on an
  // incomplete draft with the alert "This opportunity is incomplete") and "Delete" (which
  // asks "Delete this opportunity?" with "Delete opportunity" and lands on /dashboard).
  // ?tab=evaluation, ?tab=consensus and ?tab=instructions still fall back to the Summary.
  // On the current build (walked 2026-10-03 as the administrator and as the public sector
  // employee who sits on the seeded panels) there is also a "Proposals" section: the table
  // "Every proposal submitted to this opportunity" (Proponent | Status | Submitted, names in
  // plain text, no link onward), or, before the opportunity closes, only "Proposals are not
  // shown until the opportunity closes". That withholding reads as nothing, as on the Code
  // With Us screen.
  const proposalsShown = (said: string): string =>
    /not shown until the opportunity closes|once it has closed to proposals/i.test(said) && !/\|/.test(said) && !/every proposal submitted/i.test(said) ? "" : said;
  const programWalked = (program: string, states: string, slug: string): string =>
    `walked as the administrator on the seeded ${program} opportunities ${states} and on a draft just saved from /opportunities/${slug}/create, as the owning public sector employee on seeded ones and on such a draft, and as a vendor (answered "Page not found"): the screen offers the sections Summary, Opportunity, Addenda (not on a draft), History, Proposals (added on the current build) and Evaluation panel, the actions "Edit", "Submit for review" and "Delete" on a draft and "Cancel opportunity" (to the administrator, from published to processing); ?tab=evaluation, ?tab=consensus, ?tab=instructions and other section names fall back to the Summary`;
  const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  function programManage(
    pageId: string,
    route: string,
    walked: string,
    fill: (member: string, input: unknown) => Promise<void> = async () => undefined,
  ) {
    const screen = signedInScreen(pageId, route);
    const where = screen.where;
    const sectionLinks = (): Locator => seen(page.getByRole("navigation", { name: /opportunity sections/i }).getByRole("link"));
    const quoted = (names: string[]): string => names.map((one) => `"${one.trim()}"`).join(", ");
    async function context(): Promise<string> {
      await ready();
      const why = await whyNotHere();
      if (why) return `${route} answered ${actingId()} with ${why.replace(/\n+/g, " ")} at ${page.url()}`;
      const status = (await textLines()).find((line) => /^status:/i.test(line)) ?? "no status shown";
      const group = actionsGroup();
      const actions = (await group.count()) ? quoted(await group.getByRole("button").allInnerTexts()) : "";
      return `on ${page.url()} as ${actingId()} (${status}) the actions offered are ${actions || "none"} and the sections ${quoted(await sectionLinks().allInnerTexts()) || "none"}`;
    }
    // What the screen, walked on this build, does not offer: a reason naming it, with what
    // the screen in front of the reader offers instead.
    async function notOffered(member: string, what: string): Promise<never> {
      return unbound(where(member), `the screen offers no ${what}; ${walked}; ${await context()}`);
    }
    // As on the Code With Us screen: a reader other than the administrator who is shown the
    // screen's refusal is shown none of it, so their reading is nothing and the refusal logged.
    async function refused(member: string): Promise<boolean> {
      await ready();
      const why = await refusalShown();
      if (!why || !actingAs || actingMay(/any opportunity$/i)) return false;
      noteRefusal(`${where(member)} — the management screen answered ${actingId()} with ${why.replace(/\n+/g, " ")} at ${page.url()}`);
      return true;
    }
    async function toSection(member: string, tab: string): Promise<boolean> {
      await screen.on(member);
      const link = sectionLinks().filter({ hasText: new RegExp(`^\\s*${tab}\\s*$`, "i") });
      if (!(await link.count())) return false;
      const href = (await link.first().getAttribute("href")) ?? "";
      if (!new URL(page.url()).search.includes(`tab=${tab.toLowerCase()}`)) {
        if (href) await visit(href);
        else await link.first().click();
        await ready();
      }
      return true;
    }
    function sectionRegion(tab: string): Locator {
      return seen(regionNamed(page.getByRole("main"), new RegExp(`^${tab}$`, "i"))).first();
    }
    const saveChanges = (): Locator => seen(page.getByRole("main").getByRole("button", { name: /^\s*save changes\s*$/i })).first();
    // The Opportunity section's form, made editable: "Edit" among the actions where it is
    // offered, else the section itself. False (and the refusal logged) when the form stays
    // read-only, as it does once the opportunity is published.
    async function openDetails(member: string): Promise<boolean> {
      if (await saveChanges().count()) return true;
      if (!(await actionsGroup().count())) await toSection(member, "Summary");
      const edit = seen(actionsGroup().getByRole("button", { name: /^\s*edit\s*$/i })).first();
      if (await edit.count()) {
        if (await isDisabled(edit)) throw new Error(`${where(member)} — the control named "Edit" is disabled on ${page.url()}`);
        await edit.click();
        await settle();
        await ready();
      } else if (!(await toSection(member, "Opportunity"))) {
        return notOffered(member, '"Opportunity" section');
      }
      await saveChanges().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
      if (await saveChanges().count()) return true;
      noteRefusal(`${where(member)} — the Opportunity section on ${page.url()} is read-only, with no "Edit" among the actions and no "Save changes"; ${await context()}`);
      return false;
    }
    // Every value the input carries, entered in the form and saved; the save answers "Your
    // changes have been saved." in a status, or an alert naming what it refused.
    async function saveDetails(member: string, input: unknown): Promise<void> {
      if (!(await openDetails(member))) return;
      await fill(member, input);
      const save = saveChanges();
      if (await isDisabled(save)) throw new Error(`${where(member)} — "Save changes" is disabled on ${page.url()}`);
      await save.click();
      await settle();
      await confirmIfAsked(where(member), /^\s*(save|publish)( changes)?\s*$/i);
      const deadline = Date.now() + 10000;
      while (Date.now() < deadline) {
        if (await seen(page.getByRole("status").filter({ hasText: /saved/i })).count()) break;
        if (await seen(page.getByRole("alert")).count()) break;
        await page.waitForTimeout(250);
      }
      await ready();
    }
    // A section the screen has in this state reads as its text, one it does not as nothing.
    async function sectionText(member: string, tab: string): Promise<string> {
      if (await refused(member)) return "";
      if (!(await toSection(member, tab))) return "";
      const region = sectionRegion(tab);
      return (await region.count()) ? lined(await region.innerText()).join("\n") : "";
    }
    // The Opportunity section as saved. On this build it is always the program's form (a
    // published opportunity's too, with "Save changes" under it), so its text alone is only
    // the labels ("Opportunity / Overview / Title(required) / …"). The screen is opened afresh
    // so the boxes hold what was saved rather than anything typed and left, and each box's
    // value is read in its place, under its label; a ticked choice is marked "[x]". `part`
    // narrows it to one of the form's own sections ("Team questions", "Resource questions",
    // "Description"), read as nothing where the form has no such section.
    async function savedForm(member: string, part?: RegExp): Promise<string> {
      if (await refused(member)) return "";
      if (!(await toSection(member, "Opportunity"))) return notOffered(member, '"Opportunity" section');
      await page.reload({ waitUntil: "domcontentloaded" });
      await ready();
      if (await refused(member)) return "";
      let region = sectionRegion("Opportunity");
      await region.waitFor({ state: "visible", timeout: 10000 }).catch(() => undefined);
      if (!(await region.count())) return notOffered(member, '"Opportunity" section');
      if (part) {
        region = seen(regionNamed(region, part)).first();
        if (!(await region.count())) return "";
      }
      const text = await region.evaluate((root) => {
        const out: string[] = [];
        const block = /^(DIV|P|SECTION|FIELDSET|LEGEND|H[1-6]|LI|UL|OL|LABEL|DL|DT|DD|FORM|TABLE|TR)$/;
        const walk = (node: Node): void => {
          if (node.nodeType === Node.TEXT_NODE) {
            out.push(node.textContent ?? "");
            return;
          }
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          const el = node as HTMLElement;
          const tag = el.tagName;
          if (tag === "SCRIPT" || tag === "STYLE" || tag === "BUTTON" || tag === "TEMPLATE") return;
          if (el.hidden || getComputedStyle(el).display === "none") return;
          if (tag === "INPUT" && /^(radio|checkbox)$/.test((el as HTMLInputElement).type)) {
            out.push((el as HTMLInputElement).checked ? "[x] " : "");
            return;
          }
          if (tag === "INPUT" && /^(button|submit|reset|hidden|file|image)$/.test((el as HTMLInputElement).type)) return;
          if (tag === "INPUT" || tag === "TEXTAREA") {
            out.push(`\n${(el as HTMLInputElement).value}\n`);
            return;
          }
          if (tag === "SELECT") {
            if (el.offsetParent) out.push(`\n${Array.from((el as HTMLSelectElement).selectedOptions).map((one) => one.text).join("\n")}\n`);
            return;
          }
          const isBlock = block.test(tag);
          if (isBlock) out.push("\n");
          for (const child of Array.from(el.childNodes)) walk(child);
          if (isBlock) out.push("\n");
        };
        walk(root);
        return out.join("");
      });
      return lined(text).join("\n");
    }
    // A section the screen has in no state: read where it appears, unbound where it does not.
    async function absentSection(member: string, tab: string, what: string): Promise<string> {
      if (await refused(member)) return "";
      if (await toSection(member, tab)) return sectionText(member, tab);
      return notOffered(member, what);
    }
    async function summaryTerm(member: string, term: RegExp): Promise<string> {
      if (await refused(member)) return "";
      await screen.on(member);
      if (!(await definitionOf(term))) await toSection(member, "Summary");
      return definitionOf(term);
    }
    // The Summary's dates, as the calendar day they fall on ("September 2, 2026 at 4:00 p.m.
    // Pacific time" is 2026-09-02); "Not entered" is none.
    async function summaryDate(member: string, term: RegExp): Promise<string> {
      const shown = await summaryTerm(member, term);
      const found = /([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/.exec(shown);
      const month = found ? MONTHS.indexOf(found[1].toLowerCase()) : -1;
      if (!found || month < 0) return "";
      return `${found[3]}-${String(month + 1).padStart(2, "0")}-${found[2].padStart(2, "0")}`;
    }
    const actionsShown = async (member: string): Promise<Locator> => {
      if (!(await actionsGroup().count())) await toSection(member, "Summary");
      const group = actionsGroup();
      await seen(group.getByRole("button")).first().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
      return group;
    };
    return {
      open: (params: { opportunityId: string }) => screen.open(params as unknown as Record<string, string>),
      notOffered,
      sectionText,
      absentSection,
      savedForm,
      summaryTerm,
      summaryDate,
      // The Opportunity section, where the program's form is shown (read-only once
      // published). False for a reader shown the screen's refusal, which is logged.
      toForm: async (member: string): Promise<boolean> => {
        if (await refused(member)) return false;
        if (!(await toSection(member, "Opportunity"))) return notOffered(member, '"Opportunity" section');
        return true;
      },
      // A date box on that form, as the calendar day it holds ("2026-09-22"); empty when the
      // form leaves it blank.
      formDate: async (member: string, label: RegExp): Promise<string> => {
        if (await refused(member)) return "";
        if (!(await toSection(member, "Opportunity"))) return notOffered(member, '"Opportunity" section');
        const box = seen(page.getByRole("main").getByRole("textbox", { name: label })).first();
        await box.waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
        return (await box.count()) ? (await box.inputValue()).trim() : "";
      },
      // One of the opportunity's own actions ("Submit for review", "Publish", "Delete"),
      // confirmed where it asks. Offered only in some states and to some people (a draft's
      // "Delete" and "Submit for review" to its owner), so where it is not offered that
      // absence is the refusal, logged so the test's own follow-up reading decides. A refusal
      // drawn as an alert ("This opportunity is incomplete") is left on the page for the
      // readers.
      act: async (member: string, name: RegExp, confirm: RegExp | null, input?: unknown): Promise<void> => {
        if (await refused(member)) return;
        await screen.on(member);
        if (Object.keys(record(input)).length) await saveDetails(member, input);
        if (!(await actionsGroup().count())) await toSection(member, "Summary");
        const control = seen(actionsGroup().getByRole("button", { name })).first();
        if (!(await control.count())) {
          noteRefusal(`${where(member)} — no control named ${name} among the actions offered; ${await context()}`);
          return;
        }
        if (await isDisabled(control)) throw new Error(`${where(member)} — the control named ${name} is disabled on ${page.url()}`);
        await control.click();
        await settle();
        if (confirm) await confirmIfAsked(where(member), confirm);
        await ready();
      },
      // "Edit" (on a draft) opens the Opportunity section's form; whatever the input carries is
      // entered there and saved with "Save changes". A published opportunity shows that form
      // read-only and offers no "Edit": that is the refusal, logged.
      editDetails: async (input?: unknown): Promise<void> => {
        const member = "edit_details";
        if (await refused(member)) return;
        await screen.on(member);
        if (!(await openDetails(member))) return;
        if (Object.keys(record(input)).length) await saveDetails(member, input);
      },
      // The "Evaluation panel" link under "Opportunity sections", which opens the panel's
      // editor (?tab=evaluationPanel; evaluation-panel-swu / -twu drive what is on it). A
      // reader shown the screen's refusal is refused it too, logged; a screen without the link
      // is unbound.
      editEvaluationPanel: async (): Promise<void> => {
        const member = "edit_evaluation_panel";
        if (await refused(member)) return;
        if (!(await toSection(member, "Evaluation panel"))) return notOffered(member, '"Evaluation panel" section');
        await seen(regionNamed(page.getByRole("main"), /^evaluation panel$/i)).first().waitFor({ state: "visible", timeout: 10000 }).catch(() => undefined);
      },
      noteControlOffered: async (): Promise<string> => {
        const member = "note_control_offered";
        if (await refused(member)) return "false";
        if (!(await toSection(member, "History"))) return notOffered(member, '"History" section');
        return noteControlsIn(where(member), sectionRegion("History"));
      },
      // "Cancel opportunity" asks first: "Cancel this opportunity?" with an optional "Note
      // (optional)" box, "Keep opportunity" and its own "Cancel opportunity". Where it is not
      // offered (a draft, an awarded one, a public sector employee) that absence is the
      // refusal, logged so the test's own follow-up reading decides.
      cancelOpportunity: async (input?: unknown): Promise<void> => {
        const member = "cancel_opportunity";
        if (await refused(member)) return;
        await screen.on(member);
        const group = await actionsShown(member);
        const control = seen(group.getByRole("button", { name: /^\s*cancel opportunity\s*$/i })).first();
        if (!(await control.count())) {
          noteRefusal(`${where(member)} — no "Cancel opportunity" ${await context()}`);
          return;
        }
        if (await isDisabled(control)) throw new Error(`${where(member)} — "Cancel opportunity" is disabled on ${page.url()}`);
        await control.click();
        await settle();
        await dialog().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
        if (!(await dialog().count())) throw new Error(`${where(member)} — "Cancel opportunity" on ${page.url()} asked nothing to confirm`);
        const note = givenText(input, ["note", "reason", "text", "comment"]) || (typeof input === "string" ? input : "");
        if (note) {
          const box = seen(dialog().getByRole("textbox", { name: /note/i })).first();
          if (!(await box.count())) unbound(where(member), `the "Cancel this opportunity?" dialog on ${page.url()} offers no "Note" box for the note given`);
          await box.fill(note);
        }
        await press(where(member), /^\s*cancel opportunity\s*$/i, dialog());
        await ready();
      },
      // The Addenda section: the addenda ("No addenda have been added.") over a "New addendum
      // (required)" box and "Add addendum". A draft has no Addenda section; that absence is the
      // refusal, logged.
      addAddendum: async (input?: unknown): Promise<void> => {
        const member = "add_addendum";
        if (await refused(member)) return;
        if (!(await toSection(member, "Addenda"))) {
          noteRefusal(`${where(member)} — no "Addenda" section ${await context()}`);
          return;
        }
        const region = sectionRegion("Addenda");
        const box = seen(region.getByRole("textbox", { name: /addendum/i })).first();
        if (!(await box.count())) {
          unbound(where(member), `the Addenda section on ${page.url()} offers ${actingId()} no "New addendum" box, only "${lined(await region.innerText()).join(" / ")}"; seen as the administrator on the seeded published and closed opportunities, where it does`);
        }
        const words = givenText(input, ["addendum", "text", "description", "body", "content"]) || textOf(input);
        if (words) await box.fill(words);
        await press(where(member), /^\s*add addendum\s*$/i, region);
        await confirmIfAsked(where(member), /^\s*(add|publish|save|submit)( addendum)?\s*$/i);
        await ready();
      },
      opportunityIdentifier: async (): Promise<string> => {
        if (await refused("opportunity_identifier")) return "";
        await screen.on("opportunity_identifier");
        return shownIdentifier();
      },
      // The changes of state offered from the state the opportunity is in, in the criteria's
      // words ("Cancel opportunity" is "cancel"); none on a draft, an awarded one or to staff.
      offeredStateChanges: async (): Promise<string> => {
        const member = "offered_state_changes";
        if (await refused(member)) return "";
        await screen.on(member);
        const group = await actionsShown(member);
        if (!(await group.count())) return "";
        return (await seen(group.getByRole("button")).allInnerTexts())
          .map((one) => one.trim().toLowerCase().replace(/\s+opportunity$/, ""))
          .filter(Boolean)
          .join("\n");
      },
    };
  }

  const SWU_EDIT = "opportunity-swu-edit";
  const SWU_MANAGE_ROUTE = "/opportunities/sprint-with-us/:opportunityId/edit";
  // The management screen's Opportunity section holds the program's own form (the create
  // form without its Evaluation panel), so it is filled the way the create form is.
  const swuEditForm = programForm(SWU_EDIT, SWU_MANAGE_ROUTE, "sprint");
  const swuManage = programManage(
    SWU_EDIT,
    SWU_MANAGE_ROUTE,
    programWalked(
      "Sprint With Us",
      "published (open and lapsed, 00000000-0000-4000-8000-000000000701 among them), at individual evaluation, at consensus, at the code challenge, at the team scenario, in processing and awarded",
      "sprint-with-us",
    ),
    (member, input) => swuEditForm.fillForm(member, input),
  );
  const PROGRAM_CONFIRM = /^\s*(publish|submit|delete)( opportunity| for review)?\s*$/i;
  const opportunitySwuEdit: S.OpportunitySwuEditPage = {
    open: swuManage.open,
    editDetails: swuManage.editDetails,
    submitForReview: (input) => swuManage.act("submit_for_review", /^\s*submit for review\s*$/i, PROGRAM_CONFIRM, input),
    publish: (input) => swuManage.act("publish", /^\s*publish\s*$/i, PROGRAM_CONFIRM, input),
    cancelOpportunity: swuManage.cancelOpportunity,
    deleteOpportunity: () => swuManage.act("delete_opportunity", /^\s*delete\s*$/i, /^\s*delete opportunity\s*$/i),
    addAddendum: swuManage.addAddendum,
    editEvaluationPanel: swuManage.editEvaluationPanel,
    finalizeQuestionConsensuses: () => swuManage.notOffered("finalize_question_consensuses", '"Consensus" section and no control to finalize the question consensuses, not even at consensus'),
    startTeamScenario: () => swuManage.notOffered("start_team_scenario", "section or control to start the team scenario, not even at the code challenge"),
    opportunityIdentifier: swuManage.opportunityIdentifier,
    createdByName: () => swuManage.summaryTerm("created_by_name", /^created by$/i),
    lastChangedByName: () => swuManage.summaryTerm("last_changed_by_name", /^last changed by$/i),
    summaryTab: () => swuManage.sectionText("summary_tab", "Summary"),
    // The Opportunity section's form as saved, each box's value under its label.
    opportunityTab: () => swuManage.savedForm("opportunity_tab"),
    addendaTab: () => swuManage.sectionText("addenda_tab", "Addenda"),
    historyTab: () => swuManage.sectionText("history_tab", "History"),
    proposalsTab: async () => proposalsShown(await swuManage.absentSection("proposals_tab", "Proposals", '"Proposals" section')),
    // No section of its own: the saved team questions are the "Team questions" of the
    // Opportunity section's form.
    teamQuestionsTab: () => swuManage.savedForm("team_questions_tab", /^team questions$/i),
    codeChallengeTab: () => swuManage.absentSection("code_challenge_tab", "Code challenge", '"Code challenge" section'),
    teamScenarioTab: () => swuManage.absentSection("team_scenario_tab", "Team scenario", '"Team scenario" section'),
    evaluationPanelTab: () => swuManage.absentSection("evaluation_panel_tab", "Evaluation panel", '"Evaluation panel" section'),
    consensusTab: () => swuManage.absentSection("consensus_tab", "Consensus", '"Consensus" section'),
    instructionsTab: () => swuManage.absentSection("instructions_tab", "Instructions", '"Instructions" section (walked as the panel\'s public sector employee too, ?tab=instructions drawing the Summary)'),
    evaluationTab: () => swuManage.absentSection("evaluation_tab", "Evaluation", '"Evaluation" section (walked as the panel\'s public sector employee too, ?tab=evaluation drawing the Summary)'),
    proposalDeadline: () => swuManage.summaryDate("proposal_deadline", /^proposal deadline$/i),
    assignmentDate: () => swuManage.summaryDate("assignment_date", /^assignment date$/i),
    // The "Team questions" of the Opportunity section's form.
    evaluationQuestionFields: async (place?: unknown) =>
      (await swuManage.toForm("evaluation_question_fields")) ? swuEditForm.evaluationQuestionFields(place) : "",
    noteControlOffered: swuManage.noteControlOffered,
  };

  const TWU_EDIT = "opportunity-twu-edit";
  const TWU_MANAGE_ROUTE = "/opportunities/team-with-us/:opportunityId/edit";
  const twuEditForm = programForm(TWU_EDIT, TWU_MANAGE_ROUTE, "team");
  const twuManage = programManage(
    TWU_EDIT,
    TWU_MANAGE_ROUTE,
    programWalked(
      "Team With Us",
      "published and lapsed (00000000-0000-4000-8000-000000000801), at individual evaluation, at consensus and at the challenge",
      "team-with-us",
    ),
    (member, input) => twuEditForm.fillForm(member, input),
  );
  const opportunityTwuEdit: S.OpportunityTwuEditPage = {
    open: twuManage.open,
    editDetails: twuManage.editDetails,
    submitForReview: (input) => twuManage.act("submit_for_review", /^\s*submit for review\s*$/i, PROGRAM_CONFIRM, input),
    publish: (input) => twuManage.act("publish", /^\s*publish\s*$/i, PROGRAM_CONFIRM, input),
    cancelOpportunity: twuManage.cancelOpportunity,
    deleteOpportunity: () => twuManage.act("delete_opportunity", /^\s*delete\s*$/i, /^\s*delete opportunity\s*$/i),
    addAddendum: twuManage.addAddendum,
    editEvaluationPanel: twuManage.editEvaluationPanel,
    finalizeQuestionConsensuses: () => twuManage.notOffered("finalize_question_consensuses", '"Consensus" section and no control to finalize the question consensuses, not even at consensus'),
    opportunityIdentifier: twuManage.opportunityIdentifier,
    createdByName: () => twuManage.summaryTerm("created_by_name", /^created by$/i),
    lastChangedByName: () => twuManage.summaryTerm("last_changed_by_name", /^last changed by$/i),
    summaryTab: () => twuManage.sectionText("summary_tab", "Summary"),
    // The Opportunity section's form as saved, each box's value under its label.
    opportunityTab: () => twuManage.savedForm("opportunity_tab"),
    addendaTab: () => twuManage.sectionText("addenda_tab", "Addenda"),
    historyTab: () => twuManage.sectionText("history_tab", "History"),
    proposalsTab: async () => proposalsShown(await twuManage.absentSection("proposals_tab", "Proposals", '"Proposals" section')),
    // No section of its own: the saved resource questions are the "Resource questions" of
    // the Opportunity section's form.
    resourceQuestionsTab: () => twuManage.savedForm("resource_questions_tab", /^resource questions$/i),
    challengeTab: () => twuManage.absentSection("challenge_tab", "Challenge", '"Challenge" section'),
    evaluationPanelTab: () => twuManage.absentSection("evaluation_panel_tab", "Evaluation panel", '"Evaluation panel" section'),
    consensusTab: () => twuManage.absentSection("consensus_tab", "Consensus", '"Consensus" section'),
    instructionsTab: () => twuManage.absentSection("instructions_tab", "Instructions", '"Instructions" section (walked as the panel\'s public sector employee too, ?tab=instructions drawing the Summary)'),
    evaluationTab: () => twuManage.absentSection("evaluation_tab", "Evaluation", '"Evaluation" section (walked as the panel\'s public sector employee too, ?tab=evaluation drawing the Summary)'),
    offeredStateChanges: twuManage.offeredStateChanges,
    proposalDeadline: () => twuManage.summaryDate("proposal_deadline", /^proposal deadline$/i),
    assignmentDate: () => twuManage.summaryDate("assignment_date", /^assignment date$/i),
    // The Summary carries no start or completion date; the Opportunity section's form does,
    // as date boxes ("Start date", "Completion date (optional)").
    startDate: () => twuManage.formDate("start_date", /^\s*start date\b/i),
    completionDate: () => twuManage.formDate("completion_date", /^\s*completion date\b/i),
    // The "Resource questions" of the Opportunity section's form.
    evaluationQuestionFields: async (place?: unknown) =>
      (await twuManage.toForm("evaluation_question_fields")) ? twuEditForm.evaluationQuestionFields(place) : "",
  };

  // ---------------------------------------------------------------- new-opportunity emails on the list
  //
  // /opportunities, to anybody signed in (seen as a vendor, a public sector employee and the
  // administrator): under the filters and the "Showing N opportunities" line, a region headed
  // "New opportunity emails" with one sentence and one button. Subscribed: "You are emailed
  // at <address> when new opportunities are posted." and "Stop emailing me about new
  // opportunities"; not: "You are not emailed when new opportunities are posted." and "Email
  // me about new opportunities". Pressing it saves at once and its status says so ("Saved.
  // You will no longer be emailed when new opportunities are posted."). A signed-out visitor
  // is shown the list with no such region, and that absence is the answer, read as nothing.
  // It stays shown at a phone's width (375 pixels).
  const OPTIN = "notification-optin-opportunity-list";
  const OPTIN_ON = /^\s*stop emailing me about new opportunities\s*$/i;
  const OPTIN_OFF = /^\s*email me about new opportunities\s*$/i;
  async function onOptinList(member: string): Promise<Locator | null> {
    if (new URL(page.url()).pathname !== "/opportunities" || originOf(page.url()) !== originOf(baseURL)) {
      await go("/opportunities");
    }
    await ready();
    const refused = await refusalShown();
    if (refused) unbound(`${OPTIN}.${member}`, `/opportunities did not open at ${page.url()}: ${refused}`);
    // The list has loaded once it says how many it shows; the region follows the session.
    await seen(page.getByRole("main").getByText(/^showing \d+ opportunit/i))
      .first()
      .waitFor({ state: "visible", timeout: 10000 })
      .catch(() => undefined);
    const heading = page.getByRole("main").getByRole("heading", { name: /^\s*new opportunity emails\s*$/i });
    // A signed-in person's region comes with their account; a visitor's never comes.
    const signedIn = !!(actingAs as unknown as { signIn?: unknown } | null)?.signIn;
    await heading.first().waitFor({ state: "attached", timeout: signedIn ? 5000 : 1500 }).catch(() => undefined);
    if (!(await heading.count())) return null;
    // The filter's inner locator is looked for inside each region, so it starts from the page.
    const region = page
      .getByRole("main")
      .getByRole("region")
      .filter({ has: page.getByRole("heading", { name: /^\s*new opportunity emails\s*$/i }) });
    return (await region.count()) ? region.first() : heading.first().locator("xpath=..");
  }
  function optinButton(region: Locator): Locator {
    return region.getByRole("button", { name: /email(ing)? me about new opportunities/i }).first();
  }
  async function optinState(region: Locator): Promise<"checked" | "unchecked" | ""> {
    const button = optinButton(region);
    if (!(await button.count())) return "";
    const name = (await button.innerText()).trim();
    if (OPTIN_ON.test(name)) return "checked";
    if (OPTIN_OFF.test(name)) return "unchecked";
    return "";
  }
  // The region's heading, its sentence and its button, without the passing "Saved." status.
  async function optinWords(region: Locator): Promise<string> {
    const status = region.getByRole("status");
    const said = (await status.count()) ? lined(await status.first().innerText()) : [];
    return lined(await region.innerText())
      .filter((line) => !said.includes(line))
      .join("\n");
  }
  const optinList: S.NotificationOptinOpportunityListPage = {
    open: () => go("/opportunities"),
    toggleNewOpportunityNotifications: async (input) => {
      const where = `${OPTIN}.toggle_new_opportunity_notifications`;
      const region = await onOptinList("toggle_new_opportunity_notifications");
      if (!region) {
        unbound(where, `/opportunities shows ${actingId()} no "New opportunity emails" control; it is offered to a signed-in person (seen as a vendor, a public sector employee and the administrator), and a signed-out visitor has none to press`);
      }
      const button = optinButton(region);
      if (!(await button.count())) unbound(where, `the "New opportunity emails" region on ${page.url()} offers no button; it reads ${(await optinWords(region)).replace(/\n/g, " / ")}`);
      if (await isDisabled(button)) throw new Error(`${where} — "${(await button.innerText()).trim()}" is disabled on ${page.url()}`);
      const was = await optinState(region);
      const wanted = boxWanted(input, NOTICE_KEYS);
      if (wanted !== undefined && (was === "checked") === wanted) return;
      await button.click();
      await settle();
      const flipped = await page
        .waitForFunction(
          (before) => {
            const buttons = Array.from(document.querySelectorAll("main button")) as HTMLElement[];
            const one = buttons.find((b) => /email(ing)? me about new opportunities/i.test(b.innerText));
            if (!one) return false;
            const on = /stop emailing/i.test(one.innerText);
            return on !== (before === "checked");
          },
          was,
          { timeout: 10000 },
        )
        .then(() => true)
        .catch(() => false);
      if (!flipped) {
        const status = region.getByRole("status");
        const said = (await status.count()) ? (await status.first().innerText()).trim() : "";
        throw new Error(`${where} — pressing the "New opportunity emails" button on ${page.url()} left it ${was}${said ? `; it says "${said}"` : ""}`);
      }
    },
    notificationControl: async () => {
      const region = await onOptinList("notification_control");
      return region ? optinWords(region) : "";
    },
    // "checked" when the person is emailed about new opportunities, "unchecked" when not, as
    // the profile's own box reads; nothing when no control is shown.
    notificationControlState: async () => {
      const region = await onOptinList("notification_control_state");
      return region ? optinState(region) : "";
    },
    // The control as it is shown at a phone's width (375 pixels): its words when it is on
    // screen there, nothing when it is hidden. The window is put back as it was.
    notificationControlHiddenOnNarrowScreen: async () => {
      const before = page.viewportSize();
      await page.setViewportSize({ width: 375, height: before?.height ?? 800 });
      try {
        const region = await onOptinList("notification_control_hidden_on_narrow_screen");
        if (!region || !(await region.isVisible())) return "";
        return optinWords(region);
      } finally {
        if (before) await page.setViewportSize(before);
      }
    },
  };

  // ---------------------------------------------------------------- the attachment control
  //
  // On a Code With Us opportunity's form (?tab=opportunity of its management screen, and the
  // create form): an "Attachments" region with "Any type of file, up to 10 MB each." and
  // "Add attachment", which opens the file chooser. A stored attachment is a list item with
  // its name in a read-only "Attachment name" box ("Already stored, so its name cannot be
  // changed."), a "Download <name>" link to /api/files/<id>?type=blob and "Remove <name>". A
  // file just added is stored at once and is "New: <name>, <size>. Uploaded and attached to
  // this opportunity. …" with its "Download <name>" link, a "Name for <name> (optional)" box,
  // "Will be saved as: <name>" and "Remove <name>"; one over the
  // limit is "New: <name>, <size>." with the alert "<name> is too large to attach". Changes
  // are kept by the form's "Save changes" (or by the create form's own action). On the
  // current build the Sprint With Us and Team With Us opportunity forms open to the
  // administrator and public sector staff and end with the same "Attachments" part (seen on
  // /opportunities/sprint-with-us/create and /opportunities/team-with-us/create); the
  // proposal forms' attachments are their own pages' add_attachment.
  const ATTACH = "file-attachment-control";
  function attachmentRegion(): Locator {
    return seen(regionNamed(page, /^attachments$/i)).first();
  }
  async function onAttachments(member: string): Promise<Locator> {
    const where = `${ATTACH}.${member}`;
    await ready();
    const pathname = new URL(page.url()).pathname;
    const wanted = attachmentsOf.opportunityId;
    if (wanted && !pathname.includes(wanted) && !/\/create$/.test(pathname)) {
      await go("/opportunities/:program/:opportunityId/edit?tab=opportunity", attachmentsOf);
    }
    const why = await whyNotHere();
    if (why) {
      unbound(where, `the form at ${page.url()} did not open for ${actingId()}: ${why.replace(/\n+/g, " ")}; the attachment control sits on an opportunity's form, offered only to the administrator and public sector staff; ${NOBODY_SIGNS_IN}`);
    }
    if (!(await attachmentRegion().count()) || !(await findControl(attachmentRegion(), /^\s*add attachment\s*$/i))) {
      const manage = manageAddress();
      if (manage) await visit(`${manage}?tab=opportunity`);
    }
    const region = attachmentRegion();
    if (!(await region.count())) {
      // Walked on the current build as the public sector employee: the Sprint With Us and Team
      // With Us create forms end with the same "Attachments" part as the Code With Us one
      // ("Any type of file, up to 10 MB each.", "Add attachment"), so a form without it is
      // the page lacking it, not the program.
      unbound(where, `no "Attachments" part on the form at ${page.url()} for ${actingId()}; walked on the current build, each program's create form (/opportunities/{code,sprint,team}-with-us/create) ends with one ("Any type of file, up to 10 MB each." and "Add attachment"); this one offers ${await offered()}`);
    }
    return region;
  }
  function attachmentItems(region: Locator): Locator {
    return seen(region.getByRole("listitem"));
  }
  // Each row is judged by its words and by whether it carries a link to the stored file.
  async function itemsMatching(region: Locator, matches: (words: string, stored: boolean) => boolean): Promise<Locator[]> {
    const items = attachmentItems(region);
    const out: Locator[] = [];
    for (let i = 0; i < (await items.count()); i++) {
      const words = await items.nth(i).innerText().catch(() => "");
      const stored = await items
        .nth(i)
        .getByRole("link")
        .evaluateAll((links) => links.some((link) => (link.getAttribute("href") ?? "").includes("/api/files/")))
        .catch(() => false);
      if (matches(words, stored)) out.push(items.nth(i));
    }
    return out;
  }
  // A file just chosen is stored at once and its row, still worded "New: <name>, <size>.
  // Uploaded and attached to this opportunity. …", carries its "Download <name>" link to
  // /api/files/<id>; so a row with that link is stored whatever it says, and "new" (the
  // "Name for <name>" box, "Will be saved as") is its wording alone.
  const isNew = (words: string): boolean => /^\s*new:/im.test(words);
  const isStored = (words: string, stored: boolean): boolean => stored || !isNew(words);
  async function rowLines(rows: Locator[]): Promise<string> {
    const out: string[] = [];
    for (const row of rows) {
      const words = lined(await row.innerText().catch(() => ""));
      const box = row.getByRole("textbox");
      const value = (await box.count()) ? (await box.first().inputValue().catch(() => "")).trim() : "";
      out.push([...words, ...(value ? [value] : [])].join(" | "));
    }
    return out.join("\n");
  }
  // The row a test names: by the file's name, or the first of its kind.
  async function rowNamed(region: Locator, input: unknown, test: (words: string, stored: boolean) => boolean): Promise<Locator | null> {
    const name = givenText(input, ["file", "fileName", "name", "attachment", "from"]) || (typeof input === "string" ? input : "");
    const rows = await itemsMatching(region, test);
    if (name) {
      for (const row of rows) if ((await row.innerText().catch(() => "")).includes(name)) return row;
      for (const row of rows) {
        const box = row.getByRole("textbox");
        if ((await box.count()) && (await box.first().inputValue().catch(() => "")) === name) return row;
      }
      return null;
    }
    return rows[0] ?? null;
  }
  // Keeps the form's changes: "Save changes" on a saved opportunity. The create form keeps
  // them with its own action, so nothing is pressed there.
  async function saveAttachments(where: string): Promise<void> {
    if (/\/create$/.test(new URL(page.url()).pathname)) return;
    await press(where, /^\s*save changes\s*$/i);
    await confirmIfAsked(where, /^\s*(save|publish)( changes)?\s*$/i);
    await seen(page.getByRole("status").filter({ hasText: /saved/i }))
      .first()
      .waitFor({ state: "visible", timeout: 10000 })
      .catch(() => undefined);
    await ready();
  }
  async function storedLinks(region: Locator): Promise<string[]> {
    return seen(region.getByRole("link", { name: /^download\b/i }))
      .evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""))
      .then((hrefs) => hrefs.filter((href) => href.includes("/api/files/")))
      .catch(() => [] as string[]);
  }
  const fileAttachmentControl: S.FileAttachmentControlPage = {
    open: async (params) => {
      attachmentsOf = { program: String(params?.program ?? ""), opportunityId: String(params?.opportunityId ?? "") };
      await page
        .goto(leniently("/opportunities/:program/:opportunityId/edit?tab=opportunity", params), { waitUntil: "domcontentloaded" })
        .catch(() => undefined);
      await ready();
    },
    // The file is stored as soon as it is chosen and listed as new with its download link;
    // a name typed for it is given when the form is saved, which the readers that need the
    // final name (attachment_address, download_attachment, the public list) do.
    addAttachment: async (input) => {
      await onAttachments("add_attachment");
      await addAttachmentFile(`${ATTACH}.add_attachment`, input);
    },
    renameNewAttachment: async (input) => {
      const where = `${ATTACH}.rename_new_attachment`;
      const region = await onAttachments("rename_new_attachment");
      const row = await rowNamed(region, record(input).file ?? record(input).from ?? undefined, isNew);
      if (!row) unbound(where, `no newly added attachment on ${page.url()} to rename; the list reads: ${(await rowLines(await itemsMatching(region, () => true))) || "nothing"}`);
      const box = row.getByRole("textbox", { name: /^name for\b/i });
      if (!(await box.count())) unbound(where, `the new attachment on ${page.url()} carries no "Name for …" box`);
      const to = givenText(input, ["to", "newName", "name", "value"]) || (typeof input === "string" ? input : "");
      await box.first().fill(to);
      await box.first().blur().catch(() => undefined);
      await settle();
    },
    removeNewAttachment: async (input) => {
      const where = `${ATTACH}.remove_new_attachment`;
      const region = await onAttachments("remove_new_attachment");
      const row = await rowNamed(region, input, isNew);
      if (!row) unbound(where, `no newly added attachment on ${page.url()} matches ${JSON.stringify(input)}`);
      await press(where, /^\s*remove\b/i, row);
    },
    removeExistingAttachment: async (input) => {
      const where = `${ATTACH}.remove_existing_attachment`;
      const region = await onAttachments("remove_existing_attachment");
      const row = await rowNamed(region, input, isStored);
      if (!row) unbound(where, `no stored attachment on ${page.url()} matches ${JSON.stringify(input)}; the list reads: ${(await rowLines(await itemsMatching(region, () => true))) || "nothing"}`);
      await press(where, /^\s*remove\b/i, row);
      await saveAttachments(where);
    },
    downloadAttachment: async (input) => {
      const where = `${ATTACH}.download_attachment`;
      let region = await onAttachments("download_attachment");
      if ((await itemsMatching(region, isNew)).length) {
        await saveAttachments(where);
        region = await onAttachments("download_attachment");
      }
      const row = await rowNamed(region, input, isStored);
      const link = row ? seen(row.getByRole("link", { name: /^download\b/i })).first() : null;
      if (!link || !(await link.count())) unbound(where, `no stored attachment with a "Download" link on ${page.url()} matches ${JSON.stringify(input)}`);
      const download = page.waitForEvent("download", { timeout: 10000 }).catch(() => null);
      await link.click();
      await download;
      await settle();
    },
    // The stored address of every attachment, saving a file only just added first.
    attachmentAddress: async () => {
      const where = `${ATTACH}.attachment_address`;
      // On a Code With Us proposal's own screen (.../proposals/:proposalId/edit), where a
      // test that attached a file to a proposal reads its address: the "Proposal" section
      // draws an "Attachments" part listing each stored file as "Download <name>" to
      // /api/files/<id>?type=blob (seen on a draft proposal given a file on this build). A
      // proposal screen that opened is the place either way: without that part, the stored
      // files are whatever "Download <name>" links it draws, and none is none.
      await ready();
      if (/\/proposals\/[^/]+/.test(new URL(page.url()).pathname)) {
        const why = await whyNotHere();
        if (why) unbound(where, `the proposal's screen at ${page.url()} did not open: ${why.replace(/\n+/g, " ")}`);
        const part = attachmentRegion();
        return (await storedLinks((await part.count()) ? part : page.getByRole("main"))).join("\n");
      }
      let region = await onAttachments("attachment_address");
      if ((await itemsMatching(region, (words) => isNew(words) && !/too large/i.test(words))).length) {
        await saveAttachments(where);
        region = await onAttachments("attachment_address");
      }
      return (await storedLinks(region)).join("\n");
    },
    sizeLimitStatedBeforeChoosing: async () => {
      const region = await onAttachments("size_limit_stated_before_choosing");
      return lined(await region.innerText()).filter((line) => /\b\d+\s?(MB|KB|GB)\b.*\b(each|smaller|limit|up to)\b|\bup to \d+\s?(MB|KB|GB)\b/i.test(line) && !/^new:/i.test(line)).join("\n");
    },
    uploadRefusedForSize: async () => {
      const region = await onAttachments("upload_refused_for_size");
      const alerts = seen(region.getByRole("alert"));
      const out: string[] = [];
      for (let i = 0; i < (await alerts.count()); i++) out.push(...lined(await alerts.nth(i).innerText()));
      return out.join("\n");
    },
    newAttachmentRow: async () => rowLines(await itemsMatching(await onAttachments("new_attachment_row"), isNew)),
    existingAttachmentRow: async () =>
      rowLines(await itemsMatching(await onAttachments("existing_attachment_row"), isStored)),
    // What a stored attachment's name box says about changing it, and whether it can be.
    existingAttachmentNameReadOnly: async () => {
      const rows = await itemsMatching(await onAttachments("existing_attachment_name_read_only"), isStored);
      const out: string[] = [];
      for (const row of rows) {
        const box = row.getByRole("textbox").first();
        const locked = (await box.count())
          ? (await box.evaluate((element) => (element as HTMLInputElement).readOnly || (element as HTMLInputElement).disabled).catch(() => false))
          : false;
        const note = lined(await row.innerText()).find((line) => /cannot be changed|read.?only/i.test(line));
        if (locked || note) out.push(note ?? "read-only");
      }
      return out.join("\n");
    },
    // "Will be saved as: <name>" under each new attachment.
    originalExtensionRestored: async () => {
      const rows = await itemsMatching(await onAttachments("original_extension_restored"), isNew);
      const out: string[] = [];
      for (const row of rows) {
        const line = lined(await row.innerText()).find((one) => /^will be saved as:/i.test(one));
        if (line) out.push(line.replace(/^will be saved as:\s*/i, ""));
      }
      return out.join("\n");
    },
    // The message a name box is marked with, and any alert about a name; none reads as nothing.
    fileNameError: async () => {
      const region = await onAttachments("file_name_error");
      const out: string[] = [];
      const boxes = seen(region.getByRole("textbox"));
      for (let i = 0; i < (await boxes.count()); i++) {
        const said = await boxes
          .nth(i)
          .evaluate((element) => {
            if (element.getAttribute("aria-invalid") !== "true") return "";
            const ids = (element.getAttribute("aria-describedby") ?? element.getAttribute("aria-errormessage") ?? "").split(/\s+/).filter(Boolean);
            return ids.map((id) => document.getElementById(id)?.innerText ?? "").join("\n");
          })
          .catch(() => "");
        out.push(...lined(said));
      }
      const alerts = seen(region.getByRole("alert"));
      for (let i = 0; i < (await alerts.count()); i++) {
        const words = await alerts.nth(i).innerText();
        if (/name/i.test(words) && !/too large/i.test(words)) out.push(...lined(words));
      }
      return [...new Set(out)].join("\n");
    },
    // The "Remove <name>" controls the attachments carry; none reads as nothing.
    removeControlHiddenWhenNotRemovable: async () => {
      const region = await onAttachments("remove_control_hidden_when_not_removable");
      return (await seen(region.getByRole("button", { name: /^remove\b/i })).allInnerTexts().catch(() => [] as string[]))
        .map((one) => one.trim())
        .join("\n");
    },
    // The Attachments list under the public page's Description, saving the form first when
    // it still holds a file only just added. "No attachments" reads as nothing.
    attachmentListOnPublicView: async () => {
      const where = `${ATTACH}.attachment_list_on_public_view`;
      if (!PROGRAM_NAME[attachmentsOf.program] || !attachmentsOf.opportunityId) {
        unbound(where, `no opportunity was opened (program and opportunityId; given ${JSON.stringify(attachmentsOf)})`);
      }
      const region = attachmentRegion();
      if ((await region.count()) && (await itemsMatching(region, (words) => isNew(words) && !/too large/i.test(words))).length) {
        await saveAttachments(where);
      }
      await go(`/opportunities/${attachmentsOf.program}/:opportunityId`, { opportunityId: attachmentsOf.opportunityId });
      const refused = await refusalShown();
      if (refused) unbound(where, `the opportunity's page did not open at ${page.url()}: ${refused}`);
      const list = seen(page.getByRole("list", { name: /^attachments$/i }));
      if (!(await list.count())) return "";
      return lined(await list.first().innerText()).join("\n");
    },
  };

  // GET /api/counters?counters=opportunity.<program>.<id>.views answers an object from
  // counter name to count; a counter never incremented is absent and reads as 0. This
  // target answers it with 200 to a vendor and to nobody signed in as readily as to an
  // administrator, so a refusal reads as nothing there. Asked afresh at every read.
  const counters = requests("opportunity-counters");
  let counterName = "";
  async function askCounter(member: string): Promise<Answer> {
    if (!counterName) unbound(`opportunity-counters.${member}`, "no opportunity was opened to count");
    return counters.send(member, "GET", `${baseURL}/api/counters?counters=${encodeURIComponent(counterName)}`);
  }
  const opportunityCounters: S.OpportunityCountersPage = {
    open: async (params) => {
      const id = seededId(params?.opportunityId ?? "", "opportunities");
      const seeded = Object.values(seedGroups.opportunities ?? {}).find((each) => String(each.id) === id) as
        | (SeedRecord & { program?: unknown })
        | undefined;
      const program = String(params?.program ?? "") || (typeof seeded?.program === "string" ? seeded.program : "");
      if (!id) unbound("opportunity-counters.open", "no opportunity was named");
      if (!program) unbound("opportunity-counters.open", `no programme was named for opportunity ${id}`);
      counterName = `opportunity.${program}.${id}.views`;
      await askCounter("open");
    },
    viewCount: async () => {
      const got = await askCounter("view_count");
      if (got.status !== 200) return "";
      const answered = parse(got.body);
      if (!answered || typeof answered !== "object" || Array.isArray(answered)) return "";
      const count = record(answered)[counterName];
      return count === undefined || count === null ? "0" : String(count);
    },
    refusedWhenNotPermitted: async () =>
      refusedText(await askCounter("refused_when_not_permitted"), (status) => status === 401 || status === 403),
  };

  // ------------------------------------------------ an opportunity's history and status, by request

  // GET /api/opportunities/:program/:id carries "history" (newest first, each entry
  // { createdAt, createdBy: { id, name } | null, status, event, note, attachments: [{ id,
  // name, ... }] }) to the administrator and the opportunity's author; signed out (and to
  // other readers) the same answer comes without the "history" key. The update operation
  // is PUT with { tag, value }: Code With Us offers edit, submitForReview, publish, cancel,
  // addAddendum and addNote; Sprint With Us adds startCodeChallenge, startTeamScenario and
  // the evaluation tags; Team With Us offers startChallenge and no addNote at all (its
  // service answers 400 naming the tags it allows). Walked as the administrator on a draft
  // made for the purpose: addNote { note, attachments: [fileId] } answers 200 with a
  // NOTE_ADDED entry carrying the file; an empty note 400 ["note: Enter the note."]; 1,001
  // characters 400 ["note: Enter a note of up to 1,000 characters."]; an unreadable file 400
  // ["attachments: You may attach only files you are permitted to read."]. publish then
  // cancel answer 200; publish or submitForReview after that 400 ["An opportunity that is
  // cancelled cannot be made published."]; the seeded awarded Code With Us opportunity asked
  // to publish 400 ["An opportunity that is awarded cannot be made published."]; the seeded
  // awarded Sprint With Us one asked to submit, publish or start a stage 400 ["That action
  // is not yet available on this opportunity."]. Signed out, addNote answers 401 ["Only an
  // administrator or the opportunity's author may add a note."] and publish 401 ["Only an
  // administrator may publish an opportunity."]. An identifier nothing is held under
  // answers 404 ["No opportunity is held at that address."] to everyone.
  function opportunityAt(pageId: string, params: { program: string; opportunityId: string } | undefined): string {
    const id = seededId(params?.opportunityId ?? "", "opportunities");
    const seeded = Object.values(seedGroups.opportunities ?? {}).find((each) => String(each.id) === id) as
      | (SeedRecord & { program?: unknown })
      | undefined;
    const program = String(params?.program ?? "") || (typeof seeded?.program === "string" ? seeded.program : "");
    if (!id) unbound(`${pageId}.open`, "no opportunity was named");
    if (!program) unbound(`${pageId}.open`, `no programme was named for opportunity ${id}`);
    return `${baseURL}/api/opportunities/${encodeURIComponent(program)}/${encodeURIComponent(id)}`;
  }

  // The opportunity as the signed-in person reads it now; an identifier nothing is held
  // under is a record this target does not have, so the place was never reached.
  async function opportunityNow(pageId: string, member: string, target: string): Promise<Record<string, unknown> | null> {
    if (!target) unbound(`${pageId}.${member}`, "no opportunity has been opened");
    const read = await peek(target);
    if (read.status === 404) {
      unbound(`${pageId}.${member}`, `GET ${target.slice(baseURL.length)} answered 404: this target holds no opportunity there`);
    }
    if (read.status === 0) unbound(`${pageId}.${member}`, `GET ${target.slice(baseURL.length)} could not be made`);
    return read.status === 200 ? record(read.json) : null;
  }

  const historyAsked = requests("opportunity-history-request");
  let historyOpened = "";
  let noteAsked = false;
  const opportunityHistoryRequest: S.OpportunityHistoryRequestPage = {
    open: async (params) => {
      historyOpened = opportunityAt("opportunity-history-request", params);
      noteAsked = false;
      await historyAsked.send("open", "GET", historyOpened);
    },
    async addNoteByRequest(input) {
      const member = "add_note_by_request";
      const where = `opportunity-history-request.${member}`;
      if (!historyOpened) unbound(where, "no opportunity has been opened");
      const text = typeof input === "string" ? input : field(input, "note", "text", "body", "content", "message");
      const files = given(input, ["attachments", "files", "fileIds", "file_ids", "storedFiles", "attachment", "file", "fileId"]);
      const attachments = (Array.isArray(files) ? files : files === undefined || files === null || files === "" ? [] : [files])
        .map((each) => fileIdFor(each && typeof each === "object" ? textOf(record(each).id) : textOf(each)))
        .filter(Boolean);
      noteAsked = true;
      await historyAsked.send(member, "PUT", historyOpened, { tag: "addNote", value: { note: text, attachments } });
    },
    historyShown: async () => {
      const held = await opportunityNow("opportunity-history-request", "history_shown", historyOpened);
      return String(!!held && Array.isArray(held.history));
    },
    historyEntries: async () => {
      const held = await opportunityNow("opportunity-history-request", "history_entries", historyOpened);
      const entries = held && Array.isArray(held.history) ? held.history : [];
      return entries
        .map((each) => {
          const entry = record(each);
          const by = record(entry.createdBy);
          const files = (Array.isArray(entry.attachments) ? entry.attachments : [])
            .map((file) => `${textOf(record(file).name)} (${textOf(record(file).id)})`)
            .join(", ");
          return [
            textOf(entry.event) || textOf(entry.status),
            textOf(entry.note),
            textOf(by.name),
            textOf(entry.createdAt),
            files,
          ].join(" | ");
        })
        .join("\n");
    },
    requestAccepted: async () => {
      if (!noteAsked) unbound("opportunity-history-request.request_accepted", "no note has been asked for on this page");
      return acceptedText(historyAsked.last("request_accepted"));
    },
    refusalMessages: async () => {
      if (!noteAsked) unbound("opportunity-history-request.refusal_messages", "no note has been asked for on this page");
      return messagesOf(historyAsked.last("refusal_messages"));
    },
    refusalStatus: async () => {
      if (!noteAsked) unbound("opportunity-history-request.refusal_status", "no note has been asked for on this page");
      return refusalStatusOf(historyAsked.last("refusal_status"));
    },
  };

  // Each status is reached by its own named operation; there is no "set status".
  const STATUS_OPERATION: Record<string, string> = {
    UNDER_REVIEW: "submitForReview",
    PUBLISHED: "publish",
    CANCELED: "cancel",
    CANCELLED: "cancel",
    EVAL_CC: "startCodeChallenge",
    EVAL_SCENARIO: "startTeamScenario",
    EVAL_C: "startChallenge",
  };
  const statusAsked = requests("opportunity-status-request");
  let statusOpened = "";
  let statusRequested = false;
  const opportunityStatusRequest: S.OpportunityStatusRequestPage = {
    open: async (params) => {
      statusOpened = opportunityAt("opportunity-status-request", params);
      statusRequested = false;
      await statusAsked.send("open", "GET", statusOpened);
    },
    async requestStatusChange(input) {
      const member = "request_status_change";
      const where = `opportunity-status-request.${member}`;
      if (!statusOpened) unbound(where, "no opportunity has been opened");
      const status = (typeof input === "string" ? input : field(input, "status", "to", "target")).trim().toUpperCase();
      if (!status) unbound(where, `the input names no status (${JSON.stringify(input)})`);
      const tag = STATUS_OPERATION[status];
      if (!tag) unbound(where, `the service offers no operation that leads to ${status}`);
      statusRequested = true;
      await statusAsked.send(member, "PUT", statusOpened, { tag, value: "" });
    },
    requestAccepted: async () => {
      if (!statusRequested) unbound("opportunity-status-request.request_accepted", "no status change has been asked for");
      return acceptedText(statusAsked.last("request_accepted"));
    },
    refusalStatus: async () => {
      if (!statusRequested) unbound("opportunity-status-request.refusal_status", "no status change has been asked for");
      return refusalStatusOf(statusAsked.last("refusal_status"));
    },
    refusalMessages: async () => {
      if (!statusRequested) unbound("opportunity-status-request.refusal_messages", "no status change has been asked for");
      return messagesOf(statusAsked.last("refusal_messages"));
    },
    storedStatus: async () => {
      const held = await opportunityNow("opportunity-status-request", "stored_status", statusOpened);
      if (!held) unbound("opportunity-status-request.stored_status", "the signed-in person may not read this opportunity");
      return textOf(held.status);
    },
  };

  // ------------------------------------------------ organizations, by request

  // POST /api/organizations answers 201 with the organization (its "id", "legalName",
  // "active", ...); PUT /api/organizations/:id { tag: "updateProfile", value } and
  // DELETE /api/organizations/:id answer 200 with it, "active" false after an archive.
  // This target files every refusal under one "errors" list: signed out a registration is
  // 401 ["Only a signed-in vendor who has accepted the terms and conditions may register an
  // organization."] and a change or archive 401 ["Sign in to do that."]; a change or archive
  // from a signed-in person who neither owns the organization nor administers the service
  // 401 ["Only the organization's owner or an administrator may change or archive it."],
  // the organization still readable by an organization administrator; a missing or
  // malformed field 400 ["Legal name: Enter the organization’s legal name", ...], one
  // "<field label>: <message>" line per field; a second archive 400 ["This organization has
  // already been archived."]; an identifier naming nothing 401 ["You are not permitted to
  // read that organization."].
  const ORGANIZATION_FIELDS: Record<string, string[]> = {
    legalName: ["legalName", "legal_name", "name"],
    websiteUrl: ["websiteUrl", "website_url", "website", "websiteAddress"],
    streetAddress1: ["streetAddress1", "street_address_1", "streetAddress", "street1", "street", "address"],
    streetAddress2: ["streetAddress2", "street_address_2", "street2", "addressLine2", "addressLineTwo"],
    city: ["city"],
    region: ["region", "province", "state", "provinceOrState"],
    mailCode: ["mailCode", "mail_code", "postalCode", "zip", "zipCode"],
    country: ["country"],
    contactName: ["contactName", "contact_name"],
    contactTitle: ["contactTitle", "contact_title"],
    contactEmail: ["contactEmail", "contact_email", "email"],
    contactPhone: ["contactPhone", "contact_phone", "phone"],
  };
  const ORGANIZATION_TARGET_KEYS = ["orgId", "organization", "organizationId", "organizationIdentifier", "id"];

  // The profile an input carries, every key matched to the field the service takes; a key
  // that names no field is reported rather than dropped.
  function organizationProfile(member: string, input: unknown): Record<string, unknown> {
    const where = `organization-request.${member}`;
    const handed = record(input);
    const profile = record(handed.profile ?? handed.registration ?? handed.fields ?? input);
    const known = new Set(
      [...Object.values(ORGANIZATION_FIELDS).flat(), ...ORGANIZATION_TARGET_KEYS, "profile", "registration", "fields"].map(squash),
    );
    for (const key of Object.keys(profile)) {
      if (!known.has(squash(key))) unbound(where, `the input key "${key}" names no field of an organization's profile`);
    }
    const out: Record<string, unknown> = {};
    for (const [name, spellings] of Object.entries(ORGANIZATION_FIELDS)) {
      const value = given(profile, spellings);
      if (value !== undefined) out[name] = value;
    }
    return out;
  }

  const organizationAsked = requests("organization-request");
  let organizationOpened = "";
  let organizationRequested = false;
  let organizationRegistered = "";

  function organizationTarget(member: string, input: unknown): string {
    const named = seededId(given(input, ORGANIZATION_TARGET_KEYS), "organizations");
    const id = named || organizationOpened;
    if (!id) unbound(`organization-request.${member}`, "no organization was opened or named");
    return id;
  }

  async function organizationNow(member: string): Promise<Record<string, unknown> | null> {
    if (!organizationOpened) unbound(`organization-request.${member}`, "no organization was opened or registered on this page");
    const got = await peek(`${baseURL}/api/organizations/${encodeURIComponent(organizationOpened)}`);
    return got.status === 200 ? record(got.json) : null;
  }

  function organizationAsk(member: string): Answer {
    if (!organizationRequested) unbound(`organization-request.${member}`, "no request has been sent on this page yet");
    return organizationAsked.last(member);
  }

  const organizationRequest: S.OrganizationRequestPage = {
    open: async (params) => {
      organizationOpened = seededId(params?.orgId, "organizations") || params?.orgId || "";
      organizationRequested = false;
      organizationRegistered = "";
    },
    async registerByRequest(input) {
      const member = "register_by_request";
      const profile = organizationProfile(member, input);
      organizationRequested = true;
      const got = await organizationAsked.send(member, "POST", `${baseURL}/api/organizations`, profile);
      const created = got.status < 300 ? textOf(record(parse(got.body)).id) : "";
      organizationRegistered = created;
      if (created) organizationOpened = created;
    },
    async changeProfileByRequest(input) {
      const member = "change_profile_by_request";
      const id = organizationTarget(member, input);
      const changes = organizationProfile(member, input);
      // Fields the input leaves out keep what is held, when the asker may read it.
      const held = await peek(`${baseURL}/api/organizations/${encodeURIComponent(id)}`);
      const current: Record<string, unknown> = {};
      if (held.status === 200) {
        for (const name of Object.keys(ORGANIZATION_FIELDS)) {
          const value = record(held.json)[name];
          if (value !== undefined && value !== null) current[name] = value;
        }
      }
      organizationOpened = id;
      organizationRequested = true;
      organizationRegistered = "";
      await organizationAsked.send(member, "PUT", `${baseURL}/api/organizations/${encodeURIComponent(id)}`, {
        tag: "updateProfile",
        value: { ...current, ...changes },
      });
    },
    async archiveByRequest(input) {
      const member = "archive_by_request";
      const id = organizationTarget(member, input);
      organizationOpened = id;
      organizationRequested = true;
      organizationRegistered = "";
      await organizationAsked.send(member, "DELETE", `${baseURL}/api/organizations/${encodeURIComponent(id)}`);
    },
    requestAccepted: async () => acceptedText(organizationAsk("request_accepted")),
    refusalStatus: async () => refusalStatusOf(organizationAsk("refusal_status")),
    // The name(s) the refusal is filed under: a field's label for a field error (this
    // target writes each as "<label>: <message>"), otherwise the key the body files it under.
    refusalReason: async () => {
      const got = organizationAsk("refusal_reason");
      if (got.status < 400) return "";
      const body = parse(got.body);
      const fields = record(body);
      const reasons: string[] = [];
      for (const [key, value] of Object.entries(fields)) {
        const lines = Array.isArray(value) ? value.map(textOf) : [textOf(value)];
        const labelled = lines.map((line) => /^([^:]{1,60}):\s/.exec(line)?.[1] ?? "").filter(Boolean);
        reasons.push(...(labelled.length ? labelled : [key]));
      }
      return [...new Set(reasons)].join("\n");
    },
    refusalMessages: async () => messagesOf(organizationAsk("refusal_messages")),
    organizationIdentifier: async () => organizationRegistered,
    storedActive: async () => {
      const held = await organizationNow("stored_active");
      if (!held) unbound("organization-request.stored_active", "the signed-in person may not read this organization");
      return textOf(held.active);
    },
    storedLegalName: async () => {
      const held = await organizationNow("stored_legal_name");
      if (!held) unbound("organization-request.stored_legal_name", "the signed-in person may not read this organization");
      return textOf(held.legalName);
    },
  };

  // ---------------------------------------------------------------- the Code With Us proposal form and screen
  //
  // Walked signed in as the seeded vendor (test-vendor-1) through the identity provider on the
  // seeded published Code With Us opportunity, whose public page now carries a "Start a
  // proposal" link to /opportunities/code-with-us/:opportunityId/proposals/create. The form is
  // one page under the heading "Create a Code With Us proposal": a "The opportunity" region
  // (Opportunity, Reward, Proposal deadline), then "Proponent" — a "Who is submitting this
  // proposal? (required)" radio group of "An individual" (ticked to start with) and "An
  // organization" — with, for an individual, "Legal name", "Email address", "Phone number
  // (optional)", "Street address", "Street address line 2 (optional)", "City", "Province or
  // state", "Postal code" and "Country" (each "(required)" unless marked otherwise), and for an
  // organization a chooser button "Organization (required)" ("Select an item") listing the
  // organizations the vendor owns or administers; then "Proposal" ("Proposal (required)",
  // "Additional comments (optional)"), "Attachments" ("Add attachment", "Any type of file, up to
  // 10 MB each.") and the "Proposal actions" group of "Cancel" (back to the opportunity's public
  // page), "Save draft" and "Submit proposal". The radios are drawn under their own labels,
  // which take the click.
  //
  // "Submit proposal" with anything missing stays on the form under an alert ("This proposal
  // has 8 problems" then one "<Field>: <message>" line each, "Legal name: enter your legal name")
  // and the same message under each field. With everything filled it raises the dialog "Submit
  // your proposal": links to both sets of terms, the boxes "I accept the Code With Us terms and
  // conditions (required)" and "I accept the Digital Marketplace terms and conditions
  // (required)", and "Cancel" and "Submit proposal", the latter disabled until both are ticked.
  // A save or a submit lands on the proposal's own screen,
  // /opportunities/code-with-us/:opportunityId/proposals/:proposalId/edit. A vendor who already
  // has a proposal on the opportunity is sent from the create address to that screen instead.
  //
  // The proposal's screen ("Manage a Code With Us proposal" over the opportunity's title) lists
  // Status, Submitted (once submitted), Proposal ID, Opportunity ID and Proposal deadline as
  // terms, links "View the opportunity" and "Printable copy", and offers the "Proposal actions"
  // group: "Edit", "Submit proposal" and "Delete" on a draft; "Edit" and "Withdraw" once
  // submitted ("Withdraw this proposal?" with "Keep proposal" / "Withdraw proposal"); "Edit" and
  // "Submit proposal" once withdrawn. Its sections are "Proposal" and "History" (?tab=proposal,
  // ?tab=history). "Edit" opens the same fields in place with "Cancel", "Save changes" ("Your
  // changes have been saved.") and "Save changes and submit" (the same terms dialog). The
  // screen is answered "Page not found" to anybody but the proposal's own author, the
  // administrator included; so are the proposal's "Printable copy" (.../export), the evaluation
  // view (/opportunities/code-with-us/:opportunityId/proposals/:proposalId) and .../proposals/export.
  const PCWU_CREATE = "proposal-cwu-create";
  const PCWU_EDIT = "proposal-cwu-edit";

  // Each field by the start of its label, with the spellings a test may give its value under.
  const PROPOSAL_FIELDS: [RegExp, string[]][] = [
    [/^\s*legal name/i, ["legalName", "name", "proponentName", "individualName", "fullName"]],
    [/^\s*email address/i, ["email", "emailAddress", "contactEmail"]],
    [/^\s*phone number/i, ["phone", "phoneNumber", "contactPhone"]],
    [/^\s*street address(?! line 2)/i, [
      "street", "street1", "streetAddress", "streetAddress1", "streetAddressOne",
      "address", "addressLine", "addressLine1", "addressLineOne",
    ]],
    [/^\s*street address line 2/i, [
      "street2", "streetAddress2", "streetAddressTwo", "addressLine2", "addressLineTwo", "address2", "addressTwo",
    ]],
    [/^\s*city/i, ["city"]],
    [/^\s*province or state/i, ["region", "province", "state", "provinceState", "provinceOrState"]],
    [/^\s*postal code/i, ["postalCode", "mailCode", "postal", "zip", "zipCode"]],
    [/^\s*country/i, ["country"]],
    [/^\s*proposal\s*\(/i, ["proposalText", "proposal", "text", "body"]],
    [/^\s*additional comments/i, ["additionalComments", "comments", "additionalComment"]],
  ];
  const PROPONENT_KEYS = ["proponentType", "proponent", "type", "kind", "proponentKind"];
  const PROPOSAL_ORG_KEYS = ["organization", "org", "organizationId", "orgId", "organizationName", "organizationLegalName"];
  const PROPOSAL_FILE_KEYS = ["attachments", "attachment", "files", "file"];
  // Said about a file beside its name, read by the chooser along with it.
  const PROPOSAL_FILE_DETAIL = ["content", "contents", "bytes", "size", "sizeBytes", "mimeType"];

  // The labels of the fields a test gave a value for, empty values included: a field the test
  // named is left exactly as the test left it, never filled in on its behalf.
  const proposalNamed = new Set<string>();
  // Set when the organization a test named is not among those the chooser offers, so none is
  // picked in its place.
  let proposalOrganizationWithheld = false;
  // The terms a test has agreed to; the dialog unticks them when it closes, so they are ticked
  // again whenever it opens.
  const proposalTermsAgreed = new Set<"program" | "app">();
  // What the form said when it last refused a submit, as the alert's lines.
  let proposalRefusal: string[] = [];
  const PROGRAM_TERMS = /^\s*i accept the code with us terms/i;
  const APP_TERMS = /^\s*i accept the digital marketplace terms/i;

  const proposalMain = (): Locator => page.getByRole("main");
  const proposalBox = (label: RegExp): Locator => seen(proposalMain().getByRole("textbox", { name: label })).first();
  const proposalActions = (): Locator => seen(proposalMain().getByRole("group", { name: /^\s*proposal actions\s*$/i })).first();
  const saveChoices = (): Locator => seen(proposalMain().getByRole("group", { name: /^\s*save choices\s*$/i })).first();

  // The form's fields are on screen and can be typed in: the create form, or the proposal's
  // screen once "Edit" is pressed.
  async function proposalFieldsOpen(): Promise<boolean> {
    const box = proposalBox(/^\s*proposal\s*\(/i);
    return (await box.count()) > 0 && (await box.isEditable().catch(() => false));
  }

  // Where the browser stands, for an action: on the form or the proposal's screen (true), or
  // refused — "Page not found" for somebody who may not have it, which is recorded and left
  // for the test's own reading — (false). An address that hands off elsewhere is unbound.
  async function onProposal(where: string): Promise<boolean> {
    await ready();
    const why = await whyNotHere();
    if (!why) return true;
    if (/not found/i.test(why)) {
      noteRefusal(`${where} — ${page.url()} answered ${actingId()} with ${why.replace(/\n+/g, " ")}`);
      return false;
    }
    unbound(where, `the proposal screen did not open at ${page.url()} for ${actingId()}: ${why.replace(/\n+/g, " ")}`);
  }

  // The same, for a reading: "" when the screen refused this person.
  async function proposalShown(): Promise<boolean> {
    await ready();
    return !(await whyNotHere());
  }

  // The fields opened for typing: already open, or opened with the screen's "Edit". A screen
  // offering no "Edit" in its state is the page withholding the change, recorded and left.
  async function openProposalFields(where: string): Promise<boolean> {
    if (!(await onProposal(where))) return false;
    if (await proposalFieldsOpen()) return true;
    const edit = seen(proposalActions().getByRole("button", { name: /^\s*edit\s*$/i })).first();
    if (!(await edit.count())) {
      noteRefusal(`${where} — ${page.url()} offers no "Edit" (its actions: ${(await proposalActionNames()) || "none"})`);
      return false;
    }
    await edit.click();
    await proposalBox(/^\s*proposal\s*\(/i).waitFor({ state: "visible", timeout: 10000 }).catch(() => undefined);
    await settle();
    return proposalFieldsOpen();
  }

  async function proposalActionNames(): Promise<string> {
    const group = (await proposalActions().count()) ? proposalActions() : saveChoices();
    if (!(await group.count())) return "";
    return (await seen(group.getByRole("button")).allInnerTexts()).map((one) => one.trim()).filter(Boolean).join("\n");
  }

  // The organization a test names, as the chooser shows it: by its seed handle
  // ("qualified", "organizations.qualified"), its identifier, its record, or its legal name.
  function proposalOrganizationName(value: unknown): string {
    const groups = seedGroups.organizations as unknown as Record<string, { id?: unknown; legal_name?: unknown }> | undefined;
    const byKey = (key: string): string => {
      const handle = key.startsWith("organizations.") ? key.slice("organizations.".length) : key;
      const found = groups?.[handle] ?? Object.values(groups ?? {}).find((one) => String(one.id) === key);
      return typeof found?.legal_name === "string" ? found.legal_name : "";
    };
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const named = field(value, "legal_name", "legalName", "name", "organizationName");
      if (named) return named;
      const id = field(value, "id");
      return id ? byKey(id) || id : "";
    }
    const text = textOf(value).trim();
    return text ? byKey(text) || text : "";
  }

  // "An individual" or "An organization", by the label the radio is drawn under.
  async function chooseProponent(where: string, kind: "individual" | "organization"): Promise<void> {
    const words = kind === "organization" ? "An organization" : "An individual";
    const radio = seen(proposalMain().getByRole("radio", { name: new RegExp(`^\\s*${words}\\s*$`, "i") })).first();
    if (!(await radio.count())) {
      unbound(where, `no "${words}" choice under "Who is submitting this proposal?" on ${page.url()}; it offers ${await offered()}`);
    }
    if (await radio.isChecked()) return;
    if (await isDisabled(radio)) throw new Error(`${where} — the "${words}" choice is disabled on ${page.url()}`);
    await seen(proposalMain().getByRole("radiogroup").getByText(words, { exact: true })).first().click();
    await settle();
    if (!(await radio.isChecked())) await radio.check({ force: true }).catch(() => undefined);
  }

  // The "Organization (required)" chooser, shown once "An organization" is chosen. An
  // organization it does not offer (one archived, one the vendor does not own) is left
  // unchosen, never replaced by another: the refusal the test goes on to read.
  async function chooseProposalOrg(where: string, value: unknown): Promise<void> {
    const name = proposalOrganizationName(value);
    proposalNamed.add("organization");
    const chooser = seen(proposalMain().getByRole("button", { name: /organization\s*\(required\)/i })).first();
    if (!(await chooser.count())) {
      unbound(where, `chose "An organization" but no "Organization" chooser appeared on ${page.url()}; it offers ${await offered()}`);
    }
    if (!name) return;
    await chooser.click();
    const options = seen(page.getByRole("option"));
    await options.first().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    const option = seen(page.getByRole("option", { name, exact: true })).first();
    if (!(await option.count())) {
      const listed = (await options.allInnerTexts().catch(() => [] as string[])).map((one) => one.trim());
      await page.keyboard.press("Escape").catch(() => undefined);
      proposalOrganizationWithheld = true;
      noteRefusal(`${where} — the "Organization" chooser on ${page.url()} does not offer "${name}" (it offers: ${listed.join(", ") || "nothing"})`);
      return;
    }
    proposalOrganizationWithheld = false;
    await option.click();
    await settle();
  }

  // A test's values one field at a time; a group of them ({ address: { city } }) is entered
  // field by field.
  function proposalEntries(input: unknown): [string, unknown][] {
    const out: [string, unknown][] = [];
    const kept = [...PROPOSAL_ORG_KEYS, ...PROPOSAL_FILE_KEYS].map(squash);
    for (const [key, value] of Object.entries(record(input))) {
      if (value === undefined) continue;
      const nested = value !== null && typeof value === "object" && !Array.isArray(value);
      if (nested && !kept.includes(squash(key))) out.push(...proposalEntries(value));
      else out.push([key, value]);
    }
    return out;
  }

  // Every value the test gave, entered before anything is pressed: the kind of proponent
  // first (it decides which fields are shown), then the organization, the fields by their
  // labels, and the files. A key no field takes is named, never dropped.
  async function fillProposal(where: string, input: unknown): Promise<void> {
    if (input === undefined || input === null) return;
    if (typeof input !== "object" || Array.isArray(input)) {
      unbound(where, `the input ${JSON.stringify(input)} names no field of the proposal form`);
    }
    let kind = "";
    let organization: unknown;
    const files: unknown[] = [];
    const rest: [string, unknown][] = [];
    for (const [key, value] of proposalEntries(input)) {
      const k = squash(key);
      if (PROPONENT_KEYS.map(squash).includes(k)) kind = textOf(value);
      else if (PROPOSAL_ORG_KEYS.map(squash).includes(k)) organization = value;
      else if (PROPOSAL_FILE_KEYS.map(squash).includes(k)) {
        // One file named beside what is said about it ({ file, content }) is offered whole.
        if (!Array.isArray(value) && typeof value !== "object") files.push(input);
        else files.push(...[value].flat());
      } else if (!PROPOSAL_FILE_DETAIL.map(squash).includes(k)) rest.push([key, value]);
    }
    if (organization !== undefined && !kind) kind = "organization";
    if (kind) await chooseProponent(where, /org/i.test(kind) ? "organization" : "individual");
    if (organization !== undefined) await chooseProposalOrg(where, organization);
    for (const [key, value] of rest) {
      const slot = PROPOSAL_FIELDS.find(([, keys]) => keys.map(squash).includes(squash(key)));
      const label = slot ? slot[0] : labelFor(key);
      const box = proposalBox(label);
      if (!(await box.count())) {
        unbound(where, `no field on ${page.url()} takes "${key}" (looked for one labelled ${label}); it offers ${await offered()}`);
      }
      if (!(await box.isEditable().catch(() => false))) throw new Error(`${where} — the field for "${key}" is read-only on ${page.url()}`);
      await box.fill(textOf(value));
      proposalNamed.add(String(label));
    }
    await page.keyboard.press("Tab").catch(() => undefined);
    for (const file of files) await addAttachmentFile(where, file);
    await settle();
  }

  // A test hands an action only the values its criterion is about; every other required
  // field is given something valid, so the form will submit on what the test did give. A
  // field the test named, even as empty, is never touched; nor is one already filled.
  async function completeProposal(): Promise<void> {
    const boxes = seen(proposalMain().getByRole("textbox", { name: /\(required\)/i }));
    for (let i = 0; i < (await boxes.count()); i++) {
      const box = boxes.nth(i);
      if (!(await box.isEditable().catch(() => false))) continue;
      if ((await box.inputValue().catch(() => "x")).trim()) continue;
      const name = await box
        .evaluate((element) => ((element as HTMLInputElement).labels?.[0]?.innerText ?? element.getAttribute("aria-label") ?? "").trim())
        .catch(() => "");
      const slot = PROPOSAL_FIELDS.find(([label]) => label.test(name));
      if (slot && proposalNamed.has(String(slot[0]))) continue;
      await box.fill(proposalPlaceholder(name));
    }
    const chooser = seen(proposalMain().getByRole("button", { name: /organization\s*\(required\)/i })).first();
    if (
      (await chooser.count()) &&
      !proposalNamed.has("organization") &&
      !proposalOrganizationWithheld &&
      /select an item/i.test(await chooser.innerText().catch(() => ""))
    ) {
      await chooser.click();
      const first = seen(page.getByRole("option")).first();
      await first.waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
      if (await first.count()) await first.click();
      else await page.keyboard.press("Escape").catch(() => undefined);
    }
    await settle();
  }

  function proposalPlaceholder(label: string): string {
    const words = label.toLowerCase();
    if (/email/.test(words)) return "adapter.proponent@example.test";
    if (/postal/.test(words)) return "V8W 9V1";
    if (/country/.test(words)) return "Canada";
    if (/province|state/.test(words)) return "BC";
    if (/city/.test(words)) return "Victoria";
    if (/street/.test(words)) return "501 Belleville Street";
    if (/phone/.test(words)) return "250-555-0100";
    if (/legal name/.test(words)) return "Adapter Proponent";
    return "Entered by the acceptance adapter so the proposal can be submitted.";
  }

  // The lines of the form's refusal alert ("This proposal has N problems", then "<Field>:
  // <message>" each), on the screen now.
  async function proposalAlertLines(): Promise<string[]> {
    const alerts = seen(proposalMain().getByRole("alert"));
    const out: string[] = [];
    for (let i = 0; i < (await alerts.count()); i++) out.push(...lined(await alerts.nth(i).innerText().catch(() => "")));
    return out;
  }

  // The terms dialog open, with the terms already agreed to ticked; false when the form
  // refused what it holds (the refusal is kept for the readers). A refusal over required
  // fields the test never named is answered by filling those in and asking again.
  async function openProposalTerms(where: string): Promise<boolean> {
    if (await dialogShown(300)) return tickAgreedTerms();
    if (!(await onProposal(where))) return false;
    const ask = async (): Promise<boolean> => {
      const submit = seen(proposalMain().getByRole("button", { name: /^\s*(submit proposal|save changes and submit)\s*$/i })).first();
      if (!(await submit.count())) {
        unbound(where, `no "Submit proposal" on ${page.url()}; it offers ${await offered()}`);
      }
      if (await isDisabled(submit)) throw new Error(`${where} — "Submit proposal" is disabled on ${page.url()}`);
      await submit.click();
      const deadline = Date.now() + 10000;
      while (Date.now() < deadline) {
        if (await openDialog().count()) break;
        if ((await proposalAlertLines()).length) break;
        await page.waitForTimeout(200);
      }
      return dialogShown(500);
    };
    if (await ask()) return tickAgreedTerms();
    if (await proposalFieldsOpen()) {
      await completeProposal();
      if (await ask()) return tickAgreedTerms();
    }
    proposalRefusal = await proposalAlertLines();
    noteRefusal(`${where} — the form on ${page.url()} refused to submit: ${proposalRefusal.join(" | ") || "it raised no terms dialog"}`);
    return false;
  }

  async function tickAgreedTerms(): Promise<boolean> {
    const box = openDialog().first();
    for (const which of proposalTermsAgreed) {
      const tick = seen(box.getByRole("checkbox", { name: which === "program" ? PROGRAM_TERMS : APP_TERMS })).first();
      if ((await tick.count()) && !(await tick.isChecked())) await tick.check();
    }
    return true;
  }

  async function agreeToTerms(where: string, which: "program" | "app"): Promise<void> {
    proposalTermsAgreed.add(which);
    if (!(await openProposalTerms(where))) return;
    const tick = seen(openDialog().first().getByRole("checkbox", { name: which === "program" ? PROGRAM_TERMS : APP_TERMS })).first();
    if (!(await tick.count())) {
      unbound(where, `the "Submit your proposal" dialog on ${page.url()} has no box accepting the ${which === "program" ? "Code With Us" : "Digital Marketplace"} terms; it reads: ${(await openDialog().first().innerText()).replace(/\s+/g, " ")}`);
    }
    if (!(await tick.isChecked())) await tick.check();
    // Put away so the form behind it can be reached again; the submit reopens and reticks it.
    await closeDialog();
  }

  // The dialog's own "Submit proposal", pressed once the boxes agreed to are ticked. Disabled,
  // it names the boxes left unticked, so a submit without the terms fails on that.
  async function confirmProposalSubmit(where: string): Promise<void> {
    const box = openDialog().first();
    const confirm = seen(box.getByRole("button", { name: /^\s*submit( proposal)?\s*$/i })).first();
    if (!(await confirm.count())) unbound(where, `the "Submit your proposal" dialog on ${page.url()} offers no "Submit proposal"`);
    if (await isDisabled(confirm)) {
      const unticked: string[] = [];
      const ticks = seen(box.getByRole("checkbox"));
      for (let i = 0; i < (await ticks.count()); i++) {
        if (!(await ticks.nth(i).isChecked())) unticked.push(((await ticks.nth(i).getAttribute("aria-label")) ?? "") || `box ${i + 1}`);
      }
      throw new Error(`${where} — "Submit proposal" in the terms dialog is disabled on ${page.url()}; the terms were not all accepted${unticked.length ? ` (${unticked.join(" | ")})` : ""}`);
    }
    await confirm.click();
    await openDialog().first().waitFor({ state: "hidden", timeout: 15000 }).catch(() => undefined);
    await landOnProposal();
    proposalTermsAgreed.clear();
  }

  // A save or a submit lands on the proposal's own screen, or stays where it was under an
  // alert; either ends the wait.
  async function landOnProposal(): Promise<void> {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      const path = new URL(page.url()).pathname;
      if (/\/proposals\/[0-9a-f-]{36}\/edit$/i.test(path) && !(await openDialog().count())) {
        const said = await seen(proposalMain().getByRole("status")).allInnerTexts().catch(() => [] as string[]);
        if (said.some((one) => one.trim()) || !(await proposalFieldsOpen())) break;
      }
      if ((await proposalAlertLines()).length) break;
      await page.waitForTimeout(250);
    }
    await ready();
  }

  // A fresh visit to a proposal's address forgets what the last one entered or agreed to.
  function forgetProposalForm(): void {
    proposalNamed.clear();
    proposalTermsAgreed.clear();
    proposalRefusal = [];
    proposalOrganizationWithheld = false;
  }

  // Entered into the form, opening it with "Edit" on the proposal's screen where needed.
  async function enterProposal(where: string, input: unknown): Promise<boolean> {
    const values = proposalEntries(input).length > 0;
    if (!values) return onProposal(where);
    proposalRefusal = [];
    await closeDialog();
    if (!(await openProposalFields(where))) return false;
    await fillProposal(where, input);
    return true;
  }

  // The proposal's terms (Status, Proposal ID, …): the words of the definition beside one.
  async function proposalTerm(label: RegExp): Promise<string> {
    if (!(await proposalShown())) return "";
    // Every term on these screens carries exactly one definition, so they pair by position.
    const names = (await seen(proposalMain().getByRole("term")).allInnerTexts()).map((one) => one.trim());
    const values = (await seen(proposalMain().getByRole("definition")).allInnerTexts()).map((one) => one.trim());
    const at = names.findIndex((name) => label.test(name));
    return at >= 0 && names.length === values.length ? values[at] : "";
  }

  const proposalPathId = (): string => /\/proposals\/([0-9a-f-]{36})(?:\/|$)/i.exec(new URL(page.url()).pathname)?.[1] ?? "";
  const opportunityPathId = (): string => /^\/opportunities\/[a-z-]+\/([0-9a-f-]{36})/i.exec(new URL(page.url()).pathname)?.[1] ?? "";

  // A control of the screen's "Proposal actions", confirmed in the dialog it raises. Not
  // offered in the proposal's state, it is the page withholding it: recorded and left.
  async function proposalAction(where: string, name: RegExp, confirm: RegExp | null): Promise<boolean> {
    if (!(await onProposal(where))) return false;
    await closeDialog();
    const control = seen(proposalActions().getByRole("button", { name })).first();
    if (!(await control.count())) {
      noteRefusal(`${where} — ${page.url()} (Status: ${(await proposalTerm(/^status$/i)) || "not shown"}) does not offer ${name}; its actions: ${(await proposalActionNames()) || "none"}`);
      return false;
    }
    if (await isDisabled(control)) throw new Error(`${where} — the control named ${name} is disabled on ${page.url()}`);
    await control.click();
    if (confirm) {
      if (await dialogShown()) await pressInDialog(where, confirm);
    }
    await settle();
    return true;
  }

  async function proposalSubmit(where: string, input: unknown): Promise<void> {
    if (!(await enterProposal(where, input))) return;
    if (!(await openProposalTerms(where))) return;
    await confirmProposalSubmit(where);
  }

  // What the form says against its fields: the alert and each field's own message, with what
  // it said when it last refused a submit.
  async function proposalFieldMessages(): Promise<string> {
    if (!(await proposalShown())) return "";
    if (await openDialog().count()) return lined(await openDialog().first().innerText()).filter((line) => /tick|accept/i.test(line) && !/^\s*i accept/i.test(line)).join("\n");
    const found = lined(await formMessages());
    for (const line of proposalRefusal) if (!found.includes(line)) found.push(line);
    return found.join("\n");
  }

  const proposalCwuCreate: S.ProposalCwuCreatePage = {
    open: async (params) => {
      forgetProposalForm();
      await go("/opportunities/code-with-us/:opportunityId/proposals/create", params as unknown as Record<string, string>);
      await ready();
    },
    // Choosing to answer as an individual shows the individual's own details, which are
    // entered from the input; every other required field is then given something valid.
    chooseProponentIndividual: async (input) => {
      const where = `${PCWU_CREATE}.choose_proponent_individual`;
      if (!(await openProposalFields(where))) return;
      await chooseProponent(where, "individual");
      await fillProposal(where, input);
      await completeProposal();
    },
    chooseProponentOrganization: async (input) => {
      const where = `${PCWU_CREATE}.choose_proponent_organization`;
      if (!(await openProposalFields(where))) return;
      await chooseProponent(where, "organization");
      const named = typeof input === "string" ? input : given(input, PROPOSAL_ORG_KEYS);
      if (named !== undefined) await chooseProposalOrg(where, named);
      const rest = Object.fromEntries(Object.entries(record(input)).filter(([key]) => !PROPOSAL_ORG_KEYS.map(squash).includes(squash(key))));
      await fillProposal(where, rest);
    },
    addAttachment: async (input) => {
      const where = `${PCWU_CREATE}.add_attachment`;
      await closeDialog();
      if (!(await openProposalFields(where))) return;
      await addAttachmentFile(where, input);
    },
    saveDraft: async (input) => {
      const where = `${PCWU_CREATE}.save_draft`;
      if (!(await enterProposal(where, input))) return;
      await closeDialog();
      const save = seen(proposalMain().getByRole("button", { name: /^\s*(save draft|save changes)\s*$/i })).first();
      if (!(await save.count())) {
        noteRefusal(`${where} — ${page.url()} offers no "Save draft" (its actions: ${(await proposalActionNames()) || "none"})`);
        return;
      }
      if (await isDisabled(save)) throw new Error(`${where} — "Save draft" is disabled on ${page.url()}`);
      await save.click();
      await landOnProposal();
    },
    submitProposal: (input) => proposalSubmit(`${PCWU_CREATE}.submit_proposal`, input),
    acceptProgramTerms: async (input) => {
      const where = `${PCWU_CREATE}.accept_program_terms`;
      if (!(await enterProposal(where, input))) return;
      await agreeToTerms(where, "program");
    },
    acceptAppTerms: async (input) => {
      const where = `${PCWU_CREATE}.accept_app_terms`;
      if (!(await enterProposal(where, input))) return;
      await agreeToTerms(where, "app");
    },
    cancel: async () => {
      const where = `${PCWU_CREATE}.cancel`;
      await closeDialog();
      if (!(await onProposal(where))) return;
      const group = (await proposalActions().count()) ? proposalActions() : saveChoices();
      await press(where, /^\s*cancel\s*$/i, group);
    },
    fieldError: () => proposalFieldMessages(),
    // Each refusal as "<Field>: <message>", the way the form's alert lists them.
    fieldErrorsByField: async () => {
      if (!(await proposalShown())) return "";
      const found = (await proposalAlertLines()).filter((line) => /^[^:]{1,60}:\s+\S/.test(line));
      for (const line of proposalRefusal) if (/^[^:]{1,60}:\s+\S/.test(line) && !found.includes(line)) found.push(line);
      return found.join("\n");
    },
    // The form's "The opportunity" region: the opportunity, its reward and its deadline.
    opportunitySummary: async () => {
      if (!(await proposalShown())) return "";
      const region = seen(proposalMain().getByRole("region", { name: /^\s*the opportunity\s*$/i })).first();
      if (!(await region.count())) {
        unbound(`${PCWU_CREATE}.opportunity_summary`, `no "The opportunity" part on ${page.url()}; it offers ${await offered()}`);
      }
      return lined(await region.innerText()).join("\n");
    },
    termsModal: async () => {
      const where = `${PCWU_CREATE}.terms_modal`;
      if (!(await openProposalTerms(where))) {
        unbound(where, `the form on ${page.url()} refused to submit, so no terms dialog could be opened: ${proposalRefusal.join(" | ") || "it raised none"}`);
      }
      return (await openDialog().first().innerText()).trim();
    },
    submitDisabledUntilTermsAccepted: async () => {
      const where = `${PCWU_CREATE}.submit_disabled_until_terms_accepted`;
      if (!(await openProposalTerms(where))) {
        unbound(where, `the form on ${page.url()} refused to submit, so no terms dialog could be opened: ${proposalRefusal.join(" | ") || "it raised none"}`);
      }
      const confirm = seen(openDialog().first().getByRole("button", { name: /^\s*submit( proposal)?\s*$/i })).first();
      if (!(await confirm.count())) return "absent";
      return (await isDisabled(confirm)) ? "disabled" : "enabled";
    },
  };

  const proposalCwuEdit: S.ProposalCwuEditPage = {
    open: async (params) => {
      forgetProposalForm();
      await go("/opportunities/code-with-us/:opportunityId/proposals/:proposalId/edit", params as unknown as Record<string, string>);
      await ready();
    },
    startEditing: async () => {
      await openProposalFields(`${PCWU_EDIT}.start_editing`);
    },
    saveChanges: async (input) => {
      const where = `${PCWU_EDIT}.save_changes`;
      if (!(await openProposalFields(where))) return;
      await fillProposal(where, input);
      await press(where, /^\s*save changes\s*$/i, saveChoices());
      await landOnProposal();
    },
    saveChangesAndSubmit: async (input) => {
      const where = `${PCWU_EDIT}.save_changes_and_submit`;
      if (!(await openProposalFields(where))) return;
      await fillProposal(where, input);
      // Saving and submitting accepts both sets of terms in the dialog it raises.
      proposalTermsAgreed.add("program");
      proposalTermsAgreed.add("app");
      if (!(await openProposalTerms(where))) return;
      await confirmProposalSubmit(where);
    },
    submitProposal: async () => {
      const where = `${PCWU_EDIT}.submit_proposal`;
      if (!(await onProposal(where))) return;
      if (!(await proposalFieldsOpen()) && !(await seen(proposalActions().getByRole("button", { name: /^\s*submit proposal\s*$/i })).count())) {
        noteRefusal(`${where} — ${page.url()} (Status: ${(await proposalTerm(/^status$/i)) || "not shown"}) does not offer "Submit proposal"; its actions: ${(await proposalActionNames()) || "none"}`);
        return;
      }
      proposalTermsAgreed.add("program");
      proposalTermsAgreed.add("app");
      if (!(await openProposalTerms(where))) return;
      await confirmProposalSubmit(where);
    },
    withdrawProposal: async () => {
      await proposalAction(`${PCWU_EDIT}.withdraw_proposal`, /^\s*withdraw\s*$/i, /^\s*withdraw( proposal)?\s*$/i);
    },
    deleteProposal: async () => {
      await proposalAction(`${PCWU_EDIT}.delete_proposal`, /^\s*delete\s*$/i, /^\s*delete( proposal)?\s*$/i);
    },
    addAttachment: async (input) => {
      const where = `${PCWU_EDIT}.add_attachment`;
      if (!(await openProposalFields(where))) return;
      await addAttachmentFile(where, input);
    },
    // "Remove <name>" beside an attachment, with the fields open; kept once the form is saved.
    removeAttachment: async (input) => {
      const where = `${PCWU_EDIT}.remove_attachment`;
      if (!(await openProposalFields(where))) return;
      const region = attachmentRegion();
      const row = await rowNamed(region, input, () => true);
      if (!row) {
        unbound(where, `no attachment on ${page.url()} matches ${JSON.stringify(input)}; the list reads: ${(await rowLines(await itemsMatching(region, () => true))) || "nothing"}`);
      }
      await press(where, /^\s*remove\b/i, row);
    },
    proposalIdentifier: async () => ((await proposalShown()) ? (await proposalTerm(/^proposal id$/i)) || proposalPathId() : ""),
    opportunityIdentifier: async () =>
      ((await proposalShown()) ? (await proposalTerm(/^opportunity id$/i)) || opportunityPathId() : ""),
    // The "Proposal" section: the proponent, the proposal's text, comments and attachments,
    // with what each box holds while the fields are open.
    proposalTab: async () => {
      if (!(await proposalShown())) return "";
      const link = seen(proposalMain().getByRole("navigation", { name: /proposal sections/i }).getByRole("link", { name: /^\s*proposal\s*$/i })).first();
      if ((await link.count()) && /tab=(?!proposal)/.test(new URL(page.url()).search)) {
        await link.click();
        await ready();
      }
      const region = seen(proposalMain().getByRole("region", { name: /^\s*proposal\s*$/i })).first();
      if (!(await region.count())) {
        unbound(`${PCWU_EDIT}.proposal_tab`, `no "Proposal" section on ${page.url()}; it offers ${await offered()}`);
      }
      const lines = lined(await region.innerText());
      const boxes = seen(region.getByRole("textbox"));
      for (let i = 0; i < (await boxes.count()); i++) {
        const value = (await boxes.nth(i).inputValue().catch(() => "")).trim();
        if (value && !lines.includes(value)) lines.push(value);
      }
      return lines.join("\n");
    },
    status: () => proposalTerm(/^status$/i),
    submittedAt: () => proposalTerm(/^submitted( on| at)?$/i),
    // The vendor's screen shows no score or rank in any state walked (draft, submitted,
    // withdrawn); none shown reads as nothing.
    score: () => proposalTerm(/^(total )?score$/i),
    rank: () => proposalTerm(/^rank(ing)?$/i),
    availableActions: async () => ((await proposalShown()) ? proposalActionNames() : ""),
  };

  // ---------------------------------------------------------------- a Code With Us proposal, as staff read it
  //
  // /opportunities/code-with-us/:opportunityId/proposals/:proposalId, walked on the current
  // build as the administrator on the seeded Code With Us proposals submitted (on the lapsed
  // opportunities for scoring, with three proposals, at the final stage and for an award),
  // withdrawn, evaluated in processing (...a007...101, "82%") and awarded / not awarded
  // (...a008...), as the public sector employee on ...a007...101, and as the proposal's own
  // vendor on ...a003...101: "Code With Us proposal" over the proponent's name (the level-1
  // heading), the terms Opportunity (a link), Status, Submitted and Proposal ID, a "Score"
  // region with the term Score ("82%", or "Not yet scored"), the link "Printable copy" to
  // .../export, and under the navigation "Proposal sections" the links Proposal (?tab=proposal:
  // the regions Proponent — Proponent type, Organization —, Proposal text, Additional comments
  // and Attachments) and History (?tab=history: the table "Every change of state and every
  // score entered, newest first", Date | Entry | By | Note). The vendor is also offered
  // "Manage this proposal". In no state walked is there a button of any kind: no score to
  // enter, no award, no disqualification, and no rank anywhere.
  const PCWU_VIEW = "proposal-cwu-view";
  const PCWU_VIEW_ROUTE = "/opportunities/code-with-us/:opportunityId/proposals/:proposalId";
  const PCWU_VIEW_WALKED =
    'walked on the current build as the administrator on the seeded Code With Us proposals submitted (...a002...101, ...a003...101, ...a004...101, ...a005...101), withdrawn (...a005...103), evaluated in processing (...a007...101 at 82%, ...a007...102 at 74%) and awarded / not awarded (...a008...101 at 91%, ...a008...102 at 77%), and as the public sector employee on ...a007...101: the screen draws the terms Opportunity, Status, Submitted and Proposal ID, the Score region, "Printable copy" and the sections Proposal and History, and no button of any kind; the opportunity\'s management screen offers, in its "Proposals" section, only the table Proponent | Status | Submitted';
  // A control the screen has never been seen to offer: unbound, saying what is there. Should
  // the screen one day offer it, that is said too, so the next binding run binds it.
  async function cwuViewLacks(member: string, name: RegExp, what: string): Promise<never> {
    const where = `${PCWU_VIEW}.${member}`;
    await ready();
    const why = await whyNotHere();
    if (why) unbound(where, `the proposal's screen did not open at ${page.url()} for ${actingId()}: ${why.replace(/\n+/g, " ")}; ${PCWU_VIEW_WALKED}`);
    const offeredNow = seen(page.getByRole("main").getByRole("button", { name }).or(page.getByRole("main").getByRole("link", { name })));
    if (await offeredNow.count()) {
      unbound(where, `${page.url()} now offers ${actingId()} a control named ${name}, which this binding has not seen; the next binding run binds it (${PCWU_VIEW_WALKED})`);
    }
    return unbound(where, `the Code With Us proposal's screen offers no ${what}: ${PCWU_VIEW_WALKED}; on ${page.url()} as ${actingId()} it offers ${await offered()}`);
  }
  // One of the screen's sections, opened from "Proposal sections", read whole.
  async function cwuViewSection(name: RegExp): Promise<string> {
    if (!(await proposalShown())) return "";
    const link = seen(proposalMain().getByRole("navigation", { name: /proposal sections/i }).getByRole("link", { name })).first();
    if (!(await link.count())) return "";
    const href = (await link.getAttribute("href")) ?? "";
    const wanted = /[?&]tab=([^&#]+)/.exec(href)?.[1] ?? "";
    if (!wanted || new URL(page.url()).searchParams.get("tab") !== wanted) {
      await link.click();
      await ready();
    }
    const region = seen(regionNamed(proposalMain(), name)).first();
    await region.waitFor({ state: "visible", timeout: 10000 }).catch(() => undefined);
    return (await region.count()) ? lined(await region.innerText()).join("\n") : "";
  }
  const proposalCwuView: S.ProposalCwuViewPage = {
    open: async (params) => {
      await go(PCWU_VIEW_ROUTE, params as unknown as Record<string, string>);
      await ready();
    },
    enterScore: () => cwuViewLacks("enter_score", /^\s*(enter|edit) score\s*$/i, '"Enter score" control'),
    awardProposal: () => cwuViewLacks("award_proposal", /^\s*award( proposal| opportunity)?\s*$/i, '"Award" control'),
    disqualifyProposal: () => cwuViewLacks("disqualify_proposal", /^\s*disqualify( proposal)?\s*$/i, '"Disqualify" control'),
    proposalIdentifier: async () => ((await proposalShown()) ? (await proposalTerm(/^proposal id$/i)) || proposalPathId() : ""),
    // The "Proposal" section: Proponent (type and organization or name), Proposal text,
    // Additional comments, Attachments.
    proposalTab: () => cwuViewSection(/^\s*proposal\s*$/i),
    // The "History" section: its caption and table, one line per row, cells tab-separated as
    // the screen draws them.
    historyTab: () => cwuViewSection(/^\s*history\s*$/i),
    // The name the screen gives the proponent: its level-1 heading.
    proponent: async () => {
      if (!(await proposalShown())) return "";
      const heading = seen(proposalMain().getByRole("heading", { level: 1 })).first();
      return (await heading.count()) ? (await heading.innerText()).trim() : "";
    },
    // The Score term as shown: "82%", or "Not yet scored".
    score: () => proposalTerm(/^score$/i),
    rank: async () => {
      if (!(await proposalShown())) return "";
      const shown = await proposalTerm(/^rank(ing)?$/i);
      if (shown) return shown;
      return unbound(`${PCWU_VIEW}.rank`, `the Code With Us proposal's screen shows no rank or ranking: ${PCWU_VIEW_WALKED}`);
    },
    // "Printable copy", a link: "enabled" while the screen offers it, "absent" when it does not.
    exportLink: async () => {
      if (!(await proposalShown())) return "absent";
      const link = seen(proposalMain().getByRole("link", { name: /^\s*(printable copy|export( proposal)?)\s*$/i })).first();
      if (!(await link.count())) return "absent";
      return (await isDisabled(link)) ? "disabled" : "enabled";
    },
  };

  // ---------------------------------------------------------------- a Sprint With Us or Team With Us proposal, as staff read it
  //
  // /opportunities/{sprint,team}-with-us/:opportunityId/proposals/:proposalId, reached from
  // each proponent's link in the Proposals section of the opportunity's management screen
  // (edit?tab=proposals). Walked on the current build as the administrator on the seeded
  // Sprint With Us proposal at the team scenario (...a016...101, "Evaluated: team scenario")
  // and the seeded Team With Us proposals at the challenge (...a032...101 and ...102): "Sprint
  // With Us proposal" / "Team With Us proposal" over the proponent's name (the level-1
  // heading), the terms Opportunity (a link), Status, Submitted and Proposal ID, the link
  // "Printable copy" to .../export, and under the navigation "Proposal sections" the links
  // Proposal (?tab=proposal: the regions Organization, Team, Team questions / Resource
  // questions, References and Attachments) and History (?tab=history: the table "Every change
  // of state and every score entered, newest first", Date | Entry | By | Note). There is no
  // button of any kind, no stage tab (team questions, code challenge, team scenario, resource
  // questions, challenge), no score and no rank, though the seeded proposals hold scores.
  function teamViewWalked(program: string): string {
    const seeded = program === "sprint-with-us" ? "...a016...101 (scored on the code challenge and the team scenario)" : "...a032...101 (scored on the challenge) and ...a032...102";
    return `walked on the current build as the administrator, from the proponent links of the opportunity's Proposals section, on the seeded ${program} proposal(s) ${seeded}: the screen draws the terms Opportunity, Status, Submitted and Proposal ID, "Printable copy", the sections Proposal and History, and no button, stage tab, score or rank`;
  }
  // A control or reading the screen has never been seen to offer: unbound, saying what is
  // there. Should the screen one day offer it, that is said too, so the next run binds it.
  async function teamViewLacks(pageId: string, program: string, member: string, name: RegExp, what: string): Promise<never> {
    const where = `${pageId}.${member}`;
    await ready();
    const why = await whyNotHere();
    if (why) unbound(where, `the proposal's screen did not open at ${page.url()} for ${actingId()}: ${why.replace(/\n+/g, " ")}; ${teamViewWalked(program)}`);
    const main = page.getByRole("main");
    const offeredNow = seen(main.getByRole("button", { name }).or(main.getByRole("link", { name })).or(main.getByRole("term").filter({ hasText: name })));
    if (await offeredNow.count()) {
      unbound(where, `${page.url()} now offers ${actingId()} something named ${name}, which this binding has not seen; the next binding run binds it (${teamViewWalked(program)})`);
    }
    return unbound(where, `the proposal's screen offers no ${what}: ${teamViewWalked(program)}; on ${page.url()} as ${actingId()} it offers ${await offered()}`);
  }
  // The History section's table, one cell list per row (header row left out).
  async function teamViewHistoryRows(): Promise<string[][]> {
    if (!(await cwuViewSection(/^\s*history\s*$/i))) return [];
    const region = seen(regionNamed(proposalMain(), /^\s*history\s*$/i)).first();
    const rows = region.getByRole("row");
    const out: string[][] = [];
    for (let r = 0; r < (await rows.count()); r++) {
      const cells = rows.nth(r).getByRole("cell");
      const count = await cells.count();
      if (!count) continue;
      const texts: string[] = [];
      for (let c = 0; c < count; c++) texts.push((await cells.nth(c).innerText()).replace(/\s*\n\s*/g, " ").trim());
      out.push(texts);
    }
    return out;
  }
  function teamProposalView<T>(
    pageId: string,
    route: string,
    program: string,
    lacking: { member: string; name: RegExp; what: string }[],
  ): T {
    const built: Record<string, unknown> = {
      open: async (params?: Record<string, string>) => {
        await go(route, params as unknown as Record<string, string>);
        await ready();
      },
      proposalIdentifier: async () => ((await proposalShown()) ? (await proposalTerm(/^proposal id$/i)) || proposalPathId() : ""),
      // The "Proposal" section: Organization, Team, the questions and their responses,
      // References and Attachments.
      proposalTab: () => cwuViewSection(/^\s*proposal\s*$/i),
      // The History table's rows, newest first, one per line, cells joined by " | " as the
      // screen orders them (Date | Entry | By | Note).
      historyTab: async () => (await teamViewHistoryRows()).map((cells) => cells.filter(Boolean).join(" | ")).join("\n"),
      // The same rows as entries, newest first: "<kind> | <note> | <who> | <when>", from the
      // Entry, Note, By and Date columns.
      historyEntries: async () =>
        (await teamViewHistoryRows())
          .map(([when = "", kind = "", who = "", note = ""]) => [kind, note.replace(/^[—–-]$/, ""), who, when].join(" | "))
          .join("\n"),
    };
    for (const each of lacking) {
      built[camel(each.member)] = () => teamViewLacks(pageId, program, each.member, each.name, each.what);
    }
    return built as unknown as T;
  }
  const SCORE_LACKS = (stage: string, member: string) => ({ member, name: new RegExp(`^\\s*${stage}( score)?\\s*$`, "i"), what: `${stage} score` });
  const proposalSwuViewBound = teamProposalView<S.ProposalSwuViewPage>(
    "proposal-swu-view",
    "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId",
    "sprint-with-us",
    [
      { member: "score_code_challenge", name: /^\s*(enter|edit) (code challenge )?score\s*$/i, what: "control to enter a code challenge score" },
      { member: "screen_in_to_team_scenario", name: /^\s*screen in\b/i, what: '"Screen in" control' },
      { member: "screen_out_from_team_scenario", name: /^\s*screen out\b/i, what: '"Screen out" control' },
      { member: "score_team_scenario", name: /^\s*(enter|edit) (team scenario )?score\s*$/i, what: "control to enter a team scenario score" },
      { member: "award_proposal", name: /^\s*award( proposal)?\s*$/i, what: '"Award" control' },
      { member: "disqualify_proposal", name: /^\s*disqualify( proposal)?\s*$/i, what: '"Disqualify" control' },
      { member: "team_questions_tab", name: /^\s*team questions\s*$/i, what: '"Team questions" stage section (the Proposal section lists the questions with the responses, and no scores)' },
      { member: "code_challenge_tab", name: /^\s*code challenge\s*$/i, what: '"Code challenge" section' },
      { member: "team_scenario_tab", name: /^\s*team scenario\s*$/i, what: '"Team scenario" section' },
      { member: "wrong_stage_error", name: /^\s*(enter|edit) .*score\s*$/i, what: "score control, so no stage message can be raised from it" },
      SCORE_LACKS("team questions", "questions_score"),
      SCORE_LACKS("code challenge", "challenge_score"),
      SCORE_LACKS("team scenario", "scenario_score"),
      SCORE_LACKS("price", "price_score"),
      SCORE_LACKS("total", "total_score"),
      { member: "rank", name: /^\s*rank(ing)?\s*$/i, what: "rank or ranking" },
      { member: "offered_score_actions", name: /^\s*(enter|edit) .*score\s*$/i, what: "stage tab or score control to read offered score actions from" },
    ],
  );
  const proposalTwuViewBound = teamProposalView<S.ProposalTwuViewPage>(
    "proposal-twu-view",
    "/opportunities/team-with-us/:opportunityId/proposals/:proposalId",
    "team-with-us",
    [
      { member: "score_resource_questions", name: /^\s*(enter|edit) (resource questions? )?score/i, what: "control to enter resource question scores" },
      { member: "screen_in_to_challenge", name: /^\s*screen in\b/i, what: '"Screen in" control' },
      { member: "screen_out_from_challenge", name: /^\s*screen out\b/i, what: '"Screen out" control' },
      { member: "score_challenge", name: /^\s*(enter|edit) (challenge )?score\s*$/i, what: "control to enter a challenge score" },
      { member: "award_proposal", name: /^\s*award( proposal)?\s*$/i, what: '"Award" control' },
      { member: "disqualify_proposal", name: /^\s*disqualify( proposal)?\s*$/i, what: '"Disqualify" control' },
      { member: "resource_questions_tab", name: /^\s*resource questions\s*$/i, what: '"Resource questions" stage section (the Proposal section lists the questions with the responses, and no scores)' },
      { member: "challenge_tab", name: /^\s*(interview\/)?challenge\s*$/i, what: '"Challenge" section' },
      { member: "wrong_stage_error", name: /^\s*(enter|edit) .*score\s*$/i, what: "score control, so no stage message can be raised from it" },
      SCORE_LACKS("resource questions", "questions_score"),
      SCORE_LACKS("challenge", "challenge_score"),
      SCORE_LACKS("price", "price_score"),
      SCORE_LACKS("total", "total_score"),
      { member: "rank", name: /^\s*rank(ing)?\s*$/i, what: "rank or ranking" },
      { member: "offered_score_actions", name: /^\s*(enter|edit) .*score\s*$/i, what: "stage tab or score control to read offered score actions from" },
    ],
  );

  // ---------------------------------------------------------------- Sprint With Us and Team With Us proposals
  //
  // Walked signed in as the organization owner (Northern Pines Digital Ltd. and Salt Marsh Labs
  // Ltd.) on the seeded open Sprint With Us opportunity, and as the owner of the unqualified
  // organization on the seeded closed Team With Us opportunity (the create form is drawn there
  // too; a vendor already holding a proposal is sent to it instead). Both create forms are one
  // page of regions: "The opportunity", "Organization" (an "Organization (required)" chooser
  // over the organizations the vendor owns or administers, and — for one not qualified — a note
  // "<name> is not qualified for <program>"; Team With Us adds "<name> does not provide <service
  // area>, which this opportunity needs."), "Team", "Capabilities" (Sprint With Us), "Cost",
  // "Team questions" / "Resource questions" ("Response to question N (required)"), "References"
  // (Sprint With Us: "Add a reference", each "Reference N" with Name, Email address and Phone
  // number (optional)) and "Attachments", then the "Proposal actions" Cancel, Save draft and
  // Submit proposal.
  //
  // Sprint With Us draws one group per phase the opportunity has ("Implementation phase", and
  // "Prototype phase" / "Inception phase" where it has them): its dates and budget, a paragraph
  // "Incomplete: …" while its team falls short, the list "Capabilities the <phase> phase
  // requires" ("Backend Development: held" / "not held"), the radio group "Scrum master for the
  // <phase> phase" listing each member (a pending one marked "Membership pending") with its
  // "Scrum master: <name>, <phase> phase" radio and "Remove", the chooser "Team member to add to
  // the <phase> phase" (pending people offered as "<name> (pending)") with "Add team member to
  // the <phase> phase", and "Proposed cost for the <phase> phase(required)", whose message
  // ("Please enter a Proposed Cost less than or equal to 500,000.") follows its hint once the
  // cost is over the phase's budget. "Submit proposal" stays disabled while any phase is
  // incomplete or any cost over budget. Team With Us draws one group per resource ("Resource 1:
  // Full stack developer, 100% of full time") with "Team member to add to resource N", "Add team
  // member to resource N", and per member "Hourly rate for <name>(required)" and "Remove".
  //
  // Submitting opens "Submit your proposal" with "I accept the <program> terms and conditions
  // (required)" and "I accept the Digital Marketplace terms and conditions (required)" and its own
  // "Submit proposal"; a refusal before it is the alert "This proposal has N problems" with
  // "<Field>: <message>" lines. Saving lands on the proposal's own screen
  // (…/proposals/:proposalId/edit): Status, Submitted, Proposal ID, Opportunity ID and Proposal
  // deadline as terms, the "Proposal actions" (a draft: Edit, Submit proposal, Delete; a
  // submitted proposal: Edit, Withdraw), the sections "Proposal" and "History", and "Edit" opens
  // the create form's own controls with the "Save choices" Cancel, Save changes and Save changes
  // and submit. A refused submit from there raises the alert "Your proposal was not submitted"
  // with the service's reason ("implementationPhase.members: User is not an active member of the
  // organization."); a refused save "Your changes were not saved".

  const PSWU_CREATE = "proposal-swu-create";
  const PSWU_EDIT = "proposal-swu-edit";
  const PTWU_CREATE = "proposal-twu-create";
  const PTWU_EDIT = "proposal-twu-edit";
  const TEAM_PROGRAM_TERMS = /^\s*i accept the (sprint|team) with us terms/i;
  const TEAM_PHASES = ["inception", "prototype", "implementation"] as const;
  const MEMBER_KEYS = ["members", "member", "teamMembers", "teamMember", "users", "user", "people", "person", "resourceName", "memberName", "name"];

  // What the form said when its submit was last refused or held back, and on which address.
  let teamRefusal: { path: string; lines: string[] } | null = null;
  const teamTermsAgreed = new Set<"program" | "app">();
  let teamOrganizationWithheld = false;
  let lastTeamPhase = "";
  let lastTeamResource = 0;

  function forgetTeamForm(): void {
    teamRefusal = null;
    teamTermsAgreed.clear();
    teamOrganizationWithheld = false;
    lastTeamPhase = "";
    lastTeamResource = 0;
  }

  async function openTeamProposal(route: string, params: unknown): Promise<void> {
    forgetTeamForm();
    await go(route, params as Record<string, string>);
    await ready();
    // The form draws "Loading opportunity…" under its heading until the opportunity is in.
    await seen(page.getByRole("progressbar")).first().waitFor({ state: "hidden", timeout: 15000 }).catch(() => undefined);
    await settle();
  }

  const teamOrgChooser = (): Locator => seen(proposalMain().getByRole("button", { name: /organization\s*\(required\)/i })).first();

  // The form's controls are on screen to be used: the create form, or the proposal's screen
  // once "Edit" is pressed.
  async function teamFieldsOpen(): Promise<boolean> {
    return (await teamOrgChooser().count()) > 0 && !(await isDisabled(teamOrgChooser()));
  }

  async function openTeamFields(where: string): Promise<boolean> {
    if (!(await onProposal(where))) return false;
    if (await teamFieldsOpen()) return true;
    const edit = seen(proposalActions().getByRole("button", { name: /^\s*edit\s*$/i })).first();
    if (!(await edit.count())) {
      noteRefusal(`${where} — ${page.url()} (Status: ${(await proposalTerm(/^status$/i)) || "not shown"}) offers no "Edit" (its actions: ${(await proposalActionNames()) || "none"})`);
      return false;
    }
    await edit.click();
    await teamOrgChooser().waitFor({ state: "visible", timeout: 10000 }).catch(() => undefined);
    await settle();
    return teamFieldsOpen();
  }

  // A chooser drawn as a button that opens a list: the option named, or its pending form
  // ("Quinn Placeholder (pending)"). False, with the list put away, when it is not offered.
  async function pickListed(opener: Locator, name: string): Promise<{ picked: boolean; offered: string[] }> {
    await opener.click();
    const options = seen(page.getByRole("option"));
    await options.first().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    const offered = (await options.allInnerTexts().catch(() => [] as string[])).map((one) => one.trim()).filter(Boolean);
    const wanted = offered.find((one) => squash(one) === squash(name)) ?? offered.find((one) => squash(one) === squash(`${name} (pending)`));
    if (!wanted) {
      await page.keyboard.press("Escape").catch(() => undefined);
      await settle();
      return { picked: false, offered };
    }
    await seen(page.getByRole("option", { name: wanted, exact: true })).first().click();
    await settle();
    return { picked: true, offered };
  }

  // The organization a test names, by seed handle, identifier, record or legal name. One the
  // chooser does not offer is left unchosen — never replaced by another — and recorded: the
  // refusal the test goes on to read.
  async function chooseTeamOrganization(where: string, value: unknown): Promise<void> {
    const chooser = teamOrgChooser();
    if (!(await chooser.count())) unbound(where, `no "Organization (required)" chooser on ${page.url()}; it offers ${await offered()}`);
    const named = typeof value === "string" ? value : given(value, PROPOSAL_ORG_KEYS) ?? value;
    const name = proposalOrganizationName(named);
    if (!name) unbound(where, `the input ${JSON.stringify(value)} names no organization`);
    if (squash(await chooser.innerText().catch(() => "")).startsWith(squash(name))) {
      teamOrganizationWithheld = false;
      return;
    }
    const { picked, offered: listed } = await pickListed(chooser, name);
    teamOrganizationWithheld = !picked;
    if (!picked) noteRefusal(`${where} — the "Organization" chooser on ${page.url()} does not offer "${name}" (it offers: ${listed.join(", ") || "nothing"})`);
  }

  // The team controls show people only once an organization is chosen. When the test chose
  // none, the first the chooser offers is taken; one it named and was refused is never
  // replaced. Resolves whether an organization is chosen.
  async function ensureTeamOrganization(): Promise<boolean> {
    const chooser = teamOrgChooser();
    if (!(await chooser.count())) return true;
    if (!/^\s*select an item/i.test(await chooser.innerText().catch(() => ""))) return true;
    if (teamOrganizationWithheld) return false;
    await chooser.click();
    const first = seen(page.getByRole("option")).first();
    await first.waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    if (!(await first.count())) {
      await page.keyboard.press("Escape").catch(() => undefined);
      return false;
    }
    await first.click();
    await settle();
    return true;
  }

  // "Prototype", "Proof of Concept", "implementation phase" -> the phase's word on this form.
  function phaseWord(value: unknown): string {
    const said = squash(textOf(value)).replace(/phase$/, "");
    if (said === "proofofconcept") return "prototype";
    return TEAM_PHASES.find((one) => one === said) ?? "";
  }
  const phaseTitle = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1);
  // The phases the form draws a group for, in the form's order (inception, prototype,
  // implementation, as it lays them out).
  async function phasesShown(): Promise<string[]> {
    const shown: string[] = [];
    for (const word of TEAM_PHASES) {
      if (await seen(proposalMain().getByRole("group", { name: new RegExp(`^\\s*${word} phase\\s*$`, "i") })).count()) shown.push(word);
    }
    return shown;
  }

  // The phase a test names, else the one last used, else the first the form shows.
  async function phaseGroupFor(where: string, input: unknown): Promise<{ word: string; group: Locator }> {
    const shown = await phasesShown();
    const named = phaseWord(typeof input === "string" && phaseWord(input) ? input : given(input, ["phase", "phaseName"]));
    const word = named || (shown.includes(lastTeamPhase) ? lastTeamPhase : shown[0] ?? "");
    const group = seen(proposalMain().getByRole("group", { name: new RegExp(`^\\s*${word} phase\\s*$`, "i") })).first();
    if (!word || !(await group.count())) {
      unbound(where, `no "${named ? phaseTitle(named) : "phase"} phase" group on ${page.url()}; the form shows the phases ${shown.map(phaseTitle).join(", ") || "none"}`);
    }
    lastTeamPhase = word;
    return { word, group };
  }

  // The people an input names, by account name as the choosers show them.
  async function teamNames(input: unknown): Promise<string[]> {
    const people = (value: unknown): unknown[] => {
      if (value === undefined || value === null) return [];
      if (Array.isArray(value)) return value.flatMap(people);
      if (typeof value !== "object") return textOf(value) ? [value] : [];
      const inner = given(value, MEMBER_KEYS.filter((key) => key !== "name"));
      if (inner !== undefined && inner !== null) return people(inner);
      return [value];
    };
    const names: string[] = [];
    for (const one of people(input)) {
      const name = await personName(one);
      if (name) names.push(name);
    }
    return names;
  }

  async function onPhase(group: Locator, name: string): Promise<boolean> {
    return (await seen(group.getByRole("radio", { name: new RegExp(`^\\s*scrum master: ${escapeRx(name)},`, "i") })).count()) > 0;
  }

  async function tickScrumMaster(where: string, word: string, group: Locator, name: string): Promise<void> {
    const radio = seen(group.getByRole("radio", { name: new RegExp(`^\\s*scrum master: ${escapeRx(name)},`, "i") })).first();
    if (!(await radio.count())) {
      throw new Error(`${where} — "${name}" is not on the ${word} phase's team on ${page.url()}, so there is no "Scrum master: ${name}, ${word} phase" to choose`);
    }
    if (!(await radio.isChecked())) await radio.check({ force: true });
    await settle();
  }

  async function addPhaseMembers(where: string, input: unknown): Promise<void> {
    if (!(await ensureTeamOrganization())) {
      noteRefusal(`${where} — no organization is chosen on ${page.url()}, so no team member can be named`);
      return;
    }
    const { word, group } = await phaseGroupFor(where, input);
    const names = await teamNames(typeof input === "string" && phaseWord(input) ? undefined : input);
    if (!names.length) unbound(where, `the input ${JSON.stringify(input)} names nobody for the ${word} phase`);
    for (const name of names) {
      if (await onPhase(group, name)) continue;
      const opener = seen(group.getByRole("button", { name: new RegExp(`team member to add to the ${word} phase`, "i") })).first();
      if (!(await opener.count())) unbound(where, `the ${word} phase on ${page.url()} offers no "Team member to add to the ${word} phase" chooser`);
      const { picked, offered: listed } = await pickListed(opener, name);
      if (!picked) {
        noteRefusal(`${where} — the ${word} phase's chooser on ${page.url()} does not offer "${name}" (it offers: ${listed.join(", ") || "nobody"})`);
        continue;
      }
      const add = seen(group.getByRole("button", { name: new RegExp(`^\\s*add team member to the ${word} phase\\s*$`, "i") })).first();
      if (await isDisabled(add)) throw new Error(`${where} — "Add team member to the ${word} phase" is disabled on ${page.url()} with "${name}" chosen`);
      await add.click();
      await settle();
    }
    const flag = given(input, ["scrumMaster", "scrum_master", "isScrumMaster"]);
    if (flag !== undefined && flag !== null && typeof flag !== "object" && saysYes(flag) && names.length) {
      await tickScrumMaster(where, word, group, names[0]);
    }
  }

  async function setPhaseScrumMaster(where: string, input: unknown): Promise<void> {
    await ensureTeamOrganization();
    const { word, group } = await phaseGroupFor(where, input);
    const names = await teamNames(input);
    if (!names.length) unbound(where, `the input ${JSON.stringify(input)} names nobody to be the ${word} phase's scrum master`);
    await tickScrumMaster(where, word, group, names[0]);
  }

  async function setPhaseCost(where: string, input: unknown): Promise<void> {
    const { word, group } = await phaseGroupFor(where, input);
    const value =
      typeof input === "number" || (typeof input === "string" && !phaseWord(input))
        ? String(input)
        : field(input, "cost", "proposedCost", "proposed_cost", "amount", "price", "value");
    const box = seen(group.getByRole("textbox", { name: new RegExp(`^\\s*proposed cost for the ${word} phase`, "i") })).first();
    if (!(await box.count())) unbound(where, `the ${word} phase on ${page.url()} has no "Proposed cost for the ${word} phase" box`);
    await box.fill(value);
    await box.blur().catch(() => undefined);
    await settle();
  }

  // "Resource N: <service area>, <allocation>" groups, by number (from 1), order (from 0) or
  // service area, else the one last used, else the first.
  const resourceGroups = (): Locator => seen(proposalMain().getByRole("group", { name: /^\s*resource \d+:/i }));
  async function resourceGroupFor(where: string, input: unknown): Promise<{ at: number; group: Locator }> {
    const names = await resourceGroups().evaluateAll((groups) => groups.map((one) => (one as HTMLElement).innerText.split("\n")[0].trim()));
    let at = -1;
    const numbered = Number.parseInt(field(input, "resource", "resourceNumber", "number"), 10);
    const ordered = Number.parseInt(field(input, "order", "index", "resourceIndex", "position"), 10);
    const area = field(input, "serviceArea", "service_area", "area");
    if (Number.isFinite(numbered) && numbered > 0) at = numbered;
    else if (Number.isFinite(ordered) && ordered >= 0) at = ordered + 1;
    else if (area) {
      const words = squash(/^[A-Z_]+$/.test(area) ? area.replace(/_/g, " ") : area);
      const found = names.findIndex((one) => squash(one).includes(words));
      if (found >= 0) at = found + 1;
    }
    if (at < 0) at = lastTeamResource || 1;
    const group = seen(proposalMain().getByRole("group", { name: new RegExp(`^\\s*resource ${at}:`, "i") })).first();
    if (!(await group.count())) unbound(where, `no "Resource ${at}" group on ${page.url()}; the form shows ${names.join(" | ") || "no resource"}`);
    lastTeamResource = at;
    return { at, group };
  }

  async function fillHourlyRate(where: string, group: Locator, name: string, rate: string): Promise<void> {
    const boxes = seen(group.getByRole("textbox", { name: name ? new RegExp(`^\\s*hourly rate for ${escapeRx(name)}`, "i") : /^\s*hourly rate for/i }));
    if (!(await boxes.count())) unbound(where, `no "Hourly rate for ${name || "<member>"}" box in the resource on ${page.url()}${name ? "" : " (nobody is named on it yet)"}`);
    const box = name ? boxes.first() : boxes.last();
    await box.fill(rate);
    await box.blur().catch(() => undefined);
    await settle();
  }

  async function addResourceMember(where: string, input: unknown): Promise<void> {
    if (!(await ensureTeamOrganization())) {
      noteRefusal(`${where} — no organization is chosen on ${page.url()}, so no team member can be named`);
      return;
    }
    const { at, group } = await resourceGroupFor(where, input);
    const names = await teamNames(input);
    if (!names.length) unbound(where, `the input ${JSON.stringify(input)} names nobody for resource ${at}`);
    const rate = field(input, "hourlyRate", "hourly_rate", "rate");
    for (const name of names) {
      const already = await seen(group.getByRole("textbox", { name: new RegExp(`^\\s*hourly rate for ${escapeRx(name)}`, "i") })).count();
      if (!already) {
        const opener = seen(group.getByRole("button", { name: new RegExp(`team member to add to resource ${at}`, "i") })).first();
        if (!(await opener.count())) unbound(where, `resource ${at} on ${page.url()} offers no "Team member to add to resource ${at}" chooser`);
        const { picked, offered: listed } = await pickListed(opener, name);
        if (!picked) {
          noteRefusal(`${where} — the chooser for resource ${at} on ${page.url()} does not offer "${name}" (it offers: ${listed.join(", ") || "nobody"})`);
          continue;
        }
        const add = seen(group.getByRole("button", { name: new RegExp(`^\\s*add team member to resource ${at}\\s*$`, "i") })).first();
        if (await isDisabled(add)) throw new Error(`${where} — "Add team member to resource ${at}" is disabled on ${page.url()} with "${name}" chosen`);
        await add.click();
        await settle();
      }
      if (rate) await fillHourlyRate(where, group, name, rate);
    }
  }

  async function setResourceRate(where: string, input: unknown): Promise<void> {
    const { group } = await resourceGroupFor(where, input);
    const rate =
      typeof input === "number" || typeof input === "string"
        ? String(input)
        : field(input, "hourlyRate", "hourly_rate", "rate", "value", "amount");
    const names = await teamNames(given(input, MEMBER_KEYS.filter((key) => key !== "name")));
    await fillHourlyRate(where, group, names[0] ?? "", rate);
  }

  // "Response to question N (required)", N by number (from 1) or order (from 0), else 1.
  async function answerTeamQuestion(where: string, input: unknown, place?: number): Promise<void> {
    const numbered = Number.parseInt(field(input, "question", "questionNumber", "number"), 10);
    const ordered = Number.parseInt(field(input, "order", "index", "position"), 10);
    const at = place ?? (Number.isFinite(numbered) && numbered > 0 ? numbered : Number.isFinite(ordered) && ordered >= 0 ? ordered + 1 : 1);
    const text = typeof input === "string" || typeof input === "number" ? String(input) : field(input, "response", "answer", "text", "body", "value", "content");
    const box = seen(proposalMain().getByRole("textbox", { name: new RegExp(`^\\s*response to question ${at}\\b`, "i") })).first();
    if (!(await box.count())) unbound(where, `no "Response to question ${at}" box on ${page.url()}; it offers ${await offered()}`);
    await box.fill(text);
    await box.blur().catch(() => undefined);
  }

  // Each reference goes under "Reference N" (N its number, its order plus one, or its place in
  // the list), "Add a reference" making room for it; Name, Email address and Phone number are
  // the boxes each one has. A key with no box is reported, never dropped.
  async function addTeamReferences(where: string, input: unknown): Promise<void> {
    const region = seen(proposalMain().getByRole("region", { name: /^\s*references\s*$/i })).first();
    if (!(await region.count())) unbound(where, `no "References" section on ${page.url()}; it offers ${await offered()}`);
    const boxes: [RegExp, string[]][] = [
      [/^\s*name\b/i, ["name", "fullName", "full_name", "referenceName"]],
      [/^\s*email\b/i, ["email", "emailAddress", "email_address"]],
      [/^\s*phone\b/i, ["phone", "phoneNumber", "phone_number", "telephone"]],
    ];
    const known = new Set(["order", "index", "position", "number", ...boxes.flatMap(([, keys]) => keys)].map(squash));
    const list = Array.isArray(input) ? input : [input];
    for (const [place, reference] of list.entries()) {
      for (const key of Object.keys(record(reference))) {
        if (!known.has(squash(key))) unbound(where, `no box on "Reference N" takes "${key}" (each reference has Name, Email address and Phone number (optional)) on ${page.url()}; walked as the organization-owner vendor on the seeded open Sprint With Us opportunity's create form (pressing "Add a reference") and on the seeded Sprint With Us proposals' edit forms, and neither the form nor a saved proposal's References section holds a company, employer or organization for a reference`);
      }
      const numbered = Number.parseInt(field(reference, "number"), 10);
      const ordered = Number.parseInt(field(reference, "order", "index", "position"), 10);
      const at = Number.isFinite(numbered) && numbered > 0 ? numbered : Number.isFinite(ordered) && ordered >= 0 ? ordered + 1 : place + 1;
      const group = (): Locator => seen(region.getByRole("group", { name: new RegExp(`^\\s*reference ${at}\\s*$`, "i") })).first();
      for (let tries = 0; tries < at && !(await group().count()); tries++) {
        await press(where, /^\s*add a reference\s*$/i, region);
      }
      if (!(await group().count())) unbound(where, `"Add a reference" made no "Reference ${at}" on ${page.url()}`);
      for (const [label, keys] of boxes) {
        const value = given(reference, keys);
        if (value === undefined || value === null) continue;
        const box = seen(group().getByRole("textbox", { name: label })).first();
        await box.fill(textOf(value));
      }
    }
    await settle();
  }

  // Every value a test hands a save or a submit, entered before anything is pressed: the
  // organization first (it decides who may be named), then the team, costs, rates, answers,
  // references and files. A key nothing on the form takes is reported, never dropped.
  async function fillTeamProposal(where: string, program: "sprint" | "team", input: unknown): Promise<void> {
    if (input === undefined || input === null) return;
    if (typeof input !== "object" || Array.isArray(input)) unbound(where, `the input ${JSON.stringify(input)} names no field of the proposal form`);
    const entries = Object.entries(record(input)).filter(([, value]) => value !== undefined);
    const is = (key: string, names: string[]): boolean => names.map(squash).includes(squash(key));
    const org = entries.find(([key]) => is(key, PROPOSAL_ORG_KEYS));
    if (org) await chooseTeamOrganization(where, org[1]);
    for (const [key, value] of entries) {
      if (is(key, PROPOSAL_ORG_KEYS) || is(key, PROPOSAL_FILE_DETAIL)) continue;
      if (is(key, PROPOSAL_FILE_KEYS)) {
        if (!Array.isArray(value) && typeof value !== "object") await addAttachmentFile(where, input);
        else for (const one of [value].flat()) await addAttachmentFile(where, one);
      } else if (is(key, ["team", "teamMembers", "members", "phases", "resources"])) {
        for (const one of [value].flat()) {
          if (program === "sprint") await addPhaseMembers(where, one);
          else await addResourceMember(where, one);
        }
      } else if (program === "sprint" && is(key, ["scrumMaster"])) {
        await setPhaseScrumMaster(where, value);
      } else if (program === "sprint" && is(key, ["cost", "proposedCost", "costs", "phaseCosts"])) {
        if (value && typeof value === "object" && !Array.isArray(value) && !given(value, ["cost", "proposedCost"])) {
          for (const [phase, cost] of Object.entries(record(value))) await setPhaseCost(where, { phase, cost });
        } else for (const one of [value].flat()) await setPhaseCost(where, one);
      } else if (program === "team" && is(key, ["hourlyRate", "rate", "rates"])) {
        for (const one of [value].flat()) await setResourceRate(where, one);
      } else if (is(key, ["answers", "responses", "questions", "teamQuestions", "resourceQuestions", "questionResponses"])) {
        const list = [value].flat();
        for (let i = 0; i < list.length; i++) {
          const one = list[i];
          const placed = one && typeof one === "object" && (given(one, ["question", "questionNumber", "number", "order", "index", "position"]) !== undefined);
          await answerTeamQuestion(where, one, placed ? undefined : i + 1);
        }
      } else if (is(key, ["references", "reference"])) {
        await addTeamReferences(where, value);
      } else {
        unbound(where, `no field on ${page.url()} takes "${key}"; it offers ${await offered()}`);
      }
    }
    await settle();
  }

  // A test hands a submit only the values its criterion is about; a question response left
  // empty is given something, so the form is refused only for what the test is about.
  async function completeTeamAnswers(): Promise<void> {
    const boxes = seen(proposalMain().getByRole("textbox", { name: /^\s*response to question \d+/i }));
    for (let i = 0; i < (await boxes.count()); i++) {
      const box = boxes.nth(i);
      if (!(await box.isEditable().catch(() => false))) continue;
      if ((await box.inputValue().catch(() => "x")).trim()) continue;
      await box.fill("Entered by the acceptance adapter so the proposal can be submitted.");
    }
    await settle();
  }

  // Why the form holds its submit back: each phase's "Incomplete: …", the messages against
  // its fields, the Capabilities and Cost notices, and its own "Submitting is available once …".
  async function heldBackReasons(): Promise<string[]> {
    const lines: string[] = [];
    for (const one of await paragraphs(proposalMain())) {
      const flat = one.replace(/\s+/g, " ").trim();
      if (/^incomplete:|^submitting is available once|does not hold every capability|exceeds the maximum budget|does not provide|is not qualified/i.test(flat)) lines.push(flat);
    }
    lines.push(...lined(await teamFieldErrors()));
    return [...new Set(lines)];
  }

  // The message of every field marked invalid — the last of what describes it, its hint coming
  // first — as "<field label>: <message>"; nothing when no field is.
  async function teamFieldErrors(): Promise<string> {
    const found = await proposalMain()
      .getByRole("textbox")
      .evaluateAll((boxes) =>
        boxes.map((element) => {
          if (element.getAttribute("aria-invalid") !== "true") return "";
          const ids = (element.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);
          const said = ids.length ? (document.getElementById(ids[ids.length - 1])?.innerText ?? "").trim() : "";
          return said;
        }),
      )
      .catch(() => [] as string[]);
    return [...new Set(found.filter(Boolean))].join("\n");
  }

  // The terms dialog open, with the terms agreed to ticked; false when the form held its
  // submit back or refused it (the reasons kept for the readers).
  async function openTeamTerms(where: string, submitName: RegExp, group: () => Locator): Promise<boolean> {
    if (await dialogShown(300)) return tickTeamTerms();
    if (!(await onProposal(where))) return false;
    const submit = seen(group().getByRole("button", { name: submitName })).first();
    if (!(await submit.count())) {
      noteRefusal(`${where} — ${page.url()} (Status: ${(await proposalTerm(/^status$/i)) || "not shown"}) offers no ${submitName}; its actions: ${(await proposalActionNames()) || "none"}`);
      return false;
    }
    // The contract has submit held back while a phase is incomplete or a cost over budget:
    // that is the form's answer, kept with its reasons for the readers, not something to wait
    // out.
    if (await isDisabled(submit)) {
      teamRefusal = { path: new URL(page.url()).pathname, lines: await heldBackReasons() };
      noteRefusal(`${where} — ${submitName} is disabled on ${page.url()}: ${teamRefusal.lines.join(" | ") || "the page gives no reason"}`);
      return false;
    }
    await submit.click();
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      if (await openDialog().count()) break;
      if ((await proposalAlertLines()).length) break;
      await page.waitForTimeout(200);
    }
    if (await dialogShown(500)) return tickTeamTerms();
    teamRefusal = { path: new URL(page.url()).pathname, lines: await proposalAlertLines() };
    noteRefusal(`${where} — the form on ${page.url()} refused to submit: ${teamRefusal.lines.join(" | ") || "it raised no terms dialog"}`);
    return false;
  }

  async function tickTeamTerms(): Promise<boolean> {
    const box = openDialog().first();
    for (const which of teamTermsAgreed) {
      const tick = seen(box.getByRole("checkbox", { name: which === "program" ? TEAM_PROGRAM_TERMS : APP_TERMS })).first();
      if ((await tick.count()) && !(await tick.isChecked())) await tick.check();
    }
    return true;
  }

  async function agreeToTeamTerms(where: string, which: "program" | "app", group: () => Locator): Promise<void> {
    teamTermsAgreed.add(which);
    if (!(await openTeamTerms(where, /^\s*submit proposal\s*$/i, group))) return;
    const tick = seen(openDialog().first().getByRole("checkbox", { name: which === "program" ? TEAM_PROGRAM_TERMS : APP_TERMS })).first();
    if (!(await tick.count())) {
      unbound(where, `the "Submit your proposal" dialog on ${page.url()} has no box accepting the ${which === "program" ? "program's" : "Digital Marketplace"} terms; it reads: ${(await openDialog().first().innerText()).replace(/\s+/g, " ")}`);
    }
    if (!(await tick.isChecked())) await tick.check();
    // Put away so the form behind it can be reached again; the submit reopens and reticks it.
    await closeDialog();
  }

  // A save or a submit lands on the proposal's own screen with its form closed, or stays
  // under an alert; either ends the wait.
  async function teamLanded(): Promise<void> {
    await settle();
    const deadline = Date.now() + 20000;
    while (Date.now() < deadline) {
      if (await seen(proposalMain().getByRole("alert")).count()) break;
      const path = new URL(page.url()).pathname;
      if (/\/proposals\/[0-9a-f-]{36}\/edit$/i.test(path) && !(await openDialog().count()) && (await proposalActions().count()) && !(await saveChoices().count())) break;
      if (/^\/dashboard$/.test(path)) break;
      await page.waitForTimeout(250);
    }
    await ready();
  }

  async function confirmTeamSubmit(where: string): Promise<void> {
    const box = openDialog().first();
    const confirm = seen(box.getByRole("button", { name: /^\s*submit( proposal)?\s*$/i })).first();
    if (!(await confirm.count())) unbound(where, `the "Submit your proposal" dialog on ${page.url()} offers no "Submit proposal"`);
    if (await isDisabled(confirm)) {
      throw new Error(`${where} — "Submit proposal" in the terms dialog is disabled on ${page.url()}; the terms were not all accepted (${(await seen(box.getByRole("checkbox")).count())} boxes, ${[...teamTermsAgreed].join(", ") || "none"} agreed)`);
    }
    await confirm.click();
    await openDialog().first().waitFor({ state: "hidden", timeout: 15000 }).catch(() => undefined);
    await teamLanded();
    teamTermsAgreed.clear();
  }

  async function teamSaveDraft(where: string, program: "sprint" | "team", input: unknown): Promise<void> {
    await closeDialog();
    if (!(await openTeamFields(where))) return;
    await fillTeamProposal(where, program, input);
    const save = seen(proposalMain().getByRole("button", { name: /^\s*save draft\s*$/i })).first();
    if (!(await save.count())) {
      noteRefusal(`${where} — ${page.url()} offers no "Save draft" (its actions: ${(await proposalActionNames()) || "none"})`);
      return;
    }
    if (await isDisabled(save)) throw new Error(`${where} — "Save draft" is disabled on ${page.url()}`);
    await save.click();
    await teamLanded();
  }

  async function teamCreateSubmit(where: string, program: "sprint" | "team", input: unknown): Promise<void> {
    await closeDialog();
    teamRefusal = null;
    if (!(await openTeamFields(where))) return;
    await fillTeamProposal(where, program, input);
    await completeTeamAnswers();
    if (!(await openTeamTerms(where, /^\s*submit proposal\s*$/i, proposalActions))) return;
    await confirmTeamSubmit(where);
  }

  // The create form's readings.
  async function teamFormMessages(): Promise<string> {
    if (!(await proposalShown())) return "";
    if (await openDialog().count()) return lined(await openDialog().first().innerText()).filter((line) => /tick|accept/i.test(line) && !/^\s*i accept/i.test(line)).join("\n");
    const found = [...(await proposalAlertLines()), ...lined(await teamFieldErrors())];
    if (teamRefusal && teamRefusal.path === new URL(page.url()).pathname) for (const line of teamRefusal.lines) if (!found.includes(line)) found.push(line);
    return [...new Set(found)].join("\n");
  }

  // Notes on the Organization section saying the chosen organization is not qualified, each
  // as its lines; nothing when it is qualified or none is chosen.
  async function unqualifiedNotice(): Promise<string> {
    if (!(await proposalShown())) return "";
    const notes = seen(proposalMain().getByRole("note")).filter({ hasText: /not qualified/i });
    const lines: string[] = [];
    for (let i = 0; i < (await notes.count()); i++) lines.push(...lined(await notes.nth(i).innerText()));
    return lines.join("\n");
  }

  async function capabilityGap(): Promise<string> {
    if (!(await proposalShown())) return "";
    const region = seen(proposalMain().getByRole("region", { name: /^\s*capabilities\s*$/i })).first();
    const lines = (await region.count()) ? lined(await region.innerText()).filter((line) => /\bdoes not (yet )?hold\b/i.test(line)) : [];
    for (const line of (await teamFormMessages()).split("\n")) if (line && /capabilit/i.test(line) && !lines.includes(line)) lines.push(line);
    return lines.join("\n");
  }

  async function budgetExceeded(): Promise<string> {
    if (!(await proposalShown())) return "";
    const lines: string[] = [];
    for (const line of [...(await costErrorLines()).map((one) => one.replace(/^[^:]+:\s*/, "")), ...(await teamFormMessages()).split("\n")]) {
      if (line && /budget|exceed/i.test(line) && !lines.includes(line)) lines.push(line);
    }
    return lines.join("\n");
  }

  // "<Phase>: <message>" for each phase cost marked invalid, "total: <message>" for the Cost
  // section's own notice; nothing when every cost is within its budget.
  async function costErrorLines(): Promise<string[]> {
    const found: string[] = [];
    for (const word of await phasesShown()) {
      const box = seen(proposalMain().getByRole("textbox", { name: new RegExp(`^\\s*proposed cost for the ${word} phase`, "i") })).first();
      if (!(await box.count())) continue;
      const said = await box
        .evaluate((element) => {
          if (element.getAttribute("aria-invalid") !== "true") return "";
          const ids = (element.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);
          return ids.length > 1 ? (document.getElementById(ids[ids.length - 1])?.innerText ?? "").trim() : "";
        })
        .catch(() => "");
      if (said) found.push(`${phaseTitle(word)}: ${said}`);
    }
    const region = seen(proposalMain().getByRole("region", { name: /^\s*cost\s*$/i })).first();
    if (await region.count()) {
      for (const line of lined(await region.innerText())) {
        if (/^cost$|^total proposed cost:|^each hourly rate|^estimated cost/i.test(line)) continue;
        found.push(`total: ${line}`);
      }
    }
    return found;
  }

  // The people a chooser offers, one per line by name alone ("Quinn Placeholder (pending)" read
  // as "Quinn Placeholder"); the list is put away without choosing anybody. With no
  // organization chosen there is nobody to offer.
  async function choicesOffered(opener: Locator): Promise<string> {
    await opener.click();
    const options = seen(page.getByRole("option"));
    await options.first().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    const names = (await options.allInnerTexts().catch(() => [] as string[])).map((one) => one.replace(/\s*\(pending\)\s*$/i, "").trim()).filter(Boolean);
    await page.keyboard.press("Escape").catch(() => undefined);
    await settle();
    return names.join("\n");
  }

  async function swuMemberChoices(where: string): Promise<string> {
    if (!(await proposalShown())) return "";
    if (!(await ensureTeamOrganization())) return "";
    const { word, group } = await phaseGroupFor(where, undefined);
    const opener = seen(group.getByRole("button", { name: new RegExp(`team member to add to the ${word} phase`, "i") })).first();
    if (!(await opener.count())) unbound(where, `the ${word} phase on ${page.url()} offers no "Team member to add to the ${word} phase" chooser`);
    return choicesOffered(opener);
  }

  async function twuMemberChoices(where: string): Promise<string> {
    if (!(await proposalShown())) return "";
    if (!(await ensureTeamOrganization())) return "";
    const { at, group } = await resourceGroupFor(where, undefined);
    const opener = seen(group.getByRole("button", { name: new RegExp(`team member to add to resource ${at}`, "i") })).first();
    if (!(await opener.count())) unbound(where, `resource ${at} on ${page.url()} offers no "Team member to add to resource ${at}" chooser`);
    return choicesOffered(opener);
  }

  // "<name> — Pending" for each member named on a phase whose membership is still pending.
  async function pendingMembers(): Promise<string> {
    if (!(await proposalShown())) return "";
    const items = seen(proposalMain().getByRole("radiogroup", { name: /^\s*scrum master for the/i }).getByRole("listitem"));
    const found: string[] = [];
    for (const words of await items.allInnerTexts()) {
      const lines = lined(words);
      if (!lines.some((line) => /^membership pending$/i.test(line))) continue;
      const entry = `${lines[0]} — Pending`;
      if (!found.includes(entry)) found.push(entry);
    }
    return found.join("\n");
  }

  async function phaseSections(): Promise<string> {
    if (!(await proposalShown())) return "";
    return (await phasesShown()).map(phaseTitle).join("\n");
  }

  // "<Phase> | complete|incomplete | <required capabilities the team does not hold>".
  async function phaseRequirementLines(): Promise<string> {
    if (!(await proposalShown())) return "";
    const lines: string[] = [];
    for (const word of await phasesShown()) {
      const group = seen(proposalMain().getByRole("group", { name: new RegExp(`^\\s*${word} phase\\s*$`, "i") })).first();
      const incomplete = (await paragraphs(group)).some((one) => /^\s*incomplete:/i.test(one));
      const items = await seen(group.getByRole("list", { name: /^\s*capabilities the .* phase requires/i }).getByRole("listitem")).allInnerTexts();
      const missing = items.map((one) => one.trim()).filter((one) => /:\s*not held$/i.test(one)).map((one) => one.replace(/:\s*not held$/i, "").trim());
      lines.push(`${phaseTitle(word)} | ${incomplete ? "incomplete" : "complete"} | ${missing.join(", ")}`);
    }
    return lines.join("\n");
  }

  // The proposal's own screen.
  async function teamEditSave(where: string, program: "sprint" | "team", input: unknown): Promise<void> {
    if (!(await openTeamFields(where))) return;
    await fillTeamProposal(where, program, input);
    const save = seen(saveChoices().getByRole("button", { name: /^\s*save changes\s*$/i })).first();
    if (!(await save.count())) unbound(where, `no "Save changes" among the save choices on ${page.url()}; it offers ${await offered()}`);
    if (await isDisabled(save)) throw new Error(`${where} — "Save changes" is disabled on ${page.url()}: ${(await heldBackReasons()).join(" | ") || "the page gives no reason"}`);
    await save.click();
    await teamLanded();
  }

  async function teamEditSaveAndSubmit(where: string, program: "sprint" | "team", input: unknown): Promise<void> {
    teamRefusal = null;
    if (!(await openTeamFields(where))) return;
    await fillTeamProposal(where, program, input);
    teamTermsAgreed.add("program");
    teamTermsAgreed.add("app");
    if (!(await openTeamTerms(where, /^\s*save changes and submit\s*$/i, saveChoices))) return;
    await confirmTeamSubmit(where);
  }

  async function teamEditSubmit(where: string): Promise<void> {
    teamRefusal = null;
    if (!(await onProposal(where))) return;
    await closeDialog();
    teamTermsAgreed.add("program");
    teamTermsAgreed.add("app");
    const group = (await teamFieldsOpen()) ? saveChoices : proposalActions;
    const name = (await teamFieldsOpen()) ? /^\s*save changes and submit\s*$/i : /^\s*submit proposal\s*$/i;
    if (!(await openTeamTerms(where, name, group))) return;
    await confirmTeamSubmit(where);
  }

  // What the screen reports when a submission from it was refused: the alert it raises
  // ("Your proposal was not submitted" over the service's reason), or the reasons the form gave
  // for holding its submit back. Nothing when the submission went through.
  async function teamSubmissionRefusal(): Promise<string> {
    if (!(await proposalShown())) return "";
    const lines: string[] = [];
    const alerts = seen(proposalMain().getByRole("alert")).filter({ hasText: /not submitted|problem|could not|cannot|unable/i });
    for (let i = 0; i < (await alerts.count()); i++) lines.push(...lined(await alerts.nth(i).innerText()));
    if (teamRefusal && teamRefusal.path === new URL(page.url()).pathname) for (const line of teamRefusal.lines) if (!lines.includes(line)) lines.push(line);
    return lines.join("\n");
  }

  // The messages against the form after a save was refused: the alert "Your changes were not
  // saved" with the service's reason, and every field marked invalid. Nothing once the save
  // went through (the form closes).
  async function teamEditFieldErrors(): Promise<string> {
    if (!(await proposalShown())) return "";
    const lines: string[] = [];
    const alerts = seen(proposalMain().getByRole("alert")).filter({ hasText: /not saved|problem/i });
    for (let i = 0; i < (await alerts.count()); i++) lines.push(...lined(await alerts.nth(i).innerText()));
    lines.push(...lined(await teamFieldErrors()));
    return [...new Set(lines)].join("\n");
  }

  // The organization the proposal names: the chooser's choice while the form is open, else the
  // "Organization" part of the Proposal section.
  async function teamOrganization(): Promise<string> {
    if (!(await proposalShown())) return "";
    if (await teamFieldsOpen()) {
      const shown = (await teamOrgChooser().innerText()).trim();
      return /^select an item$/i.test(shown) ? "" : shown;
    }
    const region = seen(proposalMain().getByRole("region", { name: /^\s*organization\s*$/i })).first();
    if (!(await region.count())) return "";
    return (await paragraphs(region))[0]?.trim() ?? "";
  }

  // The "Proposal" section's text, with what each box holds while the form is open.
  async function teamProposalTab(where: string): Promise<string> {
    if (!(await proposalShown())) return "";
    const link = seen(proposalMain().getByRole("navigation", { name: /proposal sections/i }).getByRole("link", { name: /^\s*proposal\s*$/i })).first();
    if ((await link.count()) && /tab=(?!proposal)/.test(new URL(page.url()).search)) {
      await link.click();
      await ready();
    }
    const region = seen(proposalMain().getByRole("region", { name: /^\s*proposal\s*$/i })).first();
    if (!(await region.count())) unbound(where, `no "Proposal" section on ${page.url()}; it offers ${await offered()}`);
    const lines = lined(await region.innerText());
    const boxes = seen(region.getByRole("textbox"));
    for (let i = 0; i < (await boxes.count()); i++) {
      const value = (await boxes.nth(i).inputValue().catch(() => "")).trim();
      if (value && !lines.includes(value)) lines.push(value);
    }
    return lines.join("\n");
  }

  // A vendor's proposal screen carries the sections "Proposal" and "History" only: walked as
  // the organization owner on the seeded awarded Sprint With Us proposal, the seeded Team With
  // Us proposal under review at the challenge, the seeded closed Team With Us proposal and a
  // fresh draft, none has a "Scoresheet" section.
  async function teamScoresheet(where: string): Promise<string> {
    if (!(await proposalShown())) return "";
    const link = seen(proposalMain().getByRole("navigation", { name: /proposal sections/i }).getByRole("link", { name: /scoresheet|scores?/i })).first();
    if (!(await link.count())) {
      const sections = (await seen(proposalMain().getByRole("navigation", { name: /proposal sections/i }).getByRole("link")).allInnerTexts()).map((one) => `"${one.trim()}"`).join(", ");
      unbound(where, `the proposal's screen at ${page.url()} offers ${actingId()} only the sections ${sections || "none"}; walked as the organization owner on the seeded awarded Sprint With Us proposal (00000000-0000-4000-a020-000000000101), the seeded Team With Us proposal under review at the challenge (00000000-0000-4000-a035-000000000101), the seeded closed Team With Us proposal and a fresh draft, and none has a "Scoresheet" section`);
    }
    await link.click();
    await ready();
    const region = seen(proposalMain().getByRole("region", { name: /scoresheet|scores?/i })).first();
    return (await region.count()) ? lined(await region.innerText()).join("\n") : "";
  }

  function teamEditPage(id: string, route: string, program: "sprint" | "team") {
    return {
      open: (params: unknown) => openTeamProposal(route, params),
      startEditing: async () => {
        await openTeamFields(`${id}.start_editing`);
      },
      chooseOrganization: async (input?: unknown) => {
        const where = `${id}.choose_organization`;
        if (!(await openTeamFields(where))) return;
        await chooseTeamOrganization(where, input);
      },
      saveChanges: (input?: unknown) => teamEditSave(`${id}.save_changes`, program, input),
      saveChangesAndSubmit: (input?: unknown) => teamEditSaveAndSubmit(`${id}.save_changes_and_submit`, program, input),
      submitProposal: () => teamEditSubmit(`${id}.submit_proposal`),
      withdrawProposal: async () => {
        await proposalAction(`${id}.withdraw_proposal`, /^\s*withdraw\s*$/i, /^\s*withdraw( proposal)?\s*$/i);
      },
      deleteProposal: async () => {
        await proposalAction(`${id}.delete_proposal`, /^\s*delete\s*$/i, /^\s*delete( proposal)?\s*$/i);
      },
      submissionRefusal: () => teamSubmissionRefusal(),
      fieldError: () => teamEditFieldErrors(),
      organization: () => teamOrganization(),
      proposalIdentifier: async () => ((await proposalShown()) ? (await proposalTerm(/^proposal id$/i)) || proposalPathId() : ""),
      opportunityIdentifier: async () => ((await proposalShown()) ? (await proposalTerm(/^opportunity id$/i)) || opportunityPathId() : ""),
      proposalTab: () => teamProposalTab(`${id}.proposal_tab`),
      scoresheetTab: () => teamScoresheet(`${id}.scoresheet_tab`),
      status: () => proposalTerm(/^status$/i),
      // The vendor's screen shows no anonymous name, score or rank in any state walked (draft,
      // submitted, under review, awarded); none shown reads as nothing.
      anonymousProponentName: () => proposalTerm(/^(anonymous name|anonymi[sz]ed name|proponent)$/i),
      totalScore: () => proposalTerm(/^(total )?score$/i),
      rank: () => proposalTerm(/^rank(ing)?$/i),
    };
  }

  // Each team action opens the form ("Edit" on the proposal's screen) first.
  const onTeamForm =
    (where: string, run: (input: unknown) => Promise<void>) =>
    async (input?: unknown): Promise<void> => {
      await closeDialog();
      if (!(await openTeamFields(where))) return;
      await run(input);
    };

  const proposalSwuCreate: S.ProposalSwuCreatePage = {
    open: (params) => openTeamProposal("/opportunities/sprint-with-us/:opportunityId/proposals/create", params),
    chooseOrganization: onTeamForm(`${PSWU_CREATE}.choose_organization`, (input) => chooseTeamOrganization(`${PSWU_CREATE}.choose_organization`, input)),
    addPhaseTeamMember: onTeamForm(`${PSWU_CREATE}.add_phase_team_member`, (input) => addPhaseMembers(`${PSWU_CREATE}.add_phase_team_member`, input)),
    setScrumMaster: onTeamForm(`${PSWU_CREATE}.set_scrum_master`, (input) => setPhaseScrumMaster(`${PSWU_CREATE}.set_scrum_master`, input)),
    setPhaseProposedCost: onTeamForm(`${PSWU_CREATE}.set_phase_proposed_cost`, (input) => setPhaseCost(`${PSWU_CREATE}.set_phase_proposed_cost`, input)),
    answerTeamQuestion: onTeamForm(`${PSWU_CREATE}.answer_team_question`, (input) => answerTeamQuestion(`${PSWU_CREATE}.answer_team_question`, input)),
    addReference: onTeamForm(`${PSWU_CREATE}.add_reference`, (input) => addTeamReferences(`${PSWU_CREATE}.add_reference`, input)),
    addAttachment: onTeamForm(`${PSWU_CREATE}.add_attachment`, (input) => addAttachmentFile(`${PSWU_CREATE}.add_attachment`, input)),
    saveDraft: (input) => teamSaveDraft(`${PSWU_CREATE}.save_draft`, "sprint", input),
    submitProposal: (input) => teamCreateSubmit(`${PSWU_CREATE}.submit_proposal`, "sprint", input),
    acceptProgramTerms: onTeamForm(`${PSWU_CREATE}.accept_program_terms`, (input) => fillTeamProposal(`${PSWU_CREATE}.accept_program_terms`, "sprint", input).then(() => completeTeamAnswers()).then(() => agreeToTeamTerms(`${PSWU_CREATE}.accept_program_terms`, "program", proposalActions))),
    acceptAppTerms: onTeamForm(`${PSWU_CREATE}.accept_app_terms`, (input) => fillTeamProposal(`${PSWU_CREATE}.accept_app_terms`, "sprint", input).then(() => completeTeamAnswers()).then(() => agreeToTeamTerms(`${PSWU_CREATE}.accept_app_terms`, "app", proposalActions))),
    fieldError: () => teamFormMessages(),
    capabilityGapError: () => capabilityGap(),
    budgetExceededError: () => budgetExceeded(),
    unqualifiedOrganizationNotice: () => unqualifiedNotice(),
    pendingTeamMember: () => pendingMembers(),
    teamMemberChoices: () => swuMemberChoices(`${PSWU_CREATE}.team_member_choices`),
    phaseTeamSections: () => phaseSections(),
    phaseRequirements: () => phaseRequirementLines(),
    costErrors: async () => ((await proposalShown()) ? (await costErrorLines()).join("\n") : ""),
  };

  const proposalSwuEdit: S.ProposalSwuEditPage = {
    ...teamEditPage(PSWU_EDIT, "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/edit", "sprint"),
    addPhaseTeamMember: onTeamForm(`${PSWU_EDIT}.add_phase_team_member`, (input) => addPhaseMembers(`${PSWU_EDIT}.add_phase_team_member`, input)),
    setScrumMaster: onTeamForm(`${PSWU_EDIT}.set_scrum_master`, (input) => setPhaseScrumMaster(`${PSWU_EDIT}.set_scrum_master`, input)),
  };

  const proposalTwuCreate: S.ProposalTwuCreatePage = {
    open: (params) => openTeamProposal("/opportunities/team-with-us/:opportunityId/proposals/create", params),
    chooseOrganization: onTeamForm(`${PTWU_CREATE}.choose_organization`, (input) => chooseTeamOrganization(`${PTWU_CREATE}.choose_organization`, input)),
    addTeamMemberForResource: onTeamForm(`${PTWU_CREATE}.add_team_member_for_resource`, (input) => addResourceMember(`${PTWU_CREATE}.add_team_member_for_resource`, input)),
    setHourlyRate: onTeamForm(`${PTWU_CREATE}.set_hourly_rate`, (input) => setResourceRate(`${PTWU_CREATE}.set_hourly_rate`, input)),
    answerResourceQuestion: onTeamForm(`${PTWU_CREATE}.answer_resource_question`, (input) => answerTeamQuestion(`${PTWU_CREATE}.answer_resource_question`, input)),
    addAttachment: onTeamForm(`${PTWU_CREATE}.add_attachment`, (input) => addAttachmentFile(`${PTWU_CREATE}.add_attachment`, input)),
    saveDraft: (input) => teamSaveDraft(`${PTWU_CREATE}.save_draft`, "team", input),
    submitProposal: (input) => teamCreateSubmit(`${PTWU_CREATE}.submit_proposal`, "team", input),
    acceptProgramTerms: onTeamForm(`${PTWU_CREATE}.accept_program_terms`, (input) => fillTeamProposal(`${PTWU_CREATE}.accept_program_terms`, "team", input).then(() => completeTeamAnswers()).then(() => agreeToTeamTerms(`${PTWU_CREATE}.accept_program_terms`, "program", proposalActions))),
    acceptAppTerms: onTeamForm(`${PTWU_CREATE}.accept_app_terms`, (input) => fillTeamProposal(`${PTWU_CREATE}.accept_app_terms`, "team", input).then(() => completeTeamAnswers()).then(() => agreeToTeamTerms(`${PTWU_CREATE}.accept_app_terms`, "app", proposalActions))),
    fieldError: () => teamFormMessages(),
    // "<name> does not provide <service area>, which this opportunity needs." under the
    // chosen organization, and any refusal naming a service area.
    serviceAreaError: async () => {
      if (!(await proposalShown())) return "";
      const lines = (await paragraphs(proposalMain())).map((one) => one.replace(/\s+/g, " ").trim()).filter((one) => /\bdoes not provide\b/i.test(one));
      for (const line of (await teamFormMessages()).split("\n")) if (line && /service area/i.test(line) && !lines.includes(line)) lines.push(line);
      return lines.join("\n");
    },
    unqualifiedOrganizationNotice: () => unqualifiedNotice(),
    teamMemberChoices: () => twuMemberChoices(`${PTWU_CREATE}.team_member_choices`),
  };

  const proposalTwuEdit: S.ProposalTwuEditPage = {
    ...teamEditPage(PTWU_EDIT, "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/edit", "team"),
    addTeamMemberForResource: onTeamForm(`${PTWU_EDIT}.add_team_member_for_resource`, (input) => addResourceMember(`${PTWU_EDIT}.add_team_member_for_resource`, input)),
    // "Edit" opens the create screen's form: each "Resource N: …" group carries an "Hourly
    // rate for <member>" box holding the rate the proposal was saved with ("$120" on the
    // seeded closed Team With Us proposal), which this replaces.
    setHourlyRate: onTeamForm(`${PTWU_EDIT}.set_hourly_rate`, (input) => setResourceRate(`${PTWU_EDIT}.set_hourly_rate`, input)),
  };

  const surface: S.Surface = {
    signIn,
    signOut,

    home,

    opportunityDashboard,

    opportunityList,

    opportunityProgramSelect,

    opportunityCwuCreate,

    opportunityCwuView,

    opportunityCwuEdit,

    opportunityCwuComplete: absent<S.OpportunityCwuCompletePage>(
      "opportunity-cwu-complete",
      "/opportunities/code-with-us/:opportunityId/complete",
      behindSession("/opportunities/code-with-us/:opportunityId/complete"),
      ["full_report"],
    ),

    opportunitySwuCreate,

    opportunitySwuView: opportunityView<S.OpportunitySwuViewPage>(
      SWU_VIEW,
      "/opportunities/sprint-with-us/:opportunityId",
      "sprint-with-us",
      {
        // "$500,000" over "Value"; the phases under "Phases of Work" on the Details tab, down
        // to the note closing their required capabilities.
        totalMaxBudget: () => figureAbove(`${SWU_VIEW}.total_max_budget`, /^value$/i),
        phases: () => detailsSection(`${SWU_VIEW}.phases`, /^phases of work$/i, /^\* capabilities are claimed/i),
        assignmentDate: () => figureAbove(`${SWU_VIEW}.assignment_date`, /^assignment date$/i),
        scopeSection: () => sectionBehind(`${SWU_VIEW}.scope_section`, "Scope & Contract", ["Scope"]),
        pageMessages: () => pageNotices(`${SWU_VIEW}.page_messages`),
        successfulProponentContactDetails: () =>
          awardDetail(`${SWU_VIEW}.successful_proponent_contact_details`, CONTACT_DETAIL),
        successfulProponentScore: () => awardDetail(`${SWU_VIEW}.successful_proponent_score`, SCORE_DETAIL),
      },
    ),

    opportunitySwuEdit,

    opportunitySwuComplete: absent<S.OpportunitySwuCompletePage>(
      "opportunity-swu-complete",
      "/opportunities/sprint-with-us/:opportunityId/complete",
      behindSession("/opportunities/sprint-with-us/:opportunityId/complete"),
      ["full_report"],
    ),

    opportunityTwuCreate,

    opportunityTwuView: opportunityView<S.OpportunityTwuViewPage>(
      TWU_VIEW,
      "/opportunities/team-with-us/:opportunityId",
      "team-with-us",
      {
        // "$300,000" given under the "Maximum budget" term; an older layout drew it over
        // "Maximum Contract Value". The resources sought under "Service Areas" with their
        // allocation, down to "Required Skills".
        maxBudget: async () => {
          await opportunityLines(`${TWU_VIEW}.max_budget`);
          return (await definitionOf(/^maximum budget$/i)) || figureAbove(`${TWU_VIEW}.max_budget`, /^maximum contract value$/i);
        },
        resources: () => detailsSection(`${TWU_VIEW}.resources`, /^service areas$/i, /^required skills$/i),
        assignmentDate: () => figureAbove(`${TWU_VIEW}.assignment_date`, /^contract award date$/i),
        startDate: () => figureAbove(`${TWU_VIEW}.start_date`, /^contract start date$/i),
        // The header shows no completion date; the "Key Dates" section does.
        completionDate: () => keyDate(`${TWU_VIEW}.completion_date`, /^contract completion date( \(anticipated\))?/i),
        termsSection: () => sectionBehind(`${TWU_VIEW}.terms_section`, "Competition Rules", ["Terms and conditions"]),
        successfulProponentContactDetails: () =>
          awardDetail(`${TWU_VIEW}.successful_proponent_contact_details`, CONTACT_DETAIL),
        successfulProponentScore: () => awardDetail(`${TWU_VIEW}.successful_proponent_score`, SCORE_DETAIL),
      },
    ),

    opportunityTwuEdit,

    opportunityTwuComplete: absent<S.OpportunityTwuCompletePage>(
      "opportunity-twu-complete",
      "/opportunities/team-with-us/:opportunityId/complete",
      behindSession("/opportunities/team-with-us/:opportunityId/complete"),
      ["full_report"],
    ),

    scheduledTransitionTrigger,

    proposalCwuCreate,

    proposalCwuEdit,

    proposalCwuView,

    proposalCwuExportOne: absent<S.ProposalCwuExportOnePage>(
      "proposal-cwu-export-one",
      "/opportunities/code-with-us/:opportunityId/proposals/:proposalId/export",
      behindSession("/opportunities/code-with-us/:opportunityId/proposals/:proposalId/export"),
      ["exported_proposal"],
    ),

    proposalCwuExportAll: absent<S.ProposalCwuExportAllPage>(
      "proposal-cwu-export-all",
      "/opportunities/code-with-us/:opportunityId/proposals/export",
      behindSession("/opportunities/code-with-us/:opportunityId/proposals/export"),
      ["exported_proposal"],
    ),

    proposalSwuCreate,

    proposalSwuEdit,

    proposalSwuView: proposalSwuViewBound,

    proposalSwuExportOne: absent<S.ProposalSwuExportOnePage>(
      "proposal-swu-export-one",
      "/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/export",
      behindSession("/opportunities/sprint-with-us/:opportunityId/proposals/:proposalId/export"),
      ["exported_proposal", "anonymous_proponent_name"],
    ),

    proposalSwuExportAll: absent<S.ProposalSwuExportAllPage>(
      "proposal-swu-export-all",
      "/opportunities/sprint-with-us/:opportunityId/proposals/export",
      behindSession("/opportunities/sprint-with-us/:opportunityId/proposals/export"),
      ["exported_proposal"],
    ),

    proposalTwuCreate,

    proposalTwuEdit,

    proposalTwuView: proposalTwuViewBound,

    proposalTwuExportOne: absent<S.ProposalTwuExportOnePage>(
      "proposal-twu-export-one",
      "/opportunities/team-with-us/:opportunityId/proposals/:proposalId/export",
      behindSession("/opportunities/team-with-us/:opportunityId/proposals/:proposalId/export"),
      ["exported_proposal"],
    ),

    proposalTwuExportAll: absent<S.ProposalTwuExportAllPage>(
      "proposal-twu-export-all",
      "/opportunities/team-with-us/:opportunityId/proposals/export",
      behindSession("/opportunities/team-with-us/:opportunityId/proposals/export"),
      ["exported_proposal"],
    ),

    proposalVendorDashboard,

    proposalListStub,

    organizationList,

    organizationCreate,

    organizationEdit,

    organizationSwuTerms: orgTermsScreen(
      "organization-swu-terms",
      "/organizations/:orgId/sprint-with-us-terms-and-conditions",
    ) as S.OrganizationSwuTermsPage,

    organizationTwuTerms: orgTermsScreen(
      "organization-twu-terms",
      "/organizations/:orgId/team-with-us-terms-and-conditions",
    ) as S.OrganizationTwuTermsPage,

    organizationUserMemberships: membershipScreen(
      "organization-user-memberships",
      "/users/:userId?tab=organizations",
    ) as S.OrganizationUserMembershipsPage,

    userSignIn,

    userSignUpChooseAccount,

    userSignUpComplete,

    userSignOut,

    userNotice,

    userList: userListScreen,

    userProfile,

    userProfileCapabilities,

    userProfileNotifications: noticesScreen("user-profile-notifications", "/users/:userId?tab=notifications") as S.UserProfileNotificationsPage,

    userProfileLegal: legalScreen("user-profile-legal", "/users/:userId?tab=legal") as S.UserProfileLegalPage,

    userProfileSelf,

    userProfileSelfCapabilities,

    userProfileSelfNotifications,

    userProfileSelfLegal: legalScreen("user-profile-self-legal", "/users/me?tab=legal") as S.UserProfileSelfLegalPage,

    organizationUserMembershipsSelf: membershipScreen(
      "organization-user-memberships-self",
      "/users/me?tab=organizations",
    ) as S.OrganizationUserMembershipsSelfPage,

    // Walked on the current build as the public sector employee who sits on the seeded
    // panels: /dashboard is "Dashboard", "Create an opportunity" and the one section "My
    // opportunities" (the table "Opportunities you created": Title, each a link | Program |
    // Status | Last updated), drawn without being asked for. Nothing on it is about the
    // panels one sits on.
    evaluationPanelDashboard: {
      ...absent<S.EvaluationPanelDashboardPage>(
        "evaluation-panel-dashboard",
        "/dashboard",
        'walked on the current build signed in as the public sector employee who sits on the seeded Sprint With Us and Team With Us panels, /dashboard draws "Dashboard", the link "Create an opportunity" and one section, "My opportunities" (the table "Opportunities you created": Title | Program | Status | Last updated) — no "Evaluations" tab, section, table or message for the panels one sits on; the administrator\'s dashboard lists every opportunity instead, and a vendor\'s lists proposals',
        [
          "show_panel_opportunities",
          "evaluations_tab",
          "panel_opportunities_table",
          "opportunity_status",
          "empty_panel_opportunities_message",
        ],
      ),
      open: () => dash.open(),
      // The section is always drawn; showing it is bringing it into view.
      showMyOpportunities: async () => {
        await dash.on("show_my_opportunities");
        const region = seen(page.getByRole("main").getByRole("heading", { name: /^\s*(my|all) opportunities\s*$/i })).first();
        if (!(await region.count())) {
          unbound("evaluation-panel-dashboard.show_my_opportunities", `/dashboard at ${page.url()} draws no "My opportunities" section for ${actingId()}; it offers ${await offered()}`);
        }
        await region.scrollIntoViewIfNeeded().catch(() => undefined);
      },
      openOpportunity: (input: unknown) => opportunityDashboard.openOpportunity(input as never),
    } as unknown as S.EvaluationPanelDashboardPage,

    evaluationPanelSwu: evaluationPanelPage<S.EvaluationPanelSwuPage>(
      "evaluation-panel-swu",
      "/opportunities/sprint-with-us/:opportunityId/edit?tab=evaluationPanel",
    ),

    evaluationPanelTwu: evaluationPanelPage<S.EvaluationPanelTwuPage>(
      "evaluation-panel-twu",
      "/opportunities/team-with-us/:opportunityId/edit?tab=evaluationPanel",
    ),

    evaluationInstructionsSwu: absent<S.EvaluationInstructionsSwuPage>(
      "evaluation-instructions-swu",
      "/opportunities/sprint-with-us/:opportunityId/edit?tab=instructions",
      sectionMissing("sprint-with-us", "instructions"),
      ["instructions_body", "visible_to_evaluators_only"],
    ),

    evaluationInstructionsTwu: absent<S.EvaluationInstructionsTwuPage>(
      "evaluation-instructions-twu",
      "/opportunities/team-with-us/:opportunityId/edit?tab=instructions",
      sectionMissing("team-with-us", "instructions"),
      ["instructions_body", "visible_to_evaluators_only"],
    ),

    evaluationIndividualListSwu: absent<S.EvaluationIndividualListSwuPage>(
      "evaluation-individual-list-swu",
      "/opportunities/sprint-with-us/:opportunityId/edit?tab=evaluation",
      sectionMissing("sprint-with-us", "evaluation"),
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
      sectionMissing("team-with-us", "evaluation"),
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
      sectionMissing("sprint-with-us", "consensus"),
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
      sectionMissing("team-with-us", "consensus"),
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
      behindSession(
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
      behindSession(
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
      behindSession(
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
      behindSession(
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

    notificationUnsubscribeLanding: unsubscribeLanding(),

    notificationOptinOpportunityList: optinList,

    notificationTermsBroadcast: termsBroadcast,

    // The service answers this address itself, and is no screen: signed in as the
    // administrator it answers 404 {"errors":["Cannot GET /admin/email-notification-reference"]},
    // and /api/email-notification-reference and /api/admin/email-notification-reference are
    // 404 too. The refusal reader reads whatever refusal the address gives a non-administrator.
    notificationEmailReference: absent<S.NotificationEmailReferencePage>(
      "notification-email-reference",
      "/admin/email-notification-reference",
      `signed in as the administrator (test-admin) and opened /admin/email-notification-reference: the service answers it 404 {"errors":["Cannot GET /admin/email-notification-reference"]} rather than drawing a screen, the same addresses under /api answer 404 "not found", and no link on the administrator's dashboard or profile leads to an email reference; ${NOBODY_SIGNS_IN}`,
      ["open_reference", "message_group_title", "message_subject", "message_summary", "message_body"],
      ["refused_for_non_administrator"],
    ),

    contentFooter,
    contentServiceLevelAgreementLink,

    contentList,
    contentCreate,
    contentEdit,
    contentView,

    fileUpload,
    fileDescription,
    fileDownload,

    fileAttachmentControl,

    fileImagePicker,

    fileEmbeddedImage,

    caughtMessage,
    caughtMessageList,
    mailDeliveryFault,
    mailDeliveryDelay,
    opportunityWatchRequest,
    organizationActingForList,
    affiliationInvitationRequest,
    affiliationApprovalRequest,
    affiliationRemovalRequest,
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
    opportunityCounters,
    opportunityHistoryRequest,
    opportunityStatusRequest,
    organizationRequest,
  };

  return surface;
}
